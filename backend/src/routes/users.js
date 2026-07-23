const express = require("express");
const { requireAuth } = require("../middleware/auth");
const prisma = require("../config/prisma");
const config = require("../config");
const { logEvent } = require("../services/auditService");

const router = express.Router();

router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { isDeleted: true, deletedAt: new Date() } });
    await logEvent({ actorId: req.user.id, action: "USER_SELF_DELETED", targetType: "User", targetId: req.user.id });
    res.json({ message: "Your account has been deleted." });
  } catch (err) {
    next(err);
  }
});

router.post("/accept-terms", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { termsAcceptedAt: new Date(), termsVersion: config.termsVersion },
    });
    res.json({ termsAcceptedAt: user.termsAcceptedAt, termsVersion: user.termsVersion });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
