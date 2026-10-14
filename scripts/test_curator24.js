/* Wave 24 "The Curator, second pass" checks: verified metadata fixes,
   calibration follow-ups, and the NES system guide.

   (1) The metadata fixes are facts, checked against the shipped catalog:
       release years, character names, who named what, which site belongs
       to which game, each one verified against a source outside the
       repo during the wave (see WAVELOG wave 24 for the source list).
   (2) Genre shelves match the games' own descriptions: a precision
       platformer, an FPS demake, and a party brawler are not roguelikes.
   (3) Calibration follow-ups: long-form games the puzzle bucket still
       misread get session pins; golden-age cabinets stop seating eight.
   (4) The NES completeness gap (flagged wave 20): guide record, page,
       hub card, homebrew pack, Player deep link.
   (5) A compact grid sweep re-proves the dealt-night invariants on the
       recalibrated engine + reshelved catalog.

   Run: node scripts/test_curator24.js   (pure node, no browser)
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
const guidesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/guides.json"), "utf8"));
const packsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/homebrew-packs.json"), "utf8"));
const kidSafeIds = {};
(kidsDoc["kid-safe"] || []).forEach((k) => { kidSafeIds[k.id] = 1; });
const CAT = { games: gamesDoc.games, kidSafeIds: kidSafeIds, generated_at: gamesDoc.generated_at };
const byId = {};
CAT.games.forEach((g) => { byId[g.id] = g; });
const g = (id) => byId[id];

/* ---------------- (1) verified metadata facts ---------------- */
{
  check("fact: Robotron: 2084 is a 1982 Williams game, and it popularized twin-stick",
    g("robotron").description.includes("1982") && g("robotron").description.includes("popularized") &&
    !g("robotron").description.includes("1984") && !g("robotron").description.includes("invented"),
    g("robotron").description);
  check("fact: Alone in the Dark (1992) stars Carnby or Emily Hartwood: Aline is the 2001 sequel",
    g("alone-dark").description.includes("Emily Hartwood") && !/\bAline\b/.test(g("alone-dark").description),
    g("alone-dark").description);
  check("fact: the roguelike genre is named after Rogue (1980), not NetHack (1987)",
    g("nethack-web").description.includes("Rogue named") && !/named the genre/.test(g("nethack-web").description),
    g("nethack-web").description);
  check("fact: DOOM made the FPS a phenomenon; Wolfenstein 3D (1992) predates it in this very catalog",
    !/invented the FPS/.test(g("doom-1993").description) && g("doom-1993").description.includes("phenomenon"),
    g("doom-1993").description);
  check("fact: Angband is a great traditional roguelike, not the genre's granddaddy",
    !/granddaddy/.test(g("angband-live").description),
    g("angband-live").description);
  check("fact: Little Alchemy 2 lives at littlealchemy2.com (littlealchemy.com is the first game)",
    g("little-alchemy-2").url === "https://littlealchemy2.com/",
    g("little-alchemy-2").url);
}

/* ---------------- (2) genre shelves ---------------- */
{
  const counts = {};
  CAT.games.forEach((x) => { counts[x.genre] = (counts[x.genre] || 0) + 1; });
  check("shelves: celeste-classic (platformer) and poom (FPS demake) sit in action",
    g("celeste-classic").genre === "action" && g("poom").genre === "action",
    "celeste-classic=" + g("celeste-classic").genre + ", poom=" + g("poom").genre);
  check("shelves: kaaarot (2-4 player party brawler, per its own description) sits in multiplayer",
    g("kaaarot").genre === "multiplayer", "kaaarot=" + g("kaaarot").genre);
  check("shelves: genre census after the reshelve",
    counts.roguelike === 12 && counts.action === 41 && counts.multiplayer === 31 && CAT.games.length === 213,
    JSON.stringify(counts));
}

