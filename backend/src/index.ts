import dotenv from "dotenv";

dotenv.config();

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import http from "http";
import multer from "multer";

import { connectDB } from "./config/db";
import { initSocket } from "./sockets/socket";
import assignmentRoutes from "./routes/assignment.routes";

import "./jobs/worker";

const app = express();

const allowedOrigins = ["http://localhost:3000", process.env.CLIENT_URL].filter(
  (o): o is string => Boolean(o)
);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/assignments", assignmentRoutes);

// Turn upload errors (too large / wrong type) into clean 4xx JSON responses
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File must be under 10MB" : err.message;
    return res.status(413).json({ success: false, message });
  }
  if (err?.message?.startsWith("Only PDF")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const server = http.createServer(app);
initSocket(server, allowedOrigins);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server Running on ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });