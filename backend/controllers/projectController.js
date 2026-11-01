const Project = require("../models/Project");
const User = require("../models/User");
const Task = require("../models/Task");
const Comment = require("../models/Comment");

const createActivity = require("../utils/activityLogger");
const createNotification = require("../utils/notificationLogger");

const enrichProjectsWithTasks = async (projects) => {
  if (!projects || projects.length === 0) return [];
  const projectIds = projects.map((p) => p._id);
  const tasks = await Task.find({ project: { $in: projectIds } })
    .populate("creator", "name email avatar")
    .populate("assignee", "name email avatar")
    .lean();

  const taskIds = tasks.map((t) => t._id);
  const comments = await Comment.find({ task: { $in: taskIds } })
    .populate("user", "name email avatar")
    .lean();

  const commentsByTaskId = {};
  comments.forEach((c) => {
    const tid = c.task.toString();
    if (!commentsByTaskId[tid]) commentsByTaskId[tid] = [];
    commentsByTaskId[tid].push({
      id: c._id.toString(),
      _id: c._id.toString(),
      author: c.author || c.user?.name || "Developer",
      text: c.text || c.message || "",
      message: c.message || c.text || "",
      time: c.time || "Just now",
      createdAt: c.createdAt,
    });
  });

  const tasksByProjectId = {};
  tasks.forEach((t) => {
    const pid = t.project.toString();
    if (!tasksByProjectId[pid]) tasksByProjectId[pid] = [];
    const col = (t.column || (t.status ? t.status.toUpperCase().replace("-", " ") : "TODO"))
      .replace("TO DO", "TODO")
      .replace("DONE", "COMPLETED");
    tasksByProjectId[pid].push({
      id: t._id.toString(),
      _id: t._id.toString(),
      title: t.title,
      desc: t.desc || t.description || "",
      description: t.description || t.desc || "",
      column: col,
      status: t.status || "todo",
      priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase() : "Medium",
      assignee: t.assigneeName || t.assignee?.name || "Developer",
      assigneeAvatar: t.assigneeAvatar || (t.assignee?.name ? t.assignee.name.charAt(0).toUpperCase() : "D"),
      creator: t.creator?.name || "Developer",
      dueDate: t.dueDate || "Next week",
      tags: t.tags || [],
      comments: commentsByTaskId[t._id.toString()] || [],
      history: t.history || [],
    });
  });

  return projects.map((p) => {
    const pObj = p.toObject ? p.toObject() : p;
    const pid = pObj._id.toString();
    const pTasks = tasksByProjectId[pid] || [];
    const completedCount = pTasks.filter((t) => t.column === "COMPLETED" || t.column === "DONE").length;
    const progress = pTasks.length ? Math.round((completedCount / pTasks.length) * 100) : (pObj.progress || 0);

    return {
      ...pObj,
      id: pid,
      _id: pid,
      desc: pObj.desc || pObj.description || "",
      tagline: pObj.tagline || pObj.description?.slice(0, 60) || "Workspace project",
      progress,
      tasks: pTasks,
      members: (pObj.members || []).map((m) => ({
        id: m.user?._id?.toString() || m.user?.toString() || m._id?.toString(),
        _id: m.user?._id?.toString() || m.user?.toString() || m._id?.toString(),
        name: m.name || m.user?.name || "Developer",
        email: m.email || m.user?.email || "dev@devorbit.io",
        role: m.role || "Developer",
        skills: m.skills || m.user?.skills || ["React", "Node.js"],
        assignedTasks: m.assignedTasks || 0,
        completedTasks: m.completedTasks || 0,
        workload: m.workload || "30%",
        avatarGradient: m.avatarGradient || "linear-gradient(135deg, #7c6cff, #43d49a)",
      })),
    };
  });
};

