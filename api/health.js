/* GET /api/health — PortPlay service health.
   No auth. Edge-cacheable (s-maxage=60).
   Never returns 5xx: a failing check reports status "degraded" in a 200
   envelope (a 5xx health endpoint tells you nothing on serverless).
   PortPlay is a static site with one dynamic surface: this endpoint.
   The converter and player run entirely in the visitor's browser. */
"use strict";

const fs = require("fs");
const path = require("path");
const { ok } = require("../lib/envelope");

const SERVICE = "portplay";
const VERSION = "2.0.0";
const FUNCTIONS = ["health"];

// Static files the pages depend on at runtime.
const STATIC_FILES = ["data/v1/coverage.json"];

function fileState(rel) {
  try {
    const st = fs.statSync(path.join(process.cwd(), rel));
    return { path: rel, exists: true, bytes: st.size };
  } catch (e) {
    return { path: rel, exists: false, bytes: 0 };
  }
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: { code: "method_not_allowed", message: "GET only" } }));
    return;
  }
  const files = STATIC_FILES.map(fileState);
  const degraded = files.some((f) => !f.exists);
  ok(res, SERVICE, VERSION, {
    status: degraded ? "degraded" : "ok",
    service: SERVICE,
    functions: FUNCTIONS,
    static_files: files,
    note: "Conversion and play happen entirely in the visitor's browser; this endpoint only reports that the static coverage data shipped.",
  }, { source: "filesystem", cache: "short", degraded });
};
