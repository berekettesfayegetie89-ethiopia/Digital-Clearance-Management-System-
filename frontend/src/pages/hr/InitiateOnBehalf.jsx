import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { CLEARANCE_TYPES } from "../../data/clearanceRequests";
import { useToast } from "../../context/ToastContext";
import { adminService } from "../../services/adminService";
import { clearanceService } from "../../services/clearanceService";

export default function InitiateOnBehalf() {
  const { showToast } = useToast();
  const [applicant, setApplicant] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      adminService
        .users("applicant")
        .then(({ users }) => {
          const q = search.toLowerCase();
          setResults(users.filter((u) => u.full_name.toLowerCase().includes(q) || u.employee_id?.toLowerCase().includes(q)));
        })
        .catch((err) => showToast(err.message || "Search failed", "error"))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [search, showToast]);

  const submit = async () => {
    if (!type || !reason.trim() || !lastDate) {
      showToast("Please complete all fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      await clearanceService.apply({
        clearance_type: type,
        reason,
        last_working_date: lastDate,
        on_behalf_of_user_id: applicant.id,
      });
      showToast(`Clearance initiated for ${applicant.full_name}`, "success");
      setApplicant(null); setType(""); setReason(""); setLastDate(""); setSearch("");
    } catch (err) {
      showToast(err.message || "Failed to initiate clearance", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Initiate on Behalf" description="Submit a clearance request for an applicant who can't do it themselves." />

      <Card className="p-6">
        {!applicant ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Search Applicant</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            {searching && <p className="mt-2 text-xs text-text-secondary">Searching...</p>}
            {results.length > 0 && (
              <div className="mt-2 divide-y divide-border rounded-lg border border-border">
                {results.map((r) => (
                  <button key={r.id} onClick={() => setApplicant(r)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-canvas">
                    <span className="font-medium text-text-primary">{r.full_name}</span>
                    <span className="text-text-secondary">{r.employee_id || r.email}</span>
                  </button>
                ))}
              </div>
            )}
            {search.length >= 2 && !searching && results.length === 0 && (
              <p className="mt-2 text-xs text-text-secondary">No applicants found matching "{search}".</p>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary">
              Initiating on behalf of {applicant.full_name}
            </div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Clearance Type</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CLEARANCE_TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)} className={`rounded-lg border px-4 py-3.5 text-left text-sm font-medium ${type === t ? "border-primary bg-primary/5 text-primary" : "border-border text-text-primary hover:border-primary/40"}`}>{t}</button>
              ))}
            </div>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for clearance" className="mt-4 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" />
            <input type="date" value={lastDate} onChange={(e) => setLastDate(e.target.value)} className="mt-3 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none sm:w-64" />
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setApplicant(null)}>Change Applicant</Button>
              <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Request"}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
