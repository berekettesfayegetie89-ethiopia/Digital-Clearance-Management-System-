import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

export default function SendReminder() {
  const { showToast } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("This is a reminder that your assigned clearance review is pending. Please action it as soon as possible.");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    adminService
      .pendingApprovals()
      .then(({ approvals }) => setPending(approvals))
      .catch((err) => showToast(err.message || "Failed to load pending requests", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const send = async () => {
    setSending(true);
    try {
      await Promise.all(selected.map((id) => adminService.escalate(id)));
      showToast(`Reminder sent for ${selected.length} request(s)`, "success");
      setSelected([]);
    } catch (err) {
      showToast(err.message || "Failed to send some reminders", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Send Reminder" description="Real pending tasks in your department." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Select Requests</p>
            <button onClick={() => setSelected(pending.map((o) => o.id))} className="text-xs font-medium text-primary hover:underline">Select All</button>
          </div>
          {loading ? (
            <p className="text-sm text-text-secondary">Loading...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-text-secondary">No pending requests in your department right now.</p>
          ) : (
            <div className="space-y-2">
              {pending.map((o) => (
                <label key={o.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm">
                  <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} className="h-4 w-4 rounded border-border text-primary" />
                  {o.applicant} — <span className="text-text-secondary">{o.reference_no}</span>
                </label>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Message Preview</p>
          <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <Button full className="mt-3" onClick={send} disabled={selected.length === 0 || sending}>
            {sending ? "Sending..." : `Send Reminder${selected.length > 0 ? ` (${selected.length})` : ""}`}
          </Button>
        </Card>
      </div>
    </div>
  );
}
