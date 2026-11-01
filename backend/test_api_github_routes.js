const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const githubRoutes = require("./routes/githubRoutes");
const { protect } = require("./middleware/authMiddleware");
const User = require("./models/User");
const GitHubIntegration = require("./models/GitHubIntegration");
const { generateOAuthState, encryptToken } = require("./utils/encryption");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);

const runRouteTests = async () => {
  console.log("==========================================");
  console.log("TESTING DEVORBIT GITHUB API HTTP ENDPOINTS");
  console.log("==========================================");

  let server;
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/devorbit");
    server = app.listen(5099);
    console.log("✓ Test server listening on port 5099");

    const baseUrl = "http://localhost:5099";

    // 1. Login as falak@devorbit.io to get JWT
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "falak@devorbit.io",
        password: "password123",
      }),
    });

    const loginData = await loginRes.json();
    if (!loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log("✓ Authenticated as Falak, JWT token received.");

    // 2. Test GET /api/github/connect WITHOUT token (Should be 401)
    const unauthConnect = await fetch(`${baseUrl}/api/github/connect`);
    if (unauthConnect.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated /connect, got ${unauthConnect.status}`);
    }
    console.log("✓ Security Check: Unauthenticated GET /api/github/connect returned 401 Unauthorized.");

    // 3. Test GET /api/github/connect WITH token
    // Provide a test GITHUB_CLIENT_ID if not present in env
    process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Iv1.test_client_id_12345";
    const authConnect = await fetch(`${baseUrl}/api/github/connect`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const connectData = await authConnect.json();
    if (!connectData.success || !connectData.url.includes("github.com/login/oauth/authorize")) {
      throw new Error(`Unexpected /connect response: ${JSON.stringify(connectData)}`);
    }
    console.log("✓ GET /api/github/connect returned valid OAuth authorize URL with state parameter.");

    // 4. Test GET /api/github/status (initial disconnected state)
    await GitHubIntegration.deleteMany({ user: userId });
    const statusRes = await fetch(`${baseUrl}/api/github/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData = await statusRes.json();
    if (statusData.isConnected !== false) {
      throw new Error(`Expected isConnected: false, got ${JSON.stringify(statusData)}`);
    }
    console.log("✓ GET /api/github/status returned isConnected: false when disconnected.");

    // 5. Test GET /api/github/insights (initial disconnected state)
    const insightsRes = await fetch(`${baseUrl}/api/github/insights`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const insightsData = await insightsRes.json();
    if (insightsData.isConnected !== false || insightsData.insights !== null) {
      throw new Error(`Expected isConnected: false with insights: null, got ${JSON.stringify(insightsData)}`);
    }
    console.log("✓ GET /api/github/insights returned isConnected: false (no mock/fake data).");

    // 6. Test GET /api/github/callback Error Handlers
    // Test A: User cancellation
    const cancelCallback = await fetch(
      `${baseUrl}/api/github/callback?error=access_denied&error_description=User+cancelled+authorization`,
      { redirect: "manual" }
    );
    const cancelLocation = cancelCallback.headers.get("location");
    if (!cancelLocation || !cancelLocation.includes("error=")) {
      throw new Error(`Expected redirect with error on cancellation, got ${cancelLocation}`);
    }
    console.log("✓ GET /api/github/callback correctly handles user cancellation via frontend error redirect.");

    // Test B: Invalid state
    const invalidStateCallback = await fetch(
      `${baseUrl}/api/github/callback?code=mock_code&state=invalid_tampered_state`,
      { redirect: "manual" }
    );
    const invalidLocation = invalidStateCallback.headers.get("location");
    if (!invalidLocation || !invalidLocation.includes("error=")) {
      throw new Error(`Expected redirect with error on invalid state, got ${invalidLocation}`);
    }
    console.log("✓ GET /api/github/callback correctly validates OAuth state and rejects forged requests.");

    // 7. Test Connected State API responses
    await GitHubIntegration.create({
      user: userId,
      githubId: "12345678",
      username: "falak-dev",
      name: "Falak Mohsin",
      bio: "Full stack engineer",
      avatarUrl: "https://github.com/falak-dev.png",
      profileUrl: "https://github.com/falak-dev",
      publicRepos: 15,
      followers: 90,
      following: 30,
      accessToken: encryptToken("gho_test_token_sample"),
      scope: "read:user,public_repo",
      isConnected: true,
      repositories: [
        {
          githubRepoId: 901,
          name: "devorbit",
          fullName: "falak-dev/devorbit",
          description: "Developer collaboration platform",
          htmlUrl: "https://github.com/falak-dev/devorbit",
          language: "TypeScript",
          stars: 120,
          forks: 35,
          openIssues: 4,
          updatedAt: new Date(),
        },
      ],
      languageDistribution: [
        { language: "TypeScript", totalBytes: 250000, repoCount: 8, percentage: 60, color: "#3178c6" },
        { language: "JavaScript", totalBytes: 100000, repoCount: 4, percentage: 40, color: "#f1e05a" },
      ],
      activity: {
        totalCommitsObserved: 64,
        totalPullRequestsObserved: 12,
        totalIssuesObserved: 5,
        recentCommits: [
          {
            sha: "a1b2c3d",
            message: "feat: GitHub OAuth integration",
            date: new Date(),
            repoName: "devorbit",
            commitUrl: "https://github.com/falak-dev/devorbit/commit/a1b2c3d",
          },
        ],
        pullRequests: [
          {
            id: 88,
            number: 3,
            title: "OAuth 2.0 Integration",
            state: "merged",
            url: "https://github.com/falak-dev/devorbit/pull/3",
            repoName: "devorbit",
            createdAt: new Date(),
            mergedAt: new Date(),
          },
        ],
      },
      skillsObserved: [
        {
          skill: "TypeScript",
          strength: "Demonstrated",
          evidence: "Validated across 8 repositories with active commits.",
          repoCount: 8,
          repos: ["devorbit"],
        },
      ],
    });

    // Check GET /api/github/status now
    const connectedStatusRes = await fetch(`${baseUrl}/api/github/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const connectedStatus = await connectedStatusRes.json();
    if (!connectedStatus.isConnected || connectedStatus.username !== "falak-dev") {
      throw new Error(`Expected isConnected: true with username: falak-dev, got ${JSON.stringify(connectedStatus)}`);
    }
    console.log("✓ GET /api/github/status returned isConnected: true with authenticated profile.");

    // Check GET /api/github/profile
    const profileRes = await fetch(`${baseUrl}/api/github/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileData = await profileRes.json();
    if (!profileData.profile || profileData.profile.username !== "falak-dev") {
      throw new Error(`Profile fetch failed: ${JSON.stringify(profileData)}`);
    }
    console.log("✓ GET /api/github/profile returned public profile data safely.");

    // Check GET /api/github/repositories
    const reposRes = await fetch(`${baseUrl}/api/github/repositories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reposData = await reposRes.json();
    if (!reposData.repositories || reposData.repositories.length === 0) {
      throw new Error(`Repositories fetch failed: ${JSON.stringify(reposData)}`);
    }
    console.log("✓ GET /api/github/repositories returned stored repositories.");

    // Check GET /api/github/activity
    const actRes = await fetch(`${baseUrl}/api/github/activity`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const actData = await actRes.json();
    if (!actData.activity || actData.activity.recentCommits?.length === 0) {
      throw new Error(`Activity fetch failed: ${JSON.stringify(actData)}`);
    }
    console.log("✓ GET /api/github/activity returned commits and pull requests.");

    // Check GET /api/github/insights
    const insRes = await fetch(`${baseUrl}/api/github/insights`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const insData = await insRes.json();
    if (!insData.insights || insData.insights.metrics?.totalStars !== 120) {
      throw new Error(`Insights fetch failed: ${JSON.stringify(insData)}`);
    }
    console.log("✓ GET /api/github/insights returned complete dashboard aggregates.");

    // 8. Test DELETE /api/github/disconnect
    const discRes = await fetch(`${baseUrl}/api/github/disconnect`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const discData = await discRes.json();
    if (!discData.success) {
      throw new Error(`Disconnect failed: ${JSON.stringify(discData)}`);
    }
    console.log("✓ DELETE /api/github/disconnect successfully disconnected GitHub account.");

    // Verify status is now disconnected
    const postDiscStatus = await fetch(`${baseUrl}/api/github/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postDiscData = await postDiscStatus.json();
    if (postDiscData.isConnected !== false) {
      throw new Error(`Expected isConnected: false after disconnect, got ${JSON.stringify(postDiscData)}`);
    }
    console.log("✓ Verification: Status is now disconnected.");

    console.log("\n==========================================");
    console.log("ALL 9 GITHUB API HTTP ENDPOINT TESTS PASSED!");
    console.log("==========================================");

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ ROUTE TEST FAILED:", err);
    if (server) server.close();
    process.exit(1);
  }
};

runRouteTests();
