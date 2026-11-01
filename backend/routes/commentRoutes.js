const express = require("express");

const {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create comment
router.post(
  "/tasks/:taskId/comments",
  protect,
  createComment
);

router.post(
  "/projects/:projectId/tasks/:taskId/comments",
  protect,
  createComment
);

// Get task comments
router.get(
  "/tasks/:taskId/comments",
  protect,
  getTaskComments
);

router.get(
  "/projects/:projectId/tasks/:taskId/comments",
  protect,
  getTaskComments
);

// Update comment
router.put(
  "/comments/:id",
  protect,
  updateComment
);

// Delete comment
router.delete(
  "/comments/:id",
  protect,
  deleteComment
);

router.delete(
  "/projects/:projectId/tasks/:taskId/comments/:id",
  protect,
  deleteComment
);

module.exports = router;