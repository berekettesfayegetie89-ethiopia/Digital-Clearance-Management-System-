import { User } from "./User.js";
import { Department } from "./Department.js";
import { ClearanceRequest } from "./ClearanceRequest.js";
import { Workflow } from "./Workflow.js";
import { DepartmentApproval } from "./DepartmentApproval.js";
import { Document } from "./Document.js";
import { Certificate } from "./Certificate.js";
import { AuditLog } from "./AuditLog.js";
import { Notification } from "./Notification.js";
import { Delegation } from "./Delegation.js";
import { PasswordResetToken } from "./PasswordResetToken.js";
import { SystemSettings } from "./SystemSettings.js";
import { NotificationTemplate } from "./NotificationTemplate.js";
import { SupportTicket } from "./SupportTicket.js";

// --- Departments <-> Users (head) ---
Department.belongsTo(User, { as: "head", foreignKey: "head_user_id" });

// --- Clearance Requests ---
ClearanceRequest.belongsTo(User, { as: "applicant", foreignKey: "applicant_id" });
User.hasMany(ClearanceRequest, { as: "requests", foreignKey: "applicant_id" });

ClearanceRequest.belongsTo(ClearanceRequest, {
  as: "previousRequest",
  foreignKey: "supersedes_request_id",
});

// --- Workflows ---
Workflow.belongsTo(Department, { foreignKey: "department_id" });
Department.hasMany(Workflow, { foreignKey: "department_id" });

// --- Department Approvals (the core join table) ---
DepartmentApproval.belongsTo(ClearanceRequest, { as: "request", foreignKey: "request_id" });
ClearanceRequest.hasMany(DepartmentApproval, { as: "approvals", foreignKey: "request_id" });

DepartmentApproval.belongsTo(Department, { as: "department", foreignKey: "department_id" });
Department.hasMany(DepartmentApproval, { foreignKey: "department_id" });

DepartmentApproval.belongsTo(User, { as: "approver", foreignKey: "approver_id" });
User.hasMany(DepartmentApproval, { as: "assignedApprovals", foreignKey: "approver_id" });

// --- Documents ---
Document.belongsTo(ClearanceRequest, { as: "request", foreignKey: "request_id" });
ClearanceRequest.hasMany(Document, { as: "documents", foreignKey: "request_id" });

Document.belongsTo(User, { as: "uploader", foreignKey: "uploaded_by" });

// --- Certificates ---
Certificate.belongsTo(ClearanceRequest, { as: "request", foreignKey: "request_id" });
ClearanceRequest.hasOne(Certificate, { as: "certificate", foreignKey: "request_id" });

Certificate.belongsTo(Certificate, {
  as: "previousCertificate",
  foreignKey: "supersedes_certificate_id",
});

// --- Audit Logs ---
AuditLog.belongsTo(User, { as: "user", foreignKey: "user_id" });
AuditLog.belongsTo(ClearanceRequest, { as: "request", foreignKey: "request_id" });

// --- Notifications ---
Notification.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Notification, { foreignKey: "user_id" });

// --- Delegations ---
Delegation.belongsTo(User, { as: "approver", foreignKey: "approver_id" });
Delegation.belongsTo(User, { as: "delegate", foreignKey: "delegate_id" });
Delegation.belongsTo(Department, { foreignKey: "department_id" });

// --- Password reset ---
PasswordResetToken.belongsTo(User, { foreignKey: "user_id" });

// --- Support tickets ---
SupportTicket.belongsTo(User, { foreignKey: "user_id" });

export {
  User,
  Department,
  ClearanceRequest,
  Workflow,
  DepartmentApproval,
  Document,
  Certificate,
  AuditLog,
  Notification,
  Delegation,
  PasswordResetToken,
  SystemSettings,
  NotificationTemplate,
  SupportTicket,
};
