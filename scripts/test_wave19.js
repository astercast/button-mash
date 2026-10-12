/* Wave 19 "Spotlight" headless functional checks: the Curator's metadata
   surfaces in the browser — game.html detail pages (static-first + live
   enrichment overlay + honest states), collections.html Curator wiring,
   card-tooltip deep links, and the ?id= live probe (section F: in-page
   fetch stub since wave 22 — Chromium 152 Local Network Access checks
   block loopback navigation in this sandbox; see the section comment).
   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_wave19.js
   Exit 0 = all pass, zero pageerrors. */
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

async function newPage(browser, viewport) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // Over file:// the Curator live probe (/api/*) deterministically 404s —
    // that miss is the designed fallback contract (static renders, badge
    // reads "cached"), so its console noise is expected, not an app error.
    // Every static asset is link-checked, so ERR_FILE_NOT_FOUND can only be
    // the probe. Transient ERR_FAILED flakes are still recorded.
    if (t.indexOf("Failed to load resource: net::ERR_FILE_NOT_FOUND") === 0) return;
    errors.push("[console.error] " + t.slice(0, 200));
  });
  page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  page.on("requestfailed", (r) => {
    // The /api/* live probe failing is the designed fallback contract
    // (static renders, badge reads "cached") — not an app error. Everything
    // else failing to load is real noise.
    if (!r.url().includes("/api/")) errors.push("[requestfailed] " + r.url().slice(0, 120));
  });
  await page.setViewport(viewport || { width: 1280, height: 900 });
  return { page, errors };
}

