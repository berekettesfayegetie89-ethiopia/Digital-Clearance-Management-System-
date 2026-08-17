import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";

const HISTORY = [
  { id: 1, date: "Aug 10, 2026 02:00", size: "412 MB", status: "success" },
  { id: 2, date: "Aug 9, 2026 02:00", size: "409 MB", status: "success" },
  { id: 3, date: "Aug 8, 2026 02:00", size: "405 MB", status: "success" },
];

export default function Backup() {
  const { showToast } = useToast();
  const [restore, setRestore] = useState(null);
  return (
    <div>
      <PageHeader title="Backup & Recovery" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-xs text-text-secondary">Last Backup</p>
          <p className="text-lg font-bold text-text-primary">Aug 10, 2026 · 02:00 AM (412 MB)</p>
          <Button className="mt-4" onClick={() => showToast("Backup started", "info")}>Create Backup Now</Button>
        </Card>
        <Card>
          <p className="mb-2 text-sm font-semibold text-text-primary">Backup Schedule</p>
          <code className="rounded bg-canvas px-2 py-1 text-xs">0 2 * * *</code>
          <p className="mt-2 text-xs text-text-secondary">Runs daily at 2:00 AM</p>
        </Card>
      </div>
      <p className="mb-3 mt-6 text-sm font-semibold text-text-primary">Backup History</p>
      <DataTable columns={[{ key: "date", header: "Date" }, { key: "size", header: "Size" }, { key: "status", header: "Status" }, { key: "actions", header: "", render: (r) => <button onClick={() => setRestore(r)} className="text-xs font-medium text-error hover:underline">Restore</button> }]} rows={HISTORY} />

      <Modal open={!!restore} onClose={() => setRestore(null)} title="Restore this backup?" footer={<><Button variant="outline" onClick={() => setRestore(null)}>Cancel</Button><Button variant="danger" onClick={() => { showToast("Restore initiated", "info"); setRestore(null); }}>Restore & Overwrite</Button></>}>
        <p className="rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error">Restoring will overwrite all current data with the {restore?.date} backup. This cannot be undone.</p>
      </Modal>
    </div>
  );
}
