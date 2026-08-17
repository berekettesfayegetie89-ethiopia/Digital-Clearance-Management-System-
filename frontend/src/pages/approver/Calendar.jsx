import { useState, useEffect, useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import { approvalsService } from "../../services/approvalsService";
import { useToast } from "../../context/ToastContext";

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function ApproverCalendar() {
  const { showToast } = useToast();
  const [pending, setPending] = useState([]);
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    approvalsService
      .pending()
      .then(({ pending }) => setPending(pending))
      .catch((err) => showToast(err.message || "Failed to load deadlines", "error"));
  }, [showToast]);

  const deadlinesByDay = useMemo(() => {
    const map = {};
    const now = new Date();
    pending.forEach((p) => {
      if (!p.deadline) return;
      const d = new Date(p.deadline);
      if (d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()) {
        const day = d.getDate();
        const status = d < now ? "overdue" : d - now < 24 * 3600 * 1000 ? "warning" : "success";
        map[day] = map[day] ? (map[day] === "overdue" ? "overdue" : status) : status;
      }
    });
    return map;
  }, [pending, cursor]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const total = daysInMonth(cursor.getFullYear(), cursor.getMonth());
  const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const days = Array.from({ length: total }, (_, i) => i + 1);
  const colors = { overdue: "bg-error", warning: "bg-warning", success: "bg-success" };

  return (
    <div>
      <PageHeader title="Calendar" description="Real SLA deadlines pulled from your pending queue." />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="text-sm text-text-secondary hover:text-primary">← Prev</button>
          <p className="text-sm font-semibold text-text-primary">{monthLabel}</p>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="text-sm text-text-secondary hover:text-primary">Next →</button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-secondary">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="pb-1 font-semibold">{d}</div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map((day) => {
            const dot = deadlinesByDay[day];
            return (
              <div key={day} className="flex h-16 flex-col items-center justify-start rounded-lg border border-border py-1.5">
                <span className="text-text-primary">{day}</span>
                {dot && <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${colors[dot]}`} />}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> On track</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Due within 24h</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-error" /> Overdue</span>
        </div>
      </Card>
    </div>
  );
}
