const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  sender = null,
  type = "general",
  message,
  project = null,
  task = null,
  comment = null,
}) => {
  try {
    if (!recipient || !message) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      project,
      task,
      comment,
    });

    return notification;
  } catch (error) {
    console.error(
      "Notification Error:",
      error.message
    );

    return null;
  }
};

module.exports = createNotification;