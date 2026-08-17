import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, UploadCloud, FileText, X } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { CLEARANCE_TYPES } from "../../data/clearanceRequests";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { clearanceService } from "../../services/clearanceService";

const STEPS = ["Clearance Type", "Details", "Documents", "Review & Submit"];

export default function ApplyClearance() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    clearanceType: "",
    reason: "",
    lastDate: "",
    files: [],
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const validateStep = () => {
    const e = {};
    if (step === 0 && !form.clearanceType) e.clearanceType = "Please select a clearance type.";
    if (step === 1) {
      if (form.reason.trim().length < 10) e.reason = "Reason must be at least 10 characters.";
      if (form.reason.trim().length > 1000) e.reason = "Reason must be under 1000 characters.";
      if (!form.lastDate) e.lastDate = "Please select a date.";
      else if (form.lastDate < today) e.lastDate = "Date cannot be in the past.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList).slice(0, 5 - form.files.length);
    setForm((f) => ({ ...f, files: [...f.files, ...incoming] }));
  };

  const removeFile = (idx) => {
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== idx) }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { request } = await clearanceService.apply({
        clearance_type: form.clearanceType,
        reason: form.reason,
        last_working_date: form.lastDate,
      });

      if (form.files.length > 0) {
        const fd = new FormData();
        form.files.forEach((f) => fd.append("files", f));
        await clearanceService.uploadDocuments(request.id, fd);
      }

      setRefNumber(request.reference_no);
      setSubmitted(true);
      showToast("Clearance request submitted successfully", "success");
    } catch (err) {
      setSubmitError(err.message || "Could not submit your request. Please try again.");
      showToast(err.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Apply for Clearance" description="Complete all steps to submit your clearance request." />

      {/* Step indicator */}
      <div className="mb-6 flex items-center">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  idx < step
                    ? "bg-success text-white"
                    : idx === step
                    ? "bg-primary text-white"
                    : "bg-border text-text-secondary"
                }`}
              >
                {idx < step ? <Check size={15} /> : idx + 1}
              </div>
              <p className="mt-1.5 max-w-[90px] text-center text-[11px] text-text-secondary">{label}</p>
            </div>
            {idx !== STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${idx < step ? "bg-success" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {/* Locked profile info */}
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-lg bg-canvas px-4 py-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-text-secondary">Name</p>
            <p className="font-medium text-text-primary">{user.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">ID</p>
            <p className="font-medium text-text-primary">{user.studentId}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Department</p>
            <p className="font-medium text-text-primary">{user.department}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Email</p>
            <p className="font-medium text-text-primary">{user.email}</p>
          </div>
        </div>

        {step === 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold text-text-primary">Select Clearance Type</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CLEARANCE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setForm((f) => ({ ...f, clearanceType: type }))}
                  className={`rounded-lg border px-4 py-4 text-left text-sm font-medium transition ${
                    form.clearanceType === type
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-text-primary hover:border-primary/40"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.clearanceType && <p className="mt-2 text-xs text-error">{errors.clearanceType}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Reason for Clearance <span className="text-text-secondary">(10–1000 characters)</span>
              </label>
              <textarea
                rows={4}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                maxLength={1000}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
                placeholder="Explain the reason for this clearance request..."
              />
              <div className="mt-1 flex items-center justify-between text-xs text-text-secondary">
                <span>{errors.reason && <span className="text-error">{errors.reason}</span>}</span>
                <span>{form.reason.length}/1000</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Last Working / Study Date</label>
              <input
                type="date"
                min={today}
                value={form.lastDate}
                onChange={(e) => setForm((f) => ({ ...f, lastDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none sm:w-64"
              />
              {errors.lastDate && <p className="mt-1 text-xs text-error">{errors.lastDate}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Supporting Documents</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-border px-6 py-10 text-center transition hover:border-primary/50">
              <UploadCloud size={30} className="mb-3 text-primary" />
              <p className="text-sm font-semibold text-text-primary">Drag and drop files here, or click to browse</p>
              <p className="mt-1 text-xs text-text-secondary">Supported formats: PDF, JPG, PNG, DOCX. Maximum file size: 5MB.</p>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
              />
            </label>

            {form.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {form.files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-primary" />
                      <span className="text-sm text-text-primary">{file.name}</span>
                      <span className="text-xs text-text-secondary">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                    <button onClick={() => removeFile(idx)} className="text-text-secondary hover:text-error">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-text-secondary">{form.files.length}/5 files uploaded</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-text-primary">Review Your Request</p>
            <div className="space-y-3 rounded-lg border border-border p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Clearance Type</span>
                <span className="font-medium text-text-primary">{form.clearanceType || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Last Working / Study Date</span>
                <span className="font-medium text-text-primary">{form.lastDate || "—"}</span>
              </div>
              <div>
                <span className="text-text-secondary">Reason</span>
                <p className="mt-1 font-medium text-text-primary">{form.reason || "—"}</p>
              </div>
              <div>
                <span className="text-text-secondary">Documents</span>
                <p className="mt-1 font-medium text-text-primary">
                  {form.files.length > 0 ? form.files.map((f) => f.name).join(", ") : "None attached"}
                </p>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mt-4 rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error">{submitError}</div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <Button variant="outline" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button variant="accent" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </div>
      </Card>

      <Modal
        open={submitted}
        onClose={() => navigate("/applicant")}
        title="Clearance Request Submitted"
        footer={
          <Button full onClick={() => navigate("/applicant")}>
            Go to My Dashboard
          </Button>
        }
      >
        <p className="text-sm text-text-secondary">
          Your request has been submitted and all mandatory departments have been notified. Track its
          progress from your dashboard.
        </p>
        <div className="mt-4 rounded-lg bg-canvas px-4 py-3 text-center">
          <p className="text-xs text-text-secondary">Reference Number</p>
          <p className="mt-1 text-lg font-bold text-primary">{refNumber}</p>
        </div>
      </Modal>
    </div>
  );
}
