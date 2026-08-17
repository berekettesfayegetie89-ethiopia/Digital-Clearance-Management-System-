import { useState, useEffect, useCallback } from "react";
import { GripVertical, Play, Save } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { CLEARANCE_TYPES } from "../../data/clearanceRequests";
import { workflowService } from "../../services/workflowService";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";

export default function WorkflowBuilder() {
  const { showToast } = useToast();
  const [activeType, setActiveType] = useState(CLEARANCE_TYPES[3]); // Student Graduation
  const [allDepartments, setAllDepartments] = useState([]);
  const [steps, setSteps] = useState([]); // [{ department_id, department_name, sequence_order, is_parallel, is_mandatory, sla_hours }]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ departments }, { workflows }] = await Promise.all([
        adminService.departments(),
        workflowService.get(),
      ]);
      setAllDepartments(departments);
      buildStepsForType(activeType, departments, workflows);
    } catch (err) {
      showToast(err.message || "Failed to load workflow", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildStepsForType(type, departments, workflows) {
    const existing = workflows[type] || [];
    if (existing.length > 0) {
      setSteps(
        existing
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map((w) => ({
            department_id: w.department_id,
            department_name: w.department?.name || departments.find((d) => d.id === w.department_id)?.name,
            sequence_order: w.sequence_order,
            is_parallel: w.is_parallel,
            is_mandatory: w.is_mandatory,
            sla_hours: w.sla_hours,
          }))
      );
    } else {
      // No workflow configured yet for this type — default to every
      // department, in parallel, 72h SLA (matches what the seed script uses).
      setSteps(
        departments.map((d, idx) => ({
          department_id: d.id,
          department_name: d.name,
          sequence_order: idx + 1,
          is_parallel: true,
          is_mandatory: true,
          sla_hours: 72,
        }))
      );
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  const switchType = async (type) => {
    setActiveType(type);
    try {
      const { workflows } = await workflowService.get();
      buildStepsForType(type, allDepartments, workflows);
    } catch (err) {
      showToast(err.message || "Failed to load workflow for this type", "error");
    }
  };

  const toggleParallel = (deptId) => {
    setSteps((s) => s.map((step) => (step.department_id === deptId ? { ...step, is_parallel: !step.is_parallel } : step)));
  };

  const toggleMandatory = (deptId) => {
    setSteps((s) => s.map((step) => (step.department_id === deptId ? { ...step, is_mandatory: !step.is_mandatory } : step)));
  };

  const updateSla = (deptId, value) => {
    setSteps((s) => s.map((step) => (step.department_id === deptId ? { ...step, sla_hours: Number(value) } : step)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await workflowService.save(activeType, steps.map(({ department_id, sequence_order, is_parallel, is_mandatory, sla_hours }) => ({
        department_id, sequence_order, is_parallel, is_mandatory, sla_hours,
      })));
      showToast(`Workflow for ${activeType} saved and published`, "success");
    } catch (err) {
      showToast(err.message || "Failed to save workflow", "error");
    } finally {
      setSaving(false);
    }
  };

  const parallelSteps = steps.filter((s) => s.is_parallel);
  const sequentialSteps = steps.filter((s) => !s.is_parallel).sort((a, b) => a.sequence_order - b.sequence_order);
  const isHybrid = parallelSteps.length > 0 && sequentialSteps.length > 0;

  return (
    <div>
      <PageHeader title="Workflow Builder" description="Toggle each department between parallel and sequential per clearance type — mixing both makes a hybrid workflow." />

      <div className="mb-5 flex flex-wrap gap-2">
        {CLEARANCE_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => switchType(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeType === t ? "border-primary bg-primary text-white" : "border-border text-text-primary hover:border-primary/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-text-primary">Workflow for: {activeType}</p>
          <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
            {isHybrid ? "Hybrid" : sequentialSteps.length > 0 ? "Sequential" : "Parallel"}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : (
          <div className="space-y-3">
            {parallelSteps.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Parallel (all review at once)</p>
                <div className="flex flex-wrap gap-3 rounded-lg bg-canvas p-4">
                  {parallelSteps.map((step) => (
                    <DeptChip key={step.department_id} step={step} onToggleParallel={toggleParallel} onToggleMandatory={toggleMandatory} onSlaChange={updateSla} />
                  ))}
                </div>
              </div>
            )}
            {sequentialSteps.length > 0 && (
              <div>
                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">Sequential (one after another)</p>
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-canvas p-4">
                  {sequentialSteps.map((step, idx) => (
                    <div key={step.department_id} className="flex items-center gap-2">
                      <DeptChip step={step} onToggleParallel={toggleParallel} onToggleMandatory={toggleMandatory} onSlaChange={updateSla} />
                      {idx < sequentialSteps.length - 1 && <span className="text-text-secondary">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
          <Button variant="outline" icon={Play} onClick={() => setPreview((p) => !p)}>
            {preview ? "Hide Preview" : "Preview Workflow"}
          </Button>
          <Button icon={Save} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save & Publish"}
          </Button>
        </div>
      </Card>

      {preview && (
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Simulated Flow</p>
          <p className="text-sm text-text-secondary">
            An applicant submitting a <span className="font-medium text-text-primary">{activeType}</span> request will have{" "}
            <span className="font-medium text-text-primary">{parallelSteps.length}</span> department(s) review simultaneously
            {sequentialSteps.length > 0 && (
              <>, then <span className="font-medium text-text-primary">{sequentialSteps.length}</span> department(s) review one after another, in this order: {sequentialSteps.map((s) => s.department_name).join(" → ")}</>
            )}
            .
          </p>
        </Card>
      )}
    </div>
  );
}

function DeptChip({ step, onToggleParallel, onToggleMandatory, onSlaChange }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-card">
      <GripVertical size={14} className="text-text-secondary" />
      <span className="text-sm font-medium text-text-primary">{step.department_name}</span>
      <button
        onClick={() => onToggleMandatory(step.department_id)}
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${step.is_mandatory ? "bg-primary/8 text-primary" : "bg-canvas text-text-secondary"}`}
      >
        {step.is_mandatory ? "Mandatory" : "Optional"}
      </button>
      <input
        type="number"
        value={step.sla_hours}
        onChange={(e) => onSlaChange(step.department_id, e.target.value)}
        className="w-14 rounded border border-border px-1.5 py-0.5 text-xs"
        title="SLA hours"
      />
      <span className="text-[10px] text-text-secondary">hrs</span>
      <button
        onClick={() => onToggleParallel(step.department_id)}
        className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold text-text-secondary hover:bg-border"
      >
        Move to {step.is_parallel ? "Sequential" : "Parallel"}
      </button>
    </div>
  );
}