// CREATE PROJECT
const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      desc,
      tagline,
      category,
      status,
      visibility,
      technologies,
      startDate,
      deadline,
      githubRepo,
      aiInsights,
      aiEvaluation,
      aiRiskPrediction,
      aiTeamFormation
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name,
      description: description || desc || "",
      desc: desc || description || "",
      tagline: tagline || "",
      category: category || "Full Stack Development",
      status: status || "Active",
      visibility: visibility || "Public",
      technologies: Array.isArray(technologies) ? technologies : (technologies ? [technologies] : []),
      startDate: startDate || new Date(),
      deadline: deadline || null,
      githubRepo: githubRepo || "",
      aiInsights: aiInsights || null,
      aiEvaluation: aiEvaluation || null,
      aiRiskPrediction: aiRiskPrediction || null,
      aiTeamFormation: aiTeamFormation || null,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: "Owner",
          avatarGradient: req.user.avatarGradient || "linear-gradient(135deg, #7c6cff, #43d49a)",
          skills: req.user.skills || ["React", "Node.js"],
        },
      ],
    });

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      type: "project-created",
      message: `${req.user.name} created the project "${project.name}"`,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    const enriched = (await enrichProjectsWithTasks([populatedProject]))[0];

    res.status(201).json({
      message: "Project created successfully",
      project: enriched,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET PROJECTS
// Supports:
// ?search=dev
// ?status=active
// ?visibility=private
// ?sort=newest
// ?sort=oldest
// ?sort=name
// ?sort=deadline
// ?page=1
// ?limit=10
const getProjects = async (req, res) => {
  try {
    const {
      search,
      status,
      visibility,
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

    const query = {
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id },
      ],
    };

    // STATUS FILTER
    if (status) {
      const allowedStatuses = [
        "planning",
        "active",
        "completed",
        "archived",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid project status",
        });
      }

      query.status = status;
    }

    // VISIBILITY FILTER
    if (visibility) {
      const allowedVisibility = [
        "private",
        "public",
      ];

      if (
        !allowedVisibility.includes(
          visibility
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid project visibility",
        });
      }

      query.visibility = visibility;
    }

    // SEARCH
    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim(),
        "i"
      );

      query.$and = [
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { technologies: searchRegex },
          ],
        },
      ];
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

      case "name":
        sortOption = {
          name: 1,
        };
        break;

      case "name-desc":
        sortOption = {
          name: -1,
        };
        break;

      case "deadline":
        sortOption = {
          deadline: 1,
        };
        break;

      case "deadline-desc":
        sortOption = {
          deadline: -1,
        };
        break;

      case "newest":
      default:
        sortOption = {
          createdAt: -1,
        };
        break;
    }

    const totalProjects =
      await Project.countDocuments(query);

    const projects =
      await Project.find(query)
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "members.user",
          "name email"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

    const totalPages =
      Math.ceil(
        totalProjects / limit
      );

    const enrichedProjects = await enrichProjectsWithTasks(projects);

    res.json({
      count: enrichedProjects.length,
      total: totalProjects,

      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },

      filters: {
        search: search || "",
        status: status || "all",
        visibility:
          visibility || "all",
        sort,
      },

      projects: enrichedProjects,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET SINGLE PROJECT
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    )
      .populate(
        "owner",
        "name email"
      )
      .populate(
        "members.user",
        "name email"
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner._id.toString() ===
      req.user._id.toString();

    const isMember =
      project.members.some(
        (member) =>
          member.user &&
          member.user._id.toString() ===
            req.user._id.toString()
      );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        message:
          "You do not have access to this project",
      });
    }

    const enriched = (await enrichProjectsWithTasks([project]))[0];

    res.json(enriched);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// UPDATE PROJECT
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (
      project.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the project owner can update this project",
      });
    }

    const {
      name,
      description,
      status,
      visibility,
      technologies,
      startDate,
      deadline,
    } = req.body;

    project.name =
      name ?? project.name;

    project.description =
      description ??
      project.description;

    project.status =
      status ?? project.status;

    project.visibility =
      visibility ??
      project.visibility;

    project.technologies =
      technologies ??
      project.technologies;

    project.startDate =
      startDate ??
      project.startDate;

    project.deadline =
      deadline ??
      project.deadline;

    const updatedProject =
      await project.save();

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      type: "project-updated",
      message: `${req.user.name} updated the project "${project.name}"`,
    });

    const populatedProject =
      await Project.findById(
        updatedProject._id
      )
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "members.user",
          "name email"
        );

    res.json({
      message:
        "Project updated successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// DELETE PROJECT
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (
      project.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the project owner can delete this project",
      });
    }

    const projectId = project._id;
    const projectName = project.name;

    await createActivity({
      userId: req.user._id,
      projectId,
      type: "project-deleted",
      message: `${req.user.name} deleted the project "${projectName}"`,
    });

    await Project.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Project deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ADD PROJECT MEMBER
