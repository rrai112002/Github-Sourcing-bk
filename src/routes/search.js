import express from "express";
import { searchStructured, searchPlain } from "../services/github.js";

const router = express.Router();

// POST /search  -> structured payload
router.post("/search", async (req, res) => {
  try {
    const { query, min_experience, max_experience, limit } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    const results = await searchStructured(query, min_experience, max_experience, limit);
    res.json({ count: results.length, results });
  } catch (err) {
    console.error("❌ /search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /search-plain -> natural language text
router.post("/search-plain", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const results = await searchPlain(text);
    res.json({ count: results.length, results });
  } catch (err) {
    console.error("❌ /search-plain error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
