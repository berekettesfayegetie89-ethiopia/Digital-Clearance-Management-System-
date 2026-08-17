const STYLES = {
  approved: "bg-success-bg text-success dark:bg-success/15",
  cleared: "bg-success-bg text-success dark:bg-success/15",
  success: "bg-success-bg text-success dark:bg-success/15",
  pending: "bg-warning-bg text-warning dark:bg-warning/15",
  hold: "bg-warning-bg text-warning dark:bg-warning/15",
  warning: "bg-warning-bg text-warning dark:bg-warning/15",
  rejected: "bg-error-bg text-error dark:bg-error/15",
  overdue: "bg-error-bg text-error dark:bg-error/15",
  error: "bg-error-bg text-error dark:bg-error/15",
  not_started: "bg-gray-100 text-text-secondary dark:bg-white/10",
  neutral: "bg-gray-100 text-text-secondary dark:bg-white/10",
  info: "bg-info-bg text-info dark:bg-info/15",
  revoked: "bg-error-bg text-error dark:bg-error/15",
};

const LABELS = {
  approved: "Approved",
  cleared: "Cleared",
  pending: "Pending",
  hold: "On Hold",
  rejected: "Rejected",
  overdue: "Overdue",
  not_started: "Not Started",
  revoked: "Revoked",
};

/**
 * Small color-coded status pill used across tables, matrices, and progress views.
 * status: one of the keys in STYLES. label: optional override text.
 */
export default function StatusChip({ status = "neutral", label }) {
  const classes = STYLES[status] || STYLES.neutral;
  const text = label || LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}
