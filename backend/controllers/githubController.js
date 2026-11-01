const {
  getOAuthUrl,
  exchangeCodeForAccessToken,
  completeOAuthConnection,
  syncGitHubDataForUser,
  disconnectGitHubAccount,
} = require("../services/githubService");
const { verifyOAuthState } = require("../utils/encryption");
const GitHubIntegration = require("../models/GitHubIntegration");

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || "http://localhost:8443";
};

// ============================================================
// 1. GET /api/github/connect
// ============================================================
const connectGitHub = async (req, res) => {
  try {
    const userId = req.user._id;
    const { url, state } = getOAuthUrl(userId);

    // If client requested a direct browser redirect
    if (req.query.redirect === "true") {
      return res.redirect(url);
    }

    res.json({
      success: true,
      url,
      state,
      message: "GitHub OAuth authorization URL generated successfully.",
    });
  } catch (error) {
    console.error("Connect GitHub Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate GitHub authorization URL.",
    });
  }
};

// ============================================================
// 2. GET /api/github/callback
// GitHub redirects browser here with ?code=...&state=...
// ============================================================
const handleOAuthCallback = async (req, res) => {
  const frontendUrl = getFrontendBaseUrl();
  const { code, state, error, error_description } = req.query;

  // 1. Handle user cancellation or GitHub OAuth errors
  if (error) {
    console.warn("GitHub OAuth authorization error:", error, error_description);
    return res.redirect(
      `${frontendUrl}/github?error=${encodeURIComponent(
        error_description || error || "GitHub authorization was cancelled."
      )}`
    );
  }

  // 2. Validate authorization code
  if (!code) {
    return res.redirect(
      `${frontendUrl}/github?error=${encodeURIComponent(
        "Missing authorization code from GitHub callback."
      )}`
    );
  }

  // 3. Validate state to prevent CSRF attacks
  const statePayload = verifyOAuthState(state);
  if (!statePayload || !statePayload.userId) {
    return res.redirect(
      `${frontendUrl}/github?error=${encodeURIComponent(
        "Invalid or expired OAuth state parameter. Please try connecting again."
      )}`
    );
  }

  const { userId } = statePayload;

  try {
    // 4. Exchange code for access token
    const tokenData = await exchangeCodeForAccessToken(code);

    // 5. Connect and initialize integration record
    const { profile } = await completeOAuthConnection(
      userId,
      tokenData.accessToken,
      tokenData.scope
    );

    // 6. Redirect to frontend with success
    return res.redirect(
      `${frontendUrl}/github?connected=true&username=${encodeURIComponent(
        profile.login
      )}`
    );
  } catch (err) {
    console.error("GitHub Callback Error:", err);
    return res.redirect(
      `${frontendUrl}/github?error=${encodeURIComponent(
        err.message || "An unexpected error occurred during GitHub authentication."
      )}`
    );
  }
};

// ============================================================
// 3. GET /api/github/status
// ============================================================
const getGitHubStatus = async (req, res) => {
  try {
    const integration = await GitHubIntegration.findOne({
      user: req.user._id,
      isConnected: true,
    }).lean();

    if (!integration) {
      return res.json({
        success: true,
        isConnected: false,
        username: "",
        githubId: "",
        avatarUrl: "",
        profileUrl: "",
        lastSyncedAt: null,
      });
    }

    res.json({
      success: true,
      isConnected: true,
      username: integration.username,
      githubId: integration.githubId,
      name: integration.name,
      avatarUrl: integration.avatarUrl,
      profileUrl: integration.profileUrl,
      publicRepos: integration.publicRepos,
      followers: integration.followers,
      following: integration.following,
      lastSyncedAt: integration.lastSyncedAt,
    });
  } catch (error) {
    console.error("Get GitHub Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving GitHub connection status.",
    });
  }
};

// ============================================================
// 4. GET /api/github/profile
// ============================================================
const getGitHubProfile = async (req, res) => {
  try {
    const integration = await GitHubIntegration.findOne({
      user: req.user._id,
      isConnected: true,
    }).lean();

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "No connected GitHub account found for this user.",
      });
    }

    res.json({
      success: true,
      profile: {
        username: integration.username,
        githubId: integration.githubId,
        name: integration.name,
        bio: integration.bio,
        company: integration.company,
        location: integration.location,
        avatarUrl: integration.avatarUrl,
        profileUrl: integration.profileUrl,
        publicRepos: integration.publicRepos,
        followers: integration.followers,
        following: integration.following,
        lastSyncedAt: integration.lastSyncedAt,
      },
    });
  } catch (error) {
    console.error("Get GitHub Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving GitHub profile.",
    });
  }
};

// ============================================================
// 5. GET /api/github/repositories
// ============================================================
const getGitHubRepositories = async (req, res) => {
  try {
    const integration = await GitHubIntegration.findOne({
      user: req.user._id,
      isConnected: true,
    }).lean();

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "No connected GitHub account found.",
        repositories: [],
      });
    }

    let repos = integration.repositories || [];
    const { language, sort } = req.query;

    if (language && language !== "All") {
      repos = repos.filter(
        (r) =>
          (r.language && r.language.toLowerCase() === language.toLowerCase()) ||
          r.languages?.some(
            (l) => l.language.toLowerCase() === language.toLowerCase()
          )
      );
    }

    if (sort === "stars") {
      repos.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    } else if (sort === "forks") {
      repos.sort((a, b) => (b.forks || 0) - (a.forks || 0));
    } else if (sort === "name") {
      repos.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: updated date
      repos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    res.json({
      success: true,
      count: repos.length,
      repositories: repos,
    });
  } catch (error) {
    console.error("Get GitHub Repositories Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving GitHub repositories.",
    });
  }
};

