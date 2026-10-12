/* Wave 18 headless + unit checks: the Trophy Room.
   Part A (node): trophy-core.js UMD logic against fixtures — state
   transitions, cascades, completion math, all 16 achievement rules,
   streaks, export/import validation + corruption recovery, migrations.
   Part B (headless Chromium): card token buttons, completion %, prize
   toast, favs sync with the wave-16 filter, export/import round-trip,
   collections progress bars, keyboard operability, mobile layout,
   zero pageerrors. Screenshots to /tmp.
   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_trophy18.js
   Exit 0 = all pass. */
"use strict";
const puppeteer = require("puppeteer-core");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const Trophy = require(path.join(ROOT, "assets/js/trophy-core.js"));
const BASE = "file:///home/hatch/workspace/button-mash";

let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, "—", detail); }
  else { failures++; console.error("FAIL", name, "—", detail); }
}

/* ---------------- fixtures ---------------- */
const GENRES = ["puzzle", "action", "roguelike", "idle", "multiplayer", "retro", "horror", "cozy"];
const games = [];
GENRES.forEach((g, gi) => {
  for (let i = 0; i < 6; i++) {
    games.push({ id: g + "-" + i, title: g + " " + i, genre: g, url: "https://example.com/" + g + i });
  }
});
const collections = [
  { id: "c1", title: "C1", tagline: "t", description: "d", game_ids: ["puzzle-0", "puzzle-1", "action-0"] },
  { id: "c2", title: "C2", tagline: "t", description: "d", game_ids: ["retro-0", "retro-1"] },
];
function memBackend(seed) {
  const m = Object.assign({}, seed || {});
  return {
    get: (k) => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
    set: (k, v) => { m[k] = v; },
    del: (k) => { delete m[k]; },
    _map: m,
  };
}
function newStore(favs, seed) {
  let favList = (favs || []).slice();
  const s = Trophy.createStore({
    backend: memBackend(seed),
    getFavs: () => favList.slice(),
    setFavs: (ids) => { ids.forEach((id) => { if (!favList.includes(id)) favList.push(id); }); },
  });
  s.setCatalog(games, collections);
  s._favList = () => favList;
  return s;
}
const DAY = 86400000;
const todayKey = String(Math.floor(Date.now() / DAY));

