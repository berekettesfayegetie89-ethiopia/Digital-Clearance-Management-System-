import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: department_approvals table.
export const DepartmentApproval = sequelize.define(
  "department_approvals",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    request_id: { type: DataTypes.INTEGER, allowNull: false },
    department_id: { type: DataTypes.INTEGER, allowNull: false },
    approver_id: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "hold", "not_started"),
      defaultValue: "not_started",
    },
    remarks: { type: DataTypes.STRING(1000), allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    deadline: { type: DataTypes.DATE, allowNull: true },
    is_escalated: { type: DataTypes.BOOLEAN, defaultValue: false },
    escalation_stage: {
      type: DataTypes.ENUM("none", "reminder_24h", "overdue", "escalated_48h"),
      defaultValue: "none",
    },
    carried_over: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "department_approvals" }
);
