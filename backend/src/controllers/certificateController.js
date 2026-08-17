import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Certificate, ClearanceRequest, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";
import { notify } from "../services/emailService.js";
import { revokeCertificate, generateCertificate } from "../services/certificateService.js";
import { DepartmentApproval, Department } from "../models/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GET /api/certificate/:request_id — download the PDF (FR-031/FR-032).
export const downloadCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ where: { request_id: req.params.request_id } });
  if (!certificate) return res.status(404).json({ error: "No certificate has been generated for this request yet." });

  const request = await ClearanceRequest.findByPk(req.params.request_id);
  const role = req.user.role;
  const isOwner = request.applicant_id === req.user.id;
  const canView = isOwner || ["hr_coordinator", "super_admin", "auditor"].includes(role);
  if (!canView) return res.status(403).json({ error: "You don't have permission to view this certificate." });

  const filePath = path.join(__dirname, "..", "..", certificate.pdf_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Certificate file is missing on the server." });
  }

  res.download(filePath, `${certificate.certificate_number}.pdf`);
});

// POST /api/certificate/verify — public, no auth. Rate-limited at the route
// level (see routes/certificateRoutes.js). Accepts a verification token
// (from the QR/link) rather than the certificate number, per the SRS
// security note about preventing enumeration attacks. Also supports lookup
// by certificate_number as a secondary, more-guessable path.
export const verifyCertificate = asyncHandler(async (req, res) => {
  const { token, certificate_number } = req.body;

  const certificate = token
    ? await Certificate.findOne({ where: { verification_token: token } })
    : await Certificate.findOne({ where: { certificate_number } });

  await logAudit({ action: "VERIFY", ip: req.clientIp, details: { token: token ? "provided" : null, certificate_number } });

  if (!certificate) {
    return res.json({ result: "invalid" });
  }

  if (certificate.status === "revoked") {
    const replacement = certificate.supersedes_certificate_id
      ? null
      : await Certificate.findOne({ where: { supersedes_certificate_id: certificate.id } });
    return res.json({
      result: "revoked",
      supersededBy: replacement?.certificate_number || null,
    });
  }

  if (new Date(certificate.verification_expires_at) < new Date()) {
    return res.json({ result: "expired" });
  }

  const request = await ClearanceRequest.findByPk(certificate.request_id, {
    include: [{ model: User, as: "applicant", attributes: ["full_name"] }],
  });

  res.json({
    result: "authentic",
    data: {
      applicantName: request.applicant.full_name,
      clearanceDate: request.completed_at,
      certificateNumber: certificate.certificate_number,
      status: "Cleared",
    },
  });
});

// POST /api/certificate/:id/revoke — Super Admin only. Certificates are
// never edited or deleted, only revoked + optionally superseded by a fresh
// one (see the "why Revoke exists" explanation from earlier in the project).
export const revokeCertificateHandler = asyncHandler(async (req, res) => {
  const { reason, reissue } = req.body;
  const certificate = await Certificate.findByPk(req.params.id);
  if (!certificate) return res.status(404).json({ error: "Certificate not found." });
  if (certificate.status === "revoked") {
    return res.status(409).json({ error: "This certificate has already been revoked." });
  }
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: "A reason is required to revoke a certificate." });
  }

  await revokeCertificate({ certificate, revokedByUserId: req.user.id, reason });
  await logAudit({ userId: req.user.id, action: "REVOKE", requestId: certificate.request_id, ip: req.clientIp, details: { reason } });

  let newCertificate = null;
  if (reissue) {
    const request = await ClearanceRequest.findByPk(certificate.request_id, { include: [{ model: User, as: "applicant" }] });
    const approvals = await DepartmentApproval.findAll({
      where: { request_id: certificate.request_id },
      include: [{ model: Department, as: "department" }, { model: User, as: "approver" }],
    });
    newCertificate = await generateCertificate({ request, applicant: request.applicant, approvals, originUrl: req.headers.origin });
    newCertificate.supersedes_certificate_id = certificate.id;
    await newCertificate.save();
    await logAudit({ userId: req.user.id, action: "GENERATE", requestId: request.id, ip: req.clientIp, details: { reissueOf: certificate.certificate_number } });
  }

  res.json({ certificate, newCertificate });
});

export const listCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.findAll({
    include: [{ model: ClearanceRequest, as: "request", include: [{ model: User, as: "applicant", attributes: ["full_name"] }] }],
    order: [["generated_at", "DESC"]],
  });
  res.json({ certificates });
});

// POST /api/certificate/:id/request-reissue — HR Coordinator's side of the
// "why Revoke exists" workflow: HR can only REQUEST a reissue (real email
// notification to every Super Admin, real audit log entry), since actually
// revoking a certificate is a Super Admin-only action per the RBAC matrix.
export const requestReissue = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const certificate = await Certificate.findByPk(req.params.id);
  if (!certificate) return res.status(404).json({ error: "Certificate not found." });
  if (!reason?.trim()) return res.status(400).json({ error: "A reason is required." });

  const admins = await User.findAll({ where: { role: "super_admin", is_active: true } });
  for (const admin of admins) {
    await notify({
      userId: admin.id,
      to: admin.email,
      subject: `Certificate Reissue Requested — ${certificate.certificate_number}`,
      message: `${req.user.full_name} (HR) requested a reissue of ${certificate.certificate_number}. Reason: ${reason}. Review it under Certificate Administration.`,
      category: "general",
    });
  }

  await logAudit({ userId: req.user.id, action: "ESCALATE", requestId: certificate.request_id, ip: req.clientIp, details: { reissueRequestedFor: certificate.certificate_number, reason } });
  res.json({ message: "Reissue request sent to Super Admin." });
});
