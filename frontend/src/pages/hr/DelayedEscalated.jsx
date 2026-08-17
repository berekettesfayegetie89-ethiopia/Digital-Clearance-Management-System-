import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

export default function DelayedEscalated() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("Delayed");
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followUp, setFollowUp] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { approvals } = await adminService.pendingApprovals();
      setApprovals(approvals);
    } catch (err) {
      showToast(err.message || "Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const delayed = approvals.filter((a) => a.hoursOverdue > 0 && a.hoursOverdue < 48);
  const escalated = approvals.filter((a) => a.hoursOverdue >= 48 || a.isEscalated);
  const rows = tab === "Delayed" ? delayed : escalated;

  const columns = [
    { key: "applicant", header: "Applicant" },
    { key: "department", header: "Department" },
    { key: "hoursOverdue", header: "Hours Overdue", render: (r) => (r.hoursOverdue > 0 ? `${r.hoursOverdue}h` : "—") },
    { key: "stage", header: "Stage", render: (r) => <StatusChip status={r.hoursOverdue >= 48 ? "overdue" : "warning"} label={r.escalationStage?.replace("_", " ") || "pending"} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); setFollowUp(r); setMessage(`Hi, this is a follow-up regarding ${r.applicant}'s pending clearance review in ${r.department}.`); }} className="text-xs font-medium text-primary hover:underline">
          Follow Up
        </button>
      ),
    },
  ];

  const sendFollowUp = async () => {
    setSending(true);
    try {
      await adminService.escalate(followUp.id);
      showToast("Follow-up reminder sent", "success");
      setFollowUp(null);
    } catch (err) {
      showToast(err.message || "Failed to send follow-up", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Delayed / Escalated Requests" />
      <div className="mb-4 flex gap-1 border-b border-border">
        {["Delayed", "Escalated"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t ? "border-primary text-primary" : "border-transparent text-text-secondary"}`}>{t}</button>
        ))}
      </div>
      <DataTable columns={columns} rows={rows} emptyTitle={loading ? "Loading..." : `No ${tab.toLowerCase()} requests`} />

      <Modal
        open={!!followUp}
        onClose={() => setFollowUp(null)}
        title="Send Follow-Up Reminder"
        footer={<><Button variant="outline" onClick={() => setFollowUp(null)}>Cancel</Button><Button onClick={sendFollowUp} disabled={sending}>{sending ? "Sending..." : "Send"}</Button></>}
      >
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
      </Modal>
    </div>
  );
}
