import { useState, useEffect } from "react";
import { Users2, Building2, ListChecks, CheckCircle2, Clock, XCircle, Award, HeartPulse } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import { adminService } from "../../services/adminService";
import { certificateService } from "../../services/certificateService";
import { useToast } from "../../context/ToastContext";

const DEPARTMENTS = ["Registrar", "Library", "Finance", "IT", "Store", "Academic Affairs"];

export default function SuperAdminHome() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [approvalTimes, setApprovalTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.users(),
      adminService.departments(),
      adminService.allClearances(),
      certificateService.list(),
      adminService.approvalTimesReport(),
    ])
      .then(([{ users }, { departments }, { requests }, { certificates }, { report }]) => {
        setUsers(users); setDepartments(departments); setRequests(requests); setCertificates(certificates); setApprovalTimes(report);
      })
      .catch((err) => showToast(err.message || "Failed to load dashboard data", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const active = requests.filter((r) => r.status === "in-progress" || r.status === "pending").length;
  const completed = requests.filter((r) => r.status === "cleared").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  // Monthly volume over the last 6 months, computed from real submitted_at dates.
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString(undefined, { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
  const monthlyCounts = months.map(({ year, month }) =>
    requests.filter((r) => {
      const d = new Date(r.submitted_at);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length
  );
  const maxMonthly = Math.max(1, ...monthlyCounts);

  return (
    <div>
      <PageHeader title="Super Admin Dashboard" description="System-wide overview, computed from real data." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Users" value={loading ? "…" : users.length} icon={Users2} size="md" />
        <StatCard label="Departments" value={loading ? "…" : departments.length} icon={Building2} size="sm" />
        <StatCard label="Active Clearances" value={loading ? "…" : active} icon={ListChecks} size="md" />
        <StatCard label="Completed" value={loading ? "…" : completed} icon={CheckCircle2} tone="success" size="sm" />
        <StatCard label="Rejected" value={loading ? "…" : rejected} icon={XCircle} tone="error" size="sm" />
        <StatCard label="Certificates Generated" value={loading ? "…" : certificates.length} icon={Award} size="sm" />
        <StatCard label="Total Requests (all time)" value={loading ? "…" : requests.length} icon={Clock} tone="warning" size="sm" />
        <StatCard label="System Health" value="Operational" icon={HeartPulse} tone="success" size="sm" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Clearance Volume (last 6 months)</p>
          <div className="flex h-40 items-end gap-2">
            {monthlyCounts.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-primary/70" style={{ height: `${(count / maxMonthly) * 120}px`, minHeight: count > 0 ? "4px" : "0px" }} />
                <span className="text-[10px] text-text-secondary">{months[i].label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Department Performance (avg approval time)</p>
          <div className="space-y-2.5">
            {approvalTimes.length === 0 && !loading && <p className="text-sm text-text-secondary">No approvals recorded yet.</p>}
            {approvalTimes.map((r) => {
              const pct = Math.max(4, 100 - Math.min(100, (r.avgApprovalHours / 72) * 100));
              return (
                <div key={r.department}>
                  <div className="mb-1 flex justify-between text-xs text-text-secondary">
                    <span>{r.department}</span>
                    <span>{r.avgApprovalHours}h avg · {r.approvedCount} approved</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-canvas"><div className="h-2 rounded-full bg-secondary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-4 text-sm font-semibold text-text-primary">Departments</p>
        <div className="flex flex-wrap items-center gap-2">
          {departments.map((d, i, arr) => (
            <div key={d.id} className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-text-primary">
                {d.name} {d.head ? `· ${d.head.full_name}` : "· No head assigned"}
              </span>
              {i < arr.length - 1 && <span className="text-text-secondary">→</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
