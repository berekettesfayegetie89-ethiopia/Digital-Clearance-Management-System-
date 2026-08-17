import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import { Server, Activity, Database, Timer } from "lucide-react";
import { systemService } from "../../services/systemService";
import { useToast } from "../../context/ToastContext";

export default function SystemAdminHome() {
  const { showToast } = useToast();
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([systemService.health(), systemService.cronStatus()])
      .then(([health, { jobs }]) => { setHealth(health); setJobs(jobs); })
      .catch((err) => showToast(err.message || "Failed to load system status", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const columns = [
    { key: "name", header: "Job" },
    { key: "schedule", header: "Schedule", render: (r) => <code className="text-xs">{r.schedule}</code> },
    { key: "lastRun", header: "Last Run", render: (r) => (r.lastRun ? new Date(r.lastRun).toLocaleString() : "Never run yet") },
    { key: "status", header: "Status", render: (r) => <StatusChip status={r.lastStatus === "success" ? "approved" : r.lastStatus === "failed" ? "rejected" : "neutral"} label={r.lastStatus} /> },
  ];

  return (
    <div>
      <PageHeader title="System Administrator Dashboard" description="Real server metrics from this backend process." />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Server Status" value="Online" icon={Server} tone="success" size="sm" />
        <StatCard label="Platform" value={loading ? "…" : health?.platform} icon={Activity} size="sm" />
        <StatCard label="Memory Used" value={loading ? "…" : `${health?.memory.usedPercent}%`} icon={Database} tone={health?.memory.usedPercent > 80 ? "error" : "success"} size="sm" />
        <StatCard label="Uptime" value={loading ? "…" : formatUptime(health?.uptimeSeconds)} icon={Timer} size="sm" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {!loading && [
          ["CPU Load", health.cpu.usedPercent, `${health.cpu.cores} cores`],
          ["Memory Usage", health.memory.usedPercent, `${health.memory.totalMB - health.memory.freeMB}MB / ${health.memory.totalMB}MB`],
        ].map(([label, val, sub]) => (
          <Card key={label}>
            <div className="mb-2 flex justify-between text-sm"><span className="text-text-secondary">{label}</span><span className="font-semibold text-text-primary">{val}%</span></div>
            <div className="h-2 w-full rounded-full bg-canvas"><div className={`h-2 rounded-full ${val > 80 ? "bg-error" : val > 60 ? "bg-warning" : "bg-secondary"}`} style={{ width: `${val}%` }} /></div>
            <p className="mt-1 text-xs text-text-secondary">{sub}</p>
          </Card>
        ))}
      </div>
      <p className="mb-3 text-sm font-semibold text-text-primary">Cron Job Status (real, from this server)</p>
      <DataTable columns={columns} rows={jobs} emptyTitle={loading ? "Loading..." : "No jobs configured"} />
    </div>
  );
}

function formatUptime(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
