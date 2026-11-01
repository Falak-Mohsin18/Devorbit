require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testModels() {
  const models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.0-flash"];
  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: "Return JSON: {\"ok\": true}",
        config: { responseMimeType: "application/json" }
      });
      console.log(`Model ${model} SUCCESS:`, res.text.trim());
    } catch (err) {
      console.log(`Model ${model} FAILED:`, err.message);
    }
  }
}

testModels();
