import { SupportTicket } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../services/emailService.js";

// POST /api/support — Help & Support "Contact Support" / "Report Issue"
// forms. Creates a real database record AND emails the support address
// (console-logged if no SMTP configured, same as every other notification).
export const submitSupportTicket = asyncHandler(async (req, res) => {
  const { type, subject, message } = req.body;
  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Subject and message are required." });
  }

  const ticket = await SupportTicket.create({
    user_id: req.user?.id || null,
    type: type || "question",
    subject,
    message,
  });

  await notify({
    userId: null,
    to: process.env.SUPPORT_EMAIL || "support@wollo.edu.et",
    subject: `[Support Ticket #${ticket.id}] ${subject}`,
    message: `From: ${req.user?.email || "Unknown"}\nType: ${type}\n\n${message}`,
    category: "general",
  });

  res.status(201).json({ ticket, message: "Your message has been submitted. We'll get back to you soon." });
});
