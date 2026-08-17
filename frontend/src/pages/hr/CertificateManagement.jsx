import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { Award, Download, ShieldAlert } from "lucide-react";
import { certificateService } from "../../services/certificateService";
import { useToast } from "../../context/ToastContext";

export default function CertificateManagement() {
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reissue, setReissue] = useState(null);
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

  const active = certificates.filter((c) => c.status === "active").length;
  const revoked = certificates.filter((c) => c.status === "revoked").length;

  const columns = [
    { key: "certificate_number", header: "Certificate Number" },
    { key: "applicant", header: "Applicant", render: (c) => c.request?.applicant?.full_name || "—" },
    { key: "generated_at", header: "Issue Date", render: (c) => new Date(c.generated_at).toLocaleDateString() },
    { key: "status", header: "Status", render: (c) => <StatusChip status={c.status === "active" ? "approved" : "revoked"} label={c.status === "active" ? "Active" : "Revoked"} /> },
    {
      key: "actions", header: "", render: (c) => (
        <div className="flex gap-3">
          <button onClick={(e) => { e.stopPropagation(); certificateService.download(c.request_id).catch((err) => showToast(err.message, "error")); }} className="text-text-secondary hover:text-primary" title="Download">
            <Download size={15} />
          </button>
          {c.status === "active" && (
            <button onClick={(e) => { e.stopPropagation(); setReissue(c); }} className="text-xs font-medium text-primary hover:underline">Request Reissue</button>
          )}
        </div>
      )
    },
  ];

  const submitReissue = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await certificateService.requestReissue(reissue.id, reason);
      showToast("Reissue request sent to Super Admin", "success");
      setReissue(null);
      setReason("");
    } catch (err) {
      showToast(err.message || "Failed to send reissue request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Certificate Management" />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Generated" value={loading ? "…" : certificates.length} icon={Award} size="sm" />
        <StatCard label="Active" value={loading ? "…" : active} icon={Download} tone="success" size="sm" />
        <StatCard label="Revoked" value={loading ? "…" : revoked} icon={ShieldAlert} tone="error" size="sm" />
      </div>
      <DataTable columns={columns} rows={certificates} emptyTitle={loading ? "Loading..." : "No certificates generated yet"} />

      <Modal open={!!reissue} onClose={() => setReissue(null)} title="Request Certificate Reissue"
        footer={<><Button variant="outline" onClick={() => setReissue(null)}>Cancel</Button><Button disabled={!reason.trim() || submitting} onClick={submitReissue}>{submitting ? "Sending..." : "Send Request to Super Admin"}</Button></>}>
        <p className="mb-3 rounded-lg bg-canvas px-3.5 py-2.5 text-sm text-text-secondary">Revoking a certificate is a Super Admin action. This sends a real notification to every Super Admin with your reason — they'll review and action it from Certificate Administration.</p>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for reissue (required)" className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
      </Modal>
    </div>
  );
}
