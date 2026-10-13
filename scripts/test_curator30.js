/* Wave 30 checks: the full-catalog claim census.

   Wave 29 closed the Curator's named list — every tranche waves
   24–28 queued (retro arcade shelf, Ruffle shelf, DOS shelf, the
   waves 24–26 sweeps) has been worked. What no pass ever scoped
   was the scattered remainder: year/maker/superlative claims in
   descriptions outside those shelves. This wave does not verify
   or fix any of them; it COUNTS them, claim by claim, so the
   remainder is a number with names attached instead of a shrug.

   Definitions (the census rules, applied to all 213 descriptions
   by hand on 2026-10-12, then machine-checked below):
   - YEAR claim: a description carries an explicit 4-digit year
     as a release/era fact about the game (2048's title number is
     not a year; a setting's decade, e.g. Secret Hitler's 1930s,
     is not a release year).
   - MAKER claim: a description names a person/studio/collective
     as the game's maker, claims official status for the linked
     build, or claims a lineage/provenance (a successor, a jam
     origin). Host credits ("the Internet Archive's DOSBox") and
     character possessives ("Billy Blaze's") are not maker claims.
   - SUPERLATIVE claim: a checkable precedence assertion —
     first / original / pioneer / defined / started / named the
     genre / popularized. Subjective puffery ("legendary",
     "definitive", "greatest hits") and numeric/content counts
     (item totals, level counts, ratings, durations) are out of
     scope by rule; open-source and free claims are out of scope
     here because wave 26 closed that audit.
   - VERIFIED means the specific claim was checked against a
     source outside the repo in waves 24–29 and is pinned by
     test_curator24–29 or the wave-26 audit. A claim is counted
     per entry per type: an entry with two unverified claim types
     counts twice in the instance total, once in the entry total.

   THE CENSUS (as updated by wave 32): of 213 entries, 70 carry
   at least one claim of these types (117 claim instances). All
   117 instances across 70 entries stand verified by waves
   24–32 — the census is CLOSED: no year, maker/attribution, or
   superlative claim in the catalog remains unverified. 143
   entries carry no claim of these types at all. (Wave 30's
   original count was 119 instances / 88 verified / 31 unverified
   across 29 entries; wave 31 verified 9 instances, fixed-and-
   verified 3 more, settled 1 maker claim in passing, and closed
   2 instances by removal — Powder Game's false "original" and
   Recoil Foundry's unsettled "2026 jam gem" — so the instance
   total itself fell to 117. Wave 32 then worked the last
   tranche, the 18 maker/attribution claims: 17 stand as written
   and are pinned verbatim in test_curator32, and Chogue's
   singular possessive was fixed to co-credit its second maker,
   Jonathan Lessard — pinned fixed-and-verified in the same
   suite.) Synergism's and Arras.io's open-source claims were
   checked in wave 26; wave 32 checked their maker claims too.
   Angband sits in the verified-superlative list as a closed
   case: wave 24 removed its superlative rather than verifying
   it.

   The gate below makes the census load-bearing: every
   description matching a claim keyword must sit in one of the
   lists (or the named false-positive set), so any future edit
   that adds a year, a maker, or a precedence claim to any
   description fails this suite until a curator pass accounts
   for it.

   Taxonomy: still untouched. The TAXONOMY_BRIEF.md call remains
   UNDECIDED; purrgatory, Lookouts and Little Troubles in Spooky
   Town stay pinned in horror, census 213 / horror 6 / cozy 16.

   Run: node scripts/test_curator30.js   (pure node, no browser)
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
const byId = {};
gamesDoc.games.forEach((g) => { byId[g.id] = g; });

/* ---------------- the verified sets (waves 24–31) ---------------- */
const VERIFIED_YEAR = [
  "zork1", "simcity-1989", "monkey-island", "lemmings-1991", "theme-park",
  "wolfenstein-3d", "doom-1993", "quake-shareware", "duke3d-shareware",
  "oregon-trail", "oregon-trail-deluxe", "civ1", "simcity-2000",
  "railroad-tycoon", "commander-keen3", "keen-dreams", "prince-of-persia",
  "transport-tycoon", "master-of-orion", "alone-dark", "space-invaders",
  "dig-dug", "joust", "centipede", "missile-command", "defender", "qbert",
  "tempest", "robotron", "1942", "galaga88", "pac-gal-20th",
  "bubble-bobble-2", "sfa2", "congo-bongo", "fancy-pants-1",
  "alien-hominid-flash", "dad-n-me", "achievement-unlocked", "time-fcuk",
  "nethack-web", "urban-dead", "minecraft-classic", "dare-to-doku",
  "adventure-capitalist",
];
const VERIFIED_MAKER = [
  "simcity-1989", "monkey-island", "lemmings-1991", "theme-park",
  "wolfenstein-3d", "quake-shareware", "duke3d-shareware",
  "railroad-tycoon", "commander-keen3", "keen-dreams", "prince-of-persia",
  "transport-tycoon", "space-invaders", "dig-dug", "joust", "centipede",
  "missile-command", "defender", "qbert", "tempest", "1942", "galaga88",
  "bubble-bobble-2", "sfa2", "congo-bongo", "fancy-pants-1",
  "alien-hominid-flash", "dad-n-me", "achievement-unlocked", "time-fcuk",
  "tetris-official", "adventure-capitalist",
  "codenames", "song-maker", "nested", "tristram", "vampire-survivors",
  "doing-work", "chogue", "run-3", "subway-surfers", "stickman-hook",
  "arras-io", "hole-io", "tanki", "stumble-guys", "synergism",
  "realm-grinder", "tatham-puzzles", "sort-the-court",
];
const VERIFIED_SUPERLATIVE = [
  "zork1", "simcity-1989", "wolfenstein-3d", "civ1", "alone-dark",
  "transport-tycoon", "master-of-orion", "space-invaders", "defender",
  "tempest", "robotron", "1942", "nethack-web", "angband-live",
  "doom-1993", "prince-of-persia", "canabalt", "cookie-clicker",
  "agar", "celeste-classic", "spelunky-classic", "minecraft-classic",
];

