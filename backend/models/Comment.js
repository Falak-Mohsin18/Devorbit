const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      default: "",
      trim: true,
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    author: {
      type: String,
      default: "",
    },

    time: {
      type: String,
      default: "Just now",
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", commentSchema);