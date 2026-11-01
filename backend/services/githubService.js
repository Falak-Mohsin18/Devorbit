const {
  encryptToken,
  decryptToken,
  generateOAuthState,
  verifyOAuthState,
} = require("../utils/encryption");
const GitHubIntegration = require("../models/GitHubIntegration");
const User = require("../models/User");

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_OAUTH_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token";

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Solidity: "#AA6746",
  SQL: "#e38c00",
};

const getLanguageColor = (language) => {
  if (!language) return "#8d6bff";
  return LANGUAGE_COLORS[language] || "#8d6bff";
};

/**
 * Standard headers for GitHub REST API requests
 */
const getHeaders = (accessToken) => {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevOrbit-Platform/1.0",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

/**
 * Generate GitHub OAuth Authorization URL with state verification
 */
const getOAuthUrl = (userId, customCallbackUrl = null) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl =
    customCallbackUrl ||
    process.env.GITHUB_CALLBACK_URL ||
    "http://localhost:5000/api/github/callback";

  if (!clientId) {
    throw new Error(
      "GITHUB_CLIENT_ID is not configured in backend environment variables."
    );
  }

  const state = generateOAuthState(userId);
  // Using minimal necessary permissions: read:user (profile) and public_repo (public repo/commits/languages)
  const scope = "read:user,public_repo";

  const url = new URL(GITHUB_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  return {
    url: url.toString(),
    state,
  };
};

/**
 * Exchange OAuth authorization code for GitHub access token
 */
const exchangeCodeForAccessToken = async (code) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ||
    "http://localhost:5000/api/github/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "GitHub OAuth Client ID or Client Secret is missing in environment variables."
    );
  }

  const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "DevOrbit-Platform/1.0",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(
      data.error_description || data.error || "GitHub token exchange failed."
    );
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    scope: data.scope,
  };
};

/**
 * Fetch authenticated GitHub user's profile
 */
const fetchUserProfile = async (accessToken) => {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(accessToken),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("GitHub token has expired or was revoked.");
    }
    throw new Error(`Failed to fetch GitHub profile: status ${response.status}`);
  }

  return await response.json();
};

/**
 * Fetch public & authenticated user repositories
 */
const fetchUserRepositories = async (accessToken) => {
  // Fetch up to 100 recent repos owned by user
  const response = await fetch(
    `${GITHUB_API_BASE}/user/repos?per_page=100&sort=updated&type=owner`,
    {
      headers: getHeaders(accessToken),
    }
  );

  if (!response.ok) {
    console.warn(`Could not fetch repositories: status ${response.status}`);
    return [];
  }

  const rawRepos = await response.json();
  if (!Array.isArray(rawRepos)) return [];

  return rawRepos;
};

/**
 * Fetch language breakdown (byte count) for a specific repository
 */
const fetchRepoLanguages = async (accessToken, owner, repoName) => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/languages`,
      {
        headers: getHeaders(accessToken),
      }
    );

    if (!response.ok) {
      return {};
    }

    return await response.json();
  } catch (err) {
    console.warn(`Failed to fetch languages for ${owner}/${repoName}:`, err.message);
    return {};
  }
};

/**
 * Fetch user's public activity events (commits, PRs, issues)
 */
const fetchUserEvents = async (accessToken, username) => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/events?per_page=60`,
      {
        headers: getHeaders(accessToken),
      }
    );

    if (!response.ok) {
      console.warn(`Could not fetch GitHub events: status ${response.status}`);
      return [];
    }

    const events = await response.json();
    return Array.isArray(events) ? events : [];
  } catch (err) {
    console.warn("Failed to fetch GitHub events:", err.message);
    return [];
  }
};

/**
 * Normalize topics / keywords into skill names
 */
