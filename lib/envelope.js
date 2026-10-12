/* envelope.js — shared API envelope helpers (spec §1.1, §1.6, §1.9).
   Copy verbatim between the 7 server-program repos; do not fork behavior. */
"use strict";

const crypto = require("crypto");

function newRequestId() {
  return "req_" + crypto.randomBytes(3).toString("hex");
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function baseMeta(service, version) {
  return {
    service: service,
    version: version,
    generated_at: nowIso(),
    request_id: newRequestId(),
  };
}

// opts: { source, degraded, staleSince, upstream, note, cache }
// cache: "public" (default: s-maxage=600, SWR=86400 per §1.6),
//        "short"  (health: s-maxage=60, SWR=3600),
//        "none"   (no-store: cron/admin/POST/errors)
function ok(res, service, version, data, opts) {
  opts = opts || {};
  const meta = baseMeta(service, version);
  meta.source = opts.source || "live";
  meta.degraded = opts.degraded === true;
  meta.stale_since = opts.staleSince || null;
  meta.upstream = Array.isArray(opts.upstream) ? opts.upstream : [];
  meta.note = opts.note || null;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (opts.cache === "none") {
    res.setHeader("Cache-Control", "no-store");
  } else if (opts.cache === "short") {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  }
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, data: data, meta: meta }));
}

// Errors are never cached (a cached 5xx poisons the edge for everyone).
function err(res, service, version, httpStatus, code, message, details) {
  const meta = baseMeta(service, version);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = httpStatus;
  const body = { ok: false, data: null, meta: meta, error: { code: code, message: message } };
  if (details && typeof details === "object") body.error.details = details;
  res.end(JSON.stringify(body));
}

module.exports = { ok, err, newRequestId, nowIso };
