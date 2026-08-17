import { api } from "./apiClient.js";

export const clearanceService = {
  apply: (payload) => api.post("/clearance/apply", payload),
  myRequests: () => api.get("/clearance/my"),
  getRequest: (id) => api.get(`/clearance/${id}`),
  withdraw: (id) => api.post(`/clearance/${id}/withdraw`),
  resubmit: (id, payload) => api.post(`/clearance/${id}/resubmit`, payload),
  uploadDocuments: (id, formData) => api.post(`/clearance/${id}/documents`, formData, { isFormData: true }),
  getDocuments: (id) => api.get(`/clearance/${id}/documents`),
};
