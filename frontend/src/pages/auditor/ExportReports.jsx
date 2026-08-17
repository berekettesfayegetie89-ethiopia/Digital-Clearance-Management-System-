import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useToast } from "../../context/ToastContext";
import { auditService } from "../../services/auditService";
import { exportToCsv } from "../../utils/exportCsv";

const REPORT_ACTIONS = {
  "Full Audit Trail": null,
  "Approval Logs Only": "APPROVE,REJECT,HOLD,FORCE_APPROVE,FORCE_REJECT",
  "Security Logs Only": "LOGIN,LOGIN_FAILED,RESET_PASSWORD",
};

export default function ExportReports() {
  const { showToast } = useToast();
  const [type, setType] = useState("Full Audit Trail");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [recentExports, setRecentExports] = useState([]);

  const doExport = async () => {
    setExporting(true);
    try {
      const params = {};
      const actions = REPORT_ACTIONS[type];
      if (actions) params.actions = actions;
      if (from) params.from = from;
      if (to) params.to = to;

      const { logs } = await auditService.logs(params);
      if (logs.length === 0) {
        showToast("No records match this filter — nothing to export.", "error");
        return;
      }

      exportToCsv(
        type.toLowerCase().replace(/\s+/g, "-"),
        logs.map((l) => ({
          timestamp: l.timestamp,
          user: l.user?.full_name || "System/Public",
          email: l.user?.email || "",
          action: l.action,
          request_id: l.request_id || "",
          ip: l.ip || "",
        }))
      );
      setRecentExports((r) => [{ type, at: new Date(), count: logs.length }, ...r].slice(0, 5));
      showToast(`${type} exported (${logs.length} records)`, "success");
    } catch (err) {
      showToast(err.message || "Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Export Reports" description="Exports a real CSV built from the actual audit log data below." />
      <Card className="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Report Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none">
              {Object.keys(REPORT_ACTIONS).map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
          </div>
          <p className="text-xs text-text-secondary">Exports as CSV (a real generated PDF report isn't built yet).</p>
          <Button full onClick={doExport} disabled={exporting}>{exporting ? "Exporting..." : "Export CSV"}</Button>
        </div>
      </Card>
      <Card className="mt-6 max-w-lg">
        <p className="mb-3 text-sm font-semibold text-text-primary">Recent Exports (this session)</p>
        {recentExports.length === 0 ? (
          <p className="text-sm text-text-secondary">No exports yet this session.</p>
        ) : (
          <div className="space-y-2 text-sm text-text-secondary">
            {recentExports.map((r, i) => (
              <p key={i}>{r.type} — {r.count} records — {r.at.toLocaleString()}</p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
