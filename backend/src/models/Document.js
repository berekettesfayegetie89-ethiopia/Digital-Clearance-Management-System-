import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: documents table.
export const Document = sequelize.define(
  "documents",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    request_id: { type: DataTypes.INTEGER, allowNull: false },
    uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    file_path: { type: DataTypes.STRING(500), allowNull: false },
    file_size: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: true },
    uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "documents" }
);
