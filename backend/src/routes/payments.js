const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/paymentsController");

const router = express.Router();

router.post("/listing-fee", requireAuth, ctrl.startListingFeePayment);
router.post("/unlock", requireAuth, ctrl.startUnlockPayment);
router.post("/paynow/webhook", ctrl.paynowWebhook);
router.get("/:id/confirm", requireAuth, ctrl.confirmPayment);
router.get("/", requireAuth, ctrl.myPayments);
router.get("/:id/receipt", requireAuth, ctrl.downloadReceipt);

module.exports = router;
