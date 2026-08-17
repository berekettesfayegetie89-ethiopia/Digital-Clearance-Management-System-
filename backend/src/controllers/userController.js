import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Op } from "sequelize";
import { User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";
import { notify } from "../services/emailService.js";

// GET /api/admin/users — Super Admin's User & Role Management table. Also
// powers HR Coordinator's "Initiate on Behalf" applicant search via the
// `search` query param (real name/ID lookup, not a hardcoded fake list).
export const listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const where = {};
  if (role) where.role = role;
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { employee_id: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  const users = await User.findAll({ where, attributes: { exclude: ["password_hash", "twofa_secret"] }, order: [["full_name", "ASC"]] });
  res.json({ users });
});

// POST /api/admin/users — creates a staff/applicant account with an
// auto-generated temporary password (must_change_password = true forces the
// first-login reset flow the frontend already implements).
export const createUser = asyncHandler(async (req, res) => {
  const { email, full_name, role, department, employee_id, phone } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: "A user with this email already exists." });

  const tempPassword = crypto.randomBytes(6).toString("hex");
  const password_hash = await bcrypt.hash(tempPassword, 10);

  const user = await User.create({
    email, full_name, role, department, employee_id, phone,
    password_hash,
    must_change_password: true,
  });

  await logAudit({ userId: req.user.id, action: "CREATE_USER", ip: req.clientIp, details: { createdUserId: user.id, role } });

  await notify({
    userId: user.id,
    to: user.email,
    subject: "Your Digital Clearance account has been created",
    message: `An account has been created for you. Temporary password: ${tempPassword}. You will be asked to set a new password on first login.`,
    category: "general",
  });

  const { password_hash: _omit, ...safeUser } = user.toJSON();
  res.status(201).json({ user: safeUser, tempPassword });
});

// POST /api/admin/users/:id/reset-password — Super Admin can either type an
// explicit new password for the user, or leave it blank to auto-generate a
// random temporary one (previous behavior). Either way, the user must
// change it on next login and can then log in with whichever password was
// actually set.
export const adminResetPassword = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  const { newPassword } = req.body;
  if (newPassword && newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const passwordToSet = newPassword || crypto.randomBytes(6).toString("hex");
  user.password_hash = await bcrypt.hash(passwordToSet, 10);
  user.must_change_password = true;
  await user.save();

  await logAudit({ userId: req.user.id, action: "RESET_PASSWORD", ip: req.clientIp, details: { targetUserId: user.id, explicitPassword: !!newPassword } });
  await notify({
    userId: user.id,
    to: user.email,
    subject: "Your password has been reset",
    message: `Your Super Admin reset your password. Temporary password: ${passwordToSet}. You'll be asked to set a new one on next login.`,
    category: "general",
  });

  res.json({ message: "Password reset.", tempPassword: passwordToSet });
});

// POST /api/admin/users/:id/toggle-active — real reactivation, not a
// one-way deactivate. Toggles is_active based on its current value.
export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.is_active = !user.is_active;
  await user.save();
  await logAudit({ userId: req.user.id, action: "CREATE_USER", ip: req.clientIp, details: { toggledUserId: user.id, nowActive: user.is_active } });
  res.json({ user });
});
