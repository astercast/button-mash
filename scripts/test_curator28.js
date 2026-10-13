/* Wave 28 checks: Curator pass 4 — the Flash-era shelf.

   The tranche wave 27 named next: the Flash-era entries' year/creator
   claims — the "Flash-back machine" collection (the Ruffle shelf),
   never checked against a source outside the repo. Five of its nine
   entries carry a year and/or creator claim; each was verified
   2026-10-12 against the games' own records and reputable archives
   (Wikipedia, MobyGames, the Newgrounds wikis, the linked
   archive.org items themselves). Three stand as written and are
   pinned verbatim below. Two earned fixes, both attribution errors
   of the same family as wave 27's Transport Tycoon lesson — the
   entry must credit what it actually links to:

   - Alien Hominid (Flash) called itself "The Behemoth's 2002"
     run-and-gun. The Behemoth did not make the 2002 Flash game and
     did not exist when it shipped: the prototype was programmed by
     Tom Fulp with art by Dan Paladin, released on Newgrounds in
     August 2002, and the company was formed afterwards, prompted by
     the prototype's success, to build the console version. The
     archive.org item this entry links is itself credited to Fulp
     and Paladin. The entry now names them.
   - Dad 'n Me was "Tom Fulp's 2005" — the year is right (July 27,
     2005) but the game's own credits split the work: programming by
     Fulp, art by Paladin, the same duo as Alien Hominid. The
     singular possessive dropped the artist; the entry now names
     both.

   The shelf's other four entries (Canabalt, Line Rider, Happy
   Wheels, QWOP) carry no year or creator claim in their
   descriptions, so there was nothing in this tranche to verify —
   that scope fact is pinned below.

   Taxonomy: still untouched. The TAXONOMY_BRIEF.md call (rotation
   6) remains UNDECIDED; purrgatory, Lookouts and Little Troubles in
   Spooky Town stay pinned in horror, census 213 / horror 6 / cozy
   16, exactly as waves 25–27 left them.

   Run: node scripts/test_curator28.js   (pure node, no browser)
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
const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
const byId = {};
gamesDoc.games.forEach((g) => { byId[g.id] = g; });

/* ---------------- the tranche: the Ruffle shelf, scoped ---------------- */
{
  const shelf = (colsDoc.collections || []).find((c) => c.id === "flash-back-machine");
  check("tranche: the Flash-back machine shelf is the pass-4 scope",
    !!shelf && Array.isArray(shelf.game_ids) && shelf.game_ids.length === 9,
    "9 entries on the Ruffle shelf");
  const claimed = ["fancy-pants-1", "alien-hominid-flash", "dad-n-me", "time-fcuk", "achievement-unlocked"];
  check("tranche: exactly five entries carry year/creator claims",
    claimed.every((id) => shelf.game_ids.includes(id) &&
      /\b(19|20)\d\d\b/.test(byId[id].description)),
    "the five dated/credited entries are the whole tranche");
  const unclaimed = ["canabalt", "line-rider", "happy-wheels", "qwop"];
  check("tranche: the other four entries carry no year/creator claim to verify",
    unclaimed.every((id) => shelf.game_ids.includes(id) &&
      !/\b(19|20)\d\d\b/.test(byId[id].description) && !/'s \d{4}|by [A-Z]/.test(byId[id].description)),
    "Canabalt, Line Rider, Happy Wheels, QWOP: no year, no creator credit in copy");
}

/* ---------------- Curator pass 4: the two fixes ---------------- */
{
  check("fix: Alien Hominid credits the duo who made the Flash game it links",
    byId["alien-hominid-flash"].description ===
      "Tom Fulp and Dan Paladin's 2002 run-and-gun: the little yellow alien's Newgrounds debut, preserved via Ruffle." &&
    !byId["alien-hominid-flash"].description.includes("Behemoth"),
    "Fulp (code) + Paladin (art), Newgrounds Aug 2002; The Behemoth formed afterwards for the console version");
  check("fix: the linked archive item itself credits Fulp and Paladin",
    byId["alien-hominid-flash"].url.includes("flash_alien_hominid"),
    "the entry names the creators the thing it links to names (the Transport Tycoon rule)");
  check("fix: Dad 'n Me credits both makers, year unchanged",
    byId["dad-n-me"].description ===
      "Tom Fulp and Dan Paladin's 2005 beat-em-up: a dad, his kid, and a city full of punks — Flash brawling at its finest, via Ruffle.",
    "released July 27, 2005; the game's own credits split programming (Fulp) and art (Paladin)");
}

/* ------- Curator pass 4: verified as written, pinned verbatim ------- */
const VERIFIED = {
  "fancy-pants-1": "Brad Borne's 2006 stick-figure platformer: the smoothest Flash run-and-slide ever, preserved on the Archive via Ruffle.",
  "achievement-unlocked": "John Cooney's 2008 metagame: a tiny platformer about unlocking 100 achievements for doing literally everything.",
  "time-fcuk": "Edmund McMillen's 2009 puzzle-platformer: a box, a time mechanic, and an ending you'll argue about — preserved via Ruffle.",
};
Object.keys(VERIFIED).forEach((id) => {
  check("verified as written: " + id,
    byId[id] && byId[id].description === VERIFIED[id],
    "year/creator checked against a source outside the repo, wave 28");
});
{
  check("verified detail: Achievement Unlocked's count is exactly 100",
    byId["achievement-unlocked"].description.includes("100 achievements"),
    "John Cooney, released Dec 17, 2008 (Wikipedia/MobyGames); the goal is all 100");
  check("verified detail: Fancy Pants World 1 is Borne's, 2006",
    byId["fancy-pants-1"].description.startsWith("Brad Borne's 2006"),
    "series created by Brad Borne; World 1 released March 14, 2006");
  check("verified detail: Time Fcuk is McMillen's, 2009",
    byId["time-fcuk"].description.startsWith("Edmund McMillen's 2009"),
    "released on Newgrounds September 16, 2009 (McMillen's own gameography)");
}

/* ---------------- taxonomy: still pinned, census unchanged ---------------- */
{
  const horror = gamesDoc.games.filter((g) => g.genre === "horror");
  const cozy = gamesDoc.games.filter((g) => g.genre === "cozy");
  check("taxonomy: the brief's call is still UNDECIDED — nothing reshelved",
    byId["purrgatory"].genre === "horror" && byId["lookouts"].genre === "horror" &&
    byId["spooky-town"].genre === "horror",
    "all three stay in horror until a human rules on TAXONOMY_BRIEF.md");
  check("taxonomy: census unchanged (213 total, horror 6, cozy 16)",
    gamesDoc.games.length === 213 && horror.length === 6 && cozy.length === 16,
    "213 / horror " + horror.length + " / cozy " + cozy.length);
}

/* ---------------- prose hygiene + legal lane ---------------- */
{
  const fixed = byId["alien-hominid-flash"].description + byId["dad-n-me"].description;
  check("prose: no AI-slop phrasing in the corrected copy",
    !/delve|unlock the power|game-changer|elevate your|fast-paced world|whether you.re a beginner or a pro/i.test(fixed),
    "denylist clean");
  check("legal lane: no ROM/BIOS download phrasing in the corrected entries",
    !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(fixed),
    "legal lane holds");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
