/**
 * Statistic summary card used at the top of every dashboard Home screen.
 * size controls the card's visual weight so dashboards don't read as a
 * monotonous grid of identical tiles (per the design system's "vary card
 * sizes" rule).
 */
export default function StatCard({ label, value, icon: Icon, tone = "default", size = "md", trend }) {
  const toneClasses = {
    default: "text-primary bg-primary/5",
    success: "text-success bg-success-bg",
    warning: "text-warning bg-warning-bg",
    error: "text-error bg-error-bg",
    accent: "text-accent-dark bg-accent/10",
  };

  const sizeClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-card transition hover:shadow-card-hover ${sizeClasses[size]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className={`mt-1 font-bold text-text-primary ${size === "lg" ? "text-3xl" : "text-2xl"}`}>
            {value}
          </p>
          {trend && <p className="mt-1 text-xs text-text-secondary">{trend}</p>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
