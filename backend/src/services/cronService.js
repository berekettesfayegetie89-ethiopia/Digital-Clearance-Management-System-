import cron from "node-cron";
import { Op } from "sequelize";
import { DepartmentApproval, Department, User, PasswordResetToken } from "../models/index.js";
import { notify } from "./emailService.js";
import { logAudit } from "./auditService.js";

/**
 * FR-037 — three-stage escalation:
 *  - 24h before deadline: "Pending approval due soon" -> Approver
 *  - On deadline day (now > deadline): "Approval overdue" -> Approver + Dept Head
 *  - 48h after deadline: escalate to HR Director (here: hr_coordinator role)
 * Runs daily at 08:00, matching the SRS deployment checklist's cron schedule
 * (`0 8 * * *`).
 */
async function runSlaReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000);

  const pending = await DepartmentApproval.findAll({
    where: { status: "pending" },
    include: [{ model: Department, as: "department" }, { model: User, as: "approver" }],
  });

  for (const approval of pending) {
    if (!approval.deadline) continue;
    const deadline = new Date(approval.deadline);
    const dept = approval.department;

    const approvers = approval.approver
      ? [approval.approver]
      : await User.findAll({ where: { role: "approver", department: dept.name, is_active: true } });

    // --- 24h-before-deadline reminder ---
    if (approval.escalation_stage === "none" && deadline <= in24h && deadline > now) {
      for (const a of approvers) {
        await notify({
          userId: a.id,
          to: a.email,
          subject: "Pending approval due soon",
          message: `A clearance request in ${dept.name} is due within 24 hours.`,
          category: "reminder",
        });
      }
      approval.escalation_stage = "reminder_24h";
      await approval.save();
    }

    // --- Deadline day: overdue, notify approver + department head ---
    if (["none", "reminder_24h"].includes(approval.escalation_stage) && deadline <= now) {
      for (const a of approvers) {
        await notify({
          userId: a.id,
          to: a.email,
          subject: "Approval overdue",
          message: `A clearance request in ${dept.name} has passed its SLA deadline.`,
          category: "escalation",
        });
      }
      if (dept.head_user_id) {
        const head = await User.findByPk(dept.head_user_id);
        await notify({
          userId: head.id,
          to: head.email,
          subject: "Team member SLA breach",
          message: `A clearance request in ${dept.name} is overdue and needs attention.`,
          category: "escalation",
        });
      }
      approval.escalation_stage = "overdue";
      approval.is_escalated = true;
      await approval.save();
      await logAudit({ action: "ESCALATE", requestId: approval.request_id, details: { stage: "overdue" } });
    }

    // --- 48h after deadline: escalate to HR Coordinator ---
    const hoursOverdue = (now - deadline) / 3600000;
    if (approval.escalation_stage !== "escalated_48h" && hoursOverdue >= 48) {
      const hrUsers = await User.findAll({ where: { role: "hr_coordinator", is_active: true } });
      for (const hr of hrUsers) {
        await notify({
          userId: hr.id,
          to: hr.email,
          subject: "Escalation Alert — 48h SLA breach",
          message: `A clearance request in ${dept.name} has been overdue for over 48 hours and requires HR follow-up or Super Admin override.`,
          category: "escalation",
        });
      }
      approval.escalation_stage = "escalated_48h";
      await approval.save();
      await logAudit({ action: "ESCALATE", requestId: approval.request_id, details: { stage: "escalated_48h" } });
    }
  }
}

async function cleanupExpiredTokens() {
  const deleted = await PasswordResetToken.destroy({
    where: { expires_at: { [Op.lt]: new Date() } },
  });
  if (deleted > 0) console.log(`🧹 Cleaned up ${deleted} expired password reset token(s).`);
}

export function startCronJobs() {
  // Daily SLA reminders — 08:00 (matches SRS deployment checklist).
  cron.schedule("0 8 * * *", () => {
    cronStatus.slaReminders.lastRun = new Date();
    runSlaReminders()
      .then(() => { cronStatus.slaReminders.lastStatus = "success"; })
      .catch((e) => { cronStatus.slaReminders.lastStatus = "failed"; console.error("SLA reminder job failed:", e.message); });
  });

  // Session/token cleanup — 02:00 daily.
  cron.schedule("0 2 * * *", () => {
    cronStatus.tokenCleanup.lastRun = new Date();
    cleanupExpiredTokens()
      .then(() => { cronStatus.tokenCleanup.lastStatus = "success"; })
      .catch((e) => { cronStatus.tokenCleanup.lastStatus = "failed"; console.error("Token cleanup job failed:", e.message); });
  });

  console.log("⏰ Cron jobs scheduled (SLA reminders @ 08:00, token cleanup @ 02:00).");
}

// Real, in-memory tracker of each cron job's actual last-run time and
// outcome — read by the System Admin's Cron Job Monitor screen. Resets on
// server restart (there's no persistent job-run table), which is a
// reasonable trade-off for a course project; a production system would
// persist this in its own table.
export const cronStatus = {
  slaReminders: { name: "Daily SLA Reminders", schedule: "0 8 * * *", lastRun: null, lastStatus: "never run" },
  tokenCleanup: { name: "Session Token Cleanup", schedule: "0 2 * * *", lastRun: null, lastStatus: "never run" },
};

// Exported for the "Run Now" button on the System Admin's Cron Job Monitor
// screen, and for manual testing.
export const cronJobRunners = {
  runSlaReminders: async () => {
    cronStatus.slaReminders.lastRun = new Date();
    try {
      await runSlaReminders();
      cronStatus.slaReminders.lastStatus = "success";
    } catch (e) {
      cronStatus.slaReminders.lastStatus = "failed";
      throw e;
    }
  },
  cleanupExpiredTokens: async () => {
    cronStatus.tokenCleanup.lastRun = new Date();
    try {
      await cleanupExpiredTokens();
      cronStatus.tokenCleanup.lastStatus = "success";
    } catch (e) {
      cronStatus.tokenCleanup.lastStatus = "failed";
      throw e;
    }
  },
};
