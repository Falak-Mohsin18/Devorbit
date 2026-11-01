const express = require("express");

const {
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
} = require("../controllers/aiController");

const {
  getCareerTwin,
} = require("../controllers/careerTwinController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/projects/:projectId/analyze",
  protect,
  analyzeProjectWithAI
);

router.post(
  "/projects/:projectId/evaluate",
  protect,
  evaluateProjectWithAI
);

router.post(
  "/projects/:projectId/team-recommendations",
  protect,
  recommendTeamWithAI
);

router.post(
  "/chat",
  protect,
  chatWithAI
);

router.post(
  "/career/analyze",
  protect,
  careerAnalyzeWithAI
);

router.post(
  "/career/skill-gap",
  protect,
  careerSkillGapWithAI
);

router.post(
  "/career/job-match",
  protect,
  careerJobMatchWithAI
);

router.get(
  "/career/twin",
  protect,
  getCareerTwin
);

router.get(
  "/career/roadmap",
  protect,
  getCareerRoadmap
);

router.post(
  "/career/roadmap/status",
  protect,
  updateRoadmapItemStatus
);

router.post(
  "/career/target-role",
  protect,
  updateTargetRole
);

module.exports = router;