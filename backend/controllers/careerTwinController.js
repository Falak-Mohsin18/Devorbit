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

// Normalize a value into a clean string
const normalizeSkill = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
};

// Check whether two skill names represent the same skill
const sameSkill = (a, b) => {
  return (
    normalizeSkill(a).toLowerCase() ===
    normalizeSkill(b).toLowerCase()
  );
};

// Add a skill to the evidence map
const getOrCreateSkill = (
  skillMap,
  skillName
) => {
  const cleanSkill =
    normalizeSkill(skillName);

  if (!cleanSkill) return null;

  const key =
    cleanSkill.toLowerCase();

  if (!skillMap.has(key)) {
    skillMap.set(key, {
      skill: cleanSkill,

      // How the skill was discovered
      sources: new Set(),

      // Actual evidence
      projectCount: 0,
      taskCount: 0,
      completedTaskCount: 0,
      activityCount: 0,
      completedActivityCount: 0,

      projects: [],
      tasks: [],

      // Calculated later
      evidenceStrength: 0,
      confidence: "Low",
      evidenceType: "exposure",
    });
  }

  return skillMap.get(key);
};

// Add a project name without duplicates
const addUnique = (
  array,
  value
) => {
  if (
    value &&
    !array.includes(value)
  ) {
    array.push(value);
  }
};

// ============================================================
// GET CAREER TWIN
// GET /api/ai/career/twin
// ============================================================

