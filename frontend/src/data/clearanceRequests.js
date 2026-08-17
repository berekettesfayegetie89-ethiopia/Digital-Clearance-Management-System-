// Mock clearance request records — mirrors the `clearance_requests` +
// `department_approvals` tables described in the SRS (sections 14 & FR-011 to FR-024).

export const DEPARTMENTS = [
  "Registrar",
  "Library",
  "Finance",
  "IT",
  "Store",
  "Academic Affairs",
];

export const CLEARANCE_TYPES = [
  "Employee Resignation",
  "Employee Transfer",
  "Employee Termination",
  "Student Graduation",
  "Student Withdrawal",
];

export const STATUS = {
  APPROVED: "approved",
  PENDING: "pending",
  REJECTED: "rejected",
  HOLD: "hold",
  NOT_STARTED: "not_started",
};

export const MY_ACTIVE_REQUEST = {
  id: "req-318",
  referenceNo: "CLR-2026-00318",
  applicant: "Selamawit Bekele",
  applicantId: "WU/UGR/4521/16",
  clearanceType: "Student Graduation",
  reason: "Completing BSc in Computer Science, graduating June 2026 cohort.",
  lastWorkingDate: "2026-06-20",
  submittedAt: "2026-05-02T09:14:00Z",
  status: "in-progress",
  departments: [
    {
      name: "Registrar",
      status: STATUS.APPROVED,
      approver: "Kidist Wolde",
      date: "2026-05-03",
      remarks: "All academic records finalized.",
    },
    {
      name: "Library",
      status: STATUS.APPROVED,
      approver: "Getachew Mola",
      date: "2026-05-04",
      remarks: "No outstanding books or fines.",
    },
    {
      name: "Finance",
      status: STATUS.APPROVED,
      approver: "Tsegaye Alemu",
      date: "2026-05-05",
      remarks: "Tuition balance fully settled.",
    },
    {
      name: "IT",
      status: STATUS.APPROVED,
      approver: "Robel Assefa",
      date: "2026-05-06",
      remarks: "Campus account and equipment returned.",
    },
    {
      name: "Store",
      status: STATUS.PENDING,
      approver: "Fikirte Haile",
      date: null,
      remarks: null,
    },
    {
      name: "Academic Affairs",
      status: STATUS.NOT_STARTED,
      approver: null,
      date: null,
      remarks: null,
    },
  ],
};

export const MY_REQUESTS_HISTORY = [
  MY_ACTIVE_REQUEST,
  {
    id: "req-204",
    referenceNo: "CLR-2025-00204",
    applicant: "Selamawit Bekele",
    clearanceType: "Student Withdrawal",
    submittedAt: "2025-02-11T10:00:00Z",
    status: "rejected",
    rejectionReason: "Outstanding library fine of ETB 350 must be settled before withdrawal can proceed.",
    departments: [
      { name: "Registrar", status: STATUS.APPROVED, approver: "Kidist Wolde", date: "2025-02-12" },
      { name: "Library", status: STATUS.REJECTED, approver: "Getachew Mola", date: "2025-02-13", remarks: "Outstanding fine of ETB 350." },
      { name: "Finance", status: STATUS.NOT_STARTED, approver: null, date: null },
    ],
  },
];

// Department Approver ("Finance") — pending queue
export const PENDING_APPROVALS = [
  {
    id: "req-401",
    referenceNo: "CLR-2026-00401",
    applicant: "Robel Getahun",
    applicantId: "WU/STF/1187",
    clearanceType: "Employee Resignation",
    requestDate: "2026-08-04",
    slaDeadline: "2026-08-11",
    urgency: "warning",
  },
  {
    id: "req-402",
    referenceNo: "CLR-2026-00402",
    applicant: "Marta Assefa",
    applicantId: "WU/UGR/3390/15",
    clearanceType: "Student Graduation",
    requestDate: "2026-08-05",
    slaDeadline: "2026-08-12",
    urgency: "normal",
  },
  {
    id: "req-403",
    referenceNo: "CLR-2026-00403",
    applicant: "Dawit Mengistu",
    applicantId: "WU/STF/0942",
    clearanceType: "Employee Transfer",
    requestDate: "2026-08-01",
    slaDeadline: "2026-08-08",
    urgency: "overdue",
  },
  {
    id: "req-404",
    referenceNo: "CLR-2026-00404",
    applicant: "Lidya Solomon",
    applicantId: "WU/UGR/2201/15",
    clearanceType: "Student Graduation",
    requestDate: "2026-08-06",
    slaDeadline: "2026-08-13",
    urgency: "normal",
  },
];

export const APPROVAL_HISTORY = [
  { id: "h-1", applicant: "Betelhem Yohannes", clearanceType: "Student Graduation", action: "approved", date: "2026-08-07", actedBy: "Tsegaye Alemu" },
  { id: "h-2", applicant: "Samuel Tesfaye", clearanceType: "Employee Resignation", action: "rejected", date: "2026-08-06", actedBy: "Tsegaye Alemu", remarks: "Pending equipment return invoice." },
  { id: "h-3", applicant: "Ruth Alemayehu", clearanceType: "Student Withdrawal", action: "approved", date: "2026-08-05", actedBy: "Chaltu Bekele (Delegate)" },
  { id: "h-4", applicant: "Nahom Girma", clearanceType: "Employee Termination", action: "hold", date: "2026-08-04", actedBy: "Tsegaye Alemu", remarks: "Awaiting inventory report." },
];

