/* Wave 31 checks: Curator pass 6 — the census remainder,
   superlatives and years.

   Wave 30's census counted 31 unverified claim instances across
   29 entries (7 superlative, 5 year, 19 maker/attribution) and
   named the working order: superlatives first, then years. This
   pass works both tranches — all twelve claims — each checked
   2026-10-12 against sources outside the repo (Wikipedia, the
   games' own pages/statements). The maker tranche (18 instances
   after this pass) is untouched and stays in the remainder.

   SUPERLATIVES — four stand as written:
   - Agar.io "defined .io games": Wikipedia records that Agar.io's
     success "led to the beginning of a new genre of browser
     games, dubbed '.io games'" and that it "birthed a wave of new
     .io titles — a new genre". The genre starts with this game.
   - Celeste Classic "The original PICO-8 Celeste": the PICO-8
     version made by Thorson and Berry in August 2015 is the
     original Celeste, retroactively titled Celeste Classic.
   - Spelunky Classic "The original free Spelunky": Derek Yu's
     game was released as freeware on December 21, 2008; the 2012
     HD remake is a different build. The entry links the HTML5
     port of the original and says so.
   - Minecraft Classic "the original 32 blocks": Mojang's own
     10th-anniversary release statement — "Play the original
     creative mode, complete with 32 blocks".

   SUPERLATIVES — three fixes:
   - Canabalt "started a genre" is the exact misconception the
     endless-runner record warns against: Ovenbreak reached the
     App Store two months earlier, and Wikipedia credits Canabalt
     with POPULARIZING the endless runner subgenre. The entry now
     claims the credit the record gives.
   - Cookie Clicker "defined idle games": incremental games
     predate it (Cow Clicker, Candy Box!) and Wikipedia credits
     Cookie Clicker with the genre's popularity surge in 2013 —
     "popularized", not "defined".
   - Powder Game "The original falling-sand toy" is false: the
     genre's original is the 2005 Dofi-Blog Java applet ("Hell of
     Sand"); Dan-Ball's Powder Game is a 2007 entry in the genre.
     The precedence claim is removed (the Angband shape: a claim
     the evidence cannot carry does not ship).

   YEARS — three stand as written:
   - Urban Dead's "2005 classic": launched July 3, 2005.
   - Minecraft Classic's 2009: the Classic phase ran May–December
     2009; the linked build is Mojang's anniversary re-release of
     that 2009 creative mode.
   - Dare to Doku's "GBA Jam 2026": the game's own itch page
     states it was made for GBA Jam 2026 (and confirms the 10,000
     levels and 4–10 grids the description claims).

   YEARS — one fix, one closure by removal:
   - AdVenture Capitalist "ate 2015": the browser game launched
     on Kongregate on May 30, 2014 and was Kongregate's most
     played game of 2014 (Hyper Hippo's own post-mortem); 2015 was
     the Steam/mobile expansion. In the Transport Tycoon shape,
     the entry now names the year its linked edition owns: 2014.
     The same sources settle its maker claim in passing — Hyper
     Hippo Productions developed and published it, and the linked
     build is Hyper Hippo's own Kongregate upload — so the entry
     also leaves the maker remainder.
   - Recoil Foundry's "2026 jam gem": the game's own itch page
     names no jam and no year, and presents an expanded, still-
     updated full release. No outside source settles the claim,
     so the year/jam framing is removed (the Mindustry rule: what
     no source settles does not ship as fact).

   Census after this pass: 117 claim instances (two removed, not
   relocated); 99 verified (45 year + 32 maker + 22 superlative);
   18 unverified, all maker/attribution, across 18 entries; 70
   entries carry a claim, 143 carry none. test_curator30 carries
   the updated census and its gate.

   Taxonomy: still untouched. The TAXONOMY_BRIEF.md call remains
   UNDECIDED; purrgatory, Lookouts and Little Troubles in Spooky
   Town stay pinned in horror, census 213 / horror 6 / cozy 16.

   Run: node scripts/test_curator31.js   (pure node, no browser)
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

/* ---------------- the tranche: the census's superlatives + years ---------------- */
const TRANCHE_SUPERLATIVE = ["canabalt", "celeste-classic", "cookie-clicker", "agar",
  "minecraft-classic", "spelunky-classic", "powder-game"];
const TRANCHE_YEAR = ["urban-dead", "minecraft-classic", "dare-to-doku",
  "recoil-foundry", "adventure-capitalist"];
{
  check("tranche: the census's seven superlatives and five years are the scope",
    TRANCHE_SUPERLATIVE.length === 7 && TRANCHE_YEAR.length === 5 &&
    [...TRANCHE_SUPERLATIVE, ...TRANCHE_YEAR].every((id) => byId[id]),
    "twelve claim instances across eleven entries (minecraft-classic carries two)");
  check("tranche: the maker remainder is out of this pass's scope",
    byId["song-maker"].description.includes("Google's") &&
    byId["subway-surfers"].description.includes("SYBO's") &&
    byId["sort-the-court"].description.includes("Graebor's"),
    "18 maker/attribution instances stayed unverified after this pass; wave 32 (pass 7) worked them all");
}

