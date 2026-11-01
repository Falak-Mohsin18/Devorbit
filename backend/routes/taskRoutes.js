const express = require("express");

const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  getAllTasks,
  addImplementationEvidence,
  cleanupImplementationEvidence,
} = require("../controllers/taskController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// ALL TASKS
// ============================================================

router.get(
  "/tasks",
  protect,
  getAllTasks
);

// ============================================================
// CLEAN IMPLEMENTATION EVIDENCE
// IMPORTANT:
// This route MUST come before /tasks/:id routes.
// ============================================================

router.patch(
  "/tasks/cleanup-implementation-evidence",
  protect,
  cleanupImplementationEvidence
);

// ============================================================
// PROJECT TASKS
// ============================================================

router.post(
  "/projects/:projectId/tasks",
  protect,
  createTask
);

router.get(
  "/projects/:projectId/tasks",
  protect,
  getProjectTasks
);

router.put(
  "/projects/:projectId/tasks/:id",
  protect,
  updateTask
);

router.patch(
  "/projects/:projectId/tasks/:id",
  protect,
  updateTask
);

router.patch(
  "/projects/:projectId/tasks/:id/status",
  protect,
  updateTask
);

router.delete(
  "/projects/:projectId/tasks/:id",
  protect,
  deleteTask
);

// ============================================================
// SINGLE TASK
// ============================================================

router.get(
  "/tasks/:id",
  protect,
  getTask
);

router.put(
  "/tasks/:id",
  protect,
  updateTask
);

router.patch(
  "/tasks/:id",
  protect,
  updateTask
);

router.patch(
  "/tasks/:id/status",
  protect,
  updateTask
);

// ============================================================
// IMPLEMENTATION EVIDENCE
// ============================================================

router.patch(
  "/tasks/:id/implementation",
  protect,
  addImplementationEvidence
);

// ============================================================
// DELETE TASK
// ============================================================

router.delete(
  "/tasks/:id",
  protect,
  deleteTask
);

module.exports = router;