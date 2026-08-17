import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Card from "../../components/common/Card";
import { approvalsService } from "../../services/approvalsService";
import { useToast } from "../../context/ToastContext";

export default function TeamPerformance() {
  const { showToast } = useToast();
  const [team, setTeam] = useState([]);
  const [deptPending, setDeptPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    approvalsService
      .departmentPerformance()
      .then(({ team, departmentPendingTotal }) => { setTeam(team); setDeptPending(departmentPendingTotal); })
      .catch((err) => showToast(err.message || "Failed to load team performance", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const columns = [
    { key: "name", header: "Approver" },
    { key: "totalActioned", header: "Total Actioned (all time)" },
    { key: "approvedThisMonth", header: "Approved This Month" },
    { key: "avgResponseHours", header: "Avg Response Time", render: (r) => (r.totalActioned > 0 ? `${r.avgResponseHours}h` : "No actions yet") },
    { key: "sla", header: "SLA Compliance", render: (r) => <StatusChip status={r.slaCompliant ? "success" : "warning"} label={r.slaCompliant ? "On Track" : "At Risk"} /> },
  ];

  return (
    <div>
      <PageHeader title="Team Performance" description="Real performance data — tasks are pooled per department, so 'pending' reflects the whole department's queue rather than one person." />
      <Card className="mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Department-wide pending queue</span>
          <span className="font-semibold text-text-primary">{loading ? "…" : deptPending} tasks</span>
        </div>
      </Card>
      <DataTable columns={columns} rows={team} emptyTitle={loading ? "Loading..." : "No approvers in this department yet"} />
    </div>
  );
}
