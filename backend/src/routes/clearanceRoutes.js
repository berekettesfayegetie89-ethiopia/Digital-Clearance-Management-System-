import { Router } from "express";
import {
  applyForClearance, getMyRequests, getRequestDetail, withdrawRequest, resubmitRequest,
} from "../controllers/clearanceController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadDocuments, getDocumentsForRequest, downloadDocument, deleteDocument } from "../controllers/documentController.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);

router.post("/apply", requireRole("applicant", "hr_coordinator"), applyForClearance);
router.get("/my", requireRole("applicant"), getMyRequests);
router.get("/:id", getRequestDetail);
router.post("/:id/withdraw", requireRole("applicant"), withdrawRequest);
router.post("/:id/resubmit", requireRole("applicant"), resubmitRequest);

// Documents nested under a request (FR-025/026).
router.post("/:id/documents", upload.array("files", 5), uploadDocuments);
router.get("/:id/documents", getDocumentsForRequest);

export default router;
