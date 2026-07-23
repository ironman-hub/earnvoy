const express = require("express");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const paymentsCtrl = require("../controllers/paymentsController");
const ctrl = require("../controllers/listingsController");

const router = express.Router();

router.get("/feed", ctrl.getFeed);
router.get("/mine", requireAuth, ctrl.getMyListings);
router.get("/:id", optionalAuth, ctrl.getListingById);
router.post("/", requireAuth, ctrl.createListing);
router.post("/:id/decide", requireAuth, ctrl.decideMatch);

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (body && body.pendingUnlockIdsToRefund && body.pendingUnlockIdsToRefund.length) {
        await paymentsCtrl.processAutoRefunds(body.pendingUnlockIdsToRefund);
      }
      return originalJson(body);
    };
    await ctrl.deleteListing(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
