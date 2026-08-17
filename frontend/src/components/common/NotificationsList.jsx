import { useState, useEffect, useCallback } from "react";
import { CheckCheck, Award, Bell, Clock, ThumbsDown, UserPlus, AlertTriangle } from "lucide-react";
import EmptyState from "./EmptyState";
import { notificationService } from "../../services/notificationService";
import { useToast } from "../../context/ToastContext";

const ICONS = {
  approval: CheckCheck,
  reminder: Clock,
  certificate: Award,
  rejection: ThumbsDown,
  assignment: UserPlus,
  escalation: AlertTriangle,
  general: Bell,
};

const TABS_DEFAULT = ["All", "Unread"];

/**
 * Shared notifications list, reused across every role. Fetches the signed-in
 * user's REAL notifications from the backend (previously each role's page
 * passed a hardcoded fake array).
 */
export default function NotificationsList({ tabs = TABS_DEFAULT }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState(tabs[0]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    notificationService
      .list()
      .then(({ notifications }) => setList(notifications))
      .catch((err) => showToast(err.message || "Failed to load notifications", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = list.filter((n) => {
    if (tab === "All") return true;
    if (tab === "Unread") return !n.read_at;
    return n.category === tab.toLowerCase();
  });

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setList((l) => l.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch (err) {
      showToast(err.message || "Failed to mark as read", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-3.5 py-2 text-sm font-medium transition ${
                tab === t ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={markAllRead} className="text-sm font-medium text-primary hover:underline">
          Mark all as read
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="No notifications to show here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = ICONS[n.category] || Bell;
            const unread = !n.read_at;
            return (
              <div
                key={n.id}
                className={`flex gap-3 rounded-card border border-border px-4 py-3.5 transition hover:shadow-card-hover ${
                  unread ? "border-l-4 border-l-accent bg-accent/5" : "bg-surface"
                }`}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{n.subject}</p>
                  <p className="text-sm text-text-secondary">{n.message}</p>
                  <p className="mt-1 text-xs text-text-secondary">{new Date(n.sent_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
