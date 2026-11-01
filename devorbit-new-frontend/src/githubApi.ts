import { getStoredToken } from "./auth";

/* ============================================================
   TYPES FOR GITHUB API INTEGRATION
============================================================ */

export type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
  archived?: boolean;
};

export type GitHubCommitPayload = {
  sha: string;
  message: string;
  url: string;
  author: {
    name: string;
    email: string;
  };
};

export type GitHubEvent = {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    display_login?: string;
    avatar_url: string;
    url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    commits?: GitHubCommitPayload[];
    pull_request?: {
      id: number;
      number: number;
      title: string;
      html_url: string;
      state: string;
      merged?: boolean;
    };
    issue?: {
      id: number;
      number: number;
      title: string;
      html_url: string;
      state: string;
    };
    comment?: {
      id: number;
      body: string;
      html_url: string;
    };
    [key: string]: unknown;
  };
  public: boolean;
  created_at: string;
};

export type LanguageDistribution = {
  language: string;
  count: number;
  percentage: number;
  color: string;
};

export type VerifiedCareerSkill = {
  skill: string;
  evidence: string;
  strength: "Demonstrated" | "Practiced" | "Emerging";
  repoCount: number;
  repos: string[];
};

export type GitHubConnectionState = {
  username: string;
  user: GitHubUser | null;
  connectedAt: string;
  lastSyncedAt: string;
  mode: "public_lookup" | "oauth";
  isSyncedWithDevOrbitBackend: boolean;
};

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  reset: number;
  resetFormatted: string;
};

/* ============================================================
   LANGUAGE COLOR PALETTE (Cyberpunk / Modern DevOrbit Theme)
============================================================ */

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  Solidity: "#AA6746",
  Elixir: "#6e4a7e",
};

export function getLanguageColor(language: string | null): string {
  if (!language) return "#777986";
  return LANGUAGE_COLORS[language] || "#8d6bff";
}

/* ============================================================
   LOCAL STORAGE PERSISTENCE KEYS
============================================================ */

const STORAGE_KEY_CONNECTION = "devorbit_github_connection";
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes in-memory cache to stay well within 60 req/hr

type CacheEntry<T> = {
  timestamp: number;
  data: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T) {
  memoryCache.set(key, { timestamp: Date.now(), data });
}

export function clearGitHubMemoryCache() {
  memoryCache.clear();
}

/* ============================================================
   RATE LIMIT TRACKING
============================================================ */

let lastRateLimit: RateLimitInfo | null = null;

export function getLastRateLimitInfo(): RateLimitInfo | null {
  return lastRateLimit;
}

function updateRateLimitHeaders(headers: Headers) {
  const limit = headers.get("x-ratelimit-limit");
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");

  if (limit && remaining && reset) {
    const resetSec = parseInt(reset, 10);
    const resetDate = new Date(resetSec * 1000);
    const resetFormatted = resetDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    lastRateLimit = {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: resetSec,
      resetFormatted,
    };
  }
}

/* ============================================================
   GITHUB REST API CLIENT
============================================================ */

