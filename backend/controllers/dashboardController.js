const Project = require("../models/Project");
const Task = require("../models/Task");
const Activity = require("../models/Activity");

// GET DASHBOARD STATISTICS
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get projects where user is owner or member
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { "members.user": userId },
      ],
    }).select("_id name status");

    const projectIds = projects.map(
      (project) => project._id
    );

    // Get all tasks belonging to user's projects
    const tasks = await Task.find({
      project: {
        $in: projectIds,
      },
    }).select(
      "title status priority dueDate assignee project"
    );

    // PROJECT STATISTICS
    const projectStats = {
      total: projects.length,

      planning: projects.filter(
        (project) =>
          project.status === "planning"
      ).length,

      active: projects.filter(
        (project) =>
          project.status === "active"
      ).length,

      completed: projects.filter(
        (project) =>
          project.status === "completed"
      ).length,

      archived: projects.filter(
        (project) =>
          project.status === "archived"
      ).length,
    };

    // TASK STATISTICS
    const taskStats = {
      total: tasks.length,

      todo: tasks.filter(
        (task) =>
          task.status === "todo"
      ).length,

      inProgress: tasks.filter(
        (task) =>
          task.status === "in-progress"
      ).length,

      review: tasks.filter(
        (task) =>
          task.status === "review"
      ).length,

      completed: tasks.filter(
        (task) =>
          task.status === "completed"
      ).length,
    };

    // PRIORITY STATISTICS
    const priorityStats = {
      low: tasks.filter(
        (task) =>
          task.priority === "low"
      ).length,

      medium: tasks.filter(
        (task) =>
          task.priority === "medium"
      ).length,

      high: tasks.filter(
        (task) =>
          task.priority === "high"
      ).length,

      critical: tasks.filter(
        (task) =>
          task.priority === "critical"
      ).length,
    };

    // TASKS ASSIGNED TO CURRENT USER
    const myTasks = tasks.filter(
      (task) =>
        task.assignee &&
        task.assignee.toString() ===
          userId.toString()
    );

    const myTaskStats = {
      total: myTasks.length,

      todo: myTasks.filter(
        (task) =>
          task.status === "todo"
      ).length,

      inProgress: myTasks.filter(
        (task) =>
          task.status === "in-progress"
      ).length,

      review: myTasks.filter(
        (task) =>
          task.status === "review"
      ).length,

      completed: myTasks.filter(
        (task) =>
          task.status === "completed"
      ).length,
    };

    // CURRENT TIME
    const now = new Date();

    // OVERDUE TASKS
    const overdueTasks = tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "completed"
    );

    // UPCOMING TASKS
    const upcomingTasks = tasks
      .filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) >= now &&
          task.status !== "completed"
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate) -
          new Date(b.dueDate)
      )
      .slice(0, 10);

    // RECENT ACTIVITY
    const recentActivity =
      await Activity.find({
        project: {
          $in: projectIds,
        },
      })
        .populate(
          "user",
          "name email avatar"
        )
        .populate(
          "project",
          "name"
        )
        .populate(
          "task",
          "title"
        )
        .sort({
          createdAt: -1,
        })
        .limit(10);

    res.json({
      projects: projectStats,

      tasks: taskStats,

      priorities: priorityStats,

      myTasks: myTaskStats,

      overdueTasks: {
        count: overdueTasks.length,
        tasks: overdueTasks,
      },

      upcomingTasks: {
        count: upcomingTasks.length,
        tasks: upcomingTasks,
      },

      recentActivity,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET MY TASKS
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignee: req.user._id,
    })
      .populate(
        "project",
        "name status"
      )
      .populate(
        "creator",
        "name email"
      )
      .sort({
        dueDate: 1,
      });

    res.json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET RECENT ACTIVITY
const getRecentActivity = async (
  req,
  res
) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        {
          "members.user":
            req.user._id,
        },
      ],
    }).select("_id");

    const projectIds = projects.map(
      (project) => project._id
    );

    const activities =
      await Activity.find({
        project: {
          $in: projectIds,
        },
      })
        .populate(
          "user",
          "name email avatar"
        )
        .populate(
          "project",
          "name"
        )
        .populate(
          "task",
          "title"
        )
        .sort({
          createdAt: -1,
        })
        .limit(20);

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

module.exports = {
  getDashboardStats,
  getMyTasks,
  getRecentActivity,
};