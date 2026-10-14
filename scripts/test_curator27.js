/* Wave 27 checks: the taxonomy brief + Curator pass 3.

   (1) The HUMAN DECISION BRIEF (TAXONOMY_BRIEF.md, repo root): wave 25
       recorded a cozy/horror recommendation and pinned both games in
       horror pending a human call; wave 26 left the shelf untouched.
       This wave writes the one-page brief a human can rule from,
       each game's own store-page framing (itch pages re-fetched
       2026-10-12), the comparable shelving, the exact census effect,
       the related Spooky Town case, the honest case for leaving them,
       and a clear recommendation, and decides NOTHING. The pins
       below keep purrgatory, Lookouts and Spooky Town in horror and
       the census at horror 6 / cozy 16 until a human rules.

   (2) Curator pass 3, the retro shelf's year/maker/superlative
       claims, a tranche waves 24-26 never externally verified (only
       Robotron's 1982 had been). Sixteen descriptions checked against
       sources outside the repo (Wikipedia, arcade-museum, the Strong
       Museum of Play, Bandai Namco's own Arcade Archives release
       notes, the games' own archive.org items). Fourteen stand as
       written and are pinned verbatim below. Two earned fixes:
       - 1942 called itself "the granddaddy of the shmup", the genre
         runs through Space Invaders (1978) and Xevious (1982); what
         1942 actually was is the first of Capcom's 19XX series.
       - Transport Tycoon said "1995" with no edition named, the
         original game is 1994 (Nov 1994, MicroProse); 1995 is the
         Deluxe edition, which is the build the entry links. The
         entry now names the edition it links.

   Run: node scripts/test_curator27.js   (pure node, no browser)
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

/* ---------------- (1) the brief: present, complete, undecided ---------------- */
const briefPath = path.join(ROOT, "TAXONOMY_BRIEF.md");
const brief = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, "utf8") : "";
{
  check("brief: TAXONOMY_BRIEF.md exists at repo root (docs convention)",
    brief.length > 2000, brief.length + " bytes");
  check("brief: states its undecided status up front",
    brief.includes("UNDECIDED") && brief.includes("nothing in this document"),
    "a human rules; the brief does not");
  check("brief: carries the exact census effect",
    brief.includes("horror 6 → 4, cozy 16 → 18") && brief.includes("213 games"),
    "horror 6→4, cozy 16→18, census otherwise unchanged");
  check("brief: purrgatory evidence is its own store page's framing",
    brief.includes("whimsical point-and-click world, befriend seven") &&
    brief.includes("no horror framing"),
    "itch page checked 2026-10-12: visual novel, befriending, no horror tag or warnings");
  check("brief: Lookouts evidence is its own store page's framing",
    brief.includes("a romance visual novel") && brief.includes("finding refuge in each other") &&
    brief.includes("gun violence"),
    "itch page checked 2026-10-12: leads with romance; warnings are western-drama material");
  check("brief: comparable shelving named (cozy's ghost stories)",
    brief.includes("Six Cats Under") && brief.includes("goodbye, doggy") && brief.includes("Fallen London"),
    "an afterlife point-and-click, a ghost dog, and a gothic RPG already sit in cozy");
  check("brief: the Spooky Town case is in the brief with fresh evidence",
    brief.includes("Little Troubles in Spooky Town") && brief.includes("Cozy, Cute, Ghosts") &&
    brief.includes("Girly Game Jam"),
    "its own itch page tags it Cozy/Cute/Wholesome, same ruling should settle it");
  check("brief: the case for leaving them is stated, not strawmanned",
    brief.includes("The case for leaving them") && brief.includes("thin shelf"),
    "browsing-aid and dark-material arguments on the record");
  check("brief: a clear recommendation is made",
    brief.includes("**Move purrgatory and Lookouts to cozy"),
    "recommendation recorded; decision left to the human");
  check("brief: horror's centre of dread is described from the shelf itself",
    brief.includes("We Become What We Behold") && brief.includes("Dating Killmulator 2"),
    "the shelf the two games would leave is characterised, not caricatured");
}

