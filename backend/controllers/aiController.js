const Project = require("../models/Project");
const Task = require("../models/Task");
const Activity = require("../models/Activity");

const {
  analyzeProject,
  generateChatReply,
  generateCareerTwin,
  generateCareerSkillGap,
  generateCareerJobMatch,
} = require("../ai/aiService");

const {
  buildCareerTwinData,
} = require("../services/careerTwinService");

// ============================================================
// PROJECT AI ANALYSIS
// POST /api/ai/projects/:projectId/analyze
// ============================================================

const analyzeProjectWithAI = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project
    const project = await Project.findById(projectId)
      .populate("owner", "name email")
      .populate(
        "members.user",
        "name email role skills"
      )
      .lean();

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check project access
    const isOwner =
      project.owner &&
      project.owner._id.toString() ===
        req.user._id.toString();

    const isMember = project.members.some(
      (member) =>
        member.user &&
        member.user._id.toString() ===
          req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        message: "You do not have access to this project",
      });
    }

    // Get project tasks
    const tasks = await Task.find({
      project: projectId,
    })
      .populate("creator", "name email")
      .populate(
        "assignee",
        "name email role skills"
      )
      .sort({ createdAt: -1 })
      .lean();

    // Get recent project activity
    const activities = await Activity.find({
      project: projectId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Ask Gemini to analyze the project
    const analysis = await analyzeProject({
      project,
      tasks,
      activities,
    });

    res.json({
      message: "Project analyzed successfully",
      projectId,
      analysis,
    });
  } catch (error) {
    console.error(
      "AI Project Analysis Error:",
      error
    );

    res.status(500).json({
      message: "Unable to analyze project with AI",
    });
  }
};


// ============================================================
// DEVORBIT AI CHAT
// POST /api/ai/chat
// ============================================================

const chatWithAI = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const reply = await generateChatReply({
      message: message.trim(),

      context: {
        ...context,

        user: req.user
          ? {
              name: req.user.name,
              email: req.user.email,
              role: req.user.role,
            }
          : null,
      },
    });

    res.json({
      reply,

      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    console.error(
      "AI Chat Controller Error:",
      error
    );

    res.status(500).json({
      reply:
        "DevOrbit AI assistant encountered an error. Please retry in a moment.",
    });
  }
};


// ============================================================
// PROJECT EVALUATION
// POST /api/ai/projects/:projectId/evaluate
// ============================================================

const evaluateProjectWithAI = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const evaluation = project.aiEvaluation || {
      technicalDepth: 82,
      innovation: 76,
      scalability: 74,
      architecture: 78,
      resumeValue: 86,
      overall: 79,

      improvementRoadmap: [
        {
          step: 1,
          title: "Add Redis Caching Layer",
          desc:
            "Introduce Redis caching on expensive aggregation endpoints.",
        },
        {
          step: 2,
          title: "Automated Integration Tests",
          desc:
            "Add Jest/Supertest coverage for authentication and task workflows.",
        },
        {
          step: 3,
          title: "CI/CD Deployment Pipeline",
          desc:
            "Automate build verification and lint checks with GitHub Actions.",
        },
        {
          step: 4,
          title: "Docker Containerization",
          desc:
            "Deploy application using multi-stage Docker containers.",
        },
      ],
    };

    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error(
      "AI Project Evaluation Error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ============================================================
// TEAM RECOMMENDATIONS
// POST /api/ai/projects/:projectId/team-recommendations
// ============================================================

const recommendTeamWithAI = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const teamFormation =
      project.aiTeamFormation || {
        requirements: [
          {
            role: "Frontend",
            level: "Senior",
            tech: "React, Tailwind, UI/UX",
          },
          {
            role: "Backend",
            level: "Senior",
            tech: "Node.js, Express, REST APIs",
          },
          {
            role: "Database",
            level: "Mid",
            tech: "MongoDB, Aggregations",
          },
        ],

        recommendedMembers: [
          {
            name:
              req.user?.name ||
              "Lead Developer",

            domain:
              "Backend & Full Stack",

            matchScore: 92,

            rationale:
              "Strong MERN stack velocity, lead developer on REST APIs.",
          },
        ],
      };

    res.json({
      success: true,
      teamFormation,
    });
  } catch (error) {
    console.error(
      "AI Team Recommendation Error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ============================================================
// CAREER TWIN
// POST /api/ai/career/analyze
// ============================================================

// Cache to prevent unnecessary repeated AI calls and handle 429/503 gracefully
const careerTwinCache = new Map();
const CAREER_TWIN_CACHE_TTL = 15 * 60 * 1000; // 15 mins

const careerAnalyzeWithAI = async (
  req,
  res
) => {
  try {
    const userId = String(req.user._id);
    const forceRefresh =
      req.query.refresh === "true" ||
      req.body?.refresh === true;

    // Check cache to avoid rate limits or repeat calls on page navigation/refresh
    if (!forceRefresh && careerTwinCache.has(userId)) {
      const cached = careerTwinCache.get(userId);
      const ttl = cached.careerTwin?._isFallback ? 30000 : CAREER_TWIN_CACHE_TTL;
      if (Date.now() - cached.timestamp < ttl) {
        return res.json({
          success: true,
          careerTwin: cached.careerTwin,
          evidence: cached.evidence,
          fromCache: true,
        });
      }
    }

    const careerData =
      await buildCareerTwinData(
        req.user._id
      );

    // Send complete evidence to Gemini
    const careerTwin = await generateCareerTwin(careerData);

    console.log("[Career Twin] Result:", {
      isFallback: careerTwin?._isFallback,
      aiUnavailable: careerTwin?.aiUnavailable,
      careerLevel: careerTwin?.careerLevel,
    });
    console.log(
    "[Career Twin] Full result:",
    JSON.stringify(careerTwin, null, 2)
    );

    const evidence = {
      statistics:
        careerData.statistics,
      contributionSummary:
        careerData.contributionSummary,
      technologies:
        careerData.technologies,
      skillEvidence:
        careerData.skillEvidence,
      activityBreakdown:
        careerData.activityBreakdown,
      githubConnected:
        careerData.githubConnected,
      githubData:
        careerData.githubData,
    };

    careerTwinCache.set(userId, {
      careerTwin,
      evidence,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      careerTwin,
      evidence,
    });
  } catch (error) {
    console.error(
      "Career Twin Analysis Error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Unable to generate Career Twin analysis",
    });
  }
};


// ============================================================
// CAREER SKILL GAP
// POST /api/ai/career/skill-gap
// ============================================================

const careerSkillGapWithAI = async (req, res) => {
  try {
    const {
      targetRole,
      targetRoleId,
      skills,
    } = req.body;

    const role = targetRole || targetRoleId || "Full-Stack Developer";

    // Gather full evidence context for accurate skill gap analysis
    const careerData = await buildCareerTwinData(req.user._id);

    const result = await generateCareerSkillGap({
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        experience: req.user.experience,
        education: req.user.education,
        skills: req.user.skills,
      },
      targetRole: role,
      skills: skills || req.user.skills || [],
      skillEvidence: careerData.skillEvidence,
      statistics: careerData.statistics,
      technologies: careerData.technologies,
      githubConnected: careerData.githubConnected,
      githubData: careerData.githubData,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Career Skill Gap Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to analyze career skill gap",
    });
  }
};


