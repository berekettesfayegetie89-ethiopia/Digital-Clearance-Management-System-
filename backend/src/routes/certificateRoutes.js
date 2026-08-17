import { Router } from "express";
import rateLimit from "../middleware/rateLimit.js";
import {
  downloadCertificate, verifyCertificate, revokeCertificateHandler, listCertificates, requestReissue,
} from "../controllers/certificateController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// FR-035: 10 verification attempts per minute per IP — public, no auth.
router.post("/verify", rateLimit({ windowMs: 60_000, max: 10 }), verifyCertificate);

router.get("/", requireAuth, requireRole("hr_coordinator", "super_admin"), listCertificates);
router.get("/:request_id", requireAuth, downloadCertificate);
router.post("/:id/request-reissue", requireAuth, requireRole("hr_coordinator"), requestReissue);
router.post("/:id/revoke", requireAuth, requireRole("super_admin"), revokeCertificateHandler);

export default router;
