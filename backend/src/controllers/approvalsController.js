import {
  DepartmentApproval,
  ClearanceRequest,
  Department,
  User,
  Delegation,
} from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";
import { notify } from "../services/emailService.js";
import { openNextSequentialDepartment, maybeCompleteClearance } from "../services/workflowEngine.js";
import { Op } from "sequelize";

// GET /api/approvals/colleagues — real, department-scoped list of other
// approvers in the signed-in user's own department, for the Delegation
// Settings "select a colleague" dropdown (previously hardcoded to two fake
// Finance-department names regardless of which department you were in).
export const getDepartmentColleagues = asyncHandler(async (req, res) => {
  const colleagues = await User.findAll({
    where: {
      role: "approver",
      department: req.user.department,
      is_active: true,
      id: { [Op.ne]: req.user.id },
    },
    attributes: ["id", "full_name", "email"],
  });
  res.json({ colleagues });
});

// FR-011/012: pending queue for the signed-in approver's department, also
// honoring any active delegation where this user is covering someone else.
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const approver = req.user;

  const activeDelegations = await Delegation.findAll({
    where: {
      delegate_id: approver.id,
      status: "approved",
      start_date: { [Op.lte]: new Date() },
      end_date: { [Op.gte]: new Date() },
    },
  });
  const coveringDeptIds = activeDelegations.map((d) => d.department_id);

  const department = await Department.findOne({ where: { name: approver.department } });
  const deptIds = department ? [department.id, ...coveringDeptIds] : coveringDeptIds;

  const pending = await DepartmentApproval.findAll({
    where: { department_id: { [Op.in]: deptIds }, status: "pending" },
    include: [
      { model: ClearanceRequest, as: "request", include: [{ model: User, as: "applicant", attributes: ["id", "full_name", "employee_id"] }] },
      { model: Department, as: "department" },
    ],
    order: [["deadline", "ASC"]],
  });

  res.json({ pending });
});

export const getApprovalHistory = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ where: { name: req.user.department } });
  const history = await DepartmentApproval.findAll({
    where: {
      department_id: department?.id,
      status: { [Op.in]: ["approved", "rejected", "hold"] },
    },
    include: [
      { model: ClearanceRequest, as: "request", include: [{ model: User, as: "applicant", attributes: ["full_name"] }] },
      { model: User, as: "approver", attributes: ["full_name"] },
    ],
    order: [["approved_at", "DESC"]],
  });
  res.json({ history });
});

// FR-014/015/017: Approve / Reject (reason required) / Hold, with BR-005
// self-approval blocked.
export const actOnApproval = asyncHandler(async (req, res) => {
  const { action, remarks } = req.body; // action: "approve" | "reject" | "hold"
  const approval = await DepartmentApproval.findByPk(req.params.id, {
    include: [{ model: ClearanceRequest, as: "request", include: [{ model: User, as: "applicant" }] }, { model: Department, as: "department" }],
  });

  if (!approval) return res.status(404).json({ error: "Approval task not found." });
  if (approval.status !== "pending") {
    return res.status(409).json({ error: "This task has already been actioned or is not yet open." });
  }

  // BR-005: department approvers cannot approve their own clearance.
  if (approval.request.applicant_id === req.user.id) {
    return res.status(403).json({ error: "You cannot act on your own clearance request." });
  }

  if (action === "reject" && (!remarks || remarks.trim().length === 0)) {
    return res.status(400).json({ error: "A reason is required to reject a request." });
  }

  const statusMap = { approve: "approved", reject: "rejected", hold: "hold" };
  const newStatus = statusMap[action];
  if (!newStatus) return res.status(400).json({ error: "Invalid action." });

  approval.status = newStatus;
  approval.remarks = remarks || null;
  approval.approver_id = req.user.id;
  if (newStatus === "approved") approval.approved_at = new Date();
  await approval.save();

  const auditAction = { approve: "APPROVE", reject: "REJECT", hold: "HOLD" }[action];
  await logAudit({ userId: req.user.id, action: auditAction, requestId: approval.request_id, ip: req.clientIp, details: { department: approval.department.name, remarks } });

  const applicant = approval.request.applicant;

  if (newStatus === "approved") {
    await notify({
      userId: applicant.id,
      to: applicant.email,
      subject: "Department Approval Completed",
      message: `${approval.department.name} approved your ${approval.request.clearance_type} request (${approval.request.reference_no}).`,
      category: "approval",
    });
    await openNextSequentialDepartment(approval.request_id, approval.id);
    await maybeCompleteClearance(approval.request_id, req.headers.origin);
  } else if (newStatus === "rejected") {
    // FR-017: the entire clearance is put on hold; other departments' state
    // is left as-is (already-approved ones persist for the resubmission
    // flow's carry-over logic).
    approval.request.status = "rejected";
    await approval.request.save();
    await notify({
      userId: applicant.id,
      to: applicant.email,
      subject: "Rejection Reason",
      message: `${approval.department.name} rejected your ${approval.request.clearance_type} request (${approval.request.reference_no}). Reason: ${remarks}`,
      category: "rejection",
    });
  }

  res.json({ approval });
});

