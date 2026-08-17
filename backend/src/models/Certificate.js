import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Matches SRS section 14: certificates table.
export const Certificate = sequelize.define(
  "certificates",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    request_id: { type: DataTypes.INTEGER, allowNull: false },
    certificate_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    pdf_path: { type: DataTypes.STRING(500), allowNull: true },
    qr_hash: { type: DataTypes.STRING(64), allowNull: false },
    verification_token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    generated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    verification_url: { type: DataTypes.STRING(500), allowNull: true },
    verification_expires_at: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM("active", "revoked"), defaultValue: "active" },
    revoked_reason: { type: DataTypes.STRING(500), allowNull: true },
    revoked_by: { type: DataTypes.INTEGER, allowNull: true },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    supersedes_certificate_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "certificates" }
);
