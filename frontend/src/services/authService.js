import { api } from "./apiClient.js";

export const authService = {
  login: (email, password, twoFactorCode) => api.post("/auth/login", { email, password, twoFactorCode }),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post("/auth/reset-password", { token, password }),
  changePassword: (currentPassword, newPassword) => api.post("/auth/change-password", { currentPassword, newPassword }),
  loginHistory: () => api.get("/auth/login-history"),
  setup2FA: () => api.post("/auth/2fa/setup"),
  verify2FA: (code) => api.post("/auth/2fa/verify", { code }),
  disable2FA: () => api.post("/auth/2fa/disable"),
};
