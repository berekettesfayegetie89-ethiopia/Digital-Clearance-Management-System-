import { DepartmentApproval, Department, ClearanceRequest, User } from "../models/index.js";
import { notify } from "./emailService.js";
import { generateCertificate } from "./certificateService.js";

/**
 * After an approval, opens the next department in a sequential chain
 * (FR-016: "the next department receives a notification only after the
 * previous department approves"). Departments in the same workflow that are
 * marked is_parallel stay untouched here — they were already opened at
 * apply-time.
 */
export async function openNextSequentialDepartment(requestId, justApprovedApprovalId) {
  const justApproved = await DepartmentApproval.findByPk(justApprovedApprovalId);
  const allApprovals = await DepartmentApproval.findAll({
    where: { request_id: requestId },
    order: [["id", "ASC"]],
  });

  const idx = allApprovals.findIndex((a) => a.id === justApproved.id);
  const next = allApprovals[idx + 1];

  if (next && next.status === "not_started") {
    next.status = "pending";
    next.deadline = new Date(Date.now() + 72 * 3600 * 1000); // falls back to 72h if no workflow SLA lookup is cheap here
    await next.save();

    const dept = await Department.findByPk(next.department_id);
    const approvers = await User.findAll({ where: { role: "approver", department: dept.name, is_active: true } });
    for (const approver of approvers) {
      await notify({
        userId: approver.id,
        to: approver.email,
        subject: "New Clearance Request Assigned",
        message: `A clearance request has reached ${dept.name} for review after the previous department's approval.`,
        category: "assignment",
      });
    }
  }
}

/**
 * Checks whether every department_approval for a request is now "approved".
 * If so: marks the request "cleared", generates the certificate (FR-029 /
 * FR-030), and notifies the applicant.
 */
export async function maybeCompleteClearance(requestId, originUrl = null) {
  const approvals = await DepartmentApproval.findAll({
    where: { request_id: requestId },
    include: [{ model: Department, as: "department" }, { model: User, as: "approver" }],
  });

  const allApproved = approvals.length > 0 && approvals.every((a) => a.status === "approved");
  if (!allApproved) return null;

  const request = await ClearanceRequest.findByPk(requestId, { include: [{ model: User, as: "applicant" }] });
  if (request.status === "cleared") return request; // already completed, avoid double-generating a certificate

  request.status = "cleared";
  request.completed_at = new Date();
  await request.save();

  const certificate = await generateCertificate({
    request,
    applicant: request.applicant,
    approvals,
    originUrl,
  });

  await notify({
    userId: request.applicant_id,
    to: request.applicant.email,
    subject: "Clearance Completed — Certificate Ready",
    message: `All departments have approved your ${request.clearance_type} request (${request.reference_no}). Your digital certificate ${certificate.certificate_number} is ready to download.`,
    category: "certificate",
  });

  return request;
}
