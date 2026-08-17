import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
import { Document, ClearanceRequest, Department, DepartmentApproval, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../services/auditService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// POST /api/clearance/:id/documents — FR-025/026. multer's `upload.array`
// middleware runs before this handler (see routes/documentRoutes.js).
export const uploadDocuments = asyncHandler(async (req, res) => {
  const request = await ClearanceRequest.findByPk(req.params.id);
  if (!request) return res.status(404).json({ error: "Clearance request not found." });

  const existingCount = await Document.count({ where: { request_id: request.id } });
  if (existingCount + (req.files?.length || 0) > 5) {
    return res.status(400).json({ error: "A clearance request can have at most 5 documents." });
  }

  const created = [];
  for (const file of req.files || []) {
    const doc = await Document.create({
      request_id: request.id,
      uploaded_by: req.user.id,
      file_name: file.originalname,
      file_path: `uploads/documents/${file.filename}`,
      file_size: file.size,
      category: req.body.category || "Supporting Document",
    });
    created.push(doc);
  }

  await logAudit({ userId: req.user.id, action: "APPLY", requestId: request.id, ip: req.clientIp, details: { documentsUploaded: created.length } });
  res.status(201).json({ documents: created });
});

export const getDocumentsForRequest = asyncHandler(async (req, res) => {
  const documents = await Document.findAll({ where: { request_id: req.params.id } });
  res.json({ documents });
});

// GET /api/documents/department — every document attached to a request that
// has (or had) a task routed to the signed-in approver's department. Powers
// the Department Approver's "Department Documents" screen with real files
// instead of hardcoded rows.
export const getDocumentsForMyDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ where: { name: req.user.department } });
  if (!department) return res.json({ documents: [] });

  const approvals = await DepartmentApproval.findAll({
    where: { department_id: department.id },
    attributes: ["request_id"],
  });
  const requestIds = [...new Set(approvals.map((a) => a.request_id))];

  const documents = await Document.findAll({
    where: { request_id: { [Op.in]: requestIds } },
    include: [
      { model: ClearanceRequest, as: "request", attributes: ["reference_no"] },
      { model: User, as: "uploader", attributes: ["full_name"] },
    ],
    order: [["uploaded_at", "DESC"]],
  });
  res.json({ documents });
});


export const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  const filePath = path.join(__dirname, "..", "..", doc.file_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on server." });
  res.download(filePath, doc.file_name);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  if (doc.uploaded_by !== req.user.id) {
    return res.status(403).json({ error: "You can only delete documents you uploaded." });
  }
  const filePath = path.join(__dirname, "..", "..", doc.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await doc.destroy();
  res.json({ message: "Document removed." });
});
