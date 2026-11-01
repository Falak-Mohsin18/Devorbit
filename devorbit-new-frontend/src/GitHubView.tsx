import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  fetchBackendGitHubInsights,
  fetchGitHubConnectUrl,
  syncBackendGitHubData,
  disconnectBackendGitHubData,
  getLanguageColor,
  type GitHubBackendProfile,
  type GitHubBackendRepo,
  type GitHubBackendCommit,
  type GitHubBackendPR,
  type LanguageDistribution,
  type VerifiedCareerSkill,
} from "./githubApi";
import { getStoredToken } from "./auth";

/* ============================================================
   ICONS COMPONENT
============================================================ */

type IconName =
  | "github"
  | "sparkles"
  | "refresh"
  | "search"
  | "check"
  | "external"
  | "star"
  | "git-fork"
  | "git-pull-request"
  | "git-commit"
  | "alert-circle"
  | "activity"
  | "info"
  | "trash"
  | "link"
  | "code"
  | "filter"
  | "arrow-right"
  | "lock"
  | "globe"
  | "x";

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    github: (
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-5A3.9 3.9 0 0 1 6.8 8.6a3.6 3.6 0 0 1 .1-2.8s.8-.3 2.8 1a9.6 9.6 0 0 1 5.1 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.8 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.8-4.7 5 .4.3.7 1 .7 2V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    ),
    sparkles: (
      <>
        <path d="m12 2 1.2 4.1L17 8l-3.8 1.9L12 14l-1.2-4.1L7 8l3.8-1.9z" />
        <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21h5v-5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    external: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </>
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    "git-fork": (
      <>
        <circle cx="12" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
        <path d="M12 12v3" />
      </>
    ),
    "git-pull-request": (
      <>
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <line x1="6" y1="9" x2="6" y2="21" />
      </>
    ),
    "git-commit": (
      <>
        <circle cx="12" cy="12" r="4" />
        <line x1="1.05" y1="12" x2="7" y2="12" />
        <line x1="17.05" y1="12" x2="23" y2="12" />
      </>
    ),
    "alert-circle": (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
    activity: <path d="M3 12h4l2.2-6 4 12 2.2-6H21" />,
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    code: (
      <>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </>
    ),
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    "arrow-right": (
      <>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

/* ============================================================
   FORMATTING HELPERS
============================================================ */

function formatDate(dateString?: string | null): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNumber(num?: number | null): string {
  if (num == null) return "0";
  return num.toLocaleString();
}

/* ============================================================
   MAIN COMPONENT PROPS
============================================================ */

export interface GitHubViewProps {
  navigate?: (path: string) => void;
}

export function GitHubView({ navigate }: GitHubViewProps) {
  // Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<GitHubBackendProfile | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");

  // Data State
  const [repos, setRepos] = useState<GitHubBackendRepo[]>([]);
  const [commits, setCommits] = useState<GitHubBackendCommit[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubBackendPR[]>([]);
  const [languageDistribution, setLanguageDistribution] = useState<LanguageDistribution[]>([]);
  const [skillsObserved, setSkillsObserved] = useState<VerifiedCareerSkill[]>([]);
  const [metrics, setMetrics] = useState({
    totalRepositories: 0,
    totalStars: 0,
    totalForks: 0,
    totalCommits: 0,
    totalPullRequests: 0,
    totalIssues: 0,
  });

  // Status & UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"updated" | "stars" | "name" | "forks">("updated");
  const [activeActivityTab, setActiveActivityTab] = useState<"languages" | "commits" | "prs" | "skills">("languages");

  // Disconnect Confirmation Modal
  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);

  /* ============================================================
     INITIAL LOAD: Check URL Parameters & Fetch Backend Data
  ============================================================ */
  useEffect(() => {
    let active = true;

    async function init() {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Check URL parameters from OAuth redirect
      const params = new URLSearchParams(window.location.search);
      const connectedParam = params.get("connected");
      const usernameParam = params.get("username");
      const errorParam = params.get("error");

      if (connectedParam === "true") {
        showToast(
          `GitHub account (@${usernameParam || "user"}) successfully connected and synchronized!`
        );
        window.history.replaceState({}, "", window.location.pathname);
      } else if (errorParam) {
        setErrorMessage(`GitHub Authorization: ${decodeURIComponent(errorParam)}`);
        window.history.replaceState({}, "", window.location.pathname);
      }

      // 2. Fetch authenticated GitHub integration status from backend
      try {
        const insights = await fetchBackendGitHubInsights();
        if (active && insights && insights.isConnected) {
          setIsConnected(true);
          setUserProfile(insights.profile);
          setRepos(insights.repositories || []);
          setCommits(insights.recentCommits || []);
          setPullRequests(insights.pullRequests || []);
          setLanguageDistribution(insights.languageDistribution || []);
          setSkillsObserved(insights.skillsObserved || []);
          setMetrics(insights.metrics || {
            totalRepositories: 0,
            totalStars: 0,
            totalForks: 0,
            totalCommits: 0,
            totalPullRequests: 0,
            totalIssues: 0,
          });

          if (insights.lastSyncedAt) {
            const date = new Date(insights.lastSyncedAt);
            setLastSyncedAt(
              date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
                " · " +
                date.toLocaleDateString()
            );
          }
        } else if (active) {
          setIsConnected(false);
          setUserProfile(null);
          setRepos([]);
        }
      } catch (err: unknown) {
        if (active) {
          console.error("Failed to load GitHub insights:", err);
          if (getStoredToken()) {
            setErrorMessage(
              err instanceof Error ? err.message : "Unable to reach DevOrbit GitHub service."
            );
          }
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, []);

  function showToast(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
  }

  /* ============================================================
     OAUTH CONNECT ACTION
  ============================================================ */
  const handleConnectGitHub = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const res = await fetchGitHubConnectUrl();
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Invalid authorization URL received from server.");
      }
    } catch (err: unknown) {
      setIsConnecting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to initiate GitHub OAuth connection. Ensure backend environment variables are configured."
      );
    }
  };

  /* ============================================================
     MANUAL SYNC ACTION
  ============================================================ */
  const handleSyncGitHub = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const freshInsights = await syncBackendGitHubData();
      if (freshInsights) {
        setUserProfile(freshInsights.profile);
        setRepos(freshInsights.repositories || []);
        setCommits(freshInsights.recentCommits || []);
        setPullRequests(freshInsights.pullRequests || []);
        setLanguageDistribution(freshInsights.languageDistribution || []);
        setSkillsObserved(freshInsights.skillsObserved || []);
        setMetrics(freshInsights.metrics || metrics);

        const now = new Date();
        setLastSyncedAt(
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
            " · " +
            now.toLocaleDateString()
        );

        showToast("GitHub repositories, languages, and commit telemetry synchronized.");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to synchronize with GitHub API."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  /* ============================================================
     DISCONNECT ACTION
  ============================================================ */
  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectBackendGitHubData();
      setIsConnected(false);
      setUserProfile(null);
      setRepos([]);
      setCommits([]);
      setPullRequests([]);
      setLanguageDistribution([]);
      setSkillsObserved([]);
      setShowDisconnectModal(false);
      showToast("GitHub account disconnected from DevOrbit.");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to disconnect GitHub account."
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  /* ============================================================
     FILTER & SORT REPOSITORIES
  ============================================================ */
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    for (const r of repos) {
      if (r.language) set.add(r.language);
    }
    return ["All", ...Array.from(set).sort()];
  }, [repos]);

  const filteredRepos = useMemo(() => {
    let list = [...repos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    if (selectedLanguage !== "All") {
      list = list.filter(
        (r) =>
          (r.language && r.language.toLowerCase() === selectedLanguage.toLowerCase()) ||
          r.languages?.some((l) => l.language.toLowerCase() === selectedLanguage.toLowerCase())
      );
    }

    list.sort((a, b) => {
      if (sortBy === "stars") return (b.stars || 0) - (a.stars || 0);
      if (sortBy === "forks") return (b.forks || 0) - (a.forks || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // Default: updated date
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return list;
  }, [repos, searchQuery, selectedLanguage, sortBy]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="workspace-page github-page-full">
      {/* Toast Notification */}
      {successToast && (
        <div className="gh-toast" role="status">
          <Icon name="check" size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header / Subpage Intro */}
      <section className="subpage-intro">
        <div className="intro-index">06 — REPOSITORY & TELEMETRY ENGINE</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="page-title compact" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              GitHub <span>Integration.</span>
            </div>
            <p>
              Connect your personal GitHub account to analyze verified repositories, inspect programming language distribution, and feed cryptographic commit telemetry into Career Twin AI.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="intro-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {isConnected ? (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSyncGitHub}
                  disabled={isRefreshing || isLoading}
                  title="Refetch repositories and coding telemetry from GitHub REST API"
                >
                  <Icon name="refresh" size={14} />
                  <span>{isRefreshing ? "Synchronizing…" : "Sync GitHub"}</span>
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ borderColor: "rgba(80, 217, 231, 0.4)", color: "var(--cyan)" }}
                  onClick={() => navigate?.("/career-twin")}
                  title="Open Career Twin AI Assessment"
                >
                  <Icon name="sparkles" size={14} />
                  <span>View Career Twin</span>
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ borderColor: "rgba(243, 75, 125, 0.4)", color: "#f34b7d" }}
                  onClick={() => setShowDisconnectModal(true)}
                  title="Disconnect GitHub account from DevOrbit"
                >
                  <Icon name="trash" size={14} />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={handleConnectGitHub}
                disabled={isConnecting}
              >
                <Icon name="github" size={15} />
                <span>{isConnecting ? "Redirecting to GitHub…" : "Connect GitHub"}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="gh-alert-banner error" role="alert" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name="alert-circle" size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="secondary-button"
            style={{ padding: "4px 10px", fontSize: "11px" }}
            onClick={() => setErrorMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ============================================================
          SECTION 1: GITHUB ACCOUNT & CONNECTION STATUS
      ============================================================ */}
      <section className="gh-account-section">
        {isLoading ? (
          <div className="gh-loading-state">
            <div className="gh-spinner" />
            <strong>Verifying GitHub Connection</strong>
            <span>Communicating with DevOrbit backend and checking telemetry records…</span>
          </div>
        ) : isConnected && userProfile ? (
          <div className="gh-account-card connected">
            <div className="gh-account-main">
              <div className="gh-avatar-wrapper">
                <img
                  src={userProfile.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                  alt={`${userProfile.username} avatar`}
                  className="gh-avatar-img"
                />
                <span className="gh-avatar-badge" title="Official GitHub OAuth Connected">
                  <Icon name="github" size={12} />
                </span>
              </div>

              <div className="gh-user-details">
                <div className="gh-user-title-row">
                  <h3 className="gh-display-name">
                    {userProfile.name || userProfile.username}
                  </h3>
                  <a
                    href={userProfile.profileUrl || `https://github.com/${userProfile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-handle-link"
                    title="Open GitHub profile in new tab"
                  >
                    <span>@{userProfile.username}</span>
                    <Icon name="external" size={12} />
                  </a>
                  <span className="gh-tag-pill synced" title="OAuth token encrypted in MongoDB via AES-256-GCM">
                    <Icon name="lock" size={10} /> OAuth Verified
                  </span>
                </div>

                {userProfile.bio && <p className="gh-bio">{userProfile.bio}</p>}

                <div className="gh-meta-tags">
                  {userProfile.company && (
                    <span className="gh-meta-item">
                      <Icon name="globe" size={12} /> {userProfile.company}
                    </span>
                  )}
                  {userProfile.location && (
                    <span className="gh-meta-item">
                      <Icon name="globe" size={12} /> {userProfile.location}
                    </span>
                  )}
                  <span className="gh-meta-item">
                    <Icon name="star" size={12} /> <strong>{formatNumber(userProfile.followers)}</strong> followers
                  </span>
                  <span className="gh-meta-item">
                    Following <strong>{formatNumber(userProfile.following)}</strong> developers
                  </span>
                </div>
              </div>
            </div>

            {/* Account Card Footer / Status Bar */}
            <div className="gh-account-footer">
              <div className="gh-status-indicator">
                <span className="gh-pulse-dot active" />
                <span>
                  Connected to <strong>@{userProfile.username}</strong>
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                {lastSyncedAt && (
                  <span className="gh-last-synced">
                    <Icon name="activity" size={12} />
                    Last Synced: <strong>{lastSyncedAt}</strong>
                  </span>
                )}
                <button
                  type="button"
                  className="gh-sync-quick-btn"
                  onClick={handleSyncGitHub}
                  disabled={isRefreshing}
                  title="Trigger manual API telemetry sync from GitHub"
                >
                  <Icon name="refresh" size={12} />
                  <span>{isRefreshing ? "Syncing…" : "Sync"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Disconnected State - Clear Prompts & Connect Button (No Fake Data) */
          <div className="gh-account-card disconnected">
            <div className="gh-disconnected-content">
              <div className="gh-disconnected-icon-halo">
                <Icon name="github" size={32} />
              </div>
              <div className="gh-disconnected-info">
                <h3>Connect Your GitHub Account</h3>
                <p>
                  DevOrbit integrates directly with GitHub OAuth 2.0 to securely analyze your repositories, commits, pull requests, and programming languages. Connect your account to verify your technical experience with actual code evidence.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: "rgba(141, 107, 255, 0.06)",
                      border: "1px solid rgba(141, 107, 255, 0.2)",
                    }}
                  >
                    <strong style={{ color: "var(--violet-light)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                      🔒 Secure OAuth 2.0
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      Tokens encrypted via AES-256-GCM. We request only minimal public permissions.
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: "rgba(80, 217, 231, 0.06)",
                      border: "1px solid rgba(80, 217, 231, 0.2)",
                    }}
                  >
                    <strong style={{ color: "var(--cyan)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                      📊 Automated Byte Analysis
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      Computes exact programming language distribution from your active codebases.
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: "rgba(99, 213, 162, 0.06)",
                      border: "1px solid rgba(99, 213, 162, 0.2)",
                    }}
                  >
                    <strong style={{ color: "var(--green)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                      ✨ Career Twin AI Integration
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      Grounds Career Twin skills in genuine commits, pull requests, and repository history.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="gh-disconnected-action-row" style={{ borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={handleConnectGitHub}
                disabled={isConnecting}
                style={{ padding: "10px 22px", fontSize: "13px" }}
              >
                <Icon name="github" size={16} />
                <span>{isConnecting ? "Redirecting to GitHub OAuth…" : "Connect GitHub via OAuth"}</span>
              </button>
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>
                Redirects to GitHub's official authorization page. Minimal permissions: read:user, public_repo.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================
          SECTION 2: METRICS COUNTER ROW
      ============================================================ */}
      {isConnected && (
        <section className="gh-stat-grid" style={{ marginTop: "24px" }}>
          <div className="gh-stat-card">
            <div className="gh-stat-head">
              <span className="gh-stat-label">Public Repositories</span>
              <Icon name="code" size={15} />
            </div>
            <div className="gh-stat-value">{formatNumber(metrics.totalRepositories || repos.length)}</div>
            <div className="gh-stat-sub">Validated codebases</div>
          </div>

          <div className="gh-stat-card">
            <div className="gh-stat-head">
              <span className="gh-stat-label">Total Stars</span>
              <Icon name="star" size={15} />
            </div>
            <div className="gh-stat-value" style={{ color: "var(--amber)" }}>
              {formatNumber(metrics.totalStars)}
            </div>
            <div className="gh-stat-sub">Across all repositories</div>
          </div>

          <div className="gh-stat-card">
            <div className="gh-stat-head">
              <span className="gh-stat-label">Total Forks</span>
              <Icon name="git-fork" size={15} />
            </div>
            <div className="gh-stat-value" style={{ color: "var(--violet-light)" }}>
              {formatNumber(metrics.totalForks)}
            </div>
            <div className="gh-stat-sub">Shared implementations</div>
          </div>

          <div className="gh-stat-card">
            <div className="gh-stat-head">
              <span className="gh-stat-label">Observed Commits</span>
              <Icon name="git-commit" size={15} />
            </div>
            <div className="gh-stat-value" style={{ color: "var(--cyan)" }}>
              {formatNumber(metrics.totalCommits || commits.length)}
            </div>
            <div className="gh-stat-sub">Recorded git deliveries</div>
          </div>

          <div className="gh-stat-card">
            <div className="gh-stat-head">
              <span className="gh-stat-label">Pull Requests</span>
              <Icon name="git-pull-request" size={15} />
            </div>
            <div className="gh-stat-value" style={{ color: "var(--green)" }}>
              {formatNumber(metrics.totalPullRequests || pullRequests.length)}
            </div>
            <div className="gh-stat-sub">Collaboration activity</div>
          </div>

          <div className="gh-stat-card">
            <div className="gh-stat-head">
              <span className="gh-stat-label">Developer Reach</span>
              <Icon name="globe" size={15} />
            </div>
            <div className="gh-stat-value" style={{ color: "var(--warm-white)", fontSize: "20px" }}>
              {formatNumber(userProfile?.followers)} <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 400 }}>/ {formatNumber(userProfile?.following)}</span>
            </div>
            <div className="gh-stat-sub">Followers & following</div>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 3: CODEBASE ACTIVITY & INSIGHTS TABS
      ============================================================ */}
      {isConnected && (
        <section className="gh-section" style={{ marginTop: "28px" }}>
          <div className="gh-section-header">
            <div>
              <div className="section-kicker">Multi-Repo Intelligence</div>
              <h3 className="section-title">Telemetry & Activity Streams</h3>
            </div>

            {/* Tab Switcher */}
            <div className="filter-pills" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <button
                type="button"
                className={`filter-pill ${activeActivityTab === "languages" ? "active" : ""}`}
                onClick={() => setActiveActivityTab("languages")}
              >
                <Icon name="code" size={12} /> Languages ({languageDistribution.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${activeActivityTab === "commits" ? "active" : ""}`}
                onClick={() => setActiveActivityTab("commits")}
              >
                <Icon name="git-commit" size={12} /> Recent Commits ({commits.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${activeActivityTab === "prs" ? "active" : ""}`}
                onClick={() => setActiveActivityTab("prs")}
              >
                <Icon name="git-pull-request" size={12} /> Pull Requests ({pullRequests.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${activeActivityTab === "skills" ? "active" : ""}`}
                onClick={() => setActiveActivityTab("skills")}
              >
                <Icon name="sparkles" size={12} /> CareerTwin Skills ({skillsObserved.length})
              </button>
            </div>
          </div>

          {/* TAB 1: LANGUAGES DISTRIBUTION */}
          {activeActivityTab === "languages" && (
            <div className="gh-lang-bar-wrapper" style={{ marginTop: "16px" }}>
              {languageDistribution.length ? (
                <>
                  {/* Multi-Segment Stacked Progress Bar */}
                  <div className="gh-lang-multi-bar" style={{ height: "12px", borderRadius: "6px", marginBottom: "16px" }}>
                    {languageDistribution.map((lang) => (
                      <div
                        key={lang.language}
                        className="gh-lang-bar-segment"
                        style={{
                          width: `${Math.max(2, lang.percentage)}%`,
                          background: lang.color || getLanguageColor(lang.language),
                        }}
                        title={`${lang.language}: ${lang.percentage}%`}
                      />
                    ))}
                  </div>

                  {/* Language Badges Grid */}
                  <div className="gh-lang-grid">
                    {languageDistribution.map((lang) => (
                      <div key={lang.language} className="gh-lang-metric-card">
                        <div className="gh-lang-metric-header">
                          <span
                            className="gh-lang-indicator"
                            style={{
                              background: lang.color || getLanguageColor(lang.language),
                              boxShadow: `0 0 8px ${lang.color || getLanguageColor(lang.language)}`,
                            }}
                          />
                          <strong>{lang.language}</strong>
                          <span className="gh-lang-percent">{lang.percentage}%</span>
                        </div>
                        <div className="gh-lang-subtext" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{lang.count || 1} repo{((lang.count || 1) !== 1) ? "s" : ""}</span>
                          <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, Math.max(4, lang.percentage))}%`, height: "100%", background: lang.color || getLanguageColor(lang.language) }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="gh-empty-box">
                  <Icon name="code" size={24} />
                  <span style={{ marginTop: "8px" }}>No language telemetry recorded. Click &ldquo;Sync GitHub&rdquo; to analyze repository code distribution.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECENT COMMITS */}
          {activeActivityTab === "commits" && (
            <div style={{ marginTop: "16px" }}>
              {commits.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {commits.map((c, idx) => (
                    <div key={c.sha + idx} className="gh-activity-item">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                        <span style={{ color: "var(--cyan)", flexShrink: 0 }}>
                          <Icon name="git-commit" size={16} />
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--warm-white)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.message}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--faint)", fontFamily: "monospace" }}>
                            repo: <span style={{ color: "var(--cyan)" }}>{c.repoName}</span>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <span style={{ fontSize: "11px", color: "var(--faint)", fontFamily: "monospace" }}>
                          {formatDate(c.date)}
                        </span>
                        <a
                          href={c.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="secondary-button"
                          style={{ padding: "3px 8px", fontSize: "11px", fontFamily: "monospace" }}
                          title="View commit on GitHub"
                        >
                          {c.sha} <Icon name="external" size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gh-empty-box">
                  <Icon name="git-commit" size={24} />
                  <span style={{ marginTop: "8px" }}>No recent commits observed in public event telemetry. Click &ldquo;Sync GitHub&rdquo; to refresh.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PULL REQUESTS */}
          {activeActivityTab === "prs" && (
            <div style={{ marginTop: "16px" }}>
              {pullRequests.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pullRequests.map((pr, idx) => {
                    const isMerged = pr.state === "merged";
                    const isOpen = pr.state === "open";
                    const badgeClass = isMerged ? "gh-pr-badge-merged" : isOpen ? "gh-pr-badge-open" : "gh-pr-badge-closed";
                    return (
                      <div key={pr.id || idx} className="gh-activity-item">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                          <span style={{ color: isMerged ? "var(--violet-light)" : "var(--green)", flexShrink: 0 }}>
                            <Icon name="git-pull-request" size={16} />
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--warm-white)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ color: "var(--cyan)", fontFamily: "monospace", marginRight: "6px" }}>#{pr.number}</span>
                              {pr.title}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--faint)", fontFamily: "monospace" }}>
                              repo: <span style={{ color: "var(--cyan)" }}>{pr.repoName}</span>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                          <span className={`gh-tag-pill ${badgeClass}`} style={{ textTransform: "capitalize" }}>
                            {pr.state}
                          </span>
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="secondary-button"
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            title="Inspect PR on GitHub"
                          >
                            Inspect <Icon name="external" size={10} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="gh-empty-box">
                  <Icon name="git-pull-request" size={24} />
                  <span style={{ marginTop: "8px" }}>No pull requests recorded in recent activity telemetry.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERIFIED CAREER SKILLS (OBSERVED FROM GITHUB) */}
          {activeActivityTab === "skills" && (
            <div style={{ marginTop: "16px" }}>
              {/* Grounding Explanation Banner */}
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "8px",
                  background: "rgba(141, 107, 255, 0.06)",
                  border: "1px solid rgba(141, 107, 255, 0.25)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", maxWidth: "750px" }}>
                  <span style={{ color: "var(--violet-light)" }}>
                    <Icon name="sparkles" size={18} />
                  </span>
                  <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                    <strong style={{ color: "var(--warm-white)", display: "block" }}>
                      Grounding Career Twin AI in Real Code Telemetry
                    </strong>
                    <span style={{ color: "var(--muted)" }}>
                      DevOrbit extracts skills from genuine multi-repository architecture and commit history — preventing inflated self-evaluations.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ padding: "6px 14px", fontSize: "11px", borderColor: "rgba(80, 217, 231, 0.4)", color: "var(--cyan)" }}
                  onClick={() => navigate?.("/career-twin")}
                >
                  <Icon name="sparkles" size={12} />
                  <span>Open Career Twin</span>
                </button>
              </div>

              {skillsObserved.length ? (
                <div className="gh-skills-grid">
                  {skillsObserved.map((sk) => (
                    <div key={sk.skill} className="gh-skill-card">
                      <div className="gh-skill-header">
                        <span className="gh-lang-dot" style={{ background: getLanguageColor(sk.skill) }} />
                        <strong>{sk.skill}</strong>
                        <span
                          className={`twin-status-pill ${
                            sk.strength === "Demonstrated"
                              ? "ai-verified"
                              : sk.strength === "Practiced"
                              ? "db-fallback"
                              : ""
                          }`}
                          style={{ fontSize: "9px" }}
                        >
                          {sk.strength}
                        </span>
                      </div>
                      <p className="gh-skill-evidence">{sk.evidence}</p>
                      {Array.isArray(sk.repos) && sk.repos.length > 0 && (
                        <div className="gh-skill-repos">
                          {sk.repos.map((r) => (
                            <span key={r} className="gh-repo-tag">
                              <Icon name="code" size={9} /> {r}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: "10px", color: "var(--cyan)", fontFamily: "monospace", marginTop: "auto", paddingTop: "4px" }}>
                        {sk.repoCount} repository source{sk.repoCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gh-empty-box">
                  <Icon name="sparkles" size={24} />
                  <span style={{ marginTop: "8px" }}>No verified skills observed yet. Synchronize your repositories to analyze skills.</span>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          SECTION 4: REPOSITORY CARDS & SEARCH/FILTER
      ============================================================ */}
      {isConnected && (
        <section className="gh-section" style={{ marginTop: "32px" }}>
          <div className="gh-section-header">
            <div>
              <div className="section-kicker">Verified Codebases</div>
              <h3 className="section-title">
                Repository Directory ({filteredRepos.length}{filteredRepos.length !== repos.length ? ` of ${repos.length}` : ""})
              </h3>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="gh-controls-wrapper">
              {/* Search Input with Clear Button */}
              <div className="constellation-search" style={{ minWidth: "220px", display: "flex", alignItems: "center" }}>
                <Icon name="search" size={13} />
                <input
                  placeholder="Filter repositories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="gh-clear-search-btn"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                  >
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>

              {/* Language Filter */}
              <div className="gh-filter-select-wrapper">
                <Icon name="filter" size={11} />
                <select
                  className="gh-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang === "All" ? "All Languages" : lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="gh-filter-select-wrapper">
                <select
                  className="gh-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="updated">Recently Updated</option>
                  <option value="stars">Most Stars</option>
                  <option value="forks">Most Forks</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              {(searchQuery || selectedLanguage !== "All") && (
                <button
                  type="button"
                  className="secondary-button"
                  style={{ padding: "5px 10px", fontSize: "11px" }}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLanguage("All");
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Repository Cards Grid */}
          <div className="gh-repo-cards-grid">
            {filteredRepos.length ? (
              filteredRepos.map((repo) => (
                <div key={repo.githubRepoId || repo.name} className="gh-repo-card">
                  <div className="gh-repo-card-head">
                    <div className="gh-repo-title-row">
                      <Icon name="code" size={14} />
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gh-repo-name-link"
                        title={`Open ${repo.name} on GitHub`}
                      >
                        {repo.name}
                      </a>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gh-open-repo-btn"
                        title="Open in new tab"
                      >
                        <Icon name="external" size={11} />
                      </a>
                    </div>

                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      {repo.isFork && (
                        <span className="gh-tag-pill" style={{ background: "rgba(141, 107, 255, 0.1)", color: "var(--violet-light)", borderColor: "rgba(141, 107, 255, 0.3)" }}>
                          fork
                        </span>
                      )}
                      <span className="gh-tag-pill" style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--faint)", borderColor: "var(--line)" }}>
                        {repo.visibility || "public"}
                      </span>
                    </div>
                  </div>

                  <p className="gh-repo-description">
                    {repo.description || "No description provided."}
                  </p>

                  <div className="gh-repo-card-foot">
                    {repo.language ? (
                      <span className="gh-repo-lang">
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: getLanguageColor(repo.language),
                            boxShadow: `0 0 6px ${getLanguageColor(repo.language)}`,
                          }}
                        />
                        <span>{repo.language}</span>
                      </span>
                    ) : (
                      <span className="gh-repo-lang" style={{ color: "var(--faint)" }}>—</span>
                    )}

                    <div className="gh-repo-metrics">
                      <span className="gh-repo-stat" title={`${repo.stars || 0} Stars`}>
                        <Icon name="star" size={11} /> {repo.stars || 0}
                      </span>
                      <span className="gh-repo-stat" title={`${repo.forks || 0} Forks`}>
                        <Icon name="git-fork" size={11} /> {repo.forks || 0}
                      </span>
                      {Boolean(repo.defaultBranch) && (
                        <span className="gh-repo-branch" title={`Default branch: ${repo.defaultBranch}`}>
                          {repo.defaultBranch}
                        </span>
                      )}
                      <span className="gh-repo-updated" title={`Updated: ${repo.updatedAt}`}>
                        {formatDate(repo.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="gh-empty-box" style={{ gridColumn: "1 / -1" }}>
                <Icon name="search" size={24} />
                <span style={{ marginTop: "8px", fontSize: "13px" }}>No repositories match your filter criteria.</span>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ marginTop: "12px", padding: "6px 14px", fontSize: "11px" }}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLanguage("All");
                  }}
                >
                  Reset Search Filters
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================
          MODAL: DISCONNECT CONFIRMATION
      ============================================================ */}
      {showDisconnectModal && (
        <div className="modal-backdrop" onClick={() => setShowDisconnectModal(false)}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="modal-head">
              <div>
                <div className="section-kicker">Account Security</div>
                <div className="modal-title">Disconnect GitHub Account?</div>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowDisconnectModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "13px", lineHeight: "1.5" }}>
                Disconnecting your GitHub account will remove stored access tokens and GitHub telemetry from your DevOrbit profile.
              </p>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "rgba(216, 166, 87, 0.08)",
                  border: "1px solid rgba(216, 166, 87, 0.3)",
                  color: "var(--amber)",
                  fontSize: "11px",
                  marginBottom: "20px",
                }}
              >
                <strong>Note:</strong> Career Twin will continue functioning with your DevOrbit sprint tasks and project records. You can reconnect anytime.
              </div>

              <div className="form-actions" style={{ justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowDisconnectModal(false)}
                  disabled={isDisconnecting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={handleConfirmDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "Disconnecting…" : "Disconnect GitHub"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GitHubView;
