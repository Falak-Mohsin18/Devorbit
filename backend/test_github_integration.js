const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const GitHubIntegration = require("./models/GitHubIntegration");
const {
  encryptToken,
  decryptToken,
  generateOAuthState,
  verifyOAuthState,
} = require("./utils/encryption");
const { buildCareerTwinData } = require("./services/careerTwinService");
const { generateCareerTwin } = require("./ai/aiService");

const runTests = async () => {
  console.log("==================================================");
  console.log("RUNNING COMPLETE DEVORBIT GITHUB INTEGRATION TESTS");
  console.log("==================================================");

  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/devorbit");
    console.log("✓ MongoDB Connected");

    // 2. Encryption and Decryption Test
    console.log("\n--- Testing AES-256-GCM Token Encryption ---");
    const testToken = "gho_testToken1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptToken(testToken);
    console.log("✓ Encrypted payload generated:", {
      hasEncrypted: Boolean(encrypted.encrypted),
      hasIv: Boolean(encrypted.iv),
      hasTag: Boolean(encrypted.tag),
    });

    const decrypted = decryptToken(encrypted);
    if (decrypted !== testToken) {
      throw new Error("Token decryption failed: decrypted text does not match original.");
    }
    console.log("✓ Decrypted token matches original exactly.");

    // 3. OAuth State Generation & Verification Test
    console.log("\n--- Testing Cryptographic OAuth State Validation ---");
    const testUserId = "6aa81987a46314195eb87158";
    const signedState = generateOAuthState(testUserId, { mode: "oauth" });
    console.log("✓ Generated signed state:", signedState.slice(0, 30) + "...");

    const verifiedPayload = verifyOAuthState(signedState);
    if (!verifiedPayload || verifiedPayload.userId !== testUserId) {
      throw new Error("OAuth state verification failed.");
    }
    console.log("✓ Verified OAuth state payload correctly:", verifiedPayload);

    // Tampered state test
    const tamperedState = signedState.slice(0, -5) + "abcde";
    const tamperedCheck = verifyOAuthState(tamperedState);
    if (tamperedCheck !== null) {
      throw new Error("Security failure: tampered state was accepted!");
    }
    console.log("✓ Tampered OAuth state correctly rejected.");

    // 4. Test User & Integration Schema in MongoDB
    console.log("\n--- Testing MongoDB GitHubIntegration Storage ---");
    let testUser = await User.findOne({ email: "falak@devorbit.io" });
    if (!testUser) {
      testUser = await User.findOne({});
    }

    if (!testUser) {
      throw new Error("No test user found in MongoDB to test integration.");
    }
    console.log(`✓ Using test user: ${testUser.name} (${testUser.email}, ID: ${testUser._id})`);

    // Clean up any old test integration
    await GitHubIntegration.deleteMany({ user: testUser._id });

    // Create realistic mock integration record simulating a completed GitHub sync
    const mockIntegration = new GitHubIntegration({
      user: testUser._id,
      githubId: "98765432",
      username: "falak-dev",
      name: "Falak Mohsin",
      bio: "Full-Stack developer building developer tools and reactive web systems.",
      company: "DevOrbit",
      location: "San Francisco, CA",
      avatarUrl: "https://avatars.githubusercontent.com/u/98765432?v=4",
      profileUrl: "https://github.com/falak-dev",
      publicRepos: 12,
      followers: 84,
      following: 42,
      accessToken: encryptToken("gho_simulated_oauth_access_token"),
      scope: "read:user,public_repo",
      isConnected: true,
      lastSyncedAt: new Date(),
      repositories: [
        {
          githubRepoId: 101,
          name: "devorbit-core",
          fullName: "falak-dev/devorbit-core",
          description: "Core collaboration and project telemetry platform",
          htmlUrl: "https://github.com/falak-dev/devorbit-core",
          language: "TypeScript",
          languages: [
            { language: "TypeScript", bytes: 145000, percentage: 65 },
            { language: "JavaScript", bytes: 55000, percentage: 25 },
            { language: "CSS", bytes: 22000, percentage: 10 },
          ],
          stars: 48,
          forks: 14,
          openIssues: 3,
          defaultBranch: "main",
          visibility: "public",
          updatedAt: new Date(),
        },
        {
          githubRepoId: 102,
          name: "telemetry-worker",
          fullName: "falak-dev/telemetry-worker",
          description: "High-throughput event ingestion service",
          htmlUrl: "https://github.com/falak-dev/telemetry-worker",
          language: "Go",
          languages: [
            { language: "Go", bytes: 98000, percentage: 85 },
            { language: "Dockerfile", bytes: 15000, percentage: 15 },
          ],
          stars: 22,
          forks: 5,
          openIssues: 1,
          defaultBranch: "main",
          visibility: "public",
          updatedAt: new Date(),
        },
      ],
      languageDistribution: [
        { language: "TypeScript", totalBytes: 145000, repoCount: 4, percentage: 48, color: "#3178c6" },
        { language: "JavaScript", totalBytes: 78000, repoCount: 5, percentage: 26, color: "#f1e05a" },
        { language: "Go", totalBytes: 98000, repoCount: 2, percentage: 18, color: "#00ADD8" },
        { language: "Python", totalBytes: 24000, repoCount: 1, percentage: 8, color: "#3572A5" },
      ],
      activity: {
        totalCommitsObserved: 38,
        totalPullRequestsObserved: 6,
        totalIssuesObserved: 2,
        recentCommits: [
          {
            sha: "7a1b9c2",
            message: "feat: add OAuth telemetry handler and state verification",
            date: new Date(),
            repoName: "devorbit-core",
            repoUrl: "https://github.com/falak-dev/devorbit-core",
            commitUrl: "https://github.com/falak-dev/devorbit-core/commit/7a1b9c2",
          },
          {
            sha: "3d4e5f6",
            message: "fix: resolve memory leak in pipeline worker pool",
            date: new Date(Date.now() - 86400000),
            repoName: "telemetry-worker",
            repoUrl: "https://github.com/falak-dev/telemetry-worker",
            commitUrl: "https://github.com/falak-dev/telemetry-worker/commit/3d4e5f6",
          },
        ],
        pullRequests: [
          {
            id: 201,
            number: 14,
            title: "Support AES-256 token encryption for GitHub credentials",
            state: "merged",
            url: "https://github.com/falak-dev/devorbit-core/pull/14",
            repoName: "devorbit-core",
            createdAt: new Date(),
            mergedAt: new Date(),
          },
        ],
      },
      skillsObserved: [
        {
          skill: "TypeScript",
          strength: "Demonstrated",
          evidence: "Validated across 4 repositories with active codebase commits.",
          repoCount: 4,
          repos: ["devorbit-core", "telemetry-worker"],
        },
        {
          skill: "Go",
          strength: "Practiced",
          evidence: "Implemented in 2 repositories with concrete git activity.",
          repoCount: 2,
          repos: ["telemetry-worker"],
        },
      ],
    });

    await mockIntegration.save();
    console.log("✓ GitHubIntegration document saved in MongoDB.");

    // Query back and test accessToken exclusion
    const retrieved = await GitHubIntegration.findOne({ user: testUser._id }).lean();
    if (retrieved.accessToken?.encrypted) {
      throw new Error("Security failure: accessToken was returned in default query!");
    }
    console.log("✓ Token security verified: accessToken is omitted from default queries.");

    // 5. Test CareerTwin Service Integration with GitHub
    console.log("\n--- Testing CareerTwin Integration with GitHub Data ---");
    const careerData = await buildCareerTwinData(testUser._id);

    if (!careerData.githubConnected) {
      throw new Error("CareerTwin did not detect connected GitHub account!");
    }
    console.log("✓ CareerTwin detected GitHub connection:", {
      githubConnected: careerData.githubConnected,
      username: careerData.githubData?.username,
      publicRepos: careerData.githubData?.publicRepos,
      languages: careerData.githubData?.languageDistribution?.length,
      commits: careerData.githubData?.activity?.totalCommitsObserved,
    });

    // Check that skillEvidence incorporated GitHub
    const tsSkill = careerData.skillEvidence?.find((s) => s.skill.toLowerCase() === "typescript");
    console.log("✓ TypeScript skill in CareerTwin evidence:", {
      found: Boolean(tsSkill),
      sources: tsSkill?.sources,
      evidenceType: tsSkill?.evidenceType,
      confidence: tsSkill?.confidence,
      evidenceStrength: tsSkill?.evidenceStrength,
    });

    // 6. Test Gemini / Fallback CareerTwin Generation
    console.log("\n--- Testing CareerTwin AI Assessment Output ---");
    const aiAssessment = await generateCareerTwin(careerData);
    console.log("✓ CareerTwin assessment generated:", {
      isFallback: aiAssessment._isFallback,
      careerReadiness: aiAssessment.careerReadiness,
      careerLevel: aiAssessment.careerLevel,
      summaryPreview: aiAssessment.summary?.slice(0, 120) + "...",
      strengthsCount: aiAssessment.strengths?.length,
    });

    // 7. Test Disconnect Flow
    console.log("\n--- Testing Disconnection Flow ---");
    mockIntegration.isConnected = false;
    mockIntegration.accessToken = { encrypted: "", iv: "", tag: "" };
    await mockIntegration.save();

    const disconnectedCareerData = await buildCareerTwinData(testUser._id);
    if (disconnectedCareerData.githubConnected) {
      throw new Error("CareerTwin still reported connected after disconnect!");
    }
    console.log("✓ When GitHub is disconnected, CareerTwin continues working smoothly with DevOrbit data only.");

    console.log("\n==================================================");
    console.log("ALL DEVORBIT GITHUB INTEGRATION TESTS PASSED 100%!");
    console.log("==================================================");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  }
};

runTests();