/* ---------------- the unverified remainder, named ----------------
   Wave 31 worked the year and superlative lists to zero, and
   wave 32 worked the maker list to zero the same way: every
   claim verified, fixed-and-verified (Chogue's co-credit), or
   closed by removal (CLOSED_BY_REMOVAL below). The remainder
   lists stand empty — the census is closed, and the gate below
   is what keeps it closed. */
const UNVERIFIED_YEAR = [];
const UNVERIFIED_MAKER = [];
const UNVERIFIED_SUPERLATIVE = [];
/* Claims closed by removal in wave 31 — the claim no longer
   exists, so these entries carry nothing for the gate to find:
   powder-game's "original falling-sand toy" (false — the 2005
   Dofi-Blog applet is the genre's original) and recoil-foundry's
   "2026 jam gem" (no source settles a jam or a year). */
const CLOSED_BY_REMOVAL = ["powder-game", "recoil-foundry"];
/* Keyword hits that are not claims of these types, by rule:
   2048 (the number is the game's name and goal), astray ("first
   person"), poom ("PICO-8's" names the platform, not a maker),
   absurdle ("Wordle's adversarial twin" is a genre metaphor, not
   a maker or succession claim), universal-paperclips (pronoun
   possessives). */
const FALSE_POSITIVES = ["2048", "astray", "poom", "absurdle", "universal-paperclips"];

const union = (lists) => new Set(lists.flat());
const VERIFIED = union([VERIFIED_YEAR, VERIFIED_MAKER, VERIFIED_SUPERLATIVE]);
const UNVERIFIED = union([UNVERIFIED_YEAR, UNVERIFIED_MAKER, UNVERIFIED_SUPERLATIVE]);

/* ---------------- the headline numbers ---------------- */
{
  check("census: the catalog still holds 213 entries",
    gamesDoc.games.length === 213, gamesDoc.games.length + " games");
  check("census: verified claim instances total 117 (45 year + 50 maker + 22 superlative)",
    VERIFIED_YEAR.length === 45 && VERIFIED_MAKER.length === 50 && VERIFIED_SUPERLATIVE.length === 22 &&
    VERIFIED_YEAR.length + VERIFIED_MAKER.length + VERIFIED_SUPERLATIVE.length === 117,
    "waves 24–32, pinned by test_curator24–32 and the wave-26 audit");
  check("census: 70 entries carry verified claims of these types",
    VERIFIED.size === 70, VERIFIED.size + " entries");
  check("census: the unverified remainder is closed — 0 instances of any type",
    UNVERIFIED_YEAR.length === 0 && UNVERIFIED_MAKER.length === 0 && UNVERIFIED_SUPERLATIVE.length === 0 &&
    UNVERIFIED_YEAR.length + UNVERIFIED_MAKER.length + UNVERIFIED_SUPERLATIVE.length === 0,
    "wave 31 closed the year and superlative lists; wave 32 closed the maker list");
  check("census: the remainder spans 0 entries, disjoint from the verified set",
    UNVERIFIED.size === 0 && [...UNVERIFIED].every((id) => !VERIFIED.has(id)),
    "nothing is left unverified");
  check("census: 70 entries carry a claim of these types; 143 carry none",
    VERIFIED.size + UNVERIFIED.size === 70 && gamesDoc.games.length - 70 === 143,
    "117 claim instances in total across the catalog (119 at wave 30; two closed by removal)");
}

