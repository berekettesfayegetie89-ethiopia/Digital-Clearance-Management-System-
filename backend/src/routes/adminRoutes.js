import { Router } from "express";
import {
  getAllClearances, manualEscalate, forceDecision, getApprovalTimesReport, getAllPendingApprovals,
} from "../controllers/adminController.js";
import { getDepartments, createDepartment } from "../controllers/departmentController.js";
import { listUsers, createUser, adminResetPassword, toggleUserActive } from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/clearance/all", requireRole("hr_coordinator", "super_admin"), getAllClearances);
// Also used by HR Coordinator's "Delayed / Escalated Requests" screen and
// Department Head's "Escalated Requests" screen (auto-scoped to their own
// department in the controller above) — HR needs system-wide visibility,
// Department Head needs their own department's, Super Admin needs both plus
// override powers (still gated separately below).
router.get("/approvals/pending", requireRole("hr_coordinator", "department_head", "super_admin"), getAllPendingApprovals);
router.post("/clearance/:id/escalate", requireRole("hr_coordinator", "department_head", "super_admin"), manualEscalate);
router.post("/approvals/:id/force", requireRole("super_admin"), forceDecision);
router.get("/reports/approval-times", requireRole("hr_coordinator", "super_admin"), getApprovalTimesReport);

router.get("/departments", getDepartments);
router.post("/departments", requireRole("super_admin"), createDepartment);

// GET /users is also used by HR Coordinator's "Initiate on Behalf" applicant
// search (adminService.users({search})) — only listing is opened up to HR;
// creating/resetting/deactivating stays Super Admin only.
router.get("/users", requireRole("hr_coordinator", "super_admin"), listUsers);
router.post("/users", requireRole("super_admin"), createUser);
router.post("/users/:id/reset-password", requireRole("super_admin"), adminResetPassword);
router.post("/users/:id/toggle-active", requireRole("super_admin"), toggleUserActive);

export default router;
