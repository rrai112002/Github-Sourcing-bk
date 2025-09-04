

import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import searchRoutes from "./src/routes/search.js";
// server.js
import cors from "cors";
import { searchPlain } from "./src/services/github.js";




const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

// Routes
app.use("/", searchRoutes);
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, now: new Date().toISOString() });
});
app.post("/api/search-plain", async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const results = await searchPlain(text);

    res.status(200).json({
      received: req.body,
      count: results.length,
      results,
      now: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ searchPlain failed:", err);
    res.status(500).json({ error: "searchPlain failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});