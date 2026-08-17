import { SystemSettings } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";

// Single-row settings table — always id=1. getOrCreate keeps this simple.
async function getSettingsRow() {
  const [row] = await SystemSettings.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
  return row;
}

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getSettingsRow();
  res.json({ settings });
});

// PUT /api/admin/settings — accepts a partial object, merges it in, and
// persists to the real database so a refresh shows the change (this was
// previously fake / reset on refresh).
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getSettingsRow();
  Object.assign(settings, req.body);
  await settings.save();
  await logAudit({ userId: req.user.id, action: "CREATE_USER", ip: req.clientIp, details: { settingsUpdated: Object.keys(req.body) } });
  res.json({ settings });
});

// POST /api/admin/settings/logo — real file upload, persisted path saved to
// settings so it survives refresh and is served back via /uploads (already
// statically mounted in server.js).
export const uploadLogoHandler = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const settings = await getSettingsRow();
  settings.logo_path = `uploads/branding/${req.file.filename}`;
  await settings.save();
  res.json({ settings });
});
