const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/reportsController");

const router = express.Router();
router.post("/", requireAuth, ctrl.fileReport);

module.exports = router;
