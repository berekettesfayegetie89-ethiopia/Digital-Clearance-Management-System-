import { api, downloadAuthenticatedFile } from "./apiClient.js";

export const certificateService = {
  download: (requestId) => downloadAuthenticatedFile(`/certificate/${requestId}`),
  verify: (payload) => api.post("/certificate/verify", payload),
  revoke: (id, reason, reissue) => api.post(`/certificate/${id}/revoke`, { reason, reissue }),
  requestReissue: (id, reason) => api.post(`/certificate/${id}/request-reissue`, { reason }),
  list: () => api.get("/certificate"),
};
