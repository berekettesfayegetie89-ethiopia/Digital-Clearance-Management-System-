import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import { approvalsService } from "../../services/approvalsService";
import { useToast } from "../../context/ToastContext";

export default function ApprovalHistory() {
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    approvalsService
      .history()
      .then(({ history }) => setHistory(history))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "applicant", header: "Applicant", render: (r) => r.request?.applicant?.full_name },
    { key: "clearanceType", header: "Clearance Type", render: (r) => r.request?.clearance_type },
    { key: "action", header: "Action Taken", render: (r) => <StatusChip status={r.status} /> },
    { key: "date", header: "Date", render: (r) => (r.approved_at ? new Date(r.approved_at).toLocaleDateString() : "—") },
    { key: "remarks", header: "Remarks", render: (r) => r.remarks || "—" },
    { key: "actedBy", header: "Acted By", render: (r) => r.approver?.full_name || "—" },
  ];

  if (loading) return <p className="text-sm text-text-secondary">Loading history...</p>;

  return (
    <div>
      <PageHeader title="Approval History" description="A record of every action you've taken on clearance requests." />
      <DataTable columns={columns} rows={history} />
    </div>
  );
}
