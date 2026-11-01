const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const formatUser = (user) => ({
  id: user._id.toString(),
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role === "admin" ? "Admin" : (user.titleRole || user.role || "Full Stack Software Engineer"),
  roleType: user.role === "admin" ? "Admin" : "Developer",
  avatar: user.avatar || user.avatar_url || "",
  avatar_url: user.avatar_url || user.avatar || "",
  avatarGradient: user.avatarGradient || "linear-gradient(135deg, #7c6cff, #43d49a)",
  bio: user.bio || `Software developer workspace for ${user.name}.`,
  department: user.department || "Engineering",
  location: user.location || "Active Workspace",
  github: user.github || "",
  linkedin: user.linkedin || "",
  portfolio: user.portfolio || "",
  experience: user.experience || "3+ years",
  education: user.education || "Computer Science & Engineering",
  skills: user.skills && user.skills.length ? user.skills : [
    { name: "React", level: 90 },
    { name: "JavaScript", level: 88 },
    { name: "Node.js", level: 85 },
    { name: "MongoDB", level: 82 },
    { name: "Express", level: 82 },
    { name: "REST APIs", level: 88 }
  ],
  score: 88,
  status: "Available"
});

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      bio,
      location,
      github,
      linkedin,
      portfolio,
      experience,
      education,
      skills,
      avatar,
      avatarGradient
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email and password",
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return res.status(400).json({
        message: "Name cannot be empty",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: role?.toLowerCase() === "admin" ? "admin" : "developer",
      roleType: role?.toLowerCase() === "admin" ? "Admin" : "Developer",
      department: department || "Engineering",
      bio: bio || `Software developer workspace for ${trimmedName}.`,
      location: location || "Active Workspace",
      github: github || "",
      linkedin: linkedin || "",
      portfolio: portfolio || "",
      experience: experience || "3+ years",
      education: education || "Computer Science & Engineering",
      skills: skills || [],
      avatar: avatar || "",
      avatarGradient: avatarGradient || "linear-gradient(135deg, #7c6cff, #43d49a)",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: formatUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Prevent deactivated accounts from logging in
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: formatUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  formatUser,
};