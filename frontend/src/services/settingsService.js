import { api, BASE_URL } from "./apiClient.js";

function getToken() {
  return sessionStorage.getItem("clearance_token");
}

export const settingsService = {
  get: () => api.get("/admin/settings"),
  update: (payload) => api.put("/admin/settings", payload),
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append("logo", file);
    const token = getToken();
    const res = await fetch(`${BASE_URL}/admin/settings/logo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Logo upload failed");
    return data;
  },
  logoUrl: (logoPath) => (logoPath ? `${BASE_URL.replace(/\/api$/, "")}/${logoPath}` : null),
};
