import { AuditLog } from "../models/index.js";

/**
 * Writes one immutable audit log entry. Called from every controller action
 * that the SRS lists as auditable (section 20): submission, every
 * approval/rejection/hold, document upload, certificate generation,
 * withdrawal, escalation, public verification attempt, logins, etc.
 */
export async function logAudit({ userId = null, action, requestId = null, details = null, ip = null }) {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      request_id: requestId,
      details,
      ip,
    });
  } catch (err) {
    // Never let audit logging failure break the primary action, but do
    // surface it loudly since a silent audit gap matters for compliance.
    console.error("⚠️  Failed to write audit log:", err.message);
  }
}
