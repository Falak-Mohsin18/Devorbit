const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

const createActivity = require("../utils/activityLogger");
const createNotification = require("../utils/notificationLogger");

// ============================================================
// CHECK PROJECT ACCESS
// ============================================================

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
      member.user &&
      member.user.toString() === userId.toString()
  );

  return {
    project,
    hasAccess: isOwner || isMember,
  };
};

// ============================================================
// CREATE TASK
// ============================================================

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;

    const {
      title,
      description,
      assignee,
      status,
      priority,
      dueDate,
      tags,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

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

    if (assignee) {
      const isOwner =
        project.owner.toString() ===
        assignee.toString();

      const isMember = project.members.some(
        (member) =>
          member.user &&
          member.user.toString() ===
            assignee.toString()
      );

      if (!isOwner && !isMember) {
        return res.status(400).json({
          message:
            "Assignee must be a member of the project",
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      creator: req.user._id,
      assignee: assignee || null,
      status,
      priority,
      dueDate,
      tags,
    });

    await createActivity({
      userId: req.user._id,
      projectId,
      taskId: task._id,
      type: "task-created",
      message: `${req.user.name} created the task "${task.title}"`,
    });

    if (assignee) {
      const assignedUser =
        await User.findById(assignee);

      if (assignedUser) {
        await createActivity({
          userId: req.user._id,
          projectId,
          taskId: task._id,
          type: "task-assigned",
          message: `${req.user.name} assigned "${task.title}" to ${assignedUser.name}`,
        });

        await createNotification({
          recipient: assignee,
          sender: req.user._id,
          type: "task-assigned",
          message: `${req.user.name} assigned you the task "${task.title}"`,
          project: projectId,
          task: task._id,
        });
      }
    }

    const populatedTask =
      await Task.findById(task._id)
        .populate("creator", "name email")
        .populate("assignee", "name email");

    res.status(201).json({
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ============================================================
// GET PROJECT TASKS
// ============================================================

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const {
      search,
      status,
      priority,
      assignee,
      sort = "newest",
    } = req.query;

    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit) || 10,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

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

    const query = {
      project: projectId,
    };

    // SEARCH
    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim(),
        "i"
      );

      query.$or = [
        {
          title: searchRegex,
        },
        {
          description: searchRegex,
        },
        {
          tags: searchRegex,
        },
      ];
    }

    // STATUS FILTER
    if (status) {
      const allowedStatuses = [
        "todo",
        "in-progress",
        "review",
        "completed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid task status",
        });
      }

      query.status = status;
    }

    // PRIORITY FILTER
    if (priority) {
      const allowedPriorities = [
        "low",
        "medium",
        "high",
        "critical",
      ];

      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          message: "Invalid task priority",
        });
      }

      query.priority = priority;
    }

    // ASSIGNEE FILTER
    if (assignee) {
      const isValidProjectMember =
        project.owner.toString() ===
          assignee.toString() ||
        project.members.some(
          (member) =>
            member.user &&
            member.user.toString() ===
              assignee.toString()
        );

      if (!isValidProjectMember) {
        return res.status(400).json({
          message:
            "Assignee is not a member of this project",
        });
      }

      query.assignee = assignee;
    }

    // SORT
    let sortOption = {
      createdAt: -1,
    };

    switch (sort) {
      case "oldest":
        sortOption = {
          createdAt: 1,
        };
        break;

      case "dueDate":
        sortOption = {
          dueDate: 1,
        };
        break;

      case "dueDate-desc":
        sortOption = {
          dueDate: -1,
        };
        break;

      case "priority":
        sortOption = {
          priority: -1,
        };
        break;

      case "title":
        sortOption = {
          title: 1,
        };
        break;

      case "title-desc":
        sortOption = {
          title: -1,
        };
        break;

      case "newest":
      default:
        sortOption = {
          createdAt: -1,
        };
        break;
    }

    const totalTasks =
      await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate("creator", "name email")
      .populate("assignee", "name email")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages =
      Math.ceil(totalTasks / limit);

    res.json({
      count: tasks.length,
      total: totalTasks,

      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      filters: {
        search: search || "",
        status: status || "all",
        priority: priority || "all",
        assignee: assignee || "all",
        sort,
      },

      tasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ============================================================
// GET SINGLE TASK
// ============================================================

const getTask = async (req, res) => {
  try {
    const task =
      await Task.findById(req.params.id)
        .populate("creator", "name email")
        .populate("assignee", "name email");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const { project, hasAccess } =
      await checkProjectAccess(
        task.project,
        req.user._id
      );

    if (!project || !hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this task",
      });
    }

    res.json(task);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ============================================================
// UPDATE TASK
// ============================================================

const updateTask = async (req, res) => {
  try {
    const task =
      await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const { project, hasAccess } =
      await checkProjectAccess(
        task.project,
        req.user._id
      );

    if (!project || !hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this task",
      });
    }

    const {
      title,
      description,
      assignee,
      status,
      priority,
      dueDate,
      tags,
    } = req.body;

    const oldStatus = task.status;

    const oldAssignee = task.assignee
      ? task.assignee.toString()
      : null;

    if (
      assignee !== undefined &&
      assignee !== null
    ) {
      const isOwner =
        project.owner.toString() ===
        assignee.toString();

      const isMember =
        project.members.some(
          (member) =>
            member.user &&
            member.user.toString() ===
              assignee.toString()
        );

      if (!isOwner && !isMember) {
        return res.status(400).json({
          message:
            "Assignee must be a member of the project",
        });
      }
    }

    task.title =
      title ?? task.title;

    task.description =
      description ?? task.description;

    task.assignee =
      assignee !== undefined
        ? assignee
        : task.assignee;

    task.status =
      status ?? task.status;

    task.priority =
      priority ?? task.priority;

    task.dueDate =
      dueDate !== undefined
        ? dueDate
        : task.dueDate;

    task.tags =
      tags ?? task.tags;

    await task.save();

    if (
      oldStatus !== task.status &&
      task.status === "completed"
    ) {
      await createActivity({
        userId: req.user._id,
        projectId: task.project,
        taskId: task._id,
        type: "task-completed",
        message: `${req.user.name} completed the task "${task.title}"`,
      });

      if (
        task.assignee &&
        task.assignee.toString() !==
          req.user._id.toString()
      ) {
        await createNotification({
          recipient: task.assignee,
          sender: req.user._id,
          type: "task-status-changed",
          message: `${req.user.name} completed the task "${task.title}"`,
          project: task.project,
          task: task._id,
        });
      }
    } else if (
      oldStatus !== task.status
    ) {
      await createActivity({
        userId: req.user._id,
        projectId: task.project,
        taskId: task._id,
        type: "task-updated",
        message: `${req.user.name} changed the status of "${task.title}" to ${task.status}`,
      });

      if (
        task.assignee &&
        task.assignee.toString() !==
          req.user._id.toString()
      ) {
        await createNotification({
          recipient: task.assignee,
          sender: req.user._id,
          type: "task-status-changed",
          message: `${req.user.name} changed "${task.title}" status to ${task.status}`,
          project: task.project,
          task: task._id,
        });
      }
    } else {
      await createActivity({
        userId: req.user._id,
        projectId: task.project,
        taskId: task._id,
        type: "task-updated",
        message: `${req.user.name} updated the task "${task.title}"`,
      });
    }

    const newAssignee = task.assignee
      ? task.assignee.toString()
      : null;

    if (oldAssignee !== newAssignee) {
      if (newAssignee) {
        const assignedUser =
          await User.findById(newAssignee);

        if (assignedUser) {
          await createActivity({
            userId: req.user._id,
            projectId: task.project,
            taskId: task._id,
            type: "task-assigned",
            message: `${req.user.name} assigned "${task.title}" to ${assignedUser.name}`,
          });

          if (
            newAssignee !==
            req.user._id.toString()
          ) {
            await createNotification({
              recipient: newAssignee,
              sender: req.user._id,
              type: "task-assigned",
              message: `${req.user.name} assigned you the task "${task.title}"`,
              project: task.project,
              task: task._id,
            });
          }
        }
      }
    }

    const populatedTask =
      await Task.findById(task._id)
        .populate("creator", "name email")
        .populate("assignee", "name email");

    res.json({
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ============================================================
// ADD IMPLEMENTATION EVIDENCE
// ============================================================

const addImplementationEvidence = async (
  req,
  res
) => {
  try {
    const task =
      await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const { project, hasAccess } =
      await checkProjectAccess(
        task.project,
        req.user._id
      );

    if (!project || !hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this task",
      });
    }

    const {
      description,
      skills,
      commitHash,
      commitUrl,
      prUrl,
    } = req.body;

    // ----------------------------------------------------------
    // DESCRIPTION
    // ----------------------------------------------------------

    if (
      !description ||
      !description.trim()
    ) {
      return res.status(400).json({
        message:
          "Implementation description is required",
      });
    }

    // ----------------------------------------------------------
    // SKILLS
    // ----------------------------------------------------------

    if (
      !Array.isArray(skills) ||
      skills.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one skill is required for implementation evidence",
      });
    }

    const normalizedSkills = [
      ...new Set(
        skills
          .filter(
            (skill) =>
              typeof skill === "string" &&
              skill.trim()
          )
          .map((skill) =>
            skill.trim()
          )
      ),
    ];

    if (
      normalizedSkills.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one valid skill is required for implementation evidence",
      });
    }

    // ----------------------------------------------------------
    // IMPLEMENTATION REFERENCE
    // ----------------------------------------------------------

    if (
      !commitHash &&
      !commitUrl &&
      !prUrl
    ) {
      return res.status(400).json({
        message:
          "At least one implementation reference is required: commitHash, commitUrl, or prUrl",
      });
    }

    // ----------------------------------------------------------
    // EVIDENCE OBJECT
    // ----------------------------------------------------------

    const implementationEvidence = {
      type: "implementation",

      developer:
        req.user._id,

      description:
        description.trim(),

      skills:
        normalizedSkills,

      commitHash:
        commitHash
          ? commitHash.trim()
          : "",

      commitUrl:
        commitUrl
          ? commitUrl.trim()
          : "",

      prUrl:
        prUrl
          ? prUrl.trim()
          : "",

      createdAt:
        new Date(),
    };

    if (
      !Array.isArray(task.history)
    ) {
      task.history = [];
    }

    task.history.push(
      implementationEvidence
    );

    await task.save();

    await createActivity({
      userId: req.user._id,
      projectId: task.project,
      taskId: task._id,
      type: "task-implementation-added",
      message: `${req.user.name} added implementation evidence for "${task.title}"`,
    });

    const populatedTask =
      await Task.findById(task._id)
        .populate(
          "creator",
          "name email"
        )
        .populate(
          "assignee",
          "name email"
        );

    return res.json({
      message:
        "Implementation evidence added successfully",

      evidence:
        implementationEvidence,

      task:
        populatedTask,
    });
  } catch (error) {
    console.error(
      "Add implementation evidence error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ============================================================
// CLEAN DUPLICATE IMPLEMENTATION EVIDENCE
// ============================================================


const cleanupImplementationEvidence = async (req, res) => {
  try {
    const PROJECT_ID = "6aa41e046c8818d4bb1eb3ae";
    const AUTH_UI_TASK_ID = "6aa795f30011ef6f897bdb3b";

    // 1. Verify project and ownership before changing data.
    const project = await Project.findById(PROJECT_ID);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the project owner can clean implementation evidence",
      });
    }

    const tasks = await Task.find({ project: PROJECT_ID });
    let removedCount = 0;

    for (const task of tasks) {
      if (!Array.isArray(task.history)) continue;

      const originalHistory = task.history;
      let history = [...originalHistory];

      // 2. Remove only the known, incorrect backend entry
      // from the specific authentication UI task.
      if (task._id.toString() === AUTH_UI_TASK_ID) {
        history = history.filter((entry) => {
          const isIncorrectBackendEvidence =
            entry &&
            entry.type === "implementation" &&
            (entry.description || "").trim() ===
              "Implemented JWT authentication middleware and protected API routes.";

          return !isIncorrectBackendEvidence;
        });
      }

      // 3. Remove exact duplicates from implementation history.
      const seen = new Set();
      const cleanedHistory = [];

      for (const entry of history) {
        if (!entry || entry.type !== "implementation") {
          cleanedHistory.push(entry);
          continue;
        }

        const key = JSON.stringify({
          developer: entry.developer
            ? entry.developer.toString()
            : "",
          description: (entry.description || "").trim(),
          skills: Array.isArray(entry.skills)
            ? entry.skills
                .map((skill) => String(skill).trim().toLowerCase())
                .sort()
            : [],
          commitHash: entry.commitHash || "",
          commitUrl: entry.commitUrl || "",
          prUrl: entry.prUrl || "",
        });

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        cleanedHistory.push(entry);
      }

      const removed = originalHistory.length - cleanedHistory.length;

      if (removed > 0) {
        task.history = cleanedHistory;
        await task.save();
        removedCount += removed;
      }
    }

    return res.json({
      message: "Implementation evidence cleanup completed successfully",
      tasksChecked: tasks.length,
      removedCount,
    });
  } catch (error) {
    console.error("Cleanup implementation evidence error:", error);

    return res.status(500).json({
      message: "Server error during implementation evidence cleanup",
    });
  }
};


