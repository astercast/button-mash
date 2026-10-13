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

   THE CENSUS: of 213 entries, 72 carry at least one claim of
   these types (119 claim instances). 88 instances across 43
   entries stand verified by waves 24–29. 31 instances across 29
   entries remain unverified: 5 year, 19 maker/attribution, 7
   superlative. 141 entries carry no claim of these types at all.
   Three of the 29 are partially verified on other axes —
   Minecraft Classic's free claim and Synergism's and Arras.io's
   open-source claims were checked in wave 26; their
   year/original and maker claims were not. Angband sits in the verified-superlative list as a closed
   case: wave 24 removed its superlative rather than verifying it.

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

/* ---------------- the verified sets (waves 24–29) ---------------- */
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
  "nethack-web",
];
const VERIFIED_MAKER = [
  "simcity-1989", "monkey-island", "lemmings-1991", "theme-park",
  "wolfenstein-3d", "quake-shareware", "duke3d-shareware",
  "railroad-tycoon", "commander-keen3", "keen-dreams", "prince-of-persia",
  "transport-tycoon", "space-invaders", "dig-dug", "joust", "centipede",
  "missile-command", "defender", "qbert", "tempest", "1942", "galaga88",
  "bubble-bobble-2", "sfa2", "congo-bongo", "fancy-pants-1",
  "alien-hominid-flash", "dad-n-me", "achievement-unlocked", "time-fcuk",
  "tetris-official",
];
const VERIFIED_SUPERLATIVE = [
  "zork1", "simcity-1989", "wolfenstein-3d", "civ1", "alone-dark",
  "transport-tycoon", "master-of-orion", "space-invaders", "defender",
  "tempest", "robotron", "1942", "nethack-web", "angband-live",
  "doom-1993", "prince-of-persia",
];

