import { Router } from "express";
import { getMyNotifications, markAllRead } from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", getMyNotifications);
router.post("/mark-all-read", markAllRead);

export default router;
