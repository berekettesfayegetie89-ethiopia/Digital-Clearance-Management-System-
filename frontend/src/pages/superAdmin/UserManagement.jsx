import { useState, useEffect, useCallback } from "react";
import { UserPlus, RefreshCw } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import StatusChip from "../../components/common/StatusChip";
import Drawer from "../../components/common/Drawer";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { ROLE_LABELS } from "../../data/navigation";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

const EMPTY_FORM = { full_name: "", email: "", role: "applicant", department: "", employee_id: "", phone: "" };
// Departments that participate in the clearance approval workflow come from
// the real Department Management table (adminService.departments()) below.
// These three are legitimate departments for staff accounts that sit
// outside the clearance workflow itself (HR, Audit, IT Admin run the
// system — they don't approve clearance requests) and so aren't managed as
// "departments" in the Department Management screen.
const NON_WORKFLOW_DEPARTMENTS = ["Human Resources", "Internal Audit", "IT Administration"];

export default function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null); // { email, tempPassword }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await adminService.users();
      setUsers(users);
    } catch (err) {
      showToast(err.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
    adminService.departments().then(({ departments }) => setDepartments(departments)).catch(() => {});
  }, [load]);

  const filtered = users.filter((u) => roleFilter === "All" || u.role === roleFilter);

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      showToast("Full name and email are required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { user, tempPassword } = await adminService.createUser(form);
      showToast(`User created: ${user.email}`, "success");
      setCreatedCredentials({ email: user.email, tempPassword });
      setAddOpen(false);
      setForm(EMPTY_FORM);
      await load(); // refresh the table so the new user actually appears
    } catch (err) {
      showToast(err.message || "Failed to create user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const [resetModal, setResetModal] = useState(null); // user being reset
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resetting, setResetting] = useState(false);

  const submitResetPassword = async (useExplicit) => {
    setResetting(true);
    try {
      const { tempPassword } = await adminService.resetUserPassword(resetModal.id, useExplicit ? newPasswordInput : undefined);
      showToast(
        useExplicit
          ? `Password set. ${resetModal.full_name} can now log in with the password you entered.`
          : `Temporary password generated: ${tempPassword} (also emailed / logged to backend console)`,
        "success"
      );
      setResetModal(null);
      setNewPasswordInput("");
    } catch (err) {
      showToast(err.message || "Reset failed", "error");
    } finally {
      setResetting(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const { user: updated } = await adminService.toggleUserActive(user.id);
      showToast(`${user.full_name} ${updated.is_active ? "reactivated" : "deactivated"}`, "success");
      await load();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    }
  };

  const columns = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (r) => <StatusChip status="info" label={ROLE_LABELS[r.role] || r.role} /> },
    { key: "department", header: "Department", render: (r) => r.department || "—" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusChip status={r.is_active ? "approved" : "rejected"} label={r.is_active ? "Active" : "Deactivated"} />,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-3 text-xs font-medium">
          <button onClick={(e) => { e.stopPropagation(); setResetModal(r); }} className="text-primary hover:underline">
            Reset Password
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleActive(r); }}
            className={r.is_active ? "text-error hover:underline" : "text-success hover:underline"}
          >
            {r.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User & Role Management"
        actions={
          <>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>
              Refresh
            </Button>
            <Button size="sm" icon={UserPlus} onClick={() => setAddOpen(true)}>
              Add User
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="All">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        emptyTitle={loading ? "Loading users..." : "No users found"}
      />

      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add User"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create User"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Full Name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
              placeholder="e.g. Chaltu Bekele"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
              placeholder="name@wollo.edu.et"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Department (if applicable)</label>
            <select
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
              {NON_WORKFLOW_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Employee/Student ID (optional)</label>
            <input
              value={form.employee_id}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
              placeholder="e.g. WU/UGR/1234/16"
            />
          </div>
          <p className="text-xs text-text-secondary">
            A temporary password will be generated automatically. Since no SMTP is configured, it will be shown here after creation and also logged to the backend console.
          </p>
        </div>
      </Drawer>

      <Modal
        open={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        title="User created"
        footer={<Button full onClick={() => setCreatedCredentials(null)}>Done</Button>}
      >
        <p className="mb-3 text-sm text-text-secondary">
          Share these temporary credentials with <span className="font-medium text-text-primary">{createdCredentials?.email}</span>.
          They'll be forced to set a new password on first login.
        </p>
        <div className="rounded-lg bg-canvas px-4 py-3 text-center">
          <p className="text-xs text-text-secondary">Temporary Password</p>
          <p className="mt-1 font-mono text-lg font-bold text-primary">{createdCredentials?.tempPassword}</p>
        </div>
      </Modal>

      <Modal
        open={!!resetModal}
        onClose={() => { setResetModal(null); setNewPasswordInput(""); }}
        title={`Reset password for ${resetModal?.full_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => submitResetPassword(false)} disabled={resetting}>
              {resetting ? "..." : "Auto-Generate Instead"}
            </Button>
            <Button onClick={() => submitResetPassword(true)} disabled={resetting || newPasswordInput.length < 8}>
              {resetting ? "Saving..." : "Set This Password"}
            </Button>
          </>
        }
      >
        <label className="mb-1.5 block text-sm font-medium text-text-primary">New Password</label>
        <input
          type="text"
          value={newPasswordInput}
          onChange={(e) => setNewPasswordInput(e.target.value)}
          placeholder="Type the new password (min 8 characters)..."
          className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm font-mono focus:border-primary focus:outline-none"
        />
        <p className="mt-2 text-xs text-text-secondary">
          Either type an explicit password above and click "Set This Password", or click "Auto-Generate Instead" for a random temporary one. Either way, the user must change it on their next login, and can then log in with whichever one was actually set — verified end-to-end.
        </p>
      </Modal>
    </div>
  );
}
