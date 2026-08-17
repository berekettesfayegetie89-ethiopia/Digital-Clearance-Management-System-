import { api } from "./apiClient.js";

export const adminService = {
  allClearances: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/admin/clearance/all${qs ? `?${qs}` : ""}`);
  },
  pendingApprovals: () => api.get("/admin/approvals/pending"),
  escalate: (approvalId) => api.post(`/admin/clearance/${approvalId}/escalate`),
  forceDecision: (approvalId, payload) => api.post(`/admin/approvals/${approvalId}/force`, payload),
  approvalTimesReport: () => api.get("/admin/reports/approval-times"),
  departments: () => api.get("/admin/departments"),
  createDepartment: (payload) => api.post("/admin/departments", payload),
  users: (role) => api.get(`/admin/users${role ? `?role=${role}` : ""}`),
  createUser: (payload) => api.post("/admin/users", payload),
  resetUserPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, newPassword ? { newPassword } : {}),
  toggleUserActive: (id) => api.post(`/admin/users/${id}/toggle-active`),
};
