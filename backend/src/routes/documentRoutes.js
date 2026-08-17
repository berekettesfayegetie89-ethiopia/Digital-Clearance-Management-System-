import { Router } from "express";
import { downloadDocument, deleteDocument, getDocumentsForMyDepartment } from "../controllers/documentController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/department", requireRole("approver"), getDocumentsForMyDepartment);
router.get("/:id/download", downloadDocument);
router.delete("/:id", deleteDocument);

export default router;
