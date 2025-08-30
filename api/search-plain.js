// // api/search-plain.js
// import { searchPlain } from "../src/services/github.js";

// // --- CORS helper ---
// function setCors(res) {
//   res.setHeader("Access-Control-Allow-Origin", "*"); // for testing; restrict in prod
//   res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
// }

// export default async function handler(req, res) {
//   setCors(res);

//   // Handle preflight
//   if (req.method === "OPTIONS") {
//     return res.status(204).end();
//   }

//   if (req.method !== "POST") {
//     res.setHeader("Allow", "POST, OPTIONS");
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     // Manually parse body (Vercel doesn't parse req.body automatically)
//     const raw = await new Promise((resolve, reject) => {
//       let data = "";
//       req.on("data", (chunk) => {
//         data += chunk;
//       });
//       req.on("end", () => resolve(data));
//       req.on("error", reject);
//     });

//     let body = {};
//     try {
//       body = raw ? JSON.parse(raw) : {};
//     } catch (parseErr) {
//       return res.status(400).json({ error: "Invalid JSON body" });
//     }

//     const text = (body.text || "").trim();
//     if (!text) {
//       return res.status(400).json({ error: "Missing text" });
//     }

//     const results = await searchPlain(text);

//     res.setHeader("Cache-Control", "no-store");
//     return res.status(200).json({
//       count: results.length,
//       results,
//     });
//   } catch (err) {
//     console.error("❌ /api/search-plain error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// }

// // export default async function handler(req, res) {
// //     res.setHeader("Access-Control-Allow-Origin", "*");
// //     res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
// //     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
// //     if (req.method === "OPTIONS") return res.status(204).end();
// //     if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  
// //     res.status(200).json({ ok: true, now: new Date().toISOString() });
// //   }


// api/search-plain.js

// --- CORS helper ---
import { searchPlain } from "../src/services/github.js";

// --- CORS helper ---
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // for testing; restrict in prod
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parse body manually (Vercel doesn't parse automatically)
    const raw = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });

    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const text = (body.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    // --- Main search ---
    let results = [];
    try {
      results = await searchPlain(text);
    } catch (err) {
      console.error("❌ searchPlain failed:", err);
      // Return what we got for debugging
      return res.status(500).json({
        error: "searchPlain failed",
        details: err.message || String(err),
        received: body,
      });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      received: body, // keep for debug
      count: results.length,
      results,
      now: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ /api/search-plain top-level error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

  
  