/* ---------------- (3) calibration follow-ups ---------------- */
{
  const ghostS = (x) => CN.estimateSession({ genre: x.genre, tags: x.tags || [] });
  const ghostC = (x) => CN.estimateCapacity({ genre: x.genre, tags: x.tags || [] });
  check("session: the long-form puzzle shelf no longer costs 10 minutes a sitting",
    CN.estimateSession(g("type-help")) === 45 && CN.estimateSession(g("trevosa")) === 30 &&
    CN.estimateSession(g("evolution-of-trust")) === 30 && CN.estimateSession(g("codecombat")) === 30 &&
    CN.estimateSession(g("tatham-puzzles")) === 20,
    "type-help 45, trevosa 30, evolution-of-trust 30, codecombat 30, tatham-puzzles 20");
  check("session: the two reshelved PICO-8 games carry sittings, not rounds",
    CN.estimateSession(g("celeste-classic")) === 20 && CN.estimateSession(g("poom")) === 20,
    "celeste-classic 20, poom 20 (action bucket would say " + ghostS(g("poom")) + ")");
  check("seats: golden-age cabinets seat two alternating, not an 8-seat lobby",
    ["1942", "centipede", "defender", "galaga88", "missile-command", "robotron", "space-invaders", "tempest"]
      .every((id) => CN.estimateCapacity(g(id)) === 2 && ghostC(g(id)) === 8),
    "8 cabinets: tag tier 8 -> pin 2");
  check("seats: a versus fighter and a co-op bubble cart seat two; jstris seats a lobby",
    CN.estimateCapacity(g("sfa2")) === 2 && CN.estimateCapacity(g("bubble-bobble-2")) === 2 &&
    CN.estimateCapacity(g("jstris")) === 8,
    "sfa2 2, bubble-bobble-2 2, jstris 8");
  check("seats: a 12-player room no longer scores Space Invaders as a room game",
    CN.playerFit(g("space-invaders"), 12).score < 40 && CN.playerFit(g("skribbl"), 12).score === 40,
    "space-invaders@" + CN.playerFit(g("space-invaders"), 12).score + " vs skribbl@40");
  check("engine: scoring version moved with the calibration",
    CN.SCORING_VERSION === "2.2.0", CN.SCORING_VERSION);
  check("overrides: totals after the follow-up pins",
    Object.keys(CN.SESSION_OVERRIDES).length === 76 && Object.keys(CN.CAPACITY_OVERRIDES).length === 22,
    Object.keys(CN.SESSION_OVERRIDES).length + " session, " + Object.keys(CN.CAPACITY_OVERRIDES).length + " capacity");
}

/* ---------------- (4) the NES guide ---------------- */
{
  const nes = guidesDoc.guides.find((x) => x.id === "system-guide-nes");
  const nesHtml = fs.readFileSync(path.join(ROOT, "guides/nes.html"), "utf8");
  const pack = packsDoc["homebrew-packs"].find((p) => p.system_id === "nes");
  check("nes guide: record complete (7 sections, Beginner, deep-link summary)",
    !!nes && nes.slug === "nes" && nes.section_count === 7 && nes.difficulty === "Beginner" &&
    nes.summary.includes("player.html?core=nes"),
    nes ? nes.title + ", " + nes.section_count + " sections" : "missing");
  check("nes guide: page carries the template, the core, and the honest FDS exception",
    nesHtml.includes('class="guide-page"') && nesHtml.includes("FCEUmm") &&
    nesHtml.includes("Famicom Disk System") && nesHtml.includes("player.html?core=nes") &&
    nesHtml.includes("coin-plate"),
    "guides/nes.html");
  check("nes guide: hub card + starter pack wired",
    fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes("guides/nes.html") &&
    !!pack && pack.guide_slug === "nes" && pack.entries.length >= 3 &&
    pack.entries.every((e) => /^https:\/\//.test(e.url)),
    pack ? pack.entries.map((e) => e.url).join(" ") : "no pack");
  /* R26 refresh: the guide count is derived from the guide pages on
     disk at runtime, not pinned — the wave-25 pin (24) went stale
     when the shelf grew to 29. */
  const guidePagesOnDisk24 = fs.readdirSync(path.join(ROOT, "guides"))
    .filter((f) => f.endsWith(".html")).length;
  check("guides: the shelf count matches the guide pages on disk (derived), packs 7",
    guidesDoc.guides.length === guidePagesOnDisk24 && packsDoc["homebrew-packs"].length === 7,
    guidesDoc.guides.length + " guides, " + packsDoc["homebrew-packs"].length + " packs");
}

/* ---------------- (5) compact grid sweep on the new state ---------------- */
{
  const groups = [1, 2, 4, 8, 12];
  const minutes = [15, 60, 120, 240];
  const vibeSets = [["party"], ["cozy", "chill"], ["competitive"]];
  let nights = 0, bad = [];
  for (const gs of groups) for (const min of minutes) for (const vb of vibeSets)
    for (const kids of [false, true]) {
      const inp = { group_size: gs, minutes: min, vibes: vb, skill: "mixed", kids: kids };
      const r = CN.dealNight(inp, CAT);
      nights++;
      if (!r.lineup.length) { bad.push(JSON.stringify(inp) + " empty"); continue; }
      if (r.total_est_minutes > min) bad.push(JSON.stringify(inp) + " overruns");
      const ids = r.lineup.map((s) => s.game_id);
      if (new Set(ids).size !== ids.length) bad.push(JSON.stringify(inp) + " repeat");
      if (kids && !ids.every((id) => kidSafeIds[id])) bad.push(JSON.stringify(inp) + " kid-unsafe pick");
    }
  check("sweep: " + nights + " nights on the recalibrated engine keep every invariant",
    bad.length === 0, bad.length ? bad.slice(0, 3).join("; ") : nights + "/" + nights + " clean");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
