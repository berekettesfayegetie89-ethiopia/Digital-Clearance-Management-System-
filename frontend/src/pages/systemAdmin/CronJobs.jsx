import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import { useToast } from "../../context/ToastContext";
import { systemService } from "../../services/systemService";

const JOB_KEYS = { "Daily SLA Reminders": "runSlaReminders", "Session Token Cleanup": "cleanupExpiredTokens" };

export default function CronJobs() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    systemService
      .cronStatus()
      .then(({ jobs }) => setJobs(jobs))
      .catch((err) => showToast(err.message || "Failed to load cron status", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const runNow = async (name) => {
    const key = JOB_KEYS[name];
    setRunning(name);
    try {
      await systemService.runCronJob(key);
      showToast(`${name} executed`, "success");
      load();
    } catch (err) {
      showToast(err.message || "Job failed", "error");
    } finally {
      setRunning(null);
    }
  };

  const columns = [
    { key: "name", header: "Job Name" },
    { key: "schedule", header: "Schedule", render: (r) => <code className="text-xs">{r.schedule}</code> },
    { key: "lastRun", header: "Last Run", render: (r) => (r.lastRun ? new Date(r.lastRun).toLocaleString() : "Never run yet") },
    { key: "status", header: "Status", render: (r) => <StatusChip status={r.lastStatus === "success" ? "approved" : r.lastStatus === "failed" ? "rejected" : "neutral"} label={r.lastStatus} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button onClick={() => runNow(r.name)} disabled={running === r.name} className="text-xs font-medium text-primary hover:underline disabled:opacity-50">
          {running === r.name ? "Running..." : "Run Now"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Cron Job Monitor" description="Real job status from this backend process — resets on server restart." />
      <DataTable columns={columns} rows={jobs} emptyTitle={loading ? "Loading..." : "No jobs configured"} />
    </div>
  );
}
