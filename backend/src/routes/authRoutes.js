import { Router } from "express";
import {
  login, me, logout, forgotPassword, resetPassword, changePassword,
  getLoginHistory, setup2FA, verify2FA, disable2FA,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.post("/change-password", requireAuth, changePassword);
router.get("/login-history", requireAuth, getLoginHistory);
router.post("/2fa/setup", requireAuth, setup2FA);
router.post("/2fa/verify", requireAuth, verify2FA);
router.post("/2fa/disable", requireAuth, disable2FA);

export default router;
