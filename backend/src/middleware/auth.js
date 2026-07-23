const jwt = require("jsonwebtoken");
const config = require("../config");
const prisma = require("../config/prisma");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Not authenticated." });

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || user.isDeleted) return res.status(401).json({ error: "Account no longer exists." });
    if (user.isSuspended) return res.status(403).json({ error: "This account has been suspended." });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && !user.isDeleted && !user.isSuspended) req.user = user;
    next();
  } catch {
    next();
  }
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
