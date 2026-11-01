const express = require("express");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");
const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", protect, (req, res) => {
  res.json({
    message: "Authenticated successfully",
    user: {
      ...req.user.toObject(),
      id: req.user._id.toString(),
      roleType: req.user.role === "admin" ? "Admin" : "Developer",
    },
  });
});

router.get("/profile", protect, getMyProfile);
router.put("/profile", protect, updateMyProfile);

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    message: `Password reset instructions sent to ${email || "your email"}.`,
  });
});

router.post("/reset-password", (req, res) => {
  res.json({
    success: true,
    message: "Password reset successfully. Please sign in with your new password.",
  });
});

module.exports = router;