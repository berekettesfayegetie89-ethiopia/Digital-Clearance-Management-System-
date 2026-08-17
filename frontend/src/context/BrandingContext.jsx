import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BASE_URL } from "../services/apiClient";
import defaultLogo from "../assets/images/wollo-university-logo.png";
import { translate } from "../i18n/translations";

const BrandingContext = createContext(null);

/**
 * Fetches the real institution name, logo, AND system-wide language from
 * the backend's public branding endpoint (no auth needed, works on Login/
 * Forgot Password/Verify pages too) and makes them available everywhere via
 * useBranding(). This is what makes changing the name/logo/language in
 * Super Admin Settings actually show up across the whole app instead of
 * just being saved and ignored — the app polls this on load and right
 * after Settings saves, so the person who changed it sees it instantly, and
 * everyone else picks it up on their next page load/navigation (this is a
 * system-wide setting, not a per-user preference).
 */
export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({ institution_name: "Wollo University", logo_path: null, language: "en" });
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    fetch(`${BASE_URL}/public/branding`)
      .then((res) => res.json())
      .then((data) => setBranding(data))
      .catch(() => {
        // Backend unreachable — fall back to the default so the UI still
        // renders sensibly rather than blank.
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    document.title = `Digital Clearance Management System | ${branding.institution_name}`;
    document.documentElement.lang = branding.language || "en";
  }, [branding.institution_name, branding.language]);

  const logoUrl = branding.logo_path ? `${BASE_URL.replace(/\/api$/, "")}/${branding.logo_path}` : defaultLogo;

  const t = useCallback((key) => translate(branding.language, key), [branding.language]);

  return (
    <BrandingContext.Provider value={{ ...branding, logoUrl, loading, refresh, t }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within a BrandingProvider");
  return ctx;
}
