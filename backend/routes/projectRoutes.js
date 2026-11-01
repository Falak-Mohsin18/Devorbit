const express = require("express");

const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,

  addProjectMember,
  getProjectMembers,
  updateProjectMember,
  removeProjectMember,
} = require("../controllers/projectController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// PROJECT CRUD
// =====================================================

// Create project
router.post("/", protect, createProject);

// Get all projects
router.get("/", protect, getProjects);

// Get single project
router.get("/:id", protect, getProject);

// Update project
router.put("/:id", protect, updateProject);

// Delete project
router.delete("/:id", protect, deleteProject);


// =====================================================
// PROJECT MEMBER CRUD
// =====================================================

// Add member
router.post("/:id/members", protect, addProjectMember);

// Get members
router.get("/:id/members", protect, getProjectMembers);

// Update member role
router.put(
  "/:id/members/:userId",
  protect,
  updateProjectMember
);
router.patch(
  "/:id/members/:userId",
  protect,
  updateProjectMember
);
router.patch(
  "/:id/members/:userId/role",
  protect,
  updateProjectMember
);

// Remove member
router.delete(
  "/:id/members/:userId",
  protect,
  removeProjectMember
);

// Project health route
router.get("/:id/health", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({
      health: project.health || 85,
      breakdown: project.healthBreakdown || {
        codeActivity: 85,
        taskCompletion: 85,
        issueResolution: 85,
        teamActivity: 85,
        deadlineRisk: 85,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;