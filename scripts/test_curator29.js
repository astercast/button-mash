/* Wave 29 checks: Curator pass 5 — the DOS / shareware and
   early-PC shelf.

   The tranche wave 28 named next: the DOS-linked entries' year and
   maker claims — Zork, SimCity, Prince of Persia, Monkey Island,
   Lemmings, Theme Park, the four shareware episodes, and the
   similar claims on the same shelf (the two Oregon Trails,
   Civilization, SimCity 2000, Railroad Tycoon, the two Keens).
   Seventeen entries in scope; each was checked 2026-10-12 against
   sources outside the repo (Wikipedia, MobyGames, the Apogee FAQ,
   Mechner's own site, the linked archive.org items). Sixteen stand
   as written and are pinned verbatim below. One fix, an edition
   error of the exact family wave 27's Transport Tycoon named — the
   entry must date the edition it actually links to:

   - Prince of Persia called itself "Jordan Mechner's 1990
     rotoscoped classic". 1990 is the DOS port the entry links; the
     game itself is the 1989 Apple II original Mechner programmed
     alone. The entry now names the port it links and keeps the
     original's year in parentheses, the Transport Tycoon shape.

   Two scope notes, pinned so they are not re-litigated:
   - Keen Dreams' archive slug carries 1993, but that is the
     Archive item's catalog year for its disk image; the game was
     released in 1991 (id Software via Softdisk), which is what the
     description dates.
   - Commander Keen 3 shipped weeks before the team incorporated
     as id Software (they were Ideas from the Deep); the series is
     cataloged under id everywhere, including the Archive, and the
     description's "id's shareware-era charmer" follows the linked
     shelf's own crediting.
   Already verified in earlier passes and out of this tranche's
   scope: Transport Tycoon and Master of Orion (wave 27), Alone in
   the Dark (wave 24), and the whole arcade-linked shelf (wave 27).

   Taxonomy: still untouched. The TAXONOMY_BRIEF.md call remains
   UNDECIDED; purrgatory, Lookouts and Little Troubles in Spooky
   Town stay pinned in horror, census 213 / horror 6 / cozy 16.

   Run: node scripts/test_curator29.js   (pure node, no browser)
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

/* ---------------- the tranche: the DOS shelf, scoped ---------------- */
const TRANCHE = [
  "zork1", "simcity-1989", "prince-of-persia", "monkey-island",
  "lemmings-1991", "theme-park", "wolfenstein-3d", "doom-1993",
  "quake-shareware", "duke3d-shareware", "oregon-trail",
  "oregon-trail-deluxe", "civ1", "simcity-2000", "railroad-tycoon",
  "commander-keen3", "keen-dreams",
];
{
  check("tranche: the DOS/shareware shelf scope is seventeen entries",
    TRANCHE.length === 17 && TRANCHE.every((id) => byId[id] &&
      byId[id].url.includes("archive.org/details/") &&
      /\b(19|20)\d\d\b/.test(byId[id].description)),
    "the ten wave-28 names plus the seven similar DOS-linked claims");
  check("tranche: the earlier-verified DOS entries stay out of scope",
    ["transport-tycoon", "master-of-orion", "alone-dark"].every((id) => byId[id] && !TRANCHE.includes(id)),
    "Transport Tycoon / Master of Orion (wave 27) and Alone in the Dark (wave 24) were already checked");
  check("tranche: the DOS library doors carry no year/maker claim to verify",
    ["msdos-library", "console-living-room", "internet-arcade"].every((id) =>
      byId[id] && !/\b(19|20)\d\d\b/.test(byId[id].description)),
    "the three collection-door entries name titles only, so the tranche is fully worked");
}

/* ---------------- Curator pass 5: the one fix ---------------- */
{
  check("fix: Prince of Persia names the DOS port it links, original year kept",
    byId["prince-of-persia"].description ===
      "Jordan Mechner's rotoscoped classic in its 1990 DOS port (the Apple II original is 1989): sixty minutes to save the princess, one leap of faith at a time.",
    "Apple II original Oct 1989 (Mechner solo); the DOS port shipped months later, in 1990");
  check("fix: the linked archive item is the 1990 DOS version",
    byId["prince-of-persia"].url.includes("msdos_Prince_of_Persia_1990"),
    "the entry dates the edition it links to (the Transport Tycoon rule)");
  check("fix: Mechner still credited, rotoscoping still claimed",
    byId["prince-of-persia"].description.startsWith("Jordan Mechner's rotoscoped classic"),
    "only the bare 1990 moved; the verified parts of the sentence stand");
}

