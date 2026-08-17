import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useToast } from "../../context/ToastContext";

export default function NotificationSettings() {
  const { showToast } = useToast();
  return (
    <div>
      <PageHeader title="Notification Settings" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">SMTP Connection</span>
            <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success">Connected</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => showToast("Connection test successful", "success")}>Test Connection</Button>
        </Card>
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Global Toggles</p>
          {["Email Notifications Enabled", "In-App Notifications Enabled"].map((l) => (
            <label key={l} className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">{l}<input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-primary" /></label>
          ))}
        </Card>
      </div>
      <Card className="mt-6 max-w-lg">
        <p className="mb-3 text-sm font-semibold text-text-primary">Escalation Timing</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between"><span className="text-text-secondary">Reminder before deadline</span><input type="number" defaultValue={24} className="w-20 rounded-lg border border-border px-3 py-1.5 text-sm" /></div>
          <div className="flex items-center justify-between"><span className="text-text-secondary">Escalation after deadline (hrs)</span><input type="number" defaultValue={48} className="w-20 rounded-lg border border-border px-3 py-1.5 text-sm" /></div>
        </div>
      </Card>
    </div>
  );
}
