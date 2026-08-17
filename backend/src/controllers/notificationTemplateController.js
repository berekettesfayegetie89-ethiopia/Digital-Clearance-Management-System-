import { NotificationTemplate } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listTemplates = asyncHandler(async (req, res) => {
  const templates = await NotificationTemplate.findAll({ order: [["id", "ASC"]] });
  res.json({ templates });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await NotificationTemplate.findByPk(req.params.id);
  if (!template) return res.status(404).json({ error: "Template not found." });
  const { subject, body } = req.body;
  if (subject !== undefined) template.subject = subject;
  if (body !== undefined) template.body = body;
  await template.save();
  res.json({ template });
});