const normalizeTopicToSkill = (topic) => {
  const map = {
    react: "React",
    reactjs: "React",
    nextjs: "Next.js",
    nodejs: "Node.js",
    node: "Node.js",
    express: "Express.js",
    expressjs: "Express.js",
    mongodb: "MongoDB",
    graphql: "GraphQL",
    docker: "Docker",
    kubernetes: "Kubernetes",
    tailwind: "TailwindCSS",
    tailwindcss: "TailwindCSS",
    typescript: "TypeScript",
    javascript: "JavaScript",
    python: "Python",
    fastapi: "FastAPI",
    django: "Django",
    rust: "Rust",
    golang: "Go",
    postgres: "PostgreSQL",
    postgresql: "PostgreSQL",
    redis: "Redis",
    aws: "AWS",
    serverless: "Serverless",
    redux: "Redux",
    restapi: "REST APIs",
    "rest-api": "REST APIs",
    microservices: "Microservices",
    jest: "Jest",
    ci: "CI/CD",
  };

  return map[topic.toLowerCase()] || null;
};

/**
 * Synthesize raw repositories, language bytes, and events into structured metrics,
 * language distribution, and verified skills
 */
const synthesizeGitHubData = async (accessToken, userProfile, rawRepos, events) => {
  const username = userProfile.login;

  // 1. Process Repositories & Fetch Top Languages
  const repositories = [];
  const languageByteAggregates = {};
  let totalBytesAllLanguages = 0;
  const languageRepoCount = {};

  // Sort raw repos by updated date
  const sortedRawRepos = [...rawRepos].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Take top 20 active non-fork repos for deep language inspection to stay well within rate limits
  const topReposToInspect = sortedRawRepos.filter((r) => !r.fork).slice(0, 20);

  // Fetch languages in batches of 5 to avoid throttling
  const repoLanguagesMap = new Map();
  for (let i = 0; i < topReposToInspect.length; i += 5) {
    const chunk = topReposToInspect.slice(i, i + 5);
    await Promise.all(
      chunk.map(async (repo) => {
        const langData = await fetchRepoLanguages(accessToken, repo.owner.login, repo.name);
        repoLanguagesMap.set(repo.id, langData);
      })
    );
  }

  for (const repo of sortedRawRepos) {
    const langBreakdown = repoLanguagesMap.get(repo.id) || {};
    const repoTotalBytes = Object.values(langBreakdown).reduce((sum, b) => sum + Number(b), 0);

    const formattedLangs = Object.entries(langBreakdown).map(([lang, bytes]) => {
      const pct = repoTotalBytes > 0 ? Math.round((Number(bytes) / repoTotalBytes) * 100) : 0;
      languageByteAggregates[lang] = (languageByteAggregates[lang] || 0) + Number(bytes);
      totalBytesAllLanguages += Number(bytes);
      languageRepoCount[lang] = (languageRepoCount[lang] || 0) + 1;
      return {
        language: lang,
        bytes: Number(bytes),
        percentage: pct,
      };
    });

    // If no language byte breakdown was fetched, count primary language
    if (formattedLangs.length === 0 && repo.language) {
      languageRepoCount[repo.language] = (languageRepoCount[repo.language] || 0) + 1;
    }

    repositories.push({
      githubRepoId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || "",
      htmlUrl: repo.html_url,
      isFork: Boolean(repo.fork),
      language: repo.language || "",
      languages: formattedLangs,
      stars: Number(repo.stargazers_count) || 0,
      forks: Number(repo.forks_count) || 0,
      openIssues: Number(repo.open_issues_count) || 0,
      defaultBranch: repo.default_branch || "main",
      visibility: repo.visibility || (repo.private ? "private" : "public"),
      createdAt: repo.created_at ? new Date(repo.created_at) : null,
      updatedAt: repo.updated_at ? new Date(repo.updated_at) : null,
      pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
    });
  }

  // 2. Compute Language Distribution
  const languageDistribution = [];
  if (totalBytesAllLanguages > 0) {
    for (const [lang, bytes] of Object.entries(languageByteAggregates)) {
      const pct = Math.round((bytes / totalBytesAllLanguages) * 100);
      languageDistribution.push({
        language: lang,
        totalBytes: bytes,
        repoCount: languageRepoCount[lang] || 1,
        percentage: pct,
        color: getLanguageColor(lang),
      });
    }
  } else {
    // Fall back to repo counts if byte metrics were unavailable
    const totalWithLang = Object.values(languageRepoCount).reduce((s, c) => s + c, 0);
    for (const [lang, count] of Object.entries(languageRepoCount)) {
      const pct = totalWithLang > 0 ? Math.round((count / totalWithLang) * 100) : 0;
      languageDistribution.push({
        language: lang,
        totalBytes: 0,
        repoCount: count,
        percentage: pct,
        color: getLanguageColor(lang),
      });
    }
  }

  languageDistribution.sort((a, b) => b.percentage - a.percentage || b.repoCount - a.repoCount);

  // 3. Process Activity (Commits, Pull Requests, Events)
  const recentCommits = [];
  const pullRequests = [];
  const recentEvents = [];
  let totalCommitsObserved = 0;
  let totalPullRequestsObserved = 0;
  let totalIssuesObserved = 0;

  for (const event of events) {
    const repoShort = event.repo?.name ? event.repo.name.split("/")[1] || event.repo.name : "";
    const repoUrl = event.repo?.name ? `https://github.com/${event.repo.name}` : "";

    recentEvents.push({
      id: String(event.id),
      type: event.type,
      repoName: repoShort,
      createdAt: event.created_at ? new Date(event.created_at) : new Date(),
    });

    if (event.type === "PushEvent" && event.payload?.commits) {
      for (const c of event.payload.commits) {
        totalCommitsObserved++;
        if (recentCommits.length < 25) {
          recentCommits.push({
            sha: c.sha ? c.sha.slice(0, 7) : "",
            message: c.message ? c.message.split("\n")[0] : "Code update",
            date: event.created_at ? new Date(event.created_at) : new Date(),
            repoName: repoShort,
            repoUrl,
            commitUrl: c.url
              ? c.url.replace("api.github.com/repos", "github.com").replace("/commits/", "/commit/")
              : `${repoUrl}/commit/${c.sha}`,
          });
        }
      }
    }

    if (event.type === "PullRequestEvent" && event.payload?.pull_request) {
      totalPullRequestsObserved++;
      const pr = event.payload.pull_request;
      if (pullRequests.length < 15) {
        pullRequests.push({
          id: pr.id,
          number: pr.number,
          title: pr.title || "",
          state: pr.merged ? "merged" : pr.state || "open",
          url: pr.html_url || "",
          repoName: repoShort,
          createdAt: pr.created_at ? new Date(pr.created_at) : new Date(),
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        });
      }
    }

    if (event.type === "IssuesEvent") {
      totalIssuesObserved++;
    }
  }

  // 4. Derive Verified Skills
  // Critical DevOrbit principle: Never claim complete proficiency merely because a language appears in a repo.
  // Evaluate multi-project depth and commit signals:
  // - Demonstrated: >= 3 repos OR (>= 2 repos with recent commits)
  // - Practiced: >= 2 repos OR 1 repo with active commits
  // - Emerging: 1 repo
  const skillMap = new Map();

  for (const repo of sortedRawRepos) {
    if (repo.language) {
      const existing = skillMap.get(repo.language) || { repos: new Set(), hasRecentCommit: false };
      existing.repos.add(repo.name);
      skillMap.set(repo.language, existing);
    }

    if (Array.isArray(repo.topics)) {
      for (const t of repo.topics) {
        const normalized = normalizeTopicToSkill(t);
        if (normalized) {
          const existing = skillMap.get(normalized) || { repos: new Set(), hasRecentCommit: false };
          existing.repos.add(repo.name);
          skillMap.set(normalized, existing);
        }
      }
    }
  }

  // Check which repos have recent commits
  for (const c of recentCommits) {
    for (const [skill, val] of skillMap.entries()) {
      if (val.repos.has(c.repoName)) {
        val.hasRecentCommit = true;
      }
    }
  }

  const skillsObserved = [];
  for (const [skill, val] of skillMap.entries()) {
    const reposList = Array.from(val.repos);
    const count = reposList.length;
    let strength = "Practiced";
    let evidence = "";

    if (count >= 3 || (count >= 2 && val.hasRecentCommit)) {
      strength = "Demonstrated";
      evidence = `Validated across ${count} public repositories (${reposList.slice(0, 2).join(", ")}${
        count > 2 ? "..." : ""
      }) with active codebase commits.`;
    } else if (count >= 2 || val.hasRecentCommit) {
      strength = "Practiced";
      evidence = `Implemented in ${count} repositories (${reposList.join(", ")}) with concrete git activity.`;
    } else {
      strength = "Emerging";
      evidence = `Present in repository '${reposList[0]}'. Requires further multi-project depth.`;
    }

    skillsObserved.push({
      skill,
      strength,
      evidence,
      repoCount: count,
      repos: reposList.slice(0, 4),
    });
  }

  skillsObserved.sort((a, b) => b.repoCount - a.repoCount);

  return {
    repositories,
    languageDistribution,
    activity: {
      recentCommits,
      pullRequests,
      recentEvents: recentEvents.slice(0, 30),
      totalCommitsObserved,
      totalPullRequestsObserved,
      totalIssuesObserved,
    },
    skillsObserved,
  };
};

