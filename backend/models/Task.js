const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    desc: {
      type: String,
      default: "",
      trim: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assigneeName: {
      type: String,
      default: "",
    },

    assigneeAvatar: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "todo",
    },

    column: {
      type: String,
      default: "TODO",
    },

    priority: {
      type: String,
      default: "medium",
    },

    dueDate: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    history: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);