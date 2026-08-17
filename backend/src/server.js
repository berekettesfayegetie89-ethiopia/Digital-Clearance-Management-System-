import express from "express";
import { attachClientIp } from "./middleware/attachClientIp.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

import { sequelize, connectDB } from "./config/db.js";
import "./models/index.js"; // registers all models + associations

import authRoutes from "./routes/authRoutes.js";
import clearanceRoutes from "./routes/clearanceRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import approvalsRoutes from "./routes/approvalsRoutes.js";
import delegationRoutes from "./routes/delegationRoutes.js";
import workflowRoutes from "./routes/workflowRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import notificationTemplateRoutes from "./routes/notificationTemplateRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

import { startCronJobs } from "./services/cronService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust the first proxy hop (e.g. Nginx in a production deployment, per the
// SRS deployment checklist) so req.ip reflects the real client, not the
// proxy. Harmless for local dev with no proxy in front.
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachClientIp);

// Serve generated certificate PDFs and uploaded documents statically so the
// frontend's <a href> / window.open download links work directly.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Digital Clearance Management System API — Wollo University", status: "running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/clearance", clearanceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/approvals", approvalsRoutes);
app.use("/api/delegations", delegationRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/notification-templates", notificationTemplateRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/public", publicRoutes);

// 404 handler for unmatched API routes.
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

// Centralized error handler — catches everything asyncHandler forwards, plus
// multer file-validation errors (bad type, too large, too many files).
app.use((err, req, res, next) => {
  console.error("🔥", err.message);
  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  // sync() auto-creates every table from the model definitions if they
  // don't exist yet — no manual SQL needed for a fresh XAMPP database. Use
  // { alter: true } only during development if you change a model after
  // the tables already exist.
  await sequelize.sync();
  console.log("✅ Database synced — all tables ready.");

  startCronJobs();

  app.listen(PORT, () => {
    console.log(`🚀 Clearance API running at http://localhost:${PORT}`);
  });
}

start();
