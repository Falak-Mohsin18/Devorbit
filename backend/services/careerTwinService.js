const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Activity = require("../models/Activity");
const GitHubIntegration = require("../models/GitHubIntegration");

const COMPLETED_STATUSES = [
  "completed",
  "complete",
  "done",
  "closed",
];

const IN_PROGRESS_STATUSES = [
  "in-progress",
  "in progress",
  "inprogress",
  "doing",
];

// ============================================================
// HELPERS
// ============================================================

const normalizeSkill = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
};

const addUnique = (array, value) => {
  if (value && !array.includes(value)) {
    array.push(value);
  }
};

const isCompleted = (task) => {
  const status = String(
    task.status ||
      task.column ||
      ""
  ).toLowerCase();

  return COMPLETED_STATUSES.includes(
    status
  );
};

const isInProgress = (task) => {
  const status = String(
    task.status ||
      task.column ||
      ""
  ).toLowerCase();

  return IN_PROGRESS_STATUSES.includes(
    status
  );
};

const isUserId = (
  value,
  userId
) => {
  if (!value) return false;

  return (
    value.toString() ===
    userId.toString()
  );
};

// ============================================================
// IMPLEMENTATION EVIDENCE HELPERS
// ============================================================

const isImplementationEvidence = (
  historyEntry,
  userId
) => {
  if (!historyEntry) {
    return false;
  }

  if (
    historyEntry.type !==
    "implementation"
  ) {
    return false;
  }

  if (!historyEntry.developer) {
    return false;
  }

  if (
    historyEntry.developer.toString() !==
    userId.toString()
  ) {
    return false;
  }

  // New evidence MUST explicitly contain
  // a skills array.
  //
  // Old implementation records without
  // skills are intentionally ignored.
  if (
    !Array.isArray(
      historyEntry.skills
    )
  ) {
    return false;
  }

  return (
    historyEntry.skills.length > 0
  );
};

const getTaskImplementationEvidence = (
  task,
  userId
) => {
  if (
    !Array.isArray(task.history)
  ) {
    return [];
  }

  return task.history.filter(
    (historyEntry) =>
      isImplementationEvidence(
        historyEntry,
        userId
      )
  );
};

// ============================================================
// GET OR CREATE SKILL
// ============================================================

const getOrCreateSkill = (
  skillMap,
  skillName
) => {
  const cleanSkill =
    normalizeSkill(skillName);

  if (!cleanSkill) {
    return null;
  }

  const key =
    cleanSkill.toLowerCase();

  if (!skillMap.has(key)) {
    skillMap.set(key, {
      skill: cleanSkill,

      sources: new Set(),

      projectCount: 0,

      // Any task where the developer
      // is creator OR assignee.
      taskCount: 0,

      // Completed tasks where the developer
      // is creator OR assignee.
      completedTaskCount: 0,

      // Explicit implementation evidence.
      implementationEvidenceCount: 0,

      activityCount: 0,

      completedActivityCount: 0,

      projects: [],

      tasks: [],

      implementationEvidence: [],

      evidenceStrength: 0,

      confidence: "Low",

      evidenceType: "exposure",
    });
  }

  return skillMap.get(key);
};

// ============================================================
// BUILD CAREER TWIN DATA
// ============================================================

