const Activity = require("../models/Activity");

const createActivity = async ({
  userId,
  projectId,
  taskId = null,
  type,
  message,
  metadata = {},
}) => {
  try {
    if (!userId || !projectId || !type || !message) {
      return null;
    }

    const activity = await Activity.create({
      user: userId,
      project: projectId,
      task: taskId,
      type,
      message,
      metadata,
    });

    return activity;
  } catch (error) {
    // Activity logging should never break the main request
    console.error("Activity Log Error:", error.message);

    return null;
  }
};

module.exports = createActivity;