import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: departments table.
export const Department = sequelize.define(
  "departments",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    head_user_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "departments" }
);
