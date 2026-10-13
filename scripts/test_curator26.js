/* Wave 26 "accuracy sweep" checks: the blanket-claim audit.

   Wave 25 corrected DuckStation's catalog record to CC BY-NC-ND 4.0 —
   source-available since Sept 2024, not open source. That one fact made
   every blanket "emulators are open-source" line on the site strictly
   false. This wave:

   (1) Fixes the flagged emulation-hub hero ("legal, open-source, and
       fascinating" -> "legal, fascinating, and mostly open-source") and
       the same blanket in the how-emulation-works legal note.
   (2) Audits the other absolute claims in emulator/game copy against
       the data and sources outside the repo (see WAVELOG wave 26 for
       the full checked/fixed/left list). The true ones are pinned here
       exactly as written so a future "accuracy" pass cannot soften
       claims that were never wrong. One claim could not be verified —
       Mindustry's "the web build is the full game" — so the superlative
       no longer ships; its verified part (GPL-3.0, open source) stays.
   (3) Pins the catalog census: the cozy/horror taxonomy call is still
       a human's to make, so horror 6 / cozy 16 must not move here.

   Run: node scripts/test_curator26.js   (pure node, no browser)
   Exit 0 = all pass. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = "/home/hatch/workspace/button-mash";
let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, "—", detail); }
  else { failures++; console.error("FAIL", name, "—", detail); }
}

const gamesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8"));
const emuDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/emulators.json"), "utf8"));
const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
const byId = {};
gamesDoc.games.forEach((g) => { byId[g.id] = g; });
const emuHtml = fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8");
const howEmu = fs.readFileSync(path.join(ROOT, "guides/how-emulation-works.html"), "utf8");

/* ---------------- (1) the two blanket fixes ---------------- */
{
  check("hero: emulation hub lede carries the corrected wording",
    emuHtml.includes("legal, fascinating, and mostly open-source"),
    "legal, fascinating, and mostly open-source");
  check("hero: the old blanket wording is gone from the hub",
    !emuHtml.includes("legal, open-source, and fascinating"),
    "no blanket survives on the flagged page");
  check("guide: how-emulation-works legal note carries the same correction",
    howEmu.includes("legal, and mostly open-source") && !howEmu.includes("legal and open-source"),
    "one blanket, two homes, both fixed");
  const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"))
    .map((f) => fs.readFileSync(path.join(ROOT, f), "utf8"))
    .concat(fs.readdirSync(path.join(ROOT, "guides")).filter((f) => f.endsWith(".html"))
      .map((f) => fs.readFileSync(path.join(ROOT, "guides", f), "utf8")));
  check("site-wide: no page still calls emulators open-source as a blanket",
    htmlFiles.every((h) => !/legal, open-source|legal and open-source/i.test(h)),
    htmlFiles.length + " html pages scanned");
  check("catalog: 'mostly' is arithmetic, not a hedge — 9 of 10 licenses are open",
    emuDoc.emulators.length === 10 &&
    emuDoc.emulators.filter((e) => e.id !== "duckstation").every((e) => /GPL|MPL|MIT/.test(e.license)) &&
    emuDoc.emulators.find((e) => e.id === "duckstation").license === "CC BY-NC-ND 4.0",
    "only DuckStation is source-available; the rest carry GPL/MPL/MIT licenses");
}

/* ---------------- (2) audit: true claims stay exactly as written ---------------- */
{
  check("left true: play-legal names three emulators, and all three are open source",
    fs.readFileSync(path.join(ROOT, "play-legal.html"), "utf8")
      .includes("EmulatorJS, RetroArch, mGBA — all legal, all open-source"),
    "specific list, verified against data/v1/emulators.json (GPL-3.0, GPL-3.0, MPL-2.0)");
  check("left true: the Player is powered by the open-source EmulatorJS engine",
    fs.readFileSync(path.join(ROOT, "player.html"), "utf8").includes("Powered by the open-source"),
    "EmulatorJS is GPL-3.0");
  check("left true: SameBoy and RetroArch keep their open-source descriptions",
    fs.readFileSync(path.join(ROOT, "guides/gameboy.html"), "utf8").includes("beautifully maintained and open source") &&
    fs.readFileSync(path.join(ROOT, "guides/retroarch-setup.html"), "utf8").includes("free, open-source frontend"),
    "SameBoy MIT, RetroArch GPL-3.0 — both in the catalog's license data");
  const osGames = ["clumsy-bird", "astray", "hexgl", "swarm-sim", "bitburner", "dcss-webtiles",
    "floodlines", "hydro-operator", "skystack", "classicube", "synergism", "arras-io"];
  check("left true: every game described as open source in its own description still is",
    osGames.every((id) => byId[id] && /open[ -]source/i.test(byId[id].description)),
    osGames.length + " descriptions pinned (public source repos / the HydroEngineer dev's own open-source announcement)");
  const osShelf = (colsDoc.collections || []).find((c) => c.id === "open-source-web");
  check("left true: the open-source-web shelf holds exactly its six verified games",
    !!osShelf && JSON.stringify(osShelf.game_ids) ===
      JSON.stringify(["bitburner", "mindustry", "shapez", "dcss-webtiles", "angband-live", "nethack-web"]),
    "bitburner, mindustry (GPL-3.0), shapez (GPL-3.0), dcss, angband, nethack — all public codebases");
  check("left true: the spot-checked free claims stand",
    /Completely free chess/.test(byId["lichess"].description) &&
    /no signup/.test(byId["playok"].description) &&
    /official free Tetris/i.test(byId["tetris-official"].description) &&
    /free in the browser/.test(byId["minecraft-classic"].description) &&
    /Free tier included/.test(byId["geoguessr"].description),
    "lichess (free forever, no account needed), playok, tetris, minecraft classic, geoguessr free tier");
  check("fixed: Mindustry keeps its verified open-source claim, loses the unverifiable one",
    byId["mindustry"].description.includes("Open-source factory defense") &&
    !byId["mindustry"].description.includes("full game") &&
    byId["mindustry"].description.includes("runs right in your browser"),
    "no outside source settles what the web build contains; the sentence now only says what can be checked");
}

/* ---------------- (3) nothing else moved ---------------- */
{
  const counts = {};
  gamesDoc.games.forEach((x) => { counts[x.genre] = (counts[x.genre] || 0) + 1; });
  check("census unchanged: 213 games, horror 6, cozy 16 (taxonomy still a human call)",
    gamesDoc.games.length === 213 && counts.horror === 6 && counts.cozy === 16 &&
    byId["purrgatory"].genre === "horror" && byId["lookouts"].genre === "horror",
    JSON.stringify(counts));
  check("no AI-slop phrasing in the corrected copy",
    !/delve|unlock the power|game-changer|elevate your|fast-paced world/i.test(emuHtml.split("mostly open-source")[0].slice(-200)),
    "denylist clean around the edit");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
