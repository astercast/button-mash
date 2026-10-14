/* ratelimit.js, per-instance in-memory token bucket (spec §1.7).
   Best-effort: resets on cold start (documented, not hidden).
   Buckets: "public" 60 req/min per IP, "compute" 20 req/min per IP.
   Key on x-forwarded-for (first entry), not socket IP.
   Copy verbatim between the 7 server-program repos; do not fork behavior. */
"use strict";

const LIMITS = { public: 60, compute: 20 };
const WINDOW_MS = 60 * 1000;

// ip -> bucket -> [ windowStart, count ]
const buckets = new Map();

function clientIp(req) {
  const fwd = (req.headers && (req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"])) || "";
  if (fwd) return String(fwd).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

// Returns { ok: true } or { ok: false, retryAfter }.
function checkLimit(req, bucketName) {
  const limit = LIMITS[bucketName] || LIMITS.public;
  const ip = clientIp(req);
  const key = bucketName + "|" + ip;
  const now = Date.now();
  let rec = buckets.get(key);
  if (!rec || now - rec[0] >= WINDOW_MS) {
    rec = [now, 0];
  }
  rec[1] += 1;
  buckets.set(key, rec);
  if (rec[1] > limit) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - rec[0])) / 1000);
    return { ok: false, retryAfter: retryAfter < 1 ? 1 : retryAfter, ip: ip };
  }
  return { ok: true };
}

function ipHash(ip) {
  // Logged on rate-limit hits; never log the raw IP (§4.5).
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 12);
}

module.exports = { checkLimit, clientIp, ipHash, LIMITS };
