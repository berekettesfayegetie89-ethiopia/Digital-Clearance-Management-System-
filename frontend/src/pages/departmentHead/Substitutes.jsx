import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatusChip from "../../components/common/StatusChip";
import { useToast } from "../../context/ToastContext";
import { delegationService } from "../../services/delegationService";

export default function Substitutes() {
  const { showToast } = useToast();
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { delegations } = await delegationService.listForDepartment();
      setDelegations(delegations);
    } catch (err) {
      showToast(err.message || "Failed to load delegations", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, decision) => {
    setBusyId(id);
    try {
      await delegationService.decide(id, decision);
      showToast(`Delegation ${decision === "approve" ? "approved" : "denied"}`, "success");
      await load(); // re-fetch so the status actually updates instead of staying "pending"
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const pending = delegations.filter((d) => d.status === "pending");
  const decided = delegations.filter((d) => d.status !== "pending");

  return (
    <div>
      <PageHeader title="Assign / Approve Substitute" description="Manage delegation coverage across your department." />

      <Card>
        <p className="mb-3 text-sm font-semibold text-text-primary">Pending Delegation Requests</p>
        {loading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : pending.length === 0 ? (
          <div className="rounded-lg bg-canvas px-4 py-6 text-center text-sm text-text-secondary">
            No pending delegation requests
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((d) => (
              <div key={d.id} className="rounded-lg border border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">
                  {d.approver?.full_name} → {d.delegate?.full_name}
                </p>
                <p className="text-xs text-text-secondary">
                  {d.start_date} – {d.end_date}{d.reason ? ` · "${d.reason}"` : ""}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" full disabled={busyId === d.id} onClick={() => decide(d.id, "deny")}>
                    Deny
                  </Button>
                  <Button size="sm" full disabled={busyId === d.id} onClick={() => decide(d.id, "approve")}>
                    {busyId === d.id ? "Saving..." : "Approve"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <p className="mb-3 text-sm font-semibold text-text-primary">Decided Delegations</p>
        {decided.length === 0 ? (
          <p className="text-sm text-text-secondary">No decided delegations yet.</p>
        ) : (
          <div className="space-y-2">
            {decided.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-text-primary">{d.approver?.full_name} → {d.delegate?.full_name}</p>
                  <p className="text-xs text-text-secondary">{d.start_date} – {d.end_date}</p>
                </div>
                <StatusChip status={d.status === "approved" ? "approved" : "rejected"} label={d.status === "approved" ? "Approved" : "Denied"} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
