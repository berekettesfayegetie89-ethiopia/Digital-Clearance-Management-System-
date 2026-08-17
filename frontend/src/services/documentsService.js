import { api, downloadAuthenticatedFile } from "./apiClient.js";

export const documentsService = {
  forMyDepartment: () => api.get("/documents/department"),
  download: (id) => downloadAuthenticatedFile(`/documents/${id}/download`),
  remove: (id) => api.del(`/documents/${id}`),
};
