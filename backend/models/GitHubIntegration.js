const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
  {
    githubRepoId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    htmlUrl: {
      type: String,
      required: true,
    },
    isFork: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: "",
    },
    languages: [
      {
        language: { type: String, required: true },
        bytes: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    openIssues: {
      type: Number,
      default: 0,
    },
    defaultBranch: {
      type: String,
      default: "main",
    },
    visibility: {
      type: String,
      default: "public",
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    pushedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const commitSchema = new mongoose.Schema(
  {
    sha: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
    },
    repoName: {
      type: String,
      default: "",
    },
    repoUrl: {
      type: String,
      default: "",
    },
    commitUrl: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const pullRequestSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    number: {
      type: Number,
    },
    title: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "open",
    },
    url: {
      type: String,
      default: "",
    },
    repoName: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
    },
    mergedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const languageDistributionSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
    },
    totalBytes: {
      type: Number,
      default: 0,
    },
    repoCount: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#8d6bff",
    },
  },
  { _id: false }
);

const skillObservedSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
    },
    strength: {
      type: String,
      enum: ["Demonstrated", "Practiced", "Emerging"],
      default: "Practiced",
    },
    evidence: {
      type: String,
      default: "",
    },
    repoCount: {
      type: Number,
      default: 1,
    },
    repos: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const gitHubIntegrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    githubId: {
      type: String,
      required: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      default: "",
    },

    profileUrl: {
      type: String,
      default: "",
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    company: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    publicRepos: {
      type: Number,
      default: 0,
    },

    followers: {
      type: Number,
      default: 0,
    },

    following: {
      type: Number,
      default: 0,
    },

    // Secure encrypted token - hidden by default from queries
    accessToken: {
      encrypted: { type: String, select: false },
      iv: { type: String, select: false },
      tag: { type: String, select: false },
    },

    scope: {
      type: String,
      default: "read:user,public_repo",
    },

    isConnected: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },

    repositories: [repositorySchema],

    activity: {
      recentCommits: [commitSchema],
      pullRequests: [pullRequestSchema],
      recentEvents: [
        {
          id: String,
          type: String,
          repoName: String,
          createdAt: Date,
        },
      ],
      totalCommitsObserved: {
        type: Number,
        default: 0,
      },
      totalPullRequestsObserved: {
        type: Number,
        default: 0,
      },
      totalIssuesObserved: {
        type: Number,
        default: 0,
      },
    },

    languageDistribution: [languageDistributionSchema],

    skillsObserved: [skillObservedSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user lookup with connection filter
gitHubIntegrationSchema.index({ user: 1, isConnected: 1 });

module.exports = mongoose.model("GitHubIntegration", gitHubIntegrationSchema);
