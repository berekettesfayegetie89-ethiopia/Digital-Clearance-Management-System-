import { api } from "./apiClient.js";

export const approvalsService = {
  pending: () => api.get("/approvals/pending"),
  history: () => api.get("/approvals/history"),
  colleagues: () => api.get("/approvals/colleagues"),
  myDelegations: () => api.get("/approvals/my-delegations"),
  departmentPerformance: () => api.get("/approvals/department-performance"),
  act: (id, action, remarks) => api.post(`/approvals/${id}/action`, { action, remarks }),
  requestDelegation: (payload) => api.post("/approvals/delegate", payload),
};