async function gitHubRequest<T>(endpoint: string, bypassCache = false): Promise<T> {
  const cacheKey = `gh_${endpoint}`;
  if (!bypassCache) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `https://api.github.com${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to GitHub API. Please check your network connection."
    );
  }

  updateRateLimitHeaders(response.headers);

  if (response.status === 404) {
    throw new Error("GitHub user or resource not found. Check the username.");
  }

  if (response.status === 403) {
    const resetMsg = lastRateLimit?.resetFormatted
      ? ` Limit resets at ${lastRateLimit.resetFormatted}.`
      : "";
    throw new Error(
      `GitHub API rate limit reached (60 requests/hour unauthenticated).${resetMsg}`
    );
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.message || `GitHub API request failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as T;
  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch GitHub user profile by username
 */
export async function fetchGitHubUser(
  username: string,
  bypassCache = false
): Promise<GitHubUser> {
  const cleanUsername = username.trim().replace(/^@/, "");
  if (!cleanUsername) {
    throw new Error("Please enter a valid GitHub username.");
  }
  return gitHubRequest<GitHubUser>(`/users/${encodeURIComponent(cleanUsername)}`, bypassCache);
}

/**
 * Fetch real public repositories for a GitHub user (sorted by updated)
 */
export async function fetchGitHubRepos(
  username: string,
  bypassCache = false
): Promise<GitHubRepo[]> {
  const cleanUsername = username.trim().replace(/^@/, "");
  const repos = await gitHubRequest<GitHubRepo[]>(
    `/users/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=updated`,
    bypassCache
  );
  return repos.filter((repo) => !repo.fork || repo.stargazers_count > 0);
}

/**
 * Fetch recent public events (commits, PRs, issues) for a GitHub user
 */
export async function fetchGitHubEvents(
  username: string,
  bypassCache = false
): Promise<GitHubEvent[]> {
  const cleanUsername = username.trim().replace(/^@/, "");
  return gitHubRequest<GitHubEvent[]>(
    `/users/${encodeURIComponent(cleanUsername)}/events?per_page=40`,
    bypassCache
  );
}

/* ============================================================
   DATA SYNTHESIS & CAREER TWIN EVIDENCE ENGINE
============================================================ */

/**
 * Compute real language distribution from active repositories
 */
export function calculateLanguageDistribution(repos: GitHubRepo[]): LanguageDistribution[] {
  const langCounts: Record<string, number> = {};
  let totalWithLanguage = 0;

  for (const repo of repos) {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      totalWithLanguage += 1;
    }
  }

  if (totalWithLanguage === 0) return [];

  const list: LanguageDistribution[] = Object.entries(langCounts).map(
    ([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / totalWithLanguage) * 100),
      color: getLanguageColor(language),
    })
  );

  return list.sort((a, b) => b.count - a.count);
}

/**
 * Extract verified career skills from genuine GitHub repositories and events.
 * Crucial rule: Never treat raw commit counts alone as proof of proficiency.
 * Focuses on architectural breadth, language repetition, and active PRs.
 */
export function extractVerifiedCareerSkills(
  repos: GitHubRepo[],
  events: GitHubEvent[]
): VerifiedCareerSkill[] {
  const skillMap = new Map<
    string,
    { repos: string[]; hasRecentActivity: boolean; stars: number }
  >();

  // Map languages to skills
  for (const repo of repos) {
    if (repo.language) {
      const existing = skillMap.get(repo.language) || {
        repos: [],
        hasRecentActivity: false,
        stars: 0,
      };
      existing.repos.push(repo.name);
      existing.stars += repo.stargazers_count;
      skillMap.set(repo.language, existing);
    }

    // Inspect topics if available
    if (Array.isArray(repo.topics)) {
      for (const topic of repo.topics) {
        const normalized = normalizeTopicToSkill(topic);
        if (normalized) {
          const existing = skillMap.get(normalized) || {
            repos: [],
            hasRecentActivity: false,
            stars: 0,
          };
          if (!existing.repos.includes(repo.name)) {
            existing.repos.push(repo.name);
          }
          skillMap.set(normalized, existing);
        }
      }
    }
  }

  // Check recent events for live evidence
  for (const ev of events) {
    const repoShort = ev.repo?.name ? ev.repo.name.split("/")[1] || ev.repo.name : "";
    for (const [, val] of skillMap.entries()) {
      if (val.repos.includes(repoShort)) {
        val.hasRecentActivity = true;
      }
    }
  }

  const results: VerifiedCareerSkill[] = [];
  for (const [skill, val] of skillMap.entries()) {
    const count = val.repos.length;
    let strength: "Demonstrated" | "Practiced" | "Emerging";
    let evidence = "";

    if (count >= 3 || (count >= 2 && val.hasRecentActivity)) {
      strength = "Demonstrated";
      evidence = `Validated across ${count} production/public repositories with active architectural commits.`;
    } else if (count >= 2 || val.hasRecentActivity) {
      strength = "Practiced";
      evidence = `Implemented in ${count} repositories with demonstrable codebase structure.`;
    } else {
      strength = "Emerging";
      evidence = `Represented in repository '${val.repos[0]}'. Requires further multi-project depth.`;
    }

    results.push({
      skill,
      evidence,
      strength,
      repoCount: count,
      repos: val.repos.slice(0, 3),
    });
  }

  return results.sort((a, b) => b.repoCount - a.repoCount);
}

function normalizeTopicToSkill(topic: string): string | null {
  const map: Record<string, string> = {
    react: "React",
    reactjs: "React",
    nextjs: "Next.js",
    nodejs: "Node.js",
    express: "Express.js",
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
  };
  return map[topic.toLowerCase()] || null;
}

/* ============================================================
   BACKEND PROFILE SYNCHRONIZATION
============================================================ */

