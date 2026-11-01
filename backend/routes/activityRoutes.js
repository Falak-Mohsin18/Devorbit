const express = require("express");

const {
  getProjectActivity,
  getTaskActivity,
  getActivityFeed,
  logActivity,
} = require("../controllers/activityController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Global activity feed
router.get(
  "/activity",
  protect,
  getActivityFeed
);

router.post(
  "/activity",
  protect,
  logActivity
);

// Get project activity
router.get(
  "/projects/:projectId/activity",
  protect,
  getProjectActivity
);

// Get task activity
router.get(
  "/tasks/:taskId/activity",
  protect,
  getTaskActivity
);

module.exports = router;