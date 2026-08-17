import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME_PATH } from "../../data/navigation";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { useBranding } from "../../context/BrandingContext";

// Matches src/seed/seed.js on the backend — password for every account is
// "password123". These are only shown to make grading/demoing easy; remove
// this block for a real production deployment.
const DEMO_ACCOUNTS = [
  { email: "selamawit.bekele@wollo.edu.et", label: "Applicant" },
  { email: "tsegaye.alemu@wollo.edu.et", label: "Department Approver (Finance)" },
  { email: "meron.tadesse@wollo.edu.et", label: "Department Head (Library)" },
  { email: "hanna.girma@wollo.edu.et", label: "HR Coordinator" },
  { email: "yonas.fikru@wollo.edu.et", label: "Auditor" },
  { email: "betelhem.worku@wollo.edu.et", label: "Super Admin" },
  { email: "amanuel.kebede@wollo.edu.et", label: "System Administrator" },
];

export default function Login() {
  const { t } = useBranding();
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("selamawit.bekele@wollo.edu.et");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password, needs2FA ? twoFactorCode : undefined);
    setSubmitting(false);
    if (result.twoFactorRequired) {
      setNeeds2FA(true);
      return;
    }
    if (result.success) {
      if (result.user.mustChangePassword) {
        navigate("/force-password-change");
      } else {
        navigate(ROLE_HOME_PATH[result.user.role]);
      }
    }
  };

  if (needs2FA) {
    return (
      <Card className="p-7">
        <h1 className="text-xl font-bold text-text-primary">Enter your authentication code</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Open your authenticator app and enter the current 6-digit code for {email}.
        </p>
        {authError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error">
            <AlertCircle size={16} />
            {authError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            autoFocus
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-center text-lg font-mono tracking-widest focus:border-primary focus:outline-none"
          />
          <Button type="submit" full size="lg" disabled={submitting || twoFactorCode.length !== 6}>
            {submitting ? "Verifying..." : "Verify & Sign In"}
          </Button>
          <button
            type="button"
            onClick={() => { setNeeds2FA(false); setTwoFactorCode(""); }}
            className="block w-full text-center text-sm font-medium text-primary hover:underline"
          >
            Back to password
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-xl font-bold text-text-primary">{t("Sign in to your account")}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {t("Use your university email and password to continue.")}
      </p>

      {authError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error">
          <AlertCircle size={16} />
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">{t("Email or ID")}</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            placeholder="you@wollo.edu.et"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            {t("Remember me")}
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            {t("Forgot Password?")}
          </Link>
        </div>

        <Button type="submit" full size="lg" disabled={submitting} icon={submitting ? Loader2 : undefined}>
          {submitting ? "Signing in..." : t("Sign In")}
        </Button>
      </form>

      <div className="mt-6 rounded-lg bg-canvas px-4 py-3 text-xs text-text-secondary">
        <p className="mb-1.5 font-semibold text-text-primary">Demo accounts (password: password123):</p>
        <ul className="space-y-0.5">
          {DEMO_ACCOUNTS.map((u) => (
            <li key={u.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  setPassword("password123");
                }}
                className="text-left hover:text-primary hover:underline"
              >
                {u.email} — {u.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-text-secondary">
          Requires the backend + database to be running — see the README.
        </p>
      </div>
    </Card>
  );
}
