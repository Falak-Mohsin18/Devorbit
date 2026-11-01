const express = require("express");

const {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  getAllProjects,
  getAdminStats,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

const router = express.Router();

// Every route below requires:
// 1. Valid JWT
// 2. Admin role

router.get(
  "/users",
  protect,
  admin,
  getAllUsers
);

router.get(
  "/users/:id",
  protect,
  admin,
  getUserDetails
);

router.put(
  "/users/:id/role",
  protect,
  admin,
  updateUserRole
);

router.put(
  "/users/:id/status",
  protect,
  admin,
  updateUserStatus
);

router.get(
  "/projects",
  protect,
  admin,
  getAllProjects
);

router.get(
  "/stats",
  protect,
  admin,
  getAdminStats
);

module.exports = router;