import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Button from "../../components/common/Button";
import { XCircle, Users, Lock, ShieldAlert } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const EVENTS = [
  { id: 1, time: "Aug 10, 03:41", ip: "197.156.4.88", type: "Failed Login", severity: "warning" },
  { id: 2, time: "Aug 9, 22:10", ip: "10.20.9.90", type: "Multiple Failed Attempts", severity: "overdue" },
];
const SESSIONS = [
  { id: 1, user: "Selamawit Bekele", device: "Chrome / Windows", ip: "10.20.9.44", time: "08:12" },
  { id: 2, user: "Hanna Girma", device: "Edge / Windows", ip: "10.20.2.02", time: "07:55" },
];
const LOCKED = [{ id: 1, user: "robel.getahun@wollo.edu.et", reason: "5 failed login attempts", time: "Aug 9, 22:11" }];

export default function Security() {
  const { showToast } = useToast();
  return (
    <div>
      <PageHeader title="Security" />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Failed Logins (24h)" value="6" icon={XCircle} tone="error" size="sm" />
        <StatCard label="Active Sessions" value="41" icon={Users} tone="success" size="sm" />
        <StatCard label="Locked Accounts" value="1" icon={Lock} tone="warning" size="sm" />
        <StatCard label="Suspicious Alerts" value="2" icon={ShieldAlert} tone="error" size="sm" />
      </div>

      <p className="mb-3 text-sm font-semibold text-text-primary">Security Events</p>
      <DataTable columns={[{ key: "time", header: "Timestamp" }, { key: "ip", header: "IP" }, { key: "type", header: "Event" }, { key: "severity", header: "Severity", render: (r) => <StatusChip status={r.severity} label={r.severity === "overdue" ? "High" : "Medium"} /> }]} rows={EVENTS} />

      <p className="mb-3 mt-6 text-sm font-semibold text-text-primary">Active Sessions</p>
      <DataTable columns={[{ key: "user", header: "User" }, { key: "device", header: "Device" }, { key: "ip", header: "IP" }, { key: "time", header: "Login Time" }, { key: "actions", header: "", render: (r) => <button onClick={() => showToast(`${r.user} force-logged-out`, "success")} className="text-xs font-medium text-error hover:underline">Force Logout</button> }]} rows={SESSIONS} />

      <p className="mb-3 mt-6 text-sm font-semibold text-text-primary">Locked Accounts</p>
      <DataTable columns={[{ key: "user", header: "User" }, { key: "reason", header: "Reason" }, { key: "time", header: "Locked At" }, { key: "actions", header: "", render: (r) => <button onClick={() => showToast(`${r.user} unlocked`, "success")} className="text-xs font-medium text-primary hover:underline">Unlock Account</button> }]} rows={LOCKED} />
    </div>
  );
}