const buildCareerTwinData = async (
  userId
) => {
  // ==========================================================
  // 1. USER
  // ==========================================================

  const user =
    await User.findById(userId)
      .select(
        "name email role roleType department bio location github linkedin portfolio experience education skills createdAt"
      )
      .lean();

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  // ==========================================================
  // 1B. GITHUB INTEGRATION
  // ==========================================================

  const gitHubIntegration = await GitHubIntegration.findOne({
    user: userId,
    isConnected: true,
  }).lean();

  // ==========================================================
  // 2. PROJECTS
  // ==========================================================

  const projects =
    await Project.find({
      $or: [
        {
          owner: userId,
        },
        {
          "members.user": userId,
        },
      ],
    })
      .select(
        "name description desc category owner members technologies status progress startDate deadline createdAt updatedAt"
      )
      .lean();

  const projectIds =
    projects.map(
      (project) =>
        project._id
    );

  console.log("[Career Twin] User:", String(userId));
console.log(
  "[Career Twin] Projects:",
  projects.map(p => ({
    id: String(p._id),
    name: p.name,
    owner: String(p.owner)
  }))
);

  // ==========================================================
  // 3. TASKS
  //
  // Developer-related tasks include:
  // - creator
  // - assignee
  // ==========================================================

  let tasks = [];

  if (
    projectIds.length > 0
  ) {
    tasks =
      await Task.find({
        project: {
          $in: projectIds,
        },

        $or: [
          {
            assignee: userId,
          },
          {
            creator: userId,
          },
        ],
      })
        .select(
          "title description desc project creator assignee status column priority dueDate tags history createdAt updatedAt"
        )
        .populate(
          "project",
          "name technologies"
        )
        .lean();
  }

  // ==========================================================
  // 4. ACTIVITIES
  // ==========================================================

  let activities = [];

  if (
    projectIds.length > 0
  ) {
    activities =
      await Activity.find({
        user: userId,

        project: {
          $in: projectIds,
        },
      })
        .select(
          "project task type message metadata createdAt updatedAt"
        )
        .populate(
          "project",
          "name technologies"
        )
        .populate(
          "task",
          "title tags status assignee creator"
        )
        .sort({
          createdAt: -1,
        })
        .lean();
  }

  // ==========================================================
  // 5. PROJECT STATISTICS
  // ==========================================================

  const ownedProjects =
    projects.filter(
      (project) =>
        project.owner &&
        isUserId(
          project.owner,
          userId
        )
    );

  const memberProjects =
    projects.filter(
      (project) =>
        Array.isArray(
          project.members
        ) &&
        project.members.some(
          (member) =>
            member.user &&
            isUserId(
              member.user,
              userId
            )
        )
    );

  // ==========================================================
  // 6. TASK STATISTICS
  // ==========================================================

  const assignedTasks =
    tasks.filter(
      (task) =>
        isUserId(
          task.assignee,
          userId
        )
    );

  const createdTasks =
    tasks.filter(
      (task) =>
        isUserId(
          task.creator,
          userId
        )
    );

  // IMPORTANT:
  // Completed means completed among ALL
  // developer-related tasks.
  const completedTasks =
    tasks.filter(
      (task) =>
        isCompleted(task)
    );

  const inProgressTasks =
    tasks.filter(
      (task) =>
        isInProgress(task)
    );

  // ==========================================================
  // 7. TECHNOLOGY EXPOSURE
  //
  // Project technology = EXPOSURE ONLY.
  // ==========================================================

  const technologyMap =
    new Map();

  projects.forEach(
    (project) => {
      if (
        !Array.isArray(
          project.technologies
        )
      ) {
        return;
      }

      project.technologies.forEach(
        (technology) => {
          const clean =
            normalizeSkill(
              technology
            );

          if (!clean) {
            return;
          }

          const key =
            clean.toLowerCase();

          if (
            !technologyMap.has(
              key
            )
          ) {
            technologyMap.set(
              key,
              {
                name: clean,
                projectCount: 0,
                projects: [],
              }
            );
          }

          const data =
            technologyMap.get(
              key
            );

          data.projectCount +=
            1;

          addUnique(
            data.projects,
            project.name
          );
        }
      );
    }
  );

  const technologies =
    Array.from(
      technologyMap.values()
    );

  // ==========================================================
  // 8. SKILL EVIDENCE
  // ==========================================================

  const skillMap =
    new Map();

  // ==========================================================
  // A. PROJECT TECHNOLOGY
  //
  // Project technologies create EXPOSURE.
  // ==========================================================

  technologies.forEach(
    (technology) => {
      const evidence =
        getOrCreateSkill(
          skillMap,
          technology.name
        );

      if (!evidence) {
        return;
      }

      evidence.sources.add(
        "project-technology"
      );

      evidence.projectCount =
        technology.projectCount;

      technology.projects.forEach(
        (projectName) => {
          addUnique(
            evidence.projects,
            projectName
          );
        }
      );
    }
  );

  // ==========================================================
  // B. TASK TAGS
  //
  // Task involvement = PRACTICED.
  //
  // Even if the task is completed, this alone does NOT make
  // the skill demonstrated.
  // ==========================================================

  tasks.forEach(
    (task) => {
      if (
        !Array.isArray(
          task.tags
        )
      ) {
        return;
      }

      const completed =
        isCompleted(task);

      const contributionRole =
        isUserId(
          task.assignee,
          userId
        )
          ? "assignee"
          : "creator";

      task.tags.forEach(
        (tag) => {
          const evidence =
            getOrCreateSkill(
              skillMap,
              tag
            );

          if (!evidence) {
            return;
          }

          evidence.sources.add(
            "developer-task"
          );

          evidence.taskCount +=
            1;

          if (completed) {
            evidence.completedTaskCount +=
              1;
          }

          if (
            task.project?.name
          ) {
            addUnique(
              evidence.projects,
              task.project.name
            );
          }

          addUnique(
            evidence.tasks,
            task.title
          );

          evidence.sources.add(
            `task-${contributionRole}`
          );
        }
      );
    }
  );

  // ==========================================================
  // C. EXPLICIT IMPLEMENTATION EVIDENCE
  //
  // ONLY the skills explicitly supplied in the evidence
  // become demonstrated.
  //
  // We DO NOT apply evidence to every task tag.
  // ==========================================================

  tasks.forEach(
    (task) => {
      const implementationEvidence =
        getTaskImplementationEvidence(
          task,
          userId
        );

      if (
        implementationEvidence.length ===
        0
      ) {
        return;
      }

      implementationEvidence.forEach(
        (historyEntry) => {
          const skills =
            Array.isArray(
              historyEntry.skills
            )
              ? historyEntry.skills
              : [];

          skills.forEach(
            (skill) => {
              const evidence =
                getOrCreateSkill(
                  skillMap,
                  skill
                );

              if (!evidence) {
                return;
              }

              evidence.sources.add(
                "implementation-evidence"
              );

              evidence.implementationEvidenceCount +=
                1;

              if (
                task.project?.name
              ) {
                addUnique(
                  evidence.projects,
                  task.project.name
                );
              }

              addUnique(
                evidence.tasks,
                task.title
              );

              // Keep the actual implementation
              // evidence available for the AI.
              evidence.implementationEvidence.push(
                {
                  description:
                    historyEntry.description ||
                    "",

                  skills:
                    historyEntry.skills ||
                    [],

                  commitHash:
                    historyEntry.commitHash ||
                    "",

                  commitUrl:
                    historyEntry.commitUrl ||
                    "",

                  prUrl:
                    historyEntry.prUrl ||
                    "",

                  date:
                    historyEntry.createdAt ||
                    null,

                  task:
                    task.title,

                  project:
                    task.project?.name ||
                    null,
                }
              );
            }
          );
        }
      );
    }
  );

  // ==========================================================
  // D. DEVELOPER ACTIVITY
  //
  // Activities are useful supporting evidence, but do not
  // independently create implementation evidence.
  // ==========================================================

  activities.forEach(
    (activity) => {
      const task =
        activity.task;

      if (
        !task ||
        !Array.isArray(
          task.tags
        )
      ) {
        return;
      }

      const meaningful = [
        "task-completed",
        "task-updated",
      ].includes(
        activity.type
      );

      if (!meaningful) {
        return;
      }

      task.tags.forEach(
        (tag) => {
          const evidence =
            getOrCreateSkill(
              skillMap,
              tag
            );

          if (!evidence) {
            return;
          }

          evidence.sources.add(
            "developer-activity"
          );

          evidence.activityCount +=
            1;

          if (
            activity.type ===
            "task-completed"
          ) {
            evidence.completedActivityCount +=
              1;
          }

          if (
            activity.project?.name
          ) {
            addUnique(
              evidence.projects,
              activity.project.name
            );
          }

          addUnique(
            evidence.tasks,
            task.title
          );
        }
      );
    }
  );

  // ==========================================================
  // 8E. GITHUB OBSERVED SKILLS & CODEBASE ACTIVITY
  // ==========================================================

  if (gitHubIntegration && gitHubIntegration.isConnected) {
    if (Array.isArray(gitHubIntegration.skillsObserved)) {
      gitHubIntegration.skillsObserved.forEach((observed) => {
        const evidence = getOrCreateSkill(skillMap, observed.skill);
        if (!evidence) return;

        evidence.sources.add("github-observed");
        evidence.githubStrength = observed.strength;
        evidence.githubRepoCount = observed.repoCount || 1;
        evidence.githubEvidence = observed.evidence || "";
        if (Array.isArray(observed.repos)) {
          observed.repos.forEach((repoName) => {
            addUnique(evidence.projects, `GitHub: ${repoName}`);
          });
        }
      });
    }

    if (Array.isArray(gitHubIntegration.languageDistribution)) {
      gitHubIntegration.languageDistribution.forEach((lang) => {
        const evidence = getOrCreateSkill(skillMap, lang.language);
        if (!evidence) return;
        evidence.sources.add("github-language");
        evidence.githubLanguagePercentage = lang.percentage;
        evidence.githubByteCount = lang.totalBytes;
      });
    }
  }

  // ==========================================================
  // 9. CALCULATE SKILL EVIDENCE
  // ==========================================================

  const skillEvidence =
    Array.from(
      skillMap.values()
    ).map(
      (evidence) => {
        let score = 0;

        // ------------------------------------------------------
        // Project exposure
        // ------------------------------------------------------

        score +=
          evidence.projectCount *
          10;

        // ------------------------------------------------------
        // Developer task involvement
        // ------------------------------------------------------

        score +=
          evidence.taskCount *
          10;

        // ------------------------------------------------------
        // Completed task
        //
        // This contributes strength, but DOES NOT itself
        // change the evidence type to demonstrated.
        // ------------------------------------------------------

        score +=
          evidence.completedTaskCount *
          15;

        // ------------------------------------------------------
        // Developer activity
        // ------------------------------------------------------

        score +=
          evidence.activityCount *
          5;

        // ------------------------------------------------------
        // Completed activity
        // ------------------------------------------------------

        score +=
          evidence.completedActivityCount *
          15;

        // ------------------------------------------------------
        // Explicit implementation evidence
        // ------------------------------------------------------

        score +=
          evidence.implementationEvidenceCount *
          30;

        // ------------------------------------------------------
        // GitHub observed evidence
        // ------------------------------------------------------

        if (evidence.sources.has("github-observed")) {
          score +=
            (evidence.githubStrength === "Demonstrated" ? 20 : 12) +
            Math.min(15, (evidence.githubRepoCount || 1) * 3);
        }

        if (evidence.sources.has("github-language")) {
          score += Math.min(
            10,
            Math.round((evidence.githubLanguagePercentage || 0) / 10)
          );
        }

        evidence.evidenceStrength =
          Math.min(
            100,
            score
          );

        // ======================================================
        // EVIDENCE TYPE
        //
        // EXPLICIT implementation evidence is the primary direct
        // route to demonstrated.
        // GitHub activity provides practiced / exposure evidence.
        // ======================================================

        if (
          evidence.implementationEvidenceCount >
          0
        ) {
          evidence.evidenceType =
            "demonstrated";
        } else if (
          evidence.taskCount > 0 ||
          evidence.activityCount > 0
        ) {
          evidence.evidenceType =
            "practiced";
        } else if (evidence.sources.has("github-observed")) {
          evidence.evidenceType =
            evidence.githubStrength === "Demonstrated" && (evidence.githubRepoCount >= 3)
              ? "practiced"
              : "exposure";
        } else {
          evidence.evidenceType =
            "exposure";
        }

        // ======================================================
        // CONFIDENCE
        // ======================================================

        if (
          evidence.evidenceStrength >=
          70
        ) {
          evidence.confidence =
            "High";
        } else if (
          evidence.evidenceStrength >=
          40
        ) {
          evidence.confidence =
            "Medium";
        } else {
          evidence.confidence =
            "Low";
        }

        return {
          ...evidence,

          sources:
            Array.from(
              evidence.sources
            ),
        };
      }
    );

  // ==========================================================
  // SORT SKILLS
  // ==========================================================

  skillEvidence.sort(
    (a, b) =>
      b.evidenceStrength -
      a.evidenceStrength
  );

  // ==========================================================
  // 10. ACTIVITY BREAKDOWN
  // ==========================================================

  const activityBreakdown =
    {};

  activities.forEach(
    (activity) => {
      activityBreakdown[
        activity.type
      ] =
        (activityBreakdown[
          activity.type
        ] || 0) + 1;
    }
  );

  // ==========================================================
  // 11. IMPLEMENTATION EVIDENCE COUNT
  // ==========================================================

  const implementationEvidenceCount =
    tasks.reduce(
      (total, task) => {
        return (
          total +
          getTaskImplementationEvidence(
            task,
            userId
          ).length
        );
      },
      0
    );

  // ==========================================================
  // 12. GROWTH TIMELINE
  // ==========================================================

  const growthTimeline =
    [];

  // ----------------------------------------------------------
  // Projects
  // ----------------------------------------------------------

  projects.forEach(
    (project) => {
      growthTimeline.push({
        type: "project",

        date:
          project.createdAt,

        title:
          `Joined project: ${project.name}`,

        technologies:
          project.technologies ||
          [],
      });
    }
  );

  // ----------------------------------------------------------
  // Tasks
  // ----------------------------------------------------------

  tasks.forEach(
    (task) => {
      growthTimeline.push({
        type: "task",

        date:
          task.createdAt,

        title:
          task.title,

        project:
          task.project?.name ||
          "Unknown project",

        status:
          task.status ||
          task.column,

        tags:
          task.tags ||
          [],

        contributionRole:
          isUserId(
            task.assignee,
            userId
          )
            ? "assignee"
            : "creator",
      });
    }
  );

  // ----------------------------------------------------------
  // Implementation evidence
  // ----------------------------------------------------------

  tasks.forEach(
    (task) => {
      const evidenceEntries =
        getTaskImplementationEvidence(
          task,
          userId
        );

      evidenceEntries.forEach(
        (entry) => {
          growthTimeline.push({
            type:
              "implementation",

            date:
              entry.createdAt,

            title:
              `Implementation evidence: ${task.title}`,

            project:
              task.project?.name ||
              "Unknown project",

            description:
              entry.description ||
              "",

            skills:
              entry.skills ||
              [],

            commitHash:
              entry.commitHash ||
              "",

            commitUrl:
              entry.commitUrl ||
              "",

            prUrl:
              entry.prUrl ||
              "",
          });
        }
      );
    }
  );

  // ----------------------------------------------------------
  // Activities
  // ----------------------------------------------------------

  activities.forEach(
    (activity) => {
      growthTimeline.push({
        type: "activity",

        date:
          activity.createdAt,

        activityType:
          activity.type,

        message:
          activity.message,

        project:
          activity.project?.name ||
          "Unknown project",

        task:
          activity.task?.title ||
          null,

        tags:
          activity.task?.tags ||
          [],
      });
    }
  );

  growthTimeline.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  // ==========================================================
  // 13. RETURN CAREER TWIN DATA
  // ==========================================================

  return {
    user,

    projects,

    statistics: {
      totalProjects:
        projects.length,

      ownedProjects:
        ownedProjects.length,

      memberProjects:
        memberProjects.length,

      totalTasks:
        tasks.length,

      assignedTasks:
        assignedTasks.length,

      createdTasks:
        createdTasks.length,

      completedTasks:
        completedTasks.length,

      inProgressTasks:
        inProgressTasks.length,

      totalActivities:
        activities.length,

      implementationEvidenceCount,
    },

    contributionSummary: {
      projects:
        projects.length,

      tasksCreated:
        createdTasks.length,

      tasksAssigned:
        assignedTasks.length,

      tasksCompleted:
        completedTasks.length,

      tasksInProgress:
        inProgressTasks.length,

      meaningfulActivities:
        activities.filter(
          (activity) =>
            [
              "task-completed",
              "task-updated",
            ].includes(
              activity.type
            )
        ).length,

      totalActivities:
        activities.length,

      implementationEvidence:
        implementationEvidenceCount,
    },

    technologies,

    skillEvidence,

    activityBreakdown,

    growthTimeline,

    githubConnected: Boolean(
      gitHubIntegration && gitHubIntegration.isConnected
    ),

    githubData:
      gitHubIntegration && gitHubIntegration.isConnected
        ? {
            username: gitHubIntegration.username,
            name: gitHubIntegration.name,
            profileUrl: gitHubIntegration.profileUrl,
            avatarUrl: gitHubIntegration.avatarUrl,
            publicRepos: gitHubIntegration.publicRepos,
            followers: gitHubIntegration.followers,
            following: gitHubIntegration.following,
            lastSyncedAt: gitHubIntegration.lastSyncedAt,
            repositories: (gitHubIntegration.repositories || [])
              .slice(0, 10)
              .map((r) => ({
                name: r.name,
                description: r.description,
                language: r.language,
                languages: r.languages || [],
                stars: r.stars,
                forks: r.forks,
                url: r.htmlUrl,
              })),
            languageDistribution:
              gitHubIntegration.languageDistribution || [],
            activity: {
              totalCommitsObserved:
                gitHubIntegration.activity?.totalCommitsObserved || 0,
              totalPullRequestsObserved:
                gitHubIntegration.activity?.totalPullRequestsObserved || 0,
              recentCommits: (
                gitHubIntegration.activity?.recentCommits || []
              ).slice(0, 10),
              pullRequests: (
                gitHubIntegration.activity?.pullRequests || []
              ).slice(0, 5),
            },
            skillsObserved: gitHubIntegration.skillsObserved || [],
          }
        : null,
  };
};

module.exports = {
  buildCareerTwinData,
};