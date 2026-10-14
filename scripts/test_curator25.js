/* Wave 25 "close the flagged follow-ups" checks: rotation 3 left three
   honest items on the record and this wave closes two and rules on the
   third without acting on it.

   (1) The cheat-code guide (wave 20's last flagged gap): record, page,
       hub card, sitemap, llms, homepage stat, and the facts on the page
       are the verified ones (each checked against a source outside the
       repo during the wave; see WAVELOG wave 25 for the source list).
   (2) The DuckStation license re-check: wave 24's verification search
       failed (a tool error, not a finding), so the catalog still said
       GPL-3.0. This wave's clean sources, the upstream repo's own
       license-change commit 9ca6b54 (Sept 2024, GPLv3 -> PolyForm Strict)
       and the project's current CC BY-NC-ND 4.0 license, say the record
       was stale. It is corrected, with the history kept in the notes.
   (3) The cozy/horror taxonomy call: evidence gathered (the games' own
       store pages + comparable in-catalog shelving), a recommendation
       recorded in WAVELOG, and deliberately NO reshelve. These checks
       pin the games where they were: a future human call moves them,
       not this suite going green by accident.

   Run: node scripts/test_curator25.js   (pure node, no browser)
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

const gamesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8"));
const guidesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/guides.json"), "utf8"));
const emuDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/emulators.json"), "utf8"));
const byId = {};
gamesDoc.games.forEach((g) => { byId[g.id] = g; });
const emuById = {};
(emuDoc.emulators || []).forEach((e) => { emuById[e.id] = e; });
const page = fs.readFileSync(path.join(ROOT, "guides/cheat-codes.html"), "utf8");

/* ---------------- (1) the cheat-code guide ---------------- */
{
  const rec = guidesDoc.guides.find((x) => x.id === "cheat-codes");
  check("guide: record complete (8 sections, Beginner, 12 min)",
    !!rec && rec.slug === "cheat-codes" && rec.section_count === 8 &&
    rec.difficulty === "Beginner" && rec.time_minutes === 12,
    rec ? rec.title : "missing");
  check("guide: the shelf count matches the guide pages on disk (derived, R26)",
    guidesDoc.guides.length ===
      fs.readdirSync(path.join(ROOT, "guides")).filter((f) => f.endsWith(".html")).length,
    guidesDoc.guides.length + " guides (the wave-25 pin of 24 went stale when the shelf grew)");
  check("guide: page carries the deep-dive template",
    page.includes('class="guide-page"') && page.includes('data-spy') &&
    page.includes("assets/js/guide-toc.js") && page.includes("assets/js/arcade.js") &&
    page.includes("coin-plate") && page.includes('aria-current="page"') &&
    (page.match(/<section class="guide-section"/g) || []).length === 8,
    "guide-page + spy TOC + toc.js + arcade.js + coin plate + 8 sections");
  check("fact: the Konami Code: Hashimoto, the 1986 NES Gradius port, Contra's 30 lives (1988)",
    page.includes("Kazuhisa Hashimoto") && page.includes("Gradius") && page.includes("1986") &&
    page.includes("Contra") && page.includes("30 lives"),
    "a testing aid that shipped; muscle memory ever since");
  check("fact: the Game Genie: Codemasters built it, Galoob sold it in the US, NES 1990",
    page.includes("Codemasters") && page.includes("Galoob") && page.includes("Camerica") &&
    page.includes("1990"),
    "pass-through cartridge; the game is never modified");
  check("fact: six-letter codes patch unconditionally; eight-letter codes add a compare byte",
    page.includes("Six-letter codes") && page.includes("Eight-letter codes") &&
    page.includes("compare") && page.includes("bank"),
    "the compare byte pins a patch to the right ROM bank");
  check("fact: Lewis Galoob Toys v. Nintendo, district court 1991, Ninth Circuit affirmed 1992",
    page.includes("Lewis Galoob Toys, Inc. v. Nintendo of America, Inc.") &&
    page.includes("1991") && page.includes("1992") && page.includes("fair use"),
    "no permanent derivative work; home cheat use is fair use");
  check("fact: GameShark = Datel hardware under InterAct's US brand (1996); Action Replay is Datel's own name",
    page.includes("Datel") && page.includes("InterAct") && page.includes("GameShark") &&
    page.includes("Action Replay") && page.includes("1996"),
    "same family, different badge; RAM codes in hex");
  check("fact: RetroArch's cheat search ships since 1.7.4 and works by elimination",
    page.includes("1.7.4") && page.includes("Start or Continue Cheat Search"),
    "snapshot, change the number, keep the addresses that moved the right way");
  check("guide: the Player wiring is described as shipped (per-game codes, EJS_cheats, in-game toggle)",
    page.includes("EJS_cheats") && page.includes("per game") && page.includes("../player.html"),
    "codes stored per game in the browser, injected before boot");
  check("guide: hub card + sitemap + llms + homepage stat all point at the new guide",
    fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes("guides/cheat-codes.html") &&
    fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>guides/cheat-codes.html</loc>") &&
    fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("cheat-codes") &&
    fs.readFileSync(path.join(ROOT, "index.html"), "utf8").includes(guidesDoc.guides.length + " guides"),
    "emulation hub deep-dives (9 cards), sitemap, llms, homepage stats line names the derived guide count");
  check("guide: no AI-slop phrasing in the new prose",
    !/delve|unlock the power|game-changer|elevate your|fast-paced world|whether you.re a beginner or a pro/i.test(page),
    "denylist clean");
  check("guide: legal lane, no ROM/BIOS download phrasing",
    !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(page),
    "codes are numbers, not downloads");
}

