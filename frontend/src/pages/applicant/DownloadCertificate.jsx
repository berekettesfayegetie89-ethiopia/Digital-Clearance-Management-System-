import { useEffect, useState } from "react";
import { Award, Download, Link2, Lock } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { clearanceService } from "../../services/clearanceService";
import { downloadAuthenticatedFile } from "../../services/apiClient";

export default function DownloadCertificate() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [request, setRequest] = useState(undefined);

  useEffect(() => {
    clearanceService.myRequests().then(({ requests }) => {
      const cleared = requests.find((r) => r.status === "cleared");
      setRequest(cleared || null);
    });
  }, []);

  if (request === undefined) return <p className="text-sm text-text-secondary">Loading...</p>;

  if (!request) {
    return (
      <div>
        <PageHeader title="Download Certificate" description="Your certificate becomes available once every department has cleared your request." />
        <EmptyState
          icon={Lock}
          title="Your certificate isn't ready yet"
          description="It will appear here automatically once all departments have approved your active clearance request."
          action={
            <Button variant="outline" onClick={() => (window.location.href = "/applicant/requests")}>
              View My Requests
            </Button>
          }
        />
      </div>
    );
  }

  const departments = (request.approvals || []).map((a) => ({
    name: a.department?.name,
    approver: a.approver?.full_name,
  }));

  return (
    <div>
      <PageHeader title="Download Certificate" description="Your digital clearance certificate is ready." />

      <Card className="overflow-hidden p-0">
        <div className="relative border-b border-border bg-primary px-8 py-10 text-white">
          <div className="absolute right-6 top-6 rotate-12 rounded border border-white/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
            Digitally Verified
          </div>
          <p className="text-xs uppercase tracking-wide text-white/70">Wollo University</p>
          <h2 className="mt-1 text-xl font-bold">Digital Clearance Certificate</h2>
          <p className="mt-1 text-sm text-white/80">Reference: {request.reference_no}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-8 sm:grid-cols-2">
          <div>
            <p className="text-xs text-text-secondary">Applicant Name</p>
            <p className="font-semibold text-text-primary">{user.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">ID</p>
            <p className="font-semibold text-text-primary">{user.studentId}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Clearance Type</p>
            <p className="font-semibold text-text-primary">{request.clearance_type}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Effective Date</p>
            <p className="font-semibold text-text-primary">{request.last_working_date}</p>
          </div>
        </div>

        <div className="border-t border-border px-8 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Department Approvals
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {departments.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm text-text-primary">
                <Award size={14} className="text-success" /> {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-border bg-canvas px-8 py-6 sm:flex-row sm:justify-between">
          <p className="max-w-[280px] text-xs text-text-secondary">
            This PDF includes a QR code and SHA-256 hash for tamper-proof public verification, valid for 5
            years from issue.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={Link2}
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/verify`);
                showToast("Verification page link copied", "success");
              }}
            >
              Copy Link
            </Button>
            <Button
              icon={Download}
              onClick={() =>
                downloadAuthenticatedFile(`/certificate/${request.id}`).catch((e) => showToast(e.message, "error"))
              }
            >
              Download PDF
            </Button>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-text-secondary">
        This certificate remains publicly verifiable for 5 years from its issue date.
      </p>
    </div>
  );
}
