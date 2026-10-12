/* cronauth.js — CRON_SECRET bearer check (spec §1.11, §8.3).
   Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on cron
   invocations when CRON_SECRET is set. Fail closed: if CRON_SECRET is unset,
   nothing passes (a missing secret must never mean "no auth").
   Copy verbatim between the 7 server-program repos; do not fork behavior. */
"use strict";

function secretConfigured() {
  return typeof process.env.CRON_SECRET === "string" && process.env.CRON_SECRET.length >= 16;
}

// Returns true iff the request carries the valid cron/admin bearer token.
function assertCron(req) {
  if (!secretConfigured()) return false; // fail closed
  const got = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  return got === "Bearer " + process.env.CRON_SECRET;
}

module.exports = { assertCron, secretConfigured };