/* ---------------- (2) the DuckStation license re-check ---------------- */
{
  const d = emuById["duckstation"];
  check("duckstation: license corrected to CC BY-NC-ND 4.0",
    !!d && d.license === "CC BY-NC-ND 4.0", d ? d.license : "missing");
  check("duckstation: the notes keep the history (GPL-3.0 until the Sept 2024 relicense)",
    !!d && /Sept 2024/.test(d.notes) && /GPL-3\.0 until then/.test(d.notes) &&
    /not open source/.test(d.notes),
    d ? d.notes : "missing");
  check("duckstation: the correction is surgical, the other licenses are untouched",
    emuById["retroarch"].license === "GPL-3.0" && emuById["mgba"].license === "MPL-2.0" &&
    emuById["ppsspp"].license === "GPL-2.0+" && emuById["emulatorjs"].license === "GPL-3.0" &&
    (emuDoc.emulators || []).every((e) => e.id === "duckstation" || /GPL|MPL|MIT/.test(e.license)),
    (emuDoc.emulators || []).length + " emulators; duckstation is the only non-open license (R26: the catalog total is derived, not pinned — it grew past 10 when mesen was added, GPL-3.0)");
}

/* ---------------- (3) taxonomy: evidence recorded, nothing moved ---------------- */
{
  const counts = {};
  gamesDoc.games.forEach((x) => { counts[x.genre] = (counts[x.genre] || 0) + 1; });
  check("taxonomy: purrgatory and lookouts are still shelved in horror (no reshelve without a human call)",
    byId["purrgatory"].genre === "horror" && byId["lookouts"].genre === "horror",
    "purrgatory=" + byId["purrgatory"].genre + ", lookouts=" + byId["lookouts"].genre);
  check("taxonomy: the census is unchanged by this wave",
    counts.horror === 6 && counts.cozy === 16 && gamesDoc.games.length === 213,
    JSON.stringify(counts));
  check("taxonomy: the evidence + recommendation are on the record in WAVELOG",
    fs.readFileSync(path.join(ROOT, "WAVELOG.md"), "utf8").includes("Taxonomy recommendation"),
    "WAVELOG wave 25 carries the call for a human to make");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
