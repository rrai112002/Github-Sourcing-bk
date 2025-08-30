// api/search.js
import { searchStructured } from "../src/services/github.js";

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

export default async function handler(req, res) {
  // Optional CORS if needed:
  // res.setHeader("Access-Control-Allow-Origin", "*");
  // res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { query, min_experience, max_experience, limit } = req.body ?? {};
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Missing query" });
    }

    const limitNum = clamp(Number.isFinite(+limit) ? +limit : 50, 50, 1000);

    const minExp =
      min_experience !== undefined && min_experience !== null && min_experience !== ""
        ? Number(min_experience)
        : undefined;
    const maxExp =
      max_experience !== undefined && max_experience !== null && max_experience !== ""
        ? Number(max_experience)
        : undefined;

    const results = await searchStructured(query.trim(), minExp, maxExp, limitNum);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ count: results.length, requested_limit: limitNum, results });
  } catch (err) {
    console.error("❌ /api/search error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