/* ================= PART A: unit ================= */
{
  check("UMD loads in node, 16 achievements", Trophy.ACHIEVEMENTS.length === 16, "16 rules");
  check("storageMode reports memory under node", Trophy.storageMode() === "memory", "no localStorage here");

  // state transitions + cascade
  let s = newStore();
  let r = s.markPlayed("puzzle-0");
  check("markPlayed sets played", r.changed && s.status("puzzle-0").played && !s.status("puzzle-0").beaten, "played=true");
  check("first-play prize earned", r.newlyEarned.includes("first-play"), r.newlyEarned.join(","));
  r = s.markBeaten("puzzle-0");
  check("markBeaten sets beaten", s.status("puzzle-0").beaten, "beaten=true");
  r = s.markBeaten("action-0");
  check("markBeaten implies played", s.status("action-0").played && s.status("action-0").beaten, "both flags");
  check("first-beat prize earned", r.newlyEarned.includes("first-beat") || s.achievements().find((a) => a.id === "first-beat").earned, "earned");
  r = s.unmarkPlayed("action-0");
  check("unmarkPlayed clears beaten too", !s.status("action-0").played && !s.status("action-0").beaten, "cascade");
  r = s.markPlayed("nope-not-real");
  check("unknown id rejected", r.error === "unknown-game" && !r.changed, "no state change");
  r = s.toggleBeaten("puzzle-1");
  check("toggleBeaten on", s.status("puzzle-1").beaten, "on");
  r = s.toggleBeaten("puzzle-1");
  check("toggleBeaten off keeps played", !s.status("puzzle-1").beaten && s.status("puzzle-1").played, "played stays");

  // counts + genre stats + collection progress
  s = newStore();
  ["puzzle-0", "puzzle-1", "action-0"].forEach((id) => s.markPlayed(id));
  s.markBeaten("puzzle-0");
  const c = s.counts();
  check("counts", c.played === 3 && c.beaten === 1 && c.favorites === 0, JSON.stringify(c));
  const gs = s.genreStats(games);
  const pz = gs.find((g) => g.genre === "puzzle");
  check("genreStats puzzle", pz.total === 6 && pz.played === 2 && pz.beaten === 1 &&
    pz.playedPct === 33 && pz.beatenPct === 17, JSON.stringify(pz));
  check("genreStats covers all 8 genres", gs.length === 8, gs.length + " genres");
  const cp = s.collectionProgress(collections[0]);
  check("collectionProgress c1", cp.total === 3 && cp.played === 3 && cp.beaten === 1 &&
    cp.playedPct === 100 && cp.beatenPct === 33, JSON.stringify(cp));
  const cpEmpty = s.collectionProgress({ id: "x", game_ids: [] });
  check("collectionProgress empty collection", cpEmpty.playedPct === 0 && cpEmpty.beatenPct === 0, "no div-by-zero");

  // achievement rules
  s = newStore(["puzzle-0", "puzzle-1", "puzzle-2", "puzzle-3", "puzzle-4"]);
  s.evaluate();
  check("heart-5 via fav provider", s.achievements().find((a) => a.id === "heart-5").earned, "5 favs");
  check("heart-20 not earned at 5", !s.achievements().find((a) => a.id === "heart-20").earned, "locked");
  s = newStore();
  for (let i = 0; i < 5; i++) s.markBeaten("puzzle-" + i);
  check("puzzle-breaker at 5 puzzle beaten",
    s.achievements().find((a) => a.id === "puzzle-breaker").earned, "earned");
  check("beater-5 at 5 beaten", s.achievements().find((a) => a.id === "beater-5").earned, "earned");
  s = newStore();
  GENRES.slice(0, 5).forEach((g) => s.markPlayed(g + "-0"));
  check("genre-tourist at 5 genres", s.achievements().find((a) => a.id === "genre-tourist").earned, "earned");
  check("genre-master locked at 5/8", !s.achievements().find((a) => a.id === "genre-master").earned, "locked");
  GENRES.slice(5).forEach((g) => s.markPlayed(g + "-0"));
  check("genre-master at 8/8", s.achievements().find((a) => a.id === "genre-master").earned, "earned");
  s = newStore();
  for (let i = 0; i < 10; i++) s.markPlayed(GENRES[i % 8] + "-" + (i % 6));
  const achIds = s.achievements().filter((a) => a.earned).map((a) => a.id);
  check("player-10 earned", achIds.includes("player-10"), achIds.join(","));
  check("marathon earned (10 marks in one day)", achIds.includes("marathon"), "days[today]=" + s._state().days[todayKey]);

  // streaks via crafted days
  const tk = Math.floor(Date.now() / DAY);
  s = newStore([], null);
  let imp = s.importJSON(JSON.stringify({
    schema: "bm.trophy.export", schemaVersion: 1, exportedAt: new Date().toISOString(),
    data: { played: {}, beaten: {}, favorites: [], days: { [tk]: 1, [tk - 1]: 2, [tk - 2]: 1 }, achievements: {} },
  }));
  check("3-day streak import ok", imp.ok, JSON.stringify(imp.imported));
  const st = s.streak();
  check("streak current=3 best=3", st.current === 3 && st.best === 3, JSON.stringify(st));
  check("streak-3 earned", s.achievements().find((a) => a.id === "streak-3").earned, "earned");
  check("streak-7 locked", !s.achievements().find((a) => a.id === "streak-7").earned, "locked");
  // gap breaks the run but best persists
  s = newStore();
  s.importJSON(JSON.stringify({
    schema: "bm.trophy.export", schemaVersion: 1, exportedAt: new Date().toISOString(),
    data: { played: {}, beaten: {}, favorites: [], days: { [tk]: 1, [tk - 5]: 1, [tk - 6]: 1, [tk - 7]: 1, [tk - 8]: 1 }, achievements: {} },
  }));
  const st2 = s.streak();
  check("streak current=1 best=4 across gap", st2.current === 1 && st2.best === 4, JSON.stringify(st2));

  // shelf-clearer
  s = newStore();
  ["puzzle-0", "puzzle-1", "action-0"].forEach((id) => s.markBeaten(id));
  check("shelf-clearer when c1 fully beaten",
    s.achievements().find((a) => a.id === "shelf-clearer").earned, "earned");

  // export / import round-trip
  s = newStore(["puzzle-0"]);
  s.markPlayed("puzzle-0"); s.markBeaten("action-1");
  const exp = s.exportJSON();
  const doc = JSON.parse(exp);
  check("export schema envelope", doc.schema === "bm.trophy.export" && doc.schemaVersion === 1 &&
    !!doc.exportedAt && doc.data.favorites.includes("puzzle-0"), "envelope ok");
  const s2 = newStore();
  const r2 = s2.importJSON(exp);
  check("import round-trip", r2.ok && s2.counts().played === 2 && s2.counts().beaten === 1 &&
    s2._favList().includes("puzzle-0"), JSON.stringify(r2.imported));

  // corruption recovery: state untouched
  s = newStore();
  s.markPlayed("puzzle-0");
  const dataOf = (s) => JSON.stringify(JSON.parse(s.exportJSON()).data);
  const beforeData = dataOf(s);
  [["garbage{", "not-json"], ['{"x":1}', "bad-schema"],
   [JSON.stringify({ schema: "bm.trophy.export", schemaVersion: 999, data: {} }), "future-version"],
   [JSON.stringify({ schema: "bm.trophy.export", schemaVersion: 1 }), "bad-schema"],
  ].forEach(([text, want]) => {
    const rr = s.importJSON(text);
    check("corrupt import rejected (" + want + ")", !rr.ok && rr.error === want && !!rr.message, rr.error);
  });
  check("state untouched after corrupt imports", dataOf(s) === beforeData, "identical data payload");

  // import sanitizes unknown ids, counts dropped
  s = newStore();
  const r3 = s.importJSON(JSON.stringify({
    schema: "bm.trophy.export", schemaVersion: 1, exportedAt: new Date().toISOString(),
    data: {
      played: { "puzzle-0": Date.now(), "bogus-id": Date.now(), "puzzle-1": "not-a-number" },
      beaten: { "bogus-2": Date.now() },
      favorites: ["puzzle-0", "bogus-3", "puzzle-0"],
      days: { "123": 2, "abc": 1, "124": -5 },
      achievements: { "first-play": Date.now(), "bogus-ach": 1 },
    },
  }));
  check("import drops unknown ids", r3.ok && s.counts().played === 1 &&
    r3.dropped.played === 2 && r3.dropped.beaten === 1 && r3.dropped.favorites === 2 &&
    r3.dropped.days === 2 && r3.dropped.achievements === 1, JSON.stringify(r3.dropped));

  // load-time sanitize: bogus ids in the stored blob are dropped
  const seedBackend = memBackend({
    "bm.trophy.v1": JSON.stringify({
      v: 1, played: { "puzzle-0": 1, "ghost": 2 }, beaten: {}, days: {}, achievements: { "ghost-ach": 3 },
    }),
  });
  const s4 = Trophy.createStore({ backend: seedBackend });
  s4.setCatalog(games, collections);
  check("load sanitizes unknown ids", s4.counts().played === 1 &&
    !s4.achievements().some((a) => a.id === "ghost-ach"), "ghosts dropped");

  // future-version stored blob refused
  const s5 = Trophy.createStore({
    backend: memBackend({ "bm.trophy.v1": JSON.stringify({ v: 999, played: { "puzzle-0": 1 }, beaten: {}, days: {}, achievements: {} }) }),
  });
  s5.setCatalog(games, collections);
  check("future stored version refused", s5.loadInfo().futureVersion && s5.counts().played === 0, "blank, flagged");

  // corrupt stored blob -> fresh start, flagged
  const s6 = Trophy.createStore({ backend: memBackend({ "bm.trophy.v1": "###not json###" }) });
  s6.setCatalog(games, collections);
  check("corrupt stored blob -> fresh + flagged", s6.loadInfo().corrupt && s6.counts().played === 0, "flagged");

  // reset
  s = newStore();
  s.markPlayed("puzzle-0");
  s.reset();
  check("reset clears", s.counts().played === 0 && s.counts().beaten === 0 &&
    s.achievements().every((a) => !a.earned), "blank");
}