const addProjectMember = async (
  req,
  res
) => {
  try {
    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (
      project.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the project owner can add members",
      });
    }

    const { userId, role } =
      req.body;

    if (!userId) {
      return res.status(400).json({
        message:
          "User ID is required",
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      project.owner.toString() ===
      userId.toString()
    ) {
      return res.status(400).json({
        message:
          "Project owner is already a member",
      });
    }

    const alreadyMember =
      project.members.some(
        (member) =>
          member.user.toString() ===
          userId.toString()
      );

    if (alreadyMember) {
      return res.status(400).json({
        message:
          "User is already a member of this project",
      });
    }

    const memberRole =
      role || "developer";

    if (
      !["admin", "developer"].includes(
        memberRole
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid member role",
      });
    }

    project.members.push({
      user: userId,
      role: memberRole,
    });

    await project.save();

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      type: "member-added",
      message: `${req.user.name} added ${user.name} to the project`,
      metadata: {
        memberId: userId,
        role: memberRole,
      },
    });

    await createNotification({
      recipient: userId,
      sender: req.user._id,
      type: "project-member-added",
      message: `${req.user.name} added you to the project "${project.name}"`,
      project: project._id,
    });

    const updatedProject =
      await Project.findById(
        project._id
      )
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "members.user",
          "name email"
        );

    res.status(201).json({
      message:
        "Member added successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET PROJECT MEMBERS
const getProjectMembers = async (
  req,
  res
) => {
  try {
    const project =
      await Project.findById(
        req.params.id
      )
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "members.user",
          "name email"
        );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isOwner =
      project.owner._id.toString() ===
      req.user._id.toString();

    const isMember =
      project.members.some(
        (member) =>
          member.user &&
          member.user._id.toString() ===
            req.user._id.toString()
      );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        message:
          "You do not have access to this project",
      });
    }

    res.json({
      projectId: project._id,
      projectName: project.name,
      count:
        project.members.length,
      members: project.members,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// UPDATE PROJECT MEMBER ROLE
const updateProjectMember = async (
  req,
  res
) => {
  try {
    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (
      project.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the project owner can update member roles",
      });
    }

    const { role } =
      req.body;

    const { userId } =
      req.params;

    if (!role) {
      return res.status(400).json({
        message:
          "Role is required",
      });
    }

    if (
      project.owner.toString() ===
      userId.toString()
    ) {
      return res.status(400).json({
        message:
          "Project owner role cannot be changed",
      });
    }

    if (
      !["admin", "developer"].includes(
        role
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid member role",
      });
    }

    const member =
      project.members.find(
        (member) =>
          member.user.toString() ===
          userId.toString()
      );

    if (!member) {
      return res.status(404).json({
        message:
          "Member not found in this project",
      });
    }

    const oldRole =
      member.role;

    member.role = role;

    await project.save();

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      type: "member-role-updated",
      message: `${req.user.name} changed a member role from ${oldRole} to ${role}`,
      metadata: {
        memberId: userId,
        oldRole,
        newRole: role,
      },
    });

    const updatedProject =
      await Project.findById(
        project._id
      )
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "members.user",
          "name email"
        );

    res.json({
      message:
        "Member role updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// REMOVE PROJECT MEMBER
const removeProjectMember = async (
  req,
  res
) => {
  try {
    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (
      project.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the project owner can remove members",
      });
    }

    const { userId } =
      req.params;

    if (
      project.owner.toString() ===
      userId.toString()
    ) {
      return res.status(400).json({
        message:
          "Project owner cannot be removed",
      });
    }

    const memberExists =
      project.members.some(
        (member) =>
          member.user.toString() ===
          userId.toString()
      );

    if (!memberExists) {
      return res.status(404).json({
        message:
          "Member not found in this project",
      });
    }

    const removedUser =
      await User.findById(userId);

    await createNotification({
      recipient: userId,
      sender: req.user._id,
      type: "project-member-removed",
      message: `${req.user.name} removed you from the project "${project.name}"`,
      project: project._id,
    });

    project.members =
      project.members.filter(
        (member) =>
          member.user.toString() !==
          userId.toString()
      );

    await project.save();

    await createActivity({
      userId: req.user._id,
      projectId: project._id,
      type: "member-removed",
      message: `${req.user.name} removed ${
        removedUser?.name ||
        "a member"
      } from the project`,
      metadata: {
        memberId: userId,
      },
    });

    const updatedProject =
      await Project.findById(
        project._id
      )
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "members.user",
          "name email"
        );

    res.json({
      message:
        "Member removed successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMembers,
  updateProjectMember,
  removeProjectMember,
};