

import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import searchRoutes from "./src/routes/search.js";
// server.js
import cors from "cors";




const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:5173' }))

// Routes
app.use("/", searchRoutes);
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, now: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});