import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "..", "uploads", "branding");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => cb(null, `logo${path.extname(file.originalname)}`), // always overwrite — one logo
});

export const uploadLogo = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!/\.(png|jpg|jpeg|svg)$/i.test(file.originalname)) {
      return cb(new Error("Logo must be PNG, JPG, or SVG."));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});
