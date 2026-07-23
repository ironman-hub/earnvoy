const prisma = require("../config/prisma");

async function logEvent({ actorId = null, action, targetType, targetId = null, metadata = null, ipAddress = null }) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, targetType, targetId, metadata, ipAddress },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

module.exports = { logEvent };
