import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-canvas p-3 text-text-secondary">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
