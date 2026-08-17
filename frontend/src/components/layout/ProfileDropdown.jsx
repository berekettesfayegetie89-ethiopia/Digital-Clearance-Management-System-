import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, UserCog, LifeBuoy, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ROLE_LABELS } from "../../data/navigation";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useBranding } from "../../context/BrandingContext";

export default function ProfileDropdown({ profilePath }) {
  const { t } = useBranding();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const confirmLogout = () => {
    setConfirmOpen(false);
    logout();
    navigate("/login");
    showToast("You have been signed out successfully", "success");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-canvas"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          {user.avatarInitials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-text-primary">{user.fullName}</p>
          <p className="text-xs leading-tight text-text-secondary">{ROLE_LABELS[user.role]}</p>
        </div>
        <ChevronDown size={16} className="hidden text-text-secondary sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-card border border-border bg-surface py-2 shadow-modal animate-[fadeIn_150ms_ease-out]">
          <button
            onClick={() => {
              setOpen(false);
              navigate(profilePath);
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-primary hover:bg-canvas"
          >
            <UserCog size={17} /> {t("Profile & Password")}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/help-support");
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-primary hover:bg-canvas"
          >
            <LifeBuoy size={17} /> {t("Help & Support")}
          </button>
          <div className="my-1.5 border-t border-border" />
          <button
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-error hover:bg-error-bg"
          >
            <LogOut size={17} /> {t("Log Out")}
          </button>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Log out of Digital Clearance?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmLogout}>
              Log Out
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          You'll need to sign in again to access your dashboard.
        </p>
      </Modal>
    </div>
  );
}
