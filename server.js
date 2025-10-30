import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

import authRoutes from "./routes/R_api.js";
app.use("/api/auth", authRoutes);

import toolRoutes from "./routes/R_tool.js";  
app.use("/api/tools", toolRoutes);


app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
  connectDB();
})
