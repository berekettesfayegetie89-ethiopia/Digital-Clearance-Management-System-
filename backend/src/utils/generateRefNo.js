import { ClearanceRequest } from "../models/index.js";

// Produces CLR-2026-00042 style reference numbers (FR-006), incrementing per
// calendar year.
export async function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const count = await ClearanceRequest.count({
    where: {},
  });
  const next = String(count + 1).padStart(5, "0");
  return `CLR-${year}-${next}`;
}
