const express = require("express");

const {
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all notifications
router.get(
  "/notifications",
  protect,
  getNotifications
);

// Get unread notifications
router.get(
  "/notifications/unread",
  protect,
  getUnreadNotifications
);

// Mark one notification as read
router.put(
  "/notifications/:id/read",
  protect,
  markNotificationAsRead
);

router.patch(
  "/notifications/:id/read",
  protect,
  markNotificationAsRead
);

// Mark all notifications as read
router.put(
  "/notifications/read-all",
  protect,
  markAllNotificationsAsRead
);

router.post(
  "/notifications/read-all",
  protect,
  markAllNotificationsAsRead
);

// Delete one notification
router.delete(
  "/notifications/:id",
  protect,
  deleteNotification
);

// Delete all notifications
router.delete(
  "/notifications",
  protect,
  deleteAllNotifications
);

module.exports = router;