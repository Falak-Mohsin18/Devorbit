const express = require("express");

const {
  getDashboardStats,
  getMyTasks,
  getRecentActivity,
} = require("../controllers/dashboardController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Dashboard statistics
router.get(
  "/stats",
  protect,
  getDashboardStats
);

// Tasks assigned to logged-in user
router.get(
  "/my-tasks",
  protect,
  getMyTasks
);

// Recent project activity
router.get(
  "/recent-activity",
  protect,
  getRecentActivity
);

module.exports = router;