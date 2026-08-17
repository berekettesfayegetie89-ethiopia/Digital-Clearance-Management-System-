import { Router } from "express";
import { SystemSettings } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// GET /api/public/branding — no auth required. Returns ONLY the safe,
// public-facing branding fields (institution name + logo path) so
// unauthenticated screens (Login, Forgot Password, the public Verify page)
// can show the real, admin-configured name and logo instead of a hardcoded
// one, without exposing SMTP credentials or other sensitive settings.
router.get("/branding", asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findByPk(1);
  res.json({
    institution_name: settings?.institution_name || "Wollo University",
    logo_path: settings?.logo_path || null,
    language: settings?.language || "en",
  });
}));

export default router;