/* ------- verified as written, pinned verbatim ------- */
const VERIFIED = {
  "agar": "Eat or be eaten in the cell arena that defined .io games.",
  "celeste-classic": "The original PICO-8 Celeste: brutally precise mountain climbing across 30 levels.",
  "spelunky-classic": "The original free Spelunky as an HTML5 port: procedural caves, shopkeepers with long memories, and glorious deaths.",
  "minecraft-classic": "The 2009 creative-mode classic, free in the browser. Build with the original 32 blocks, invite friends to your world.",
  "urban-dead": "Browser zombie-survival MMO in a quarantined city. A 2005 classic.",
  "dare-to-doku": "A GBA Jam 2026 homebrew: a 'star battle' logic puzzle — deduce where every player hides in grids of 4–10 across 10,000 unique levels. Playable in the browser.",
};
Object.keys(VERIFIED).forEach((id) => {
  check("verified as written: " + id,
    byId[id] && byId[id].description === VERIFIED[id],
    "precedence/year checked against a source outside the repo, wave 31");
});
{
  check("verified detail: Agar.io is where the .io genre begins",
    byId["agar"].description.includes("defined .io games"),
    "Wikipedia: Agar.io's rise led to 'the beginning of a new genre of browser games, dubbed .io games'");
  check("verified detail: Celeste Classic is the 2015 PICO-8 original",
    byId["celeste-classic"].description.includes("The original PICO-8 Celeste"),
    "Thorson and Berry's August 2015 PICO-8 jam game, retroactively titled Celeste Classic");
  check("verified detail: Spelunky Classic is the 2008 freeware, not the HD remake",
    byId["spelunky-classic"].description.includes("The original free Spelunky") &&
    byId["spelunky-classic"].description.includes("HTML5 port"),
    "first public release December 21, 2008 as freeware; the entry links and names the port");
  check("verified detail: Minecraft Classic's 32 blocks are Mojang's own count",
    byId["minecraft-classic"].description.includes("original 32 blocks") &&
    byId["minecraft-classic"].description.includes("The 2009 creative-mode classic"),
    "Mojang's anniversary statement: 'the original creative mode, complete with 32 blocks'");
  check("verified detail: Urban Dead launched in 2005",
    byId["urban-dead"].description.includes("A 2005 classic"),
    "went live July 3, 2005 (Kevan Davis)");
  check("verified detail: Dare to Doku's own page names GBA Jam 2026",
    byId["dare-to-doku"].description.includes("GBA Jam 2026") &&
    byId["dare-to-doku"].url.includes("daretosquare.itch.io/dare-to-doku"),
    "the linked itch page: 'The game is made for the GBA Jam 2026'");
}

/* ---------------- the fixes, pinned verbatim ---------------- */
{
  check("fix: Canabalt claims the credit the record gives — popularized",
    byId["canabalt"].description ===
      "The one-button endless runner that popularized the endless runner. Jump or die.",
    "Wikipedia credits Canabalt with popularizing the subgenre; Ovenbreak (June 2009) predates it, so 'started' could not stand");
  check("fix: Cookie Clicker popularized idle games; it did not define them",
    byId["cookie-clicker"].description ===
      "The idle game that popularized idle games. Bake cookies. Achieve absurdity.",
    "Cow Clicker and Candy Box! predate it; incremental games 'gained popularity in 2013 after the success of Cookie Clicker'");
  check("fix: Powder Game's false 'original' is removed, not relocated",
    byId["powder-game"].description ===
      "A falling-sand toy: pour powder, water, fire, and acid into a sandbox and watch the physics play out.",
    "the genre's original is the 2005 Dofi-Blog applet; Powder Game (2007) is a later entry — the Angband shape");
  check("fix: AdVenture Capitalist names the year its linked edition owns — 2014",
    byId["adventure-capitalist"].description ===
      "Hyper Hippo's capitalist clicker: lemonade stands to moon shoes, the idle game that ate 2014 — officially on Kongregate.",
    "Kongregate launch May 30, 2014, Kong's most played game of 2014 (Hyper Hippo's post-mortem); 2015 was the Steam/mobile expansion");
  check("fix detail: AdVenture Capitalist's maker claim is settled by the same sources",
    byId["adventure-capitalist"].description.includes("Hyper Hippo's") &&
    byId["adventure-capitalist"].url.includes("kongregate.com/games/HyperHippoGames/"),
    "Hyper Hippo Productions developed and published it; the linked build is their own Kongregate upload");
  check("closure: Recoil Foundry's unsettled year/jam framing is removed",
    byId["recoil-foundry"].description ===
      "Build one gun whose recoil throws you across a factory. Movement IS the weapon — master the kick." &&
    !/\b(19|20)\d\d\b/.test(byId["recoil-foundry"].description),
    "the game's own page names no jam and no year and presents an updated full release — the Mindustry rule");
  check("closure: Powder Game's entry now carries no claim of these types",
    !/\b(first|original|defined|started|pioneer|popularized)\b/i.test(byId["powder-game"].description),
    "with recoil-foundry, it joins the claim-free entries; census instances 119 → 117");
}

/* ---------------- the census after this pass ---------------- */
{
  check("census after pass 6: the explicit-year scan drops to 46 hits",
    gamesDoc.games.filter((g) => /\b(19|20)\d\d\b/.test(g.description)).length === 46,
    "45 verified year claims + 2048's title number; recoil-foundry's removed 2026 was the 47th hit");
  check("census after pass 6: the remainder is 18 instances, all maker/attribution",
    byId["codenames"].description.includes("official online version") &&
    byId["tatham-puzzles"].description.includes("official JavaScript builds") &&
    byId["tristram"].description.includes("Ludum Dare 55"),
    "no year or superlative claim in the catalog remains unverified");
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
  const edited = ["canabalt", "cookie-clicker", "powder-game", "recoil-foundry",
    "adventure-capitalist"].map((id) => byId[id].description).join(" ");
  check("prose: no AI-slop phrasing in the corrected copy",
    !/delve|unlock the power|game-changer|elevate your|fast-paced world|whether you.re a beginner or a pro/i.test(edited),
    "denylist clean");
  check("legal lane: no ROM/BIOS download phrasing in the tranche entries",
    !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(edited),
    "legal lane holds");
}

console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
process.exit(failures ? 1 : 0);
