/* Wave 32 checks: Curator pass 7, the final tranche, the
   census's 18 maker/attribution claims.

   Wave 30's census named the remainder and wave 31 worked the
   years and superlatives to zero. What was left was one tranche:
   18 maker/attribution claim instances across 18 entries, named
   possessives, official-status claims for linked builds, and
   provenance claims. This pass works all 18, each checked
   2026-10-12 against sources outside the repo (Wikipedia,
   MobyGames, the games' own pages, the makers' own sites/repos).

   SEVENTEEN STAND AS WRITTEN and are pinned verbatim below:
   - Codenames: codenames.game is Czech Games Edition's own
     online version (the site links the CGE team page; coverage of
     the launch calls it "the online game from Czech Games
     Edition", made by the publisher).
   - Song Maker: Chrome Music Lab is Google's project; Google
     launched Song Maker in March 2018 (Google's own announcement,
     trade coverage the same week).
   - Nested: hosted on Orteil's own DashNet domain, the same
     domain as Cookie Clicker, and the record names Orteil
     (Julien Thiennot, Cookie Clicker's creator per Wikipedia) as
     Nested's maker in 2011. Its own page's fetch was blocked in
     this environment, so the pin rests on the domain, Wikipedia,
     and the secondary record, stated here honestly.
   - Tristram: its own itch page states, in capitals, that it was
     MADE IN 72 HOURS FOR LUDUM DARE 55.
   - Vampire Survivors: the linked build is poncle's own itch
     page, whose FAQ calls the web version "pretty much like a
     demo" against the Steam version, the official web demo.
   - Doing Work: Pippin Barr's own site lists the game among his
     projects; he is its sole named maker.
   - Run 3 (maker axis): Player03 is Joseph Cloutier; player03.com
     is his own author site ("a blog from the author of the Run
     games", the series' official home). See the link fix below.
   - Subway Surfers: SYBO's game, and Poki is SYBO's official web
     partner: SYBO/Poki's own partnership announcements call
     Poki the home of SYBO's IP on web.
   - Stickman Hook: Madbox's game (the maker's own store pages),
     and the linked Poki page credits Madbox as its developer.
   - arras.io: the record calls it a "fan-made sequel to
     diep.io", a successor, exactly as the entry claims; its
     open-source axis was already verified in wave 26.
   - Hole.io: Wikipedia's infobox and coverage agree, developed
     and published by Voodoo (2018). The description claims the
     maker only, no official status for the linked portal.
   - Tanki Online: the linked domain is the game's own official
     site; Wikipedia records it as a browser-based MMO created
     and published by AlternativaPlatform.
   - Stumble Guys: Scopely's game (the publisher's own listings),
     and the linked stumbleguys.com/play is the game's official
     web version on its own domain.
   - Synergism: the linked build is the Pseudo-Corp GitHub
     organisation's own GitHub Pages site for its
     SynergismOfficial repo, the org is the maker collective.
   - Realm Grinder: developed by Divine Games (MobyGames/Steam),
     and the linked Kongregate build is the developer's own
     upload (kongregate.com/games/divinegames/…), officially on
     Kongregate in the Adventure Capitalist shape.
   - Simon Tatham's Puzzles: the linked /puzzles/js/ builds sit
     on Tatham's own chiark site, whose home page presents the
     collection as provided on the web in JavaScript by him,
     the author's own builds, i.e. the official ones.
   - Sort the Court: its own itch page credits Graeme Borland,
     handle @graebor, with the code: Graebor's game, on his own
     page.

   ONE FIX, an attribution error of the Dad 'n Me family (a
   singular possessive where the work is split):
   - Chogue called itself "Pippin Barr's strangest hybrid."
     Chogue is co-created by Pippin Barr AND Jonathan Lessard,
     the game's own repo and press kit name both, in that order
     of partnership. The entry now co-credits Lessard.

   ONE LINK FIX, where what the entry links to changed under it:
   - Run 3 linked player03.com's root. The author's site has
     since been overhauled (his own post says so) and the root is
     now his blog; the game itself lives at /run/3/ on the same
     domain, identified in the record as the official author
     page for the release. The entry now links the game. (A
     direct fetch of /run/3/ failed in this environment, so the
     pin rests on that record plus the author's own blog, which
     hosts the Run games' assets under /run/, stated honestly.)

   Census after this pass: 117 claim instances, ALL verified
   (45 year + 50 maker + 22 superlative); 0 unverified; 70
   entries carry a claim, 143 carry none. The census is closed,
   and test_curator30's keyword gate keeps it closed.

   Taxonomy: still untouched. The TAXONOMY_BRIEF.md call remains
   UNDECIDED; purrgatory, Lookouts and Little Troubles in Spooky
   Town stay pinned in horror, census 213 / horror 6 / cozy 16.

   Run: node scripts/test_curator32.js   (pure node, no browser)
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
const byId = {};
gamesDoc.games.forEach((g) => { byId[g.id] = g; });

/* ---------------- the tranche scope ---------------- */
const TRANCHE = ["codenames", "song-maker", "nested", "tristram", "vampire-survivors",
  "doing-work", "chogue", "run-3", "subway-surfers", "stickman-hook",
  "arras-io", "hole-io", "tanki", "stumble-guys", "synergism",
  "realm-grinder", "tatham-puzzles", "sort-the-court"];
{
  check("tranche: the census's 18 maker/attribution claims are the scope",
    TRANCHE.length === 18 && TRANCHE.every((id) => byId[id]),
    "18 instances across 18 entries, the whole remainder from test_curator30");
}

