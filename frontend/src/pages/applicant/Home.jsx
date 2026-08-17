import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Clock, FileEdit, Lock } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";
import StatusChip from "../../components/common/StatusChip";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { clearanceService } from "../../services/clearanceService";
import { notificationService } from "../../services/notificationService";

const ACTIVE_STATUSES = ["pending", "in-progress"];

function completionPercent(approvals) {
  if (!approvals?.length) return 0;
  const done = approvals.filter((a) => a.status === "approved").length;
  return Math.round((done / approvals.length) * 100);
}

export default function ApplicantHome() {
  const { user } = useAuth();
  const [request, setRequest] = useState(undefined); // undefined = loading, null = none active
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([clearanceService.myRequests(), notificationService.list()])
      .then(([{ requests }, { notifications }]) => {
        const active = requests.find((r) => ACTIVE_STATUSES.includes(r.status)) || null;
        setRequest(active);
        setNotifications(notifications);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <EmptyState title="Couldn't load your dashboard" description={error} />;
  }
  if (request === undefined) {
    return <p className="text-sm text-text-secondary">Loading your dashboard...</p>;
  }

  if (!request) {
    return (
      <div>
        <PageHeader title={`Welcome back, ${user.fullName.split(" ")[0]}`} description="You don't have an active clearance request yet." />
        <EmptyState
          icon={FileEdit}
          title="No active clearance request"
          description="Apply for clearance to start the multi-department approval process."
          action={
            <Link to="/applicant/apply">
              <Button>Apply for Clearance</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const approvals = request.approvals || [];
  const percent = completionPercent(approvals);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.fullName.split(" ")[0]}`}
        description="Here's where your clearance stands right now."
      />

      <Card className="mb-6 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Your Clearance Progress
            </p>
            <p className="mt-1 text-lg font-bold text-text-primary">{request.clearance_type}</p>
            <p className="text-sm text-text-secondary">Reference: {request.reference_no}</p>
          </div>
          <Link to="/applicant/requests">
            <Button variant="outline">View Full Details</Button>
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-1">
          {approvals.map((a, idx) => (
            <div key={a.id} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {idx !== 0 && (
                  <div className={`h-0.5 flex-1 ${approvals[idx - 1].status === "approved" ? "bg-success" : "bg-border"}`} />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    a.status === "approved"
                      ? "bg-success text-white"
                      : a.status === "pending"
                      ? "bg-warning text-white"
                      : a.status === "rejected"
                      ? "bg-error text-white"
                      : "bg-border text-text-secondary"
                  }`}
                >
                  {a.status === "approved" ? "✓" : idx + 1}
                </div>
                {idx !== approvals.length - 1 && (
                  <div className={`h-0.5 flex-1 ${a.status === "approved" ? "bg-success" : "bg-border"}`} />
                )}
              </div>
              <p className="mt-2 max-w-[70px] text-center text-[11px] leading-tight text-text-secondary">
                {a.department?.name}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Completion" value={`${percent}%`} icon={Clock} tone="accent" />
        <StatCard label="Status" value={request.status === "in-progress" ? "In Progress" : request.status} icon={Clock} />
        <StatCard label="Reference Number" value={request.reference_no} icon={FileEdit} tone="default" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <p className="mb-4 text-sm font-semibold text-text-primary">Department-wise Status</p>
          <div className="space-y-3">
            {approvals.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.department?.name}</p>
                  <p className="text-xs text-text-secondary">
                    {a.approver ? `Approver: ${a.approver.full_name}` : "Not yet assigned"}
                  </p>
                </div>
                <StatusChip status={a.status === "not_started" ? "not_started" : a.status} />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Award size={18} className="text-text-secondary" />
              <p className="text-sm font-semibold text-text-primary">Certificate</p>
            </div>
            {request.status === "cleared" ? (
              <Link to="/applicant/certificate">
                <Button full variant="accent">
                  Download Certificate
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-canvas px-3.5 py-3 text-sm text-text-secondary">
                <Lock size={15} />
                Unlocks once all departments approve
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold text-text-primary">Recent Notifications</p>
            {notifications.length === 0 ? (
              <p className="text-sm text-text-secondary">No notifications yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="text-sm">
                    <p className="font-medium text-text-primary">{n.subject}</p>
                    <p className="text-xs text-text-secondary">{new Date(n.sent_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            <Link to="/applicant/notifications" className="mt-3 block text-xs font-medium text-primary hover:underline">
              View all notifications
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
