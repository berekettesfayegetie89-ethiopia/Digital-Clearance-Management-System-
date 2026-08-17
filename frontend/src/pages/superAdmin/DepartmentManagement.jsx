import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Drawer from "../../components/common/Drawer";
import Button from "../../components/common/Button";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

export default function DepartmentManagement() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", head_user_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ departments }, { users }] = await Promise.all([
        adminService.departments(),
        adminService.users(),
      ]);
      setDepartments(departments);
      // Anyone can be assigned as a department head in principle, but
      // Department Head accounts are the natural default — surface those
      // first, then everyone else.
      setUsers(users.sort((a, b) => (a.role === "department_head" ? -1 : 1)));
    } catch (err) {
      showToast(err.message || "Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: "name", header: "Department" },
    { key: "code", header: "Code" },
    { key: "head", header: "Head", render: (d) => d.head?.full_name || <span className="text-text-secondary">Unassigned</span> },
  ];

  const handleCreate = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      showToast("Name and code are required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminService.createDepartment({
        name: form.name,
        code: form.code.toUpperCase(),
        head_user_id: form.head_user_id || null,
      });
      showToast(`Department "${form.name}" created`, "success");
      setAddOpen(false);
      setForm({ name: "", code: "", head_user_id: "" });
      await load();
    } catch (err) {
      showToast(err.message || "Failed to create department", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Department Management"
        actions={<Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add Department</Button>}
      />
      <DataTable columns={columns} rows={departments} onRowClick={setSelected} emptyTitle={loading ? "Loading..." : "No departments yet"} />

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-4 text-sm">
            <p className="text-text-secondary">
              Head: <span className="font-medium text-text-primary">{selected.head?.full_name || "Unassigned"}</span>
            </p>
            <p className="text-text-secondary">Code: <span className="font-medium text-text-primary">{selected.code}</span></p>
            <p className="text-xs text-text-secondary">
              To change staff or SLA settings for this department, use Workflow Builder (SLA hours per department per clearance type) and User & Role Management (staff assignment).
            </p>
          </div>
        )}
      </Drawer>

      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Department"
        footer={<Button full onClick={handleCreate} disabled={submitting}>{submitting ? "Creating..." : "Create Department"}</Button>}
      >
        <div className="space-y-4">
          <input
            placeholder="Department name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <input
            placeholder="Code (e.g. FIN)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <select
            value={form.head_user_id}
            onChange={(e) => setForm((f) => ({ ...f, head_user_id: e.target.value }))}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Assign department head... (optional)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} — {u.role === "department_head" ? "Department Head" : u.role}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary">
            The department you create here will immediately be selectable in User & Role Management's "Department" dropdown when adding a new user.
          </p>
        </div>
      </Drawer>
    </div>
  );
}
