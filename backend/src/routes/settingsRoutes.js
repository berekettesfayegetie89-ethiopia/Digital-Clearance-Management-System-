import { Router } from "express";
import { getSettings, updateSettings, uploadLogoHandler } from "../controllers/settingsController.js";
import { uploadLogo } from "../middleware/uploadLogo.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", getSettings);
router.put("/", requireRole("super_admin"), updateSettings);
router.post("/logo", requireRole("super_admin"), uploadLogo.single("logo"), uploadLogoHandler);

export default router;
