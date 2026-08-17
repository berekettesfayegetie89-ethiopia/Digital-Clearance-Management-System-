/**
 * Reliably extracts the real client IP address from a request.
 *
 * Plain `req.ip` alone isn't enough for two real reasons:
 *  1. If this app ever sits behind a reverse proxy (the SRS deployment
 *     checklist specifies Nginx), every request's socket address is the
 *     proxy's own IP unless we explicitly read X-Forwarded-For.
 *  2. On direct connections (e.g. testing locally), Node reports IPv6
 *     loopback as "::1" or IPv4-mapped addresses as "::ffff:127.0.0.1" —
 *     technically correct, but confusing to read in an audit log next to
 *     plain IPv4 addresses. This normalizes those to "127.0.0.1".
 */
export function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  let ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.ip || req.socket?.remoteAddress || null;

  if (!ip) return "unknown";

  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.slice(7);

  return ip;
}
