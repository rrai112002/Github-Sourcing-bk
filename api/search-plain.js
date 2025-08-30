// api/search-plain.js
import { searchPlain } from "../src/services/github.js";

// CORS helper (same-origin? set to your frontend domain)
const ORIGIN = "https://github-sourcing.vercel.app";
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
    logger.info(req.body);
  setCors(res);

  // Preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  // Only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Robust body parsing (Node runtime gives req.body as object, but be safe)
    let body = req.body || {};
    // if (!body || typeof body !== "object") {
    //   try { body = JSON.parse(req.body || "{}"); } catch { body = {}; }
    // }
    const text = (body.text || "").trim();
    // if (!text) return res.status(400).json({ error: "Missing text" });

    // Make sure required env vars are set in the BACKEND Vercel project
    // - GITHUB_TOKEN
    // - GOOGLE_API_KEY
    const results = await searchPlain(text);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ count: results.length, results });
  } catch (err) {
    console.error("❌ /api/search-plain error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
