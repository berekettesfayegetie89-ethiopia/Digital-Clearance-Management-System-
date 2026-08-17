import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { adminService } from "../../services/adminService";
import { exportToCsv } from "../../utils/exportCsv";
import { useToast } from "../../context/ToastContext";

const REPORTS = ["Department Performance", "Clearance Volume", "Bottleneck Identification"];

export default function HRReports() {
  const { showToast } = useToast();
  const [active, setActive] = useState(REPORTS[0]);
  const [approvalTimes, setApprovalTimes] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.approvalTimesReport(), adminService.allClearances()])
      .then(([{ report }, { requests }]) => {
        setApprovalTimes(report);
        setAllRequests(requests);
      })
      .catch((err) => showToast(err.message || "Failed to load report data", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const volumeByType = allRequests.reduce((acc, r) => {
    acc[r.clearance_type] = (acc[r.clearance_type] || 0) + 1;
    return acc;
  }, {});

  const handleExport = () => {
    try {
      if (active === "Department Performance") {
        exportToCsv("department-performance", approvalTimes);
      } else if (active === "Clearance Volume") {
        exportToCsv("clearance-volume", Object.entries(volumeByType).map(([clearance_type, count]) => ({ clearance_type, count })));
      } else {
        const bottlenecks = approvalTimes.slice().sort((a, b) => b.avgApprovalHours - a.avgApprovalHours);
        exportToCsv("bottleneck-identification", bottlenecks);
      }
      showToast("Report exported", "success");
    } catch (err) {
      showToast(err.message || "Nothing to export yet", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Reports & Export" />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {REPORTS.map((r) => (
          <button key={r} onClick={() => setActive(r)} className={`rounded-card border px-4 py-3 text-left text-sm font-medium transition ${active === r ? "border-primary bg-primary/5 text-primary" : "border-border text-text-primary hover:border-primary/40"}`}>{r}</button>
        ))}
      </div>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">{active}</p>
          <Button size="sm" variant="outline" onClick={handleExport}>Export CSV</Button>
        </div>

        {loading ? (
          <p className="text-sm text-text-secondary">Loading real data...</p>
        ) : active === "Department Performance" ? (
          <div className="space-y-2.5">
            {approvalTimes.map((r) => (
              <div key={r.department}>
                <div className="mb-1 flex justify-between text-xs text-text-secondary">
                  <span>{r.department}</span>
                  <span>{r.avgApprovalHours}h avg · {r.approvedCount} approved</span>
                </div>
                <div className="h-2 w-full rounded-full bg-canvas">
                  <div className="h-2 rounded-full bg-secondary" style={{ width: `${Math.min(100, (r.avgApprovalHours / 72) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : active === "Clearance Volume" ? (
          <div className="space-y-2 text-sm">
            {Object.entries(volumeByType).map(([type, count]) => (
              <div key={type} className="flex justify-between border-b border-border pb-2">
                <span className="text-text-primary">{type}</span>
                <span className="font-medium text-text-primary">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {approvalTimes.slice().sort((a, b) => b.avgApprovalHours - a.avgApprovalHours).slice(0, 5).map((r) => (
              <div key={r.department} className="flex justify-between border-b border-border pb-2">
                <span className="text-text-primary">{r.department}</span>
                <span className="font-medium text-error">{r.avgApprovalHours}h avg</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
