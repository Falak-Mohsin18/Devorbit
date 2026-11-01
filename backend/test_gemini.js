require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const { buildCareerTwinData } = require("./services/careerTwinService");
const { generateCareerTwin } = require("./ai/aiService");

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: "falak@example.com" });
  console.log("Found user:", user.email, user._id);

  const careerData = await buildCareerTwinData(user._id);
  console.log("Built careerData. Calling generateCareerTwin...");

  const startTime = Date.now();
  try {
    const result = await generateCareerTwin(careerData);
    console.log(`Success in ${Date.now() - startTime}ms!`);
    console.log("Career Twin result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Call failed:", err);
  }

  await mongoose.disconnect();
}

test();
