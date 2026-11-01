import {
  useSyncExternalStore,
  type ReactNode,
} from "react"

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
    path: "/career-twin",
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

function publish(next: WorkspaceState) {
  state = next
  persist(next)
  refreshSnapshot()
  listeners.forEach((listener) => listener())
}

function saveProject(project: Project) {
  publish({
    ...state,
    projects: state.projects.some((item) => item.id === project.id)
      ? state.projects.map((item) => item.id === project.id ? project : item)
      : [project, ...state.projects],
  })
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
}

function saveTask(task: Task) {
  publish({
    ...state,
    tasks: state.tasks.some((item) => item.id === task.id)
      ? state.tasks.map((item) => item.id === task.id ? task : item)
      : [task, ...state.tasks],
  })
}

function deleteTask(id: string) {
  publish({ ...state, tasks: state.tasks.filter((task) => task.id !== id) })
}

function saveMember(member: Member) {
  publish({
    ...state,
    members: state.members.some((item) => item.id === member.id)
      ? state.members.map((item) => item.id === member.id ? member : item)
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
}

function markAllNotificationsRead() {
  publish({
    ...state,
    notifications: state.notifications.map((notice) => ({ ...notice, unread: false })),
  })
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
