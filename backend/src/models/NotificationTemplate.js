import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Additional table for Super Admin -> Notification Templates.
export const NotificationTemplate = sequelize.define(
  "notification_templates",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(60), allowNull: false, unique: true }, // e.g. "clearance_submitted"
    label: { type: DataTypes.STRING(150), allowNull: false },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: "notification_templates" }
);
