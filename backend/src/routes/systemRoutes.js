import { Router } from "express";
import os from "os";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { cronJobRunners, cronStatus } from "../services/cronService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth, requireRole("system_admin"));

// System Admin's "Run Now" button on the Cron Job Monitor screen.
router.post("/cron/:job/run", asyncHandler(async (req, res) => {
  const runner = cronJobRunners[req.params.job];
  if (!runner) return res.status(404).json({ error: "Unknown job." });
  await runner();
  res.json({ message: `${req.params.job} executed.` });
}));

// Real cron job status — actual last-run timestamps and outcomes from this
// server process, not simulated ones.
router.get("/cron-status", (req, res) => {
  res.json({ jobs: Object.values(cronStatus) });
});

// Real OS-level system health, using Node's built-in `os` module — actual
// CPU load average and memory usage of the machine this backend is running
// on, not fabricated percentages.
router.get("/health", (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemPct = Math.round(((totalMem - freeMem) / totalMem) * 100);
  const loadAvg = os.loadavg()[0]; // 1-minute load average
  const cpuCount = os.cpus().length;
  const cpuPct = Math.min(100, Math.round((loadAvg / cpuCount) * 100));

  res.json({
    status: "ok",
    uptimeSeconds: process.uptime(),
    timestamp: new Date(),
    memory: { usedPercent: usedMemPct, totalMB: Math.round(totalMem / 1024 / 1024), freeMB: Math.round(freeMem / 1024 / 1024) },
    cpu: { usedPercent: cpuPct, cores: cpuCount, loadAverage1m: loadAvg },
    platform: os.platform(),
    hostname: os.hostname(),
  });
});

export default router;
