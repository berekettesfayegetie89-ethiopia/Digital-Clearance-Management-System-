import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: audit_logs table. Retained 7 years per section 20.
export const AuditLog = sequelize.define(
  "audit_logs",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: {
      type: DataTypes.ENUM(
        "APPLY","APPROVE","REJECT","HOLD","WITHDRAW","RESUBMIT","ESCALATE",
        "FORCE_APPROVE","FORCE_REJECT","REASSIGN","GENERATE","REVOKE","VERIFY",
        "LOGIN","LOGIN_FAILED","LOGOUT","CREATE_USER","RESET_PASSWORD",
        "DELEGATE_REQUEST","DELEGATE_APPROVE","DELEGATE_DENY"
      ),
      allowNull: false,
    },
    request_id: { type: DataTypes.INTEGER, allowNull: true },
    details: { type: DataTypes.JSON, allowNull: true },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "audit_logs", updatedAt: false }
);
