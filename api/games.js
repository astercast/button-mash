/* GET /api/games — curated browser-game catalog (spec §7.7).
   Query: ?genre= ?q= ?players= ?system= ?limit= (default 50, max 200)
   Reads the repo's api/v1/games.json (the legal-lane corpus: 213 curl-verified
   browser games). Fallback: /api/v1/games.json (static).
   Rate limit: public bucket (60/min per IP). */
"use strict";

const { ok, err } = require("../lib/envelope");
const { checkLimit, ipHash } = require("../lib/ratelimit");
const { multiplayerOk, gameVibes, WEB_SYSTEM_ALIASES } = require("../lib/game-night");

const SERVICE = "mash-curator";
const VERSION = "1.0.0";

function loadCatalog() {
  const gamesEnv = require("./v1/games.json");
  const kidEnv = require("./v1/kid-safe.json");
  const kidIds = new Set((kidEnv["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id));
  return { games: gamesEnv.games || [], generated_at: gamesEnv.generated_at || null, kidIds: kidIds };
}

const KNOWN_GENRES = ["puzzle", "action", "roguelike", "idle", "multiplayer", "retro", "horror", "cozy"];

module.exports = (req, res) => {
  if (req.method !== "GET") {
    return err(res, SERVICE, VERSION, 405, "BAD_INPUT", "Only GET is supported on /api/games.", null);
  }

  const lim = checkLimit(req, "public");
  if (!lim.ok) {
    console.log("[ratelimit] ip=" + ipHash(lim.ip) + " bucket=public path=/api/games");
    res.setHeader("Retry-After", String(lim.retryAfter));
    return err(res, SERVICE, VERSION, 429, "RATE_LIMITED",
      "Too many requests — slow down and try again in " + lim.retryAfter + "s.", null);
  }

  const url = new URL(req.url, "http://localhost");
  const qp = url.searchParams;
  const fields = [];

  const genre = qp.get("genre");
  if (genre && KNOWN_GENRES.indexOf(genre.toLowerCase()) === -1) {
    return err(res, SERVICE, VERSION, 400, "BAD_INPUT",
      "Unknown genre '" + genre + "'. Known genres: " + KNOWN_GENRES.join(", ") + ".",
      { fields: ["genre"] });
  }

  const q = (qp.get("q") || "").trim().toLowerCase();

  const playersRaw = qp.get("players");
  let players = null;
  if (playersRaw !== null) {
    players = parseInt(playersRaw, 10);
    if (!Number.isFinite(players) || players < 1 || players > 99) {
      return err(res, SERVICE, VERSION, 400, "BAD_INPUT",
        "players must be a whole number of 1 or more (1 = solo, 2+ = needs a group-friendly game).",
        { fields: ["players"] });
    }
  }

  const systemRaw = qp.get("system");
  let systemNote = null;
  let systemBlocked = false;
  if (systemRaw) {
    const s = systemRaw.toLowerCase();
    if (WEB_SYSTEM_ALIASES.indexOf(s) === -1) {
      systemBlocked = true;
      systemNote = "The games catalog is browser games only; system='" + systemRaw +
        "' lives in emulator/ROM territory and matches nothing here. Use system=browser (or omit it).";
    }
  }

  let limit = 50;
  const limitRaw = qp.get("limit");
  if (limitRaw !== null) {
    limit = parseInt(limitRaw, 10);
    if (!Number.isFinite(limit)) {
      return err(res, SERVICE, VERSION, 400, "BAD_INPUT",
        "limit must be a whole number between 1 and 200.",
        { fields: ["limit"] });
    }
    if (limit < 1) limit = 1;
    if (limit > 200) limit = 200;
  }

  const cat = loadCatalog();
  const t0 = Date.now();
  let matched;
  if (systemBlocked) {
    matched = [];
  } else {
    matched = cat.games.filter((g) => {
      if (genre && g.genre !== genre.toLowerCase()) return false;
      if (players !== null && players >= 2 && !multiplayerOk(g)) return false;
      if (q) {
        const hay = (g.title + " " + g.description + " " + g.id).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  const games = matched.slice(0, limit).map((g) => ({
    id: g.id,
    title: g.title,
    url: g.url,
    genre: g.genre,
    description: g.description,
    controls: g.controls,
    tags: g.tags || [],
    system: "browser",
    multiplayer: multiplayerOk(g),
    kid_safe: cat.kidIds.has(g.id),
    vibes: Array.from(gameVibes(g)).sort(),
  }));

  ok(res, SERVICE, VERSION, {
    games: games,
    count: games.length,
    total: matched.length,
    filters: { genre: genre || null, q: q || null, players: players, system: systemRaw || null, limit: limit },
    note: systemNote,
    generated_at: cat.generated_at,
  }, {
    source: "live",
    upstream: [{
      source: "repo:api/v1/games.json",
      ok: true,
      checked_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      latency_ms: Date.now() - t0,
    }],
  });
};
