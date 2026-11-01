const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    avatar: {
      type: String,
      default: "",
    },

    avatar_url: {
      type: String,
      default: "",
    },

    avatarGradient: {
      type: String,
      default: "linear-gradient(135deg, #7c6cff, #43d49a)",
    },

    role: {
      type: String,
      default: "developer",
    },

    roleType: {
      type: String,
      default: "Developer",
    },

    department: {
      type: String,
      default: "Engineering",
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "Active Workspace",
    },

    github: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    portfolio: {
      type: String,
      default: "",
    },

    experience: {
      type: String,
      default: "3+ years",
    },

    education: {
      type: String,
      default: "Computer Science & Engineering",
    },

    skills: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    targetRole: {
      type: String,
      default: "Full-Stack Developer",
    },

    careerRoadmap: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);