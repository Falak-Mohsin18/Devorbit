const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  connectGitHub,
  handleOAuthCallback,
  getGitHubStatus,
  getGitHubProfile,
  getGitHubRepositories,
  getGitHubActivity,
  getGitHubInsights,
  syncGitHub,
  disconnectGitHub,
} = require("../controllers/githubController");

const router = express.Router();

// OAuth connection initiation (requires JWT authentication)
router.get("/connect", protect, connectGitHub);

// OAuth callback from GitHub redirect (state parameter validates identity and prevents CSRF)
router.get("/callback", handleOAuthCallback);

// Protected endpoints for authenticated DevOrbit user
router.get("/status", protect, getGitHubStatus);
router.get("/profile", protect, getGitHubProfile);
router.get("/repositories", protect, getGitHubRepositories);
router.get("/activity", protect, getGitHubActivity);
router.get("/insights", protect, getGitHubInsights);
router.post("/sync", protect, syncGitHub);
router.delete("/disconnect", protect, disconnectGitHub);

module.exports = router;
