/* GET /api/collections, hand-built game collections (spec §7.7).
   Query: ?id= (optional), single collection, else all 22.
   Reads the repo's data/v1/collections.json, resolving each game_id to its
   real catalog entry (title/url/genre from games.json, never invented).
   Fallback: /data/v1/collections.json (static).
   Rate limit: public bucket (60/min per IP). */
"use strict";

const { ok, err } = require("../lib/envelope");
const { checkLimit, ipHash } = require("../lib/ratelimit");

const SERVICE = "mash-curator";
const VERSION = "1.0.0";

function loadData() {
  const colEnv = require("../data/v1/collections.json");
  const gamesEnv = require("../data/v1/games.json");
  const byId = {};
  (gamesEnv.games || []).forEach((g) => { byId[g.id] = g; });
  return { collections: colEnv.collections || [], generated_at: colEnv.generated_at || null, byId: byId };
}

function shape(col, byId) {
  const games = (col.game_ids || []).map((id) => {
    const g = byId[id];
    if (!g) return { id: id, title: null, url: null, genre: null, missing: true };
    return { id: g.id, title: g.title, url: g.url, genre: g.genre };
  });
  return {
    id: col.id,
    title: col.title,
    tagline: col.tagline || null,
    description: col.description || null,
    game_count: games.length,
    games: games,
  };
}

module.exports = (req, res) => {
  if (req.method !== "GET") {
    return err(res, SERVICE, VERSION, 405, "BAD_INPUT", "Only GET is supported on /api/collections.", null);
  }

  const lim = checkLimit(req, "public");
  if (!lim.ok) {
    console.log("[ratelimit] ip=" + ipHash(lim.ip) + " bucket=public path=/api/collections");
    res.setHeader("Retry-After", String(lim.retryAfter));
    return err(res, SERVICE, VERSION, 429, "RATE_LIMITED",
      "Too many requests, slow down and try again in " + lim.retryAfter + "s.", null);
  }

  const url = new URL(req.url, "http://localhost");
  const id = url.searchParams.get("id");
  const data = loadData();
  const t0 = Date.now();

  let cols = data.collections;
  if (id) {
    const found = cols.find((c) => c.id === id);
    if (!found) {
      return err(res, SERVICE, VERSION, 404, "NOT_FOUND",
        "No collection with id '" + id + "'.", { id: id });
    }
    cols = [found];
  }

  ok(res, SERVICE, VERSION, {
    collections: cols.map((c) => shape(c, data.byId)),
    count: cols.length,
    generated_at: data.generated_at,
  }, {
    source: "live",
    upstream: [{
      source: "repo:data/v1/collections.json",
      ok: true,
      checked_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      latency_ms: Date.now() - t0,
    }],
  });
};