// HR Coordinator — full matrix
export const CLEARANCE_MATRIX = [
  { applicant: "Selamawit Bekele", ref: "CLR-2026-00318", type: "Graduation", Registrar: "approved", Library: "approved", Finance: "approved", IT: "approved", Store: "pending", "Academic Affairs": "not_started" },
  { applicant: "Robel Getahun", ref: "CLR-2026-00401", type: "Resignation", Registrar: "approved", Library: "approved", Finance: "pending", IT: "not_started", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Marta Assefa", ref: "CLR-2026-00402", type: "Graduation", Registrar: "approved", Library: "pending", Finance: "pending", IT: "not_started", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Dawit Mengistu", ref: "CLR-2026-00403", type: "Transfer", Registrar: "approved", Library: "approved", Finance: "rejected", IT: "not_started", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Lidya Solomon", ref: "CLR-2026-00404", type: "Graduation", Registrar: "approved", Library: "approved", Finance: "approved", IT: "approved", Store: "approved", "Academic Affairs": "approved" },
  { applicant: "Yordanos Mulu", ref: "CLR-2026-00405", type: "Withdrawal", Registrar: "approved", Library: "rejected", Finance: "not_started", IT: "not_started", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Kaleab Fikadu", ref: "CLR-2026-00406", type: "Resignation", Registrar: "approved", Library: "approved", Finance: "approved", IT: "pending", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Sara Endale", ref: "CLR-2026-00407", type: "Graduation", Registrar: "pending", Library: "not_started", Finance: "not_started", IT: "not_started", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Biniam Tekle", ref: "CLR-2026-00408", type: "Termination", Registrar: "approved", Library: "approved", Finance: "hold", IT: "not_started", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Eyerusalem Zewdu", ref: "CLR-2026-00409", type: "Graduation", Registrar: "approved", Library: "approved", Finance: "approved", IT: "approved", Store: "approved", "Academic Affairs": "pending" },
  { applicant: "Henok Alemu", ref: "CLR-2026-00410", type: "Resignation", Registrar: "approved", Library: "not_started", Finance: "not_started", IT: "not_started", Store: "not_started", "Academic Affairs": "not_started" },
  { applicant: "Frehiwot Getu", ref: "CLR-2026-00411", type: "Graduation", Registrar: "approved", Library: "approved", Finance: "approved", IT: "approved", Store: "approved", "Academic Affairs": "approved" },
];

export const escalatedRequests = [
  { id: "e-1", applicant: "Dawit Mengistu", originalApprover: "Tsegaye Alemu", stage: "48h HR escalation", daysOverdue: 5 },
  { id: "e-2", applicant: "Biniam Tekle", originalApprover: "Tsegaye Alemu", stage: "Overdue", daysOverdue: 2 },
  { id: "e-3", applicant: "Sara Endale", originalApprover: "Kidist Wolde", stage: "24h reminder", daysOverdue: 0 },
];

export const NOTIFICATIONS = [
  { id: "n-1", type: "approval", title: "Finance approved your clearance", desc: "CLR-2026-00318 — Finance department marked as Cleared.", time: "2 hours ago", unread: true },
  { id: "n-2", type: "reminder", title: "Store department review pending", desc: "Your request has been with Store for 3 days.", time: "1 day ago", unread: true },
  { id: "n-3", type: "certificate", title: "Certificate ready soon", desc: "You're one department away from full clearance.", time: "1 day ago", unread: false },
  { id: "n-4", type: "approval", title: "IT approved your clearance", desc: "CLR-2026-00318 — IT department marked as Cleared.", time: "3 days ago", unread: false },
];

export const AUDIT_LOGS = [
  { id: "a-1", timestamp: "2026-08-09 14:32", user: "Tsegaye Alemu", action: "APPROVE", ref: "CLR-2026-00401", ip: "10.20.4.11" },
  { id: "a-2", timestamp: "2026-08-09 11:05", user: "Selamawit Bekele", action: "APPLY", ref: "CLR-2026-00318", ip: "10.20.9.44" },
  { id: "a-3", timestamp: "2026-08-08 16:47", user: "Getachew Mola", action: "REJECT", ref: "CLR-2026-00405", ip: "10.20.4.19" },
  { id: "a-4", timestamp: "2026-08-08 09:12", user: "System", action: "ESCALATE", ref: "CLR-2026-00403", ip: "system" },
  { id: "a-5", timestamp: "2026-08-07 13:00", user: "Hanna Girma", action: "GENERATE", ref: "CERT-2026-0311", ip: "10.20.2.02" },
  { id: "a-6", timestamp: "2026-08-06 08:55", user: "Anonymous", action: "VERIFY", ref: "CERT-2026-0287", ip: "197.156.4.88" },
];