const getCareerTwin = async (
  req,
  res
) => {
  try {
    const userId =
      req.user._id;

    // ========================================================
    // 1. USER PROFILE
    // ========================================================

    const user =
      await User.findById(userId)
        .select(
          "name email role roleType department bio location github linkedin portfolio experience education skills createdAt"
        )
        .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    const gitHubIntegration = await GitHubIntegration.findOne({
      user: userId,
      isConnected: true,
    }).lean();

    // ========================================================
    // 2. PROJECTS
    // ========================================================

    const projects =
      await Project.find({
        $or: [
          { owner: userId },
          {
            "members.user":
              userId,
          },
        ],
      })
        .select(
          "name description desc tagline category owner members technologies status progress startDate deadline createdAt updatedAt"
        )
        .lean();

    const projectIds =
      projects.map(
        (project) =>
          project._id
      );

    // ========================================================
    // 3. TASKS
    //
    // We retrieve tasks the developer created OR was assigned.
    // But later we distinguish between:
    //
    // createdTasks = project management activity
    // assignedTasks = implementation ownership
    // ========================================================

    let tasks = [];

    if (projectIds.length > 0) {
      tasks =
        await Task.find({
          project: {
            $in: projectIds,
          },

          $or: [
            { assignee: userId },
            { creator: userId },
          ],
        })
          .select(
            "title description desc project creator assignee assigneeName status column priority dueDate tags history createdAt updatedAt"
          )
          .populate(
            "project",
            "name technologies"
          )
          .lean();
    }

    // ========================================================
    // 4. ACTIVITIES
    // ========================================================

    let activities = [];

    if (projectIds.length > 0) {
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

    // ========================================================
    // 5. PROJECT STATISTICS
    // ========================================================

    const ownedProjects =
      projects.filter(
        (project) =>
          project.owner &&
          project.owner.toString() ===
            userId.toString()
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
              member.user.toString() ===
                userId.toString()
          )
      );

    // ========================================================
    // 6. TASK STATISTICS
    // ========================================================

    const assignedTasks =
      tasks.filter(
        (task) =>
          task.assignee &&
          task.assignee.toString() ===
            userId.toString()
      );

    const createdTasks =
      tasks.filter(
        (task) =>
          task.creator &&
          task.creator.toString() ===
            userId.toString()
      );

    const completedTasks =
      assignedTasks.filter(
        (task) => {
          const status =
            String(
              task.status ||
                task.column ||
                ""
            ).toLowerCase();

          return COMPLETED_STATUSES.includes(
            status
          );
        }
      );

    const inProgressTasks =
      assignedTasks.filter(
        (task) => {
          const status =
            String(
              task.status ||
                task.column ||
                ""
            ).toLowerCase();

          return IN_PROGRESS_STATUSES.includes(
            status
          );
        }
      );

    // ========================================================
    // 7. TECHNOLOGY EXPOSURE
    //
    // Important:
    // A project technology is NOT automatically treated as
    // demonstrated skill.
    //
    // Example:
    // DevOrbit uses MongoDB.
    //
    // That proves project exposure, but not necessarily that
    // Falak personally implemented MongoDB functionality.
    // ========================================================

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

            if (!clean) return;

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

            const technologyData =
              technologyMap.get(
                key
              );

            technologyData.projectCount +=
              1;

            addUnique(
              technologyData.projects,
              project.name
            );
          }
        );
      }
    );

    const technologies =
      Array.from(
        technologyMap.values()
      ).sort(
        (a, b) =>
          b.projectCount -
          a.projectCount
      );

    // ========================================================
    // 8. BUILD SKILL EVIDENCE
    // ========================================================

    const skillMap =
      new Map();

    // --------------------------------------------------------
    // A. Project technology = EXPOSURE
    // --------------------------------------------------------

    technologies.forEach(
      (technology) => {
        const evidence =
          getOrCreateSkill(
            skillMap,
            technology.name
          );

        if (!evidence) return;

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

    // --------------------------------------------------------
    // B. Assigned task tags = IMPLEMENTATION EVIDENCE
    // --------------------------------------------------------

    assignedTasks.forEach(
      (task) => {
        if (
          !Array.isArray(
            task.tags
          )
        ) {
          return;
        }

        const status =
          String(
            task.status ||
              task.column ||
              ""
          ).toLowerCase();

        const completed =
          COMPLETED_STATUSES.includes(
            status
          );

        task.tags.forEach(
          (tag) => {
            const evidence =
              getOrCreateSkill(
                skillMap,
                tag
              );

            if (!evidence)
              return;

            evidence.sources.add(
              "assigned-task"
            );

            evidence.taskCount +=
              1;

            if (completed) {
              evidence.completedTaskCount +=
                1;
            }

            if (
              task.project &&
              task.project.name
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
          }
        );
      }
    );

    // --------------------------------------------------------
    // C. Activities on tasks = DIRECT ACTION EVIDENCE
    //
    // This is especially useful because an activity records
    // what the developer actually did.
    // --------------------------------------------------------

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

        const isMeaningfulAction =
          [
            "task-completed",
            "task-updated",
          ].includes(
            activity.type
          );

        if (!isMeaningfulAction) {
          return;
        }

        task.tags.forEach(
          (tag) => {
            const evidence =
              getOrCreateSkill(
                skillMap,
                tag
              );

            if (!evidence)
              return;

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
              activity.project &&
              activity.project.name
            ) {
              addUnique(
                evidence.projects,
                activity.project.name
              );
            }

            if (task.title) {
              addUnique(
                evidence.tasks,
                task.title
              );
            }
          }
        );
      }
    );

    // ========================================================
    // 9. CALCULATE EVIDENCE STRENGTH
    // ========================================================

    const skillEvidence =
      Array.from(
        skillMap.values()
      ).map(
        (evidence) => {
          /*
           * Scoring model:
           *
           * Project exposure:
           * +10 per project
           *
           * Assigned task:
           * +10 per task
           *
           * Completed task:
           * +15
           *
           * Developer activity:
           * +5
           *
           * Completed activity:
           * +15
           *
           * Maximum:
           * 100
           */

          let score = 0;

          score +=
            evidence.projectCount *
            10;

          score +=
            evidence.taskCount *
            10;

          score +=
            evidence.completedTaskCount *
            15;

          score +=
            evidence.activityCount *
            5;

          score +=
            evidence.completedActivityCount *
            15;

          evidence.evidenceStrength =
            Math.min(
              100,
              score
            );

          // Determine evidence type
          if (
            evidence.completedTaskCount >
              0 ||
            evidence.completedActivityCount >
              0
          ) {
            evidence.evidenceType =
              "demonstrated";
          } else if (
            evidence.taskCount >
              0 ||
            evidence.activityCount >
              0
          ) {
            evidence.evidenceType =
              "practiced";
          } else {
            evidence.evidenceType =
              "exposure";
          }

          // Determine confidence
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

    skillEvidence.sort(
      (a, b) =>
        b.evidenceStrength -
        a.evidenceStrength
    );

    // ========================================================
    // 10. PROFILE SKILLS
    // ========================================================

    let profileSkills = [];

    if (
      Array.isArray(
        user.skills
      )
    ) {
      profileSkills =
        user.skills;
    } else if (
      typeof user.skills ===
      "string"
    ) {
      profileSkills =
        user.skills
          .split(",")
          .map((skill) =>
            skill.trim()
          )
          .filter(Boolean);
    }

    // ========================================================
    // 11. ACTIVITY BREAKDOWN
    // ========================================================

    const activityBreakdown =
      {};

    activities.forEach(
      (activity) => {
        if (
          !activityBreakdown[
            activity.type
          ]
        ) {
          activityBreakdown[
            activity.type
          ] = 0;
        }

        activityBreakdown[
          activity.type
        ] += 1;
      }
    );

    // ========================================================
    // 12. GROWTH TIMELINE
    // ========================================================

    const growthTimeline =
      [];

    // Projects
    projects.forEach(
      (project) => {
        growthTimeline.push({
          type: "project",
          date:
            project.createdAt ||
            project.startDate,

          title:
            `Joined project: ${project.name}`,

          technologies:
            project.technologies ||
            [],
        });
      }
    );

    // Tasks
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
            task.tags || [],

          contributionRole:
            task.assignee &&
            task.assignee.toString() ===
              userId.toString()
              ? "assignee"
              : "creator",
        });
      }
    );

    // Activities
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

    // ========================================================
    // 13. CONTRIBUTION SUMMARY
    // ========================================================

    const contributionSummary = {
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
    };

    // ========================================================
    // 14. CAREER TWIN
    // ========================================================

    const careerTwin = {
      developer: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleType:
          user.roleType,
        department:
          user.department,
        education:
          user.education,
        experience:
          user.experience,
        profileSkills,
      },

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
      },

      contributionSummary,

      technologies,

      skillEvidence,

      activityBreakdown,

      growthTimeline,

      projects:
        projects.map(
          (project) => ({
            id: project._id,

            name:
              project.name,

            description:
              project.description ||
              project.desc ||
              "",

            category:
              project.category,

            status:
              project.status,

            progress:
              project.progress,

            technologies:
              project.technologies ||
              [],

            createdAt:
              project.createdAt,
          })
        ),

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
              languageDistribution:
                gitHubIntegration.languageDistribution || [],
              skillsObserved: gitHubIntegration.skillsObserved || [],
            }
          : null,

      generatedAt:
        new Date(),
    };

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.json({
      success: true,
      careerTwin,
    });
  } catch (error) {
    console.error(
      "Career Twin Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to build Career Twin",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  getCareerTwin,
};