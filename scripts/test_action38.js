/* Wave 38 flagship checks: the Action Deep Dive (genres/action.html).

   (1) static: every featured card (data-game) is a real catalog
   record with genre "action", its play URL and controls line match
   the record verbatim, the kicker counts the cards on the page,
   and the page names the full action shelf it curates from;
   (2) versus: BMVersus profiles an action game with the dive as
   coverage, and the pinned Venge.io vs kaaarot pairing fired
   footprint AND coverage at wave 38 — since wave 39 kaaarot
   carries the multiplayer dive too, coverage ties 1-1 and
   footprint alone fires (asserted in test_multiplayer39);
   (3) headless: the page renders all 15 cards with exactly one
   h1, zero pageerrors, and no 390px overflow.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_action38.js
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
const page38 = fs.readFileSync(path.join(ROOT, "genres/action.html"), "utf8");
const featured = [...page38.matchAll(/data-game="([^"]+)"/g)].map((m) => m[1]);

/* ---------------- (1) static / record checks ---------------- */
{
  check("the dive features 15 distinct games",
    featured.length === 15 && new Set(featured).size === 15,
    featured.join(", "));
  check("every featured game is a real action record",
    featured.every((id) => byId[id] && byId[id].genre === "action"),
    "ids resolve against data/games.json with genre action");
  check("every card carries its record's URL and controls verbatim",
    featured.every((id) => {
      const card = page38.slice(page38.indexOf('data-game="' + id + '"'));
      const slice = card.slice(0, card.indexOf("</article>"));
      return slice.includes('href="' + byId[id].url + '"') &&
        slice.includes("Controls: " + byId[id].controls) &&
        slice.includes(">" + byId[id].title + "</a>");
    }),
    "no invented links, no paraphrased controls");
  const actionTotal = games.filter((g) => g.genre === "action").length;
  check("the page names the shelf it curates from, derived from the records",
    page38.includes(actionTotal + " of the catalog") &&
    page38.includes("All " + actionTotal + " action games") &&
    page38.includes("Genre deep dive · " + featured.length + " games"),
    actionTotal + " action games in the catalog, " + featured.length + " curated");
  check("exactly one h1; the dive is a browsing page (view transitions stamped)",
    (page38.match(/<h1[\s>]/g) || []).length === 1 && page38.includes("data-bm-vt"),
    "h1Count = 1 in source; bm-vt block present");
}

/* ---------------- (2) versus coverage ---------------- */
{
  const V = require(path.join(ROOT, "assets/js/versus-core.js"));
  const p = V.profile(byId["krunker"], { collections: [], kidIds: new Set() });
  check("versus: an action game now carries the dive as written coverage",
    p.coverage.some((c) => c.href === "genres/action.html" && c.label === "Genre deep dive: action") &&
    Object.keys(V.GENRE_DIVES).sort().join(",") === "action,cozy,horror,idle,multiplayer,puzzle,retro,roguelike",
    "krunker coverage: " + p.coverage.map((c) => c.label).join("; "));
  const kidsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"));
  const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
  const CTX = { collections: colsDoc.collections || [],
    kidIds: new Set((kidsDoc["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id)) };
  const cmp = V.compare(byId["venge"], byId["kaaarot"], CTX);
  check("versus: the pairing as wave 39 leaves it — Venge.io vs kaaarot ties on coverage, footprint alone fires",
    cmp.ok && !cmp.thin && cmp.verdicts.length === 1 &&
    cmp.verdicts[0].kind === "footprint" &&
    V.profile(byId["venge"], CTX).coverageCount === 1 &&
    V.profile(byId["kaaarot"], CTX).coverageCount === 1,
    "venge carries the action dive; kaaarot carries the multiplayer dive since wave 39 (1 coverage entry each) — at wave 38 footprint + coverage fired; the tie is the new truth, asserted not loosened");
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
  await page.goto(BASE + "/genres/action.html", { waitUntil: "load", timeout: 60000 });
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
  console.log(failures ? "ACTION38: " + failures + " FAILURES" : "ACTION38 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("ACTION38 ERROR", e); process.exit(1); });
