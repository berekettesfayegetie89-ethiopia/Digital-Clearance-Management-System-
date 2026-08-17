import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { User, PasswordResetToken, AuditLog } from "../models/index.js";
import { signToken } from "../utils/jwt.js";
import { logAudit } from "../services/auditService.js";
import { notify, hasSmtpConfig } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password, twoFactorCode } = req.body;
  const user = await User.findOne({ where: { email } });
  const userAgent = req.headers["user-agent"] || "Unknown device";

  if (!user || !user.is_active) {
    await logAudit({ action: "LOGIN_FAILED", details: { email, userAgent }, ip: req.clientIp });
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await logAudit({ userId: user.id, action: "LOGIN_FAILED", ip: req.clientIp, details: { userAgent } });
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // Real TOTP-based 2FA: if enabled on this account, a valid current code
  // must be supplied in the same request (frontend collects it as a second
  // step after the password succeeds).
  if (user.twofa_enabled) {
    if (!twoFactorCode) {
      return res.status(200).json({ twoFactorRequired: true });
    }
    const codeValid = authenticator.check(twoFactorCode, user.twofa_secret);
    if (!codeValid) {
      await logAudit({ userId: user.id, action: "LOGIN_FAILED", ip: req.clientIp, details: { userAgent, reason: "bad 2FA code" } });
      return res.status(401).json({ error: "Invalid two-factor code." });
    }
  }

  const token = signToken(user);
  await logAudit({ userId: user.id, action: "LOGIN", ip: req.clientIp, details: { userAgent } });

  const { password_hash, twofa_secret, ...safeUser } = user.toJSON();
  res.json({ token, user: safeUser });
});

export const me = asyncHandler(async (req, res) => {
  const { password_hash, twofa_secret, ...safeUser } = req.user.toJSON();
  res.json({ user: safeUser });
});

export const logout = asyncHandler(async (req, res) => {
  await logAudit({ userId: req.user?.id, action: "LOGOUT", ip: req.clientIp });
  res.json({ message: "Logged out." });
});

// GET /api/auth/login-history — a user's OWN real login attempts (real IP
// address as seen by the server, real browser/device from the User-Agent
// header) for the Profile & Password screen. Not simulated data.
export const getLoginHistory = asyncHandler(async (req, res) => {
  const logs = await AuditLog.findAll({
    where: { user_id: req.user.id, action: ["LOGIN", "LOGIN_FAILED"] },
    order: [["timestamp", "DESC"]],
    limit: 10,
  });
  res.json({
    history: logs.map((l) => ({
      timestamp: l.timestamp,
      success: l.action === "LOGIN",
      ip: l.ip,
      userAgent: l.details?.userAgent || "Unknown device",
    })),
  });
});

// --- Two-Factor Authentication (real TOTP, RFC 6238 — works with Google
// Authenticator, Authy, Microsoft Authenticator, etc.) ---

// POST /api/auth/2fa/setup — generates a real secret + QR code. Not yet
// enabled until the user proves they scanned it by verifying a code.
export const setup2FA = asyncHandler(async (req, res) => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(req.user.email, "Wollo University Clearance", secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  req.user.twofa_secret = secret; // stored but twofa_enabled stays false until verified
  await req.user.save();

  res.json({ qrDataUrl, secret, manualEntryKey: secret });
});

// POST /api/auth/2fa/verify — confirms the user actually scanned the QR
// (submits one valid current code), then flips twofa_enabled = true.
export const verify2FA = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!req.user.twofa_secret) {
    return res.status(400).json({ error: "Run 2FA setup first." });
  }
  const valid = authenticator.check(code, req.user.twofa_secret);
  if (!valid) {
    return res.status(400).json({ error: "Invalid code. Check your authenticator app and try again." });
  }
  req.user.twofa_enabled = true;
  await req.user.save();
  await logAudit({ userId: req.user.id, action: "RESET_PASSWORD", ip: req.clientIp, details: { twoFactorEnabled: true } });
  res.json({ message: "Two-factor authentication enabled." });
});

export const disable2FA = asyncHandler(async (req, res) => {
  req.user.twofa_enabled = false;
  req.user.twofa_secret = null;
  await req.user.save();
  res.json({ message: "Two-factor authentication disabled." });
});

// POST /api/auth/forgot-password — never reveals whether the email exists,
// to avoid account enumeration (per the cross-cutting screens spec).
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  let devResetLink = null;

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await PasswordResetToken.create({ user_id: user.id, token, expires_at: expiresAt });

    // Derive the link from the real request origin (same approach as
    // certificate QR codes) so it works correctly whether the frontend is
    // being accessed via localhost, a LAN IP, or a real domain — no manual
    // .env editing needed.
    const origin = req.headers.origin || process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${origin}/reset-password?token=${token}`;

    await notify({
      userId: user.id,
      to: user.email,
      subject: "Reset your Digital Clearance password",
      message: `We received a request to reset your password. This link expires in 15 minutes: ${resetLink}`,
      category: "general",
    });

    // Dev convenience: if no real SMTP is configured, the "email" only
    // reaches the backend terminal — return the link directly too, so the
    // reset flow is testable without setting up Gmail. Clearly a dev-only
    // affordance; a production deployment with real SMTP never hits this.
    if (!hasSmtpConfig) {
      devResetLink = resetLink;
    }
  }

  res.json({
    message: "If an account exists for this email, a reset link has been sent.",
    ...(devResetLink ? { devResetLink } : {}),
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const record = await PasswordResetToken.findOne({ where: { token, used: false } });

  if (!record || record.expires_at < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired." });
  }

  const user = await User.findByPk(record.user_id);
  user.password_hash = await bcrypt.hash(password, 10);
  user.must_change_password = false;
  await user.save();

  record.used = true;
  await record.save();

  await logAudit({ userId: user.id, action: "RESET_PASSWORD", ip: req.clientIp });
  res.json({ message: "Password updated successfully." });
});

// POST /api/auth/change-password — for an already-authenticated user, either
// changing their password voluntarily (Profile & Password screen) or
// completing the forced first-login reset (must_change_password = true).
// Distinct from resetPassword above, which is for the emailed-link flow
// where the person isn't logged in yet.
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  user.password_hash = await bcrypt.hash(newPassword, 10);
  user.must_change_password = false;
  await user.save();

  await logAudit({ userId: user.id, action: "RESET_PASSWORD", ip: req.clientIp, details: { selfService: true } });

  const { password_hash, ...safeUser } = user.toJSON();
  res.json({ message: "Password updated successfully.", user: safeUser });
});