/* ------- Curator pass 5: verified as written, pinned verbatim ------- */
const VERIFIED = {
  "zork1": "West of house. It is pitch black. The 1980 text adventure that defined a genre — no graphics, all imagination, right in your browser.",
  "simcity-1989": "Zone land, lay roads, and keep the Sims happy in the city-builder that started it all — Will Wright's 1989 original, playable in the Archive's DOSBox.",
  "monkey-island": "Guybrush Threepwood wants to be a pirate. Insult-sword-fight your way through Lucasfilm Games' 1990 point-and-click classic.",
  "lemmings-1991": "Guide the green-haired marchers home: assign blockers, bashers, and builders before they stroll off the cliff. DMA Design's 1991 puzzler.",
  "theme-park": "Bullfrog's 1994 theme-park tycoon: set ride prices, salt the fries, and keep the queues moving.",
  "wolfenstein-3d": "The 1992 shareware episode in the Archive: id Software's maze-blaster that started it all. Achtung!",
  "doom-1993": "The 1993 shareware episode in the Internet Archive's DOSBox: the game that made the FPS a phenomenon, exactly as it was.",
  "quake-shareware": "id Software's 1996 true-3D shooter: the shareware episode with the nailgun, free and legal in your browser.",
  "duke3d-shareware": "Hail to the king, baby: the shareware episode of 3D Realms' 1996 FPS — Hollywood Holocaust, free and legal, in the browser.",
  "oregon-trail": "The 1990 DOS classic in the Archive: ford rivers, hunt buffalo, and try not to die of dysentery on the trail west.",
  "oregon-trail-deluxe": "The 1992 deluxe edition of the classroom classic: hunt, ford rivers, and mind the dysentery on the trail west.",
  "civ1": "4000 BC to the space race: found cities, research pottery, and outlast history itself in the 1991 original 4X.",
  "simcity-2000": "The 1993 sequel with arcologies, newspapers, and underground plumbing — the definitive 90s city builder, in DOSBox.",
  "railroad-tycoon": "Sid Meier's 1990 railroad empire: lay track, haul freight, and bankrupt the robber barons.",
  "commander-keen3": "Billy Blaze's 1990 pogo-stick platforming finale to the Invasion of the Vorticons trilogy — id's shareware-era charmer.",
  "keen-dreams": "The lost Keen episode: battle vegetable tyrants with flower-power pellets in id's 1991 fever dream.",
};
Object.keys(VERIFIED).forEach((id) => {
  check("verified as written: " + id,
    byId[id] && byId[id].description === VERIFIED[id],
    "year/maker checked against a source outside the repo, wave 29");
});
{
  check("verified detail: Zork I is the December 1980 release",
    byId["zork1"].description.includes("The 1980 text adventure"),
    "Infocom's Zork I published for the TRS-80 in December 1980");
  check("verified detail: SimCity is Wright's, February 1989",
    byId["simcity-1989"].description.includes("Will Wright's 1989 original"),
    "designed by Will Wright, developed by Maxis, released February 1989");
  check("verified detail: the shareware episodes are the episodes",
    byId["wolfenstein-3d"].description.includes("1992 shareware episode") &&
    byId["doom-1993"].description.includes("1993 shareware episode") &&
    byId["quake-shareware"].description.includes("shareware episode") &&
    byId["duke3d-shareware"].description.includes("shareware episode"),
    "Wolfenstein ep.1 uploaded May 5, 1992; DOOM's Knee-Deep Dec 10, 1993; Quake shareware Jun 22, 1996; Duke shareware Jan 29, 1996");
  check("verified detail: Duke's shareware opens on Hollywood Holocaust",
    byId["duke3d-shareware"].description.includes("Hollywood Holocaust") &&
    byId["duke3d-shareware"].url.includes("3dduke13SW"),
    "episode 1 (L.A. Meltdown) leads with Hollywood Holocaust; the linked item is the v1.3 shareware build");
  check("verified detail: Keen Dreams dates the game (1991), not the disk image",
    byId["keen-dreams"].description.includes("id's 1991 fever dream") &&
    byId["keen-dreams"].url.includes("Keen_Dreams_1993"),
    "released 1991 by id via Softdisk; 1993 in the slug is the Archive item's catalog year");
  check("verified detail: the Oregon Trail years belong to the DOS editions named",
    byId["oregon-trail"].description.startsWith("The 1990 DOS classic") &&
    byId["oregon-trail-deluxe"].description.startsWith("The 1992 deluxe edition"),
    "MECC's DOS remake of the 1985 Apple II game is 1990; the Deluxe DOS edition is 1992 — both entries name their edition");
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
  const fixed = byId["prince-of-persia"].description;
  check("prose: no AI-slop phrasing in the corrected copy",
    !/delve|unlock the power|game-changer|elevate your|fast-paced world|whether you.re a beginner or a pro/i.test(fixed),
    "denylist clean");
  check("legal lane: no ROM/BIOS download phrasing in the corrected entry",
    !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(fixed),
    "legal lane holds");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