// FR-019: delegate approval to a substitute. Requires Department Head
// approval before it becomes active (handled in delegationController.js).
export const requestDelegation = asyncHandler(async (req, res) => {
  const { delegate_id, start_date, end_date, reason } = req.body;

  if (!delegate_id || !start_date || !end_date) {
    return res.status(400).json({ error: "delegate_id, start_date, and end_date are required." });
  }
  // End date must be strictly after start date — a delegation covers a real
  // span of time, not a single instant.
  if (new Date(end_date) <= new Date(start_date)) {
    return res.status(400).json({ error: "End date must be after the start date." });
  }
  if (new Date(start_date) < new Date().setHours(0, 0, 0, 0)) {
    return res.status(400).json({ error: "Start date cannot be in the past." });
  }

  const department = await Department.findOne({ where: { name: req.user.department } });

  const delegation = await Delegation.create({
    approver_id: req.user.id,
    delegate_id,
    department_id: department.id,
    start_date,
    end_date,
    reason,
    status: "pending",
  });

  await logAudit({ userId: req.user.id, action: "DELEGATE_REQUEST", ip: req.clientIp, details: { delegate_id, start_date, end_date } });

  if (department.head_user_id) {
    const head = await User.findByPk(department.head_user_id);
    await notify({
      userId: head.id,
      to: head.email,
      subject: "Substitute Delegation Pending Approval",
      message: `${req.user.full_name} has requested to delegate approvals in ${department.name} from ${start_date} to ${end_date}.`,
      category: "general",
    });
  }

  res.status(201).json({ delegation });
});

// GET /api/approvals/my-delegations — the signed-in approver's own past and
// current delegation requests, with their REAL status (pending/approved/
// denied) — for the "Delegation History" card, which previously showed
// hardcoded fake entries.
export const getMyDelegations = asyncHandler(async (req, res) => {
  const delegations = await Delegation.findAll({
    where: { approver_id: req.user.id },
    include: [{ model: User, as: "delegate", attributes: ["full_name"] }],
    order: [["id", "DESC"]],
  });
  res.json({ delegations });
});

// GET /api/approvals/department-performance — real per-approver stats for
// the Department Head's Team Performance screen: pending count, approved
// this month, average response time, computed from real data (not hardcoded
// mock rows).
export const getDepartmentPerformance = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ where: { name: req.user.department } });
  if (!department) return res.json({ team: [] });

  const approvers = await User.findAll({ where: { role: "approver", department: department.name, is_active: true } });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const deptPendingTotal = await DepartmentApproval.count({ where: { department_id: department.id, status: "pending" } });

  const team = [];
  for (const approver of approvers) {
    // Note: tasks in this system are pooled per-department (any approver in
    // the department can act on any pending task) rather than individually
    // pre-assigned — so "pending" is a department-wide number, not
    // meaningfully attributable to one approver until they act on it. What
    // IS real and per-person is what they've actually decided.
    const decided = await DepartmentApproval.findAll({
      where: { department_id: department.id, approver_id: approver.id, status: { [Op.in]: ["approved", "rejected"] } },
    });
    const approvedThisMonth = decided.filter((d) => d.status === "approved" && d.approved_at && new Date(d.approved_at) >= monthStart).length;

    let avgHours = 0;
    if (decided.length > 0) {
      const totalHours = decided.reduce((sum, d) => {
        if (!d.approved_at) return sum;
        return sum + (new Date(d.approved_at) - new Date(d.createdAt)) / 3600000;
      }, 0);
      avgHours = Math.round((totalHours / decided.length) * 10) / 10;
    }

    team.push({
      id: approver.id,
      name: approver.full_name,
      totalActioned: decided.length,
      approvedThisMonth,
      avgResponseHours: avgHours,
      slaCompliant: avgHours === 0 || avgHours <= 72,
    });
  }

  res.json({ team, departmentPendingTotal: deptPendingTotal });
});
