import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import { MailCheck, XCircle } from "lucide-react";

const LOGS = [
  { id: 1, to: "selamawit.bekele@wollo.edu.et", subject: "Clearance Request Submitted", type: "Confirmation", sentAt: "May 2, 09:14", status: "approved" },
  { id: 2, to: "tsegaye.alemu@wollo.edu.et", subject: "New Clearance Request Assigned", type: "Assignment", sentAt: "May 2, 09:15", status: "approved" },
  { id: 3, to: "robel.getahun@wollo.edu.et", subject: "Deadline Reminder (24h)", type: "Reminder", sentAt: "Aug 10, 08:00", status: "rejected" },
];

export default function EmailLogs() {
  const columns = [
    { key: "to", header: "Recipient" }, { key: "subject", header: "Subject" }, { key: "type", header: "Type" },
    { key: "sentAt", header: "Sent At" }, { key: "status", header: "Status", render: (r) => <StatusChip status={r.status} label={r.status === "approved" ? "Delivered" : "Failed"} /> },
    { key: "actions", header: "", render: (r) => r.status === "rejected" && <button className="text-xs font-medium text-primary hover:underline">Resend</button> },
  ];
  return (
    <div>
      <PageHeader title="Email Delivery Logs" />
      <div className="mb-5 grid grid-cols-2 gap-4 sm:w-96">
        <StatCard label="Delivery Rate" value="98.4%" icon={MailCheck} tone="success" size="sm" />
        <StatCard label="Failed This Week" value="3" icon={XCircle} tone="error" size="sm" />
      </div>
      <DataTable columns={columns} rows={LOGS} />
    </div>
  );
}