/* ---------------- the unverified remainder, named ---------------- */
const UNVERIFIED_YEAR = [
  "urban-dead",        /* "A 2005 classic" */
  "minecraft-classic", /* 2009 — its free claim was verified in wave 26, the year was not pinned */
  "dare-to-doku",      /* "GBA Jam 2026" */
  "recoil-foundry",    /* "A 2026 jam gem" */
  "adventure-capitalist", /* "the idle game that ate 2015" */
];
const UNVERIFIED_MAKER = [
  "codenames",         /* "the official online version" */
  "song-maker",        /* "Google's … music maker" */
  "nested",            /* "from the Cookie Clicker creator" */
  "tristram",          /* "Made in 72 hours for Ludum Dare 55" */
  "vampire-survivors", /* "the official web demo" */
  "doing-work",        /* "Pippin Barr's" */
  "chogue",            /* "Pippin Barr's" */
  "run-3",             /* "Player03's" + "the series' official web version" */
  "subway-surfers",    /* "SYBO's" */
  "stickman-hook",     /* "Madbox's" */
  "arras-io",          /* "the open-source diep.io successor" (its open-source claim was verified in wave 26) */
  "hole-io",           /* "Voodoo's" */
  "tanki",             /* "the official browser tank MMO" */
  "stumble-guys",      /* "Scopely's official web version" */
  "synergism",         /* "Pseudo-Corp's" (its open-source claim was verified in wave 26) */
  "realm-grinder",     /* "Divine Games'" + "officially on Kongregate" */
  "adventure-capitalist", /* "Hyper Hippo's" */
  "tatham-puzzles",    /* "official JavaScript builds" */
  "sort-the-court",    /* "Graebor's" */
];
const UNVERIFIED_SUPERLATIVE = [
  "canabalt",          /* "the one-button endless runner that started a genre" */
  "celeste-classic",   /* "The original PICO-8 Celeste" */
  "cookie-clicker",    /* "The idle game that defined idle games" */
  "agar",              /* "the cell arena that defined .io games" */
  "minecraft-classic", /* "the original 32 blocks" */
  "spelunky-classic",  /* "The original free Spelunky" */
  "powder-game",       /* "The original falling-sand toy" */
];
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
  check("census: verified claim instances total 88 (41 year + 31 maker + 16 superlative)",
    VERIFIED_YEAR.length === 41 && VERIFIED_MAKER.length === 31 && VERIFIED_SUPERLATIVE.length === 16 &&
    VERIFIED_YEAR.length + VERIFIED_MAKER.length + VERIFIED_SUPERLATIVE.length === 88,
    "waves 24–29, pinned by test_curator24–29 and the wave-26 audit");
  check("census: 43 entries carry only verified claims of these types",
    VERIFIED.size === 43, VERIFIED.size + " entries");
  check("census: the unverified remainder is 31 instances (5 year + 19 maker + 7 superlative)",
    UNVERIFIED_YEAR.length === 5 && UNVERIFIED_MAKER.length === 19 && UNVERIFIED_SUPERLATIVE.length === 7 &&
    UNVERIFIED_YEAR.length + UNVERIFIED_MAKER.length + UNVERIFIED_SUPERLATIVE.length === 31,
    "the wave-30 finding, named entry by entry in the lists above");
  check("census: the remainder spans 29 entries, disjoint from the verified set",
    UNVERIFIED.size === 29 && [...UNVERIFIED].every((id) => !VERIFIED.has(id)),
    "two entries overlap types (adventure-capitalist year+maker, minecraft-classic year+superlative), none overlaps a verified entry");
  check("census: 72 entries carry a claim of these types; 141 carry none",
    VERIFIED.size + UNVERIFIED.size === 72 && gamesDoc.games.length - 72 === 141,
    "119 claim instances in total across the catalog");
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
    "chogue": "Pippin Barr's", "run-3": "Player03's",
    "subway-surfers": "SYBO's", "stickman-hook": "Madbox's",
    "arras-io": "successor", "hole-io": "Voodoo's", "tanki": "official",
    "stumble-guys": "Scopely's", "synergism": "Pseudo-Corp's",
    "realm-grinder": "Divine Games'", "adventure-capitalist": "Hyper Hippo's",
    "tatham-puzzles": "official JavaScript builds", "sort-the-court": "Graebor's",
  };
  check("remainder: every unverified-maker entry carries its named marker",
    Object.keys(makerMarkers).every((id) => byId[id] && byId[id].description.includes(makerMarkers[id])) &&
    Object.keys(makerMarkers).length === UNVERIFIED_MAKER.length,
    "named maker / official status / lineage marker present in each description");
  const supMarkers = {
    "canabalt": "started a genre", "celeste-classic": "The original PICO-8 Celeste",
    "cookie-clicker": "defined idle games", "agar": "defined .io games",
    "minecraft-classic": "original 32 blocks", "spelunky-classic": "The original free Spelunky",
    "powder-game": "The original falling-sand toy",
  };
  check("remainder: every unverified-superlative entry carries its precedence claim",
    Object.keys(supMarkers).every((id) => byId[id] && byId[id].description.includes(supMarkers[id])) &&
    Object.keys(supMarkers).length === UNVERIFIED_SUPERLATIVE.length,
    "first/original/defined/started claims present as written, still unchecked outside the repo");
  check("remainder: the partially verified pair is honestly scoped",
    byId["minecraft-classic"].description.includes("free in the browser") &&
    byId["synergism"].description.includes("open-source") &&
    byId["arras-io"].description.includes("open-source"),
    "wave 26 verified minecraft-classic's free claim and synergism's/arras-io's open-source claims — only those axes");
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
  check("gate: the year scan reconciles exactly (46 real year claims + the 2048 title)",
    gamesDoc.games.filter((g) => /\b(19|20)\d\d\b/.test(g.description)).length ===
      VERIFIED_YEAR.length + UNVERIFIED_YEAR.length + 1,
    "every explicit year in the catalog is either verified, in the remainder, or 2048's name");
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
  check("legal lane: no ROM/BIOS download phrasing in any remainder description",
    [...UNVERIFIED].every((id) => !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(byId[id].description)),
    "legal lane holds across the census remainder");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
