import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ScrollText, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import { auditService } from "../../services/auditService";
import { useToast } from "../../context/ToastContext";

const APPROVAL_ACTIONS = ["APPROVE", "REJECT", "HOLD", "FORCE_APPROVE", "FORCE_REJECT"];
const SECURITY_ACTIONS = ["LOGIN", "LOGIN_FAILED", "RESET_PASSWORD"];

export default function AuditorHome() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService
      .logs()
      .then(({ logs }) => setLogs(logs))
      .catch((err) => showToast(err.message || "Failed to load audit logs", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const columns = [
    { key: "timestamp", header: "Timestamp", render: (l) => new Date(l.timestamp).toLocaleString() },
    { key: "user", header: "User", render: (l) => l.user?.full_name || "System / Public" },
    { key: "action", header: "Action" },
    { key: "request_id", header: "Request", render: (l) => (l.request_id ? `#${l.request_id}` : "—") },
  ];

  const approvalCount = logs.filter((l) => APPROVAL_ACTIONS.includes(l.action)).length;
  const securityCount = logs.filter((l) => SECURITY_ACTIONS.includes(l.action)).length;

  return (
    <div>
      <PageHeader title="Auditor Dashboard" description="Read-only oversight of every system action." />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Audit Events" value={loading ? "…" : logs.length} icon={ScrollText} size="lg" />
        <StatCard label="Approval Logs" value={loading ? "…" : approvalCount} icon={CheckCircle2} size="sm" />
        <StatCard label="Security Logs" value={loading ? "…" : securityCount} icon={ShieldCheck} tone="warning" size="sm" />
        <StatCard label="Shown (last 500)" value={loading ? "…" : logs.length} icon={Activity} size="sm" />
      </div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Recent Audit Logs</p>
        <Link to="/auditor/logs" className="text-sm font-medium text-primary hover:underline">View All</Link>
      </div>
      <DataTable columns={columns} rows={logs.slice(0, 8)} emptyTitle={loading ? "Loading..." : "No audit events yet"} />
      <p className="mt-4 text-center text-xs text-text-secondary">Audit records retained for 7 years per compliance policy.</p>
    </div>
  );
}
