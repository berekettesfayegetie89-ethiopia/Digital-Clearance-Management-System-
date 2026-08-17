import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ListChecks, CheckCircle2, Inbox, AlertTriangle, Clock } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { adminService } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const DEPARTMENTS = ["Registrar", "Library", "Finance", "IT", "Store", "Academic Affairs"];

function statusFor(request, deptName) {
  const approval = request.approvals?.find((a) => a.department?.name === deptName);
  return approval?.status || "not_started";
}

export default function HRHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.allClearances(), adminService.pendingApprovals()])
      .then(([{ requests }, { approvals }]) => { setRequests(requests); setPendingApprovals(approvals); })
      .catch((err) => showToast(err.message || "Failed to load dashboard data", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const today = new Date().toDateString();
  const active = requests.filter((r) => r.status === "in-progress" || r.status === "pending").length;
  const completedToday = requests.filter((r) => r.completed_at && new Date(r.completed_at).toDateString() === today).length;
  const slaViolations = pendingApprovals.filter((a) => a.hoursOverdue > 0).length;

  const typeCounts = requests.reduce((acc, r) => {
    acc[r.clearance_type] = (acc[r.clearance_type] || 0) + 1;
    return acc;
  }, {});
  const totalForPercent = requests.length || 1;

  const escalated = pendingApprovals.filter((a) => a.needsAttention).slice(0, 5);

  return (
    <div>
      <PageHeader title="HR Coordinator Dashboard" description={`Welcome back, ${user.fullName.split(" ")[0]}.`} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Requests" value={loading ? "…" : active} icon={ListChecks} size="lg" />
        <StatCard label="Completed Today" value={loading ? "…" : completedToday} icon={CheckCircle2} tone="success" size="sm" />
        <StatCard label="Requests Needing Attention" value={loading ? "…" : slaViolations} icon={AlertTriangle} tone="error" size="sm" />
        <StatCard label="Total Requests" value={loading ? "…" : requests.length} icon={Clock} size="sm" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="text-sm font-semibold text-text-primary">Full Clearance Matrix (preview)</p>
            <Link to="/hr/matrix" className="text-sm font-medium text-primary hover:underline">View Full Matrix</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-text-secondary">
                  <th className="px-4 py-2.5">Applicant</th><th className="px-3 py-2.5">Reg.</th><th className="px-3 py-2.5">Lib.</th><th className="px-3 py-2.5">Fin.</th><th className="px-3 py-2.5">IT</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 6).map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-text-primary">{r.applicant?.full_name}</td>
                    {["Registrar", "Library", "Finance", "IT"].map((d) => {
                      const s = statusFor(r, d);
                      return (
                        <td key={d} className="px-3 py-2.5">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${s === "approved" ? "bg-success" : s === "rejected" ? "bg-error" : s === "pending" || s === "hold" ? "bg-warning" : "bg-border"}`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {requests.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-text-secondary">No requests yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <p className="mb-3 text-sm font-semibold text-text-primary">Requests Needing Attention</p>
            <div className="space-y-2">
              {escalated.length === 0 && !loading && <p className="text-sm text-text-secondary">Nothing needs attention right now.</p>}
              {escalated.map((e) => (
                <div key={e.id} className="text-sm"><p className="font-medium text-text-primary">{e.applicant}</p><p className="text-xs text-text-secondary">{e.department} — {e.hasApprover ? `${e.hoursOverdue}h overdue` : "no approver in dept."}</p></div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold text-text-primary">Requests by Type</p>
            <div className="space-y-1.5 text-sm">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between"><span>{type}</span><span className="font-medium">{Math.round((count / totalForPercent) * 100)}%</span></div>
              ))}
              {requests.length === 0 && !loading && <p className="text-text-secondary">No data yet.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
