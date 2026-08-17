import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Connects to MySQL served by XAMPP. Start Apache + MySQL in the XAMPP
// control panel, create the database once via phpMyAdmin (see .env.example),
// and this picks it up from there — Sequelize creates all the tables for you
// via sequelize.sync() in server.js.
export const sequelize = new Sequelize(
  process.env.DB_NAME || "digital_clearance_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    define: {
      underscored: true, // matches snake_case column names from the SRS ERD
      timestamps: true,
    },
  }
);

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connection established (via XAMPP).");
  } catch (err) {
    console.error("❌ Unable to connect to the database:", err.message);
    console.error(
      "   Make sure XAMPP's MySQL service is running and the database in .env exists."
    );
    process.exit(1);
  }
}