/**
 * Execute full synchronization for a connected user
 * Fetches fresh profile, repos, languages, events from GitHub REST API
 * and updates MongoDB.
 */
const syncGitHubDataForUser = async (userId) => {
  const integration = await GitHubIntegration.findOne({ user: userId }).select(
    "+accessToken.encrypted +accessToken.iv +accessToken.tag"
  );

  if (!integration) {
    throw new Error("No connected GitHub account found for this user.");
  }

  if (!integration.isConnected) {
    throw new Error("GitHub integration has been disconnected.");
  }

  const decryptedToken = decryptToken(integration.accessToken);
  if (!decryptedToken) {
    throw new Error("Could not decrypt GitHub access token. Reconnection required.");
  }

  // 1. Fetch fresh user profile
  const userProfile = await fetchUserProfile(decryptedToken);

  // 2. Fetch fresh repositories
  const rawRepos = await fetchUserRepositories(decryptedToken);

  // 3. Fetch fresh user events
  const events = await fetchUserEvents(decryptedToken, userProfile.login);

  // 4. Synthesize all data
  const synthesized = await synthesizeGitHubData(
    decryptedToken,
    userProfile,
    rawRepos,
    events
  );

  // 5. Update MongoDB Integration Document
  integration.name = userProfile.name || integration.name || "";
  integration.bio = userProfile.bio || integration.bio || "";
  integration.company = userProfile.company || integration.company || "";
  integration.location = userProfile.location || integration.location || "";
  integration.avatarUrl = userProfile.avatar_url || integration.avatarUrl;
  integration.profileUrl = userProfile.html_url || integration.profileUrl;
  integration.publicRepos = Number(userProfile.public_repos) || rawRepos.length;
  integration.followers = Number(userProfile.followers) || 0;
  integration.following = Number(userProfile.following) || 0;
  integration.repositories = synthesized.repositories;
  integration.languageDistribution = synthesized.languageDistribution;
  integration.activity = synthesized.activity;
  integration.skillsObserved = synthesized.skillsObserved;
  integration.lastSyncedAt = new Date();
  integration.isConnected = true;

  await integration.save();

  // Also sync User profile github field
  await User.findByIdAndUpdate(userId, {
    github: userProfile.login,
  });

  return integration;
};

