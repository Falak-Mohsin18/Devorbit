const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Task");

// =====================================================
// HELPER: CHECK PROJECT ACCESS
// =====================================================

const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    return {
      project: null,
      hasAccess: false,
    };
  }

  const isOwner =
    project.owner.toString() === userId.toString();

  const isMember = project.members.some(
    (member) =>
      member.user.toString() === userId.toString()
  );

  return {
    project,
    hasAccess: isOwner || isMember,
  };
};


// =====================================================
// GET PROJECT ACTIVITY
// GET /api/projects/:projectId/activity
// =====================================================

const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;

    const { project, hasAccess } =
      await checkProjectAccess(
        projectId,
        req.user._id
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (!hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this project",
      });
    }

    const activities = await Activity.find({
      project: projectId,
    })
      .populate("user", "name email avatar")
      .populate("task", "title status priority")
      .sort({ createdAt: -1 });

    res.json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// GET TASK ACTIVITY
// GET /api/tasks/:taskId/activity
// =====================================================

const getTaskActivity = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner.toString() ===
      req.user._id.toString();

    const isMember = project.members.some(
      (member) =>
        member.user.toString() ===
        req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        message:
          "You do not have access to this task",
      });
    }

    const activities = await Activity.find({
      task: taskId,
    })
      .populate("user", "name email avatar")
      .populate("task", "title status priority")
      .sort({ createdAt: -1 });

    res.json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// =====================================================
// GET GLOBAL ACTIVITY FEED
// GET /api/activity
// =====================================================

const getActivityFeed = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id },
      ],
    }).select("_id");
    const projectIds = projects.map((p) => p._id);

    const activities = await Activity.find({
      $or: [
        { project: { $in: projectIds } },
        { user: req.user._id }
      ]
    })
      .populate("user", "name email avatar")
      .populate("project", "name")
      .populate("task", "title status priority")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      count: activities.length,
      activities: activities.map((a) => ({
        id: a._id.toString(),
        _id: a._id.toString(),
        actor: a.user?.name || "Developer",
        actorAvatar: a.user?.name ? a.user.name.charAt(0).toUpperCase() : "D",
        action: a.message || a.type,
        target: a.task?.title || a.project?.name || "DevOrbit",
        targetType: a.task ? "task" : "project",
        project: a.project?.name || "DevOrbit",
        projectId: a.project?._id?.toString() || "",
        timestamp: "Just now",
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================================================
// LOG ACTIVITY EVENT
// POST /api/activity
// =====================================================

const logActivity = async (req, res) => {
  try {
    const { action, target, targetType, projectName, projectId } = req.body;
    const mongoose = require("mongoose");
    let pid = projectId;
    if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
      const proj = await Project.findOne();
      pid = proj?._id;
    }
    if (pid) {
      await Activity.create({
        user: req.user._id,
        project: pid,
        type: "project-updated",
        message: `${req.user.name} ${action || "performed action"} on ${target || "workspace"}`,
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
};

module.exports = {
  getProjectActivity,
  getTaskActivity,
  getActivityFeed,
  logActivity,
};