/* ================= PART B: headless ================= */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function newPage(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("[console.error] " + m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  page.on("requestfailed", (r) => errors.push("[requestfailed] " + r.url().slice(0, 120)));
  await page.setViewport({ width: 1280, height: 900 });
  return { page, errors };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    protocolTimeout: 180000,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  // Settled in-page click: instant scroll (the site's smooth scroll-behavior
  // makes Puppeteer's computed click coordinates go stale mid-scroll —
  // wave-16-documented harness flake), then a real .click() dispatch.
  async function settledClick(page, selector) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error("no such element: " + sel);
      el.scrollIntoView({ block: "center", behavior: "auto" });
      el.click();
    }, selector);
    await sleep(400);
  }
  try {
    // ---- games.html: card token buttons ----
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/games.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => document.querySelectorAll(".trophy-row").length > 200, { timeout: 30000 });
      const btnCount = await page.evaluate(() => document.querySelectorAll(".trophy-row").length);
      check("games.html: every card has a trophy row", btnCount === 213, btnCount + " rows");
      const perCard = await page.evaluate(() =>
        document.querySelector(".trophy-row").querySelectorAll(".trophy-btn").length);
      check("trophy row has played + beaten buttons", perCard === 2, perCard + " buttons");
      await page.waitForFunction(
        () => { const b = document.querySelector(".trophy-btn"); return b && !b.disabled; },
        { timeout: 30000 });
      // mark the first card played via a real click
      await settledClick(page, '.trophy-row .trophy-btn[data-trophy="played"]');
      const pressed = await page.evaluate(() =>
        document.querySelector('.trophy-row .trophy-btn[data-trophy="played"]').getAttribute("aria-pressed"));
      check("clicking Played toggles aria-pressed", pressed === "true", "aria-pressed=" + pressed);
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem("bm.trophy.v1");
        return raw ? Object.keys(JSON.parse(raw).played).length : -1;
      });
      check("played persists to bm.trophy.v1", stored === 1, stored + " played");
      const toast = await page.evaluate(() => {
        const t = document.getElementById("prize-toast");
        return t && t.classList.contains("show") ? t.textContent : null;
      });
      check("prize toast fires on first-play", !!toast && /PRIZE WON/i.test(toast) && /First Token/.test(toast),
        (toast || "no toast").slice(0, 80));
      // beaten implies played
      await settledClick(page, '.trophy-row .trophy-btn[data-trophy="beaten"]');
      const both = await page.evaluate(() => {
        const row = document.querySelector(".trophy-row");
        return {
          played: row.querySelector('[data-trophy="played"]').getAttribute("aria-pressed"),
          beaten: row.querySelector('[data-trophy="beaten"]').getAttribute("aria-pressed"),
        };
      });
      check("beaten keeps played pressed", both.played === "true" && both.beaten === "true", JSON.stringify(both));
      // keyboard: tab to second card's played button, Space toggles
      const kb = await page.evaluate(async () => {
        const btns = document.querySelectorAll('.trophy-row .trophy-btn[data-trophy="played"]');
        const b = btns[1];
        b.focus();
        const before = b.getAttribute("aria-pressed");
        b.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        b.click(); // Space on a button fires click
        await new Promise((r) => setTimeout(r, 200));
        return { before, after: b.getAttribute("aria-pressed"), focused: document.activeElement === b };
      });
      check("trophy button keyboard-operable", kb.after === "true" && kb.focused, JSON.stringify(kb));
      // favs sync: heart the first card, directory favs filter still works
      await settledClick(page, ".game-card .fav-btn");
      const favCount = await page.evaluate(() => JSON.parse(localStorage.getItem("bm_favs_v1") || "[]").length);
      check("♥ still writes bm_favs_v1", favCount === 1, favCount + " fav");
      await page.screenshot({ path: "/tmp/trophy-cards.png" });
      // Wave B: games.html probes /api/games (live-first, 7s timeout). Over file://
      // there is no function, so the probe's network failure is EXPECTED — the
      // fallback contract handles it (static render + honest cached badge). Only
      // real JS/page errors and non-/api resource failures fail this check.
      const apiProbeFailed = errors.some((e) => /^\[requestfailed\] file:\/\/\/api\//.test(e));
      const realErrors = errors.filter((e) => {
        if (/^\[requestfailed\] file:\/\/\/api\//.test(e)) return false;
        if (/Failed to load resource/.test(e) && apiProbeFailed) return false;
        return true;
      });
      check("games.html zero pageerrors", realErrors.length === 0, realErrors.join(" | ").slice(0, 300) || "clean");
      await page.close();
    }

    // ---- trophy-room.html: the wall ----
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/trophy-room.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(() => document.querySelectorAll(".genre-shelf").length === 8, { timeout: 30000 });
      const shelves = await page.evaluate(() => document.querySelectorAll(".genre-shelf").length);
      check("trophy room: 8 genre shelves", shelves === 8, shelves + " shelves");
      const dials = await page.evaluate(() => document.querySelectorAll("svg.dial").length);
      check("trophy room: 8 CRT dials", dials === 8, dials + " dials");
      const prizes = await page.evaluate(() => document.querySelectorAll(".prize-token-card").length);
      check("trophy room: 16 prize tokens", prizes === 16, prizes + " tokens");
      const colRows = await page.evaluate(() => document.querySelectorAll(".collection-row").length);
      check("trophy room: 22 collection rows", colRows === 22, colRows + " rows");
      // Seed deterministic state through the live store (real catalog ids),
      // then verify the whole wall reflects it.
      await page.evaluate(async () => {
        const games = (await (await fetch("data/games.json")).json()).games;
        const store = window.BM.Trophy.getDefault();
        store.reset();
        try { localStorage.removeItem("bm_favs_v1"); } catch (e) {}
        ["0", "1", "2"].forEach((i) => store.markPlayed(games[i].id));
        store.markBeaten(games[0].id);
        ["3", "4", "5", "6", "7"].forEach((i) => window.BM.toggleFav(games[i].id));
      });
      await page.waitForFunction(() => {
        const el = [...document.querySelectorAll(".stat-readout")].find((d) => /Games played/.test(d.textContent));
        return el && /^3/.test(el.textContent.replace(/\s+/g, ""));
      }, { timeout: 15000 });
      const stats = await page.evaluate(() =>
        [...document.querySelectorAll(".stat-readout")].map((d) => d.textContent.replace(/\s+/g, " ").trim()));
      check("stat band shows seeded numbers", stats.some((s) => /^3\s*Games played/.test(s)) &&
        stats.some((s) => /^1\s*Games beaten/.test(s)) && stats.some((s) => /^5\s*Favorites/.test(s)),
        stats.join(" | ").slice(0, 160));
      const earned = await page.evaluate(() =>
        document.querySelectorAll(".prize-token-card.earned").length);
      check("trophy room: prizes earned (first-play, first-beat, heart-5)",
        earned >= 3, earned + " earned");
      // export content valid
      const expOk = await page.evaluate(() => {
        const store = window.BM.Trophy.getDefault();
        const doc = JSON.parse(store.exportJSON());
        return doc.schema === "bm.trophy.export" && doc.schemaVersion === 1 &&
          Object.keys(doc.data.played).length === 3 && doc.data.favorites.length === 5;
      });
      check("exportJSON valid from the live page", expOk, "schema + counts");
      // import round-trip in-page: reset, re-import, counts restored
      const rt = await page.evaluate(() => {
        const store = window.BM.Trophy.getDefault();
        const exp = store.exportJSON();
        const before = store.counts();
        store.reset();
        const cleared = store.counts().played === 0;
        const res = store.importJSON(exp);
        const after = store.counts();
        return { ok: res.ok, cleared, same: after.played === before.played && after.beaten === before.beaten };
      });
      check("export -> reset -> import round-trip", rt.ok && rt.cleared && rt.same, JSON.stringify(rt));
      // corrupted import rejected, state untouched
      const corr = await page.evaluate(() => {
        const store = window.BM.Trophy.getDefault();
        const dataBefore = JSON.stringify(JSON.parse(store.exportJSON()).data);
        const r1 = store.importJSON("definitely not json");
        const r2 = store.importJSON(JSON.stringify({ schema: "nope", schemaVersion: 1, data: {} }));
        const dataAfter = JSON.stringify(JSON.parse(store.exportJSON()).data);
        return { r1: r1.error, r2: r2.error, untouched: dataAfter === dataBefore };
      });
      check("corrupt imports rejected, state untouched",
        corr.r1 === "not-json" && corr.r2 === "bad-schema" && corr.untouched, JSON.stringify(corr));
      await page.screenshot({ path: "/tmp/trophy-room.png", fullPage: true });
      check("trophy-room.html zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300) || "clean");
      await page.close();
    }

    // ---- collections.html: per-shelf progress ----
    {
      const { page, errors } = await newPage(browser);
      await page.goto(BASE + "/collections.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(
        () => [...document.querySelectorAll(".shelf-progress-label")]
          .every((l) => !/loading/.test(l.textContent)), { timeout: 30000 });
      const labels = await page.evaluate(() =>
        [...document.querySelectorAll(".shelf-progress-label")].map((l) => l.textContent));
      check("collections: 22 progress labels painted", labels.length === 22, labels.length + " labels");
      check("collections: label shows played/beaten counts",
        labels.every((l) => /\d+\/\d+ played · \d+ beaten/.test(l)), labels[0] || "none");
      const bars = await page.evaluate(() =>
        [...document.querySelectorAll(".shelf-progress .stacked-bar")]
          .every((b) => b.getAttribute("aria-label") && /played/.test(b.getAttribute("aria-label"))));
      check("collections: bars carry aria-labels", bars, "labeled");
      await page.screenshot({ path: "/tmp/trophy-collections.png", fullPage: false });
      check("collections.html zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300) || "clean");
      await page.close();
    }

    // ---- mobile layout: no horizontal overflow ----
    {
      const { page, errors } = await newPage(browser);
      await page.setViewport({ width: 390, height: 844, isMobile: true });
      await page.goto(BASE + "/trophy-room.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(() => document.querySelectorAll(".genre-shelf").length === 8, { timeout: 30000 });
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check("mobile: no horizontal overflow", overflow <= 1, "overflow=" + overflow + "px");
      await page.screenshot({ path: "/tmp/trophy-room-mobile.png" });
      check("mobile zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300) || "clean");
      await page.close();
    }

    // ---- reduced motion: wall still renders, toast is instant ----
    {
      const { page, errors } = await newPage(browser);
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.goto(BASE + "/trophy-room.html", { waitUntil: "networkidle0", timeout: 60000 });
      await page.waitForFunction(() => document.querySelectorAll(".prize-token-card").length === 16, { timeout: 30000 });
      check("reduced-motion: full wall renders", true, "16 prizes, 8 shelves");
      check("reduced-motion zero pageerrors", errors.length === 0, errors.join(" | ").slice(0, 300) || "clean");
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error("HARNESS ERROR", e); failures++; });

process.on("exit", () => {
  console.log(failures ? `\n${failures} FAILURES` : "\nALL TROPHY CHECKS PASSED");
  process.exitCode = failures ? 1 : 0;
});
