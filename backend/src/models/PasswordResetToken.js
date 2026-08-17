import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Additional table (not in the original SRS ERD, needed for the Forgot/Reset
// Password flow). Tokens are short-lived and single-use.
export const PasswordResetToken = sequelize.define(
  "password_reset_tokens",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "password_reset_tokens", updatedAt: false }
);
