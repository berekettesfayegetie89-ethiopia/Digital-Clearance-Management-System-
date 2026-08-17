import { X } from "lucide-react";

/**
 * Centered confirmation / form modal. Used for Logout confirm, Force
 * Approve/Reject with mandatory reason, Revoke certificate, etc.
 */
export default function Modal({ open, onClose, title, children, footer, size = "md" }) {
  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`w-full ${widths[size]} animate-[fadeIn_150ms_ease-out] rounded-card bg-surface shadow-modal`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-text-secondary transition hover:bg-canvas hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
