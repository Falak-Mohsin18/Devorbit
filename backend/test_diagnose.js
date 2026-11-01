require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");
const Activity = require("./models/Activity");
const { buildCareerTwinData } = require("./services/careerTwinService");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({}).lean();
    console.log("Users in DB:", users.map(u => ({ id: u._id.toString(), email: u.email, name: u.name })));

    const projects = await Project.find({}).lean();
    console.log("Projects in DB:", projects.map(p => ({
      id: p._id.toString(),
      name: p.name,
      owner: p.owner?.toString(),
      technologies: p.technologies,
      membersCount: p.members?.length
    })));

    const tasks = await Task.find({}).lean();
    console.log("Tasks in DB:", tasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      project: t.project?.toString(),
      creator: t.creator?.toString(),
      assignee: t.assignee?.toString(),
      status: t.status,
      column: t.column,
      tags: t.tags
    })));

    const targetUser = await User.findOne({ $or: [{ email: "falak@example.com" }, { _id: "6aa41b14228b262067ec2e51" }] });
    if (targetUser) {
      console.log("\nTesting buildCareerTwinData for targetUser:", targetUser._id.toString(), targetUser.email);
      const data = await buildCareerTwinData(targetUser._id);
      console.log("Career Twin Data statistics:", JSON.stringify(data.statistics, null, 2));
      console.log("Career Twin Data technologies:", JSON.stringify(data.technologies, null, 2));
      console.log("Career Twin Data skillEvidence count:", data.skillEvidence?.length);
      console.log("Career Twin Data skillEvidence:", JSON.stringify(data.skillEvidence, null, 2));
    } else {
      console.log("Target user falak@example.com not found!");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Diagnostic error:", err);
  }
}

run();
