import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "../services/authService.js";
import { normalizeUser } from "../utils/normalizeUser.js";

// Real auth against the Express/MySQL backend. The JWT is kept in
// sessionStorage (cleared when the tab closes) and attached to every API
// request by services/apiClient.js.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token is already stored, fetch the current user so
  // a page refresh doesn't log the person out.
  useEffect(() => {
    const token = sessionStorage.getItem("clearance_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then(({ user }) => setUser(normalizeUser(user)))
      .catch(() => sessionStorage.removeItem("clearance_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password, twoFactorCode) => {
    setAuthError(null);
    try {
      const res = await authService.login(email, password, twoFactorCode);
      if (res.twoFactorRequired) {
        return { success: false, twoFactorRequired: true };
      }
      const { token, user } = res;
      sessionStorage.setItem("clearance_token", token);
      const normalized = normalizeUser(user);
      setUser(normalized);
      return { success: true, user: normalized };
    } catch (err) {
      setAuthError(err.message || "Invalid email or password.");
      return { success: false };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // even if the request fails, clear the local session
    }
    sessionStorage.removeItem("clearance_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, authError, setAuthError, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
