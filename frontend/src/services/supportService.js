import { api } from "./apiClient.js";

export const supportService = {
  submit: (payload) => api.post("/support", payload),
};
