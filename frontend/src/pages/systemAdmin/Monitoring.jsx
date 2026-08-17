import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { systemService } from "../../services/systemService";
import { useToast } from "../../context/ToastContext";

export default function Monitoring() {
  const { showToast } = useToast();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const load = () => systemService.health().then(setHealth).catch((err) => showToast(err.message, "error"));
    load();
    const interval = setInterval(load, 10000); // real-time refresh every 10s
    return () => clearInterval(interval);
  }, [showToast]);

  if (!health) {
    return (
      <div>
        <PageHeader title="System Monitoring" />
        <p className="text-sm text-text-secondary">Loading real server metrics...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="System Monitoring" description="Live metrics from this backend's host machine, refreshing every 10 seconds." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          ["CPU Load", health.cpu.usedPercent, `${health.cpu.cores} cores, 1m load avg: ${health.cpu.loadAverage1m.toFixed(2)}`],
          ["Memory Usage", health.memory.usedPercent, `${health.memory.totalMB - health.memory.freeMB}MB used / ${health.memory.totalMB}MB total`],
        ].map(([label, val, sub]) => (
          <Card key={label}>
            <div className="mb-3 flex justify-between text-sm"><span className="text-text-secondary">{label}</span><span className="font-semibold text-text-primary">{val}%</span></div>
            <div className="h-2 w-full rounded-full bg-canvas"><div className={`h-2 rounded-full ${val > 80 ? "bg-error" : val > 60 ? "bg-warning" : "bg-secondary"}`} style={{ width: `${val}%` }} /></div>
            <p className="mt-2 text-xs text-text-secondary">{sub}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <p className="mb-2 text-sm font-semibold text-text-primary">Server Info</p>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <div><span className="text-text-secondary">Platform:</span> <span className="text-text-primary">{health.platform}</span></div>
          <div><span className="text-text-secondary">Hostname:</span> <span className="text-text-primary">{health.hostname}</span></div>
          <div><span className="text-text-secondary">Uptime:</span> <span className="text-text-primary">{Math.floor(health.uptimeSeconds / 60)} min</span></div>
        </div>
      </Card>
    </div>
  );
}
