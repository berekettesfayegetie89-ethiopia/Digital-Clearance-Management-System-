import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { ROLE_HOME_PATH } from "../../data/navigation";

/**
 * Shown once, immediately after a Super-Admin-created account logs in with
 * a temporary password (must_change_password = true on the backend). No
 * sidebar/nav — blocks access to the rest of the app until completed.
 */
export default function ForceChangePassword() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("New password must be at least 8 characters.");
    if (mismatch) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      // Uses the dedicated authenticated change-password endpoint (distinct
      // from the emailed-token Forgot Password flow) since the person is
      // already logged in with their temporary password.
      await authService.changePassword(current, password);
      setUser({ ...user, mustChangePassword: false });
      navigate(ROLE_HOME_PATH[user.role]);
    } catch (err) {
      setError(err.message || "Could not update your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-md p-7">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/8 text-primary">
          <KeyRound size={20} />
        </div>
        <h1 className="text-lg font-bold text-text-primary">Set a new password to continue</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Your account was created with a temporary password. Choose a new password before continuing to
          your dashboard.
        </p>

        {error && <p className="mt-3 rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Temporary password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none ${
                mismatch ? "border-error" : "border-border focus:border-primary"
              }`}
            />
          </div>
          <Button type="submit" full size="lg" disabled={submitting}>
            {submitting ? "Updating..." : "Continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
