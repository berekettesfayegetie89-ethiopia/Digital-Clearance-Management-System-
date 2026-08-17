import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Additional table for Super Admin -> Settings. Single-row config table
// (id is always 1) so the frontend's General/Email/Certificate/Security/
// Appearance/Language/Time Zone tabs persist real values instead of
// resetting on refresh.
export const SystemSettings = sequelize.define(
  "system_settings",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
    institution_name: { type: DataTypes.STRING(150), defaultValue: "Wollo University" },
    logo_path: { type: DataTypes.STRING(500), allowNull: true },
    smtp_host: { type: DataTypes.STRING(150), allowNull: true },
    smtp_port: { type: DataTypes.INTEGER, allowNull: true },
    smtp_user: { type: DataTypes.STRING(150), allowNull: true },
    certificate_watermark_text: { type: DataTypes.STRING(100), defaultValue: "Digitally Verified" },
    certificate_verification_years: { type: DataTypes.INTEGER, defaultValue: 5 },
    min_password_length: { type: DataTypes.INTEGER, defaultValue: 8 },
    session_timeout_minutes: { type: DataTypes.INTEGER, defaultValue: 15 },
    require_2fa_for_admins: { type: DataTypes.BOOLEAN, defaultValue: false },
    language: { type: DataTypes.ENUM("en", "am"), defaultValue: "en" },
    time_zone: { type: DataTypes.STRING(80), defaultValue: "East Africa Time (UTC+3)" },
  },
  { tableName: "system_settings" }
);
