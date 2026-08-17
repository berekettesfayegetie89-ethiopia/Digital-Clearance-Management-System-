import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { authService } from "../../services/authService";

function strength(pw) {
  if (pw.length === 0) return { label: "", width: "0%", color: "bg-border" };
  if (pw.length < 6) return { label: "Weak", width: "33%", color: "bg-error" };
  if (pw.length < 10) return { label: "Fair", width: "66%", color: "bg-warning" };
  return { label: "Strong", width: "100%", color: "bg-success" };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const meter = strength(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mismatch || password.length < 8) return;
    setSubmitting(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message || "This reset link is invalid or has expired.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card className="p-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle2 size={22} />
        </div>
        <h1 className="text-lg font-bold text-text-primary">Password updated</h1>
        <p className="mt-2 text-sm text-text-secondary">Redirecting you to sign in...</p>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-xl font-bold text-text-primary">Set a new password</h1>
      <p className="mt-1 text-sm text-text-secondary">Choose a strong password you haven't used before.</p>

      {!token && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
          <AlertCircle size={16} />
          No reset token found in the link. Request a new one from Forgot Password.
        </div>
      )}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className={`h-full transition-all ${meter.color}`} style={{ width: meter.width }} />
          </div>
          {meter.label && <p className="mt-1 text-xs text-text-secondary">Strength: {meter.label}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none ${
              mismatch ? "border-error focus:border-error" : "border-border focus:border-primary"
            }`}
          />
          {mismatch && <p className="mt-1 text-xs text-error">Passwords do not match.</p>}
        </div>
        <Button type="submit" full size="lg" disabled={password.length < 8 || mismatch || !token || submitting}>
          {submitting ? "Updating..." : "Reset Password"}
        </Button>
      </form>
      <Link to="/login" className="mt-5 block text-center text-sm font-medium text-primary hover:underline">
        Back to sign in
      </Link>
    </Card>
  );
}
