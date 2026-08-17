import { Op } from "sequelize";
import { AuditLog, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/audit — filterable full log (Auditor / Super Admin). Real IP
// addresses (as seen by the server) and real timestamps — never simulated.
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, actions, from, to } = req.query;
  const where = {};
  if (action) where.action = action;
  if (actions) where.action = { [Op.in]: actions.split(",") };
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp[Op.gte] = new Date(from);
    if (to) where.timestamp[Op.lte] = new Date(to);
  }

  const logs = await AuditLog.findAll({
    where,
    include: [{ model: User, as: "user", attributes: ["full_name", "email"] }],
    order: [["timestamp", "DESC"]],
    limit: 500,
  });
  res.json({ logs });
});

// GET /api/audit/:request_id — Timeline Viewer for one specific request.
export const getAuditForRequest = asyncHandler(async (req, res) => {
  const logs = await AuditLog.findAll({
    where: { request_id: req.params.request_id },
    include: [{ model: User, as: "user", attributes: ["full_name"] }],
    order: [["timestamp", "ASC"]],
  });
  res.json({ logs });
});
