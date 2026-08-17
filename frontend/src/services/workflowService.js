import { api } from "./apiClient.js";

export const workflowService = {
  get: () => api.get("/workflows"),
  save: (clearance_type, steps) => api.post("/workflows", { clearance_type, steps }),
};