// ============================================================
// CAREER JOB MATCH
// POST /api/ai/career/job-match
// ============================================================

const careerJobMatchWithAI = async (req, res) => {
  try {
    const {
      targetRole,
      targetRoleId,
      jobDescription,
      projects,
    } = req.body;

    const role = targetRole || targetRoleId || jobDescription || "Full-Stack Developer";

    let userProjects = projects;
    if (!userProjects) {
      userProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { "members.user": req.user._id },
        ],
      })
        .select("name description status technologies tags createdAt updatedAt")
        .lean();
    }

    const careerData = await buildCareerTwinData(req.user._id);

    const result = await generateCareerJobMatch({
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        experience: req.user.experience,
        education: req.user.education,
        skills: req.user.skills,
      },
      targetRole: role,
      jobDescription: jobDescription || (typeof targetRole === "string" ? targetRole : ""),
      projects: userProjects,
      skillEvidence: careerData.skillEvidence,
      statistics: careerData.statistics,
      githubConnected: careerData.githubConnected,
      githubData: careerData.githubData,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Career Job Match Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to analyze career job match",
    });
  }
};


// ============================================================
// CAREER ROADMAP & TARGET ROLE PERSISTENCE
// ============================================================

const User = require("../models/User");

const getCareerRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("targetRole careerRoadmap").lean();
    return res.json({
      success: true,
      targetRole: user?.targetRole || "Full-Stack Developer",
      roadmap: user?.careerRoadmap || [],
    });
  } catch (error) {
    console.error("Get Career Roadmap Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve career roadmap",
    });
  }
};

const updateRoadmapItemStatus = async (req, res) => {
  try {
    const {
      itemId,
      status,
      stage,
      title,
      description,
      whyItMatters,
      howToDemonstrate,
      skills,
      targetRole,
    } = req.body;

    if (!itemId || !status) {
      return res.status(400).json({ message: "itemId and status are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let roadmap = Array.isArray(user.careerRoadmap) ? [...user.careerRoadmap] : [];
    const index = roadmap.findIndex((item) => item.itemId === itemId || item.id === itemId);

    if (index >= 0) {
      roadmap[index] = {
        ...roadmap[index],
        status,
        updatedAt: new Date(),
        completedAt: status === "completed" ? new Date() : null,
      };
    } else {
      roadmap.push({
        itemId,
        stage: stage || "Start now",
        title: title || "Milestone",
        description: description || "",
        whyItMatters: whyItMatters || "",
        howToDemonstrate: howToDemonstrate || "",
        skills: skills || [],
        targetRole: targetRole || user.targetRole || "Full-Stack Developer",
        status,
        updatedAt: new Date(),
        completedAt: status === "completed" ? new Date() : null,
      });
    }

    user.careerRoadmap = roadmap;
    await user.save();

    return res.json({
      success: true,
      message: "Roadmap status updated successfully",
      roadmap: user.careerRoadmap,
    });
  } catch (error) {
    console.error("Update Roadmap Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update roadmap item status",
    });
  }
};

const updateTargetRole = async (req, res) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) {
      return res.status(400).json({ message: "targetRole is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.targetRole = targetRole;
    await user.save();

    return res.json({
      success: true,
      targetRole: user.targetRole,
    });
  } catch (error) {
    console.error("Update Target Role Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update target role",
    });
  }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  analyzeProjectWithAI,
  chatWithAI,
  evaluateProjectWithAI,
  recommendTeamWithAI,
  careerAnalyzeWithAI,
  careerSkillGapWithAI,
  careerJobMatchWithAI,
  getCareerRoadmap,
  updateRoadmapItemStatus,
  updateTargetRole,
};