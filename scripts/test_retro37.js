/* Wave 37 flagship checks: the Retro Deep Dive (genres/retro.html).

   (1) static: every featured card (data-game) is a real catalog
   record with genre "retro", its title links the on-site game file
   and its controls line matches the record verbatim (R26 refresh:
   the R22/R23 no-outbound law abolished the record-URL card link
   this suite originally pinned), the kicker counts the cards on
   the page,
   and the page names the full retro shelf it curates from;
   (2) versus: BMVersus profiles a retro game with the dive as
   coverage, and the pinned Zork I vs 2048 pairing's coverage is
   now tied (the retro dive answers the puzzle dive);
   (3) headless: the page renders all 15 cards with exactly one
   h1, zero pageerrors, and no 390px overflow.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_retro37.js
   Exit 0 = all pass. */
"use strict";
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = "/home/hatch/workspace/button-mash";
const BASE = "file://" + ROOT;
let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, ", ", detail); }
  else { failures++; console.error("FAIL", name, ", ", detail); }
}

const games = JSON.parse(fs.readFileSync(path.join(ROOT, "data/games.json"), "utf8")).games;
const byId = {};
games.forEach((g) => { byId[g.id] = g; });
const page37 = fs.readFileSync(path.join(ROOT, "genres/retro.html"), "utf8");
const featured = [...page37.matchAll(/data-game="([^"]+)"/g)].map((m) => m[1]);

/* ---------------- (1) static / record checks ---------------- */
{
  check("the dive features 15 distinct games",
    featured.length === 15 && new Set(featured).size === 15,
    featured.join(", "));
  check("every featured game is a real retro record",
    featured.every((id) => byId[id] && byId[id].genre === "retro"),
    "ids resolve against data/games.json with genre retro");
  check("every card links its on-site game file and carries its controls verbatim — no outbound play link",
    featured.every((id) => {
      const card = page37.slice(page37.indexOf('data-game="' + id + '"'));
      const slice = card.slice(0, card.indexOf("</article>"));
      return slice.includes('href="../game.html?id=' + id + '"') &&
        !slice.includes('href="' + byId[id].url + '"') &&
        slice.includes("Controls: " + byId[id].controls) &&
        slice.includes(">" + byId[id].title + "</a>");
    }),
    "on-site game-file link per card; the record's outbound URL is not a link anywhere on the card; controls verbatim");
  const retroTotal = games.filter((g) => g.genre === "retro").length;
  check("the page names the shelf it curates from, derived from the records",
    page37.includes(retroTotal + " of the catalog") &&
    page37.includes("All " + retroTotal + " retro games") &&
    page37.includes("Genre deep dive · " + featured.length + " games"),
    retroTotal + " retro games in the catalog, " + featured.length + " curated");
  check("exactly one h1; the dive is a browsing page (view transitions stamped)",
    (page37.match(/<h1[\s>]/g) || []).length === 1 && page37.includes("data-bm-vt"),
    "h1Count = 1 in source; bm-vt block present");
}

/* ---------------- (2) versus coverage ---------------- */
{
  const V = require(path.join(ROOT, "assets/js/versus-core.js"));
  const p = V.profile(byId["zork1"], { collections: [], kidIds: new Set() });
  check("versus: a retro game now carries the dive as written coverage",
    p.coverage.some((c) => c.href === "genres/retro.html" && c.label === "Genre deep dive: retro") &&
    Object.keys(V.GENRE_DIVES).sort().join(",") === "action,cozy,horror,idle,multiplayer,puzzle,retro,roguelike",
    "zork1 coverage: " + p.coverage.map((c) => c.label).join("; "));
  const kidsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"));
  const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
  const CTX = { collections: colsDoc.collections || [],
    kidIds: new Set((kidsDoc["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id)) };
  const cmp = V.compare(byId["zork1"], byId["2048"], CTX);
  check("versus: the pinned pairing's coverage is tied, footprint alone fires",
    cmp.ok && cmp.verdicts.length === 1 && cmp.verdicts[0].kind === "footprint" &&
    V.profile(byId["zork1"], CTX).coverageCount === V.profile(byId["2048"], CTX).coverageCount,
    "zork1 and 2048 each carry a dive + a Kids listing (2 coverage entries each)");
}

/* ---------------- (3) headless ---------------- */
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  await page.goto(BASE + "/genres/retro.html", { waitUntil: "load", timeout: 60000 });
  const rendered = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    cards: document.querySelectorAll("[data-game]").length,
    title: document.title,
  }));
  check("headless: page renders all cards under exactly one h1",
    rendered.h1 === 1 && rendered.cards === 15,
    "h1=" + rendered.h1 + " cards=" + rendered.cards + ": " + rendered.title);
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 400));
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("headless: 390px mobile has zero horizontal overflow", overflow <= 0, "overflow=" + overflow);
  check("headless: zero pageerrors", pageErrors.length === 0, pageErrors.join(" | ") || "clean");
  await browser.close();
  console.log(failures ? "RETRO37: " + failures + " FAILURES" : "RETRO37 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("RETRO37 ERROR", e); process.exit(1); });
