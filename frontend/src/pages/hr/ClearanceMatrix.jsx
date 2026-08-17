import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Drawer from "../../components/common/Drawer";
import StatusChip from "../../components/common/StatusChip";
import { DEPARTMENTS } from "../../data/clearanceRequests";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

export default function ClearanceMatrix() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .allClearances()
      .then(({ requests }) => setRequests(requests))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(
    (r) =>
      (typeFilter === "All" || r.clearance_type === typeFilter) &&
      (r.applicant.full_name.toLowerCase().includes(query.toLowerCase()) || r.reference_no.includes(query))
  );

  const statusFor = (request, deptName) => {
    const a = (request.approvals || []).find((a) => a.department?.name === deptName);
    return a?.status || "not_started";
  };

  const dot = (status) =>
    status === "approved"
      ? "bg-success"
      : status === "rejected"
      ? "bg-error"
      : status === "pending" || status === "hold"
      ? "bg-warning"
      : "bg-border";

  if (loading) return <p className="text-sm text-text-secondary">Loading clearance matrix...</p>;

  return (
    <div>
      <PageHeader title="Full Clearance Matrix" description="Institution-wide view of every active clearance request." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by applicant or reference number..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
        >
          <option>All</option>
          <option>Student Graduation</option>
          <option>Employee Resignation</option>
          <option>Employee Transfer</option>
          <option>Employee Termination</option>
          <option>Student Withdrawal</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas/60">
              <th className="sticky left-0 z-10 bg-canvas/95 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Applicant
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">Ref.</th>
              {DEPARTMENTS.map((d) => (
                <th key={d} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.reference_no} onClick={() => setSelected(r)} className="cursor-pointer border-b border-border last:border-0 hover:bg-canvas/70">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-surface px-5 py-3 font-medium text-text-primary">
                  {r.applicant.full_name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{r.reference_no}</td>
                {DEPARTMENTS.map((d) => (
                  <td key={d} className="px-4 py-3 text-center">
                    <span className={`inline-block h-3 w-3 rounded-full ${dot(statusFor(r, d))}`} title={statusFor(r, d)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.applicant?.full_name}>
        {selected && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">{selected.reference_no} · {selected.clearance_type}</p>
            {DEPARTMENTS.map((d) => (
              <div key={d} className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                <span className="text-sm font-medium text-text-primary">{d}</span>
                <StatusChip status={statusFor(selected, d)} />
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
