const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Project = require("../models/Project");

const createActivity = require("../utils/activityLogger");
const createNotification = require("../utils/notificationLogger");

// CHECK TASK ACCESS
const checkTaskAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    return {
      task: null,
      project: null,
      hasAccess: false,
    };
  }

  const project = await Project.findById(task.project);

  if (!project) {
    return {
      task,
      project: null,
      hasAccess: false,
    };
  }

  const isOwner =
    project.owner.toString() ===
    userId.toString();

  const isMember = project.members.some(
    (member) =>
      member.user &&
      member.user.toString() ===
        userId.toString()
  );

  return {
    task,
    project,
    hasAccess: isOwner || isMember,
  };
};

// CREATE COMMENT
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Comment message is required",
      });
    }

    const {
      task,
      project,
      hasAccess,
    } = await checkTaskAccess(
      taskId,
      req.user._id
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this task",
      });
    }

    const comment = await Comment.create({
      message: message.trim(),
      task: taskId,
      user: req.user._id,
    });

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      taskId: task._id,
      type: "comment-added",
      message: `${req.user.name} commented on the task "${task.title}"`,
      metadata: {
        commentId: comment._id,
      },
    });

    // Notify task creator
    if (
      task.creator &&
      task.creator.toString() !==
        req.user._id.toString()
    ) {
      await createNotification({
        recipient: task.creator,
        sender: req.user._id,
        type: "comment-added",
        message: `${req.user.name} commented on the task "${task.title}"`,
        project: project._id,
        task: task._id,
        comment: comment._id,
      });
    }

    // Notify task assignee if different from creator
    // and different from the person commenting
    if (
      task.assignee &&
      task.assignee.toString() !==
        req.user._id.toString() &&
      (!task.creator ||
        task.assignee.toString() !==
          task.creator.toString())
    ) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        type: "comment-added",
        message: `${req.user.name} commented on the task "${task.title}"`,
        project: project._id,
        task: task._id,
        comment: comment._id,
      });
    }

    const populatedComment =
      await Comment.findById(
        comment._id
      ).populate(
        "user",
        "name email avatar"
      );

    res.status(201).json({
      message:
        "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET TASK COMMENTS
const getTaskComments = async (
  req,
  res
) => {
  try {
    const { taskId } = req.params;

    const {
      task,
      project,
      hasAccess,
    } = await checkTaskAccess(
      taskId,
      req.user._id
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this task",
      });
    }

    const comments =
      await Comment.find({
        task: taskId,
      })
        .populate(
          "user",
          "name email avatar"
        )
        .sort({ createdAt: -1 });

    res.json({
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// UPDATE COMMENT
const updateComment = async (
  req,
  res
) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Comment message is required",
      });
    }

    const comment =
      await Comment.findById(
        req.params.id
      );

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const {
      task,
      project,
      hasAccess,
    } = await checkTaskAccess(
      comment.task,
      req.user._id
    );

    if (!task || !project) {
      return res.status(404).json({
        message:
          "Associated task or project not found",
      });
    }

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this comment",
      });
    }

    if (
      comment.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the comment author can edit this comment",
      });
    }

    comment.message = message.trim();

    await comment.save();

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      taskId: task._id,
      type: "comment-updated",
      message: `${req.user.name} updated a comment on the task "${task.title}"`,
      metadata: {
        commentId: comment._id,
      },
    });

    const updatedComment =
      await Comment.findById(
        comment._id
      ).populate(
        "user",
        "name email avatar"
      );

    res.json({
      message:
        "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// DELETE COMMENT
const deleteComment = async (
  req,
  res
) => {
  try {
    const comment =
      await Comment.findById(
        req.params.id
      );

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const {
      task,
      project,
      hasAccess,
    } = await checkTaskAccess(
      comment.task,
      req.user._id
    );

    if (!task || !project) {
      return res.status(404).json({
        message:
          "Associated task or project not found",
      });
    }

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this comment",
      });
    }

    const isAuthor =
      comment.user.toString() ===
      req.user._id.toString();

    const isProjectOwner =
      project.owner.toString() ===
      req.user._id.toString();

    if (!isAuthor && !isProjectOwner) {
      return res.status(403).json({
        message:
          "Only the comment author or project owner can delete this comment",
      });
    }

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      taskId: task._id,
      type: "comment-deleted",
      message: `${req.user.name} deleted a comment from the task "${task.title}"`,
      metadata: {
        commentId: comment._id,
      },
    });

    await Comment.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
};