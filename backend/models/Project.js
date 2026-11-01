const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
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

    tagline: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "Full Stack Development",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          default: "Developer",
        },
        name: {
          type: String,
          default: "",
        },
        email: {
          type: String,
          default: "",
        },
        skills: {
          type: mongoose.Schema.Types.Mixed,
          default: [],
        },
        avatarGradient: {
          type: String,
          default: "linear-gradient(135deg, #7c6cff, #43d49a)",
        },
        workload: {
          type: String,
          default: "30%",
        },
        assignedTasks: {
          type: Number,
          default: 0,
        },
        completedTasks: {
          type: Number,
          default: 0,
        }
      },
    ],

    status: {
      type: String,
      default: "Active",
    },

    visibility: {
      type: String,
      default: "Public",
    },

    technologies: {
      type: [String],
      default: [],
    },

    progress: {
      type: Number,
      default: 0,
    },

    health: {
      type: Number,
      default: 85,
    },

    stars: {
      type: Number,
      default: 0,
    },

    forks: {
      type: Number,
      default: 0,
    },

    githubRepo: {
      type: String,
      default: "",
    },

    healthBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        codeActivity: 85,
        taskCompletion: 85,
        issueResolution: 85,
        teamActivity: 85,
        deadlineRisk: 85
      }),
    },

    aiInsights: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    aiEvaluation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    aiRiskPrediction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    aiTeamFormation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    startDate: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    deadline: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);