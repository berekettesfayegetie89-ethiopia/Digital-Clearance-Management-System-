import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Additional table (not in the original SRS ERD, needed for FR-019 /
// Department Head "Assign / Approve Substitute" workflow). Tracks delegation
// requests and their approval status.
export const Delegation = sequelize.define(
  "delegations",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    approver_id: { type: DataTypes.INTEGER, allowNull: false },
    delegate_id: { type: DataTypes.INTEGER, allowNull: false },
    department_id: { type: DataTypes.INTEGER, allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "approved", "denied", "revoked", "expired"),
      defaultValue: "pending",
    },
    approved_by: { type: DataTypes.INTEGER, allowNull: true }, // Department Head who approved it
  },
  { tableName: "delegations" }
);
