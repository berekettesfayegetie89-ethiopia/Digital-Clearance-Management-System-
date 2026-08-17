import { useEffect, useState } from "react";
import { UploadCloud, FileText, Eye, Trash2, CheckCircle2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import { clearanceService } from "../../services/clearanceService";
import { downloadAuthenticatedFile } from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";

const ACTIVE_STATUSES = ["pending", "in-progress"];

export default function UploadDocuments() {
  const { showToast } = useToast();
  const [request, setRequest] = useState(undefined);
  const [docs, setDocs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadDocs = (requestId) => {
    clearanceService.getDocuments(requestId).then(({ documents }) => setDocs(documents));
  };

  useEffect(() => {
    clearanceService.myRequests().then(({ requests }) => {
      const active = requests.find((r) => ACTIVE_STATUSES.includes(r.status));
      setRequest(active || null);
      if (active) loadDocs(active.id);
    });
  }, []);

  const addFiles = async (fileList) => {
    if (!request) return;
    const room = 5 - docs.length;
    if (room <= 0) {
      showToast("Maximum of 5 files reached", "error");
      return;
    }
    const files = Array.from(fileList).slice(0, room);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const { documents } = await clearanceService.uploadDocuments(request.id, fd);
      setDocs((d) => [...d, ...documents]);
      showToast(`${documents.length} file(s) uploaded`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  if (request === undefined) return <p className="text-sm text-text-secondary">Loading...</p>;

  if (!request) {
    return (
      <div>
        <PageHeader title="Upload Documents" description="You need an active clearance request to upload documents." />
        <EmptyState title="No active clearance request" description="Apply for clearance first, then come back here to attach supporting documents." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Upload Documents"
        description={
          <>
            Please upload the required documents for clearance request{" "}
            <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
              {request.reference_no}
            </span>
            .
          </>
        }
      />

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-14 text-center transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/40"
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 text-primary">
          <UploadCloud size={26} />
        </div>
        <p className="text-base font-semibold text-text-primary">
          {uploading ? "Uploading..." : "Drag and drop files here, or click to browse"}
        </p>
        <p className="mt-1 text-sm text-text-secondary">Supported formats: PDF, JPG, PNG, DOCX. Maximum file size: 5MB.</p>
        <span className="mt-4 inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary">
          Browse Files
        </span>
        <input type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} accept=".pdf,.jpg,.jpeg,.png,.docx" disabled={uploading} />
      </label>

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-base font-bold text-text-primary">Uploaded Documents</p>
          <span className="rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
            {docs.length} File{docs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {docs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-text-secondary">No documents uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas/60">
                  {["File Name", "Category", "Size", "Uploaded Date", "Actions"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileText size={17} className="text-error" />
                        <span className="font-medium text-text-primary">{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-text-secondary">
                        {doc.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">
                      {(doc.file_size / (1024 * 1024)).toFixed(1)} MB
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setPreview(doc)} className="text-text-secondary hover:text-primary" aria-label="Preview">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.file_name} size="lg">
        <div className="flex h-72 items-center justify-center rounded-lg bg-canvas text-sm text-text-secondary">
          {preview && (
            <button
              onClick={() => downloadAuthenticatedFile(`/documents/${preview.id}/download`).catch((e) => showToast(e.message, "error"))}
              className="font-medium text-primary hover:underline"
            >
              Open / download this file
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
