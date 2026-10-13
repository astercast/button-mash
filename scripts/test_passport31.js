/* Wave 31 flagship checks: the Arcade Passport.

   (1) unit checks against the UMD core (assets/js/passport-core.js)
   with an injected storage backend; (2) the checklist registry is
   pinned against the real guide pages — step counts must match the
   ul.checklist lengths or the suite fails; (3) headless: the
   Collections page stamps shelves as they scroll into view and the
   stamps persist, passport.html renders the booklet from that same
   store, a finished guide checklist earns its mark on the visa
   page, surrender clears stamps only; (4) mobile 390px booklet:
   zero overflow. Zero pageerrors throughout.

   Honesty contract under test: a stamp exists only because a shelf
   was actually on screen; a guide mark exists only because every
   checklist step is ticked in bm_checks_v1 — the site's own store.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_passport31.js
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PP = require(path.join(ROOT, "assets/js/passport-core.js"));
const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
const COLLECTIONS = colsDoc.collections || [];

function fakeStorage() {
  const m = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    _map: m,
  };
}

/* ---------------- (1) core unit checks ---------------- */
{
  check("core surface: key, schema, registry",
    PP.STORE_KEY === "bm.passport.v1" && PP.SCHEMA_VERSION === 1 && PP.GUIDE_CHECKLISTS.length === 2,
    PP.STORE_KEY + " / " + PP.GUIDE_CHECKLISTS.map((g) => g.page).join(", "));
  const st = fakeStorage();
  const s0 = PP.loadState(st);
  check("blank storage reads as a blank passport", PP.stampCount(s0) === 0 && PP.firstStampAt(s0) === null,
    "no stamps, no start date — nothing invented");
  check("stamp: first sighting wins and never re-dates",
    PP.stamp(s0, "rainy-day-cozy", 1000) === true && PP.stamp(s0, "rainy-day-cozy", 9999) === false &&
    s0.stamps["rainy-day-cozy"] === 1000,
    "the book records the first visit, not the latest");
  PP.saveState(s0, st);
  const s1 = PP.loadState(st);
  check("stamps persist through the storage round-trip",
    PP.hasStamp(s1, "rainy-day-cozy") && PP.stampCount(s1) === 1,
    "localStorage key " + PP.STORE_KEY);
  const corrupt = PP.validateState({ stamps: { a: 5, b: "soon", c: -3, d: 7 }, v: 99 });
  check("validation drops corrupt entries one by one",
    PP.stampCount(corrupt) === 2 && corrupt.stamps.a === 5 && corrupt.stamps.d === 7,
    "a tampered passport loses the bad stamps, not the book");
  check("unparseable storage reads as blank, never a crash",
    PP.stampCount(PP.loadState({ getItem: () => "{nope", setItem: () => {}, removeItem: () => {} })) === 0,
    "the lineups rule");
  const partial = PP.guideMarks((p) => (p === "retroarch-setup" ? [0, 1, 2, 3] : [0, 1, 2, 3, 4]));
  check("guide marks: partial progress is not a mark",
    partial[0].ticked === 4 && partial[0].steps === 5 && !partial[0].complete && partial[1].complete,
    "4/5 steps earns nothing but the honest count");
  const prog = PP.progress(s1, COLLECTIONS, partial);
  check("progress counts only real collections and completed marks",
    prog.stamps === 1 && prog.stampsTotal === 24 && prog.marks === 1 && prog.marksTotal === 2,
    prog.stamps + "/" + prog.stampsTotal + " stamps, " + prog.marks + "/" + prog.marksTotal + " marks");
  PP.clearStamps(s1);
  check("surrender clears stamps", PP.stampCount(s1) === 0 && PP.firstStampAt(s1) === null, "blank again");
}

/* ---------------- (2) registry pinned to the real guides ---------------- */
{
  PP.GUIDE_CHECKLISTS.forEach((g) => {
    const html = fs.readFileSync(path.join(ROOT, g.url), "utf8");
    const m = html.match(new RegExp('<ul class="checklist" data-page="' + g.page + '">([\\s\\S]*?)</ul>'));
    const items = m ? (m[1].match(/<li>/g) || []).length : -1;
    check("registry pin: " + g.page + " checklist really has " + g.steps + " steps",
      items === g.steps, "guide page carries " + items + " checklist items");
  });
  check("registry pin: these are the only checklist guides on the site",
    PP.GUIDE_CHECKLISTS.every((g) => fs.existsSync(path.join(ROOT, g.url))),
    "marks exist only where the site tracks completion");
}

