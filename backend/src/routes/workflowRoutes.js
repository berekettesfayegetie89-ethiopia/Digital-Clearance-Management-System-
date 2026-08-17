import { Router } from "express";
import { getWorkflows, saveWorkflow } from "../controllers/workflowController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", getWorkflows);
router.post("/", requireRole("super_admin"), saveWorkflow);

export default router;
