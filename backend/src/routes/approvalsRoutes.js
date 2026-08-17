import { Router } from "express";
import { getPendingApprovals, getApprovalHistory, actOnApproval, requestDelegation, getDepartmentColleagues, getMyDelegations, getDepartmentPerformance } from "../controllers/approvalsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/pending", requireRole("approver"), getPendingApprovals);
router.get("/history", requireRole("approver"), getApprovalHistory);
router.get("/colleagues", requireRole("approver"), getDepartmentColleagues);
router.get("/my-delegations", requireRole("approver"), getMyDelegations);
router.post("/:id/action", requireRole("approver"), actOnApproval);
router.post("/delegate", requireRole("approver"), requestDelegation);
router.get("/department-performance", requireRole("department_head"), getDepartmentPerformance);

export default router;
