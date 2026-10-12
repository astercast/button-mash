/* Wave 17 headless functional checks: new collections render, new guide
   pages render with the guide template, games directory shows 213.
   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_wave17.js
   Exit 0 = all pass, zero pageerrors. */
"use strict";
const puppeteer = require("puppeteer-core");

const BASE = "file:///home/hatch/workspace/button-mash";
let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, "—", detail); }
  else { failures++; console.error("FAIL", name, "—", detail); }
}

async function newPage(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("[console.error] " + m.text().slice(0, 200));
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
    // --- collections.html: 22 shelves, jump nav, deep link ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/collections.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelectorAll(".shelf-card, article[id^='shelf-']").length >= 22,
        { timeout: 30000 });
      const shelves = await page.evaluate(
        () => document.querySelectorAll("article[id^='shelf-']").length);
      check("collections: 22 shelf cards render", shelves === 22, shelves + " shelves");
      const jumpLinks = await page.evaluate(
        () => document.querySelectorAll("#shelf-jump a").length);
      check("collections: 22 jump links", jumpLinks === 22, jumpLinks + " links");
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
      // ~2s by Chrome — wave-16 flake note; the scroll itself is instant/auto).
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
    // --- emulation.html: 8 deep-dive hub cards ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/emulation.html", { waitUntil: "networkidle0", timeout: 60000 });
      const cards = await page.evaluate(() =>
        document.querySelectorAll("#deep-dives .feature-card").length);
      check("emulation.html: 8 deep-dive hub cards", cards === 8, cards + " cards");
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
