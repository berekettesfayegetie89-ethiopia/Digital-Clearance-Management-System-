import { useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { MY_ACTIVE_REQUEST } from "../../data/clearanceRequests";

export default function TimelineViewer() {
  const [ref, setRef] = useState("CLR-2026-00318");
  const events = [
    { label: "Request Submitted", by: "Selamawit Bekele", time: "May 2, 09:14" },
    { label: "Registrar Approved", by: "Kidist Wolde", time: "May 3, 10:02" },
    { label: "Library Approved", by: "Getachew Mola", time: "May 4, 14:20" },
    { label: "Finance Approved", by: "Tsegaye Alemu", time: "May 5, 11:45" },
    { label: "IT Approved", by: "Robel Assefa", time: "May 6, 09:30" },
    { label: "Store — Pending", by: "System", time: "Awaiting review" },
  ];

  return (
    <div>
      <PageHeader title="Timeline Viewer" />
      <div className="relative mb-6 max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input value={ref} onChange={(e) => setRef(e.target.value)} className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none" placeholder="Enter Clearance Reference Number" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="space-y-5">
            {events.map((e, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  {idx !== events.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-5">
                  <p className="text-sm font-semibold text-text-primary">{e.label}</p>
                  <p className="text-xs text-text-secondary">{e.by} · {e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-2 text-xs text-text-secondary">Request Summary</p>
          <p className="font-semibold text-text-primary">{MY_ACTIVE_REQUEST.applicant}</p>
          <p className="text-sm text-text-secondary">{MY_ACTIVE_REQUEST.clearanceType}</p>
          <p className="mt-2 text-xs text-text-secondary">Status: In Progress</p>
        </Card>
      </div>
    </div>
  );
}
