import { X } from "lucide-react";

/**
 * Right-side slide-in drawer — used for row detail views (approval detail,
 * request detail) so the underlying list stays visible/scrollable behind it.
 */
export default function Drawer({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div
        onClick={onClose}
        className="absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-modal animate-[slideIn_200ms_ease-out]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-1 text-text-secondary transition hover:bg-canvas hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
