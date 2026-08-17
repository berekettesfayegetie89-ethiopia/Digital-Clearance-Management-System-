import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Modal from "../../components/common/Modal";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Download } from "lucide-react";
import { certificateService } from "../../services/certificateService";
import { useToast } from "../../context/ToastContext";

export default function CertificateAdministration() {
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoke, setRevoke] = useState(null);
  const [reissueToo, setReissueToo] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    certificateService
      .list()
      .then(({ certificates }) => setCertificates(certificates))
      .catch((err) => showToast(err.message || "Failed to load certificates", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "certificate_number", header: "Certificate No." },
    { key: "applicant", header: "Applicant", render: (c) => c.request?.applicant?.full_name || "—" },
    { key: "generated_at", header: "Issue Date", render: (c) => new Date(c.generated_at).toLocaleDateString() },
    { key: "verification_expires_at", header: "Verification Expiry", render: (c) => new Date(c.verification_expires_at).toLocaleDateString() },
    { key: "status", header: "Status", render: (c) => <StatusChip status={c.status === "active" ? "approved" : "revoked"} label={c.status === "active" ? "Active" : "Revoked"} /> },
    {
      key: "actions", header: "", render: (c) => (
        <div className="flex gap-3">
          <button onClick={(e) => { e.stopPropagation(); certificateService.download(c.request_id).catch((err) => showToast(err.message, "error")); }} className="text-text-secondary hover:text-primary" title="Download">
            <Download size={15} />
          </button>
          {c.status === "active" && (
            <button onClick={(e) => { e.stopPropagation(); setRevoke(c); }} className="text-xs font-medium text-error hover:underline">Revoke</button>
          )}
        </div>
      )
    },
  ];

  const submitRevoke = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await certificateService.revoke(revoke.id, reason, reissueToo);
      showToast(reissueToo ? "Certificate revoked and reissued" : "Certificate revoked", "success");
      setRevoke(null);
      setReason("");
      load();
    } catch (err) {
      showToast(err.message || "Revoke failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Certificate Administration" />
      <DataTable columns={columns} rows={certificates} emptyTitle={loading ? "Loading..." : "No certificates generated yet"} />
      <Card className="mt-6 max-w-lg">
        <p className="mb-3 text-sm font-semibold text-text-primary">Verification Settings</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between"><span className="text-text-secondary">Verification window length</span><span className="font-medium text-text-primary">5 years (set in backend .env)</span></div>
          <div className="flex items-center justify-between"><span className="text-text-secondary">QR token type</span><span className="font-medium text-text-primary">Random 256-bit</span></div>
        </div>
      </Card>

      <Modal open={!!revoke} onClose={() => setRevoke(null)} title={`Revoke ${revoke?.certificate_number}?`}
        footer={<><Button variant="outline" onClick={() => setRevoke(null)}>Cancel</Button><Button variant="danger" disabled={!reason.trim() || submitting} onClick={submitRevoke}>{submitting ? "Processing..." : "Revoke Certificate"}</Button></>}>
        <p className="mb-3 rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error">This action is permanent and will be recorded in the audit trail.</p>
        <label className="mb-3 flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={reissueToo} onChange={(e) => setReissueToo(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
          Also generate a replacement certificate immediately
        </label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for revocation (required)" className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
      </Modal>
    </div>
  );
}
