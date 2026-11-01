const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const seedDatabase = require("./utils/seedData");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const githubRoutes = require("./routes/githubRoutes");

const { protect } = require("./middleware/authMiddleware");
const { formatUser } = require("./controllers/authController");




connectDB().then(() => {
  seedDatabase();
}).catch((err) => {
  console.error("DB connection error:", err.message);
});

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/users", userRoutes);

app.use("/api", taskRoutes);

app.use("/api", commentRoutes);

app.use("/api", notificationRoutes);

app.use("/api", activityRoutes);

app.use("/api/dashboard",dashboardRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/github", githubRoutes);
// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "DevOrbit API is running 🚀",
  });
});


// =====================================================
// PROTECTED AUTH TEST ROUTE
// =====================================================

app.get(
  "/api/auth/me",
  protect,
  (req, res) => {
    res.json({
      message:
        "Authenticated successfully",
      user: formatUser(req.user),
    });
  }
);


// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `DevOrbit server running on port ${PORT}`
  );
});