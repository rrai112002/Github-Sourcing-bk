import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const SYSTEM_PROMPT = `
You are a GitHub sourcing assistant.
Convert hiring requests into structured GitHub search parameters.

Output MUST be valid JSON only, no markdown, no code fences.

Schema:
{
  "query": "string",
  "min_experience": "integer or null",
  "max_experience": "integer or null"
}

Rules:
- Always include type:user in query
- Expand MERN -> MongoDB, Express, React, Node.js
- Expand MEAN -> MongoDB, Express, Angular, Node.js
- Add repos:>3 followers:>5 if years of experience is mentioned
- Capture years into min/max_experience
- Return ONLY JSON
`.trim();

export async function parsePlainText(text) {
  const response = await model.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: text },
  ]);

  let raw = response.content.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  }

  return JSON.parse(raw);
}
