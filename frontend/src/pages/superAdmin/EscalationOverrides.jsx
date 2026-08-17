import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

export default function EscalationOverrides() {
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: "approve"|"reject", row }
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { approvals } = await adminService.pendingApprovals();
      setApprovals(approvals);
    } catch (err) {
      showToast(err.message || "Failed to load pending approvals", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const needingAttention = approvals.filter((a) => a.needsAttention);

  const submitDecision = async () => {
    if (!modal || !reason.trim()) return;
    setSubmitting(true);
    try {
      await adminService.forceDecision(modal.row.id, { decision: modal.type, reason });
      showToast(`Request ${modal.type === "approve" ? "force-approved" : "force-rejected"} and logged`, "success");
      setModal(null);
      setReason("");
      await load();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "applicant", header: "Applicant" },
    { key: "reference_no", header: "Reference" },
    { key: "department", header: "Department" },
    {
      key: "actedBy",
      header: "Approver",
      render: (r) => r.actedBy || <span className="text-text-secondary">Not yet actioned</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        !r.hasApprover ? (
          <StatusChip status="error" label="No approver in dept." />
        ) : r.hoursOverdue > 0 ? (
          <StatusChip status="overdue" label={`${r.hoursOverdue}h overdue`} />
        ) : (
          <StatusChip status="pending" label="Pending" />
        ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setModal({ type: "approve", row: r }); }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Force Approve
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setModal({ type: "reject", row: r }); }}
            className="text-xs font-medium text-error hover:underline"
          >
            Force Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Escalation Overrides"
        description="Every currently pending department task, system-wide — including tasks stuck with no approver assigned."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>
            Refresh
          </Button>
        }
      />
      <StatCard
        label="Requests Requiring Admin Intervention"
        value={loading ? "…" : needingAttention.length}
        icon={AlertTriangle}
        tone="error"
        size="lg"
      />
      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={approvals}
          emptyTitle={loading ? "Loading..." : "No pending approvals right now"}
          emptyDescription={loading ? undefined : "Every department task has been actioned."}
        />
      </div>

      <Modal
        open={!!modal}
        onClose={() => { setModal(null); setReason(""); }}
        title={modal ? `${modal.type === "approve" ? "Force Approve" : "Force Reject"} — ${modal.row.applicant} (${modal.row.department})` : ""}
        footer={
          <>
            <Button variant="outline" onClick={() => { setModal(null); setReason(""); }}>
              Cancel
            </Button>
            <Button
              variant={modal?.type === "reject" ? "danger" : "primary"}
              disabled={!reason.trim() || submitting}
              onClick={submitDecision}
            >
              {submitting ? "Submitting..." : "Confirm"}
            </Button>
          </>
        }
      >
        <p className="mb-3 rounded-lg bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
          This is a manual override. It will be permanently logged in the audit trail.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (required)"
          className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
      </Modal>
    </div>
  );
}
