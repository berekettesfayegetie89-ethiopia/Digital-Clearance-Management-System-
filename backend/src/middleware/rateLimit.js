// Minimal in-memory rate limiter — no Redis dependency needed for a course
// project. FR-035 asks for 10 verification attempts per minute per IP.
// (A real production deployment would swap this for Redis-backed limiting,
// as noted in the SRS deployment checklist — this is a drop-in replacement
// point, not a design dead-end.)
const hits = new Map();

export default function rateLimit({ windowMs = 60_000, max = 10 } = {}) {
  return (req, res, next) => {
    const key = req.clientIp;
    const now = Date.now();
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: `Too many attempts. Try again in ${retryAfterSec} seconds.` });
    }

    next();
  };
}
