/* Wave 35 flagship checks: the Exclusion Ledger on parents.html
   + generator-level View Transitions.

   (1) static: the stamped ledger lists every excluded game from
   data/kids.json exactly once with its reason verbatim, the
   accounting derives from the records, and the ledger's filter
   script fetches nothing and deals nothing; (2) headless: the
   ledger renders whole on parents.html, the lookup box narrows
   it and reports honestly (including the no-match state, which
   points at Kids corner), a curated game has no row, parents
   carries no view-transition block while a browsing page does;
   (3) mobile 390px: zero overflow. Zero pageerrors throughout.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_ledger35.js
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

const kids = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kids.json"), "utf8"));
const games = JSON.parse(fs.readFileSync(path.join(ROOT, "data/games.json"), "utf8")).games;
const parentsHtml = fs.readFileSync(path.join(ROOT, "parents.html"), "utf8");
const filterSrc = fs.readFileSync(path.join(ROOT, "assets/js/ledger-filter.js"), "utf8");

/* ---------------- (1) static / record checks ---------------- */
{
  const ids = [...parentsHtml.matchAll(/data-ledger-id="([^"]+)"/g)].map((m) => m[1]);
  check("ledger lists the whole 'out' half, once each",
    ids.length === kids.excluded.length && new Set(ids).size === kids.excluded.length &&
    kids.excluded.every((e) => ids.includes(e.id)),
    ids.length + " rows for " + kids.excluded.length + " recorded exclusions");
  check("accounting closes: curated + excluded = catalog",
    kids.curated.length + kids.excluded.length === games.length &&
    parentsHtml.includes(games.length + " games audited"),
    kids.curated.length + " + " + kids.excluded.length + " = " + games.length);
  const tetrio = kids.excluded.find((e) => e.id === "tetrio");
  check("a known reason sits on the page word for word",
    !!tetrio && parentsHtml.includes(tetrio.reason),
    "tetrio: " + (tetrio && tetrio.reason));
  check("filter script is a filter and nothing more",
    !/Math\.random\s*\(/.test(filterSrc) && !/fetch\s*\(/.test(filterSrc) &&
    filterSrc.includes("data-ledger-item"),
    "no fetch, no chance — rows are already on the page");
}

/* ---------------- (2)+(3) headless ---------------- */
async function newPage(browser) {
  const page = await browser.newPage();
  const errors = [];
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (t.indexOf("Failed to load resource: net::ERR_FILE_NOT_FOUND") === 0) return;
    // file:// browsing blocks cross-origin font/data fetches by design
    // (origin "null") — environment noise on data-driven pages, the
    // same class the older suites filter; pageerrors stay strict.
    if (t.includes("blocked by CORS policy")) return;
    errors.push("[console.error] " + t.slice(0, 200));
  });
  page.on("pageerror", (e) => {
    const s = "[pageerror] " + String(e).slice(0, 200);
    errors.push(s); pageErrors.push(s);
  });
  page.on("requestfailed", (r) => {
    if (r.url().includes("/api/")) return;
    if (r.url().startsWith("file://") &&
        (r.url().includes("/assets/fonts/") || r.url().includes("/data/"))) return;
    errors.push("[requestfailed] " + r.url().slice(0, 120));
  });
  await page.setViewport({ width: 1280, height: 900 });
  return { page, errors, pageErrors };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/parents.html", { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForSelector("[data-ledger-item]", { timeout: 15000 });

    const census = await page.evaluate(() => ({
      rows: document.querySelectorAll("[data-ledger-item]").length,
      h1: document.querySelectorAll("h1").length,
      vt: !!document.querySelector("style[data-bm-vt]"),
      tetrio: (document.querySelector('[data-ledger-id="tetrio"]') || {}).textContent || "",
      curatedRow: !!document.querySelector('[data-ledger-id="2048"]'),
    }));
    check("headless: ledger renders whole, one h1, no VT block on the family page",
      census.rows === kids.excluded.length && census.h1 === 1 && census.vt === false,
      census.rows + " rows, h1=" + census.h1 + ", vt=" + census.vt);
    const tetrioRec = kids.excluded.find((e) => e.id === "tetrio");
    check("headless: the rendered tetrio row carries the recorded reason",
      census.tetrio.includes(tetrioRec.reason) && census.curatedRow === false,
      "curated 2048 correctly has no ledger row");

    await page.focus("#ledger-search");
    await page.type("#ledger-search", "tetr");
    await sleep(300);
    const narrowed = await page.evaluate(() => ({
      visible: [...document.querySelectorAll("[data-ledger-item]")].filter((li) => !li.hidden).length,
      status: document.getElementById("ledger-status").textContent,
    }));
    check("lookup narrows the ledger and says by how much",
      narrowed.visible > 0 && narrowed.visible < kids.excluded.length &&
      narrowed.status.includes("kept-out games match"),
      narrowed.visible + " visible — " + narrowed.status);

    await page.evaluate(() => {
      const i = document.getElementById("ledger-search");
      i.value = ""; i.dispatchEvent(new Event("input", { bubbles: true }));
      i.value = "zzzz-no-such-game"; i.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(200);
    const none = await page.evaluate(() => ({
      visible: [...document.querySelectorAll("[data-ledger-item]")].filter((li) => !li.hidden).length,
      status: document.getElementById("ledger-status").textContent,
    }));
    check("no-match state is honest and points at Kids corner",
      none.visible === 0 && none.status.includes("No kept-out game matches") &&
      none.status.includes("Kids corner"),
      none.status.slice(0, 90));

    const games1 = await newPage(browser);
    await games1.page.goto(BASE + "/games.html", { waitUntil: "networkidle0", timeout: 60000 });
    const vtGames = await games1.page.evaluate(
      () => !!document.querySelector("style[data-bm-vt]"));
    check("a browsing page carries the stamped view-transition block",
      vtGames === true, "games.html opt-in present (both gates in the stamped CSS)");
    // games.html over file:// cannot fetch its data files (CORS,
    // origin "null") — that console noise is environmental; the
    // strict signal on a page this wave did not build is that no
    // uncaught exception fires. parents.html below is held to the
    // full zero-error bar and passes it.
    check("zero uncaught pageerrors on games.html", games1.pageErrors.length === 0,
      games1.pageErrors.join(" | ") || "clean");

    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => {
      const i = document.getElementById("ledger-search");
      i.value = ""; i.dispatchEvent(new Event("input", { bubbles: true }));
      window.scrollTo(0, 0);
    });
    await sleep(300);
    const mobile = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      rows: [...document.querySelectorAll("[data-ledger-item]")].filter((li) => !li.hidden).length,
    }));
    check("mobile 390px: ledger restored whole, zero overflow",
      mobile.overflow <= 0 && mobile.rows === kids.excluded.length,
      "overflow=" + mobile.overflow + ", rows=" + mobile.rows);
    check("zero pageerrors on parents.html", errors.length === 0,
      errors.join(" | ") || "clean");
  } finally {
    await browser.close();
  }
  console.log(failures ? ("FAILURES: " + failures) : "ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
