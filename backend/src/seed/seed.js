import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import { sequelize, connectDB } from "../config/db.js";
import { User, Department, Workflow, NotificationTemplate, SystemSettings } from "../models/index.js";

const DEPARTMENTS = [
  { name: "Registrar", code: "REG" },
  { name: "Library", code: "LIB" },
  { name: "Finance", code: "FIN" },
  { name: "IT", code: "IT" },
  { name: "Store", code: "STR" },
  { name: "Academic Affairs", code: "ACA" },
];

const CLEARANCE_TYPES = [
  "Employee Resignation",
  "Employee Transfer",
  "Employee Termination",
  "Student Graduation",
  "Student Withdrawal",
];

const NOTIFICATION_TEMPLATES = [
  { key: "clearance_submitted", label: "Clearance Submitted", subject: "Clearance Request Submitted", body: "Hi {applicant_name}, your clearance request {reference_no} has been received and routed to all relevant departments." },
  { key: "new_assignment", label: "New Assignment", subject: "New Clearance Request Assigned", body: "A new {clearance_type} request ({reference_no}) has been routed to {department} for your review." },
  { key: "approval_completed", label: "Approval Completed", subject: "Department Approval Completed", body: "{department} approved your {clearance_type} request ({reference_no})." },
  { key: "rejection_reason", label: "Rejection Reason", subject: "Rejection Reason", body: "{department} rejected your {clearance_type} request ({reference_no}). Reason: {reason}" },
  { key: "certificate_ready", label: "Certificate Ready", subject: "Clearance Completed — Certificate Ready", body: "All departments have approved your {clearance_type} request ({reference_no}). Your certificate {certificate_no} is ready to download." },
  { key: "deadline_reminder", label: "Deadline Reminder (24h)", subject: "Pending approval due soon", body: "A clearance request in {department} is due within 24 hours." },
  { key: "escalation_alert", label: "Escalation Alert", subject: "Escalation Alert — SLA breach", body: "A clearance request in {department} has breached its SLA deadline and requires attention." },
];

async function seed() {
  await connectDB();
  await sequelize.sync({ force: true }); // fresh start for demo purposes
  console.log("🗑️  Tables recreated (force sync).");

  // --- Departments ---
  const departments = await Department.bulkCreate(DEPARTMENTS);
  const byName = Object.fromEntries(departments.map((d) => [d.name, d]));
  console.log(`✅ ${departments.length} departments created.`);

  // --- Users ---
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = await User.bulkCreate([
    { email: "selamawit.bekele@wollo.edu.et", password_hash: passwordHash, role: "applicant", full_name: "Selamawit Bekele", employee_id: "WU/UGR/4521/16", department: "Computer Science", phone: "+251 91 234 5678" },

    // One approver per department — every department is now fully staffed,
    // so no clearance request should ever get stuck with "no approver".
    { email: "kidist.wolde@wollo.edu.et", password_hash: passwordHash, role: "approver", full_name: "Kidist Wolde", department: "Registrar" },
    { email: "getachew.mola@wollo.edu.et", password_hash: passwordHash, role: "approver", full_name: "Getachew Mola", department: "Library" },
    { email: "tsegaye.alemu@wollo.edu.et", password_hash: passwordHash, role: "approver", full_name: "Tsegaye Alemu", department: "Finance" },
    { email: "chaltu.bekele@wollo.edu.et", password_hash: passwordHash, role: "approver", full_name: "Chaltu Bekele", department: "Finance" },
    { email: "robel.assefa@wollo.edu.et", password_hash: passwordHash, role: "approver", full_name: "Robel Assefa", department: "IT" },
    { email: "fikirte.haile@wollo.edu.et", password_hash: passwordHash, role: "approver", full_name: "Fikirte Haile", department: "Store" },
    { email: "biniam.tesfaye@wollo.edu.et", password_hash: passwordHash, role: "approver", full_name: "Biniam Tesfaye", department: "Academic Affairs" },

    // One department head per department, so delegation approval works for
    // every department, not just Library.
    { email: "meron.tadesse@wollo.edu.et", password_hash: passwordHash, role: "department_head", full_name: "Dr. Meron Tadesse", department: "Library" },
    { email: "solomon.girma@wollo.edu.et", password_hash: passwordHash, role: "department_head", full_name: "Solomon Girma", department: "Registrar" },
    { email: "tigist.haile@wollo.edu.et", password_hash: passwordHash, role: "department_head", full_name: "Tigist Haile", department: "Finance" },
    { email: "yared.dessie@wollo.edu.et", password_hash: passwordHash, role: "department_head", full_name: "Yared Dessie", department: "IT" },
    { email: "mekdes.abebe@wollo.edu.et", password_hash: passwordHash, role: "department_head", full_name: "Mekdes Abebe", department: "Store" },
    { email: "abraham.tsegaye@wollo.edu.et", password_hash: passwordHash, role: "department_head", full_name: "Abraham Tsegaye", department: "Academic Affairs" },

    { email: "hanna.girma@wollo.edu.et", password_hash: passwordHash, role: "hr_coordinator", full_name: "Hanna Girma", department: "Human Resources" },
    { email: "yonas.fikru@wollo.edu.et", password_hash: passwordHash, role: "auditor", full_name: "Yonas Fikru", department: "Internal Audit" },
    { email: "betelhem.worku@wollo.edu.et", password_hash: passwordHash, role: "super_admin", full_name: "Betelhem Worku", department: "IT Administration" },
    { email: "amanuel.kebede@wollo.edu.et", password_hash: passwordHash, role: "system_admin", full_name: "Amanuel Kebede", department: "IT Administration" },
  ]);
  console.log(`✅ ${users.length} users created (all demo passwords: "password123").`);

  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));

  // Assign every department a real head.
  byName["Library"].head_user_id = byEmail["meron.tadesse@wollo.edu.et"].id;
  byName["Registrar"].head_user_id = byEmail["solomon.girma@wollo.edu.et"].id;
  byName["Finance"].head_user_id = byEmail["tigist.haile@wollo.edu.et"].id;
  byName["IT"].head_user_id = byEmail["yared.dessie@wollo.edu.et"].id;
  byName["Store"].head_user_id = byEmail["mekdes.abebe@wollo.edu.et"].id;
  byName["Academic Affairs"].head_user_id = byEmail["abraham.tsegaye@wollo.edu.et"].id;
  for (const dept of Object.values(byName)) await dept.save();
  console.log("✅ Every department assigned a real head.");

  // --- Workflows: all 5 clearance types route through all 6 departments,
  // in parallel by default, 72h SLA — editable later via Workflow Builder. ---
  const workflowRows = [];
  for (const type of CLEARANCE_TYPES) {
    DEPARTMENTS.forEach((dept, idx) => {
      workflowRows.push({
        clearance_type: type,
        department_id: byName[dept.name].id,
        sequence_order: idx + 1,
        is_parallel: true,
        is_mandatory: true,
        sla_hours: 72,
      });
    });
  }
  await Workflow.bulkCreate(workflowRows);
  console.log(`✅ ${workflowRows.length} workflow steps created (${CLEARANCE_TYPES.length} types × ${DEPARTMENTS.length} departments).`);

  // --- Notification templates ---
  await NotificationTemplate.bulkCreate(NOTIFICATION_TEMPLATES);
  console.log(`✅ ${NOTIFICATION_TEMPLATES.length} notification templates created.`);

  // --- System settings (single row, sensible defaults) ---
  await SystemSettings.create({ id: 1 });
  console.log("✅ Default system settings created.");

  console.log("\n🎉 Seed complete. Demo login — any of the emails above, password: password123\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
