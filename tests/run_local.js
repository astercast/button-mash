/* run_local.js — local test harness for the button-mash /api functions.
   Zero dependencies. Routes /api/<fn> to the real function files with
   minimal req/res shims, and serves the repo's static files (for the
   /api/v1/*.json fallback tests). NOT deployed; tests only.

   Usage: node tests/run_local.js [port]     (default 3000)
   Env:   CRON_SECRET — enables the cron auth path in tests. */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = parseInt(process.argv[2] || "3000", 10);

const ROUTES = {
  "/api/health": "../api/health.js",
  "/api/games": "../api/games.js",
  "/api/collections": "../api/collections.js",
  "/api/game-night": "../api/game-night.js",
  "/api/cron/curator": "../api/cron/curator.js",
};

const MIME = { ".json": "application/json; charset=utf-8", ".html": "text/html; charset=utf-8" };

function serveStatic(urlPath, res) {
  // Only serve api/v1/* and schema for tests (the fallback contract).
  const rel = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  if (!rel.startsWith("api/v1/") || rel.includes("..")) {
    res.statusCode = 404; res.end("not found"); return;
  }
  const full = path.join(ROOT, rel);
  fs.readFile(full, (e, data) => {
    if (e) { res.statusCode = 404; res.end("not found"); return; }
    res.setHeader("Content-Type", MIME[path.extname(full)] || "application/octet-stream");
    res.statusCode = 200;
    res.end(data);
  });
}

async function runHandler(fnPath, req, res) {
  // Warm-instance semantics: the module stays loaded between invocations,
  // like a Vercel function instance (in-memory cooldowns/state persist).
  let handler = handlerCache.get(fnPath);
  if (!handler) { handler = require(fnPath); handlerCache.set(fnPath, handler); }
  await handler(req, res);
}
const handlerCache = new Map();

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  const route = ROUTES[urlPath];
  if (route) {
    runHandler(path.join(__dirname, route), req, res).catch((e) => {
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, data: null, error: { code: "INTERNAL", message: "harness error: " + e.message } }));
      }
    });
    return;
  }
  serveStatic(req.url, res);
});

server.listen(PORT, () => console.log("harness listening on " + PORT));
