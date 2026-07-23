const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const config = require("../config");
const { registerSchema, loginSchema } = require("../utils/validators");
const { randomToken } = require("../utils/tokens");
const emailService = require("../services/emailService");
const smsService = require("../services/smsService");
const { logEvent } = require("../services/auditService");

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// fullName is deliberately excluded from the public-facing shape - only ever
// returned to the account owner themselves via /auth/me, never to other users.
function publicUser(user) {
  const { passwordHash, emailVerifyToken, phoneOtpHash, passwordResetToken, ...safe } = user;
  return safe;
}

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }, { phone: data.phone }] },
    });
    if (existing) {
      return res.status(409).json({ error: "An account with that email, username, or phone already exists." });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const emailVerifyToken = randomToken();
    const phoneOtp = smsService.generateOtp();
    const phoneOtpHash = await smsService.hashOtp(phoneOtp);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        phone: data.phone,
        passwordHash,
        emailVerifyToken,
        emailVerifyExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        phoneOtpHash,
        phoneOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        termsAcceptedAt: new Date(),
        termsVersion: config.termsVersion,
      },
    });

    await emailService.sendVerificationEmail(user, emailVerifyToken);
    await smsService.sendOtpSms(user.phone, phoneOtp);
    await logEvent({ actorId: user.id, action: "USER_REGISTERED", targetType: "User", targetId: user.id, ipAddress: req.ip });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: data.emailOrUsername }, { username: data.emailOrUsername }] },
    });
    if (!user || user.isDeleted) return res.status(401).json({ error: "Incorrect email/username or password." });
    if (user.isSuspended) return res.status(403).json({ error: "This account has been suspended." });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect email/username or password." });

    await logEvent({ actorId: user.id, action: "USER_LOGIN", targetType: "User", targetId: user.id, ipAddress: req.ip });

    // Role (USER vs ADMIN) is resolved purely from the account record - the
    // login form itself is identical for everyone.
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user || !user.emailVerifyExpiry || user.emailVerifyExpiry < new Date()) {
      return res.status(400).json({ error: "This verification link is invalid or has expired." });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
        isVerifiedBadge: user.phoneVerified,
      },
    });

    await logEvent({ actorId: user.id, action: "EMAIL_VERIFIED", targetType: "User", targetId: user.id });
    res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
}

async function verifyPhone(req, res, next) {
  try {
    const { otp } = req.body;
    const user = req.user;
    if (!user.phoneOtpHash || !user.phoneOtpExpiry || user.phoneOtpExpiry < new Date()) {
      return res.status(400).json({ error: "This code has expired. Request a new one." });
    }
    const valid = await smsService.verifyOtp(otp, user.phoneOtpHash);
    if (!valid) return res.status(400).json({ error: "Incorrect code." });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneOtpHash: null,
        phoneOtpExpiry: null,
        isVerifiedBadge: user.emailVerified,
      },
    });

    await logEvent({ actorId: user.id, action: "PHONE_VERIFIED", targetType: "User", targetId: user.id });
    res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
}

async function resendPhoneOtp(req, res, next) {
  try {
    const otp = smsService.generateOtp();
    const phoneOtpHash = await smsService.hashOtp(otp);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { phoneOtpHash, phoneOtpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
    });
    await smsService.sendOtpSms(req.user.phone, otp);
    res.json({ message: "A new code has been sent." });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect." });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    await logEvent({ actorId: req.user.id, action: "PASSWORD_CHANGED", targetType: "User", targetId: req.user.id });
    res.json({ message: "Password updated." });
  } catch (err) {
    next(err);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000) },
      });
      await emailService.sendPasswordResetEmail(user, token);
    }
    // Same response either way, so we don't reveal which emails are registered.
    res.json({ message: "If that email is registered, a reset link has been sent to it." });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
    });
    await logEvent({ actorId: user.id, action: "PASSWORD_RESET", targetType: "User", targetId: user.id });
    res.json({ message: "Password reset. You can now log in." });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = {
  register, login, verifyEmail, verifyPhone, resendPhoneOtp,
  changePassword, requestPasswordReset, resetPassword, me, publicUser,
};
