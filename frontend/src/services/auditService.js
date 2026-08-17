import { api } from "./apiClient.js";

export const auditService = {
  logs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/audit${qs ? `?${qs}` : ""}`);
  },
  forRequest: (requestId) => api.get(`/audit/${requestId}`),
};
