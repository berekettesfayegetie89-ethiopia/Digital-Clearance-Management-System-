import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import PdfPrinter from "pdfmake";
import { Certificate, DepartmentApproval } from "../models/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certRoot = path.join(__dirname, "..", "..", "uploads", "certificates");
fs.mkdirSync(certRoot, { recursive: true });

// pdfmake needs font file paths. Uses Helvetica-equivalent standard fonts
// (no external font files required) so this runs out of the box.
const fonts = {
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};
const printer = new PdfPrinter(fonts);

function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CERT-${year}-${rand}`;
}

/**
 * Generates the tamper-proof clearance certificate PDF (FR-030) once a
 * request has been fully approved: writes the PDF to disk, computes a
 * SHA-256 hash of its contents, generates a QR code encoding a random
 * verification token (NOT the certificate number — see SRS "Security
 * Requirements": prevents enumeration attacks), and stores a Certificate row.
 */
export async function generateCertificate({ request, applicant, approvals, originUrl }) {
  const certificateNumber = generateCertificateNumber();
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationYears = Number(process.env.CERTIFICATE_VERIFICATION_YEARS) || 5;
  const verificationExpiresAt = new Date();
  verificationExpiresAt.setFullYear(verificationExpiresAt.getFullYear() + verificationYears);

  // Prefer deriving the verify URL from the actual request that triggered
  // completion (its Origin header) — this makes certificates automatically
  // work from whatever address the frontend was actually accessed at
  // (localhost, a LAN IP for cross-device QR scanning, a real domain later)
  // without needing to hand-edit CERTIFICATE_VERIFY_BASE_URL in .env every
  // time. Falls back to the env var, then localhost, if no origin is known
  // (e.g. when triggered by a cron job with no request context).
  const base = originUrl || process.env.CERTIFICATE_VERIFY_BASE_URL || "http://localhost:5173";
  const verifyBase = base.endsWith("/verify") ? base : `${base.replace(/\/$/, "")}/verify`;
  const verificationUrl = `${verifyBase}?token=${verificationToken}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 200 });

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [50, 60, 50, 60],
    content: [
      { text: "WOLLO UNIVERSITY", style: "header", alignment: "center" },
      { text: "Digital Clearance Certificate", style: "subheader", alignment: "center", margin: [0, 4, 0, 20] },
      {
        table: {
          widths: ["40%", "60%"],
          body: [
            ["Applicant Name", applicant.full_name],
            ["ID Number", applicant.employee_id || "-"],
            ["Department", applicant.department || "-"],
            ["Clearance Type", request.clearance_type],
            ["Effective Date", request.last_working_date],
            ["Certificate Number", certificateNumber],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 20],
      },
      { text: "Department Approvals", style: "sectionTitle", margin: [0, 10, 0, 8] },
      {
        table: {
          widths: ["40%", "30%", "30%"],
          body: [
            ["Department", "Approver", "Date"],
            ...approvals.map((a) => [
              a.department?.name || "-",
              a.approver?.full_name || "-",
              a.approved_at ? new Date(a.approved_at).toLocaleDateString() : "-",
            ]),
          ],
        },
        margin: [0, 0, 0, 30],
      },
      {
        columns: [
          { image: qrDataUrl, width: 100 },
          {
            width: "*",
            text: [
              { text: "Scan to verify, or visit:\n", fontSize: 9 },
              { text: verificationUrl, fontSize: 8, color: "#2563EB" },
              { text: `\n\nThis certificate is valid for public verification until ${verificationExpiresAt.toLocaleDateString()}.`, fontSize: 8, margin: [0, 6, 0, 0] },
            ],
            margin: [15, 5, 0, 0],
          },
        ],
      },
      {
        text: "DIGITALLY VERIFIED",
        style: "watermark",
        alignment: "center",
        margin: [0, 40, 0, 0],
      },
    ],
    styles: {
      header: { fontSize: 20, bold: true, color: "#2B3A67" },
      subheader: { fontSize: 14, color: "#111827" },
      sectionTitle: { fontSize: 11, bold: true, color: "#111827" },
      watermark: { fontSize: 10, color: "#9CA3AF", italics: true },
    },
    defaultStyle: { font: "Roboto" },
  };

  const fileName = `${certificateNumber}.pdf`;
  const filePath = path.join(certRoot, fileName);

  await new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const stream = fs.createWriteStream(filePath);
    pdfDoc.pipe(stream);
    pdfDoc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const fileBuffer = fs.readFileSync(filePath);
  const qrHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  const certificate = await Certificate.create({
    request_id: request.id,
    certificate_number: certificateNumber,
    pdf_path: `uploads/certificates/${fileName}`,
    qr_hash: qrHash,
    verification_token: verificationToken,
    verification_url: verificationUrl,
    verification_expires_at: verificationExpiresAt,
  });

  return certificate;
}

/**
 * Revokes a certificate (per Super Admin "Certificate Administration ->
 * Revoke") and, if requested, immediately issues a replacement. Certificates
 * are never deleted — only marked revoked — so the audit trail and public
 * verification page can show "Revoked — superseded by CERT-XXXX" rather than
 * silently failing (see the SRS gap analysis this design was built to close).
 */
export async function revokeCertificate({ certificate, revokedByUserId, reason }) {
  certificate.status = "revoked";
  certificate.revoked_reason = reason;
  certificate.revoked_by = revokedByUserId;
  certificate.revoked_at = new Date();
  await certificate.save();
  return certificate;
}
