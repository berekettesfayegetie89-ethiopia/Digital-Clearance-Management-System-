import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: clearance_requests table.
export const ClearanceRequest = sequelize.define(
  "clearance_requests",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reference_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    applicant_id: { type: DataTypes.INTEGER, allowNull: false },
    clearance_type: {
      type: DataTypes.ENUM(
        "Employee Resignation",
        "Employee Transfer",
        "Employee Termination",
        "Student Graduation",
        "Student Withdrawal"
      ),
      allowNull: false,
    },
    reason: { type: DataTypes.STRING(1000), allowNull: false },
    last_working_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "in-progress", "cleared", "rejected", "withdrawn"),
      defaultValue: "pending",
    },
    submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    supersedes_request_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "clearance_requests" }
);
