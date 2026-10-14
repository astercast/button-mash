/* GET /api/health, service health (spec §1.4).
   No auth. Edge-cacheable (s-maxage=60).
   Never returns 5xx: a failing health check reports status "degraded" in a
   200 envelope (a 5xx health endpoint tells you nothing on serverless). */
"use strict";

const path = require("path");
const { ok } = require("../lib/envelope");
const { secretConfigured } = require("../lib/cronauth");
const { isConfigured: githubConfigured } = require("../lib/github");

const SERVICE = "mash-curator";
const VERSION = "1.0.0";
const SLA_S = 7 * 24 * 3600; // curator cron is weekly (Mondays), SLA 7d

// Every static JSON the site's functions depend on.
const STATIC_FILES = [
  "games.json",
  "collections.json",
  "emulators.json",
  "homebrew-packs.json",
  "kid-safe.json",
];

const FUNCTIONS = ["health", "games", "collections", "game-night", "cron/curator"];

const STARTED_AT = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const T0 = Date.now();

function loadStatic(name) {
  try {
    const full = path.join(__dirname, "..", "data", "v1", name);
    delete require.cache[require.resolve(full)];
    return { ok: true, json: require(full) };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, data: null, meta: { service: SERVICE, version: VERSION } }));
    return;
  }

  let status = "ok";
  const freshness = {};
  let staticOk = true;

  for (const name of STATIC_FILES) {
    const loaded = loadStatic(name);
    if (!loaded.ok) {
      staticOk = false;
      status = "degraded";
      freshness[name] = { present: false, error: loaded.error, within_sla: false };
      continue;
    }
    const gen = loaded.json.generated_at || null;
    let age = null;
    let within = false;
    if (gen) {
      age = Math.max(0, Math.round((Date.now() - Date.parse(gen)) / 1000));
      within = age <= SLA_S;
      if (!within) status = "degraded";
    }
    freshness[name] = { generated_at: gen, age_s: age, sla_s: SLA_S, within_sla: within };
  }

  ok(res, SERVICE, VERSION, {
    status: status,
    service: SERVICE,
    version: VERSION,
    started_at: STARTED_AT,
    uptime_s: Math.floor((Date.now() - T0) / 1000),
    node: process.version,
    functions: FUNCTIONS,
    data_freshness: freshness,
    checks: {
      static_fallback_present: staticOk,
      cron_secret_configured: secretConfigured(),
      github_token_configured: githubConfigured(),
    },
  }, { source: "live", degraded: status !== "ok", cache: "short" });
};