// ============================================================
// DELETE TASK
// ============================================================

const deleteTask = async (req, res) => {
  try {
    const task =
      await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const { project, hasAccess } =
      await checkProjectAccess(
        task.project,
        req.user._id
      );

    if (!project || !hasAccess) {
      return res.status(403).json({
        message:
          "You do not have access to this task",
      });
    }

    if (
      project.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the project owner can delete tasks",
      });
    }

    const projectId =
      task.project;

    const taskName =
      task.title;

    await createActivity({
      userId: req.user._id,
      projectId,
      taskId: task._id,
      type: "task-deleted",
      message: `${req.user.name} deleted the task "${taskName}"`,
    });

    if (
      task.assignee &&
      task.assignee.toString() !==
        req.user._id.toString()
    ) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        type: "general",
        message: `${req.user.name} deleted the task "${taskName}"`,
        project: projectId,
      });
    }

    await Task.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ============================================================
// GET ALL TASKS
// ============================================================

const getAllTasks = async (req, res) => {
  try {
    const projects =
      await Project.find({
        $or: [
          {
            owner: req.user._id,
          },
          {
            "members.user":
              req.user._id,
          },
        ],
      }).select("_id");

    const projectIds =
      projects.map(
        (p) => p._id
      );

    const tasks =
      await Task.find({
        project: {
          $in: projectIds,
        },
      })
        .populate(
          "creator",
          "name email"
        )
        .populate(
          "assignee",
          "name email"
        )
        .populate(
          "project",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    res.json({
      count: tasks.length,

      tasks: tasks.map((t) => ({
        ...t.toObject(),

        id: t._id.toString(),

        desc:
          t.desc ||
          t.description,

        column:
          t.column,

        projectName:
          t.project?.name,

        projectId:
          t.project?._id?.toString(),
      })),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  getAllTasks,
  addImplementationEvidence,
  cleanupImplementationEvidence,
};