import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Inbox, AlertTriangle, GitBranch, Clock } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Button from "../../components/common/Button";
import { adminService } from "../../services/adminService";
import { delegationService } from "../../services/delegationService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function DepartmentHeadHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminService.pendingApprovals(), delegationService.listForDepartment()])
      .then(([{ approvals }, { delegations }]) => { setApprovals(approvals); setDelegations(delegations); })
      .catch((err) => showToast(err.message || "Failed to load dashboard data", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const overdueCount = approvals.filter((a) => a.hoursOverdue > 0).length;
  const escalatedCount = approvals.filter((a) => a.needsAttention).length;
  const pendingDelegations = delegations.filter((d) => d.status === "pending");

  const columns = [
    { key: "applicant", header: "Applicant" },
    { key: "actedBy", header: "Original Approver", render: (r) => r.actedBy || "Not yet actioned" },
    { key: "stage", header: "Escalation Stage", render: (r) => <StatusChip status={r.hoursOverdue >= 48 ? "overdue" : "warning"} label={r.hasApprover ? (r.escalationStage?.replace("_", " ") || "pending") : "No approver in dept."} /> },
    { key: "hoursOverdue", header: "Hours Overdue", render: (r) => (r.hoursOverdue > 0 ? `${r.hoursOverdue}h` : "—") },
  ];

  const decide = async (id, decision) => {
    setBusyId(id);
    try {
      await delegationService.decide(id, decision);
      showToast(`Delegation ${decision === "approve" ? "approved" : "denied"}`, "success");
      load();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title={user.department} description={`Welcome back, ${user.fullName.split(" ")[0]}.`} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pending (Dept)" value={loading ? "…" : approvals.length} icon={Inbox} size="sm" />
        <StatCard label="Overdue Requests" value={loading ? "…" : overdueCount} icon={AlertTriangle} tone="error" size="lg" />
        <StatCard label="Needing Attention" value={loading ? "…" : escalatedCount} icon={GitBranch} tone="warning" size="sm" />
        <StatCard label="Pending Delegations" value={loading ? "…" : pendingDelegations.length} icon={Clock} size="sm" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Escalated Requests</p>
            <Link to="/department-head/escalations" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          <DataTable columns={columns} rows={approvals.filter((a) => a.needsAttention)} emptyTitle={loading ? "Loading..." : "Nothing needs attention"} />
        </div>
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Pending Substitute Requests</p>
          {pendingDelegations.length === 0 ? (
            <p className="text-sm text-text-secondary">No pending delegation requests</p>
          ) : (
            pendingDelegations.map((d) => (
              <div key={d.id} className="rounded-lg border border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">{d.approver?.full_name} → {d.delegate?.full_name}</p>
                <p className="text-xs text-text-secondary">{d.start_date} – {d.end_date}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" full disabled={busyId === d.id} onClick={() => decide(d.id, "deny")}>Deny</Button>
                  <Button size="sm" full disabled={busyId === d.id} onClick={() => decide(d.id, "approve")}>Approve</Button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
