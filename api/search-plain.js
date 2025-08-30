// // api/search-plain.js
// import { searchPlain } from "../src/services/github.js";

// export default async function handler(req, res) {
//   // Optional CORS if your frontend is on a different domain:
//   // res.setHeader("Access-Control-Allow-Origin", "*");
//   // res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
//   // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   if (req.method === "OPTIONS") return res.status(204).end();
//   if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

//   try {
//     const { text } = req.body ?? {};
//     if (!text || typeof text !== "string" || !text.trim()) {
//       return res.status(400).json({ error: "Missing text" });
//     }
//     const results = await searchPlain(text.trim());
//     res.setHeader("Cache-Control", "no-store");
//     return res.status(200).json({ count: results.length, results });
//   } catch (err) {
//     console.error("❌ /api/search-plain error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// }

export default function handler(req, res) {
    res.status(200).json({ ok: true, now: new Date().toISOString() });
  }