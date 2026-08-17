import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Inbox, CheckCircle2, XCircle, PauseCircle, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import { approvalsService } from "../../services/approvalsService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function ApproverHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([approvalsService.pending(), approvalsService.history()])
      .then(([{ pending }, { history }]) => { setPending(pending); setHistory(history); })
      .catch((err) => showToast(err.message || "Failed to load dashboard data", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const today = new Date().toDateString();
  const approvedToday = history.filter((h) => h.approved_at && new Date(h.approved_at).toDateString() === today && h.status === "approved").length;
  const rejectedTotal = history.filter((h) => h.status === "rejected").length;
  const holdTotal = history.filter((h) => h.status === "hold").length;
  const overdueCount = pending.filter((p) => p.deadline && new Date(p.deadline) < new Date()).length;

  const columns = [
    { key: "applicant", header: "Applicant", render: (r) => r.request?.applicant?.full_name },
    { key: "applicantId", header: "ID", render: (r) => r.request?.applicant?.employee_id || "—" },
    { key: "clearanceType", header: "Type", render: (r) => r.request?.clearance_type },
    {
      key: "deadline",
      header: "SLA",
      render: (r) => {
        if (!r.deadline) return "—";
        const overdue = new Date(r.deadline) < new Date();
        return <StatusChip status={overdue ? "overdue" : "success"} label={new Date(r.deadline).toLocaleDateString()} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${user.department} Department`}
        description={`Welcome back, ${user.fullName.split(" ")[0]} — here's your queue today.`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Pending" value={loading ? "…" : pending.length} icon={Inbox} size="sm" />
        <StatCard label="Approved Today" value={loading ? "…" : approvedToday} icon={CheckCircle2} tone="success" size="sm" />
        <StatCard label="Rejected (all time)" value={loading ? "…" : rejectedTotal} icon={XCircle} tone="error" size="sm" />
        <StatCard label="On Hold" value={loading ? "…" : holdTotal} icon={PauseCircle} tone="warning" size="sm" />
        <StatCard label="Overdue" value={loading ? "…" : overdueCount} icon={AlertTriangle} tone="error" size="sm" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Pending Requests</p>
            <Link to="/approver/pending" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </div>
          <DataTable columns={columns} rows={pending.slice(0, 5)} emptyTitle={loading ? "Loading..." : "No pending requests"} />
        </div>

        <div className="space-y-6">
          <Card>
            <p className="mb-3 text-sm font-semibold text-text-primary">Approval Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Total Approved</span><span className="font-medium text-text-primary">{history.filter((h) => h.status === "approved").length}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Total Rejected</span><span className="font-medium text-text-primary">{rejectedTotal}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Total On Hold</span><span className="font-medium text-text-primary">{holdTotal}</span></div>
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-text-primary">Upcoming Deadlines</p>
            {pending.filter((p) => p.deadline).slice(0, 5).map((p) => {
              const overdue = new Date(p.deadline) < new Date();
              return (
                <div key={p.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                  <span className="text-text-primary">{new Date(p.deadline).toLocaleDateString()}</span>
                  <span className={`h-2 w-2 rounded-full ${overdue ? "bg-error" : "bg-warning"}`} />
                </div>
              );
            })}
            {pending.filter((p) => p.deadline).length === 0 && !loading && (
              <p className="text-sm text-text-secondary">No upcoming deadlines.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
