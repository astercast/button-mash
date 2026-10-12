/* POST /api/game-night — the Curator's game-night engine (spec §7.7).
   Stateless deterministic compute: group size, time available, vibe in;
   lineup out. Nothing stored. The engine can only pick from the repo's
   213-game legal browser catalog — that is the safety property.

   Body: { group_size: 1-12, minutes: 15-240,
           vibe: ["cozy"|"chaotic"|"competitive"|"party"|"chill"],
           systems?: ["browser"|...], kids?: bool }
   Response data: { lineup: [{game_id,title,url,genre,score,score_breakdown,why,slot_minutes}],
                    plan_notes[], scored_from, metadata_as_of, scoring_version,
                    inputs_echo, no_lineup_reason }
   An impossible request (e.g. systems=["ps1"]) returns an honest empty
   lineup with plan_notes explaining why — never invented games.

   Rate limit: compute bucket (20/min per IP). Cache: no-store. */
"use strict";

const { ok, err } = require("../lib/envelope");
const { checkLimit, ipHash } = require("../lib/ratelimit");
const { pickLineup, SCORING_VERSION, KNOWN_VIBES } = require("../lib/game-night");

const SERVICE = "mash-curator";
const VERSION = "1.0.0";
const MAX_BODY = 16 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    req.on("data", (c) => {
      bytes += c.length;
      if (bytes > MAX_BODY) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function validate(body) {
  const bad = [];
  const clean = {};

  // group_size: int 1..12
  if (typeof body.group_size !== "number" || !Number.isInteger(body.group_size)) {
    bad.push("group_size (required: whole number 1-12, how many players)");
  } else if (body.group_size < 1 || body.group_size > 12) {
    bad.push("group_size (must be between 1 and 12)");
  } else {
    clean.group_size = body.group_size;
  }

  // minutes: int 15..240
  if (typeof body.minutes !== "number" || !Number.isInteger(body.minutes)) {
    bad.push("minutes (required: whole number 15-240, how long you have)");
  } else if (body.minutes < 15 || body.minutes > 240) {
    bad.push("minutes (must be between 15 and 240)");
  } else {
    clean.minutes = body.minutes;
  }

  // vibe: non-empty array (or single string) of known vibes
  let vibes = body.vibe;
  if (typeof vibes === "string") vibes = [vibes];
  if (!Array.isArray(vibes) || vibes.length === 0) {
    bad.push("vibe (required: one or more of " + KNOWN_VIBES.join(", ") + ")");
  } else {
    const unknown = vibes.filter((v) => KNOWN_VIBES.indexOf(String(v).toLowerCase()) === -1);
    if (unknown.length > 0) {
      bad.push("vibe (unknown vibe(s): " + unknown.join(", ") + " — pick from " + KNOWN_VIBES.join(", ") + ")");
    } else {
      clean.vibes = vibes.map((v) => String(v).toLowerCase());
    }
  }

  // systems: optional array of strings
  if (body.systems !== undefined) {
    let sys = body.systems;
    if (typeof sys === "string") sys = [sys];
    if (!Array.isArray(sys) || sys.some((s) => typeof s !== "string")) {
      bad.push("systems (optional: array of system names, e.g. [\"browser\"])");
    } else {
      clean.systems = sys;
    }
  } else {
    clean.systems = null;
  }

  // kids: optional bool
  if (body.kids !== undefined) {
    if (typeof body.kids !== "boolean") {
      bad.push("kids (optional: true/false — true restricts to the kid-safe corpus)");
    } else {
      clean.kids = body.kids;
    }
  } else {
    clean.kids = false;
  }

  return { bad: bad, clean: clean };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return err(res, SERVICE, VERSION, 405, "BAD_INPUT",
      "Use POST with a JSON body on /api/game-night. Example: {\"group_size\": 4, \"minutes\": 60, \"vibe\": [\"party\"]}.",
      null);
  }

  const lim = checkLimit(req, "compute");
  if (!lim.ok) {
    console.log("[ratelimit] ip=" + ipHash(lim.ip) + " bucket=compute path=/api/game-night");
    res.setHeader("Retry-After", String(lim.retryAfter));
    return err(res, SERVICE, VERSION, 429, "RATE_LIMITED",
      "Too many requests — slow down and try again in " + lim.retryAfter + "s.", null);
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch (e) {
    return err(res, SERVICE, VERSION, 400, "BAD_INPUT", "Could not read the request body.", null);
  }
  let body;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch (e) {
    return err(res, SERVICE, VERSION, 400, "BAD_INPUT",
      "Body is not valid JSON. Send {\"group_size\": 4, \"minutes\": 60, \"vibe\": [\"party\"]}.",
      { fields: ["body"] });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return err(res, SERVICE, VERSION, 400, "BAD_INPUT",
      "Body must be a JSON object like {\"group_size\": 4, \"minutes\": 60, \"vibe\": [\"party\"]}.",
      { fields: ["body"] });
  }

  const v = validate(body);
  if (v.bad.length > 0) {
    return err(res, SERVICE, VERSION, 400, "BAD_INPUT",
      "That game-night request doesn't check out: " + v.bad.join("; ") + ".",
      { fields: v.bad });
  }

  const gamesEnv = require("../data/v1/games.json");
  const kidEnv = require("../data/v1/kid-safe.json");
  const catalog = {
    games: gamesEnv.games || [],
    kidSafeIds: new Set((kidEnv["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id)),
    generated_at: gamesEnv.generated_at || null,
  };

  const result = pickLineup(v.clean, catalog);

  ok(res, SERVICE, VERSION, {
    lineup: result.lineup,
    plan_notes: result.plan_notes,
    scored_from: result.scored_from,
    no_lineup_reason: result.no_lineup_reason,
    scoring_version: SCORING_VERSION,
    scoring_weights: { players: 40, session: 30, vibe: 20, kids: 10 },
    metadata_as_of: catalog.generated_at,
    inputs_echo: v.clean,
  }, { source: "live", cache: "none" });
};
