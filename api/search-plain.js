// api/search-plain.js
import { searchPlain } from "../src/services/github.js";

// const FRONTEND = "https://github-sourcing.vercel.app";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // or "*" for testing
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const text = (body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Missing text" });

    const results = await searchPlain(text);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ count: results.length, results });
  } catch (err) {
    console.error("❌ /api/search-plain error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