// ============================================================
// 6. GET /api/github/activity
// ============================================================
const getGitHubActivity = async (req, res) => {
  try {
    const integration = await GitHubIntegration.findOne({
      user: req.user._id,
      isConnected: true,
    }).lean();

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "No connected GitHub account found.",
        activity: {
          recentCommits: [],
          pullRequests: [],
          recentEvents: [],
        },
      });
    }

    res.json({
      success: true,
      activity: integration.activity || {
        recentCommits: [],
        pullRequests: [],
        recentEvents: [],
        totalCommitsObserved: 0,
        totalPullRequestsObserved: 0,
        totalIssuesObserved: 0,
      },
    });
  } catch (error) {
    console.error("Get GitHub Activity Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving GitHub activity.",
    });
  }
};

// ============================================================
// 7. GET /api/github/insights
// Returns complete aggregated dashboard data
// ============================================================
const getGitHubInsights = async (req, res) => {
  try {
    const integration = await GitHubIntegration.findOne({
      user: req.user._id,
      isConnected: true,
    }).lean();

    if (!integration) {
      return res.json({
        success: true,
        isConnected: false,
        message: "No GitHub account connected.",
        insights: null,
      });
    }

    const repos = integration.repositories || [];
    const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks || 0), 0);

    const insights = {
      isConnected: true,
      lastSyncedAt: integration.lastSyncedAt,
      profile: {
        username: integration.username,
        githubId: integration.githubId,
        name: integration.name,
        bio: integration.bio,
        company: integration.company,
        location: integration.location,
        avatarUrl: integration.avatarUrl,
        profileUrl: integration.profileUrl,
        publicRepos: integration.publicRepos,
        followers: integration.followers,
        following: integration.following,
      },
      metrics: {
        totalRepositories: repos.length,
        totalStars,
        totalForks,
        totalCommits: integration.activity?.totalCommitsObserved || 0,
        totalPullRequests: integration.activity?.totalPullRequestsObserved || 0,
        totalIssues: integration.activity?.totalIssuesObserved || 0,
      },
      languageDistribution: integration.languageDistribution || [],
      skillsObserved: integration.skillsObserved || [],
      recentCommits: (integration.activity?.recentCommits || []).slice(0, 15),
      pullRequests: (integration.activity?.pullRequests || []).slice(0, 10),
      repositories: repos.slice(0, 30),
    };

    res.json({
      success: true,
      isConnected: true,
      insights,
    });
  } catch (error) {
    console.error("Get GitHub Insights Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating GitHub insights.",
    });
  }
};

// ============================================================
// 8. POST /api/github/sync
// Manually re-sync latest information from GitHub REST API
// ============================================================
const syncGitHub = async (req, res) => {
  try {
    const updated = await syncGitHubDataForUser(req.user._id);

    const repos = updated.repositories || [];
    const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks || 0), 0);

    res.json({
      success: true,
      message: "GitHub data synchronized successfully with DevOrbit.",
      lastSyncedAt: updated.lastSyncedAt,
      insights: {
        isConnected: true,
        lastSyncedAt: updated.lastSyncedAt,
        profile: {
          username: updated.username,
          githubId: updated.githubId,
          name: updated.name,
          bio: updated.bio,
          company: updated.company,
          location: updated.location,
          avatarUrl: updated.avatarUrl,
          profileUrl: updated.profileUrl,
          publicRepos: updated.publicRepos,
          followers: updated.followers,
          following: updated.following,
        },
        metrics: {
          totalRepositories: repos.length,
          totalStars,
          totalForks,
          totalCommits: updated.activity?.totalCommitsObserved || 0,
          totalPullRequests: updated.activity?.totalPullRequestsObserved || 0,
          totalIssues: updated.activity?.totalIssuesObserved || 0,
        },
        languageDistribution: updated.languageDistribution || [],
        skillsObserved: updated.skillsObserved || [],
        recentCommits: (updated.activity?.recentCommits || []).slice(0, 15),
        pullRequests: (updated.activity?.pullRequests || []).slice(0, 10),
        repositories: repos.slice(0, 30),
      },
    });
  } catch (error) {
    console.error("Sync GitHub Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to synchronize with GitHub API.",
    });
  }
};

// ============================================================
// 9. DELETE /api/github/disconnect
// ============================================================
const disconnectGitHub = async (req, res) => {
  try {
    await disconnectGitHubAccount(req.user._id);

    res.json({
      success: true,
      message: "GitHub account disconnected successfully.",
    });
  } catch (error) {
    console.error("Disconnect GitHub Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error disconnecting GitHub account.",
    });
  }
};

module.exports = {
  connectGitHub,
  handleOAuthCallback,
  getGitHubStatus,
  getGitHubProfile,
  getGitHubRepositories,
  getGitHubActivity,
  getGitHubInsights,
  syncGitHub,
  disconnectGitHub,
};
