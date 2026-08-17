import { useState, useEffect } from "react";
import { Search, Eye, Download } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import { documentsService } from "../../services/documentsService";
import { useToast } from "../../context/ToastContext";

export default function DepartmentDocuments() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentsService
      .forMyDepartment()
      .then(({ documents }) => setDocs(documents))
      .catch((err) => showToast(err.message || "Failed to load documents", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = docs.filter(
    (d) => d.file_name.toLowerCase().includes(query.toLowerCase()) || d.request?.reference_no?.includes(query)
  );

  const columns = [
    { key: "file_name", header: "File Name" },
    { key: "ref", header: "Request Reference", render: (d) => d.request?.reference_no || "—" },
    { key: "uploader", header: "Uploaded By", render: (d) => d.uploader?.full_name || "—" },
    { key: "category", header: "Category", render: (d) => d.category || "—" },
    { key: "uploaded_at", header: "Date", render: (d) => new Date(d.uploaded_at).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      render: (d) => (
        <div className="flex gap-3">
          <button onClick={() => documentsService.download(d.id).catch((e) => showToast(e.message, "error"))} className="text-text-secondary hover:text-primary" title="View / Download">
            <Eye size={16} />
          </button>
          <button onClick={() => documentsService.download(d.id).catch((e) => showToast(e.message, "error"))} className="text-text-secondary hover:text-primary" title="Download">
            <Download size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Department Documents"
        description="Documents attached to requests routed to your department."
        actions={
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents..." className="rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none" />
          </div>
        }
      />
      <DataTable columns={columns} rows={filtered} emptyTitle={loading ? "Loading..." : "No documents found"} />
    </div>
  );
}
