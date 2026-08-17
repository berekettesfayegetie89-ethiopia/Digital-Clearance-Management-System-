import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: workflows table (Admin-configured per clearance type).
export const Workflow = sequelize.define(
  "workflows",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clearance_type: { type: DataTypes.STRING(50), allowNull: false },
    department_id: { type: DataTypes.INTEGER, allowNull: false },
    sequence_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    is_parallel: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_mandatory: { type: DataTypes.BOOLEAN, defaultValue: true },
    sla_hours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 72 },
  },
  { tableName: "workflows" }
);
