const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  initPlatformFeePayment,
  verifyPlatformFeePayment,
  getPlatformFeeHistory,
  getAdminPlatformFeeDeliveries,
  confirmPlatformFeeDelivery,
  getPlatformFeeConfig,
  updatePlatformFeeConfig,
} = require("../controllers/platformFeeController");

// Public route for Chapa callback
router.post("/chapa/callback", verifyPlatformFeePayment);

// Protected routes
router.post("/init", protect, initPlatformFeePayment);
router.get("/history", protect, getPlatformFeeHistory);
router.get("/config", protect, getPlatformFeeConfig);
router.put(
  "/admin/config",
  protect,
  authorize("admin"),
  updatePlatformFeeConfig,
);
router.get(
  "/admin/deliveries",
  protect,
  authorize("admin"),
  getAdminPlatformFeeDeliveries,
);
router.post(
  "/admin/deliveries/:paymentId/confirm",
  protect,
  authorize("admin"),
  confirmPlatformFeeDelivery,
);

module.exports = router;
