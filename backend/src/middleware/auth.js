import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// Verifies the JWT on protected routes (SRS NFR-002) and attaches the
// authenticated user to req.user for downstream handlers/RBAC checks.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid or expired session." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

// Restricts a route to specific roles. Mirrors the RBAC matrix in SRS section 5.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to perform this action." });
    }
    next();
  };
}
