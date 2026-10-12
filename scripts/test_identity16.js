/* Wave 16 headless functional tests: tooltips, URL-synced filters, tag
   chips, search-across-tags, collection anchors, entrance choreography.
   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_identity16.js
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
    if (m.type() !== "error") return;
    const t = m.text();
    // Wave B: games.html probes /api/games (live-first, 7s timeout). Over
    // file:// there is no function, so the probe's network failure is the
    // designed fallback contract (static render + honest cached badge) —
    // expected noise, not an app error. (Same filter as test_wave19.js.)
    if (t.indexOf("Failed to load resource: net::ERR_FILE_NOT_FOUND") === 0) return;
    errors.push("[console.error] " + t.slice(0, 200));
  });
  page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  page.on("requestfailed", (r) => {
    if (r.url().includes("/api/")) return;
    errors.push("[requestfailed] " + r.url().slice(0, 120));
  });
  await page.setViewport({ width: 1280, height: 900 });
  return { page, errors };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* The site uses scroll-behavior: smooth, so a raw page.click can land on
   stale coordinates while the smooth scroll is still animating. Settle the
   scroll first for deterministic clicks. */
async function clickSettled(page, selector) {
  await page.evaluate((sel) => {
    document.querySelector(sel).scrollIntoView({ block: "center" });
  }, selector);
  await sleep(600);
  await page.click(selector);
}
async function focusSearch(page) {
  await page.evaluate(() => {
    const i = document.getElementById("game-search");
    i.scrollIntoView({ block: "center" });
    i.focus();
  });
  await sleep(400);
}
/* Poll for DOM state instead of fixed sleeps: under VM load (parallel
   agents run their own headless Chromes) frames and view-transition
   callbacks can be delayed, so fixed sleeps flake. */
