import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import searchRoutes from "./src/routes/search.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

// Routes
app.use("/", searchRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
