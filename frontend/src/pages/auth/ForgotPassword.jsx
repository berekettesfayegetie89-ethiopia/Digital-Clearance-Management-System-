import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, ArrowLeft } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { authService } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devResetLink, setDevResetLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Backend never reveals whether the email exists, to avoid account
      // enumeration — so this always "succeeds" from the UI's perspective.
      const res = await authService.forgotPassword(email);
      if (res.devResetLink) setDevResetLink(res.devResetLink);
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <Card className="p-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
          <MailCheck size={22} />
        </div>
        <h1 className="text-lg font-bold text-text-primary">Check your inbox</h1>
        <p className="mt-2 text-sm text-text-secondary">
          If an account exists for <span className="font-medium text-text-primary">{email}</span>, a reset
          link has been sent. The link expires in 15 minutes.
        </p>
        {devResetLink && (
          <div className="mt-4 rounded-lg border border-dashed border-warning/40 bg-warning-bg px-4 py-3 text-left">
            <p className="text-xs font-semibold text-warning">Dev mode — no SMTP configured</p>
            <p className="mt-1 text-xs text-text-secondary">No real email was sent. Since this is a development setup without Gmail configured, here's the real reset link directly:</p>
            <a href={devResetLink} className="mt-1.5 block break-all text-xs font-medium text-primary hover:underline">{devResetLink}</a>
          </div>
        )}
        <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-xl font-bold text-text-primary">Forgot your password?</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Enter your university email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            placeholder="you@wollo.edu.et"
          />
        </div>
        <Button type="submit" full size="lg">
          Send Reset Link
        </Button>
      </form>
      <Link to="/login" className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft size={15} /> Back to sign in
      </Link>
    </Card>
  );
}