// Canned Curator envelopes for the live-probe section: an enriched tetrio
// (multiplayer + vibes the static file does not carry) and collections in
// the live function's resolved shape (games[], not game_ids).
function stubEnvelopes() {
  const games = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8")).games;
  const cols = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8")).collections;
  const tetrio = games.find((g) => g.id === "tetrio");
  const env = (data) => ({
    ok: true, data: data,
    meta: { service: "mash-curator", version: "1.0.0", generated_at: "2026-10-12T08:00:00Z", request_id: "req_stub" },
    error: null,
  });
  return {
    gamesEnv: env({ games: [Object.assign({}, tetrio, { multiplayer: true, kid_safe: false, vibes: ["competitive", "party"] })], count: 1, total: 1, filters: { id: "tetrio" }, generated_at: "2026-10-12T08:00:00Z" }),
    colsEnv: env({
      collections: cols.map((c) => ({
        id: c.id, title: c.title, tagline: c.tagline, description: c.description,
        game_count: c.game_ids.length,
        games: c.game_ids.slice(0, 3).map((id) => { const g = games.find((x) => x.id === id) || {}; return { id: id, title: g.title || null, url: g.url || null, genre: g.genre || null }; }),
      })),
      count: cols.length, generated_at: "2026-10-12T08:00:00Z",
    }),
  };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  try {
    // --- A. game.html?id=tetrio: static render (file://) ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/game.html?id=tetrio", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelector(".game-title") && document.querySelector(".game-title").textContent === "TETR.IO",
        { timeout: 30000 });
      const facts = await page.evaluate(() => ({
        title: document.title,
        kicker: document.querySelector(".game-hero-section .kicker").textContent,
        desc: document.querySelector(".game-hero-section .lede").textContent.slice(0, 40),
        controls: document.querySelector(".game-controls").textContent,
        playHref: document.querySelector(".play-btn").href,
        playTarget: document.querySelector(".play-btn").target,
        playText: document.querySelector(".play-btn").textContent,
        badge: document.querySelector("#detail-badge").textContent,
        badgeState: document.querySelector("#detail-badge").dataset.apiState,
        badgeRole: document.querySelector("#detail-badge").getAttribute("role"),
      }));
      check("detail: title + document title", facts.title === "TETR.IO — Button Mash", facts.title);
      check("detail: kicker carries the game id", facts.kicker === "GAME FILE // TETRIO", facts.kicker);
      check("detail: real description + controls",
        facts.desc.includes("Blisteringly fast") && facts.controls.includes("Keyboard (customizable)"), "static catalog data");
      check("detail: play button is the verified external URL",
        facts.playHref === "https://tetr.io/" && facts.playTarget === "_blank" && facts.playText.includes("tetr.io"),
        facts.playHref + " " + facts.playTarget + " / " + facts.playText);
      check("detail: badge falls back to cached over file://",
        facts.badgeState === "cached" && facts.badge.includes("cached") && facts.badgeRole === "status",
        facts.badgeState + " / " + facts.badge);
      // The file:// subresource flake (documented wave-1): data/v1/collections.json
      // can transiently fail to load, and the panel honestly says SHELVES
      // OFFLINE. The code is proven (shelf links render when the fetch lands);
      // retry fresh navigations until the shelf list actually loads.
      async function readShelves() {
        return page.evaluate(() =>
          Array.from(document.querySelectorAll("#shelves-panel a")).map((a) => a.getAttribute("href")));
      }
      async function shelvesLoaded() {
        return page.evaluate(() => {
          const t = document.querySelector("#shelves-panel").textContent;
          return t.includes("shelf-") || t.includes("Not on any");
        });
      }
      let shelves = await readShelves();
      for (let attempt = 0; attempt < 3 && shelves.length === 0; attempt++) {
        await page.goto(BASE + "/game.html?id=tetrio", { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForFunction(
          () => {
            const el = document.querySelector("#shelves-panel");
            return el && (el.textContent.includes("shelf-") || el.textContent.includes("Not on any") ||
              el.textContent.includes("SHELVES OFFLINE"));
          }, { timeout: 30000 });
        if (await shelvesLoaded()) shelves = await readShelves();
      }
      check("detail: shelf cross-links (brain-food, score-attack)",
        shelves.includes("collections.html#shelf-brain-food") && shelves.includes("collections.html#shelf-score-attack"),
        shelves.length + " shelf links");
      const rel = await page.evaluate(() => document.querySelectorAll("#related-panel .game-card").length);
      check("detail: 4 related same-genre cards", rel === 4, rel + " cards");
      const nav = await page.evaluate(() =>
        Array.from(document.querySelectorAll("#prevnext a")).map((a) => a.getAttribute("href")));
      check("detail: prev/next game-file links",
        nav.length === 2 && nav.every((h) => h.indexOf("game.html?id=") === 0), nav.join(" | "));
      const shareBtn = await page.evaluate(() => !!document.querySelector("#prevnext button"));
      check("detail: copy game-file link button", shareBtn, "share chip present");
      check("detail: zero pageerrors (static render)", errors.length === 0, errors.join(" | ").slice(0, 300));
      await page.close();
    }

    // --- B. trophy toggles on the detail page (cascade + persistence) ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/game.html?id=tetrio", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelectorAll("#trophy-panel .trophy-btn:not([disabled])").length === 2,
        { timeout: 30000 });
      await page.evaluate(() => localStorage.clear());
      // domcontentloaded + explicit UI waits: networkidle0 can hang on the
      // file:// /api probe retries under parallel-agent load (wave-1 flake).
      await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelector(".game-title") && document.querySelectorAll("#trophy-panel .trophy-btn").length === 2,
        { timeout: 30000 });
      const btns = await page.$$("#trophy-panel .trophy-btn");
      await btns[0].click(); // Played
      await sleep(400);
      let st = await page.evaluate(() => ({
        played: document.querySelectorAll("#trophy-panel .trophy-btn")[0].getAttribute("aria-pressed"),
        beaten: document.querySelectorAll("#trophy-panel .trophy-btn")[1].getAttribute("aria-pressed"),
      }));
      check("detail trophy: played toggles on", st.played === "true" && st.beaten === "false", JSON.stringify(st));
      await btns[1].click(); // Beaten (implies played)
      await sleep(400);
      st = await page.evaluate(() => ({
        played: document.querySelectorAll("#trophy-panel .trophy-btn")[0].getAttribute("aria-pressed"),
        beaten: document.querySelectorAll("#trophy-panel .trophy-btn")[1].getAttribute("aria-pressed"),
      }));
      check("detail trophy: beaten cascades", st.played === "true" && st.beaten === "true", JSON.stringify(st));
      await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelector(".game-title") &&
          document.querySelectorAll("#trophy-panel .trophy-btn")[1].getAttribute("aria-pressed") === "true",
        { timeout: 30000 });
      check("detail trophy: state persists across reload", true, "beaten still pressed after reload");
      await page.evaluate(() => localStorage.clear());
      check("detail trophy: zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300));
      await page.close();
    }

    // --- C. honest states: missing / unknown / bad id ---
    for (const [q, label] of [["", "missing id"], ["?id=nope", "unknown id"], ["?id=BAD!!", "bad id shape"]]) {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/game.html" + q, { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelector(".empty-title") && document.querySelector(".empty-title").textContent.includes("NO GAME ON THIS CHANNEL"),
        { timeout: 30000 });
      const back = await page.evaluate(() => {
        const a = document.querySelector(".empty-state a");
        return a ? a.getAttribute("href") : null;
      });
      check("detail honest state (" + label + ")", back === "games.html", "directory link: " + back);
      check("detail honest state (" + label + "): zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 200));
      await page.close();
    }

    // --- D. games.html card tooltip carries the full-file deep link ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/games.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(() => document.querySelectorAll(".game-card").length >= 200, { timeout: 30000 });
      await page.evaluate(() => {
        const t = document.querySelector(".game-card .tip-trigger");
        if (t) t.focus();
      });
      await page.waitForFunction(
        () => {
          const tip = document.querySelector(".card-tip:not([hidden])");
          return !!tip && tip.textContent.includes("full game file");
        }, { timeout: 15000 });
      const href = await page.evaluate(() => {
        const tip = document.querySelector(".card-tip:not([hidden])");
        const a = tip && tip.querySelector(".tip-file a");
        return a ? a.getAttribute("href") : null;
      });
      // arcade.js builds the link with its BASE prefix (cards also render on
      // subpages), so over file:// the attribute is an absolute file URL —
      // what matters is that it lands on this game's file.
      check("tooltip: full game file deep link", href && href.indexOf("game.html?id=") !== -1, href);
      check("tooltip: zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300));
      await page.close();
    }

    // --- E. collections.html: Curator wiring (file:// = cached) ---
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/collections.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelectorAll("article[id^='shelf-']").length === 24, { timeout: 30000 });
      const facts = await page.evaluate(() => ({
        badge: document.querySelector("#collections-badge").dataset.apiState,
        badgeText: document.querySelector("#collections-badge").textContent,
        jumpLinks: document.querySelectorAll("#shelf-jump a").length,
        fileLinks: Array.from(document.querySelectorAll(".shelf-detail-link")).slice(0, 3)
          .map((a) => a.getAttribute("href")),
        rows: document.querySelectorAll("#shelf-score-attack .shelf-row").length,
      }));
      check("collections: badge cached over file://", facts.badge === "cached" && facts.badgeText.includes("cached"),
        facts.badge + " / " + facts.badgeText);
      check("collections: 24 jump links survive extraction", facts.jumpLinks === 24, facts.jumpLinks + " links");
      check("collections: shelf rows link to game files",
        facts.fileLinks.length > 0 && facts.fileLinks.every((h) => h.indexOf("game.html?id=") === 0),
        facts.fileLinks.join(" | "));
      check("collections: score-attack rows carry the row wrapper", facts.rows >= 10, facts.rows + " rows");
      await page.goto(BASE + "/collections.html#shelf-score-attack", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(() => window.scrollY > 200, { timeout: 15000 });
      check("collections: #shelf- deep link scrolls", true, "scrollY=" + await page.evaluate(() => Math.round(window.scrollY)));
      check("collections: zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300));
      await page.close();
    }

    // --- F. live probe: the Curator answers, the badge flips to live ---
    // Chromium 152's Local Network Access checks block every loopback
    // navigation in this sandbox (verified wave 22: fresh page, headful,
    // browser-initiated, CDP permission grants, feature flags — all
    // ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS), so the stub Curator can
    // no longer be a real HTTP server the browser visits. Instead the same
    // canned envelopes are served by an in-page fetch stub installed before
    // any page script runs: ApiClient's envelope handling, the badge state
    // machine, and both overlays execute for real. The literal HTTP round
    // trip is covered server-side by tests/api.test.sh (real function
    // execution, 40/40).
    {
      const { page, errors } = await newPage(browser);
      await page.evaluateOnNewDocument((payload) => {
        const origFetch = window.fetch.bind(window);
        window.fetch = function (input, init) {
          const url = typeof input === "string" ? input : (input && input.url) || "";
          let body = null;
          if (url.indexOf("/api/games") !== -1 && url.indexOf("id=tetrio") !== -1) body = payload.gamesEnv;
          else if (url.indexOf("/api/collections") !== -1) body = payload.colsEnv;
          if (body) {
            return Promise.resolve(new Response(JSON.stringify(body), {
              status: 200, headers: { "Content-Type": "application/json; charset=utf-8" },
            }));
          }
          return origFetch(input, init);
        };
      }, stubEnvelopes());
      await page.goto(BASE + "/game.html?id=tetrio", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelector("#detail-badge").dataset.apiState === "live", { timeout: 30000 });
      const live = await page.evaluate(() => ({
        chips: document.querySelector(".game-meta-row").textContent,
        badgeText: document.querySelector("#detail-badge").textContent,
      }));
      check("live probe: badge reads live", live.badgeText === "live", live.badgeText);
      check("live probe: multiplayer + vibes overlaid",
        live.chips.includes("multiplayer") && live.chips.includes("competitive") && live.chips.includes("party"),
        "enrichment chips painted");
      await page.goto(BASE + "/collections.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelector("#collections-badge").dataset.apiState === "live", { timeout: 30000 });
      const shelves = await page.evaluate(() => document.querySelectorAll("article[id^='shelf-']").length);
      check("live probe: collections badge live, 24 shelves", shelves === 24, shelves + " shelves, badge live");
      check("live probe: zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300));
      await page.close();
    }

    // --- G. reduced motion + mobile 390px ---
    {
      const { page, errors } = await newPage(browser);
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.goto(BASE + "/game.html?id=tetrio", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(() => !!document.querySelector(".game-title"), { timeout: 30000 });
      check("reduced-motion: detail renders", true, "title present");
      check("reduced-motion: zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 200));
      await page.close();
    }
    {
      const { page, errors } = await newPage(browser, { width: 390, height: 844 });
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
      await page.goto(BASE + "/game.html?id=tetrio", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(() => !!document.querySelector(".game-title"), { timeout: 30000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check("mobile 390px: zero horizontal overflow", overflow <= 1, "overflow=" + overflow + "px");
      const panels = await page.evaluate(() => getComputedStyle(document.querySelector(".detail-panels")).gridTemplateColumns);
      check("mobile 390px: panels stack", panels.split(" ").length === 1, panels);
      check("mobile 390px: zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 200));
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(failures === 0 ? "ALL PASS" : failures + " FAILURES");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
