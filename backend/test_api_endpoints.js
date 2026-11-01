require("dotenv").config();
const jwt = require("jsonwebtoken");

async function testApi() {
  try {
    const token = jwt.sign({ id: "6aa41b14228b262067ec2e51" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.log("Generated token for Falak");

    // Test /api/auth/me
    const meRes = await fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("GET /api/auth/me:", meRes.status, await meRes.json());

    // Test /api/projects
    const projRes = await fetch("http://localhost:5000/api/projects", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projData = await projRes.json();
    console.log("GET /api/projects:", projRes.status, "Projects count:", projData.projects?.length);

    // Test /api/tasks
    const taskRes = await fetch("http://localhost:5000/api/tasks", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const taskData = await taskRes.json();
    console.log("GET /api/tasks:", taskRes.status, "Tasks count:", taskData.tasks?.length);

    // Test /api/ai/career/analyze
    console.log("Calling POST /api/ai/career/analyze (this will test our fix)...");
    const careerRes = await fetch("http://localhost:5000/api/ai/career/analyze", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    const careerData = await careerRes.json();
    console.log("POST /api/ai/career/analyze:", careerRes.status);
    console.log("Career readiness:", careerData.careerTwin?.careerReadiness);
    console.log("Career level:", careerData.careerTwin?.careerLevel);
    console.log("Strengths count:", careerData.careerTwin?.strengths?.length);
    console.log("Strengths:", careerData.careerTwin?.strengths?.map(s => s.name));
    console.log("Exposure skills:", careerData.careerTwin?.exposureSkills?.map(s => s.name));
    console.log("Is fallback:", careerData.careerTwin?._isFallback);
  } catch (err) {
    console.error("API test error:", err.message);
  }
}

testApi();
