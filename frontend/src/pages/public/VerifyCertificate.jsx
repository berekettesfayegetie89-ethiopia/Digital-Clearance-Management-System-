import { useState } from "react";
import { Hash, Upload, QrCode, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { certificateService } from "../../services/certificateService";
import { useBranding } from "../../context/BrandingContext";

const TABS = [
  { id: "number", label: "Certificate Number", icon: Hash },
  { id: "upload", label: "Upload PDF", icon: Upload },
  { id: "qr", label: "Scan QR", icon: QrCode },
];

const RESULT_META = {
  authentic: { icon: CheckCircle2, tone: "success", title: "Verified & Authentic", body: "This certificate matches our records and has not been altered." },
  invalid: { icon: XCircle, tone: "error", title: "Invalid or Tampered Certificate", body: "We could not verify this certificate. It may have been altered or does not exist in our records." },
  revoked: { icon: AlertTriangle, tone: "warning", title: "Certificate Revoked", body: null },
  expired: { icon: Clock, tone: "neutral", title: "Verification Period Expired", body: "This certificate's 5-year public verification window has ended. Contact the institution's registrar office to confirm authenticity." },
};

export default function PublicVerification() {
  const { institution_name, logoUrl } = useBranding();
  const [tab, setTab] = useState("number");
  const [certNo, setCertNo] = useState("");
  const [result, setResult] = useState(null); // { key, data?, supersededBy? }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = async () => {
    if (!certNo.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await certificateService.verify({ certificate_number: certNo.trim() });
      setResult(res);
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? RESULT_META[result.result] : null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-4 py-14">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logoUrl} alt={`${institution_name} logo`} className="h-16 w-16 rounded-md object-contain" />
          <h1 className="mt-4 text-2xl font-bold text-text-primary">Verify a Clearance Certificate</h1>
          <p className="mt-1 text-sm text-text-secondary">{institution_name} · Digital Clearance Management System</p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="mb-5 flex gap-1 rounded-lg bg-canvas p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setResult(null); setError(null); }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition ${
                  tab === t.id ? "bg-surface text-primary shadow-card" : "text-text-secondary"
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "number" && (
            <input
              value={certNo}
              onChange={(e) => setCertNo(e.target.value)}
              placeholder="CERT-YYYY-XXXXX"
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          )}
          {tab === "upload" && (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10 text-center text-sm text-text-secondary hover:border-primary/40">
              <Upload size={22} className="mb-2 text-primary" />
              PDF-based lookup isn't implemented yet — use Certificate Number instead
              <input type="file" hidden accept=".pdf" disabled />
            </label>
          )}
          {tab === "qr" && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10 text-sm text-text-secondary">
              <QrCode size={26} className="mb-2 text-primary" />
              Camera access would open here
            </div>
          )}

          {error && <p className="mt-3 text-sm text-error">{error}</p>}

          <button
            onClick={verify}
            disabled={tab !== "number" || loading || !certNo.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>

        {meta && (
          <div
            className={`mt-5 rounded-card border p-6 text-center ${
              meta.tone === "success" ? "border-success/30 bg-success-bg"
              : meta.tone === "error" ? "border-error/30 bg-error-bg"
              : meta.tone === "warning" ? "border-warning/30 bg-warning-bg"
              : "border-border bg-canvas"
            }`}
          >
            <meta.icon
              size={30}
              className={`mx-auto mb-2 ${
                meta.tone === "success" ? "text-success"
                : meta.tone === "error" ? "text-error"
                : meta.tone === "warning" ? "text-warning"
                : "text-text-secondary"
              }`}
            />
            <p className="text-base font-bold text-text-primary">{meta.title}</p>
            <p className="mt-1.5 text-sm text-text-secondary">
              {result.result === "revoked"
                ? (result.supersededBy
                    ? `This certificate has been revoked and superseded by ${result.supersededBy}.`
                    : "This certificate has been revoked.")
                : meta.body}
            </p>

            {result.result === "authentic" && result.data && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-surface p-4 text-left text-sm">
                <div>
                  <p className="text-xs text-text-secondary">Applicant</p>
                  <p className="font-medium text-text-primary">{result.data.applicantName}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Clearance Date</p>
                  <p className="font-medium text-text-primary">{new Date(result.data.clearanceDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Certificate No.</p>
                  <p className="font-medium text-text-primary">{result.data.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Status</p>
                  <p className="font-medium text-success">{result.data.status}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-text-secondary">
          © {new Date().getFullYear()} {institution_name} · Registrar's Office · +251 33 XXX XXXX
        </p>
      </div>
    </div>
  );
}
