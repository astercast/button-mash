/* Wave 22 "Game Night 2.0" calibration checks: the Curator engine's
   session / seats / energy buckets, calibrated against the real catalog.

   (1) Every hand-pinned override names a real catalog game and actually
       changes the value its genre/tag bucket would have produced, a dead
       or stale override fails here, not in production.
   (2) Named spot checks: the games the old buckets plainly misread.
   (3) Graded fits behave like the room does: pass-and-play decays as the
       group grows; session fit peaks near the night's slot size.
   (4) A grid sweep over the full input space (7 group sizes × 8 night
       lengths × 5 vibe sets × 3 skill mixes × kids on/off = 1,680 nights)
       asserting the invariants every dealt night must keep: non-empty,
       inside the timebox, breakdown sums, no repeat picks, kids nights
       all kid-safe, curve roles at the edges.

   Run: node scripts/test_gamenight22.js   (pure node, no browser)
   Exit 0 = all pass. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = "/home/hatch/workspace/button-mash";
let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, ", ", detail); }
  else { failures++; console.error("FAIL", name, ", ", detail); }
}

const CN = require(path.join(ROOT, "assets/js/curator-night.js"));
const gamesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8"));
const kidsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"));
const kidSafeIds = {};
(kidsDoc["kid-safe"] || []).forEach((k) => { kidSafeIds[k.id] = 1; });
const CAT = { games: gamesDoc.games, kidSafeIds: kidSafeIds, generated_at: gamesDoc.generated_at };
const byId = {};
CAT.games.forEach((g) => { byId[g.id] = g; });
const g = (id) => byId[id];

/* What the un-calibrated bucket would say: genre base + tag max, ignoring
   overrides. Recomputed here from the engine's own published tables via a
   stripped game object (id removed so no override can fire). */
function bucketSession(game) {
  const ghost = { genre: game.genre, tags: game.tags || [] };
  return CN.estimateSession(ghost);
}
function bucketCapacity(game) {
  const ghost = { genre: game.genre, tags: game.tags || [] };
  return CN.estimateCapacity(ghost);
}

/* ---------------- (1) overrides are real and load-bearing ---------------- */
{
  const sIds = Object.keys(CN.SESSION_OVERRIDES);
  check("session overrides: 60+ hand-pinned games", sIds.length >= 60, sIds.length + " pins");
  check("session overrides: every id is a real catalog game",
    sIds.every((id) => !!byId[id]), "no invented ids");
  check("session overrides: every pin changes its bucket value",
    sIds.every((id) => CN.SESSION_OVERRIDES[id] !== bucketSession(byId[id])),
    "no dead pins");
  check("session overrides: every value is a sane sitting (5-60 min)",
    sIds.every((id) => CN.SESSION_OVERRIDES[id] >= 5 && CN.SESSION_OVERRIDES[id] <= 60),
    "5..60");
  const cIds = Object.keys(CN.CAPACITY_OVERRIDES);
  check("capacity overrides: every id is a real catalog game",
    cIds.every((id) => !!byId[id]), cIds.length + " pins, all real");
  check("capacity overrides: every pin changes its tier value",
    cIds.every((id) => CN.CAPACITY_OVERRIDES[id] !== bucketCapacity(byId[id])),
    "no dead pins");
}

/* ---------------- (2) the misreads that motivated the wave ---------------- */
{
  check("session: Civilization is not a 10-min sitting",
    CN.estimateSession(g("civ1")) === 60 && bucketSession(g("civ1")) === 10,
    "civ1 10 -> 60");
  check("session: untagged arcade rounds keep the 10-min base",
    CN.estimateSession(g("dig-dug")) === 10 && CN.estimateSession(g("space-invaders")) === 20,
    "dig-dug 10 (base), space-invaders 20 (shooter tag tweak, pre-existing)");
  check("session: daily puzzles are 5, builders are long",
    CN.estimateSession(g("wordle")) === 5 && CN.estimateSession(g("shapez")) === 45 &&
    CN.estimateSession(g("wbwwb")) === 5 && CN.estimateSession(g("nethack-web")) === 60,
    "wordle 5, shapez 45, wbwwb 5, nethack 60");
  check("session: narrative idles outgrew the 5-min clicker bucket",
    CN.estimateSession(g("a-dark-room")) === 30 && CN.estimateSession(g("cookie-clicker")) === 5,
    "a-dark-room 30, cookie-clicker 5");
  check("seats: a chess duel is not a drawing room",
    CN.estimateCapacity(g("lichess")) === 2 && CN.estimateCapacity(g("skribbl")) === 12 &&
    CN.estimateCapacity(g("pokemon-showdown")) === 2 && CN.estimateCapacity(g("colonist")) === 4,
    "lichess 2, skribbl 12, showdown 2, colonist 4");
  check("seats: solo games seat one, lobbies seat eight",
    CN.estimateCapacity(g("2048")) === 1 && CN.estimateCapacity(g("bloxd")) === 8 &&
    CN.estimateCapacity(g("classicube")) === 8,
    "2048 1, bloxd 8, classicube 8 (override)");
  check("energy: shooters loud, word games low, puzzles steady",
    CN.estimateEnergy(g("krunker")) === 3 && CN.estimateEnergy(g("jklm")) === 1 &&
    CN.estimateEnergy(g("2048")) === 2 && CN.estimateEnergy(g("cookie-clicker")) === 1,
    "krunker 3, jklm (word tag) 1, 2048 2, cookie-clicker 1");
}

