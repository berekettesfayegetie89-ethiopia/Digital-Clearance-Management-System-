import { Router } from "express";
import { listTemplates, updateTemplate } from "../controllers/notificationTemplateController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("super_admin"));

router.get("/", listTemplates);
router.put("/:id", updateTemplate);

export default router;
