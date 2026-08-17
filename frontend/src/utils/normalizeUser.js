import { ROLE_LABELS } from "../data/navigation.js";

/**
 * The backend returns Sequelize's raw snake_case column names (full_name,
 * employee_id, ...). The UI was originally built against mock data using
 * camelCase display fields (fullName, avatarInitials, studentId, title).
 * Rather than touching every component that reads user.fullName /
 * user.avatarInitials / etc., normalize once here, right after login/me,
 * so both naming conventions are available on the same object.
 */
export function normalizeUser(raw) {
  if (!raw) return raw;

  const initials = (raw.full_name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return {
    ...raw,
    fullName: raw.full_name,
    studentId: raw.employee_id,
    avatarInitials: initials || "U",
    title: ROLE_LABELS[raw.role] || raw.role,
    mustChangePassword: raw.must_change_password,
  };
}
