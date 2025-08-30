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
function setCors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // open for testing
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  
  export default async function handler(req, res) {
    setCors(res);
  
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST, OPTIONS");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    try {
      // Read body manually (important on Vercel)
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
        return res.status(400).json({ error: "Invalid JSON body", raw });
      }
  
      // Just echo it back for now
      return res.status(200).json({
        received: body,
        now: new Date().toISOString(),
      });
    } catch (err) {
      console.error("❌ echo /api/search-plain error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  
  
