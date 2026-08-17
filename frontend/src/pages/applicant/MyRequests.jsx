import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Drawer from "../../components/common/Drawer";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../context/ToastContext";
import { clearanceService } from "../../services/clearanceService";

const TABS = ["Active", "Completed", "Rejected", "Withdrawn"];

function overallStatus(req) {
  if (req.status === "rejected") return "rejected";
  if (req.status === "cleared") return "approved";
  if (req.status === "withdrawn") return "not_started";
  return "pending";
}

export default function MyRequests() {
  const [tab, setTab] = useState("Active");
  const [selected, setSelected] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    clearanceService
      .myRequests()
      .then(({ requests }) => setRequests(requests))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = requests.filter((r) => {
    const status = overallStatus(r);
    if (tab === "Active") return r.status === "pending" || r.status === "in-progress";
    if (tab === "Completed") return status === "approved";
    if (tab === "Rejected") return status === "rejected";
    if (tab === "Withdrawn") return r.status === "withdrawn";
    return true;
  });

  const canWithdraw = (req) => (req.approvals || []).every((a) => a.status !== "approved");

  const columns = [
    { key: "reference_no", header: "Reference No." },
    { key: "clearance_type", header: "Clearance Type" },
    { key: "submitted_at", header: "Submitted", render: (r) => new Date(r.submitted_at).toLocaleDateString() },
    { key: "status", header: "Status", render: (r) => <StatusChip status={overallStatus(r)} /> },
    { key: "action", header: "", render: () => <span className="text-sm font-medium text-primary">View Details →</span> },
  ];

  const handleWithdraw = async () => {
    try {
      await clearanceService.withdraw(selected.id);
      showToast("Request withdrawn", "success");
      setSelected(null);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleResubmit = async () => {
    try {
      const { request } = await clearanceService.resubmit(selected.id, {});
      showToast(`Re-submitted as ${request.reference_no}`, "success");
      setSelected(null);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) return <p className="text-sm text-text-secondary">Loading your requests...</p>;

  return (
    <div>
      <PageHeader title="My Requests" description="Track every clearance request you've submitted." />

      <div className="mb-5 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title={`No ${tab.toLowerCase()} clearances`} description="Nothing to show in this tab yet." />
      ) : (
        <DataTable columns={columns} rows={filtered} onRowClick={setSelected} />
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.reference_no}>
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-text-secondary">Clearance Type</p>
              <p className="font-medium text-text-primary">{selected.clearance_type}</p>
            </div>

            {selected.status === "rejected" && (
              <div className="rounded-lg bg-error-bg px-4 py-3 text-sm text-error">
                <p className="font-semibold">This request was rejected</p>
                <p className="mt-1">See the rejecting department's remarks below.</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-text-primary">Department-wise Status</p>
              <div className="space-y-2.5">
                {(selected.approvals || []).map((a) => (
                  <div key={a.id} className="rounded-lg border border-border px-3.5 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">
                        {a.department?.name}
                        {a.carried_over && (
                          <span className="ml-2 rounded-full bg-info-bg px-2 py-0.5 text-[10px] font-medium text-info">
                            Carried over
                          </span>
                        )}
                      </p>
                      <StatusChip status={a.status} />
                    </div>
                    {a.approver && (
                      <p className="mt-1 text-xs text-text-secondary">
                        {a.approver.full_name} {a.approved_at && `· ${new Date(a.approved_at).toLocaleDateString()}`}
                      </p>
                    )}
                    {a.remarks && <p className="mt-1 text-xs text-text-secondary">"{a.remarks}"</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 border-t border-border pt-4">
              {selected.status === "rejected" ? (
                <Button full onClick={handleResubmit}>
                  Re-submit Request
                </Button>
              ) : canWithdraw(selected) && selected.status !== "withdrawn" && selected.status !== "cleared" ? (
                <Button full variant="dangerOutline" onClick={handleWithdraw}>
                  Withdraw Request
                </Button>
              ) : selected.status !== "withdrawn" && selected.status !== "cleared" ? (
                <div className="w-full rounded-lg bg-canvas px-3.5 py-2.5 text-center text-xs text-text-secondary">
                  Withdrawal unavailable — a department has already approved this request
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
