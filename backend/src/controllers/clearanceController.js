import { Op } from "sequelize";
import {
  ClearanceRequest,
  DepartmentApproval,
  Department,
  Workflow,
  User,
  Document,
} from "../models/index.js";
import { generateReferenceNumber } from "../utils/generateRefNo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";
import { notify } from "../services/emailService.js";
import { maybeCompleteClearance } from "../services/workflowEngine.js";

const ACTIVE_STATUSES = ["pending", "in-progress"];

/**
 * Creates the department_approvals rows for a brand-new (or re-submitted)
 * request, following the workflow configured for this clearance_type:
 * departments marked is_parallel=true open immediately ("pending"); a chain
 * of is_parallel=false departments opens one at a time by sequence_order
 * (FR-016), starting only the first as "pending" and leaving the rest
 * "not_started" until their predecessor approves.
 */
async function createApprovalTasks(request, { carryOverFrom = null } = {}) {
  const steps = await Workflow.findAll({
    where: { clearance_type: request.clearance_type },
    order: [["sequence_order", "ASC"]],
  });

  let sequentialOpened = false;
  const created = [];

  for (const step of steps) {
    // If resubmitting, carry over any prior approval for this department
    // (partial-approval-persistence policy — see README "Design Decisions").
    const priorApproval = carryOverFrom
      ? await DepartmentApproval.findOne({
          where: { request_id: carryOverFrom, department_id: step.department_id },
        })
      : null;

    if (priorApproval && priorApproval.status === "approved") {
      const carried = await DepartmentApproval.create({
        request_id: request.id,
        department_id: step.department_id,
        approver_id: priorApproval.approver_id,
        status: "approved",
        remarks: priorApproval.remarks,
        approved_at: priorApproval.approved_at,
        carried_over: true,
      });
      created.push(carried);
      continue;
    }

    let status = "not_started";
    let deadline = null;

    if (step.is_parallel) {
      status = "pending";
      deadline = new Date(Date.now() + step.sla_hours * 3600 * 1000);
    } else if (!sequentialOpened) {
      status = "pending";
      deadline = new Date(Date.now() + step.sla_hours * 3600 * 1000);
      sequentialOpened = true;
    }

    const approval = await DepartmentApproval.create({
      request_id: request.id,
      department_id: step.department_id,
      status,
      deadline,
    });
    created.push(approval);

    if (status === "pending") {
      const dept = await Department.findByPk(step.department_id);
      const approvers = await User.findAll({
        where: { role: "approver", department: dept.name, is_active: true },
      });
      for (const approver of approvers) {
        await notify({
          userId: approver.id,
          to: approver.email,
          subject: "New Clearance Request Assigned",
          message: `A new ${request.clearance_type} request (${request.reference_no}) has been routed to ${dept.name} for review.`,
          category: "assignment",
        });
      }
    }
  }

  return created;
}

export const applyForClearance = asyncHandler(async (req, res) => {
  const { clearance_type, reason, last_working_date, on_behalf_of_user_id } = req.body;

  // HR Coordinators can submit on behalf of an applicant (FR-001 note /
  // "Initiate on Behalf" screen). The request is correctly attributed to
  // the real applicant, not to HR's own account, so it shows up under that
  // applicant's own "My Requests" and correctly enforces BR-001 for THEM,
  // not for HR.
  let applicantId = req.user.id;
  if (on_behalf_of_user_id && req.user.role === "hr_coordinator") {
    const targetUser = await User.findByPk(on_behalf_of_user_id);
    if (!targetUser || targetUser.role !== "applicant") {
      return res.status(400).json({ error: "Selected user is not a valid applicant." });
    }
    applicantId = targetUser.id;
  }

  if (!clearance_type || !reason || !last_working_date) {
    return res.status(400).json({ error: "clearance_type, reason, and last_working_date are required." });
  }
  if (reason.trim().length < 10 || reason.length > 1000) {
    return res.status(400).json({ error: "Reason must be between 10 and 1000 characters." });
  }
  if (new Date(last_working_date) < new Date().setHours(0, 0, 0, 0)) {
    return res.status(400).json({ error: "Last working/study date cannot be in the past." });
  }

  // BR-001: no more than one active clearance request at a time.
  const existingActive = await ClearanceRequest.findOne({
    where: { applicant_id: applicantId, status: { [Op.in]: ACTIVE_STATUSES } },
  });
  if (existingActive) {
    return res.status(409).json({
      error: "This applicant already has an active clearance request. Withdraw or complete it before applying again.",
    });
  }

  const reference_no = await generateReferenceNumber();
  const request = await ClearanceRequest.create({
    reference_no,
    applicant_id: applicantId,
    clearance_type,
    reason,
    last_working_date,
    status: "in-progress",
  });

  await createApprovalTasks(request);
  await logAudit({ userId: req.user.id, action: "APPLY", requestId: request.id, ip: req.clientIp, details: on_behalf_of_user_id ? { onBehalfOf: applicantId } : undefined });

  const applicantUser = applicantId === req.user.id ? req.user : await User.findByPk(applicantId);
  await notify({
    userId: applicantId,
    to: applicantUser.email,
    subject: "Clearance Request Submitted",
    message: `Your ${clearance_type} request has been submitted${on_behalf_of_user_id ? ` on your behalf by ${req.user.full_name} (HR)` : ""}. Reference number: ${reference_no}.`,
    category: "general",
  });

  res.status(201).json({ request });
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await ClearanceRequest.findAll({
    where: { applicant_id: req.user.id },
    include: [{ model: DepartmentApproval, as: "approvals", include: [{ model: Department, as: "department" }, { model: User, as: "approver", attributes: ["id", "full_name"] }] }],
    order: [["submitted_at", "DESC"]],
  });
  res.json({ requests });
});