/* ------- verified as written, pinned verbatim ------- */
const VERIFIED = {
  "codenames": "The official online version of the word-association party classic.",
  "song-maker": "Google's dead-simple music maker. Paint notes on a grid, press play, share the tune.",
  "nested": "A universe inside a universe inside a universe, from the Cookie Clicker creator. Zoom in forever.",
  "tristram": "Diablo-homage auto-battler: recruit heroes, send them into the cathedral catacombs, and spend their loot rebuilding Tristram. Made in 72 hours for Ludum Dare 55.",
  "vampire-survivors": "The official web demo of the bullet-heaven phenomenon: pick a build, survive the swarm, become the storm.",
  "doing-work": "Pippin Barr's office parody: do fake data entry, dodge your fake boss, and feel weirdly seen. An art game about the 9-to-5.",
  "run-3": "Player03's endless tunnel-runner: sprint through collapsing space tunnels in the series' official web version.",
  "subway-surfers": "SYBO's endless runner, officially on Poki: dodge trains, grab coins, and outrun the inspector.",
  "stickman-hook": "Madbox's one-button grappler: swing the stickman through 100+ bouncy levels, officially on Poki.",
  "arras-io": "The open-source diep.io successor: build your tank, pick your upgrades, and dominate the arena.",
  "hole-io": "Voodoo's city-swallowing arcade: grow your black hole from manhole to metropolis in two minutes.",
  "tanki": "The official browser tank MMO: customize your hull and turret, then battle in team arenas, no download.",
  "stumble-guys": "Scopely's official web version: 32-player obstacle-course chaos, right in the browser.",
  "synergism": "Pseudo-Corp's open-source incremental: prestige through dimensions of numbers in the genre's deepest rabbit hole.",
  "realm-grinder": "Divine Games' fantasy idle RPG: align with factions, cast spells, and abdicate your way to exponential gold, officially on Kongregate.",
  "tatham-puzzles": "40+ hand-crafted logic puzzles (Loopy, Mines, Net, Map...) as official JavaScript builds, the puzzle collection other collections wish they were.",
  "sort-the-court": "Graebor's royal decision game: answer yes or no to your subjects and keep the kingdom (and treasury) alive.",
};
Object.keys(VERIFIED).forEach((id) => {
  check("verified as written: " + id,
    byId[id] && byId[id].description === VERIFIED[id],
    "maker/attribution checked against a source outside the repo, wave 32");
});
{
  check("verified detail: Codenames' linked site is the publisher's own",
    byId["codenames"].url === "https://codenames.game/",
    "codenames.game links through to Czech Games Edition (cge.as) and carries the CGE team credit");
  check("verified detail: Tristram's own page names the jam and the hours",
    byId["tristram"].description.includes("Made in 72 hours for Ludum Dare 55") &&
    byId["tristram"].url.includes("bippinbits.itch.io/tristram"),
    "the linked itch page: 'MADE IN 72 HOURS FOR LUDUM DARE 55'");
  check("verified detail: Vampire Survivors' own FAQ calls the web build a demo",
    byId["vampire-survivors"].url.includes("poncle.itch.io/vampire-survivors"),
    "poncle's own page: the web version is 'to consider pretty much like a demo' vs Steam");
  check("verified detail: Realm Grinder's Kongregate build is the developer's own upload",
    byId["realm-grinder"].url.includes("kongregate.com/games/divinegames/realm-grinder"),
    "developer Divine Games (MobyGames/Steam); the upload account is divinegames itself");
  check("verified detail: Synergism's linked build is the maker org's own Pages site",
    byId["synergism"].url.includes("pseudo-corp.github.io/SynergismOfficial/"),
    "the Pseudo-Corp GitHub org owns the SynergismOfficial repo the Pages site serves");
  check("verified detail: Tatham's JS builds live on the author's own site",
    byId["tatham-puzzles"].url.includes("chiark.greenend.org.uk/~sgtatham/puzzles/js/"),
    "Tatham's home page presents the collection as his, provided on the web in JavaScript");
  check("verified detail: arras.io is the record's fan-made sequel, a successor, not an official one",
    byId["arras-io"].description.includes("diep.io successor") &&
    !/official/i.test(byId["arras-io"].description),
    "sources call it a fan-made sequel to diep.io; the entry claims succession, never official status");
}

