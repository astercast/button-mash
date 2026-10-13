/* Wave 41 flagship checks: the Horror Deep Dive (genres/horror.html).

   (1) static: every featured card (data-game) is a real catalog
   record with genre "horror", its play URL and controls line match
   the record verbatim, the kicker counts the cards on the page,
   and the dive features the WHOLE horror shelf (all 6 records);
   (2) versus: BMVersus profiles a horror game with the dive as
   coverage (the registry now names all eight dives — the set is
   complete), no catalog record is bare anymore, and the pinned
   Lookouts vs Dating Killmulator 2 pairing still gets the honest
   no-basis state — now because their coverage ties 1-1 on the
   horror dive, not because neither record carries anything.
   Lookouts vs kaaarot flips the other way: kaaarot's coverage
   verdict (1-0 since wave 39) is gone, tied 1-1, so the pairing
   is thin now too;
   (3) headless: the page renders all 6 cards with exactly one
   h1, zero pageerrors, and no 390px overflow.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_horror41.js
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
const page41 = fs.readFileSync(path.join(ROOT, "genres/horror.html"), "utf8");
const featured = [...page41.matchAll(/data-game="([^"]+)"/g)].map((m) => m[1]);

/* ---------------- (1) static / record checks ---------------- */
{
  check("the dive features 6 distinct games",
    featured.length === 6 && new Set(featured).size === 6,
    featured.join(", "));
  check("every featured game is a real horror record",
    featured.every((id) => byId[id] && byId[id].genre === "horror"),
    "ids resolve against data/games.json with genre horror");
  check("the dive curates the whole shelf — every horror record is featured",
    games.filter((g) => g.genre === "horror").every((g) => featured.includes(g.id)),
    "6 horror records in the catalog, 6 on the page, none left over");
  check("every card carries its record's URL and controls verbatim",
    featured.every((id) => {
      const card = page41.slice(page41.indexOf('data-game="' + id + '"'));
      const slice = card.slice(0, card.indexOf("</article>"));
      return slice.includes('href="' + byId[id].url + '"') &&
        slice.includes("Controls: " + byId[id].controls) &&
        slice.includes(">" + byId[id].title + "</a>");
    }),
    "no invented links, no paraphrased controls");
  const horrorTotal = games.filter((g) => g.genre === "horror").length;
  check("the page names the shelf it curates from, derived from the records",
    page41.includes(horrorTotal + " of the catalog") &&
    page41.includes("All " + horrorTotal + " horror games") &&
    page41.includes("Genre deep dive · " + featured.length + " games") &&
    page41.includes("every horror game in the catalog is on this page"),
    horrorTotal + " horror games in the catalog, " + featured.length + " curated — the whole shelf");
  check("the page says the dive set is complete — 8 of 8, the full shelf",
    page41.includes("8 of 8") && page41.includes("every genre in the catalog now has one"),
    "horror was the last dive standing; the page and the hub say so");
  check("exactly one h1; the dive is a browsing page (view transitions stamped)",
    (page41.match(/<h1[\s>]/g) || []).length === 1 && page41.includes("data-bm-vt"),
    "h1Count = 1 in source; bm-vt block present");
  check("every dive card reaches the play journal for its own game",
    featured.every((id) => page41.includes('href="../journal.html?game=' + id + '"')),
    "journal.html?game=<id> on all 6 cards (T-MASH-2 reachability)");
}

/* ---------------- (2) versus coverage ---------------- */
{
  const V = require(path.join(ROOT, "assets/js/versus-core.js"));
  const p = V.profile(byId["lookouts"], { collections: [], kidIds: new Set() });
  check("versus: a horror game now carries the dive as written coverage",
    p.coverage.some((c) => c.href === "genres/horror.html" && c.label === "Genre deep dive: horror") &&
    Object.keys(V.GENRE_DIVES).sort().join(",") === "action,cozy,horror,idle,multiplayer,puzzle,retro,roguelike",
    "lookouts coverage: " + p.coverage.map((c) => c.label).join("; ") + " — the registry names all eight dives");
  const kidsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"));
  const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
  const CTX = { collections: colsDoc.collections || [],
    kidIds: new Set((kidsDoc["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id)) };
  check("versus: every horror game gains exactly the dive as coverage (0 -> 1)",
    games.filter((g) => g.genre === "horror").every((g) => {
      const pr = V.profile(g, CTX);
      return pr.coverageCount === 1 && pr.coverage[0].label === "Genre deep dive: horror";
    }),
    "no horror game is Kids-listed, so the dive is each one's first and only coverage");
  const bare = games.filter((g) => { const pr = V.profile(g, CTX); return pr.year === null && pr.collectionCount === 0 && !pr.tags.length && !pr.kidSafe && pr.coverageCount === 0; });
  check("versus: the catalog's bare tail is gone — no record is bare anymore",
    bare.length === 0,
    "before wave 41 the bare tail was lookouts + dating-killmulator-2; the horror dive covers both");
  const thin = V.compare(byId["lookouts"], byId["dating-killmulator-2"], CTX);
  check("versus: the pinned pairing — Lookouts vs Dating Killmulator 2 still gets the no-basis state, now on a coverage tie",
    thin.ok && thin.thin && thin.verdicts.length === 0 &&
    V.profile(byId["lookouts"], CTX).coverageCount === 1 &&
    V.profile(byId["dating-killmulator-2"], CTX).coverageCount === 1,
    "coverage ties 1-1 on the horror dive and nothing else separates the records — the strip still refuses, for the new reason");
  const flip = V.compare(byId["lookouts"], byId["kaaarot"], CTX);
  check("versus: the flipped pairing — Lookouts vs kaaarot loses kaaarot's coverage verdict and goes thin",
    flip.ok && flip.thin && flip.verdicts.length === 0,
    "since wave 39 kaaarot's multiplayer dive fired a coverage verdict against bare lookouts (1-0); the horror dive ties coverage 1-1, so no verdict fires");
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
  await page.goto(BASE + "/genres/horror.html", { waitUntil: "load", timeout: 60000 });
  const rendered = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    cards: document.querySelectorAll("[data-game]").length,
    title: document.title,
  }));
  check("headless: page renders all cards under exactly one h1",
    rendered.h1 === 1 && rendered.cards === 6,
    "h1=" + rendered.h1 + " cards=" + rendered.cards + " — " + rendered.title);
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 400));
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("headless: 390px mobile has zero horizontal overflow", overflow <= 0, "overflow=" + overflow);
  check("headless: zero pageerrors", pageErrors.length === 0, pageErrors.join(" | ") || "clean");
  await browser.close();
  console.log(failures ? "HORROR41: " + failures + " FAILURES" : "HORROR41 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HORROR41 ERROR", e); process.exit(1); });
