import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: notifications table.
export const Notification = sequelize.define(
  "notifications",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("email", "in-app"), allowNull: false, defaultValue: "in-app" },
    category: {
      type: DataTypes.ENUM("approval", "rejection", "reminder", "escalation", "certificate", "assignment", "general"),
      defaultValue: "general",
    },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.STRING(1000), allowNull: false },
    sent_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "notifications", updatedAt: false }
);
