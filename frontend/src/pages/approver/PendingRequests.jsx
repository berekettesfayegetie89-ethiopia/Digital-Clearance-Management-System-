import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Drawer from "../../components/common/Drawer";
import Button from "../../components/common/Button";
import { useToast } from "../../context/ToastContext";
import { approvalsService } from "../../services/approvalsService";
import { downloadAuthenticatedFile } from "../../services/apiClient";

function slaUrgency(deadline) {
  if (!deadline) return "normal";
  const hoursLeft = (new Date(deadline) - new Date()) / 3600000;
  if (hoursLeft < 0) return "overdue";
  if (hoursLeft < 24) return "warning";
  return "normal";
}

export default function PendingRequests() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    approvalsService
      .pending()
      .then(({ pending }) => setRequests(pending))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = requests.filter((r) => typeFilter === "All" || r.request.clearance_type === typeFilter);

  const columns = [
    { key: "applicant", header: "Applicant", render: (r) => r.request.applicant?.full_name },
    { key: "applicantId", header: "ID", render: (r) => r.request.applicant?.employee_id },
    { key: "type", header: "Type", render: (r) => r.request.clearance_type },
    { key: "requestDate", header: "Request Date", render: (r) => new Date(r.request.submitted_at).toLocaleDateString() },
    {
      key: "urgency",
      header: "SLA Deadline",
      render: (r) => {
        const urgency = slaUrgency(r.deadline);
        return (
          <StatusChip
            status={urgency === "overdue" ? "overdue" : urgency === "warning" ? "warning" : "success"}
            label={r.deadline ? new Date(r.deadline).toLocaleDateString() : "No deadline"}
          />
        );
      },
    },
  ];

  const submitAction = async () => {
    if (action === "reject" && reason.trim().length === 0) {
      showToast("A reason is required to reject a request", "error");
      return;
    }
    setSubmitting(true);
    try {
      await approvalsService.act(selected.id, action, reason);
      showToast(
        action === "approve" ? "Request approved" : action === "reject" ? "Request rejected" : "Request placed on hold",
        "success"
      );
      setAction(null);
      setSelected(null);
      setReason("");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-text-secondary">Loading pending requests...</p>;

  return (
    <div>
      <PageHeader
        title="Pending Requests"
        description="Review and act on clearance requests routed to your department."
        actions={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option>All</option>
            <option>Employee Resignation</option>
            <option>Employee Transfer</option>
            <option>Employee Termination</option>
            <option>Student Graduation</option>
            <option>Student Withdrawal</option>
          </select>
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={setSelected}
        emptyTitle="No pending requests"
        emptyDescription="You're all caught up — new requests will appear here."
      />

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setAction(null); setReason(""); }}
        title={selected?.request?.reference_no}
        footer={
          action ? (
            <>
              <Button variant="outline" onClick={() => setAction(null)} disabled={submitting}>Cancel</Button>
              <Button
                variant={action === "reject" ? "danger" : action === "hold" ? "outline" : "primary"}
                onClick={submitAction}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : `Confirm ${action === "approve" ? "Approval" : action === "reject" ? "Rejection" : "Hold"}`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setAction("hold")}>Hold</Button>
              <Button variant="danger" onClick={() => setAction("reject")}>Reject</Button>
              <Button variant="primary" onClick={() => setAction("approve")}>Approve</Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-text-secondary">Applicant</p>
              <p className="font-semibold text-text-primary">{selected.request.applicant?.full_name}</p>
              <p className="text-xs text-text-secondary">{selected.request.applicant?.employee_id}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Clearance Type</p>
              <p className="font-medium text-text-primary">{selected.request.clearance_type}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Reason</p>
              <p className="text-sm text-text-primary">{selected.request.reason}</p>
            </div>
            <button
              onClick={() =>
                showToast("Open Department Documents from the sidebar to review reference files for this request.", "info")
              }
              className="text-xs font-medium text-primary hover:underline"
            >
              View uploaded documents
            </button>

            {action && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  {action === "reject" ? "Reason (required)" : "Comments (optional)"}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
                  placeholder={action === "reject" ? "Explain why this request is being rejected..." : "Add a remark..."}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
