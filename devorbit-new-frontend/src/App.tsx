import { useEffect, useState, type FormEvent, type ReactNode } from "react"

import { createProject, updateProject } from "./projectApi";

import { getCareerTwinProfile, type CareerTwinResult } from "./careerApi";
import { CareerTwinView } from "./CareerTwinView";
import { GitHubView } from "./GitHubView";

import {
  useWorkspace,
  syncWorkspaceWithBackend,
  type Member,
  type Project,
  type ProjectStatus,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type WorkspaceSettings,
} from "./workspace.tsx";

import LandingPage from "./LandingPage"

import AuthPage from "./AuthPage"
import {
  AuthApiError,
  clearSession,
  getCurrentUser,
  getStoredToken,
  type AuthSession,
  type AuthUser,
} from "./auth"

type IconName = "activity" | "bell" | "check" | "chevron" | "folder" | "github" | "grid" | "people" | "plus" | "search" | "settings" | "sparkles" | "task" | "trend"

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    folder: <path d="M3 7.5h6l2-2h10v13H3z" />,
    task: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5M17 14a5 5 0 0 1 4 5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 2 1.2 4.1L17 8l-3.8 1.9L12 14l-1.2-4.1L7 8l3.8-1.9z" />
        <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z" />
      </>
    ),
    github: (
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-5A3.9 3.9 0 0 1 6.8 8.6a3.6 3.6 0 0 1 .1-2.8s.8-.3 2.8 1a9.6 9.6 0 0 1 5.1 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.8 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.8-4.7 5 .4.3.7 1 .7 2V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 15a2 2 0 0 0 .4 2l.4.5-2.5 2.5-.5-.4a2 2 0 0 0-2-.4l-.7.3-.2 1.5h-3.6l-.2-1.5-.7-.3a2 2 0 0 0-2 .4l-.5.4-2.5-2.5.4-.5a2 2 0 0 0 .4-2l-.3-.7L3 14V10l1.5-.3.3-.7a2 2 0 0 0-.4-2L4 6.5 6.5 4l.5.4a2 2 0 0 0 2 .4l.7-.3.2-1.5h3.6l.2 1.5.7.3a2 2 0 0 0 2-.4l.5-.4 2.5 2.5-.4.5a2 2 0 0 0-.4 2l.3.7 1.5.3v4l-1.5.3z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    trend: <path d="m3 17 6-6 4 4 7-8M15 7h5v5" />,
    activity: <path d="M3 12h4l2.2-6 4 12 2.2-6H21" />,
  }

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
  )
}

const navItems: { label: string; icon: IconName; path: string }[] = [
  { label: "Dashboard", icon: "grid", path: "/dashboard" },
  { label: "Projects", icon: "folder", path: "/projects" },
  { label: "Tasks", icon: "task", path: "/tasks" },
  { label: "Team", icon: "people", path: "/team" },
  { label: "Career Twin", icon: "sparkles", path: "/career-twin" },
  { label: "GitHub", icon: "github", path: "/github" },
  { label: "Notifications", icon: "bell", path: "/notifications" },
  { label: "Settings", icon: "settings", path: "/settings" },
]

const orbitNodes = [
  {
    id: "pulse",
    label: "Pulse Analytics",
    meta: "Project · 72%",
    kind: "project",
    className: "orbit-node-a",
    detail: "14 commits and 6 completed tasks this sprint.",
  },
  {
    id: "react",
    label: "React systems",
    meta: "Skill · Strong",
    kind: "skill",
    className: "orbit-node-b",
    detail: "Demonstrated across 3 active projects.",
  },
  {
    id: "nova",
    label: "Nova Mobile",
    meta: "Project · 48%",
    kind: "project",
    className: "orbit-node-c",
    detail: "GraphQL integration is the current focus.",
  },
  {
    id: "mentor",
    label: "Mentorship",
    meta: "Contribution · 8",
    kind: "contribution",
    className: "orbit-node-d",
    detail: "8 reviews with actionable feedback this month.",
  },
  {
    id: "senior",
    label: "Senior engineer",
    meta: "Goal · 82% ready",
    kind: "goal",
    className: "orbit-node-e",
    detail: "Three skill signals remain to strengthen.",
  },
  {
    id: "design",
    label: "Orbit DS",
    meta: "Project · 89%",
    kind: "project",
    className: "orbit-node-f",
    detail: "Component documentation is nearly complete.",
  },
]

type Skill = {
  id: string
  name: string
  level: "Demonstrated" | "Emerging" | "Needs evidence"
  score: string
  evidence: string
  source: string
  className: string
}

const skills: Skill[] = [
  {
    id: "architecture",
    name: "React architecture",
    level: "Demonstrated",
    score: "Strong signal",
    evidence:
      "Led the component architecture and reduced duplicate UI logic by 31%.",
    source: "Orbit Design System · 18 merged PRs",
    className: "skill-a",
  },
  {
    id: "systems",
    name: "System design",
    level: "Demonstrated",
    score: "Strong signal",
    evidence:
      "Designed event ingestion boundaries for high-volume product telemetry.",
    source: "Pulse Analytics · Architecture decision 014",
    className: "skill-b",
  },
  {
    id: "mentorship",
    name: "Mentorship",
    level: "Demonstrated",
    score: "Consistent signal",
    evidence:
      "Review feedback helped unblock three teammates across two projects.",
    source: "8 substantive reviews · Last 30 days",
    className: "skill-c",
  },
  {
    id: "cloud",
    name: "Cloud infrastructure",
    level: "Emerging",
    score: "Growing signal",
    evidence:
      "Added deployment observability, but production ownership is still limited.",
    source: "Nova Mobile · 3 contributions",
    className: "skill-d",
  },
  {
    id: "leadership",
    name: "Technical strategy",
    level: "Needs evidence",
    score: "Limited signal",
    evidence:
      "Lead one cross-project technical proposal to create a stronger signal.",
    source: "Recommended next step",
    className: "skill-e",
  },
]

const activity = [
  {
    time: "09:42",
    title: "Architecture decision merged",
    copy: "Event boundaries approved for Pulse Analytics",
    type: "code",
  },
  {
    time: "Yesterday",
    title: "Skill signal strengthened",
    copy: "React architecture moved to demonstrated",
    type: "twin",
  },
  {
    time: "Mon",
    title: "Maya joined your orbit",
    copy: "Added to Nova Mobile as product designer",
    type: "team",
  },
  {
    time: "Apr 12",
    title: "Sprint milestone reached",
    copy: "Orbit Design System crossed 85% completion",
    type: "project",
  },
]

function Brand() {
  return (
    <div className="brand">
      <div className="orbit-logo" aria-hidden="true">
        <span />
        <span />
        <i />
      </div>
      <div>
        <strong>DevOrbit</strong>
        <span>Orbit Intelligence</span>
      </div>
    </div>
  )
}

