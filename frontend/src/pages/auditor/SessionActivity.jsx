import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import { LogIn, XCircle, Users } from "lucide-react";
import { auditService } from "../../services/auditService";
import { useToast } from "../../context/ToastContext";

export default function SessionActivity() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService
      .logs({ actions: "LOGIN,LOGIN_FAILED" })
      .then(({ logs }) => setLogs(logs))
      .catch((err) => showToast(err.message || "Failed to load login activity", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const today = new Date().toDateString();
  const loginsToday = logs.filter((l) => l.action === "LOGIN" && new Date(l.timestamp).toDateString() === today).length;
  const failedToday = logs.filter((l) => l.action === "LOGIN_FAILED" && new Date(l.timestamp).toDateString() === today).length;
  const uniqueUsersToday = new Set(logs.filter((l) => l.action === "LOGIN" && new Date(l.timestamp).toDateString() === today).map((l) => l.user?.email)).size;

  const columns = [
    { key: "user", header: "User", render: (l) => l.user?.full_name || "Unknown" },
    { key: "email", header: "Email", render: (l) => l.user?.email || "—" },
    { key: "timestamp", header: "Time", render: (l) => new Date(l.timestamp).toLocaleString() },
    { key: "ip", header: "IP Address", render: (l) => l.ip || "—" },
    { key: "device", header: "Device", render: (l) => l.details?.userAgent || "Unknown" },
    { key: "status", header: "Status", render: (l) => <StatusChip status={l.action === "LOGIN" ? "approved" : "rejected"} label={l.action === "LOGIN" ? "Success" : "Failed"} /> },
  ];

  return (
    <div>
      <PageHeader title="Login / Session Activity" description="Real login attempts — actual IP addresses and browsers as seen by the server." />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Logins Today" value={loading ? "…" : loginsToday} icon={LogIn} size="sm" />
        <StatCard label="Failed Attempts Today" value={loading ? "…" : failedToday} icon={XCircle} tone="error" size="sm" />
        <StatCard label="Unique Users Today" value={loading ? "…" : uniqueUsersToday} icon={Users} tone="success" size="sm" />
      </div>
      <DataTable columns={columns} rows={logs} emptyTitle={loading ? "Loading..." : "No login activity yet"} />
    </div>
  );
}
