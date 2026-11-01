const API_BASE = "/api/projects";

export type BackendProject = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  desc?: string;
  tagline?: string;
  category?: string;
  status?: string;
  visibility?: string;
  technologies?: string[];
  startDate?: string;
  deadline?: string | null;
  progress?: number;
  owner?: unknown;
  members?: unknown[];
  tasks?: unknown[];
  [key: string]: unknown;
};

type ProjectsResponse = {
  count: number;
  total: number;
  projects: BackendProject[];
};

function getToken(): string {
  // Use the same token key that your working login flow uses.
  const token =
    localStorage.getItem("devorbit_auth_token") ||
    localStorage.getItem("token");

  if (!token) {
    throw new Error("Your login session has expired. Please log in again.");
  }

  return token;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Project request failed (${response.status})`,
    );
  }

  return data as T;
}

export async function getProjects(): Promise<ProjectsResponse> {
  return request<ProjectsResponse>("?limit=100");
}

export async function createProject(
  project: {
    name: string;
    description: string;
    technologies: string[];
    category: string;
    startDate: string;
    deadline: string;
    status: string;
  },
): Promise<BackendProject> {
  const result = await request<{ project: BackendProject }>("", {
    method: "POST",
    body: JSON.stringify({
      ...project,
      deadline: project.deadline || null,
      status: project.status.toLowerCase(),
    }),
  });

  return result.project;
}


export async function updateProject(
  id: string,
  project: Partial<BackendProject>,
): Promise<BackendProject> {
  const result = await request<{ project: BackendProject }>(
    `/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(project),
    },
  );

  return result.project;
}

export async function deleteProject(id: string): Promise<void> {
  await request<{ message: string }>(
    `/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}