import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: users table.
export const User = sequelize.define(
  "users",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM(
        "applicant",
        "approver",
        "department_head",
        "hr_coordinator",
        "auditor",
        "super_admin",
        "system_admin"
      ),
      allowNull: false,
    },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    employee_id: { type: DataTypes.STRING(50), allowNull: true },
    department: { type: DataTypes.STRING(100), allowNull: true },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    must_change_password: { type: DataTypes.BOOLEAN, defaultValue: false },
    twofa_secret: { type: DataTypes.STRING(64), allowNull: true },
    twofa_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "users" }
);
