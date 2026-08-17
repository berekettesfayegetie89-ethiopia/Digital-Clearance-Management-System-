import { useState } from "react";
import { Outlet } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { useBranding } from "../context/BrandingContext";
import { useToast } from "../context/ToastContext";
import { supportService } from "../services/supportService";

/**
 * Shell for unauthenticated screens: Login, Forgot Password, Reset Password.
 * Centered card on the branded canvas background, per the Cross-Cutting
 * Screens spec (C.1 / C.2).
 */
export default function AuthLayout() {
  const { institution_name, logoUrl } = useBranding();
  const { showToast } = useToast();
  const [supportOpen, setSupportOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submitSupport = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast("Please fill in both fields", "error");
      return;
    }
    setSending(true);
    try {
      // Works without being logged in — the backend's support endpoint
      // accepts anonymous submissions (user_id is nullable).
      await supportService.submit({ type: "question", subject, message });
      showToast("Your message has been sent — we'll get back to you", "success");
      setSupportOpen(false);
      setSubject("");
      setMessage("");
    } catch (err) {
      showToast(err.message || "Failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logoUrl} alt={`${institution_name} logo`} className="h-16 w-16 rounded-md object-contain" />
          <p className="mt-3 text-lg font-bold text-primary">Digital Clearance Management System</p>
          <p className="text-sm text-text-secondary">{institution_name}</p>
        </div>
        <Outlet />
        <p className="mt-8 text-center text-xs text-text-secondary">
          © {new Date().getFullYear()} {institution_name}. Need help?{" "}
          <button onClick={() => setSupportOpen(true)} className="font-medium text-primary hover:underline">
            Contact Support
          </button>
        </p>
      </div>

      <Modal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Contact Support"
        footer={
          <>
            <Button variant="outline" onClick={() => setSupportOpen(false)}>Cancel</Button>
            <Button onClick={submitSupport} disabled={sending}>{sending ? "Sending..." : "Send"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <textarea
            rows={4}
            placeholder="How can we help?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </Modal>
    </div>
  );
}