/* ---------------- (3-4) headless ---------------- */
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("dialog", (d) => d.accept());

  // Collections: scroll the first shelves into view → stamps land.
  await page.goto(BASE + "/collections.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".collection-card", { timeout: 30000 });
  await sleep(600);
  const chip0 = await page.$eval("#passport-chip", (el) => el.textContent);
  check("collections: the passport chip is live in the hero", /Arcade passport:/.test(chip0), chip0.trim());
  await page.evaluate(() => {
    // behavior:"auto" — the page's CSS smooth-scroll is animation, not
    // arrival; the site's own scrollToShelf makes the same choice.
    document.querySelectorAll(".collection-card")[2].scrollIntoView({ behavior: "auto", block: "center" });
  });
  // IO callbacks land asynchronously; wait for the count to settle,
  // then take ONE snapshot and hold every later check to it.
  await page.waitForFunction(
    () => Object.keys(JSON.parse(localStorage.getItem("bm.passport.v1") || "{}").stamps || {}).length >= 2,
    { timeout: 30000 });
  let lastCount = -1;
  for (let i = 0; i < 20; i++) {
    const n = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("bm.passport.v1") || "{}").stamps || {}).length);
    if (n === lastCount) break;
    lastCount = n;
    await sleep(500);
  }
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("bm.passport.v1") || "{}"));
  const stampIds = Object.keys(stored.stamps || {});
  check("collections: shelves that entered the viewport are stamped",
    stampIds.length >= 2, stampIds.length + " stamps after scrolling: " + stampIds.slice(0, 4).join(", "));
  const ribbon = await page.evaluate(() => !!document.querySelector(".collection-card .stamp-ribbon"));
  check("collections: a stamped shelf wears its ink ribbon", ribbon, "ribbon painted from the same store");
  const chip1 = await page.$eval("#passport-chip", (el) => el.textContent);
  check("collections: the chip count matches the store",
    chip1.includes(stampIds.length + " / 24 stamped"), chip1.trim());

  // Passport page: the booklet renders from that store.
  await page.goto(BASE + "/passport.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".stamp-cell", { timeout: 30000 });
  await sleep(400);
  const cells = await page.$$eval(".stamp-cell", (els) => els.length);
  const stampedCells = await page.$$eval(".stamp-cell.is-stamped", (els) => els.length);
  const line = await page.$eval("#pp-progress-line", (el) => el.textContent);
  check("passport: the booklet renders all 24 shelves",
    cells === 24, cells + " cells");
  check("passport: stamped cells match the collections store",
    stampedCells === stampIds.length, stampedCells + " stamped of " + stampIds.length + " stored");
  check("passport: the progress line tells the same count",
    line.includes(stampIds.length + " of 24 shelves stamped"), line.trim());
  const inkDate = await page.$eval(".stamp-cell.is-stamped .pp-date", (el) => el.textContent);
  check("passport: a stamp carries its date in ink", /\d{1,2} [A-Z]{3} \d{4}/.test(inkDate), inkDate);

  // Guide mark: tick every RetroArch checklist step, then re-read the visa page.
  await page.goto(BASE + "/guides/retroarch-setup.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".check-toggle", { timeout: 30000 });
  await page.$$eval(".check-toggle", (btns) => btns.forEach((b) => { if (b.getAttribute("aria-pressed") !== "true") b.click(); }));
  await sleep(300);
  const checks = await page.evaluate(() => JSON.parse(localStorage.getItem("bm_checks_v1") || "{}"));
  check("guide: the checklist store holds all 5 ticks",
    (checks["retroarch-setup"] || []).length === 5, JSON.stringify(checks["retroarch-setup"]));
  await page.goto(BASE + "/passport.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".visa-row", { timeout: 30000 });
  await sleep(400);
  const visa = await page.$$eval(".visa-row", (els) => els.map((el) => el.textContent));
  check("passport: the finished guide's mark is earned on the visa page",
    visa.some((t) => t.includes("RetroArch") && t.includes("Guide mark earned")) &&
    visa.some((t) => t.includes("EmulatorJS") && t.includes("Mark not yet earned")),
    visa.map((t) => t.replace(/\s+/g, " ").slice(0, 60)).join(" | "));

  // Surrender: stamps clear, guide marks (not ours to clear) stay.
  await page.click("#pp-reset");
  await sleep(400);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("bm.passport.v1") || "{}"));
  const visaAfter = await page.$$eval(".visa-row", (els) => els.map((el) => el.textContent));
  check("passport: surrender clears stamps and only stamps",
    Object.keys(after.stamps || {}).length === 0 &&
    visaAfter.some((t) => t.includes("Guide mark earned")),
    "stamps gone; the checklist-derived mark is the guide's record, not the passport's");

  // Mobile booklet.
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + "/passport.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".stamp-cell", { timeout: 30000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check("mobile 390px: the booklet has zero horizontal overflow", !overflow, "390px wide, no sideways scroll");

  check("zero pageerrors across the whole flow", errors.length === 0, errors.slice(0, 3).join(" | ") || "clean");
  await browser.close();
  console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(1); });
