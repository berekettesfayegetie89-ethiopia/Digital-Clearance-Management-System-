import { getClientIp } from "../utils/getClientIp.js";

// Runs on every request, before routes — computes the real client IP once
// and attaches it as req.clientIp, so every controller can just read
// req.clientIp instead of the unreliable-alone req.clientIp.
export function attachClientIp(req, res, next) {
  req.clientIp = getClientIp(req);
  next();
}
