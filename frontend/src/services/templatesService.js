import { api } from "./apiClient.js";

export const templatesService = {
  list: () => api.get("/admin/notification-templates"),
  update: (id, payload) => api.put(`/admin/notification-templates/${id}`, payload),
};