async function waitCards(page, n, timeout) {
  await page.waitForFunction(
    (want) => document.querySelectorAll(".game-card").length === want,
    { timeout: timeout || 15000 }, n);
}
async function waitUrlHas(page, substr, timeout) {
  await page.waitForFunction(
    (s) => location.search.indexOf(s) !== -1,
    { timeout: timeout || 15000 }, substr);
}
async function waitScrollY(page, min, timeout) {
  await page.waitForFunction(
    (m) => window.scrollY > m,
    { timeout: timeout || 15000 }, min);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  console.log("chromium:", await browser.version());

  // ---- games.html: baseline render ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/games.html", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".game-card", { timeout: 15000 });
    await sleep(600);
    const s = await page.evaluate(() => ({
      cards: document.querySelectorAll(".game-card").length,
      kidBadges: document.querySelectorAll(".kid-badge").length,
      tagTokens: document.querySelectorAll("#tag-chips .tag-token").length,
      triggers: document.querySelectorAll(".tip-trigger").length,
      tips: document.querySelectorAll(".card-tip").length,
      anchorClass: document.documentElement.classList.contains("anchor-ok") ? "anchor-ok"
        : document.documentElement.classList.contains("no-anchor") ? "no-anchor" : "none",
      popoverAttr: document.querySelector(".card-tip") &&
        document.querySelector(".card-tip").getAttribute("popover"),
      stagger: document.querySelector(".game-card").style.getPropertyValue("--i"),
      heroAnim: getComputedStyle(document.querySelector(".hero-inner > h1")).animationName,
      cardMinis: document.querySelectorAll(".game-meta .tag-mini").length,
      count: document.getElementById("results-count").textContent,
      fxToggle: !!document.getElementById("fx-toggle"),
    }));
    check("16.1 directory renders 213 cards", s.cards === 213, s.cards + " cards");
    check("16.2 kid-safe badges intact", s.kidBadges === 113, s.kidBadges + " badges");
    check("16.3 tag token row: 11 tokens", s.tagTokens === 11, s.tagTokens + " tokens");
    check("16.4 tooltip trigger + popover per card", s.triggers === 213 && s.tips === 213,
      s.triggers + " triggers, " + s.tips + " popovers");
    check("16.5 anchor/popover feature path detected", s.anchorClass !== "none",
      s.anchorClass + ", popover=" + s.popoverAttr);
    check("16.6 entrance stagger index set", s.stagger !== "", "--i=" + s.stagger);
    check("16.7 hero entrance choreography runs", s.heroAnim === "hero-in", s.heroAnim);
    check("16.8 card tag minis render", s.cardMinis > 0, s.cardMinis + " minis");
    check("16.9 count line", s.count === "213 of 213 games", s.count);
    check("16.10 FX toggle present", s.fxToggle, "fx-toggle injected");
    check("16.11 zero pageerrors (baseline)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  // ---- tooltip show/hide via keyboard ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/games.html", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".tip-trigger", { timeout: 15000 });
    const t = await page.evaluate(() => {
      const trigger = document.querySelector(".tip-trigger");
      trigger.focus();
      const tipEl = trigger.parentElement.parentElement.querySelector(".card-tip");
      const open = (() => {
        try { return !!document.querySelector(".card-tip:popover-open"); }
        catch (e) { return tipEl && !tipEl.hidden; }
      })();
      const expanded = trigger.getAttribute("aria-expanded");
      const title = tipEl.querySelector(".tip-title").textContent;
      const domain = tipEl.querySelector(".tip-domain").textContent;
      trigger.blur();
      const closed = (() => {
        try { return !document.querySelector(".card-tip:popover-open"); }
        catch (e) { return tipEl.hidden; }
      })();
      return { open: !!open, expanded, title: title.slice(0, 30), domain: domain.slice(0, 60), closed: !!closed };
    });
    check("16.12 tooltip opens on focus", t.open && t.expanded === "true",
      "open=" + t.open + " aria-expanded=" + t.expanded);
    check("16.13 tooltip content", t.title.length > 0 && /play at .*opens in a new tab/.test(t.domain),
      t.title + " / " + t.domain);
    check("16.14 tooltip closes on blur", t.closed, "closed=" + t.closed);
    check("16.15 zero pageerrors (tooltip)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  // ---- URL-synced filters ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/games.html", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".game-card", { timeout: 15000 });
    await sleep(400);
    // click the Puzzle genre chip
    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll("#genre-chips .chip"));
      chips.find((c) => c.dataset.genre === "puzzle").click();
    });
    await waitCards(page, 48);
    const u1 = new URL(page.url());
    check("16.16 genre click syncs URL", u1.searchParams.get("genre") === "puzzle", page.url().split("?")[1]);
    const c1 = await page.evaluate(() => document.getElementById("results-count").textContent);
    check("16.17 puzzle filter count", c1 === "48 of 213 games", c1);
    // click the party tag token
    await page.evaluate(() => {
      document.querySelector('#tag-chips .tag-token[data-tag="party"]').click();
    });
    await waitCards(page, 3);
    const u2 = new URL(page.url());
    check("16.18 tag click syncs URL", u2.searchParams.get("tags") === "party", u2.search);
    const c2 = await page.evaluate(() => ({
      count: document.getElementById("results-count").textContent,
      pressed: document.querySelector('#tag-chips .tag-token[data-tag="party"]').getAttribute("aria-pressed"),
    }));
    check("16.19 party+puzzle narrows + token pressed", c2.pressed === "true" && /of 213 games/.test(c2.count),
      c2.count + " pressed=" + c2.pressed);
    // type in search
    await focusSearch(page);
    await page.keyboard.type("tetr", { delay: 30 });
    await waitUrlHas(page, "q=tetr");
    const u3 = new URL(page.url());
    check("16.20 search syncs URL", u3.searchParams.get("q") === "tetr", u3.search);
    check("16.21 zero pageerrors (url sync)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  // ---- restore from URL ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/games.html?genre=puzzle&q=tetr&tags=party&favs=1", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".game-card", { timeout: 15000 }).catch(() => {});
    await sleep(500);
    const s = await page.evaluate(() => ({
      genrePressed: document.querySelector('#genre-chips .chip[data-genre="puzzle"]').getAttribute("aria-pressed"),
      tagPressed: document.querySelector('#tag-chips .tag-token[data-tag="party"]').getAttribute("aria-pressed"),
      q: document.getElementById("game-search").value,
      favs: document.getElementById("fav-only").getAttribute("aria-pressed"),
      count: document.getElementById("results-count").textContent,
    }));
    check("16.22 URL state restored into controls",
      s.genrePressed === "true" && s.tagPressed === "true" && s.q === "tetr" && s.favs === "true",
      JSON.stringify(s));
    // invalid values are dropped, not applied
    await page.goto(BASE + "/games.html?genre=nonsense&tags=bogus", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".game-card", { timeout: 15000 });
    await sleep(400);
    const s2 = await page.evaluate(() => ({
      allPressed: document.querySelector('#genre-chips .chip[data-genre="all"]').getAttribute("aria-pressed"),
      url: location.search,
    }));
    check("16.23 invalid URL values rejected", s2.allPressed === "true" && s2.url === "",
      "genre=" + s2.allPressed + " url='" + s2.url + "'");
    check("16.24 zero pageerrors (restore)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  // ---- search-across-tags + matched strip + empty state ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/games.html", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".game-card", { timeout: 15000 });
    await sleep(400);
    await focusSearch(page);
    await page.keyboard.type("drawing", { delay: 30 });
    await waitCards(page, 6);
    const s = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".game-card"));
      const tagged = cards.filter((c) =>
        Array.from(c.querySelectorAll(".tag-mini")).some((m) => m.textContent === "drawing")).length;
      const hayOK = cards.every((c) => {
        const minis = Array.from(c.querySelectorAll(".tag-mini")).map((m) => m.textContent).join(" ");
        const text = (c.querySelector("h3").textContent + " " +
          c.querySelector(".game-desc").textContent + " " + minis).toLowerCase();
        return text.indexOf("drawing") !== -1;
      });
      const hits = document.getElementById("tag-hits");
      return {
        n: cards.length,
        tagged,
        hayOK,
        hitsVisible: !hits.hidden,
        stripChip: !!hits.querySelector('.tag-token[data-tag="drawing"]'),
      };
    });
    check("16.25 search matches tags", s.n === 6 && s.tagged === 4 && s.hayOK,
      s.n + " results, " + s.tagged + " drawing-tagged");
    check("16.26 matched-tag strip visible", s.hitsVisible && s.stripChip, "» tag match: drawing");
    // click the matched tag chip -> tag filter applies
    await page.evaluate(() => {
      document.querySelector('#tag-hits .tag-token[data-tag="drawing"]').click();
    });
    await waitCards(page, 4);
    const u = new URL(page.url());
    check("16.27 matched chip toggles tag filter", u.searchParams.get("tags") === "drawing", u.search);
    // empty state
    await page.evaluate(() => {
      const input = document.getElementById("game-search");
      input.value = "zzzqqq-no-such-game";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForSelector(".empty-cabinet .empty-title", { timeout: 15000 });
    const e = await page.evaluate(() => ({
      title: document.querySelector(".empty-cabinet .empty-title") ?
        document.querySelector(".empty-cabinet .empty-title").textContent : null,
      clearBtn: !!document.getElementById("clear-filters"),
    }));
    check("16.28 custom empty state", e.title === "» NO GAMES ON THIS CHANNEL" && e.clearBtn, e.title);
    await clickSettled(page, "#clear-filters");
    await waitCards(page, 213);
    const r = await page.evaluate(() => ({
      cards: document.querySelectorAll(".game-card").length,
      url: location.search,
      q: document.getElementById("game-search").value,
    }));
    check("16.29 clear filters resets all", r.cards === 213 && r.url === "" && r.q === "", r.cards + " cards");
    check("16.30 zero pageerrors (search/tags)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  // ---- collections: anchors + jump nav ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/collections.html", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".collection-card", { timeout: 15000 });
    await sleep(400);
    const s = await page.evaluate(() => ({
      cards: document.querySelectorAll(".collection-card").length,
      ids: document.querySelectorAll(".collection-card[id^='shelf-']").length,
      jumpLinks: document.querySelectorAll("#shelf-jump a").length,
      copyBtns: document.querySelectorAll(".shelf-link").length,
      fxToggle: !!document.getElementById("fx-toggle"),
    }));
    check("16.31 24 shelf cards with anchor ids", s.cards === 24 && s.ids === 24, s.ids + " anchored");
    check("16.32 jump nav has 24 links", s.jumpLinks === 24, s.jumpLinks + " links");
    check("16.33 per-shelf copy buttons", s.copyBtns === 24, s.copyBtns + " buttons");
    check("16.34 FX toggle on collections", s.fxToggle, "injected");
    await clickSettled(page, '#shelf-jump a[href="#shelf-party-night"]');
    await sleep(400);
    check("16.35 jump link sets hash", page.url().endsWith("#shelf-party-night"), page.url().split("/").pop());
    check("16.36 zero pageerrors (collections)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  // ---- collections deep link scroll ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/collections.html#shelf-party-night", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".collection-card", { timeout: 15000 });
    await waitScrollY(page, 200);
    const y = await page.evaluate(() => window.scrollY);
    check("16.37 deep link scrolls to shelf", y > 200, "scrollY=" + Math.round(y));
    check("16.38 zero pageerrors (deep link)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  // ---- consistency spot checks: kids + index tooltips ----
  {
    const { page, errors } = await newPage(browser);
    await page.goto(BASE + "/kids.html", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(800);
    const k = await page.evaluate(() => ({
      fx: !!document.getElementById("fx-toggle"),
      kick: !!document.querySelector(".coin-plate"),
      cards: document.querySelectorAll(".kid-card").length,
    }));
    check("16.39 kids.html: FX toggle + kick plate", k.fx && k.kick, JSON.stringify(k));
    await page.goto(BASE + "/index.html", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".game-card", { timeout: 15000 });
    await sleep(400);
    const ix = await page.evaluate(() => ({
      triggers: document.querySelectorAll(".tip-trigger").length,
      cards: document.querySelectorAll(".game-card").length,
    }));
    check("16.40 index sampler cards get tooltips", ix.triggers === ix.cards && ix.cards > 0,
      ix.triggers + " triggers on " + ix.cards + " cards");
    check("16.41 zero pageerrors (consistency)", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  }

  await browser.close();
  console.log(failures ? "\nRESULT: " + failures + " FAILURES" : "\nRESULT: ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
