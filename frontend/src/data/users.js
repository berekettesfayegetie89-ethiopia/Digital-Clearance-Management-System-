// Mock user directory — simulates what the backend's `users` table would return.
// In production this is replaced by calls to /api/auth and /api/admin/users.

export const ROLES = {
  APPLICANT: "applicant",
  APPROVER: "approver",
  DEPARTMENT_HEAD: "department_head",
  HR_COORDINATOR: "hr_coordinator",
  AUDITOR: "auditor",
  SUPER_ADMIN: "super_admin",
  SYSTEM_ADMIN: "system_admin",
};

export const MOCK_USERS = [
  {
    id: "u-001",
    fullName: "Selamawit Bekele",
    email: "selamawit.bekele@wollo.edu.et",
    role: ROLES.APPLICANT,
    studentId: "WU/UGR/4521/16",
    department: "Computer Science",
    phone: "+251 91 234 5678",
    avatarInitials: "SB",
  },
  {
    id: "u-002",
    fullName: "Tsegaye Alemu",
    email: "tsegaye.alemu@wollo.edu.et",
    role: ROLES.APPROVER,
    department: "Finance",
    title: "Finance Officer",
    avatarInitials: "TA",
  },
  {
    id: "u-003",
    fullName: "Dr. Meron Tadesse",
    email: "meron.tadesse@wollo.edu.et",
    role: ROLES.DEPARTMENT_HEAD,
    department: "Library Services",
    title: "Head of Library Services",
    avatarInitials: "MT",
  },
  {
    id: "u-004",
    fullName: "Hanna Girma",
    email: "hanna.girma@wollo.edu.et",
    role: ROLES.HR_COORDINATOR,
    department: "Human Resources",
    title: "HR Coordinator",
    avatarInitials: "HG",
  },
  {
    id: "u-005",
    fullName: "Yonas Fikru",
    email: "yonas.fikru@wollo.edu.et",
    role: ROLES.AUDITOR,
    department: "Internal Audit",
    title: "Compliance Auditor",
    avatarInitials: "YF",
  },
  {
    id: "u-006",
    fullName: "Betelhem Worku",
    email: "betelhem.worku@wollo.edu.et",
    role: ROLES.SUPER_ADMIN,
    department: "IT Administration",
    title: "Super Administrator",
    avatarInitials: "BW",
  },
  {
    id: "u-007",
    fullName: "Amanuel Kebede",
    email: "amanuel.kebede@wollo.edu.et",
    role: ROLES.SYSTEM_ADMIN,
    department: "IT Administration",
    title: "System Administrator",
    avatarInitials: "AK",
  },
];

export const findUserByEmail = (email) =>
  MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
