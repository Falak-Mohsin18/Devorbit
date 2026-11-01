import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  getCareerTwinProfile,
  getCareerSkillGap,
  getCareerJobMatch,
  getPersistedRoadmap,
  updatePersistedRoadmapItem,
  updatePersistedTargetRole,
  type CareerTwinResult,
  type SkillGapResult,
  type JobMatchResult,
  type RoadmapItem,
  type RoadmapStage,
  type ClassifiedSkill,
} from "./careerApi";

/* ============================================================
   ICONS
============================================================ */

type IconName =
  | "sparkles"
  | "github"
  | "check"
  | "chevron"
  | "task"
  | "search"
  | "trend"
  | "activity"
  | "grid"
  | "folder"
  | "people"
  | "refresh";

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    sparkles: (
      <>
        <path d="m12 2 1.2 4.1L17 8l-3.8 1.9L12 14l-1.2-4.1L7 8l3.8-1.9z" />
        <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z" />
      </>
    ),
    github: (
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-5A3.9 3.9 0 0 1 6.8 8.6a3.6 3.6 0 0 1 .1-2.8s.8-.3 2.8 1a9.6 9.6 0 0 1 5.1 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.8 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.8-4.7 5 .4.3.7 1 .7 2V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    task: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    trend: <path d="m3 17 6-6 4 4 7-8M15 7h5v5" />,
    activity: <path d="M3 12h4l2.2-6 4 12 2.2-6H21" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    folder: <path d="M3 7.5h6l2-2h10v13H3z" />,
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5M17 14a5 5 0 0 1 4 5" />
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
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const TARGET_ROLES = [
  "Full-Stack Developer",
  "Backend Engineer",
  "Frontend Engineer",
  "AI Engineer",
  "DevOps Engineer",
] as const;

export function CareerTwinView({ navigate }: { navigate?: (path: string) => void }) {
  // Primary Career Profile state
  const [apiState, setApiState] = useState<"loading" | "success" | "error">("loading");
  const [careerData, setCareerData] = useState<CareerTwinResult | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Target role & Skill Gap state
  const [selectedRole, setSelectedRole] = useState<string>("Full-Stack Developer");
  const [skillGapData, setSkillGapData] = useState<SkillGapResult | null>(null);
  const [isLoadingSkillGap, setIsLoadingSkillGap] = useState(false);
  const [skillGapFilter, setSkillGapFilter] = useState<string>("all");

  // Constellation interactive state
  const [constellationFilter, setConstellationFilter] = useState<string>("all");
  const [constellationSearch, setConstellationSearch] = useState("");
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);

  // Roadmap state (persisted)
  const [persistedRoadmap, setPersistedRoadmap] = useState<RoadmapItem[]>([]);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  // Job matching state
  const [jobMatchRole, setJobMatchRole] = useState("Full-Stack Developer");
  const [jobDescriptionInput, setJobDescriptionInput] = useState("");
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(null);
  const [isLoadingJobMatch, setIsLoadingJobMatch] = useState(false);
  const [jobMatchError, setJobMatchError] = useState("");

  /* ============================================================
     1. INITIAL DATA LOAD
  ============================================================ */

  const loadCareerTwin = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setApiState("loading");
    }
    setError("");

    try {
      const result = await getCareerTwinProfile(forceRefresh);
      setCareerData(result);
      setApiState("success");
    } catch (err) {
      console.error("Career Twin request failed:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load Career Twin profile."
      );
      setApiState("error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadPersistedData = async () => {
    try {
      const res = await getPersistedRoadmap();
      if (res.targetRole) {
        setSelectedRole(res.targetRole);
        setJobMatchRole(res.targetRole);
      }
      if (res.roadmap && res.roadmap.length > 0) {
        setPersistedRoadmap(res.roadmap);
      }
    } catch (err) {
      console.warn("Could not load persisted roadmap:", err);
    }
  };

  useEffect(() => {
    void loadCareerTwin();
    void loadPersistedData();
  }, []);

  /* ============================================================
     2. SKILL GAP ANALYSIS ON ROLE CHANGE
  ============================================================ */

  useEffect(() => {
    let active = true;
    const fetchSkillGap = async () => {
      setIsLoadingSkillGap(true);
      try {
        const gap = await getCareerSkillGap(selectedRole);
        if (active) {
          setSkillGapData(gap);
        }
      } catch (err) {
        console.error("Skill gap analysis error:", err);
      } finally {
        if (active) setIsLoadingSkillGap(false);
      }
    };

    void fetchSkillGap();
    return () => {
      active = false;
    };
  }, [selectedRole]);

  /* ============================================================
     3. SET TARGET ROLE ACTION
  ============================================================ */

  const handleSelectTargetRole = async (role: string) => {
    setSelectedRole(role);
    setJobMatchRole(role);
    try {
      await updatePersistedTargetRole(role);
    } catch (err) {
      console.warn("Failed to persist target role preference:", err);
    }
  };

  /* ============================================================
     4. ROADMAP ITEM STATUS TOGGLE (BACKEND PERSISTENCE)
  ============================================================ */

  const handleStatusChange = async (
    item: RoadmapItem,
    newStatus: "planned" | "in_progress" | "completed"
  ) => {
    const itemId = item.id || item.itemId || `rm-${Date.now()}`;
    setSavingItemId(itemId);

    // Optimistic UI update
    setPersistedRoadmap((prev) => {
      const idx = prev.findIndex((p) => p.id === itemId || p.itemId === itemId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status: newStatus };
        return updated;
      }
      return [...prev, { ...item, id: itemId, itemId, status: newStatus }];
    });

    try {
      const updated = await updatePersistedRoadmapItem({
        itemId,
        status: newStatus,
        stage: item.stage,
        title: item.title,
        description: item.description,
        whyItMatters: item.whyItMatters,
        howToDemonstrate: item.howToDemonstrate,
        skills: item.skills,
        targetRole: selectedRole,
      });
      setPersistedRoadmap(updated);
    } catch (err) {
      console.error("Error persisting roadmap update:", err);
    } finally {
      setSavingItemId(null);
    }
  };

  /* ============================================================
     5. JOB MATCH EVALUATION ACTION
  ============================================================ */

  const handleEvaluateJobMatch = async () => {
    setIsLoadingJobMatch(true);
    setJobMatchError("");
    try {
      const match = await getCareerJobMatch(jobMatchRole, jobDescriptionInput.trim() || undefined);
      setJobMatchResult(match);
    } catch (err) {
      console.error("Job match error:", err);
      setJobMatchError(err instanceof Error ? err.message : "Job match evaluation failed.");
    } finally {
      setIsLoadingJobMatch(false);
    }
  };

  /* ============================================================
     6. CONSTELLATION NODES DATA
  ============================================================ */

  const allSkillsList = useMemo(() => {
    if (!careerData) return [];

    const demonstrated = (careerData.strengths || []).map((s, idx) => ({
      id: `dem-${idx}`,
      name: s.name,
      level: s.evidenceLevel || "demonstrated",
      confidence: s.confidence || "High",
      evidence: s.evidence,
      source: [...(s.tasks || []), ...(s.projects || [])].join(", ") || "DevOrbit Tasks",
      className: "demonstrated",
      tasks: s.tasks || [],
      projects: s.projects || [],
      evidenceType: "demonstrated" as const,
    }));

    const exposure = (careerData.exposureSkills || []).map((s, idx) => ({
      id: `exp-${idx}`,
      name: s.name,
      level: "Exposure",
      confidence: "Limited evidence",
      evidence: s.note,
      source: s.project || "Project stack",
      className: "evidence",
      tasks: [],
      projects: s.project ? [s.project] : [],
      evidenceType: "exposure" as const,
    }));

    // Merge in any other skills from evidence
    const existingNames = new Set([...demonstrated, ...exposure].map((s) => s.name.toLowerCase()));
    const additional = (careerData.evidence?.skillEvidence || [])
      .filter((s) => !existingNames.has(s.skill.toLowerCase()))
      .map((s, idx) => ({
        id: `add-${idx}`,
        name: s.skill,
        level: s.evidenceType,
        confidence: s.confidence,
        evidence: s.implementationEvidence?.[0]?.description || `Practiced in project tasks: ${s.tasks.join(", ")}`,
        source: s.projects.join(", ") || "Project environment",
        className: s.evidenceType === "demonstrated" ? "demonstrated" : s.evidenceType === "practiced" ? "emerging" : "evidence",
        tasks: s.tasks,
        projects: s.projects,
        evidenceType: s.evidenceType,
      }));

    return [...demonstrated, ...exposure, ...additional];
  }, [careerData]);

  const filteredSkills = useMemo(() => {
    return allSkillsList.filter((skill) => {
      const matchesSearch = !constellationSearch.trim() ||
        skill.name.toLowerCase().includes(constellationSearch.toLowerCase().trim());

      const matchesCat =
        constellationFilter === "all" ||
        (constellationFilter === "demonstrated" && skill.level === "demonstrated") ||
        (constellationFilter === "practiced" && (skill.level === "practiced" || skill.className === "emerging")) ||
        (constellationFilter === "needs_evidence" && (skill.level === "Exposure" || skill.level === "exposure"));

      return matchesSearch && matchesCat;
    });
  }, [allSkillsList, constellationFilter, constellationSearch]);

  const activeSkill = filteredSkills[selectedSkillIndex] || filteredSkills[0] || allSkillsList[0];

  // Verified implementation records for active skill
  const activeImplementationEvidence = useMemo(() => {
    if (!activeSkill || !careerData?.evidence?.skillEvidence) return [];
    const found = careerData.evidence.skillEvidence.find(
      (s) => s.skill.toLowerCase() === activeSkill.name.toLowerCase()
    );
    return found?.implementationEvidence || [];
  }, [activeSkill, careerData]);

  /* ============================================================
     7. COMBINED ROADMAP ITEMS (AI + PERSISTED STATUS)
  ============================================================ */

  const activeRoadmapStages = useMemo(() => {
    const rawStages: RoadmapStage[] = skillGapData?.roadmapStages || [
      {
        stage: "Start now",
        items: [
          {
            id: "rm-1",
            title: "Demonstrate Database Integration via Mongoose CRUD",
            description: "Build Mongoose models and queries for data persistence to move MongoDB from exposure to demonstrated.",
            whyItMatters: "Proves complete end-to-end full stack architecture capability.",
            howToDemonstrate: "Add task, submit implementation, and link commit SHA.",
            skills: ["MongoDB", "Mongoose"],
            status: "planned",
          },
        ],
      },
      {
        stage: "Build practical experience",
        items: [
          {
            id: "rm-2",
            title: "Automate Integration Tests with Jest & Supertest",
            description: "Write test suites for authentication and task management endpoints.",
            whyItMatters: "Validates code reliability and software delivery maturity.",
            howToDemonstrate: "Add test scripts to CI pipeline with passing test reports.",
            skills: ["Automated Testing", "Jest"],
            status: "planned",
          },
        ],
      },
      {
        stage: "Strengthen implementation evidence",
        items: [
          {
            id: "rm-3",
            title: "Link Verified Commit SHAs to All Feature Tasks",
            description: "Ensure each completed sprint item references git commits for cryptographic verification.",
            whyItMatters: "Provides objective authorship proof on your Career Twin profile.",
            howToDemonstrate: "Attach commit hashes in task implementation history.",
            skills: ["Git", "Code Review"],
            status: "planned",
          },
        ],
      },
      {
        stage: "Prepare for interviews",
        items: [
          {
            id: "rm-4",
            title: "System Design: State Synchronization & JWT Token Lifecycle",
            description: "Document token rotation, RBAC permission models, and Kanban board caching.",
            whyItMatters: "Essential for mid and senior engineering interviews.",
            howToDemonstrate: "Write an architecture decision record (ADR) in project docs.",
            skills: ["System Architecture", "Security"],
            status: "planned",
          },
        ],
      },
      {
        stage: "Reassess career readiness",
        items: [
          {
            id: "rm-5",
            title: `Benchmark Against Senior ${selectedRole} Matrix`,
            description: "Run Career Twin AI assessment after completing the milestones.",
            whyItMatters: "Measures readiness progression from verified deliverables.",
            howToDemonstrate: "Review updated Career Twin readiness index and constellation.",
            skills: ["Career Intelligence"],
            status: "planned",
          },
        ],
      },
    ];

    // Merge persisted statuses into raw items
    return rawStages.map((stage) => ({
      ...stage,
      items: stage.items.map((item) => {
        const found = persistedRoadmap.find((p) => p.itemId === item.id || p.id === item.id);
        return found ? { ...item, status: found.status } : item;
      }),
    }));
  }, [skillGapData, persistedRoadmap, selectedRole]);

  /* ============================================================
     8. ROLE FIT SCORES COMPUTATION
  ============================================================ */

  const careerPathsWithFit = useMemo(() => {
    const demonstratedNames = new Set(
      (careerData?.strengths || []).map((s) => s.name.toLowerCase())
    );

    return TARGET_ROLES.map((role) => {
      let fitScore = 40;
      let reason = "";
      let strengths: string[] = [];
      let missing: string[] = [];
      let recommendedProject = "";

      if (role === "Frontend Engineer") {
        const hasUi = demonstratedNames.has("frontend") || demonstratedNames.has("ui") || demonstratedNames.has("react");
        fitScore = hasUi ? 82 : 45;
        reason = "Demonstrated expertise in React components, authentication forms, and responsive CSS UI.";
        strengths = ["React Form Handling", "UI/UX Layouts", "Authentication Screens"];
        missing = ["TypeScript Component Architecture", "Automated E2E Testing"];
        recommendedProject = "Build design system token library and accessibility audit.";
      } else if (role === "Full-Stack Developer") {
        const hasBoth = demonstratedNames.has("frontend") && demonstratedNames.has("authentication");
        fitScore = hasBoth ? 74 : 50;
        reason = "Demonstrated capacity across frontend forms and backend Express authentication endpoints.";
        strengths = ["Frontend UI", "JWT Authentication", "Express Routes"];
        missing = ["MongoDB CRUD Verification", "Automated Integration Tests"];
        recommendedProject = "Connect authentication API to MongoDB with Mongoose data persistence.";
      } else if (role === "Backend Engineer") {
        const hasAuth = demonstratedNames.has("authentication") || demonstratedNames.has("node.js");
        fitScore = hasAuth ? 62 : 35;
        reason = "Strong baseline in JWT middleware and protected route handling, needing database query proof.";
        strengths = ["Express Middleware", "Token Validation", "REST Endpoints"];
        missing = ["Database Optimization", "Redis Caching", "Docker Containerization"];
        recommendedProject = "Build high-throughput telemetry ingestion service with Redis cache.";
      } else if (role === "AI Engineer") {
        fitScore = 38;
        reason = "Algorithms and copilot workflows in active development; requires model evaluation proof.";
        strengths = ["REST APIs", "Workflow Automation"];
        missing = ["Vector Embeddings", "RAG Pipelines", "Model Fine-Tuning"];
        recommendedProject = "Implement RAG vector search over DevOrbit workspace documentation.";
      } else {
        // DevOps
        fitScore = 28;
        reason = "Exposure to project environment; requires automated pipeline and orchestration evidence.";
        strengths = ["Project Collaboration"];
        missing = ["Docker Multi-Stage Builds", "GitHub Actions CI/CD", "Kubernetes"];
        recommendedProject = "Create multi-stage Dockerfile and automated build verification workflow.";
      }

      return {
        role,
        fitScore,
        reason,
        strengths,
        missingSkills: missing,
        requiredNextSkills: missing,
        recommendedTasks: [recommendedProject],
        nextAction: `Target ${role} roadmap`,
      };
    });
  }, [careerData]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="workspace-page career-twin-full">
      {/* Page Intro Banner */}
      <section className="subpage-intro">
        <div className="intro-index">05 — CAREER INTELLIGENCE SYSTEM</div>
        <div>
          <div className="page-title compact">
            DevOrbit <span>Career Twin.</span>
          </div>
          <p>
            An evidence-grounded AI intelligence engine that evaluates verified code,
            calculates transparent readiness scores, and charts your engineering trajectory.
          </p>
        </div>
        <div className="intro-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadCareerTwin(true)}
            disabled={isRefreshing || apiState === "loading"}
          >
            <Icon name="refresh" size={14} />
            {isRefreshing ? "Refreshing…" : "Refresh AI"}
          </button>
        </div>
      </section>

      {/* AI vs Database Status Banner */}
      {careerData && (
        <div className={`twin-status-banner ${careerData._isFallback ? "warning" : "active"}`} style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderRadius: "8px",
          border: `1px solid ${careerData._isFallback ? "rgba(216, 166, 87, 0.4)" : "rgba(80, 217, 231, 0.4)"}`,
          background: careerData._isFallback ? "rgba(216, 166, 87, 0.08)" : "rgba(80, 217, 231, 0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name="sparkles" size={18} />
            <span style={{ fontSize: "12px" }}>
              <strong style={{ color: "var(--warm-white)", marginRight: "8px" }}>
                {careerData._isFallback ? "Verified Database Engine Active" : "Google Gemini AI Assessment Active"}
              </strong>
              <span style={{ color: "var(--muted)" }}>
                {careerData._isFallback
                  ? "Evaluating authenticated developer contributions directly from MongoDB records."
                  : "Live AI model (gemini-3.1-flash-lite) grounded exclusively on verified tasks and implementation evidence."}
              </span>
            </span>
          </div>
          <span className={`twin-status-pill ${careerData._isFallback ? "db-fallback" : "ai-verified"}`}>
            {careerData._isFallback ? "Database Mode" : "Gemini 3.1 Flash"}
          </span>
        </div>
      )}

      {/* GitHub Integration Status Banner */}
      {careerData?.evidence?.githubConnected ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            borderRadius: "8px",
            border: "1px solid rgba(141, 107, 255, 0.35)",
            background: "rgba(141, 107, 255, 0.08)",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name="github" size={18} />
            <span style={{ fontSize: "12px" }}>
              <strong style={{ color: "var(--warm-white)", marginRight: "8px" }}>
                GitHub Codebase Evidence Synchronized
              </strong>
              <span style={{ color: "var(--muted)" }}>
                Linked account <strong>@{careerData.evidence.githubData?.username}</strong> with{" "}
                {careerData.evidence.githubData?.publicRepos || 0} public repositories and{" "}
                {careerData.evidence.githubData?.activity?.totalCommitsObserved || 0} observed commits.
              </span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="twin-status-pill ai-verified"
              style={{
                background: "rgba(141, 107, 255, 0.2)",
                borderColor: "rgba(141, 107, 255, 0.5)",
                color: "var(--violet-light)",
              }}
            >
              OAuth Verified
            </span>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: "4px 10px", fontSize: "11px" }}
              onClick={() => navigate?.("/github")}
            >
              View GitHub Telemetry →
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            borderRadius: "8px",
            border: "1px solid rgba(80, 217, 231, 0.25)",
            background: "rgba(80, 217, 231, 0.04)",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name="github" size={18} />
            <span style={{ fontSize: "12px" }}>
              <strong style={{ color: "var(--warm-white)", marginRight: "8px" }}>
                Connect GitHub to Boost Career Readiness
              </strong>
              <span style={{ color: "var(--muted)" }}>
                Ground your skills in real code repositories, multi-language analytics, and commit activity.
              </span>
            </span>
          </div>
          <button
            type="button"
            className="primary-button"
            style={{ padding: "5px 12px", fontSize: "11px" }}
            onClick={() => navigate?.("/github")}
          >
            <Icon name="github" size={13} />
            <span>Connect GitHub</span>
          </button>
        </div>
      )}

      {/* ============================================================
          SECTION 1: CAREER TWIN OVERVIEW & READINESS METHODOLOGY
      ============================================================ */}
      <section className="twin-overview-banner">
        <div className="twin-overview-header">
          <div className="twin-overview-left">
            <div className="twin-hero-score">
              <strong>{careerData?.careerReadiness ?? "—"}</strong>
              <span>/ 100</span>
            </div>
            <div>
              <div className="section-kicker">Transparent career readiness index</div>
              <div className="section-title" style={{ fontSize: "22px", fontFamily: "Georgia, serif" }}>
                {careerData?.careerLevel ?? "Developing Engineer"}
              </div>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "12px", maxWidth: "600px", lineHeight: "1.5" }}>
                {careerData?.summary ?? "Evaluating your verified project workload and implementation proof."}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
            <span style={{ fontSize: "10px", color: "var(--faint)", textTransform: "uppercase", fontFamily: "monospace" }}>
              Active Target Role
            </span>
            <strong style={{ color: "var(--cyan)", fontSize: "14px" }}>{selectedRole}</strong>
            <button
              type="button"
              className="text-button"
              style={{ fontSize: "11px", color: "var(--violet-light)", cursor: "pointer", background: "none", border: "none", padding: 0 }}
              onClick={() => {
                const el = document.getElementById("skill-gap-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View gap analysis ↓
            </button>
          </div>
        </div>

        {/* Explainable Methodology Breakdown */}
        <div>
          <div className="section-kicker" style={{ marginBottom: "8px" }}>
            Scoring Methodology · How Readiness Is Calculated
          </div>
          <div className="twin-methodology-grid">
            <div className="methodology-col">
              <span>Weight: 40%</span>
              <strong>Demonstrated Skills</strong>
              <p>Verified through completed tasks and direct code implementation records.</p>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--cyan)" }}>
                Active: {careerData?.strengths?.map((s) => s.name).slice(0, 3).join(", ") || "None"}
              </div>
            </div>
            <div className="methodology-col">
              <span>Weight: 25%</span>
              <strong>Task Execution & Delivery</strong>
              <p>Ratio of completed sprint tasks to total backlog assignments.</p>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--green)" }}>
                {careerData?.evidence?.statistics?.completedTasks ?? 1} / {careerData?.evidence?.statistics?.totalTasks ?? 4} tasks resolved
              </div>
            </div>
            <div className="methodology-col">
              <span>Weight: 15%</span>
              <strong>Project Stack Exposure</strong>
              <p>Breadth of technologies present in team repositories without direct task authorship.</p>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--amber)" }}>
                {careerData?.exposureSkills?.map((s) => s.name).join(", ") || "MongoDB"}
              </div>
            </div>
            <div className="methodology-col">
              <span>Weight: 20%</span>
              <strong>Verifiable Commit Proof</strong>
              <p>Cryptographic commit SHAs and pull request links recorded in task history.</p>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--violet-light)" }}>
                {careerData?.evidence?.statistics?.implementationEvidenceCount ?? 3} verified commits
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: SKILL CONSTELLATION & EXPANDABLE EVIDENCE
      ============================================================ */}
      <section className="career-twin" style={{ borderRadius: "12px", border: "1px solid var(--line)", overflow: "hidden" }}>
        <div className="twin-header">
          <div className="twin-identity">
            <div className="twin-mark">
              <Icon name="sparkles" size={20} />
            </div>
            <div>
              <div className="section-kicker">Signature radar map</div>
              <div className="section-title">Skill Constellation & Evidence</div>
            </div>
          </div>
          <div className="readiness-index">
            <span>Verified Skills</span>
            <strong>{allSkillsList.filter((s) => s.level === "demonstrated").length}</strong>
            <i>demonstrated</i>
          </div>
        </div>

        {/* Interactive constellation toolbar */}
        <div className="constellation-toolbar">
          <div className="filter-pills">
            {(["all", "demonstrated", "practiced", "needs_evidence"] as const).map((filter) => (
              <button
                type="button"
                key={filter}
                className={`filter-pill ${constellationFilter === filter ? "active" : ""}`}
                onClick={() => setConstellationFilter(filter)}
              >
                {filter === "all"
                  ? `All (${allSkillsList.length})`
                  : filter === "demonstrated"
                  ? `Demonstrated (${allSkillsList.filter((s) => s.level === "demonstrated").length})`
                  : filter === "practiced"
                  ? `Practiced (${allSkillsList.filter((s) => s.level === "practiced" || s.className === "emerging").length})`
                  : `Needs Evidence (${allSkillsList.filter((s) => s.level === "Exposure" || s.level === "exposure").length})`}
              </button>
            ))}
          </div>
          <div className="constellation-search">
            <Icon name="search" size={13} />
            <input
              placeholder="Search skills…"
              value={constellationSearch}
              onChange={(e) => setConstellationSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="twin-layout">
          {/* Skill Nodes Grid */}
          <div className="constellation">
            <div className="constellation-caption">
              <span>Interactive constellation nodes</span>
              <div>
                <i className="demonstrated" /> Demonstrated
                <i className="emerging" /> Emerging
                <i className="evidence" /> Needs evidence
              </div>
            </div>

            {filteredSkills.length ? (
              filteredSkills.map((skill, index) => (
                <div
                  key={skill.id}
                  className={`skill-node ${skill.className} ${activeSkill?.name === skill.name ? "selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSkillIndex(index)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedSkillIndex(index)}
                >
                  <i />
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{skill.name}</span>
                    <small style={{ fontSize: "9px", color: "var(--faint)", textTransform: "capitalize" }}>
                      {skill.level} · {skill.confidence}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ gridColumn: "1 / -1", color: "var(--muted)", padding: "20px" }}>
                No skills matching the filter criteria.
              </p>
            )}
          </div>

          {/* Detailed Evidence Panel */}
          <aside className="evidence-panel" aria-live="polite">
            {activeSkill ? (
              <>
                <div className="evidence-topline">
                  <span>{activeSkill.level}</span>
                  <i>{activeSkill.confidence}</i>
                </div>
                <div className="evidence-title">{activeSkill.name}</div>
                <div style={{ margin: "6px 0 10px" }}>
                  <span
                    className={`evidence-badge ${
                      activeSkill.level === "demonstrated" ? "verified" : "exposure"
                    }`}
                  >
                    {activeSkill.level === "demonstrated"
                      ? "Verified Database Implementation Record"
                      : "Project Environment Exposure"}
                  </span>
                </div>
                <p>{activeSkill.evidence}</p>

                {/* Associated Tasks & Projects */}
                <div className="evidence-source">
                  <Icon name="folder" size={15} />
                  <span>
                    Connected Systems
                    <strong>{activeSkill.source}</strong>
                  </span>
                </div>

                {/* Verified Commit Hashes Cards */}
                {activeImplementationEvidence.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <span style={{ fontSize: "9px", color: "var(--faint)", textTransform: "uppercase", fontFamily: "monospace" }}>
                      Verifiable Implementation Records
                    </span>
                    {activeImplementationEvidence.map((rec, i) => (
                      <div className="evidence-card-detailed" key={i}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span className="commit-tag">
                            <Icon name="github" size={11} />
                            {rec.commitHash || "Verified SHA"}
                          </span>
                          <span style={{ fontSize: "9px", color: "var(--green)" }}>Verified</span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: "11px", color: "var(--warm-white)" }}>
                          {rec.description}
                        </p>
                        {rec.task && (
                          <div style={{ fontSize: "10px", color: "var(--faint)" }}>
                            Task: <strong>{rec.task}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="recommendation">
                  <span>Next milestone</span>
                  <p>
                    {activeSkill.level === "demonstrated"
                      ? "Write integration tests and maintain production code coverage."
                      : "Create and complete a task with commit SHA verification to convert this exposure to a demonstrated skill."}
                  </p>
                </div>
              </>
            ) : (
              <p style={{ color: "var(--muted)" }}>Select a skill node to inspect verification evidence.</p>
            )}
          </aside>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: SKILL GAP ANALYSIS
      ============================================================ */}
      <section className="data-section" id="skill-gap-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Target Role Benchmark</div>
            <div className="section-title">Skill Gap Analysis</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>Match Score:</span>
            <strong style={{ fontSize: "20px", color: "var(--cyan)", fontFamily: "Georgia, serif" }}>
              {skillGapData?.matchScore ?? "—"}%
            </strong>
          </div>
        </div>

        <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px" }}>
          Compare your demonstrated profile against target engineering benchmark requirements.
          DevOrbit distinguishes genuine skill gaps from technologies present in project stacks that merely lack developer tasks.
        </p>

        {/* Target Role Selector Toolbar */}
        <div className="role-tabs">
          {TARGET_ROLES.map((role) => (
            <button
              type="button"
              key={role}
              className={`role-tab-btn ${selectedRole === role ? "active" : ""}`}
              onClick={() => void handleSelectTargetRole(role)}
            >
              <span>{role}</span>
              {selectedRole === role && <Icon name="check" size={13} />}
            </button>
          ))}
        </div>

        {/* Skill Gap Category Tabs */}
        {skillGapData && (
          <div className="filter-pills" style={{ marginBottom: "16px" }}>
            {[
              { id: "all", label: `All (${skillGapData.classifiedSkills?.length || 0})` },
              { id: "demonstrated", label: `Demonstrated (${skillGapData.demonstratedSkills?.length || 0})` },
              { id: "partial", label: `Partial (${skillGapData.partiallyDemonstratedSkills?.length || 0})` },
              { id: "needs_evidence", label: `Needs Evidence (${skillGapData.needsEvidenceSkills?.length || 0})` },
              { id: "missing", label: `Missing (${skillGapData.missingSkills?.length || 0})` },
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={`filter-pill ${skillGapFilter === tab.id ? "active" : ""}`}
                onClick={() => setSkillGapFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {isLoadingSkillGap ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            Analyzing skill gaps for {selectedRole}…
          </div>
        ) : (
          <div className="gap-category-grid">
            {(skillGapData?.classifiedSkills || [])
              .filter((s) => skillGapFilter === "all" || s.category === skillGapFilter)
              .map((item, idx) => (
                <div className="skill-gap-card" key={idx}>
                  <div className="skill-gap-header">
                    <strong>{item.name}</strong>
                    <span className={`category-tag ${item.category}`}>
                      {item.category.replace("_", " ")}
                    </span>
                  </div>
                  <div className="skill-gap-body">
                    <div className="gap-row">
                      <span className="gap-label">Current Evidence</span>
                      <span className="gap-value">{item.currentEvidence}</span>
                    </div>
                    <div className="gap-row">
                      <span className="gap-label">Target Requirement</span>
                      <span className="gap-value">{item.targetRequirement}</span>
                    </div>
                    <div className="gap-row">
                      <span className="gap-label">Gap Classification</span>
                      <span className="gap-value" style={{ color: item.isGenuineGap ? "#ff8c96" : "var(--cyan)" }}>
                        {item.gap}
                      </span>
                    </div>
                    <div className="gap-next-step">
                      <strong>Next step:</strong> {item.practicalNextStep}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Recommended Next Skills */}
        {skillGapData?.recommendedNextSkills && skillGapData.recommendedNextSkills.length > 0 && (
          <div style={{ marginTop: "20px", padding: "16px", borderRadius: "10px", background: "rgba(141, 107, 255, 0.05)", border: "1px solid rgba(141, 107, 255, 0.2)" }}>
            <div className="section-kicker">Priority Recommendations to Close Gaps</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginTop: "10px" }}>
              {skillGapData.recommendedNextSkills.map((rec, i) => (
                <div key={i} style={{ padding: "10px", borderRadius: "6px", background: "var(--surface)", border: "1px solid var(--line-soft)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--warm-white)", fontSize: "13px" }}>{rec.skill}</strong>
                    <span style={{ fontSize: "9px", color: rec.priority === "High" ? "var(--cyan)" : "var(--muted)", textTransform: "uppercase" }}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 4px", fontSize: "11px", color: "var(--muted)" }}>{rec.reason}</p>
                  <small style={{ color: "var(--violet-light)", fontSize: "10px" }}>Project: {rec.practicalProject}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ============================================================
          SECTION 4: PERSONALIZED CAREER PATHS
      ============================================================ */}
      <section className="data-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Evidence-grounded trajectory</div>
            <div className="section-title">Personalized Career Paths</div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--faint)" }}>
            Calibrated against your active project tasks
          </span>
        </div>

        <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px" }}>
          Explore fit scores tailored to your demonstrated implementation evidence.
          Selecting a path instantly adapts your Skill Gap benchmarks and Growth Roadmap.
        </p>

        <div className="paths-grid">
          {careerPathsWithFit.map((p) => {
            const isSelected = selectedRole === p.role;
            const fitLevel = p.fitScore >= 70 ? "high" : p.fitScore >= 50 ? "mid" : "developing";

            return (
              <div
                key={p.role}
                className={`path-card ${isSelected ? "selected-path" : ""}`}
              >
                <div className="path-card-top">
                  <div>
                    <div className="path-role-title">{p.role}</div>
                    {isSelected && (
                      <span style={{ fontSize: "9px", color: "var(--cyan)", fontFamily: "monospace", textTransform: "uppercase" }}>
                        ● Active Target Role
                      </span>
                    )}
                  </div>
                  <span className={`fit-score-badge ${fitLevel}`}>
                    {p.fitScore}% Fit
                  </span>
                </div>

                <p>{p.reason}</p>

                <div style={{ marginBottom: "8px" }}>
                  <span className="gap-label">Demonstrated Strengths</span>
                  <div className="path-tags-group">
                    {p.strengths.map((str, idx) => (
                      <span className="path-tag strength" key={idx}>✓ {str}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <span className="gap-label">Required Next Skills</span>
                  <div className="path-tags-group">
                    {p.requiredNextSkills.map((req, idx) => (
                      <span className="path-tag req" key={idx}>+ {req}</span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "14px" }}>
                  <strong>Recommended task:</strong> {p.recommendedTasks[0]}
                </div>

                <button
                  type="button"
                  className={`path-action-btn ${isSelected ? "primary-button" : "secondary-button"}`}
                  onClick={() => void handleSelectTargetRole(p.role)}
                >
                  {isSelected ? (
                    <>
                      <Icon name="check" size={13} /> Selected as Target Role
                    </>
                  ) : (
                    "Select as Target Role"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          SECTION 5: PERSONALIZED GROWTH ROADMAP (5 STAGES)
      ============================================================ */}
      <section className="data-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Actionable Progression Matrix</div>
            <div className="section-title">Personalized Growth Roadmap</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>Target:</span>
            <strong style={{ fontSize: "12px", color: "var(--cyan)" }}>{selectedRole}</strong>
          </div>
        </div>

        <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px" }}>
          Milestones organized into 5 progressive stages. Mark items as planned, in progress, or completed—your
          progress persists to the DevOrbit database.
        </p>

        <div className="roadmap-container">
          {activeRoadmapStages.map((stageBlock, sIdx) => {
            const completedCount = stageBlock.items.filter((i) => i.status === "completed").length;
            const totalCount = stageBlock.items.length;

            return (
              <div className="roadmap-stage-block" key={stageBlock.stage}>
                <div className="stage-header">
                  <div className="stage-title-wrap">
                    <span className="stage-num">{sIdx + 1}</span>
                    <span className="stage-name">{stageBlock.stage}</span>
                  </div>
                  <span className="stage-count">
                    {completedCount} / {totalCount} completed
                  </span>
                </div>

                <div className="stage-items">
                  {stageBlock.items.map((item) => {
                    const isSaving = savingItemId === (item.id || item.itemId);

                    return (
                      <div
                        key={item.id || item.title}
                        className={`roadmap-item status-${item.status}`}
                      >
                        <div className="roadmap-item-info">
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                          <div className="item-callout">
                            <span><strong>Why it matters:</strong> {item.whyItMatters}</span>
                            <span><strong>Verification method:</strong> {item.howToDemonstrate}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                          <div className="status-button-group">
                            {(["planned", "in_progress", "completed"] as const).map((st) => (
                              <button
                                type="button"
                                key={st}
                                className={`status-btn ${item.status === st ? `active ${st}` : ""}`}
                                onClick={() => void handleStatusChange(item, st)}
                                disabled={isSaving}
                              >
                                {st === "in_progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}
                              </button>
                            ))}
                          </div>
                          {isSaving && (
                            <span style={{ fontSize: "9px", color: "var(--cyan)" }}>Saving…</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          SECTION 6: CAREER READINESS & JOB MATCHING
      ============================================================ */}
      <section className="data-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Portfolio Alignment Engine</div>
            <div className="section-title">Job Match Analysis</div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--faint)" }}>
            Evaluate against real job requirements
          </span>
        </div>

        <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px" }}>
          Select a role or paste an external job description to compare required competencies against
          your active DevOrbit projects, tasks, and implementation evidence.
        </p>

        <div className="job-match-wrapper">
          {/* Input Panel */}
          <div className="job-input-panel">
            <span className="gap-label">Select Target Role or Preset</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {TARGET_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  className={`filter-pill ${jobMatchRole === role ? "active" : ""}`}
                  onClick={() => setJobMatchRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>

            <span className="gap-label" style={{ marginTop: "8px" }}>
              Job Description (Optional — Paste requirements text)
            </span>
            <textarea
              placeholder="e.g. We are seeking a Full-Stack Engineer with React, Node.js, Express, MongoDB, and automated testing experience..."
              value={jobDescriptionInput}
              onChange={(e) => setJobDescriptionInput(e.target.value)}
            />

            {jobMatchError && (
              <span style={{ color: "#ff8c96", fontSize: "11px" }}>{jobMatchError}</span>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={() => void handleEvaluateJobMatch()}
              disabled={isLoadingJobMatch}
              style={{ marginTop: "6px" }}
            >
              <Icon name="sparkles" size={14} />
              {isLoadingJobMatch ? "Evaluating Portfolio Match…" : `Analyze Match with ${jobMatchRole}`}
            </button>
          </div>

          {/* Results Panel */}
          <div className="job-results-panel">
            {jobMatchResult ? (
              <>
                <div className="job-score-header">
                  <div>
                    <span className="gap-label">Transparent Match Rate</span>
                    <div className="job-score-number">{jobMatchResult.matchRate}%</div>
                  </div>
                  <span className={`fit-score-badge ${jobMatchResult.matchRate >= 70 ? "high" : "mid"}`}>
                    {jobMatchResult.matchRate >= 70 ? "Strong Alignment" : "Developing Fit"}
                  </span>
                </div>

                {/* Scoring Breakdown Factors */}
                <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.03)", fontSize: "11px" }}>
                  <div style={{ fontWeight: 500, color: "var(--warm-white)", marginBottom: "4px" }}>
                    Scoring Calculation Factors
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", color: "var(--muted)", fontSize: "10px" }}>
                    <span>• {jobMatchResult.scoringBreakdown.demonstratedWeight}</span>
                    <span>• {jobMatchResult.scoringBreakdown.executionWeight}</span>
                    <span>• {jobMatchResult.scoringBreakdown.exposureWeight}</span>
                    <span>• {jobMatchResult.scoringBreakdown.verificationWeight}</span>
                  </div>
                </div>

                {/* Matched Skills */}
                <div>
                  <span className="gap-label">Matching Skills Verified</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {jobMatchResult.matchedSkills.map((m, i) => (
                      <span key={i} className="path-tag strength" title={m.evidence}>
                        ✓ {m.skill} ({m.source})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Competencies */}
                <div>
                  <span className="gap-label">Missing or Under-Demonstrated</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {jobMatchResult.missingCompetencies.map((c, i) => (
                      <div key={i} style={{ fontSize: "11px", color: "var(--text)" }}>
                        <span style={{ color: "#ff8c96", fontWeight: 500 }}>• {c.skill}:</span> {c.reason}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(80, 217, 231, 0.06)", borderLeft: "2px solid var(--cyan)", fontSize: "11px", color: "var(--text)" }}>
                  <strong style={{ color: "var(--cyan)" }}>Key Milestone:</strong> {jobMatchResult.recommendation}
                </div>
              </>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", margin: "auto" }}>
                <Icon name="trend" size={24} />
                <p style={{ marginTop: "10px" }}>
                  Click "Analyze Match" to compare your profile evidence against job requirements.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 7: CAREER INSIGHTS & RECOMMENDED NEXT ACTIONS
      ============================================================ */}
      <section className="data-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Strategic workspace intelligence</div>
            <div className="section-title">Career Insights & Recommended Actions</div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--faint)" }}>
            Evidence velocity summary
          </span>
        </div>

        <div className="insights-grid">
          <div className="insight-card">
            <span className="gap-label">Evidence Velocity</span>
            <strong>Task Delivery Ratio</strong>
            <p>
              {careerData?.evidence?.statistics?.completedTasks ?? 1} task completed out of{" "}
              {careerData?.evidence?.statistics?.totalTasks ?? 4} total in project backlog.
              Closing remaining tasks accelerates readiness index.
            </p>
            {navigate && (
              <button
                type="button"
                className="text-button"
                style={{ marginTop: "auto", alignSelf: "flex-start", color: "var(--cyan)", fontSize: "11px", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                onClick={() => navigate("/tasks")}
              >
                Go to Kanban Board →
              </button>
            )}
          </div>

          <div className="insight-card">
            <span className="gap-label">Cryptographic Proof</span>
            <strong>Implementation Records</strong>
            <p>
              {careerData?.evidence?.statistics?.implementationEvidenceCount ?? 3} verified commit
              records connected to tasks in DevOrbit, proving authorship in authentication and forms.
            </p>
            {navigate && (
              <button
                type="button"
                className="text-button"
                style={{ marginTop: "auto", alignSelf: "flex-start", color: "var(--violet-light)", fontSize: "11px", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                onClick={() => navigate("/projects")}
              >
                View Connected Projects →
              </button>
            )}
          </div>

          <div className="insight-card">
            <span className="gap-label">High-Impact Next Step</span>
            <strong>Convert MongoDB Exposure</strong>
            <p>
              MongoDB is in the DevOrbit stack. Creating and finishing a Mongoose model implementation task
              provides the single highest readiness jump.
            </p>
            {navigate && (
              <button
                type="button"
                className="text-button"
                style={{ marginTop: "auto", alignSelf: "flex-start", color: "var(--green)", fontSize: "11px", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                onClick={() => navigate("/tasks")}
              >
                Add Database Task →
              </button>
            )}
          </div>
        </div>

        {/* Narrative Observations */}
        {careerData?.growthInsights && careerData.growthInsights.length > 0 && (
          <div style={{ marginTop: "16px", padding: "14px 18px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--line-soft)" }}>
            <span className="gap-label">Verified Growth Observations</span>
            <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "var(--text)", fontSize: "12px", lineHeight: "1.6" }}>
              {careerData.growthInsights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