function Sidebar({
  current,
  onNavigate,
}: {
  current: string
  onNavigate: (path: string) => void
}) {
  const { notifications } = useWorkspace()
  const unreadCount = notifications.filter((notice) => notice.unread).length
  return (
    <aside className="sidebar">
      <Brand />
      <div className="workspace-label">JD / Workspace 01</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item, index) => (
          <div
            className={`nav-item ${
              (
                item.path === "/"
                  ? current === "/"
                  : current.startsWith(item.path)
              )
                ? "active"
                : ""
            } ${index === 6 ? "nav-break" : ""}`}
            key={item.label}
            role="button"
            tabIndex={0}
            aria-current={
              (
                item.path === "/"
                  ? current === "/"
                  : current.startsWith(item.path)
              )
                ? "page"
                : undefined
            }
            onClick={() => onNavigate(item.path)}
            onKeyDown={(event) =>
              event.key === "Enter" && onNavigate(item.path)
            }
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.label === "Career Twin" && <i>TWIN</i>}
            {item.label === "Notifications" && unreadCount > 0 && (
              <b>{unreadCount}</b>
            )}
          </div>
        ))}
      </nav>
      <div className="sync-state">
        <span className="sync-pulse" />
        <div>
          <strong>Local prototype</strong>
          <span>Saved in this browser</span>
        </div>
      </div>
    </aside>
  )
}

function Topbar({
  currentLabel,
  onNavigate,
  onLogout,
  user,
}: {
  currentLabel: string
  onNavigate: (path: string) => void
  onLogout: () => void
  user: AuthUser
}) {
  const { notifications } = useWorkspace()
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const [query, setQuery] = useState("")
  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    onNavigate(query.toLowerCase().includes("task") ? "/tasks" : "/projects")
  }
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <Brand />
      </div>
      <div className="breadcrumb">
        <span>Workspace</span>
        <i>/</i>
        <strong>{currentLabel}</strong>
      </div>
      <div className="top-actions">
        <form className="command-search" role="search" onSubmit={submitSearch}>
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the orbit"
            aria-label="Search projects and tasks"
          />
          <kbd>↵</kbd>
        </form>
        <div
          className="notification"
          role="button"
          tabIndex={0}
          aria-label="Notifications"
          onClick={() => onNavigate("/notifications")}
          onKeyDown={(event) =>
            event.key === "Enter" && onNavigate("/notifications")
          }
        >
          <Icon name="bell" size={18} />
          {notifications.some((notice) => notice.unread) && <i />}
        </div>
        <div
          className="profile"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("/settings")}
          onKeyDown={(event) =>
            event.key === "Enter" && onNavigate("/settings")
          }
        >
          <div className="avatar">{initials}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role ?? user.email}</span>
          </div>
          <Icon name="chevron" size={13} />
        </div>
        <button className="logout-action" type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  )
}