/* ---------------- taxonomy: still pinned, census unchanged ---------------- */
{
  const horror = gamesDoc.games.filter((g) => g.genre === "horror");
  const cozy = gamesDoc.games.filter((g) => g.genre === "cozy");
  check("taxonomy: nothing reshelved this wave, all three still in horror",
    byId["purrgatory"].genre === "horror" && byId["lookouts"].genre === "horror" &&
    byId["spooky-town"].genre === "horror",
    "pinned pending the human ruling the brief asks for");
  check("taxonomy: census unchanged (213 total, horror 6, cozy 16)",
    gamesDoc.games.length === 213 && horror.length === 6 && cozy.length === 16,
    "213 / horror " + horror.length + " / cozy " + cozy.length);
}

/* ---------------- (2) Curator pass 3: the two fixes ---------------- */
{
  check("fix: 1942 no longer claims the shmup's origin",
    byId["1942"].description ===
      "Capcom's 1984 vertical shooter: loop-de-loop over the Pacific in the first of the 19XX series." &&
    !byId["1942"].description.includes("granddaddy"),
    "first of the 194X series (Wikipedia/arcade-museum); the genre predates it");
  check("fix: Transport Tycoon names the edition it links",
    byId["transport-tycoon"].description ===
      "Chris Sawyer's transport empire sim in its 1995 Deluxe edition (the original is 1994): lay rail, run buses, and out-profit the competition across a century." &&
    byId["transport-tycoon"].url.includes("Transport_Tycoon_Deluxe_1995"),
    "original Nov 1994 (Wikipedia/Atari); the linked archive item is the 1995 Deluxe build");
}

/* ------- Curator pass 3: verified as written, pinned verbatim ------- */
const VERIFIED = {
  "space-invaders": "Taito's 1978 quarter-muncher: four notes of bass, one descending armada, and the birth of the high score.",
  "tempest": "Atari's 1981 vector shooter: Dave Theurer's neon tube-blaster, the first game with a selectable starting level.",
  "missile-command": "Atari's 1980 Cold War nightmare: defend six cities with three batteries. The end is not a matter of if.",
  "dig-dug": "Namco's 1982 digger: tunnel through the dirt, pump up Pookas, and drop rocks on Fygars.",
  "joust": "Williams' 1982 ostrich jousting: flap higher than the rival knights and lance them out of the sky.",
  "centipede": "Atari's 1981 shooter: blast the descending centipede through a mushroom field before it reaches you.",
  "defender": "Williams' 1981 rescue shooter: the hardest game of the golden age, save the humanoids, mind the hyperspace.",
  "qbert": "Gottlieb's 1982 cube-hopper: change every tile's color, dodge Coily, and mind the @!#?@! swearing.",
  "congo-bongo": "Sega's 1983 isometric platformer: climb, dodge, and outwit the ape in the isometric rival to Donkey Kong.",
  "galaga88": "Namco's 1987 sequel: the dive-bombing classic with triple-ship power-ups and branching warp zones.",
  "bubble-bobble-2": "Taito's 1994 co-op bubble-blower: trap monsters in bubbles with a friend, in the sequel to the arcade sweetheart.",
  "pac-gal-20th": "The 2000 arcade reunion cabinet: Ms. Pac-Man and Galaga, class of 1981, together in one anniversary machine.",
  "master-of-orion": "The 1993 4X that named the genre: colonize stars, design ships, and out-diplomacize the galaxy.",
  "sfa2": "Capcom's 1996 fighter: the Alpha series at its peak, air-blocking, custom combos, and anime-styled sprites.",
};
Object.keys(VERIFIED).forEach((id) => {
  check("verified as written: " + id,
    byId[id] && byId[id].description === VERIFIED[id],
    "year/maker/claim checked against a source outside the repo, wave 27");
});

/* ---------------- legal lane ---------------- */
{
  const briefAndData = brief + JSON.stringify(byId["1942"]) + JSON.stringify(byId["transport-tycoon"]);
  check("legal lane: no ROM/BIOS download phrasing in wave-27 files",
    !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(briefAndData),
    "legal lane holds");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
