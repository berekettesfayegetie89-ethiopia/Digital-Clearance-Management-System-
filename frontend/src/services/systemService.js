import { api } from "./apiClient.js";

export const systemService = {
  health: () => api.get("/system/health"),
  cronStatus: () => api.get("/system/cron-status"),
  runCronJob: (job) => api.post(`/system/cron/${job}/run`),
};
