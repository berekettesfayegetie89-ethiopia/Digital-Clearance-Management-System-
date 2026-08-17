import { api } from "./apiClient.js";

export const searchService = {
  query: (q) => api.get(`/search?q=${encodeURIComponent(q)}`),
};
