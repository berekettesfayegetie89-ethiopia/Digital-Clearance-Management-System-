import { Delegation, Department, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";
import { notify } from "../services/emailService.js";

export const getDelegationsForDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ where: { name: req.user.department } });
  const delegations = await Delegation.findAll({
    where: { department_id: department.id },
    include: [
      { model: User, as: "approver", attributes: ["id", "full_name"] },
      { model: User, as: "delegate", attributes: ["id", "full_name"] },
    ],
    order: [["id", "DESC"]],
  });
  res.json({ delegations });
});

export const decideDelegation = asyncHandler(async (req, res) => {
  const { decision } = req.body; // "approve" | "deny"
  const delegation = await Delegation.findByPk(req.params.id);
  if (!delegation) return res.status(404).json({ error: "Delegation request not found." });

  delegation.status = decision === "approve" ? "approved" : "denied";
  delegation.approved_by = req.user.id;
  await delegation.save();

  await logAudit({
    userId: req.user.id,
    action: decision === "approve" ? "DELEGATE_APPROVE" : "DELEGATE_DENY",
    ip: req.clientIp,
    details: { delegation_id: delegation.id },
  });

  const approver = await User.findByPk(delegation.approver_id);
  await notify({
    userId: approver.id,
    to: approver.email,
    subject: `Delegation Request ${decision === "approve" ? "Approved" : "Denied"}`,
    message: `Your delegation request has been ${decision === "approve" ? "approved" : "denied"} by your Department Head.`,
    category: "general",
  });

  res.json({ delegation });
});
