const prisma = require("../config/prisma");
const { logEvent } = require("../services/auditService");

async function fileReport(req, res, next) {
  try {
    const { targetUserId, listingId, reason, details } = req.body;
    if (!reason) return res.status(400).json({ error: "A reason is required." });

    const report = await prisma.report.create({
      data: { reporterId: req.user.id, targetUserId, listingId, reason, details },
    });

    await logEvent({
      actorId: req.user.id,
      action: "REPORT_FILED",
      targetType: "Report",
      targetId: report.id,
      metadata: { targetUserId, listingId, reason },
    });

    res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
}

module.exports = { fileReport };
