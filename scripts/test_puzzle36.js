/* Wave 36 flagship checks: the Puzzle Deep Dive (genres/puzzle.html).

   (1) static: every featured card (data-game) is a real catalog
   record with genre "puzzle", its play URL and controls line match
   the record verbatim, the kicker counts the cards on the page,
   and the page names the full puzzle shelf it curates from;
   (2) versus: BMVersus profiles a puzzle game with the dive as
   coverage; (3) headless: the page renders all 15 cards with
   exactly one h1, zero pageerrors, and no 390px overflow.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_puzzle36.js
   Exit 0 = all pass. */
"use strict";
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = "/home/hatch/workspace/button-mash";
const BASE = "file://" + ROOT;
let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, "—", detail); }
  else { failures++; console.error("FAIL", name, "—", detail); }
}

const games = JSON.parse(fs.readFileSync(path.join(ROOT, "data/games.json"), "utf8")).games;
const byId = {};
games.forEach((g) => { byId[g.id] = g; });
const page36 = fs.readFileSync(path.join(ROOT, "genres/puzzle.html"), "utf8");
const featured = [...page36.matchAll(/data-game="([^"]+)"/g)].map((m) => m[1]);

/* ---------------- (1) static / record checks ---------------- */
{
  check("the dive features 15 distinct games",
    featured.length === 15 && new Set(featured).size === 15,
    featured.join(", "));
  check("every featured game is a real puzzle record",
    featured.every((id) => byId[id] && byId[id].genre === "puzzle"),
    "ids resolve against data/games.json with genre puzzle");
  check("every card carries its record's URL and controls verbatim",
    featured.every((id) => {
      const card = page36.slice(page36.indexOf('data-game="' + id + '"'));
      const slice = card.slice(0, card.indexOf("</article>"));
      return slice.includes('href="' + byId[id].url + '"') &&
        slice.includes("Controls: " + byId[id].controls) &&
        slice.includes(">" + byId[id].title + "</a>");
    }),
    "no invented links, no paraphrased controls");
  const puzzleTotal = games.filter((g) => g.genre === "puzzle").length;
  check("the page names the shelf it curates from, derived from the records",
    page36.includes(puzzleTotal + " of the catalog") &&
    page36.includes("All " + puzzleTotal + " puzzle games") &&
    page36.includes("Genre deep dive · " + featured.length + " games"),
    puzzleTotal + " puzzle games in the catalog, " + featured.length + " curated");
  check("exactly one h1; the dive is a browsing page (view transitions stamped)",
    (page36.match(/<h1[\s>]/g) || []).length === 1 && page36.includes("data-bm-vt"),
    "h1Count = 1 in source; bm-vt block present");
}

/* ---------------- (2) versus coverage ---------------- */
{
  const V = require(path.join(ROOT, "assets/js/versus-core.js"));
  const p = V.profile(byId["2048"], { collections: [], kidIds: new Set() });
  check("versus: a puzzle game now carries the dive as written coverage",
    p.coverage.some((c) => c.href === "genres/puzzle.html" && c.label === "Genre deep dive: puzzle") &&
    Object.keys(V.GENRE_DIVES).sort().join(",") === "cozy,puzzle,roguelike",
    "2048 coverage: " + p.coverage.map((c) => c.label).join("; "));
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
  await page.goto(BASE + "/genres/puzzle.html", { waitUntil: "load", timeout: 60000 });
  const rendered = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    cards: document.querySelectorAll("[data-game]").length,
    title: document.title,
  }));
  check("headless: page renders all cards under exactly one h1",
    rendered.h1 === 1 && rendered.cards === 15,
    "h1=" + rendered.h1 + " cards=" + rendered.cards + " — " + rendered.title);
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 400));
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("headless: 390px mobile has zero horizontal overflow", overflow <= 0, "overflow=" + overflow);
  check("headless: zero pageerrors", pageErrors.length === 0, pageErrors.join(" | ") || "clean");
  await browser.close();
  console.log(failures ? "PUZZLE36: " + failures + " FAILURES" : "PUZZLE36 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("PUZZLE36 ERROR", e); process.exit(1); });