function ProjectHealth({ navigate }: { navigate: (path: string) => void }) {
  const { projects } = useWorkspace()
  const visibleProjects = projects.slice(0, 3)
  return (
    <section className="project-health">
      <div className="section-kicker">Project telemetry</div>
      <div className="section-heading">
        <div className="section-title">Health overview</div>
        <div
          className="text-action"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/projects")}
          onKeyDown={(event) => event.key === "Enter" && navigate("/projects")}
        >
          All projects <Icon name="chevron" size={13} />
        </div>
      </div>
      <div className="health-list">
        {visibleProjects.map((project) => (
          <div
            className="health-row interactive-row"
            key={project.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/projects/${project.id}`)}
            onKeyDown={(event) =>
              event.key === "Enter" && navigate(`/projects/${project.id}`)
            }
          >
            <div className="health-meta">
              <strong>{project.name}</strong>
              <span
                className={
                  project.status === "Active"
                    ? "cyan"
                    : project.status === "Blocked"
                      ? "amber"
                      : "violet"
                }
              >
                {project.status}
              </span>
            </div>
            <progress
              className="health-progress"
              max="100"
              value={project.progress}
              aria-label={`${project.name} progress`}
            />
            <div className="health-percent">{project.progress}%</div>
          </div>
        ))}
        {!visibleProjects.length && (
          <div className="mini-empty">No projects yet.</div>
        )}
      </div>
      <div className="health-foot">
        <span>
          {projects.filter((project) => project.status === "Active").length}{" "}
          active systems
        </span>
        <span>{projects.length} total projects</span>
        <span>Local records</span>
      </div>
    </section>
  )
}

function DeveloperOrbit() {
  const [selected, setSelected] = useState(orbitNodes[0])

  return (
    <section className="developer-orbit">
      <div className="orbit-header">
        <div>
          <div className="section-kicker">Prototype relationship map</div>
          <div className="section-title">Developer Orbit</div>
        </div>
        <div className="orbit-legend">
          <span>
            <i className="project" /> Projects
          </span>
          <span>
            <i className="skill" /> Skills
          </span>
          <span>
            <i className="goal" /> Goals
          </span>
        </div>
      </div>

      <div className="orbit-canvas">
        <svg
          className="orbit-lines"
          viewBox="0 0 760 430"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <ellipse cx="380" cy="215" rx="245" ry="142" />
          <ellipse cx="380" cy="215" rx="340" ry="195" />
          <path d="M380 215 155 101M380 215 590 80M380 215 674 232M380 215 545 365M380 215 206 365M380 215 87 227" />
          <path className="signal-path" d="M155 101 Q340 32 590 80" />
          <circle cx="155" cy="101" r="3" className="signal-dot" />
        </svg>

        <div className="orbit-center">
          <div className="center-ring">
            <div className="avatar large">JD</div>
          </div>
          <strong>Jordan Davis</strong>
          <span>Product Engineer</span>
          <i>12 live signals</i>
        </div>

        {orbitNodes.map((node) => (
          <div
            key={node.id}
            className={`orbit-node ${node.className} ${node.kind} ${
              selected.id === node.id ? "selected" : ""
            }`}
            role="button"
            tabIndex={0}
            aria-label={`${node.label}: ${node.meta}`}
            onClick={() => setSelected(node)}
            onKeyDown={(event) => event.key === "Enter" && setSelected(node)}
          >
            <i />
            <div>
              <strong>{node.label}</strong>
              <span>{node.meta}</span>
            </div>
          </div>
        ))}

        <div className="orbit-detail" aria-live="polite">
          <span>Selected signal</span>
          <strong>{selected.label}</strong>
          <p>{selected.detail}</p>
        </div>
      </div>
    </section>
  )
}


type CareerTwinDisplayData = CareerTwinResult;

function CareerTwin({
  data,
  onOpen,
}: {
  data?: CareerTwinDisplayData | null;
  onOpen?: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const realSkills = (data?.strengths ?? []).map((skill, index) => ({
    id: `strength-${index}`,
    name: skill.name,
    level: skill.evidenceLevel,
    score: skill.confidence,
    evidence: skill.evidence,
    source: [
      ...skill.tasks,
      ...skill.projects,
    ].join(", ") || "Career evidence",
    className: "demonstrated",
  }));

  const displayedSkills = realSkills.length
    ? realSkills
    : (data?.exposureSkills ?? []).map((skill, index) => ({
        id: `exposure-${index}`,
        name: skill.name,
        level: "Exposure",
        score: "Limited evidence",
        evidence: skill.note,
        source: skill.project || "Project technology",
        className: "evidence",
      }));

  const selectedSkill = displayedSkills[selectedIndex];

  return (
    <section className="career-twin">
      <div className="twin-header">
        <div className="twin-identity">
          <div className="twin-mark">
            <Icon name="sparkles" size={20} />
          </div>
          <div>
            <div className="section-kicker">DevOrbit signature system</div>
            <div className="section-title">Career Twin <sup>β</sup></div>
          </div>
        </div>
        <div className="readiness-index">
          <span>Career readiness</span>
          <strong>{data?.careerReadiness ?? "—"}</strong>
          <i>
            {data?.careerReadiness != null
              ? "/ 100 · AI assessment"
              : "Assessment unavailable"}
          </i>
        </div>
      </div>

      <div className="twin-layout">
        <div className="constellation">
          <div className="constellation-caption">
            <span>Skill constellation</span>
            <div>
              <i className="demonstrated" /> Demonstrated
              <i className="emerging" /> Emerging
              <i className="evidence" /> Needs evidence
            </div>
          </div>

          {displayedSkills.length ? (
            displayedSkills.map((skill, index) => (
              <div
                key={skill.id}
                className={`skill-node ${skill.className} ${
                  selectedIndex === index ? "selected" : ""
                }`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setSelectedIndex(index);
                }}
              >
                <i />
                <span>{skill.name}</span>
              </div>
            ))
          ) : (
            <p>
              No skill evidence is available yet. Complete tasks and record
              contributions to build your Career Twin.
            </p>
          )}
        </div>

        <aside className="evidence-panel" aria-live="polite">
          {selectedSkill ? (
            <>
              <div className="evidence-topline">
                <span>{selectedSkill.level}</span>
                <i>{selectedSkill.score}</i>
              </div>
              <div className="evidence-title">{selectedSkill.name}</div>
              <p>{selectedSkill.evidence}</p>
              <div className="evidence-source">
                <Icon name="github" size={15} />
                <span>
                  Supporting evidence
                  <strong>{selectedSkill.source}</strong>
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="evidence-title">
                {data?.careerLevel ?? "Career assessment"}
              </div>
              <p>
                {data?.summary ??
                  "Your assessment details will appear here when available."}
              </p>
            </>
          )}

          <div className="recommendation">
            <span>Next recommendation</span>
            <p>
              {data?.recommendedSkills?.[0]?.description ??
                data?.skillGaps?.[0]?.recommendedAction ??
                "Complete and document a technical milestone to strengthen your evidence."}
            </p>
          </div>
          {onOpen && (
            <div
              className="twin-action"
              role="button"
              tabIndex={0}
              onClick={onOpen}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen();
                }
            }}
            >
              Open full Career Twin
              <Icon name="chevron" size={14} />
            </div>
          )}

        </aside>
      </div>
    </section>
  );
}

function ActivityTimeline({ navigate }: { navigate?: (path: string) => void }) {
  return (
    <section className="activity-timeline">
      <div className="section-kicker">Workspace log</div>
      <div className="section-heading">
        <div className="section-title">Recent activity</div>
        <div className="activity-live">
          <i /> Sample log
        </div>
      </div>
      <div className="timeline">
        {activity.map((item) => (
          <div className={`timeline-item ${item.type}`} key={item.title}>
            <div className="timeline-time">{item.time}</div>
            <div className="timeline-marker">
              <i />
            </div>
            <div className="timeline-copy">
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </div>
          </div>
        ))}
      </div>
      <div
        className="timeline-action"
        role="button"
        tabIndex={0}
        onClick={() => navigate?.("/notifications")}
        onKeyDown={(event) =>
          event.key === "Enter" && navigate?.("/notifications")
        }
      >
        Inspect full workspace log
        <Icon name="chevron" size={13} />
      </div>
    </section>
  )
}

function Modal({
  title,
  eyebrow,
  children,
  onClose,
}: {
  title: string
  eyebrow: string
  children: ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-shell"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <div className="section-kicker">{eyebrow}</div>
            <div className="modal-title">{title}</div>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function Field({
  label,
  error,
  children,
  wide = false,
}: {
  label: string
  error?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <label className={`form-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  )
}

function ProjectMemberSelector({
  selectedIds,
}: {
  selectedIds: string[]
}) {
  const [query, setQuery] = useState("")

  return (
    <fieldset className="form-field member-picker directory-picker">
      <legend>Project members</legend>
      <label className="directory-search">
        <Icon name="search" size={14} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search registered users by name or email"
          aria-label="Search registered DevOrbit users"
        />
      </label>
      <div className="directory-state" role="status">
        <Icon name="people" size={18} />
        <span>
          <strong>User directory unavailable</strong>
          <small>
            This frontend has no authentication state, API client, or registered-user
            directory endpoint. No sample members are shown or submitted.
          </small>
          {query && (
            <em>
              Search for “{query}” could not run because a user-directory API is not
              configured.
            </em>
          )}
        </span>
      </div>
      {selectedIds.length > 0 && (
        <div className="directory-warning">
          Existing prototype member IDs are not displayed as registered users and will
          not be submitted from this form.
        </div>
      )}
      <div className="directory-contract">
        Backend required: authenticated-user state, a searchable registered-user
        endpoint, and the project endpoint’s member-ID payload contract.
      </div>
    </fieldset>
  )
}

function ProjectForm({
  project,
  onClose,
}: {
  project?: Project
  onClose: () => void
}) {
  const { saveProject } = useWorkspace()
  const [values, setValues] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
    technologies: project?.technologies.join(", ") ?? "",
    category: project?.category ?? "Web application",
    startDate: project?.startDate ?? "",
    deadline: project?.deadline ?? "",
    memberIds: [] as string[],
    status: project?.status ?? "Planning" as ProjectStatus,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const update = (key: string, value: string | string[]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = "Project name is required."
    if (!values.description.trim())
      nextErrors.description = "Add a short project description."
    if (!values.startDate) nextErrors.startDate = "Start date is required."
    if (!values.deadline) nextErrors.deadline = "Deadline is required."
    if (
      values.startDate &&
      values.deadline &&
      values.deadline < values.startDate
    ) {
      nextErrors.deadline = "Deadline must be after the start date."
    }
    if (!values.technologies.split(",").some((item) => item.trim())) {
      nextErrors.technologies = "Add at least one technology."
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setSubmitting(true)
    const id =
      project?.id ??
      `${values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`
    
try {
  const projectData = {
    name: values.name.trim(),
    description: values.description.trim(),
    technologies: values.technologies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    category: values.category,
    startDate: values.startDate,
    deadline: values.deadline || "",
    status: values.status.toLowerCase(),
  };

  // Create a new project or update an existing one.
  const savedProject = project
    ? await updateProject(id, projectData)
    : await createProject(projectData);

  const backendId = String(
    savedProject._id ?? savedProject.id ?? id
  );

  // Keep the existing workspace UI in sync.
  saveProject({
    id: backendId,
    name: savedProject.name ?? projectData.name,
    description: savedProject.description ?? projectData.description,
    technologies: savedProject.technologies ?? projectData.technologies,
    category: savedProject.category ?? projectData.category,
    startDate: savedProject.startDate
      ? String(savedProject.startDate).slice(0, 10)
      : projectData.startDate,
    deadline: savedProject.deadline
      ? String(savedProject.deadline).slice(0, 10)
      : projectData.deadline,
    memberIds: values.memberIds,
    status: values.status,
    progress: Number(
      savedProject.progress ?? project?.progress ?? 0
    ),
  });

  onClose();
  } catch (error) {
    console.error("Failed to save project:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Failed to save project. Please try again."
    );
  }
  onClose()
  }

  return (
    <Modal
      title={project ? "Edit project" : "Create a project"}
      eyebrow="Local workspace record"
      onClose={onClose}
    >
      <form className="entity-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Project name" error={errors.name}>
            <input
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Developer Portal"
              autoFocus
            />
          </Field>
          <Field label="Category">
            <select
              value={values.category}
              onChange={(event) => update("category", event.target.value)}
            >
              <option>Web application</option>
              <option>Mobile</option>
              <option>Platform</option>
              <option>Analytics</option>
              <option>Open source</option>
            </select>
          </Field>
          <Field label="Description" error={errors.description} wide>
            <textarea
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="What is this project building?"
              rows={3}
            />
          </Field>
          <Field label="Technologies" error={errors.technologies} wide>
            <input
              value={values.technologies}
              onChange={(event) => update("technologies", event.target.value)}
              placeholder="React, TypeScript, Node.js"
            />
            <em>Separate technologies with commas.</em>
          </Field>
          <Field label="Start date" error={errors.startDate}>
            <input
              type="date"
              value={values.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </Field>
          <Field label="Deadline" error={errors.deadline}>
            <input
              type="date"
              value={values.deadline}
              onChange={(event) => update("deadline", event.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              value={values.status}
              onChange={(event) =>
                update("status", event.target.value as ProjectStatus)
              }
            >
              <option>Planning</option>
              <option>Active</option>
              <option>Blocked</option>
              <option>Completed</option>
            </select>
          </Field>
          <ProjectMemberSelector selectedIds={project?.memberIds ?? []} />
        </div>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting
              ? "Saving…"
              : project
                ? "Save changes"
                : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TaskForm({
  task,
  onClose,
  onDelete,
}: {
  task?: Task
  onClose: () => void
  onDelete?: () => void
}) {
  const { projects, members, saveTask } = useWorkspace()
  const [values, setValues] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    projectId: task?.projectId ?? projects[0]?.id ?? "",
    assigneeId: task?.assigneeId ?? "jordan",
    priority: task?.priority ?? "Medium" as TaskPriority,
    status: task?.status ?? "To do" as TaskStatus,
    dueDate: task?.dueDate ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const update = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors: Record<string, string> = {}
    if (!values.title.trim()) nextErrors.title = "Task title is required."
    if (!values.projectId) nextErrors.projectId = "Choose a project."
    if (!values.assigneeId) nextErrors.assigneeId = "Choose an assignee."
    if (!values.dueDate) nextErrors.dueDate = "Due date is required."
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setSubmitting(true)
    saveTask({
      id: task?.id ?? `task-${Date.now().toString(36)}`,
      title: values.title.trim(),
      description: values.description.trim(),
      projectId: values.projectId,
      assigneeId: values.assigneeId,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate,
    })
    onClose()
  }

  return (
    <Modal
      title={task ? "Task details" : "Create a task"}
      eyebrow="Execution record"
      onClose={onClose}
    >
      <form className="entity-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Task title" error={errors.title} wide>
            <input
              value={values.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </Field>
          <Field label="Description" wide>
            <textarea
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Add implementation context"
              rows={3}
            />
          </Field>
          <Field label="Project" error={errors.projectId}>
            <select
              value={values.projectId}
              onChange={(event) => update("projectId", event.target.value)}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option value={project.id} key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assignee" error={errors.assigneeId}>
            <select
              value={values.assigneeId}
              onChange={(event) => update("assigneeId", event.target.value)}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option value={member.id} key={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={values.priority}
              onChange={(event) => update("priority", event.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={values.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option>To do</option>
              <option>In progress</option>
              <option>Review</option>
              <option>Done</option>
            </select>
          </Field>
          <Field label="Due date" error={errors.dueDate}>
            <input
              type="date"
              value={values.dueDate}
              onChange={(event) => update("dueDate", event.target.value)}
            />
          </Field>
        </div>
        <div className="form-actions">
          {task && onDelete && (
            <button type="button" className="danger-button" onClick={onDelete}>
              Delete task
            </button>
          )}
          <span />
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save task"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function MemberForm({
  member,
  onClose,
}: {
  member?: Member
  onClose: () => void
}) {
  const { projects, saveMember } = useWorkspace()
  const [values, setValues] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    role: member?.role ?? "",
    projectIds: member?.projectIds ?? [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = "Name is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      nextErrors.email = "Enter a valid email address."
    if (!values.role.trim()) nextErrors.role = "Role is required."
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    saveMember({
      id: member?.id ?? `member-${Date.now().toString(36)}`,
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role.trim(),
      projectIds: values.projectIds,
    })
    onClose()
  }

  return (
    <Modal
      title={member ? "Edit member" : "Add workspace member"}
      eyebrow="Local prototype member"
      onClose={onClose}
    >
      <form className="entity-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Full name" error={errors.name}>
            <input
              value={values.name}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
              autoFocus
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={values.email}
              onChange={(event) =>
                setValues({ ...values, email: event.target.value })
              }
            />
          </Field>
          <Field label="Role" error={errors.role} wide>
            <input
              value={values.role}
              onChange={(event) =>
                setValues({ ...values, role: event.target.value })
              }
              placeholder="e.g. Backend Engineer"
            />
          </Field>
          <fieldset className="form-field member-picker wide">
            <legend>Project assignments</legend>
            <div>
              {projects.map((project) => (
                <label key={project.id}>
                  <input
                    type="checkbox"
                    checked={values.projectIds.includes(project.id)}
                    onChange={() =>
                      setValues({
                        ...values,
                        projectIds: values.projectIds.includes(project.id)
                          ? values.projectIds.filter((id) => id !== project.id)
                          : [...values.projectIds, project.id],
                      })
                    }
                  />
                  <span>{project.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Save member
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmDialog({
  title,
  copy,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string
  copy: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal title={title} eyebrow="Confirmation required" onClose={onClose}>
      <div className="confirm-copy">{copy}</div>
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onClose}>
          Cancel
        </button>
        <button
          className="danger-button solid"
          type="button"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

function DashboardView({
  navigate,
  onNewProject,
}: {
  navigate: (path: string) => void
  onNewProject: () => void
}) {
  const { projects, tasks } = useWorkspace()
  const openTasks = tasks.filter((task) => task.status !== "Done").length
  const [careerData, setCareerData] = useState<CareerTwinDisplayData | null>(null)

  useEffect(() => {
    let active = true
    getCareerTwinProfile()
      .then((data) => {
        if (active) setCareerData(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <section className="editorial-intro">
        <div className="intro-index">01 — ORBIT INTELLIGENCE</div>
        <div>
          <div className="page-title">
            Everything you build
            <span> leaves a signal.</span>
          </div>
          <p>
            Your projects, contributions, collaborators, and growth—mapped as
            one connected developer system.
          </p>
        </div>
        <div className="intro-actions">
          <div className="date-block">
            <span>Signal window</span>
            <strong>Last 30 days</strong>
          </div>
          <div
            className="new-project"
            role="button"
            tabIndex={0}
            onClick={onNewProject}
            onKeyDown={(event) => event.key === "Enter" && onNewProject()}
          >
            <Icon name="plus" size={16} />
            New project
          </div>
        </div>
      </section>

      <div className="dashboard-stats">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/projects")}
          onKeyDown={(event) => event.key === "Enter" && navigate("/projects")}
        >
          <span>Active projects</span>
          <strong>
            {projects.filter((project) => project.status === "Active").length}
          </strong>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/tasks")}
          onKeyDown={(event) => event.key === "Enter" && navigate("/tasks")}
        >
          <span>Open tasks</span>
          <strong>{openTasks}</strong>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/tasks")}
          onKeyDown={(event) => event.key === "Enter" && navigate("/tasks")}
        >
          <span>Completed tasks</span>
          <strong>{tasks.length - openTasks}</strong>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/career-twin")}
          onKeyDown={(event) =>
            event.key === "Enter" && navigate("/career-twin")
          }
        >
          <span>Career readiness</span>
          <strong>{careerData?.careerReadiness != null ? `${careerData.careerReadiness}%` : (careerData ? "Active" : "—")}</strong>
        </div>
      </div>

      <div className="orbit-composition">
        <ProjectHealth navigate={navigate} />
        <DeveloperOrbit />
      </div>

      <div className="lower-composition">
        <CareerTwin data={careerData} onOpen={() => navigate("/career-twin")} />
        <ActivityTimeline navigate={navigate} />
      </div>
    </>
  )
}

function PageIntro({
  index,
  kicker,
  title,
  italic,
  description,
  action,
  onAction,
}: {
  index: string
  kicker: string
  title: string
  italic: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <section className="subpage-intro">
      <div className="intro-index">
        {index} — {kicker}
      </div>
      <div>
        <div className="page-title compact">
          {title} <span>{italic}</span>
        </div>
        <p>{description}</p>
      </div>
      {action && (
        <div
          className="new-project"
          role="button"
          tabIndex={0}
          onClick={onAction}
          onKeyDown={(event) => event.key === "Enter" && onAction?.()}
        >
          <Icon name="plus" size={16} />
          {action}
        </div>
      )}
    </section>
  )
}

function ProjectsView({ navigate }: { navigate: (path: string) => void }) {
  const { projects, storageError } = useWorkspace()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const visibleProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.technologies.some((technology) =>
        technology.toLowerCase().includes(query),
      )
    return matchesSearch && (status === "All" || project.status === status)
  })

  return (
    <div className="workspace-page">
      <PageIntro
        index="02"
        kicker="PROJECT SYSTEMS"
        title="Work in"
        italic="motion."
        description="Track the health, people, and technical signals attached to every active project."
        action="New project"
        onAction={() => setShowForm(true)}
      />
      <section className="data-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Active portfolio</div>
            <div className="section-title">Project systems</div>
          </div>
          <div className="list-controls">
            <label>
              <Icon name="search" size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter projects by status"
            >
              <option>All</option>
              <option>Planning</option>
              <option>Active</option>
              <option>Blocked</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
        {storageError && <div className="inline-error">{storageError}</div>}
        <div className="project-table">
          <div className="data-header">
            <span>Project</span>
            <span>Health</span>
            <span>Progress</span>
            <span>Orbit</span>
            <span />
          </div>
          {visibleProjects.map((project, index) => (
            <div
              className="data-row project-data-row interactive-row"
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/projects/${project.id}`)}
              onKeyDown={(event) =>
                event.key === "Enter" && navigate(`/projects/${project.id}`)
              }
            >
              <div className="row-primary">
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span>
                  <strong>{project.name}</strong>
                  <small>{project.description}</small>
                </span>
              </div>
              <span
                className={`status-label ${
                  project.status === "Active"
                    ? "cyan"
                    : project.status === "Blocked"
                      ? "amber"
                      : project.status === "Completed"
                        ? "violet"
                        : "muted"
                }`}
              >
                <i />
                {project.status}
              </span>
              <strong className="mono-value">{project.progress}%</strong>
              <span className="row-muted">
                {project.memberIds.length} members
              </span>
              <Icon name="chevron" size={14} />
            </div>
          ))}
          {!visibleProjects.length && (
            <div className="empty-state">
              <Icon name="folder" size={23} />
              <strong>No matching projects</strong>
              <span>
                Adjust the search or status filter, or create a new project.
              </span>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSearch("")
                  setStatus("All")
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

function ProjectDetailView({
  id,
  navigate,
}: {
  id: string
  navigate: (path: string) => void
}) {
  const { projects, tasks, members, deleteProject } = useWorkspace()
  const project = projects.find((item) => item.id === id)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!project) {
    return (
      <div className="empty-state standalone">
        <Icon name="folder" size={28} />
        <strong>Project not found</strong>
        <span>This project may have been removed from local storage.</span>
        <button
          className="secondary-button"
          type="button"
          onClick={() => navigate("/projects")}
        >
          Return to projects
        </button>
      </div>
    )
  }

  const projectTasks = tasks.filter((task) => task.projectId === project.id)
  return (
    <div className="workspace-page">
      <div
        className="detail-back"
        role="button"
        tabIndex={0}
        onClick={() => navigate("/projects")}
      >
        <Icon name="chevron" size={13} /> Back to projects
      </div>
      <section className="detail-hero">
        <div>
          <div className="section-kicker">
            {project.category} · Local prototype record
          </div>
          <div className="page-title compact">{project.name}</div>
          <p>{project.description}</p>
        </div>
        <div className="detail-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setEditing(true)}
          >
            Edit project
          </button>
          <button
            className="danger-button"
            type="button"
            onClick={() => setConfirming(true)}
          >
            Delete
          </button>
        </div>
      </section>
      <div className="detail-grid">
        <section className="detail-main">
          <div className="detail-stat-line">
            <span>
              Status<strong>{project.status}</strong>
            </span>
            <span>
              Progress<strong>{project.progress}%</strong>
            </span>
            <span>
              Open tasks
              <strong>
                {projectTasks.filter((task) => task.status !== "Done").length}
              </strong>
            </span>
            <span>
              Deadline<strong>{project.deadline}</strong>
            </span>
          </div>
          <div className="detail-section">
            <div className="section-kicker">Technology system</div>
            <div className="technology-list">
              {project.technologies.map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <div className="section-kicker">Project tasks</div>
            {projectTasks.length ? (
              projectTasks.map((task) => (
                <div className="compact-task" key={task.id}>
                  <i className={task.status === "Done" ? "done" : ""} />
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {task.status} · {task.priority}
                    </small>
                  </span>
                  <time>{task.dueDate}</time>
                </div>
              ))
            ) : (
              <div className="mini-empty">
                No tasks are assigned to this project yet.
              </div>
            )}
          </div>
        </section>
        <aside className="detail-aside">
          <div className="section-kicker">Project orbit</div>
          {project.memberIds.map((memberId) => {
            const member = members.find((item) => item.id === memberId)
            return member ? (
              <div className="compact-member" key={member.id}>
                <div className="member-avatar">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.role}</small>
                </span>
              </div>
            ) : null
          })}
          <div className="date-range">
            <span>Start</span>
            <strong>{project.startDate}</strong>
            <span>Deadline</span>
            <strong>{project.deadline}</strong>
          </div>
        </aside>
      </div>
      {editing && (
        <ProjectForm project={project} onClose={() => setEditing(false)} />
      )}
      {confirming && (
        <ConfirmDialog
          title="Delete this project?"
          copy="The project and its associated local tasks will be permanently removed from this browser."
          confirmLabel="Delete project"
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            deleteProject(project.id)
            navigate("/projects")
          }}
        />
      )}
    </div>
  )
}

function TasksView() {
  const { tasks, projects, members, saveTask, deleteTask } = useWorkspace()
  const [showForm, setShowForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Task | undefined>()
  const [search, setSearch] = useState("")
  const [projectFilter, setProjectFilter] = useState("All")
  const [assigneeFilter, setAssigneeFilter] = useState("All")
  const visibleTasks = tasks.filter((task) => {
    const query = search.trim().toLowerCase()
    return (
      (!query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)) &&
      (projectFilter === "All" || task.projectId === projectFilter) &&
      (assigneeFilter === "All" || task.assigneeId === assigneeFilter)
    )
  })

  return (
    <div className="workspace-page">
      <PageIntro
        index="03"
        kicker="EXECUTION QUEUE"
        title="Tasks with"
        italic="context."
        description="Prioritized work across your project orbit, with ownership and deadlines kept visible."
        action="Create task"
        onAction={() => setShowForm(true)}
      />
      <div className="list-controls task-controls">
        <label>
          <Icon name="search" size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
          />
        </label>
        <select
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
          aria-label="Filter tasks by project"
        >
          <option>All</option>
          {projects.map((project) => (
            <option value={project.id} key={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(event) => setAssigneeFilter(event.target.value)}
          aria-label="Filter tasks by assignee"
        >
          <option>All</option>
          {members.map((member) => (
            <option value={member.id} key={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      <section className="split-page">
        <div className="data-section">
          <div className="data-section-head">
            <div>
              <div className="section-kicker">Assigned to you</div>
              <div className="section-title">Current queue</div>
            </div>
            <span className="count-label">
              {tasks.filter((task) => task.status !== "Done").length} open
            </span>
          </div>
          <div className="task-list">
            {visibleTasks.map((task) => (
              <div
                className={`task-row functional ${
                  task.status === "Done" ? "complete" : ""
                }`}
                key={task.id}
              >
                <button
                  className="task-check"
                  type="button"
                  onClick={() =>
                    saveTask({
                      ...task,
                      status: task.status === "Done" ? "To do" : "Done",
                    })
                  }
                  aria-label={
                    task.status === "Done" ? "Reopen task" : "Complete task"
                  }
                >
                  <Icon name="check" size={11} />
                </button>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTask(task)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && setSelectedTask(task)
                  }
                >
                  <strong>{task.title}</strong>
                  <span>
                    {projects.find((project) => project.id === task.projectId)
                      ?.name ?? "Unknown project"}{" "}
                    ·{" "}
                    {members.find((member) => member.id === task.assigneeId)
                      ?.name ?? "Unassigned"}
                  </span>
                </div>
                <select
                  className={`inline-select priority ${task.priority.toLowerCase()}`}
                  value={task.priority}
                  onChange={(event) =>
                    saveTask({
                      ...task,
                      priority: event.target.value as TaskPriority,
                    })
                  }
                  aria-label={`Priority for ${task.title}`}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <select
                  className="inline-select status-select"
                  value={task.status}
                  onChange={(event) =>
                    saveTask({
                      ...task,
                      status: event.target.value as TaskStatus,
                    })
                  }
                  aria-label={`Status for ${task.title}`}
                >
                  <option>To do</option>
                  <option>In progress</option>
                  <option>Review</option>
                  <option>Done</option>
                </select>
                <time>{task.dueDate}</time>
              </div>
            ))}
            {!visibleTasks.length && (
              <div className="empty-state">
                <Icon name="task" size={23} />
                <strong>No matching tasks</strong>
                <span>Try different filters or create a new task.</span>
              </div>
            )}
          </div>
        </div>
        <aside className="page-aside">
          <div className="section-kicker">Workspace totals</div>
          <div className="aside-metric">
            <strong>
              {tasks.filter((task) => task.status === "Done").length}
            </strong>
            <span>tasks resolved</span>
          </div>
          <div className="aside-metric">
            <strong>
              {tasks.length
                ? Math.round(
                    (tasks.filter((task) => task.status === "Done").length /
                      tasks.length) *
                      100,
                  )
                : 0}
              %
            </strong>
            <span>completion rate</span>
          </div>
          <p>Counts update from task changes stored locally in this browser.</p>
        </aside>
      </section>
      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
      {selectedTask && (
        <TaskForm
          task={selectedTask}
          onClose={() => setSelectedTask(undefined)}
          onDelete={() => {
            setDeleteTarget(selectedTask)
            setSelectedTask(undefined)
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this task?"
          copy="This local task record will be permanently removed."
          confirmLabel="Delete task"
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={() => {
            deleteTask(deleteTarget.id)
            setDeleteTarget(undefined)
          }}
        />
      )}
    </div>
  )
}

function TeamView() {
  const { members, projects, removeMember } = useWorkspace()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Member | undefined>()
  const [removing, setRemoving] = useState<Member | undefined>()
  const [search, setSearch] = useState("")
  const [projectFilter, setProjectFilter] = useState("All")
  const visibleMembers = members.filter((member) => {
    const query = search.trim().toLowerCase()
    return (
      (!query ||
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)) &&
      (projectFilter === "All" || member.projectIds.includes(projectFilter))
    )
  })

  return (
    <div className="workspace-page">
      <PageIntro
        index="04"
        kicker="COLLABORATION MAP"
        title="People in your"
        italic="orbit."
        description="See who is shaping each project and where collaboration is creating meaningful contribution signals."
        action="Add member"
        onAction={() => setShowForm(true)}
      />
      <section className="data-section team-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Workspace members</div>
            <div className="section-title">Team constellation</div>
          </div>
          <div className="list-controls">
            <label>
              <Icon name="search" size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members"
              />
            </label>
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              aria-label="Filter members by project"
            >
              <option>All</option>
              {projects.map((project) => (
                <option value={project.id} key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="team-grid">
          {visibleMembers.map((member, index) => (
            <div className="team-person" key={member.name}>
              <div className={`member-avatar member-${(index % 4) + 1}`}>
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="member-copy">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
              <div className="member-projects">
                <span>Connected systems</span>
                <strong>
                  {member.projectIds
                    .map(
                      (id) =>
                        projects.find((project) => project.id === id)?.name,
                    )
                    .filter(Boolean)
                    .join(" · ") || "No assignments"}
                </strong>
              </div>
              <div className="member-actions">
                <button type="button" onClick={() => setEditing(member)}>
                  Edit
                </button>
                {member.id !== "jordan" && (
                  <button type="button" onClick={() => setRemoving(member)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {!visibleMembers.length && (
            <div className="empty-state">
              <Icon name="people" size={23} />
              <strong>No matching members</strong>
              <span>Change the filters or add a workspace member.</span>
            </div>
          )}
        </div>
      </section>
      {showForm && <MemberForm onClose={() => setShowForm(false)} />}
      {editing && (
        <MemberForm member={editing} onClose={() => setEditing(undefined)} />
      )}
      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          copy="Their local project assignments will be cleared and assigned tasks will move to Jordan."
          confirmLabel="Remove member"
          onClose={() => setRemoving(undefined)}
          onConfirm={() => {
            removeMember(removing.id)
            setRemoving(undefined)
          }}
        />
      )}
    </div>
  )
}


// CareerTwinView and GitHubView are modular views imported from their respective components


function NotificationsView({ navigate }: { navigate: (path: string) => void }) {
  const {
    notifications: notices,
    markNotification,
    markAllNotificationsRead,
  } = useWorkspace()

  return (
    <div className="workspace-page">
      <PageIntro
        index="07"
        kicker="SIGNAL INBOX"
        title="Changes worth"
        italic="noticing."
        description="A focused record of project movement, team requests, and Career Twin updates."
      />
      <section className="data-section notification-section">
        <div className="data-section-head">
          <div>
            <div className="section-kicker">Inbox</div>
            <div className="section-title">Notifications</div>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={markAllNotificationsRead}
          >
            Mark all as read
          </button>
        </div>
        <div className="notice-list">
          {notices.map((notice) => (
            <div
              className={`notice-row ${notice.unread ? "unread" : ""}`}
              key={notice.id}
            >
              <i className="notice-marker" />
              <span className="notice-type">{notice.type}</span>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  markNotification(notice.id, false)
                  navigate(notice.path)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    markNotification(notice.id, false)
                    navigate(notice.path)
                  }
                }}
              >
                <strong>{notice.title}</strong>
                <p>{notice.copy}</p>
              </div>
              <div className="notice-actions">
                <time>{notice.time}</time>
                <button
                  type="button"
                  onClick={() => markNotification(notice.id, !notice.unread)}
                >
                  {notice.unread ? "Read" : "Unread"}
                </button>
              </div>
            </div>
          ))}
          {!notices.length && (
            <div className="empty-state">
              <Icon name="bell" size={23} />
              <strong>No notifications</strong>
              <span>Project and team updates will appear here.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function SettingsView() {
  const { settings, saveSettings } = useWorkspace()
  const [section, setSection] = useState("General")
  const [draft, setDraft] = useState<WorkspaceSettings>(settings)
  const [saved, setSaved] = useState(false)
  const sections = [
    "General",
    "Profile",
    "Privacy",
    "Notifications",
    "Integrations",
  ]

  const save = (event: FormEvent) => {
    event.preventDefault()
    saveSettings(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="workspace-page">
      <PageIntro
        index="08"
        kicker="SYSTEM PREFERENCES"
        title="Shape your"
        italic="workspace."
        description="Manage the presentation and privacy preferences for this local prototype."
      />
      <section className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {sections.map((item) => (
            <button
              type="button"
              className={section === item ? "active" : ""}
              onClick={() => setSection(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </nav>
        <form className="settings-panel" onSubmit={save}>
          <div className="data-section-head">
            <div>
              <div className="section-kicker">{section} preferences</div>
              <div className="section-title">
                {section === "Profile"
                  ? "Developer profile"
                  : section === "Integrations"
                    ? "Connected services"
                    : "Workspace behavior"}
              </div>
            </div>
            {saved && <span className="save-success">Saved locally</span>}
          </div>
          {section === "General" && (
            <>
              <div className="setting-row">
                <div>
                  <strong>Reduced motion</strong>
                  <span>
                    Minimize orbital movement and relationship animations.
                  </span>
                </div>
                <select
                  value={draft.reducedMotion}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      reducedMotion: event.target
                        .value as WorkspaceSettings["reducedMotion"],
                    })
                  }
                >
                  <option>System</option>
                  <option>On</option>
                  <option>Off</option>
                </select>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Career evidence</strong>
                  <span>
                    Include local completed tasks in prototype skill evidence.
                  </span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={draft.careerEvidence}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        careerEvidence: event.target.checked,
                      })
                    }
                  />
                  <span>{draft.careerEvidence ? "Enabled" : "Disabled"}</span>
                </label>
              </div>
            </>
          )}
          {section === "Profile" && (
            <div className="settings-form-grid">
              <Field label="Display name">
                <input
                  value={draft.profile.name}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      profile: { ...draft.profile, name: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Professional title">
                <input
                  value={draft.profile.title}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      profile: { ...draft.profile, title: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Email" wide>
                <input
                  type="email"
                  value={draft.profile.email}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      profile: { ...draft.profile, email: event.target.value },
                    })
                  }
                />
              </Field>
            </div>
          )}
          {section === "Privacy" && (
            <div className="setting-row">
              <div>
                <strong>Workspace visibility</strong>
                <span>
                  Choose who can see project and contribution signals in this
                  prototype.
                </span>
              </div>
              <select
                value={draft.visibility}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    visibility: event.target
                      .value as WorkspaceSettings["visibility"],
                  })
                }
              >
                <option>Private</option>
                <option>Team only</option>
                <option>Workspace</option>
              </select>
            </div>
          )}
          {section === "Notifications" && (
            <div className="setting-row">
              <div>
                <strong>Activity digest</strong>
                <span>
                  Choose the preferred frequency for a future email digest.
                </span>
              </div>
              <select
                value={draft.digest}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    digest: event.target.value as WorkspaceSettings["digest"],
                  })
                }
              >
                <option>Off</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
            </div>
          )}
          {section === "Integrations" && (
            <div className="integration-setting">
              <Icon name="github" size={20} />
              <span>
                <strong>GitHub</strong>
                <small>Not connected · OAuth backend required</small>
              </span>
              <button type="button" className="secondary-button" disabled>
                Unavailable
              </button>
            </div>
          )}
          <div className="settings-note">
            Preferences are stored only in this browser using localStorage. They
            are not synchronized to a backend.
          </div>
          {section !== "Integrations" && (
            <div className="form-actions">
              <button className="primary-button" type="submit">
                Save preferences
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

function RouteView({
  path,
  navigate,
  onNewProject,
}: {
  path: string
  navigate: (path: string) => void
  onNewProject: () => void
}) {
  if (path.startsWith("/projects/")) {
    return (
      <ProjectDetailView
        id={decodeURIComponent(path.slice("/projects/".length))}
        navigate={navigate}
      />
    )
  }
  switch (path) {
    case "/dashboard":
      return <DashboardView navigate={navigate} onNewProject={onNewProject} />
    case "/projects":
      return <ProjectsView navigate={navigate} />
    case "/tasks":
      return <TasksView />
    case "/team":
      return <TeamView />
    case "/career-twin":
      return <CareerTwinView navigate={navigate} />
    case "/github":
      return <GitHubView navigate={navigate} />
    case "/notifications":
      return <NotificationsView navigate={navigate} />
    case "/settings":
      return <SettingsView />
    default:
      return <DashboardView navigate={navigate} onNewProject={onNewProject} />
  }
}

function getCurrentPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  return ["/", "/login", "/register"].includes(path) ||
    navItems.some((item) => item.path === path) ||
    path.startsWith("/projects/")
    ? path
    : "/"
}

type AuthenticationState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "error"; message: string }

const publicRoutes = new Set(["/", "/login", "/register"])

export default function App() {
  const [current, setCurrent] = useState(getCurrentPath)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [authentication, setAuthentication] = useState<AuthenticationState>({
    status: "loading",
  })
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const [sessionMessage, setSessionMessage] = useState("")

  useEffect(() => {
    const handlePopState = () => setCurrent(getCurrentPath())
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setAuthentication({ status: "unauthenticated" })
      return
    }

    let active = true
    getCurrentUser(token)
      .then((user) => {
        if (active) {
          setAuthentication({ status: "authenticated", user })
          void syncWorkspaceWithBackend()
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        if (
          error instanceof AuthApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          clearSession()
          setSessionMessage("Your session expired. Log in again to continue.")
          window.history.replaceState({}, "", "/")
          setCurrent("/")
          setAuthentication({ status: "unauthenticated" })
          return
        }
        setAuthentication({
          status: "error",
          message:
            error instanceof AuthApiError
              ? error.message
              : "Unable to verify your session. Please try again.",
        })
      })

    return () => {
      active = false
    }
  }, [verificationAttempt])

  useEffect(() => {
    if (
      authentication.status === "authenticated" &&
      (current === "/login" || current === "/register")
    ) {
      window.history.replaceState({}, "", "/dashboard")
      setCurrent("/dashboard")
    } else if (
      authentication.status === "unauthenticated" &&
      !publicRoutes.has(current)
    ) {
      window.history.replaceState({}, "", "/login")
      setCurrent("/login")
    }
  }, [authentication.status, current])

  const navigate = (path: string, replace = false) => {
    if (path !== current) {
      window.history[replace ? "replaceState" : "pushState"]({}, "", path)
      setCurrent(path)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleAuthenticated = (session: AuthSession) => {
    setSessionMessage("")
    setAuthentication({ status: "authenticated", user: session.user })
    void syncWorkspaceWithBackend()
    navigate("/dashboard", true)
  }

  const handleLogout = () => {
    clearSession()
    setAuthentication({ status: "unauthenticated" })
    navigate("/", true)
  }

  const currentLabel = current.startsWith("/projects/")
    ? "Project details"
    : (navItems.find((item) => item.path === current)?.label ?? "Dashboard")

  if (current === "/") {
  return <LandingPage />
}

  if (authentication.status === "loading") {
    return (
      <div className="auth-session-screen">
        <div className="auth-session-spinner" />
        <strong>Verifying your session</strong>
        <span>Connecting to DevOrbit…</span>
      </div>
    )
  }

  if (authentication.status === "error") {
    return (
      <div className="auth-session-screen">
        <strong>We could not verify your session</strong>
        <span>{authentication.message}</span>
        <div>
          <button
            type="button"
            onClick={() => {
              setAuthentication({ status: "loading" })
              setVerificationAttempt((attempt) => attempt + 1)
            }}
          >
            Try again
          </button>
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    )
  }

  if (current === "/login") {
    return <AuthPage mode="login" onAuthenticated={handleAuthenticated} />
  }
  if (current === "/register") {
    return <AuthPage mode="register" onAuthenticated={handleAuthenticated} />
  }

  if (authentication.status !== "authenticated") {
    return (
      <div className="auth-session-screen">
        <strong>Redirecting to login…</strong>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar current={current} onNavigate={navigate} />
      <div className="app-main">
        <Topbar
          currentLabel={currentLabel}
          onNavigate={navigate}
          onLogout={handleLogout}
          user={authentication.user}
        />
        <main className="content">
          <RouteView
            path={current}
            navigate={navigate}
            onNewProject={() => setShowProjectForm(true)}
          />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => (
          <div
            key={item.label}
            className={
              (
                item.path === "/"
                  ? current === "/"
                  : current.startsWith(item.path)
              )
                ? "active"
                : ""
            }
            role="button"
            tabIndex={0}
            aria-current={
              (
                item.path === "/"
                  ? current === "/"
                  : current.startsWith(item.path)
              )
                ? "page"
                : undefined
            }
            onClick={() => navigate(item.path)}
            onKeyDown={(event) =>
              event.key === "Enter" && navigate(item.path)
            }
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label === "Career Twin" ? "Twin" : item.label}</span>
          </div>
        ))}
      </nav>
      {showProjectForm && (
        <ProjectForm onClose={() => setShowProjectForm(false)} />
      )}
    </div>
  )
}
