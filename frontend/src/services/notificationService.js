import { api } from "./apiClient.js";

export const notificationService = {
  list: () => api.get("/notifications"),
  markAllRead: () => api.post("/notifications/mark-all-read"),
};
