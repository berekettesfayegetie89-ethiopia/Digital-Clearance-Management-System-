import { Workflow, Department } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";

// GET /api/workflows — grouped by clearance_type for the Workflow Builder UI.
export const getWorkflows = asyncHandler(async (req, res) => {
  const rows = await Workflow.findAll({
    include: [{ model: Department }],
    order: [["clearance_type", "ASC"], ["sequence_order", "ASC"]],
  });

  const grouped = {};
  for (const row of rows) {
    grouped[row.clearance_type] = grouped[row.clearance_type] || [];
    grouped[row.clearance_type].push(row);
  }
  res.json({ workflows: grouped });
});

// POST /api/workflows — Super Admin create/update workflow steps for a
// clearance type. Body: { clearance_type, steps: [{ department_id, sequence_order, is_parallel, is_mandatory, sla_hours }] }
export const saveWorkflow = asyncHandler(async (req, res) => {
  const { clearance_type, steps } = req.body;
  if (!clearance_type || !Array.isArray(steps)) {
    return res.status(400).json({ error: "clearance_type and steps[] are required." });
  }

  await Workflow.destroy({ where: { clearance_type } });
  const created = await Workflow.bulkCreate(
    steps.map((s) => ({ ...s, clearance_type }))
  );

  await logAudit({ userId: req.user.id, action: "CREATE_USER", ip: req.clientIp, details: { workflowSavedFor: clearance_type } });
  res.status(201).json({ workflow: created });
});
