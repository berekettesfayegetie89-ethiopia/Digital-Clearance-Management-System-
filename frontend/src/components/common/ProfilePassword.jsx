import { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Bell, Copy } from "lucide-react";
import PageHeader from "./PageHeader";
import Card from "./Card";
import Button from "./Button";
import Modal from "./Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authService } from "../../services/authService";

function parseDevice(userAgent) {
  if (!userAgent) return "Unknown device";
  if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) return "Chrome";
  if (/Firefox/.test(userAgent)) return "Firefox";
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return "Safari";
  if (/Edg/.test(userAgent)) return "Edge";
  if (/curl|TestScript/.test(userAgent)) return "API client";
  return userAgent.slice(0, 40);
}

/**
 * Shared Profile & Password page. `roleCard` lets each role inject one extra
 * read-only info card without duplicating the whole page per role.
 */
export default function ProfilePassword({ roleCard }) {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [twoFAModal, setTwoFAModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [manualKey, setManualKey] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [twoFABusy, setTwoFABusy] = useState(false);

  useEffect(() => {
    authService
      .loginHistory()
      .then(({ history }) => setLoginHistory(history))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (pwForm.next.length < 8) {
      showToast("New password must be at least 8 characters", "error");
      return;
    }
    setPwSubmitting(true);
    try {
      await authService.changePassword(pwForm.current, pwForm.next);
      showToast("Password updated successfully", "success");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      showToast(err.message || "Could not update password", "error");
    } finally {
      setPwSubmitting(false);
    }
  };

  const start2FASetup = async () => {
    setTwoFABusy(true);
    try {
      const { qrDataUrl, manualEntryKey } = await authService.setup2FA();
      setQrData(qrDataUrl);
      setManualKey(manualEntryKey);
      setTwoFAModal(true);
    } catch (err) {
      showToast(err.message || "Could not start 2FA setup", "error");
    } finally {
      setTwoFABusy(false);
    }
  };

  const confirmEnable2FA = async () => {
    setTwoFABusy(true);
    try {
      await authService.verify2FA(verifyCode);
      showToast("Two-factor authentication enabled", "success");
      setUser((u) => ({ ...u, twofa_enabled: true }));
      setTwoFAModal(false);
      setVerifyCode("");
    } catch (err) {
      showToast(err.message || "Invalid code", "error");
    } finally {
      setTwoFABusy(false);
    }
  };

  const disable2FA = async () => {
    try {
      await authService.disable2FA();
      showToast("Two-factor authentication disabled", "success");
      setUser((u) => ({ ...u, twofa_enabled: false }));
    } catch (err) {
      showToast(err.message || "Failed to disable 2FA", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Profile & Password" description="Manage your account details and security." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <p className="mb-4 text-sm font-semibold text-text-primary">Personal Information</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2.5">
                <span className="text-text-secondary">Full Name</span>
                <span className="font-medium text-text-primary">{user.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2.5">
                <span className="text-text-secondary">Email</span>
                <span className="font-medium text-text-primary">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2.5">
                <span className="text-text-secondary">Department</span>
                <span className="font-medium text-text-primary">{user.department}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-text-secondary">Role</span>
                <span className="font-medium text-text-primary">{user.title || "Applicant"}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-secondary">
              Contact the Registrar or your Super Admin to update these details.
            </p>
          </Card>

          {roleCard}

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Bell size={16} className="text-text-secondary" />
              <p className="text-sm font-semibold text-text-primary">Notification Preferences</p>
            </div>
            {["Email Notifications", "In-App Notifications"].map((label) => (
              <label key={label} className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">
                {label}
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-primary" />
              </label>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <KeyRound size={16} className="text-text-secondary" />
              <p className="text-sm font-semibold text-text-primary">Change Password</p>
            </div>
            <form className="space-y-3" onSubmit={handlePasswordChange}>
              <input
                type="password"
                placeholder="Current password"
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="password"
                placeholder="New password"
                value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              <Button type="submit" full disabled={pwSubmitting}>
                {pwSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-text-secondary" />
                <p className="text-sm font-semibold text-text-primary">Two-Factor Authentication</p>
              </div>
              <button
                onClick={() => (user.twofa_enabled ? disable2FA() : start2FASetup())}
                disabled={twoFABusy}
                className={`relative h-6 w-11 rounded-full transition ${user.twofa_enabled ? "bg-primary" : "bg-border"}`}
                aria-label="Toggle two-factor authentication"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    user.twofa_enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              {user.twofa_enabled
                ? "Enabled — you'll be asked for a code from your authenticator app at login."
                : "Uses any real TOTP authenticator app (Google Authenticator, Authy, Microsoft Authenticator)."}
            </p>
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-text-primary">Login History</p>
            {loadingHistory ? (
              <p className="text-xs text-text-secondary">Loading...</p>
            ) : loginHistory.length === 0 ? (
              <p className="text-xs text-text-secondary">No login history yet.</p>
            ) : (
              <div className="space-y-3">
                {loginHistory.map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-text-primary">
                        {parseDevice(l.userAgent)}{" "}
                        {!l.success && <span className="text-error">(failed)</span>}
                      </p>
                      <p className="text-text-secondary">{new Date(l.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-text-secondary">{l.ip}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={twoFAModal}
        onClose={() => { setTwoFAModal(false); setVerifyCode(""); }}
        title="Set up two-factor authentication"
        footer={
          <>
            <Button variant="outline" onClick={() => { setTwoFAModal(false); setVerifyCode(""); }}>
              Cancel
            </Button>
            <Button onClick={confirmEnable2FA} disabled={verifyCode.length !== 6 || twoFABusy}>
              {twoFABusy ? "Verifying..." : "Enable"}
            </Button>
          </>
        }
      >
        <div className="text-center">
          <p className="mb-4 text-sm text-text-secondary">
            Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter the 6-digit code it shows.
          </p>
          {qrData && <img src={qrData} alt="2FA QR code" className="mx-auto mb-4 h-40 w-40 rounded-lg border border-border" />}
          <button
            onClick={() => { navigator.clipboard.writeText(manualKey); showToast("Key copied", "success"); }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-canvas px-3 py-1.5 text-xs font-mono text-text-secondary hover:text-text-primary"
          >
            <Copy size={12} /> {manualKey}
          </button>
          <input
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-center text-lg font-mono tracking-widest focus:border-primary focus:outline-none"
          />
        </div>
      </Modal>
    </div>
  );
}
