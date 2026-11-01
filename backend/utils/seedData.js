const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    let falakUser = await User.findOne({ email: "falak@devorbit.io" });
    let adminUser = await User.findOne({ email: "admin@devorbit.io" });
    let testDevUser = await User.findOne({ email: "testdev@devorbit.io" });

    if (!falakUser) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      falakUser = await User.create({
        name: "Falak",
        email: "falak@devorbit.io",
        password: hashedPassword,
        role: "developer",
        roleType: "Developer",
        titleRole: "Lead Full Stack Engineer",
        department: "Engineering",
        bio: "Full stack MERN specialist building intelligent developer productivity and AI career tools.",
        location: "Active Workspace",
        github: "falak-dev",
        linkedin: "falak-engineer",
        portfolio: "https://falak.dev",
        experience: "4+ years",
        education: "B.Tech Computer Science & Engineering",
        skills: [
          { name: "React", level: 92 },
          { name: "Node.js", level: 90 },
          { name: "MongoDB", level: 88 },
          { name: "Express", level: 88 },
          { name: "REST APIs", level: 94 },
          { name: "JavaScript", level: 94 }
        ],
        avatarGradient: "linear-gradient(135deg, #7c6cff, #43d49a)",
        isActive: true,
      });
      console.log("Seeded user: falak@devorbit.io");
    }

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      adminUser = await User.create({
        name: "Platform Admin",
        email: "admin@devorbit.io",
        password: hashedPassword,
        role: "admin",
        roleType: "Admin",
        titleRole: "DevOps & Security Admin",
        department: "Operations",
        bio: "System architect and workspace administrator.",
        location: "Global Remote",
        github: "admin-devorbit",
        skills: ["System Design", "Cloud", "Docker", "DevOps"],
        avatarGradient: "linear-gradient(135deg, #ff6d7a, #b58cff)",
        isActive: true,
      });
      console.log("Seeded user: admin@devorbit.io");
    }

    if (!testDevUser) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      testDevUser = await User.create({
        name: "Test Developer",
        email: "testdev@devorbit.io",
        password: hashedPassword,
        role: "developer",
        roleType: "Developer",
        titleRole: "Frontend Developer",
        department: "Engineering",
        bio: "Frontend engineer focused on clean reactive component design.",
        skills: ["React", "TypeScript", "Tailwind CSS", "UI/UX"],
        avatarGradient: "linear-gradient(135deg, #2b7fff, #00d2ff)",
        isActive: true,
      });
      console.log("Seeded user: testdev@devorbit.io");
    }

    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      // Create Project 1: DevOrbit
      const devorbitProj = await Project.create({
        name: "DevOrbit",
        tagline: "Developer Collaboration & AI Career Intelligence Platform",
        desc: "A unified platform bringing together developer discovery, project management, Kanban sprints, real-time comments, and AI-powered project & career intelligence.",
        category: "Full Stack Development",
        technologies: ["React", "Node.js", "MongoDB", "Express", "REST APIs", "Vite"],
        visibility: "Public",
        status: "Active",
        progress: 78,
        health: 84,
        startDate: new Date("2026-08-01"),
        deadline: new Date("2026-10-30"),
        owner: falakUser._id,
        stars: 14,
        forks: 2,
        githubRepo: "workspace/devorbit",
        healthBreakdown: {
          codeActivity: 88,
          taskCompletion: 82,
          issueResolution: 80,
          teamActivity: 90,
          deadlineRisk: 72,
        },
        members: [
          {
            user: falakUser._id,
            name: "Falak",
            email: "falak@devorbit.io",
            role: "Owner",
            skills: ["React", "Node.js", "MongoDB", "REST APIs"],
            assignedTasks: 4,
            completedTasks: 8,
            workload: "85%",
            avatarGradient: "linear-gradient(135deg, #7c6cff, #43d49a)",
          },
          {
            user: testDevUser._id,
            name: "Test Developer",
            email: "testdev@devorbit.io",
            role: "Developer",
            skills: ["React", "TypeScript", "Tailwind CSS", "UI/UX"],
            assignedTasks: 3,
            completedTasks: 5,
            workload: "60%",
            avatarGradient: "linear-gradient(135deg, #2b7fff, #00d2ff)",
          },
          {
            user: adminUser._id,
            name: "Platform Admin",
            email: "admin@devorbit.io",
            role: "Admin",
            skills: ["System Design", "Cloud", "Docker", "DevOps"],
            assignedTasks: 2,
            completedTasks: 4,
            workload: "40%",
            avatarGradient: "linear-gradient(135deg, #ff6d7a, #b58cff)",
          },
        ],
        aiInsights: {
          healthScore: 78,
          healthStatus: "Healthy",
          summary: "The project is progressing well, with steady sprint throughput and active development across all modules.",
          risks: [
            "High-priority tasks approaching deadline within 4 days",
            "Backend workload concentrated on one developer (Falak)",
          ],
          recommendations: [
            "Redistribute backend tasks to balance capacity",
            "Complete authentication & API integrations first",
          ],
        },
      });

      // Create Project 2: Cloud Telemetry
      await Project.create({
        name: "Cloud Telemetry Microservices",
        tagline: "High-throughput telemetry ingestion pipeline",
        desc: "Distributed microservices architecture processing real-time developer events, commit webhooks, and performance metrics.",
        category: "Cloud Infrastructure",
        technologies: ["Node.js", "Docker", "AWS", "Redis", "PostgreSQL"],
        visibility: "Private",
        status: "Active",
        progress: 52,
        health: 76,
        startDate: new Date("2026-08-15"),
        deadline: new Date("2026-11-15"),
        owner: falakUser._id,
        stars: 8,
        forks: 1,
        githubRepo: "workspace/cloud-telemetry",
        healthBreakdown: {
          codeActivity: 75,
          taskCompletion: 68,
          issueResolution: 72,
          teamActivity: 80,
          deadlineRisk: 65,
        },
        members: [
          {
            user: falakUser._id,
            name: "Falak",
            email: "falak@devorbit.io",
            role: "Owner",
            skills: ["Node.js", "Docker", "PostgreSQL"],
            assignedTasks: 2,
            completedTasks: 3,
            workload: "50%",
            avatarGradient: "linear-gradient(135deg, #7c6cff, #43d49a)",
          },
          {
            user: adminUser._id,
            name: "Platform Admin",
            email: "admin@devorbit.io",
            role: "Admin",
            skills: ["AWS", "Docker", "Kubernetes"],
            assignedTasks: 3,
            completedTasks: 2,
            workload: "70%",
            avatarGradient: "linear-gradient(135deg, #ff6d7a, #b58cff)",
          },
        ],
      });

      // Tasks for DevOrbit
      const task1 = await Task.create({
        title: "Build Authentication & JWT API Integration",
        desc: "Implement JWT authorization header injection, session management, and secure token lifecycle.",
        description: "Implement JWT authorization header injection, session management, and secure token lifecycle.",
        project: devorbitProj._id,
        creator: falakUser._id,
        assignee: falakUser._id,
        assigneeName: "Falak",
        assigneeAvatar: "F",
        column: "COMPLETED",
        status: "completed",
        priority: "critical",
        dueDate: "2026-09-10",
        tags: ["Backend", "Auth", "Security"],
        history: [
          { action: "Task created", actor: "Falak", time: "Sep 08, 2026" },
          { action: "Status changed to COMPLETED", actor: "Falak", time: "Sep 10, 2026" },
        ],
      });

      const task2 = await Task.create({
        title: "Kanban Task Board with Drag & Drop Workflows",
        desc: "Build responsive multi-column sprint task board with priority badges, tags, and comment counters.",
        description: "Build responsive multi-column sprint task board with priority badges, tags, and comment counters.",
        project: devorbitProj._id,
        creator: falakUser._id,
        assignee: falakUser._id,
        assigneeName: "Falak",
        assigneeAvatar: "F",
        column: "IN PROGRESS",
        status: "in-progress",
        priority: "high",
        dueDate: "2026-09-18",
        tags: ["Frontend", "Kanban", "UI/UX"],
        history: [
          { action: "Task created", actor: "Falak", time: "Sep 11, 2026" },
          { action: "Status changed to IN PROGRESS", actor: "Falak", time: "Sep 12, 2026" },
        ],
      });

      const task3 = await Task.create({
        title: "DevOrbit AI Career Twin & Skill Gap Engine",
        desc: "Implement AI career intelligence comparison against benchmark roles and roadmap generator.",
        description: "Implement AI career intelligence comparison against benchmark roles and roadmap generator.",
        project: devorbitProj._id,
        creator: falakUser._id,
        assignee: falakUser._id,
        assigneeName: "Falak",
        assigneeAvatar: "F",
        column: "IN PROGRESS",
        status: "in-progress",
        priority: "high",
        dueDate: "2026-09-22",
        tags: ["AI", "Career Twin", "Algorithms"],
        history: [{ action: "Task created", actor: "Falak", time: "Sep 12, 2026" }],
      });

      const task4 = await Task.create({
        title: "Dashboard UI & Workspace Analytics Overview",
        desc: "Create statistics widgets, active sprint KPIs, recent activity stream, and AI insight card.",
        description: "Create statistics widgets, active sprint KPIs, recent activity stream, and AI insight card.",
        project: devorbitProj._id,
        creator: falakUser._id,
        assignee: testDevUser._id,
        assigneeName: "Test Developer",
        assigneeAvatar: "T",
        column: "REVIEW",
        status: "review",
        priority: "medium",
        dueDate: "2026-09-25",
        tags: ["Frontend", "Dashboard", "Charts"],
        history: [{ action: "Task created", actor: "Falak", time: "Sep 10, 2026" }],
      });

      const task5 = await Task.create({
        title: "Docker Containerization & CI/CD Pipeline",
        desc: "Configure multi-stage Docker build, caching, and automated GitHub Actions workflow.",
        description: "Configure multi-stage Docker build, caching, and automated GitHub Actions workflow.",
        project: devorbitProj._id,
        creator: adminUser._id,
        assignee: adminUser._id,
        assigneeName: "Platform Admin",
        assigneeAvatar: "A",
        column: "TODO",
        status: "todo",
        priority: "high",
        dueDate: "2026-10-02",
        tags: ["DevOps", "Docker", "CI/CD"],
        history: [{ action: "Task created", actor: "Platform Admin", time: "Sep 13, 2026" }],
      });

      // Comments
      await Comment.create({
        task: task1._id,
        user: falakUser._id,
        author: "Falak",
        text: "JWT token flow verified with bearer headers and storage persistence.",
        message: "JWT token flow verified with bearer headers and storage persistence.",
        time: "2 days ago",
      });

      await Comment.create({
        task: task2._id,
        user: testDevUser._id,
        author: "Test Developer",
        text: "Ensure columns wrap cleanly on tablet and mobile viewports.",
        message: "Ensure columns wrap cleanly on tablet and mobile viewports.",
        time: "1 day ago",
      });

      // Notifications
      await Notification.create({
        recipient: falakUser._id,
        sender: testDevUser._id,
        title: "Comment Added",
        message: 'Test Developer commented on "Kanban Task Board with Drag & Drop Workflows".',
        type: "comment-added",
        project: devorbitProj._id,
        task: task2._id,
        projectRef: "DevOrbit",
        timestamp: "1 hour ago",
        isRead: false,
        read: false,
      });

      await Notification.create({
        recipient: falakUser._id,
        sender: adminUser._id,
        title: "Sprint Progress Milestone",
        message: "DevOrbit achieved 78% sprint completion rate.",
        type: "general",
        project: devorbitProj._id,
        projectRef: "DevOrbit",
        timestamp: "Yesterday",
        isRead: true,
        read: true,
      });

      // Activities
      await Activity.create({
        user: falakUser._id,
        project: devorbitProj._id,
        task: task1._id,
        type: "task-completed",
        message: 'completed task "Build Authentication & JWT API Integration"',
      });

      await Activity.create({
        user: testDevUser._id,
        project: devorbitProj._id,
        task: task2._id,
        type: "comment-added",
        message: 'commented on "Kanban Task Board with Drag & Drop Workflows"',
      });

      console.log("DevOrbit seeded successfully with initial project, tasks, and telemetry.");
    }
  } catch (error) {
    console.error("Database Seeding Error:", error.message);
  }
};

module.exports = seedDatabase;