/* ---------------- (3) graded fits ---------------- */
{
  const solo = g("2048");
  const p2 = CN.playerFit(solo, 2).score, p4 = CN.playerFit(solo, 4).score;
  const p8 = CN.playerFit(solo, 8).score, p12 = CN.playerFit(solo, 12).score;
  check("player fit: pass-and-play decays as the room grows",
    p2 > p4 && p4 > p8 && p8 >= p12 && p2 === 26 && p12 === 6,
    "2:" + p2 + " 4:" + p4 + " 8:" + p8 + " 12:" + p12);
  check("player fit: a room game never decays",
    CN.playerFit(g("skribbl"), 12).score === 40 && CN.playerFit(g("skribbl"), 2).score === 40,
    "skribbl 40 at 2 and at 12");
  check("player fit: over-seat tables taper, never crater",
    CN.playerFit(g("colonist"), 6).score === 28 && CN.playerFit(g("colonist"), 12).score === 14,
    "colonist seats 4: group 6 -> 28, group 12 -> 14 (floor)");
  const fit = (est, min) => CN.sessionFit(est, min).score;
  check("session fit: peaks at slot size, decays both ways",
    fit(15, 60) === 20 && fit(5, 240) === 8 && fit(30, 60) === 13 &&
    fit(60, 60) === 6 && fit(45, 30) === 2,
    "15@60=20, 5@240=8, 30@60=13 (long for slot), 60@60=6 (eats the night), 45@30=2 (longer than the night)");
  check("session fit: a perfect-fit main beats a blink on a long night",
    fit(30, 240) > fit(5, 240), "30-min main outscores the 5-min clicker at 240 min");
}

/* ---------------- (4) the grid sweep ---------------- */
{
  const groups = [1, 2, 3, 4, 6, 8, 12];
  const minutes = [15, 30, 45, 60, 90, 120, 180, 240];
  const vibeSets = [["party"], ["cozy", "chill"], ["competitive"], ["chaotic"], ["party", "competitive"]];
  const skills = ["mixed", "casual", "gamers"];
  let nights = 0, bad = [];
  for (const gs of groups) for (const min of minutes) for (const vb of vibeSets)
    for (const sk of skills) for (const kids of [false, true]) {
      const inp = { group_size: gs, minutes: min, vibes: vb, skill: sk, kids: kids };
      const r = CN.dealNight(inp, CAT);
      nights++;
      const tag = JSON.stringify(inp);
      if (!r.lineup.length) { bad.push(tag + " empty"); continue; }
      if (r.total_est_minutes > min) bad.push(tag + " overruns " + r.total_est_minutes + ">" + min);
      const ids = r.lineup.map((s) => s.game_id);
      if (new Set(ids).size !== ids.length) bad.push(tag + " repeat pick");
      if (!r.lineup.every((s) => byId[s.game_id])) bad.push(tag + " non-catalog pick");
      if (!r.lineup.every((s) =>
        s.score_breakdown.players + s.score_breakdown.session + s.score_breakdown.vibe +
        s.score_breakdown.skill + s.score_breakdown.kids === s.score)) bad.push(tag + " breakdown mismatch");
      if (!r.lineup.every((s) => s.capacity >= 1 && s.capacity <= 12 && s.energy >= 1 && s.energy <= 3 &&
        s.energy_label && s.session_est >= 5 && s.session_est <= 60)) bad.push(tag + " estimate out of range");
      if (kids && !r.lineup.every((s) => s.kid_safe)) bad.push(tag + " non-kid-safe pick on a kids night");
      if (r.lineup.length >= 2 &&
        (r.lineup[0].role !== "warmup" || r.lineup[r.lineup.length - 1].role !== "cooldown")) {
        bad.push(tag + " curve edges wrong: " + r.lineup.map((s) => s.role).join(">"));
      }
      if (gs >= 2 && r.lineup.length >= 3 &&
        !r.lineup.some((s) => s.role === "showdown")) bad.push(tag + " group night without a showdown");
      if (gs === 1 && r.lineup.some((s) => s.role === "showdown")) bad.push(tag + " solo night dealt a showdown");
    }
  check("grid sweep: " + nights + " nights keep every invariant",
    bad.length === 0, bad.length ? bad.slice(0, 5).join(" | ") : nights + "/1680 clean");

  /* Determinism across the sweep's hardest corner. */
  const hard = { group_size: 12, minutes: 240, vibes: ["chaotic"], skill: "gamers", kids: false };
  const a = CN.dealNight(hard, CAT), b = CN.dealNight(hard, CAT);
  check("grid sweep: the hardest corner is deterministic",
    JSON.stringify(a.lineup.map((s) => s.game_id)) === JSON.stringify(b.lineup.map((s) => s.game_id)),
    a.lineup.length + " slots, ~" + a.total_est_minutes + " min");

  /* Sample nights, printed for the wavelog, a human reads these. */
  const samples = [
    { group_size: 6, minutes: 120, vibes: ["chaotic", "party"], skill: "mixed", kids: false },
    { group_size: 2, minutes: 60, vibes: ["cozy", "chill"], skill: "casual", kids: false },
    { group_size: 12, minutes: 120, vibes: ["party"], skill: "mixed", kids: false },
    { group_size: 1, minutes: 240, vibes: ["chill"], skill: "mixed", kids: false },
    { group_size: 5, minutes: 60, vibes: ["party"], skill: "casual", kids: true },
    { group_size: 3, minutes: 15, vibes: ["party"], skill: "mixed", kids: false },
  ];
  for (const s of samples) {
    const r = CN.dealNight(s, CAT);
    console.log("SAMPLE", JSON.stringify(s), "->",
      r.lineup.map((x) => x.title + " [" + x.role + ", ~" + x.session_est + "m, " + x.energy_label +
        (x.capacity > 1 ? ", seats ~" + x.capacity : "") + "]").join(" | "),
      "= ~" + r.total_est_minutes + "m");
  }
}

console.log(failures === 0 ? "ALL PASS" : failures + " FAILURES");
process.exit(failures ? 1 : 0);
