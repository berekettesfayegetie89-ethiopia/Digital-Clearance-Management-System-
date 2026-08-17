import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

export default function EscalatedRequests() {
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'reminder', row }
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { approvals } = await adminService.pendingApprovals();
      setApprovals(approvals.filter((a) => a.needsAttention));
    } catch (err) {
      showToast(err.message || "Failed to load escalated requests", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "applicant", header: "Applicant" },
    { key: "actedBy", header: "Approver", render: (r) => r.actedBy || "Not yet actioned" },
    { key: "stage", header: "Status", render: (r) => <StatusChip status={r.hoursOverdue >= 48 ? "overdue" : "warning"} label={r.hasApprover ? (r.escalationStage?.replace("_", " ") || "pending") : "No approver in dept."} /> },
    { key: "hoursOverdue", header: "Hours Overdue", render: (r) => (r.hoursOverdue > 0 ? `${r.hoursOverdue}h` : "—") },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); setModal({ row: r }); }} className="text-xs font-medium text-primary hover:underline">
          Send Reminder
        </button>
      ),
    },
  ];

  const sendReminder = async () => {
    setSending(true);
    try {
      await adminService.escalate(modal.row.id);
      showToast("Reminder sent", "success");
      setModal(null);
    } catch (err) {
      showToast(err.message || "Failed to send reminder", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Escalated Requests" description="Requests in your department that need attention." />
      <DataTable columns={columns} rows={approvals} emptyTitle={loading ? "Loading..." : "Nothing needs attention right now"} />

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Send reminder"
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={sendReminder} disabled={sending}>{sending ? "Sending..." : "Send"}</Button></>}
      >
        <p className="text-sm text-text-secondary">A reminder will be sent for {modal?.row?.applicant}'s pending review.</p>
      </Modal>
    </div>
  );
}
