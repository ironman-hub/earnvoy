const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/authController");

const router = express.Router();

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/verify-email", ctrl.verifyEmail);
router.post("/verify-phone", requireAuth, ctrl.verifyPhone);
router.post("/resend-phone-otp", requireAuth, ctrl.resendPhoneOtp);
router.post("/change-password", requireAuth, ctrl.changePassword);
router.post("/request-password-reset", ctrl.requestPasswordReset);
router.post("/reset-password", ctrl.resetPassword);
router.get("/me", requireAuth, ctrl.me);

module.exports = router;
