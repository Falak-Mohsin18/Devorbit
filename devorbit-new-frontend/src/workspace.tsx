import {
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { getStoredToken } from "./auth"

export type ProjectStatus = "Active" | "Planning" | "Blocked" | "Completed"
export type TaskPriority = "Low" | "Medium" | "High"
export type TaskStatus = "To do" | "In progress" | "Review" | "Done"

export type Project = {
  id: string
  name: string
  description: string
  technologies: string[]
  category: string
  startDate: string
  deadline: string
  memberIds: string[]
  status: ProjectStatus
  progress: number
}

export type Task = {
  id: string
  title: string
  description: string
  projectId: string
  assigneeId: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
}

export type Member = {
  id: string
  name: string
  email: string
  role: string
  projectIds: string[]
}

export type WorkspaceNotification = {
  id: string
  type: string
  title: string
  copy: string
  time: string
  unread: boolean
  path: string
}

export type WorkspaceSettings = {
  profile: {
    name: string
    title: string
    email: string
  }
  visibility: "Private" | "Team only" | "Workspace"
  careerEvidence: boolean
  digest: "Off" | "Daily" | "Weekly"
  reducedMotion: "System" | "On" | "Off"
}

const initialProjects: Project[] = [
  {
    id: "orbit-design",
    name: "Orbit Design System",
    description:
      "Shared product foundations and accessible component patterns.",
    technologies: ["React", "TypeScript", "CSS"],
    category: "Platform",
    startDate: "2025-01-12",
    deadline: "2025-06-14",
    memberIds: ["lena", "yuki", "maya", "jordan"],
    status: "Active",
    progress: 89,
  },
  {
    id: "pulse-analytics",
    name: "Pulse Analytics",
    description: "Real-time product intelligence and usage telemetry.",
    technologies: ["React", "Node.js", "PostgreSQL"],
    category: "Analytics",
    startDate: "2025-02-03",
    deadline: "2025-07-30",
    memberIds: ["lena", "yuki", "jordan"],
    status: "Active",
    progress: 72,
  },
  {
    id: "nova-mobile",
    name: "Nova Mobile",
    description: "A faster, more personal mobile experience for customers.",
    technologies: ["React Native", "GraphQL"],
    category: "Mobile",
    startDate: "2025-03-18",
    deadline: "2025-08-22",
    memberIds: ["maya", "diego", "jordan"],
    status: "Blocked",
    progress: 48,
  },
  {
    id: "developer-api",
    name: "Developer API",
    description: "Public integration platform for partner teams.",
    technologies: ["Node.js", "OpenAPI"],
    category: "Platform",
    startDate: "2025-04-01",
    deadline: "2025-10-10",
    memberIds: ["yuki", "jordan"],
    status: "Planning",
    progress: 16,
  },
]

const initialTasks: Task[] = [
  {
    id: "task-event-boundaries",
    title: "Document event ingestion boundaries",
    description: "Capture ownership, retry behavior, and failure boundaries.",
    projectId: "pulse-analytics",
    assigneeId: "jordan",
    priority: "High",
    status: "In progress",
    dueDate: "2025-04-22",
  },
  {
    id: "task-focus-states",
    title: "Review accessible focus states",
    description: "Audit keyboard focus across interactive primitives.",
    projectId: "orbit-design",
    assigneeId: "lena",
    priority: "Medium",
    status: "Review",
    dueDate: "2025-04-22",
  },
  {
    id: "task-cache",
    title: "Resolve GraphQL cache mismatch",
    description: "Reconcile optimistic updates after offline recovery.",
    projectId: "nova-mobile",
    assigneeId: "diego",
    priority: "High",
    status: "To do",
    dueDate: "2025-04-23",
  },
  {
    id: "task-migration",
    title: "Publish component migration guide",
    description: "Document migration steps for the new token package.",
    projectId: "orbit-design",
    assigneeId: "jordan",
    priority: "Low",
    status: "To do",
    dueDate: "2025-04-28",
  },
  {
    id: "task-metrics",
    title: "Add deployment health metrics",
    description: "Expose deployment duration and rollback frequency.",
    projectId: "nova-mobile",
    assigneeId: "yuki",
    priority: "Medium",
    status: "Done",
    dueDate: "2025-04-18",
  },
]

const initialMembers: Member[] = [
  {
    id: "jordan",
    name: "Jordan Davis",
    email: "jordan@example.dev",
    role: "Product Engineer",
    projectIds: [
      "orbit-design",
      "pulse-analytics",
      "nova-mobile",
      "developer-api",
    ],
  },
  {
    id: "lena",
    name: "Lena Morales",
    email: "lena@example.dev",
    role: "Frontend Engineer",
    projectIds: ["pulse-analytics", "orbit-design"],
  },
  {
    id: "yuki",
    name: "Yuki Kim",
    email: "yuki@example.dev",
    role: "Platform Engineer",
    projectIds: ["pulse-analytics", "developer-api"],
  },
  {
    id: "maya",
    name: "Maya Singh",
    email: "maya@example.dev",
    role: "Product Designer",
    projectIds: ["nova-mobile", "orbit-design"],
  },
  {
    id: "diego",
    name: "Diego Ruiz",
    email: "diego@example.dev",
    role: "Mobile Engineer",
    projectIds: ["nova-mobile"],
  },
]

const initialNotifications: WorkspaceNotification[] = [
  {
    id: "notice-skill",
    type: "Career Twin",
    title: "React architecture sample signal updated",
    copy: "Prototype evidence from Orbit Design System changed this sample signal.",
    time: "1h",
    unread: true,
    path: "/",
  },
  {
    id: "notice-project",
    type: "Project",
    title: "Pulse Analytics milestone reached",
    copy: "The project moved to 72% completion.",
    time: "3h",
    unread: true,
    path: "/projects/pulse-analytics",
  },
  {
    id: "notice-team",
    type: "Team",
    title: "Maya is assigned to Nova Mobile",
    copy: "Review the current project member assignments.",
    time: "Yesterday",
    unread: true,
    path: "/team",
  },
  {
    id: "notice-task",
    type: "Task",
    title: "Deployment health task completed",
    copy: "The task status changed to Done.",
    time: "Mon",
    unread: false,
    path: "/tasks",
  },
]

const initialSettings: WorkspaceSettings = {
  profile: {
    name: "Jordan Davis",
    title: "Product Engineer",
    email: "jordan@example.dev",
  },
  visibility: "Team only",
  careerEvidence: true,
  digest: "Weekly",
  reducedMotion: "System",
}

function loadValue<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

type WorkspaceContextValue = {
  projects: Project[]
  tasks: Task[]
  members: Member[]
  notifications: WorkspaceNotification[]
  settings: WorkspaceSettings
  storageError: string
  saveProject: (project: Project) => void
  deleteProject: (id: string) => void
  saveTask: (task: Task) => void
  deleteTask: (id: string) => void
  saveMember: (member: Member) => void
  removeMember: (id: string) => void
  markNotification: (id: string, unread: boolean) => void
  markAllNotificationsRead: () => void
  saveSettings: (settings: WorkspaceSettings) => void
}

type WorkspaceState = Pick<
  WorkspaceContextValue,
  "projects" | "tasks" | "members" | "notifications" | "settings"
>

const storageKeys = {
  projects: "devorbit.projects.v1",
  tasks: "devorbit.tasks.v1",
  members: "devorbit.members.v1",
  notifications: "devorbit.notifications.v1",
  settings: "devorbit.settings.v1",
} as const

let state: WorkspaceState = {
  projects: loadValue(storageKeys.projects, initialProjects),
  tasks: loadValue(storageKeys.tasks, initialTasks),
  members: loadValue(storageKeys.members, initialMembers),
  notifications: loadValue(storageKeys.notifications, initialNotifications),
  settings: loadValue(storageKeys.settings, initialSettings),
}
let storageError = ""
const listeners = new Set<() => void>()
let snapshot: WorkspaceContextValue

function persist(next: WorkspaceState) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKeys.projects, JSON.stringify(next.projects))
    window.localStorage.setItem(storageKeys.tasks, JSON.stringify(next.tasks))
    window.localStorage.setItem(storageKeys.members, JSON.stringify(next.members))
    window.localStorage.setItem(storageKeys.notifications, JSON.stringify(next.notifications))
    window.localStorage.setItem(storageKeys.settings, JSON.stringify(next.settings))
    storageError = ""
  } catch {
    storageError = "Local changes could not be saved in this browser."
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function toFrontendProject(p: any): Project {
  const id = String(p._id || p.id)
  let status: ProjectStatus = "Active"
  const s = String(p.status || "").toLowerCase()
  if (s === "planning") status = "Planning"
  else if (s === "blocked") status = "Blocked"
  else if (s === "completed") status = "Completed"
  else status = "Active"

  return {
    id,
    name: p.name || "Untitled Project",
    description: p.description || p.desc || "",
    technologies: Array.isArray(p.technologies) ? p.technologies : [],
    category: p.category || "Full Stack Development",
    startDate: p.startDate ? String(p.startDate).slice(0, 10) : "",
    deadline: p.deadline ? String(p.deadline).slice(0, 10) : "",
    memberIds: Array.isArray(p.members)
      ? p.members.map((m: any) => String(m.user?._id || m.user || m._id || m.id))
      : [],
    status,
    progress: typeof p.progress === "number" ? p.progress : 0,
  }
}

function toFrontendTask(t: any): Task {
  const id = String(t._id || t.id)
  let status: TaskStatus = "To do"
  const rawStatus = String(t.status || t.column || "").toLowerCase()
  if (rawStatus === "completed" || rawStatus === "done") status = "Done"
  else if (
    rawStatus === "in-progress" ||
    rawStatus === "in progress" ||
    rawStatus === "doing"
  )
    status = "In progress"
  else if (rawStatus === "review") status = "Review"
  else status = "To do"

  let priority: TaskPriority = "Medium"
  const rawPriority = String(t.priority || "").toLowerCase()
  if (rawPriority === "high" || rawPriority === "critical") priority = "High"
  else if (rawPriority === "low") priority = "Low"
  else priority = "Medium"

  const projectId = String(
    t.project?._id || t.project || t.projectId || ""
  )
  const assigneeId = String(
    t.assignee?._id || t.assignee || t.assigneeId || ""
  )

  return {
    id,
    title: t.title || "Untitled Task",
    description: t.description || t.desc || "",
    projectId,
    assigneeId,
    priority,
    status,
    dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : "",
  }
}

function toFrontendMember(u: any): Member {
  const id = String(u._id || u.id)
  return {
    id,
    name: u.name || u.email || "Developer",
    email: u.email || "",
    role:
      u.role === "admin"
        ? "Admin"
        : u.titleRole || u.role || "Developer",
    projectIds: [],
  }
}

function toFrontendNotification(n: any): WorkspaceNotification {
  const id = String(n._id || n.id)
  return {
    id,
    type: n.type || "system",
    title: n.title || n.message || "Notification",
    copy: n.message || n.text || "",
    time: n.createdAt
      ? new Date(n.createdAt).toLocaleDateString()
      : "Recently",
    unread: !n.read,
    path: n.project ? `/projects/${n.project}` : "/notifications",
  }
}

function toBackendTaskStatus(status: TaskStatus): string {
  switch (status) {
    case "Done":
      return "completed"
    case "In progress":
      return "in-progress"
    case "Review":
      return "review"
    case "To do":
    default:
      return "todo"
  }
}

export async function syncWorkspaceWithBackend(): Promise<void> {
  const token = getStoredToken()
  if (!token) return

  try {
    const headers = getAuthHeaders()
    const [projectsRes, tasksRes, usersRes, notificationsRes] =
      await Promise.all([
        fetch("/api/projects?limit=100", { headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/tasks", { headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/users", { headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/notifications", { headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ])

    const backendProjects: Project[] = (projectsRes?.projects || []).map(
      toFrontendProject
    )
    const backendTasks: Task[] = (tasksRes?.tasks || []).map(toFrontendTask)
    const backendMembers: Member[] = (usersRes?.users || []).map(
      toFrontendMember
    )
    const backendNotifications: WorkspaceNotification[] = (
      notificationsRes?.notifications || []
    ).map(toFrontendNotification)

    if (backendProjects.length > 0) {
      publish({
        ...state,
        projects: backendProjects,
        tasks: backendTasks.length > 0 ? backendTasks : state.tasks,
        members: backendMembers.length > 0 ? backendMembers : state.members,
        notifications:
          backendNotifications.length > 0
            ? backendNotifications
            : state.notifications,
      })
    }
  } catch (err) {
    console.error("Workspace backend sync failed:", err)
  }
}

function publish(next: WorkspaceState) {
  state = next
  persist(next)
  refreshSnapshot()
  listeners.forEach((listener) => listener())
}

function saveProject(project: Project) {
  const isExisting = project.id && /^[0-9a-fA-F]{24}$/.test(project.id)
  publish({
    ...state,
    projects: state.projects.some((item) => item.id === project.id)
      ? state.projects.map((item) => (item.id === project.id ? project : item))
      : [project, ...state.projects],
  })

  const token = getStoredToken()
  if (token) {
    const url = isExisting ? `/api/projects/${project.id}` : "/api/projects"
    const method = isExisting ? "PUT" : "POST"
    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: project.name,
        description: project.description,
        technologies: project.technologies,
        category: project.category,
        startDate: project.startDate,
        deadline: project.deadline || null,
        status: project.status.toLowerCase(),
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.project) {
          const backendId = String(data.project._id || data.project.id)
          if (backendId !== project.id) {
            publish({
              ...state,
              projects: state.projects.map((item) =>
                item.id === project.id ? { ...item, id: backendId } : item
              ),
            })
          }
        }
      })
      .catch((err) => console.error("Failed to save project to backend:", err))
  }
}

function deleteProject(id: string) {
  publish({
    ...state,
    projects: state.projects.filter((project) => project.id !== id),
    tasks: state.tasks.filter((task) => task.projectId !== id),
    members: state.members.map((member) => ({
      ...member,
      projectIds: member.projectIds.filter((projectId) => projectId !== id),
    })),
  })

  const token = getStoredToken()
  if (token && /^[0-9a-fA-F]{24}$/.test(id)) {
    fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).catch((err) => console.error("Failed to delete project on backend:", err))
  }
}

function saveTask(task: Task) {
  const isExisting = task.id && /^[0-9a-fA-F]{24}$/.test(task.id)
  publish({
    ...state,
    tasks: state.tasks.some((item) => item.id === task.id)
      ? state.tasks.map((item) => (item.id === task.id ? task : item))
      : [task, ...state.tasks],
  })

  const token = getStoredToken()
  if (token) {
    const backendStatus = toBackendTaskStatus(task.status)
    const backendPriority = task.priority.toLowerCase()
    const payload = {
      title: task.title,
      description: task.description,
      status: backendStatus,
      priority: backendPriority,
      dueDate: task.dueDate || null,
      assignee:
        task.assigneeId && /^[0-9a-fA-F]{24}$/.test(task.assigneeId)
          ? task.assigneeId
          : null,
    }

    if (isExisting) {
      fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }).catch((err) => console.error("Failed to update task on backend:", err))
    } else if (task.projectId && /^[0-9a-fA-F]{24}$/.test(task.projectId)) {
      fetch(`/api/projects/${task.projectId}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const created = data?.task || data
          if (created?._id || created?.id) {
            const backendId = String(created._id || created.id)
            publish({
              ...state,
              tasks: state.tasks.map((item) =>
                item.id === task.id ? { ...item, id: backendId } : item
              ),
            })
          }
        })
        .catch((err) => console.error("Failed to create task on backend:", err))
    }
  }
}

function deleteTask(id: string) {
  publish({ ...state, tasks: state.tasks.filter((task) => task.id !== id) })

  const token = getStoredToken()
  if (token && /^[0-9a-fA-F]{24}$/.test(id)) {
    fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).catch((err) => console.error("Failed to delete task on backend:", err))
  }
}

function saveMember(member: Member) {
  publish({
    ...state,
    members: state.members.some((item) => item.id === member.id)
      ? state.members.map((item) => (item.id === member.id ? member : item))
      : [member, ...state.members],
    projects: state.projects.map((project) => ({
      ...project,
      memberIds: member.projectIds.includes(project.id)
        ? Array.from(new Set([...project.memberIds, member.id]))
        : project.memberIds.filter((id) => id !== member.id),
    })),
  })
}

function removeMember(id: string) {
  if (id === "jordan") return
  publish({
    ...state,
    members: state.members.filter((member) => member.id !== id),
    projects: state.projects.map((project) => ({
      ...project,
      memberIds: project.memberIds.filter((memberId) => memberId !== id),
    })),
    tasks: state.tasks.map((task) =>
      task.assigneeId === id ? { ...task, assigneeId: "jordan" } : task
    ),
  })
}

function markNotification(id: string, unread: boolean) {
  publish({
    ...state,
    notifications: state.notifications.map((notice) =>
      notice.id === id ? { ...notice, unread } : notice
    ),
  })

  const token = getStoredToken()
  if (token && !unread && /^[0-9a-fA-F]{24}$/.test(id)) {
    fetch(`/api/notifications/${id}/read`, {
      method: "PUT",
      headers: getAuthHeaders(),
    }).catch((err) => console.error("Failed to mark notification read:", err))
  }
}

function markAllNotificationsRead() {
  publish({
    ...state,
    notifications: state.notifications.map((notice) => ({
      ...notice,
      unread: false,
    })),
  })

  const token = getStoredToken()
  if (token) {
    fetch(`/api/notifications/read-all`, {
      method: "PUT",
      headers: getAuthHeaders(),
    }).catch((err) => console.error("Failed to mark all notifications read:", err))
  }
}

function saveSettings(settings: WorkspaceSettings) {
  publish({ ...state, settings })
}

function refreshSnapshot() {
  snapshot = {
    ...state,
    storageError,
    saveProject,
    deleteProject,
    saveTask,
    deleteTask,
    saveMember,
    removeMember,
    markNotification,
    markAllNotificationsRead,
    saveSettings,
  }
}

refreshSnapshot()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  return children
}

export function useWorkspace() {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

// Initial sync if token is available
if (typeof window !== "undefined" && getStoredToken()) {
  void syncWorkspaceWithBackend()
}
