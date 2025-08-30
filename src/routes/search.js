import express from "express";
import { searchStructured, searchPlain } from "../services/github.js";

const router = express.Router();

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// POST /search  -> structured payload
router.post("/search", async (req, res) => {
  try {
    const { query, min_experience, max_experience, limit } = req.body ?? {};
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Missing query" });
    }

    // Ensure at least 50, cap at 1000
    const limitNum = clamp(
      Number.isFinite(+limit) ? +limit : 50,
      50,
      1000
    );

    // Parse optional experience bounds
    const minExp =
      min_experience !== undefined && min_experience !== null && min_experience !== ""
        ? Number(min_experience)
        : undefined;
    const maxExp =
      max_experience !== undefined && max_experience !== null && max_experience !== ""
        ? Number(max_experience)
        : undefined;

    const results = await searchStructured(query.trim(), minExp, maxExp, limitNum);
    res.json({ count: results.length, requested_limit: limitNum, results });
  } catch (err) {
    console.error("❌ /search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /search-plain -> natural language text
router.post("/search-plain", async (req, res) => {
  try {
    const { text } = req.body ?? {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing text" });
    }

    const results = await searchPlain(text.trim());
    res.json({ count: results.length, results });
  } catch (err) {
    console.error("❌ /search-plain error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