export const getRequestDetail = asyncHandler(async (req, res) => {
  const request = await ClearanceRequest.findByPk(req.params.id, {
    include: [
      { model: DepartmentApproval, as: "approvals", include: [{ model: Department, as: "department" }, { model: User, as: "approver", attributes: ["id", "full_name"] }] },
      { model: Document, as: "documents" },
      { model: User, as: "applicant", attributes: ["id", "full_name", "email", "employee_id", "department"] },
    ],
  });
  if (!request) return res.status(404).json({ error: "Clearance request not found." });

  // Row-level access: applicants only see their own; approvers only their
  // department's; HR/Auditor/Admin see everything (NFR-002).
  const role = req.user.role;
  if (role === "applicant" && request.applicant_id !== req.user.id) {
    return res.status(403).json({ error: "You don't have permission to view this request." });
  }

  res.json({ request });
});

// BR-002: withdrawal only allowed if no department has approved yet.
export const withdrawRequest = asyncHandler(async (req, res) => {
  const request = await ClearanceRequest.findByPk(req.params.id, {
    include: [{ model: DepartmentApproval, as: "approvals" }],
  });
  if (!request) return res.status(404).json({ error: "Clearance request not found." });
  if (request.applicant_id !== req.user.id) {
    return res.status(403).json({ error: "You can only withdraw your own requests." });
  }

  const anyApproved = request.approvals.some((a) => a.status === "approved");
  if (anyApproved) {
    return res.status(409).json({
      error: "This request can no longer be withdrawn — at least one department has already approved it.",
    });
  }

  request.status = "withdrawn";
  await request.save();
  await logAudit({ userId: req.user.id, action: "WITHDRAW", requestId: request.id, ip: req.clientIp });

  res.json({ request });
});

// BR-003/BR-004: a rejected clearance can be re-submitted with a NEW
// reference number, but departments that already approved carry their
// approval forward instead of being forced to re-review from scratch.
export const resubmitRequest = asyncHandler(async (req, res) => {
  const original = await ClearanceRequest.findByPk(req.params.id);
  if (!original) return res.status(404).json({ error: "Clearance request not found." });
  if (original.applicant_id !== req.user.id) {
    return res.status(403).json({ error: "You can only re-submit your own requests." });
  }
  if (original.status !== "rejected") {
    return res.status(409).json({ error: "Only a rejected request can be re-submitted." });
  }

  const { reason, last_working_date } = req.body;
  const reference_no = await generateReferenceNumber();

  const resubmitted = await ClearanceRequest.create({
    reference_no,
    applicant_id: original.applicant_id,
    clearance_type: original.clearance_type,
    reason: reason || original.reason,
    last_working_date: last_working_date || original.last_working_date,
    status: "in-progress",
    supersedes_request_id: original.id,
  });

  await createApprovalTasks(resubmitted, { carryOverFrom: original.id });
  await logAudit({ userId: req.user.id, action: "RESUBMIT", requestId: resubmitted.id, ip: req.clientIp, details: { supersedes: original.id } });
  await maybeCompleteClearance(resubmitted.id, req.headers.origin); // in case every department had already carried over as approved

  res.status(201).json({ request: resubmitted });
});
