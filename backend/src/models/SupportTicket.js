import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Additional table for the Help & Support "Contact Support" / "Report Issue"
// forms so submissions are real records, not just a fake success toast.
export const SupportTicket = sequelize.define(
  "support_tickets",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM("question", "bug_report", "feedback"), defaultValue: "question" },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM("open", "resolved"), defaultValue: "open" },
  },
  { tableName: "support_tickets" }
);