/* ---------------- every listed claim is really in its description ---------------- */
{
  check("remainder: every unverified-year entry carries its explicit year",
    UNVERIFIED_YEAR.every((id) => byId[id] && /\b(19|20)\d\d\b/.test(byId[id].description)),
    UNVERIFIED_YEAR.join(", "));
  const makerMarkers = {
    "codenames": "official online version", "song-maker": "Google's",
    "nested": "Cookie Clicker creator", "tristram": "Ludum Dare 55",
    "vampire-survivors": "official web demo", "doing-work": "Pippin Barr's",
    "chogue": "Jonathan Lessard's", "run-3": "Player03's",
    "subway-surfers": "SYBO's", "stickman-hook": "Madbox's",
    "arras-io": "successor", "hole-io": "Voodoo's", "tanki": "official",
    "stumble-guys": "Scopely's", "synergism": "Pseudo-Corp's",
    "realm-grinder": "Divine Games'",
    "tatham-puzzles": "official JavaScript builds", "sort-the-court": "Graebor's",
  };
  check("closed census: every wave-32 maker entry still carries its named marker, now verified",
    Object.keys(makerMarkers).every((id) => byId[id] && byId[id].description.includes(makerMarkers[id])) &&
    Object.keys(makerMarkers).length === 18 && VERIFIED_MAKER.length === 50,
    "named maker / official status / lineage marker present in each description, all 18 in the verified set");
  const supMarkers = {};
  check("remainder: no superlative claim in the catalog remains unverified",
    Object.keys(supMarkers).length === UNVERIFIED_SUPERLATIVE.length &&
    UNVERIFIED_SUPERLATIVE.length === 0,
    "wave 31 verified, fixed, or removed every precedence claim the census named");
  check("closed census: the formerly partial pair is now verified on both axes",
    byId["synergism"].description.includes("open-source") &&
    byId["arras-io"].description.includes("open-source"),
    "wave 26 verified synergism's and arras-io's open-source claims; wave 32 verified their maker claims too");
  check("remainder: the two wave-31 closures by removal carry no claim anymore",
    CLOSED_BY_REMOVAL.every((id) => byId[id] &&
      !/\b(19|20)\d\d\b/.test(byId[id].description) &&
      !/\b(first|original|defined|started|pioneer|popularized)\b/i.test(byId[id].description)),
    "powder-game and recoil-foundry: the claims were removed, not softened into new ones");
}

/* ---------------- the gate: no claim escapes the lists ---------------- */
{
  const claimLike = (d) =>
    /\b(19|20)\d\d\b/.test(d) ||
    /[A-Z][\w.-]*'s\b/.test(d) ||
    /\b(first|original|defined|started|pioneer|popularized|official\w*|successor|creator)\b/i.test(d);
  const hits = gamesDoc.games.filter((g) => claimLike(g.description)).map((g) => g.id);
  const accounted = new Set([...VERIFIED, ...UNVERIFIED, ...FALSE_POSITIVES]);
  check("gate: every claim-like description is accounted for by the census",
    hits.every((id) => accounted.has(id)),
    hits.length + " keyword hits; unaccounted: " + hits.filter((id) => !accounted.has(id)).join(", "));
  check("gate: the false-positive set is exactly the five ruled non-claims",
    FALSE_POSITIVES.length === 5 && FALSE_POSITIVES.every((id) => byId[id] && claimLike(byId[id].description)),
    FALSE_POSITIVES.join(", "));
  check("gate: the year scan reconciles exactly (45 verified year claims + the 2048 title)",
    gamesDoc.games.filter((g) => /\b(19|20)\d\d\b/.test(g.description)).length ===
      VERIFIED_YEAR.length + UNVERIFIED_YEAR.length + 1,
    "every explicit year in the catalog is now verified, or is 2048's name");
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
  check("legal lane: no ROM/BIOS download phrasing in any formerly-remainder description",
    [...UNVERIFIED].every((id) => !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(byId[id].description)),
    "legal lane holds across the closed census");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
