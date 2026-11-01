const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getUserById,
  searchUsers,
  getAllUsers,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all active users
router.get(
  "/",
  protect,
  getAllUsers
);

// My profile
router.get(
  "/profile",
  protect,
  getMyProfile
);

// Update my profile
router.put(
  "/profile",
  protect,
  updateMyProfile
);

// Change password
router.put(
  "/change-password",
  protect,
  changePassword
);

// Search users
router.get(
  "/search",
  protect,
  searchUsers
);

// Get user by ID
router.get(
  "/:id",
  protect,
  getUserById
);

module.exports = router;