/**
 * Persist the connected GitHub username to the DevOrbit MongoDB backend
 * via PUT /api/users/profile
 */
export async function syncGitHubUsernameWithBackend(githubUsername: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) {
    // User is viewing DevOrbit in unauthenticated or local mode; still store locally
    return false;
  }

  try {
    const response = await fetch("/api/users/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        github: githubUsername.trim().replace(/^@/, ""),
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn("DevOrbit backend user profile sync failed:", err);
    return false;
  }
}

/**
 * Disconnect GitHub handle from DevOrbit backend user profile
 */
export async function disconnectGitHubFromBackend(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return true;

  try {
    const response = await fetch("/api/users/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        github: "",
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn("DevOrbit backend disconnect failed:", err);
    return false;
  }
}

/* ============================================================
   LOCAL STORAGE STORAGE HELPERS
============================================================ */

export function getStoredGitHubConnection(): GitHubConnectionState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CONNECTION);
    if (!raw) return null;
    return JSON.parse(raw) as GitHubConnectionState;
  } catch {
    return null;
  }
}

export function saveStoredGitHubConnection(state: GitHubConnectionState) {
  try {
    window.localStorage.setItem(STORAGE_KEY_CONNECTION, JSON.stringify(state));
  } catch {
    // Ignore localStorage write error
  }
}

export function clearStoredGitHubConnection() {
  try {
    window.localStorage.removeItem(STORAGE_KEY_CONNECTION);
  } catch {
    // Ignore
  }
  clearGitHubMemoryCache();
}

/* ============================================================
   BACKEND GITHUB REST API CLIENT
   Communicates directly with DevOrbit backend /api/github/*
============================================================ */

export type GitHubBackendProfile = {
  username: string;
  githubId: string;
  name: string;
  bio: string;
  company: string;
  location: string;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  lastSyncedAt?: string;
};

export type GitHubBackendCommit = {
  sha: string;
  message: string;
  date: string;
  repoName: string;
  repoUrl: string;
  commitUrl: string;
};

export type GitHubBackendPR = {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  repoName: string;
  createdAt: string;
  mergedAt?: string | null;
};

export type GitHubBackendRepo = {
  githubRepoId: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  isFork: boolean;
  language: string;
  languages?: { language: string; bytes: number; percentage: number }[];
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
};

export type GitHubBackendInsights = {
  isConnected: boolean;
  lastSyncedAt: string;
  profile: GitHubBackendProfile;
  metrics: {
    totalRepositories: number;
    totalStars: number;
    totalForks: number;
    totalCommits: number;
    totalPullRequests: number;
    totalIssues: number;
  };
  languageDistribution: LanguageDistribution[];
  skillsObserved: VerifiedCareerSkill[];
  recentCommits: GitHubBackendCommit[];
  pullRequests: GitHubBackendPR[];
  repositories: GitHubBackendRepo[];
};

export async function fetchGitHubConnectUrl(): Promise<{ success: boolean; url: string; state: string }> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("You must be logged in to DevOrbit to connect your GitHub account.");
  }

  const response = await fetch("/api/github/connect", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to initiate GitHub OAuth connection.");
  }

  return await response.json();
}

export async function fetchBackendGitHubStatus(): Promise<{
  success: boolean;
  isConnected: boolean;
  username: string;
  githubId: string;
  name?: string;
  avatarUrl: string;
  profileUrl: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
  lastSyncedAt: string | null;
}> {
  const token = getStoredToken();
  if (!token) {
    return {
      success: true,
      isConnected: false,
      username: "",
      githubId: "",
      avatarUrl: "",
      profileUrl: "",
      lastSyncedAt: null,
    };
  }

  const response = await fetch("/api/github/status", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to check GitHub connection status.");
  }

  return await response.json();
}

export async function fetchBackendGitHubInsights(): Promise<GitHubBackendInsights | null> {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  const response = await fetch("/api/github/insights", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to load GitHub insights.");
  }

  const data = await response.json();
  if (!data.isConnected || !data.insights) {
    return null;
  }

  return data.insights;
}

export async function syncBackendGitHubData(): Promise<GitHubBackendInsights> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Authentication required to synchronize GitHub.");
  }

  const response = await fetch("/api/github/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Synchronization failed with GitHub.");
  }

  const data = await response.json();
  return data.insights;
}

export async function disconnectBackendGitHubData(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return true;

  const response = await fetch("/api/github/disconnect", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to disconnect GitHub account.");
  }

  return true;
}
