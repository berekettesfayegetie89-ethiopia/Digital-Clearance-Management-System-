import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// Like requireAuth, but doesn't reject the request if there's no token —
// just leaves req.user undefined. Used for endpoints that work both for
// logged-in users AND anonymous visitors (e.g. the login page's "Contact
// Support" form).
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (user && user.is_active) req.user = user;
  } catch {
    // invalid/expired token on an optional-auth route — just proceed as anonymous
  }
  next();
}
