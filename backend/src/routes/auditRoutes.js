import { Router } from "express";
import { getAuditLogs, getAuditForRequest } from "../controllers/auditController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("auditor", "super_admin"));

router.get("/", getAuditLogs);
router.get("/:request_id", getAuditForRequest);

export default router;
