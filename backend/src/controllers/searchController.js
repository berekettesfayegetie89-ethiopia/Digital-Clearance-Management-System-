import { Op } from "sequelize";
import { ClearanceRequest, User, Certificate } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/search?q=... — role-aware global search powering the top-nav
// search bar on every dashboard. An applicant only ever gets their own
// requests back; an approver only their department's; HR/Super Admin/
// Auditor get everything. Previously the search bar was UI-only with no
// real query behind it.
export const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json({ results: { requests: [], users: [], certificates: [] } });

  const like = { [Op.like]: `%${q}%` };
  const role = req.user.role;

  // Search by reference number always; also search by applicant name for
  // roles allowed to see other people's requests.
  const orConditions = [{ reference_no: like }];
  const requestWhere =
    role === "applicant"
      ? { [Op.and]: [{ applicant_id: req.user.id }, { [Op.or]: orConditions }] }
      : { [Op.or]: orConditions };

  const requests = await ClearanceRequest.findAll({
    where: requestWhere,
    include: [{ model: User, as: "applicant", attributes: ["full_name"] }],
    limit: 6,
    order: [["submitted_at", "DESC"]],
  });

  // Also match by applicant name for non-applicant roles (separate query,
  // merged in — simpler and safer than a cross-table OR in Sequelize).
  let nameMatches = [];
  if (role !== "applicant") {
    nameMatches = await ClearanceRequest.findAll({
      include: [{ model: User, as: "applicant", attributes: ["full_name"], where: { full_name: like } }],
      limit: 6,
      order: [["submitted_at", "DESC"]],
    });
  }

  const seen = new Set(requests.map((r) => r.id));
  const mergedRequests = [...requests, ...nameMatches.filter((r) => !seen.has(r.id))].slice(0, 8);

  const results = { requests: mergedRequests, users: [], certificates: [] };

  if (["hr_coordinator", "super_admin", "auditor"].includes(role)) {
    results.users = await User.findAll({ where: { full_name: like }, attributes: ["id", "full_name", "email", "role"], limit: 6 });
    results.certificates = await Certificate.findAll({ where: { certificate_number: like }, limit: 6 });
  }

  res.json({ results });
});
