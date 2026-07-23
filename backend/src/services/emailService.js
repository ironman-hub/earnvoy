const nodemailer = require("nodemailer");
const config = require("../config");

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

async function sendMail({ to, subject, html, attachments = [] }) {
  if (!config.smtp.host || config.smtp.host.includes("your-")) {
    console.warn(`[emailService] SMTP not configured. Would have sent "${subject}" to ${to}`);
    return { skipped: true };
  }
  return transporter.sendMail({ from: config.smtp.from, to, subject, html, attachments });
}

async function sendVerificationEmail(user, token) {
  const link = `${config.frontendUrl}/verify-email?token=${token}`;
  return sendMail({
    to: user.email,
    subject: "Verify your earnvoy email",
    html: `
      <p>Hi ${user.username},</p>
      <p>Confirm this is your email address to get your earnvoy verified badge and start posting.</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>This link expires in 24 hours. If you didn't create an earnvoy account, you can ignore this email.</p>
    `,
  });
}

async function sendPasswordResetEmail(user, token) {
  const link = `${config.frontendUrl}/reset-password?token=${token}`;
  return sendMail({
    to: user.email,
    subject: "Reset your earnvoy password",
    html: `
      <p>Hi ${user.username},</p>
      <p>We received a request to reset your password. This link expires in 1 hour.</p>
      <p><a href="${link}">Reset my password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

async function sendReceiptEmail(user, payment, pdfBuffer) {
  return sendMail({
    to: user.email,
    subject: `Your earnvoy receipt #${payment.receiptNumber}`,
    html: `
      <p>Hi ${user.username},</p>
      <p>Thanks for using earnvoy. Your payment of £${payment.amount.toFixed(2)} was successful.</p>
      <p>Receipt number: <strong>${payment.receiptNumber}</strong></p>
      <p>A copy is attached, and it's always available in your earnvoy account under Payments.</p>
    `,
    attachments: [
      { filename: `earnvoy-receipt-${payment.receiptNumber}.pdf`, content: pdfBuffer },
    ],
  });
}

module.exports = { sendMail, sendVerificationEmail, sendPasswordResetEmail, sendReceiptEmail };
