const mongoose = require("mongoose");

const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET /api/admin/users/:id
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const projectCount = await Project.countDocuments({
      $or: [
        { owner: user._id },
        { "members.user": user._id },
      ],
    });

    const taskCount = await Task.countDocuments({
      $or: [
        { creator: user._id },
        { assignee: user._id },
      ],
    });

    res.json({
      user,
      statistics: {
        projectCount,
        taskCount,
      },
    });
  } catch (error) {
    console.error("Get User Details Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!["developer", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be developer or admin",
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.role = role;

    await user.save();

    const updatedUser = await User.findById(id).select("-password");

    res.json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Role Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false",
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot change your own account status",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findById(id).select("-password");

    res.json({
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET /api/admin/projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("owner", "name email avatar role")
      .populate("members.user", "name email avatar role")
      .sort({ createdAt: -1 });

    res.json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get All Projects Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDevelopers,
      totalAdmins,
      activeUsers,
      inactiveUsers,
      totalProjects,
      activeProjects,
      completedProjects,
      planningProjects,
      archivedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "developer",
      }),

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),

      Project.countDocuments(),

      Project.countDocuments({
        status: "active",
      }),

      Project.countDocuments({
        status: "completed",
      }),

      Project.countDocuments({
        status: "planning",
      }),

      Project.countDocuments({
        status: "archived",
      }),

      Task.countDocuments(),

      Task.countDocuments({
        status: "completed",
      }),

      Task.countDocuments({
        status: "in-progress",
      }),

      Task.countDocuments({
        status: "todo",
      }),

      Task.countDocuments({
        status: "review",
      }),
    ]);

    res.json({
      users: {
        total: totalUsers,
        developers: totalDevelopers,
        admins: totalAdmins,
        active: activeUsers,
        inactive: inactiveUsers,
      },

      projects: {
        total: totalProjects,
        planning: planningProjects,
        active: activeProjects,
        completed: completedProjects,
        archived: archivedProjects,
      },

      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        review: reviewTasks,
        completed: completedTasks,
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  getAllProjects,
  getAdminStats,
};