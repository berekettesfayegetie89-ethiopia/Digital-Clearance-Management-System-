import { Router } from "express";
import { submitSupportTicket } from "../controllers/supportController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();
// Works both logged-in (Help & Support page) and anonymous (login page's
// Contact Support link) — req.user is undefined for anonymous submitters.
router.post("/", optionalAuth, submitSupportTicket);

export default router;