/**
 * Connect and initialize GitHub integration after OAuth authorization
 */
const completeOAuthConnection = async (userId, accessToken, scope) => {
  // Fetch user profile from GitHub
  const profile = await fetchUserProfile(accessToken);
  const githubId = String(profile.id);

  // Check if this GitHub account ID is already connected to another user
  const existingForOtherUser = await GitHubIntegration.findOne({
    githubId,
    user: { $ne: userId },
    isConnected: true,
  });

  if (existingForOtherUser) {
    throw new Error(
      `This GitHub account (@${profile.login}) is already linked to another DevOrbit account.`
    );
  }

  // Encrypt the access token
  const encryptedToken = encryptToken(accessToken);

  // Find or create integration document
  let integration = await GitHubIntegration.findOne({ user: userId }).select(
    "+accessToken.encrypted +accessToken.iv +accessToken.tag"
  );

  if (!integration) {
    integration = new GitHubIntegration({
      user: userId,
      githubId,
      username: profile.login,
      name: profile.name || "",
      bio: profile.bio || "",
      company: profile.company || "",
      location: profile.location || "",
      avatarUrl: profile.avatar_url || "",
      profileUrl: profile.html_url || "",
      publicRepos: Number(profile.public_repos) || 0,
      followers: Number(profile.followers) || 0,
      following: Number(profile.following) || 0,
      accessToken: encryptedToken,
      scope: scope || "read:user,public_repo",
      isConnected: true,
      lastSyncedAt: new Date(),
    });
  } else {
    integration.githubId = githubId;
    integration.username = profile.login;
    integration.name = profile.name || integration.name || "";
    integration.bio = profile.bio || integration.bio || "";
    integration.company = profile.company || integration.company || "";
    integration.location = profile.location || integration.location || "";
    integration.avatarUrl = profile.avatar_url || integration.avatarUrl;
    integration.profileUrl = profile.html_url || integration.profileUrl;
    integration.publicRepos = Number(profile.public_repos) || integration.publicRepos;
    integration.followers = Number(profile.followers) || integration.followers;
    integration.following = Number(profile.following) || integration.following;
    integration.accessToken = encryptedToken;
    integration.scope = scope || integration.scope;
    integration.isConnected = true;
    integration.lastSyncedAt = new Date();
  }

  await integration.save();

  // Update user profile github handle
  await User.findByIdAndUpdate(userId, {
    github: profile.login,
  });

  // Perform initial data synchronization
  try {
    const rawRepos = await fetchUserRepositories(accessToken);
    const events = await fetchUserEvents(accessToken, profile.login);
    const synthesized = await synthesizeGitHubData(
      accessToken,
      profile,
      rawRepos,
      events
    );

    integration.repositories = synthesized.repositories;
    integration.languageDistribution = synthesized.languageDistribution;
    integration.activity = synthesized.activity;
    integration.skillsObserved = synthesized.skillsObserved;
    integration.lastSyncedAt = new Date();

    await integration.save();
  } catch (syncErr) {
    console.warn("Initial sync encountered a non-fatal warning:", syncErr.message);
  }

  return {
    integration,
    profile,
  };
};

/**
 * Disconnect GitHub integration for a user
 */
const disconnectGitHubAccount = async (userId) => {
  const integration = await GitHubIntegration.findOne({ user: userId });
  if (integration) {
    integration.isConnected = false;
    integration.accessToken = {
      encrypted: "",
      iv: "",
      tag: "",
    };
    await integration.save();
  }

  // Update User profile
  await User.findByIdAndUpdate(userId, {
    github: "",
  });

  return true;
};

module.exports = {
  getOAuthUrl,
  exchangeCodeForAccessToken,
  fetchUserProfile,
  fetchUserRepositories,
  fetchRepoLanguages,
  fetchUserEvents,
  synthesizeGitHubData,
  syncGitHubDataForUser,
  completeOAuthConnection,
  disconnectGitHubAccount,
};
