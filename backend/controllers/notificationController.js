const Notification = require("../models/Notification");

// =====================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// =====================================================

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "name email avatar")
      .populate("project", "name")
      .populate("task", "title status priority")
      .populate("comment", "message")
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// GET UNREAD NOTIFICATIONS
// GET /api/notifications/unread
// =====================================================

const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      isRead: false,
    })
      .populate("sender", "name email avatar")
      .populate("project", "name")
      .populate("task", "title status priority")
      .populate("comment", "message")
      .sort({ createdAt: -1 });

    res.json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// MARK ONE AS READ
// PUT /api/notifications/:id/read
// =====================================================

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    // Only recipient can modify notification
    if (
      notification.recipient.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You cannot modify this notification",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// MARK ALL AS READ
// PUT /api/notifications/read-all
// =====================================================

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// =====================================================

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (
      notification.recipient.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You cannot delete this notification",
      });
    }

    await Notification.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// DELETE ALL MY NOTIFICATIONS
// DELETE /api/notifications
// =====================================================

const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
    });

    res.json({
      message: "All notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
};