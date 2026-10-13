/* Wave 40 flagship checks: the Idle Deep Dive (genres/idle.html).

   (1) static: every featured card (data-game) is a real catalog
   record with genre "idle", its play URL and controls line match
   the record verbatim, the kicker counts the cards on the page,
   and the dive features the WHOLE idle shelf (all 15 records);
   (2) versus: BMVersus profiles an idle game with the dive as
   coverage, and the pinned Cookie Clicker vs kaaarot pairing now
   fires footprint + coverage + Kids (coverage 2-1 since the
   dive; wave 39 tied it 1-1 — Cookie's Kids listing against
   kaaarot's multiplayer dive);
   (3) headless: the page renders all 15 cards with exactly one
   h1, zero pageerrors, and no 390px overflow.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_idle40.js
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
const page40 = fs.readFileSync(path.join(ROOT, "genres/idle.html"), "utf8");
const featured = [...page40.matchAll(/data-game="([^"]+)"/g)].map((m) => m[1]);

/* ---------------- (1) static / record checks ---------------- */
{
  check("the dive features 15 distinct games",
    featured.length === 15 && new Set(featured).size === 15,
    featured.join(", "));
  check("every featured game is a real idle record",
    featured.every((id) => byId[id] && byId[id].genre === "idle"),
    "ids resolve against data/games.json with genre idle");
  check("the dive curates the whole shelf — every idle record is featured",
    games.filter((g) => g.genre === "idle").every((g) => featured.includes(g.id)),
    "15 idle records in the catalog, 15 on the page, none left over");
  check("every card carries its record's URL and controls verbatim",
    featured.every((id) => {
      const card = page40.slice(page40.indexOf('data-game="' + id + '"'));
      const slice = card.slice(0, card.indexOf("</article>"));
      return slice.includes('href="' + byId[id].url + '"') &&
        slice.includes("Controls: " + byId[id].controls) &&
        slice.includes(">" + byId[id].title + "</a>");
    }),
    "no invented links, no paraphrased controls");
  const idleTotal = games.filter((g) => g.genre === "idle").length;
  check("the page names the shelf it curates from, derived from the records",
    page40.includes(idleTotal + " of the catalog") &&
    page40.includes("All " + idleTotal + " idle games") &&
    page40.includes("Genre deep dive · " + featured.length + " games") &&
    page40.includes("every idle game in the catalog is on this page"),
    idleTotal + " idle games in the catalog, " + featured.length + " curated — the whole shelf");
  check("exactly one h1; the dive is a browsing page (view transitions stamped)",
    (page40.match(/<h1[\s>]/g) || []).length === 1 && page40.includes("data-bm-vt"),
    "h1Count = 1 in source; bm-vt block present");
  check("every dive card reaches the play journal for its own game",
    featured.every((id) => page40.includes('href="../journal.html?game=' + id + '"')),
    "journal.html?game=<id> on all 15 cards (T-MASH-2 reachability)");
}

/* ---------------- (2) versus coverage ---------------- */
{
  const V = require(path.join(ROOT, "assets/js/versus-core.js"));
  const p = V.profile(byId["cookie-clicker"], { collections: [], kidIds: new Set() });
  check("versus: an idle game now carries the dive as written coverage",
    p.coverage.some((c) => c.href === "genres/idle.html" && c.label === "Genre deep dive: idle") &&
    Object.keys(V.GENRE_DIVES).sort().join(",") === "action,cozy,idle,multiplayer,puzzle,retro,roguelike",
    "cookie-clicker coverage: " + p.coverage.map((c) => c.label).join("; "));
  const kidsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"));
  const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
  const CTX = { collections: colsDoc.collections || [],
    kidIds: new Set((kidsDoc["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id)) };
  const cmp = V.compare(byId["cookie-clicker"], byId["kaaarot"], CTX);
  check("versus: the changed pairing — Cookie Clicker vs kaaarot fires footprint + coverage + Kids since the dive",
    cmp.ok && !cmp.thin && cmp.verdicts.length === 3 &&
    cmp.verdicts.map((v) => v.kind).join(",") === "footprint,coverage,kids" &&
    V.profile(byId["cookie-clicker"], CTX).coverageCount === 2 &&
    V.profile(byId["kaaarot"], CTX).coverageCount === 1,
    "cookie carries the idle dive + Kids listing (2), kaaarot the multiplayer dive (1) — before wave 40 coverage tied 1-1 and footprint + Kids alone fired");
  const thin = V.compare(byId["lookouts"], byId["dating-killmulator-2"], CTX);
  check("versus: the thin state does not move — the bare tail is still the two horror records",
    thin.ok && thin.thin && thin.verdicts.length === 0,
    "every idle game was already Kids-listed; lookouts vs dating-killmulator-2 stays no-basis");
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
  await page.goto(BASE + "/genres/idle.html", { waitUntil: "load", timeout: 60000 });
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
  console.log(failures ? "IDLE40: " + failures + " FAILURES" : "IDLE40 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("IDLE40 ERROR", e); process.exit(1); });
