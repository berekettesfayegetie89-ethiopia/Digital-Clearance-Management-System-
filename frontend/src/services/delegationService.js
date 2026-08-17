import { api } from "./apiClient.js";

export const delegationService = {
  listForDepartment: () => api.get("/delegations"),
  decide: (id, decision) => api.post(`/delegations/${id}/decide`, { decision }),
};
