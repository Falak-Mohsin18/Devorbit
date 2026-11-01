import { getStoredToken } from "./auth";

export type ImplementationEvidence = {
  description: string;
  skills: string[];
  commitHash?: string;
  commitUrl?: string;
  prUrl?: string;
  date?: string;
  task?: string;
  project?: string;
};

export type SkillEvidenceItem = {
  skill: string;
  evidenceType: "demonstrated" | "practiced" | "exposure";
  confidence: string;
  evidenceStrength: number;
  sources: string[];
  projects: string[];
  tasks: string[];
  projectCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
  activityCount?: number;
  implementationEvidenceCount?: number;
  implementationEvidence?: ImplementationEvidence[];
};

export type CareerTwinEvidence = {
  statistics?: {
    totalProjects: number;
    ownedProjects: number;
    memberProjects: number;
    totalTasks: number;
    assignedTasks: number;
    createdTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalActivities: number;
    implementationEvidenceCount: number;
  };
  contributionSummary?: {
    projects: number;
    tasksCreated: number;
    tasksAssigned: number;
    tasksCompleted: number;
    tasksInProgress: number;
    meaningfulActivities: number;
    totalActivities: number;
    implementationEvidence: number;
  };
  technologies?: Array<{
    name: string;
    projectCount: number;
    projects: string[];
  }>;
  skillEvidence?: SkillEvidenceItem[];
  activityBreakdown?: Record<string, number>;
  githubConnected?: boolean;
  githubData?: {
    username: string;
    name?: string;
    avatarUrl?: string;
    profileUrl?: string;
    publicRepos: number;
    followers: number;
    following: number;
    lastSyncedAt?: string;
    repositories?: Array<{
      name: string;
      description: string;
      language: string;
      stars: number;
      forks: number;
      url: string;
    }>;
    languageDistribution?: Array<{
      language: string;
      percentage: number;
      totalBytes?: number;
      color?: string;
    }>;
    activity?: {
      totalCommitsObserved: number;
      totalPullRequestsObserved: number;
      recentCommits?: Array<{
        sha: string;
        message: string;
        date: string;
        repoName: string;
      }>;
    };
    skillsObserved?: Array<{
      skill: string;
      strength: string;
      evidence: string;
      repoCount: number;
    }>;
  } | null;
};

export type CareerTwinResult = {
  careerReadiness: number | null;
  careerLevel: string;
  summary: string;
  strengths: Array<{
    name: string;
    evidenceLevel: string;
    confidence: string;
    evidence: string;
    projects: string[];
    tasks: string[];
  }>;
  skillGaps: Array<{
    name: string;
    reason: string;
    priority: string;
    recommendedAction: string;
  }>;
  exposureSkills: Array<{
    name: string;
    project: string;
    note: string;
  }>;
  recommendedSkills: Array<{
    priority: number;
    skill: string;
    level: string;
    description: string;
  }>;
  careerPaths: Array<{
    role: string;
    reason: string;
    requiredNextSkills: string[];
    fitScore?: number;
    strengths?: string[];
    missingSkills?: string[];
    recommendedTasks?: string[];
    nextAction?: string;
  }>;
  growthInsights: string[];
  _isFallback?: boolean;
  aiUnavailable?: boolean;
  message?: string;
  evidence?: CareerTwinEvidence;
};

export type ClassifiedSkill = {
  name: string;
  category: "demonstrated" | "partial" | "emerging" | "needs_evidence" | "missing";
  currentEvidence: string;
  targetRequirement: string;
  gap: string;
  practicalNextStep: string;
  isGenuineGap: boolean;
};

export type RoadmapItem = {
  id: string;
  itemId?: string;
  title: string;
  description: string;
  whyItMatters: string;
  howToDemonstrate: string;
  skills: string[];
  status: "planned" | "in_progress" | "completed";
  stage?: string;
  targetRole?: string;
  completedAt?: string;
  updatedAt?: string;
};

export type RoadmapStage = {
  stage: string;
  items: RoadmapItem[];
};

export type SkillGapResult = {
  targetRole: string;
  matchScore: number;
  fitReason?: string;
  demonstratedSkills: string[];
  partiallyDemonstratedSkills: string[];
  emergingSkills: string[];
  needsEvidenceSkills: string[];
  missingSkills: string[];
  classifiedSkills: ClassifiedSkill[];
  recommendedNextSkills: Array<{
    skill: string;
    priority: string;
    reason: string;
    practicalProject: string;
  }>;
  roadmapStages?: RoadmapStage[];
  _isFallback?: boolean;
};

export type JobMatchResult = {
  matchRate: number;
  scoringBreakdown: {
    demonstratedWeight: string;
    executionWeight: string;
    exposureWeight: string;
    verificationWeight: string;
  };
  keyStrengthsInfluencing: string[];
  keyGapsInfluencing: string[];
  matchedSkills: Array<{
    skill: string;
    evidence: string;
    confidence: string;
    source: string;
  }>;
  missingCompetencies: Array<{
    skill: string;
    reason: string;
    priority: string;
  }>;
  relevantProjects: Array<{
    name: string;
    technologies: string[];
    contributionSummary: string;
    matchRelevance: string;
  }>;
  recommendedImprovements: string[];
  recommendation: string;
  _isFallback?: boolean;
};

export async function getCareerTwinProfile(refresh = false): Promise<CareerTwinResult> {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Please log in again to load your Career Twin.");
  }

  const response = await fetch("/api/ai/career/analyze", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Career Twin request failed (${response.status})`,
    );
  }

  if (!data.careerTwin) {
    throw new Error("The server did not return a Career Twin profile.");
  }

  const careerTwin = data.careerTwin as CareerTwinResult;
  if (data.evidence) {
    careerTwin.evidence = data.evidence;
  }

  return careerTwin;
}

export async function getCareerSkillGap(targetRole: string): Promise<SkillGapResult> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Please log in again to analyze skill gaps.");
  }

  const response = await fetch("/api/ai/career/skill-gap", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetRole }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to analyze skill gap.");
  }

  return data as SkillGapResult;
}

export async function getCareerJobMatch(targetRole: string, jobDescription?: string): Promise<JobMatchResult> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Please log in again to match jobs.");
  }

  const response = await fetch("/api/ai/career/job-match", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetRole, jobDescription }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to evaluate job match.");
  }

  return data as JobMatchResult;
}

export async function getPersistedRoadmap(): Promise<{ targetRole: string; roadmap: RoadmapItem[] }> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Please log in again to load your roadmap.");
  }

  const response = await fetch("/api/ai/career/roadmap", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to load persisted roadmap.");
  }

  return {
    targetRole: data.targetRole || "Full-Stack Developer",
    roadmap: data.roadmap || [],
  };
}

export async function updatePersistedRoadmapItem(item: {
  itemId: string;
  status: "planned" | "in_progress" | "completed";
  stage?: string;
  title?: string;
  description?: string;
  whyItMatters?: string;
  howToDemonstrate?: string;
  skills?: string[];
  targetRole?: string;
}): Promise<RoadmapItem[]> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Please log in again to save roadmap progress.");
  }

  const response = await fetch("/api/ai/career/roadmap/status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to update roadmap item status.");
  }

  return data.roadmap as RoadmapItem[];
}

export async function updatePersistedTargetRole(targetRole: string): Promise<string> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Please log in again to update your target role.");
  }

  const response = await fetch("/api/ai/career/target-role", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetRole }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to save target role.");
  }

  return data.targetRole as string;
}
