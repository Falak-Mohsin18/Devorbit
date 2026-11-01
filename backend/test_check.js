require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");
const Activity = require("./models/Activity");
const { buildCareerTwinData } = require("./services/careerTwinService");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);

  const falak = await User.findOne({ email: "falak@example.com" });
  console.log("Falak user:", falak ? { id: falak._id.toString(), email: falak.email } : "NOT FOUND");

  const projects = await Project.find({}).lean();
  console.log("Projects:", projects.map(p => ({
    id: p._id.toString(),
    name: p.name,
    owner: p.owner?.toString(),
    technologies: p.technologies
  })));

  const tasks = await Task.find({}).lean();
  console.log("Tasks:", tasks.map(t => ({
    id: t._id.toString(),
    title: t.title,
    project: t.project?.toString(),
    creator: t.creator?.toString(),
    assignee: t.assignee?.toString(),
    status: t.status,
    tags: t.tags
  })));

  if (falak) {
    const data = await buildCareerTwinData(falak._id);
    console.log("Statistics:", data.statistics);
    console.log("Contribution Summary:", data.contributionSummary);
    console.log("Technologies:", data.technologies);
    console.log("Skills:", data.skillEvidence.map(s => ({
      skill: s.skill,
      evidenceType: s.evidenceType,
      sources: Array.from(s.sources),
      tasks: s.tasks,
      evidenceStrength: s.evidenceStrength
    })));
  }

  await mongoose.disconnect();
}
check();
