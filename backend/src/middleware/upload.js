import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "..", "uploads", "documents");
fs.mkdirSync(uploadRoot, { recursive: true });

const ALLOWED = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];
const maxSizeBytes = (Number(process.env.MAX_UPLOAD_MB) || 5) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    return cb(new Error("Unsupported file type. Allowed: PDF, JPG, PNG, DOCX."));
  }
  cb(null, true);
}

// FR-025: max 5 files, 5MB each.
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeBytes, files: 5 },
});
