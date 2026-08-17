import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Button from "../../components/common/Button";
import { auditService } from "../../services/auditService";
import { useToast } from "../../context/ToastContext";

const ACTIONS = ["All", "APPLY", "APPROVE", "REJECT", "HOLD", "WITHDRAW", "RESUBMIT", "ESCALATE", "FORCE_APPROVE", "FORCE_REJECT", "REASSIGN", "GENERATE", "REVOKE", "VERIFY", "LOGIN", "LOGIN_FAILED"];

export default function AuditLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = actionFilter !== "All" ? { action: actionFilter } : {};
      const { logs } = await auditService.logs(params);
      setLogs(logs);
    } catch (err) {
      showToast(err.message || "Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: "timestamp", header: "Timestamp", render: (l) => new Date(l.timestamp).toLocaleString() },
    { key: "user", header: "User", render: (l) => l.user?.full_name || "System / Public" },
    { key: "action", header: "Action" },
    { key: "request_id", header: "Request", render: (l) => (l.request_id ? `#${l.request_id}` : "—") },
    { key: "ip", header: "IP Address", render: (l) => l.ip || "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        actions={
          <>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {ACTIONS.map((a) => <option key={a}>{a}</option>)}
            </select>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>
              Refresh
            </Button>
          </>
        }
      />
      <DataTable
        columns={columns}
        rows={logs}
        onRowClick={setExpanded}
        emptyTitle={loading ? "Loading audit logs..." : "No audit events match this filter"}
      />
      {expanded && (
        <div className="mt-4 rounded-card border border-border bg-primary-dark p-4 font-mono text-xs text-white/90">
          {JSON.stringify(expanded, null, 2)}
        </div>
      )}
    </div>
  );
}