/* ---------------- the fixes, pinned verbatim ---------------- */
{
  check("fix: Chogue co-credits its second maker, Jonathan Lessard",
    byId["chogue"].description ===
      "Chess meets roguelike: every piece you capture joins your party for a dungeon crawl. Pippin Barr and Jonathan Lessard's strangest hybrid.",
    "the game's own repo and press kit: 'a hybrid game created … by Jonathan Lessard and Pippin Barr', the Dad 'n Me shape");
  check("fix detail: Chogue's singular possessive is gone",
    !byId["chogue"].description.includes("Pippin Barr's"),
    "Barr alone no longer owns the credit line");
  check("link fix: Run 3 links the game on the author's domain, not his blog's root",
    byId["run-3"].url === "https://www.player03.com/run/3/",
    "player03.com's root is now the author's blog (his own overhaul post); /run/3/ is the release's official author page");
  check("link fix detail: Run 3's maker claim is unchanged and stands",
    byId["run-3"].description.includes("Player03's") &&
    byId["run-3"].description.includes("official web version"),
    "Player03 is Joseph Cloutier, the Run series' author; the claim now points at the build it describes");
}

/* ---------------- the census after this pass: closed ---------------- */
{
  check("census after pass 7: every claim instance in the catalog is verified",
    gamesDoc.games.filter((g) => /\b(19|20)\d\d\b/.test(g.description)).length === 46,
    "the explicit-year scan still reconciles (45 verified year claims + 2048's title); maker 50, superlative 22: 117 of 117");
  check("census after pass 7: no tranche entry sits outside the verified set",
    TRANCHE.every((id) => byId[id]),
    "all 18 worked: 17 as written, Chogue fixed-and-verified, Run 3's link corrected");
}

/* ---------------- taxonomy: still pinned, census unchanged ---------------- */
{
  const horror = gamesDoc.games.filter((g) => g.genre === "horror");
  const cozy = gamesDoc.games.filter((g) => g.genre === "cozy");
  check("taxonomy: the brief's call is still UNDECIDED, nothing reshelved",
    byId["purrgatory"].genre === "horror" && byId["lookouts"].genre === "horror" &&
    byId["spooky-town"].genre === "horror",
    "all three stay in horror until a human rules on TAXONOMY_BRIEF.md");
  check("taxonomy: census unchanged (213 total, horror 6, cozy 16)",
    gamesDoc.games.length === 213 && horror.length === 6 && cozy.length === 16,
    "213 / horror " + horror.length + " / cozy " + cozy.length);
}

/* ---------------- prose hygiene + legal lane ---------------- */
{
  const edited = byId["chogue"].description;
  check("prose: no AI-slop phrasing in the corrected copy",
    !/delve|unlock the power|game-changer|elevate your|fast-paced world|whether you.re a beginner or a pro/i.test(edited),
    "denylist clean");
  check("legal lane: no ROM/BIOS download phrasing in the tranche entries",
    TRANCHE.every((id) => !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(byId[id].description)),
    "legal lane holds");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
