import nodemailer from "nodemailer";
import { Notification } from "../models/index.js";

// If SMTP credentials are provided in .env, real emails are sent via
// Nodemailer. Otherwise falls back to a "console transport" that just logs
// the email — this keeps the whole clearance workflow (which depends on
// notifications firing) runnable out of the box, without requiring a real
// mailbox to demo the project.
export const hasSmtpConfig = !!process.env.SMTP_HOST;

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    })
  : null;

/**
 * Sends an email (or logs it, if SMTP isn't configured) AND writes a
 * matching in-app notification row, per SRS section 18 ("All the above
 * events are also pushed in-app").
 */
export async function notify({ userId, to, subject, message, category = "general" }) {
  // In-app notification — always recorded regardless of email delivery.
  if (userId) {
    await Notification.create({
      user_id: userId,
      type: "in-app",
      category,
      subject,
      message,
    });
  }

  // Email delivery.
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Wollo University Clearance" <no-reply@wollo.edu.et>',
        to,
        subject,
        text: message,
      });
    } catch (err) {
      console.error(`⚠️  Email send failed for ${to}:`, err.message);
    }
  } else {
    console.log(`📧 [DEV EMAIL — SMTP not configured] To: ${to} | Subject: ${subject}\n   ${message}`);
  }

  if (userId) {
    await Notification.create({
      user_id: userId,
      type: "email",
      category,
      subject,
      message,
    });
  }
}
