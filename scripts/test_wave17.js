/* Wave 17 headless functional checks: new collections render, new guide
   pages render with the guide template, games directory shows 213.
   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_wave17.js
   Exit 0 = all pass, zero pageerrors.
   R26 harness refresh: the collections waits/assertions targeted
   article[id^='shelf-'] / .shelf-card, the pre-redesign shelf markup.
   Since the R22 credits-roll redesign a shelf is a
   <section id="shelf-…" class="collection-credits">, so the old
   selector could never match and the first wait always timed out
   (diagnosed firsthand at base d4ac595: 24 sections, 0 articles).
   The selectors now name the current DOM contract; the counts and
   every assertion are unchanged. */
"use strict";
const puppeteer = require("puppeteer-core");

const BASE = "file:///home/hatch/workspace/button-mash";
const ROOT17 = "/home/hatch/workspace/button-mash";
let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, ", ", detail); }
  else { failures++; console.error("FAIL", name, ", ", detail); }
}

async function newPage(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // Over file:// the Curator live probe (/api/*) deterministically 404s,
    // the designed fallback contract (static renders, badge reads "cached"),
    // so its console noise is expected, not an app error. Same filter as
    // test_wave19 / test_curatornight21; this suite predates the probes
    // (wave-22 fix for the three false "zero pageerrors" failures).
    if (m.text().indexOf("Failed to load resource: net::ERR_FILE_NOT_FOUND") === 0) return;
    errors.push("[console.error] " + m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  await page.setViewport({ width: 1280, height: 900 });
  return { page, errors };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  try {
    // --- collections.html: 24 shelves, jump nav, deep link ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/collections.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelectorAll("section[id^='shelf-']").length >= 22,
        { timeout: 30000 });
      const shelves = await page.evaluate(
        () => document.querySelectorAll("section[id^='shelf-']").length);
      check("collections: 24 shelf cards render", shelves === 24, shelves + " shelves");
      const jumpLinks = await page.evaluate(
        () => document.querySelectorAll("#shelf-jump a").length);
      check("collections: 24 jump links", jumpLinks === 24, jumpLinks + " links");
      for (const id of ["flash-back-machine", "score-attack", "tycoon-corner"]) {
        const has = await page.evaluate(
          (i) => !!document.getElementById("shelf-" + i), id);
        check("collections: shelf-" + id + " present", has, id);
      }
      const flashGames = await page.evaluate(() => {
        const el = document.getElementById("shelf-flash-back-machine");
        return el ? el.textContent : "";
      });
      check("collections: flash-back-machine lists Fancy Pants",
        flashGames.includes("Fancy Pants"), "shelf content");
      check("collections: zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300));
      await page.close();
    }
    // --- deep link scrolls to the new shelf ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/collections.html#shelf-score-attack",
        { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.getElementById("shelf-score-attack"), { timeout: 30000 });
      // Poll for the scrolled state (load-time smooth scroll can be deferred
      // ~2s by Chrome, wave-16 flake note; the scroll itself is instant/auto).
      let visible = false;
      try {
        await page.waitForFunction(() => {
          const r = document.getElementById("shelf-score-attack").getBoundingClientRect();
          return r.top >= 0 && r.top < window.innerHeight;
        }, { timeout: 15000 });
        visible = true;
      } catch (e) { visible = false; }
      check("collections: #shelf-score-attack deep link scrolls", visible, "in viewport");
      check("collections deep-link: zero pageerrors", errors.length === 0,
        errors.join(" | ").slice(0, 300));
      await page.close();
    }
    // --- new guide pages ---
    for (const slug of ["gamepad-setup", "pico8-spotlight"]) {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/guides/" + slug + ".html",
        { waitUntil: "networkidle0", timeout: 60000 });
      const h1 = await page.evaluate(() =>
        document.querySelector(".guide-page h1")?.textContent || "");
      check("guide " + slug + ": h1 renders", h1.length > 5, h1);
      const secs = await page.evaluate(() =>
        document.querySelectorAll(".guide-section").length);
      check("guide " + slug + ": 8 sections", secs === 8, secs + " sections");
      const tocLinks = await page.evaluate(() =>
        document.querySelectorAll(".toc a").length);
      check("guide " + slug + ": sticky TOC has 8 links", tocLinks === 8, tocLinks + " links");
      const progress = await page.evaluate(() =>
        !!document.querySelector(".reading-progress"));
      check("guide " + slug + ": reading progress bar", progress, "present");
      const arcade = await page.evaluate(() =>
        !!document.querySelector(".coin-plate"));
      check("guide " + slug + ": coin-plate footer", arcade, "present");
      const spyActive = await page.evaluate(() =>
        typeof window.GuideTOC !== "undefined" || !!document.querySelector("[data-spy]"));
      check("guide " + slug + ": scroll-spy wired", spyActive, "data-spy present");
      check("guide " + slug + ": zero pageerrors", errors.length === 0,
        errors.join(" | ").slice(0, 300));
      await page.close();
    }
    // --- games.html: 213 cards ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/games.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => (document.querySelectorAll(".game-card").length) >= 213, { timeout: 60000 });
      const n = await page.evaluate(() => document.querySelectorAll(".game-card").length);
      check("games.html: 213 cards render", n === 213, n + " cards");
      const hasSimCity = await page.evaluate(() =>
        [...document.querySelectorAll(".game-card h3")].some((h) => h.textContent.includes("SimCity")));
      check("games.html: new wave-17 game present", hasSimCity, "SimCity (1989)");
      check("games.html: zero pageerrors", errors.length === 0,
        errors.join(" | ").slice(0, 300));
      await page.close();
    }
    // --- emulation.html: deep-dive hub cards (8 at wave 17; wave 25 added
    // the cheat-code guide = 9; the reverse-engineering guide made 10) ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/emulation.html", { waitUntil: "networkidle0", timeout: 60000 });
      const dive = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("#deep-dives .feature-card"));
        return {
          cards: cards.length,
          hrefs: cards.map((c) => {
            const a = c.querySelector("a");
            return a ? a.getAttribute("href") : null;
          }),
        };
      });
      /* R26 refresh: the card count is derived from the section itself,
         cross-checked against the guide catalog — the pinned count (9)
         went stale when the hub grew to 10. Every card must link a
         real guide record's page, with no duplicates and no dead cards. */
      const guideSlugs17 = new Set(
        JSON.parse(require("fs").readFileSync(
          require("path").join(ROOT17, "data/v1/guides.json"), "utf8")).guides.map((g) => g.slug));
      check("emulation.html: deep-dive hub cards each link a real guide (count derived)",
        dive.cards > 0 && dive.hrefs.length === dive.cards &&
        new Set(dive.hrefs).size === dive.cards &&
        dive.hrefs.every((h) => h && h.indexOf("guides/") === 0 && h.endsWith(".html") &&
          guideSlugs17.has(h.slice("guides/".length, -".html".length))),
        dive.cards + " cards, each a real guide page");
      check("emulation.html: zero pageerrors", errors.length === 0,
        errors.join(" | ").slice(0, 300));
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(failures ? failures + " FAILURES" : "ALL WAVE-17 HEADLESS CHECKS PASS");
  process.exit(failures ? 1 : 0);
})();
