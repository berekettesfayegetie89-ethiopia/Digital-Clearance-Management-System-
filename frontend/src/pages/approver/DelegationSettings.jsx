import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatusChip from "../../components/common/StatusChip";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { approvalsService } from "../../services/approvalsService";

const today = new Date().toISOString().split("T")[0];

export default function DelegationSettings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [colleagues, setColleagues] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [delegate, setDelegate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ colleagues }, { delegations }] = await Promise.all([
        approvalsService.colleagues(),
        approvalsService.myDelegations(),
      ]);
      setColleagues(colleagues);
      setHistory(delegations);
    } catch (err) {
      showToast(err.message || "Failed to load delegation data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (start && end && end <= start) {
      setDateError("End date must be after the start date.");
    } else {
      setDateError("");
    }
  }, [start, end]);

  const activeDelegation = history.find((d) => d.status === "approved" && new Date(d.end_date) >= new Date());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dateError) return;
    setSubmitting(true);
    try {
      await approvalsService.requestDelegation({ delegate_id: Number(delegate), start_date: start, end_date: end, reason: reasonText });
      showToast("Delegation request sent to your Department Head for approval", "success");
      setDelegate(""); setStart(""); setEnd(""); setReasonText("");
      await load();
    } catch (err) {
      showToast(err.message || "Failed to submit delegation request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Delegation Settings" description="Assign a colleague to cover your approvals while you're away." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Current Delegation Status</p>
          {activeDelegation ? (
            <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm">
              <p className="font-medium text-text-primary">Covered by {activeDelegation.delegate?.full_name}</p>
              <p className="text-xs text-text-secondary">
                {activeDelegation.start_date} – {activeDelegation.end_date}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-canvas px-4 py-3 text-sm text-text-secondary">No active delegation</div>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Request Delegation</p>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <select
              required
              value={delegate}
              onChange={(e) => setDelegate(e.target.value)}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">
                {loading ? "Loading colleagues..." : colleagues.length === 0 ? `No other approvers in ${user.department}` : `Select a colleague from ${user.department}`}
              </option>
              {colleagues.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
              <input required type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
            </div>
            {dateError && <p className="text-xs text-error">{dateError}</p>}
            <textarea required rows={2} value={reasonText} onChange={(e) => setReasonText(e.target.value)} placeholder="Reason for delegation" className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
            <p className="text-xs text-text-secondary">Delegation requires approval from your Department Head before it becomes active.</p>
            <Button type="submit" full disabled={submitting || !!dateError || colleagues.length === 0}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="mt-6">
        <p className="mb-3 text-sm font-semibold text-text-primary">Delegation History</p>
        {history.length === 0 ? (
          <p className="text-sm text-text-secondary">No delegation requests yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-text-primary">{h.delegate?.full_name}</p>
                  <p className="text-xs text-text-secondary">{h.start_date} – {h.end_date}</p>
                </div>
                <StatusChip status={h.status === "approved" ? "approved" : h.status === "denied" ? "rejected" : "pending"} label={h.status === "approved" ? "Approved" : h.status === "denied" ? "Denied" : "Pending"} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
