const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const ctrl = require("../controllers/adminController");

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/analytics", ctrl.getAnalytics);

router.get("/users", ctrl.listUsers);
router.get("/users/:id", ctrl.getUser);
router.patch("/users/:id", ctrl.updateUser);
router.delete("/users/:id", ctrl.deleteUser);

router.get("/listings", ctrl.listAllListings);
router.delete("/listings/:id", ctrl.removeListing);

router.get("/reports", ctrl.listReports);
router.patch("/reports/:id", ctrl.resolveReport);

router.get("/audit-logs", ctrl.getAuditLogs);

module.exports = router;
