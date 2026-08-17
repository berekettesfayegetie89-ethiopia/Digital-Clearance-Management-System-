import { Router } from "express";
import { getDelegationsForDepartment, decideDelegation } from "../controllers/delegationController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("department_head"));

router.get("/", getDelegationsForDepartment);
router.post("/:id/decide", decideDelegation);

export default router;
