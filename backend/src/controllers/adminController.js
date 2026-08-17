import { Op, fn, col } from "sequelize";
import {
  ClearanceRequest,
  DepartmentApproval,
  Department,
  User,
} from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";
import { notify } from "../services/emailService.js";

// GET /api/admin/clearance/all — HR Coordinator's Full Clearance Matrix / Super Admin.
export const getAllClearances = asyncHandler(async (req, res) => {
  const { status, clearance_type, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (clearance_type) where.clearance_type = clearance_type;

  const requests = await ClearanceRequest.findAll({
    where,
    include: [
      { model: User, as: "applicant", attributes: ["id", "full_name", "employee_id"], where: search ? { full_name: { [Op.like]: `%${search}%` } } : undefined },
      { model: DepartmentApproval, as: "approvals", include: [{ model: Department, as: "department" }] },
    ],
    order: [["submitted_at", "DESC"]],
  });

  res.json({ requests });
});

// POST /api/admin/clearance/:id/escalate — manual "Follow-Up" trigger (FR-038).
export const manualEscalate = asyncHandler(async (req, res) => {
  const approval = await DepartmentApproval.findByPk(req.params.id, {
    include: [{ model: User, as: "approver" }, { model: Department, as: "department" }],
  });
  if (!approval) return res.status(404).json({ error: "Approval task not found." });

  if (approval.approver) {
    await notify({
      userId: approval.approver.id,
      to: approval.approver.email,
      subject: "Follow-Up: Pending Clearance Review",
      message: `This is a follow-up reminder that a clearance request in ${approval.department.name} is still awaiting your review.`,
      category: "reminder",
    });
  }

  await logAudit({ userId: req.user.id, action: "ESCALATE", requestId: approval.request_id, ip: req.clientIp, details: { manual: true } });
  res.json({ message: "Follow-up reminder sent." });
});

// Super Admin — Escalation Overrides: force approve/reject/reassign.
export const forceDecision = asyncHandler(async (req, res) => {
  const { decision, reason, reassign_to } = req.body; // decision: "approve" | "reject" | "reassign"
  const approval = await DepartmentApproval.findByPk(req.params.id, {
    include: [{ model: ClearanceRequest, as: "request", include: [{ model: User, as: "applicant" }] }, { model: Department, as: "department" }],
  });
  if (!approval) return res.status(404).json({ error: "Approval task not found." });
  if (!reason && decision !== "reassign") {
    return res.status(400).json({ error: "A reason is required for this override." });
  }

  if (decision === "reassign") {
    approval.approver_id = reassign_to;
    await approval.save();
    await logAudit({ userId: req.user.id, action: "REASSIGN", requestId: approval.request_id, ip: req.clientIp, details: { reassign_to } });
    return res.json({ approval });
  }

  approval.status = decision === "approve" ? "approved" : "rejected";
  approval.remarks = `[Admin override] ${reason}`;
  approval.approver_id = req.user.id;
  if (decision === "approve") approval.approved_at = new Date();
  await approval.save();

  await logAudit({
    userId: req.user.id,
    action: decision === "approve" ? "FORCE_APPROVE" : "FORCE_REJECT",
    requestId: approval.request_id,
    ip: req.clientIp,
    details: { reason },
  });

  if (decision === "reject") {
    approval.request.status = "rejected";
    await approval.request.save();
  }

  const { openNextSequentialDepartment, maybeCompleteClearance } = await import("../services/workflowEngine.js");
  if (decision === "approve") {
    await openNextSequentialDepartment(approval.request_id, approval.id);
    await maybeCompleteClearance(approval.request_id, req.headers.origin);
  }

  res.json({ approval });
});

// GET /api/admin/approvals/pending — every currently-pending department
// task, system-wide. Used by the Super Admin's Escalation Overrides screen
// so genuinely stuck tasks (a department with NO approver accounts at all)
// are visible even before they've technically breached SLA — not just the
// ones the cron job has already flagged as overdue.
export const getAllPendingApprovals = asyncHandler(async (req, res) => {
  // Department Heads only see their own department's pending tasks;
  // HR/Super Admin see everything system-wide.
  const where = { status: "pending" };
  if (req.user.role === "department_head") {
    const dept = await Department.findOne({ where: { name: req.user.department } });
    where.department_id = dept ? dept.id : -1;
  }

  const approvals = await DepartmentApproval.findAll({
    where,
    include: [
      { model: ClearanceRequest, as: "request", include: [{ model: User, as: "applicant", attributes: ["id", "full_name", "employee_id"] }] },
      { model: Department, as: "department" },
      { model: User, as: "approver", attributes: ["id", "full_name"] }, // set only once someone has acted — null until then, that's normal
    ],
    order: [["deadline", "ASC"]],
  });

  // approver_id on the row is only populated once someone actually acts on
  // it — a pending task with approver_id = null is completely normal. What
  // we actually need to flag is a department that has NO approver accounts
  // at all, so cache a department -> approver-count lookup once.
  const deptNames = [...new Set(approvals.map((a) => a.department?.name).filter(Boolean))];
  const approverCounts = {};
  for (const name of deptNames) {
    approverCounts[name] = await User.count({ where: { role: "approver", department: name, is_active: true } });
  }

  const now = new Date();
  const withMeta = approvals.map((a) => {
    const deptName = a.department?.name;
    const hasApprover = (approverCounts[deptName] || 0) > 0;
    const hoursOverdue = a.deadline ? Math.max(0, Math.round((now - new Date(a.deadline)) / 3600000)) : 0;
    return {
      id: a.id,
      applicant: a.request?.applicant?.full_name || "Unknown",
      reference_no: a.request?.reference_no,
      department: deptName,
      actedBy: a.approver?.full_name || null, // who has already partially actioned it, if anyone (e.g. via hold)
      hasApprover,
      hoursOverdue,
      isEscalated: a.is_escalated,
      escalationStage: a.escalation_stage,
      needsAttention: !hasApprover || hoursOverdue > 0 || a.is_escalated,
    };
  });

  res.json({ approvals: withMeta });
});


export const getApprovalTimesReport = asyncHandler(async (req, res) => {
  const approvals = await DepartmentApproval.findAll({
    where: { status: "approved" },
    include: [{ model: Department, as: "department" }],
  });

  const byDept = {};
  for (const a of approvals) {
    const name = a.department?.name || "Unknown";
    byDept[name] = byDept[name] || { count: 0, totalHours: 0 };
    if (a.approved_at && a.createdAt) {
      const hours = (new Date(a.approved_at) - new Date(a.createdAt)) / 3600000;
      byDept[name].count += 1;
      byDept[name].totalHours += hours;
    }
  }

  const report = Object.entries(byDept).map(([department, v]) => ({
    department,
    approvedCount: v.count,
    avgApprovalHours: v.count ? Math.round((v.totalHours / v.count) * 10) / 10 : 0,
  }));

  res.json({ report });
});
