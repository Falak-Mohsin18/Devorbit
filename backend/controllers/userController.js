const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/users/profile
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// PUT /api/users/profile
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const {
      name,
      email,
      bio,
      skills,
      avatar,
    } = req.body;

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          message: "Email cannot be empty",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email is already in use",
        });
      }

      user.email = normalizedEmail;
    }

    if (bio !== undefined) {
      user.bio = typeof bio === "string" ? bio.trim() : "";
    }

    if (skills !== undefined) {
      user.skills = Array.isArray(skills) ? skills : [skills];
    }

    if (avatar !== undefined) {
      user.avatar = typeof avatar === "string" ? avatar.trim() : "";
      user.avatar_url = user.avatar;
    }

    if (req.body.avatar_url !== undefined) {
      user.avatar_url = req.body.avatar_url;
      user.avatar = req.body.avatar_url;
    }

    if (req.body.avatarGradient !== undefined) {
      user.avatarGradient = req.body.avatarGradient;
    }

    if (req.body.role !== undefined) {
      user.titleRole = req.body.role;
    }

    if (req.body.department !== undefined) {
      user.department = req.body.department;
    }

    if (req.body.location !== undefined) {
      user.location = req.body.location;
    }

    if (req.body.github !== undefined) {
      user.github = req.body.github;
    }

    if (req.body.linkedin !== undefined) {
      user.linkedin = req.body.linkedin;
    }

    if (req.body.portfolio !== undefined) {
      user.portfolio = req.body.portfolio;
    }

    if (req.body.experience !== undefined) {
      user.experience = req.body.experience;
    }

    if (req.body.education !== undefined) {
      user.education = req.body.education;
    }

    await user.save();

    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: {
        ...updatedUser.toObject(),
        id: updatedUser._id.toString(),
        roleType: updatedUser.role === "admin" ? "Admin" : "Developer",
        role: updatedUser.titleRole || updatedUser.role || "Full Stack Software Engineer",
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must be at least 6 characters",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        message:
          "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    await user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET /api/users/search?q=...
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(
      q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const users = await User.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { email: searchRegex },
      ],
    })
      .select(
        "name email avatar role bio skills"
      )
      .limit(20);

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Search Users Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select(
      "name email avatar role titleRole skills"
    );
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

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getUserById,
  searchUsers,
  getAllUsers,
};