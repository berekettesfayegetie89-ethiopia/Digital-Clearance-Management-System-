import { useState } from "react";
import { ChevronDown, Send, LifeBuoy } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { useToast } from "../../context/ToastContext";
import { supportService } from "../../services/supportService";

const FAQS = [
  { q: "How long does clearance approval usually take?", a: "Each department has its own SLA (default 72 hours). You can track exactly how each department is doing from your dashboard's progress view." },
  { q: "What happens if a department rejects my request?", a: "You'll see the rejection reason on your My Requests page. Once you've resolved it, you can re-submit — departments that already approved won't need to review again." },
  { q: "How do I download my clearance certificate?", a: "Once every department has approved, a Download Certificate option appears in your sidebar with a PDF including a QR code for public verification." },
  { q: "Can someone else check if my certificate is real?", a: "Yes — anyone can visit the public verification page and enter your certificate number or scan the QR code, no login required." },
  { q: "I forgot my password — what do I do?", a: "Use the \"Forgot Password?\" link on the login page. You'll get a reset link valid for 15 minutes." },
];

export default function HelpSupport() {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ type: "question", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      showToast("Please fill in both fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      await supportService.submit(form);
      showToast("Your message has been submitted — we'll get back to you soon", "success");
      setForm({ type: "question", subject: "", message: "" });
    } catch (err) {
      showToast(err.message || "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Help & Support" description="Answers to common questions, or reach out directly." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Frequently Asked Questions</p>
          <div className="divide-y divide-border">
            {FAQS.map((f, idx) => (
              <div key={idx} className="py-2">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-text-primary"
                >
                  {f.q}
                  <ChevronDown size={16} className={`shrink-0 text-text-secondary transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && <p className="pb-2 text-sm text-text-secondary">{f.a}</p>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <LifeBuoy size={16} className="text-text-secondary" />
            <p className="text-sm font-semibold text-text-primary">Contact Support</p>
          </div>
          <form className="space-y-3" onSubmit={submit}>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="question">General Question</option>
              <option value="bug_report">Report an Issue</option>
              <option value="feedback">Feedback</option>
            </select>
            <input
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <textarea
              rows={5}
              placeholder="Describe your question or issue..."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <Button type="submit" full icon={Send} disabled={submitting}>
              {submitting ? "Sending..." : "Submit"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
