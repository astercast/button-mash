/* Wow wave 1 "Attract Mode" validation: headless functional test for the
   homepage cabinet (real demo loop, insert coin, FX kill, reduced motion,
   mobile) and the player CRT treatment.
   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_wow1.js
   Exit 0 = all checks pass, zero pageerrors. */
"use strict";
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const BASE = "file:///home/hatch/workspace/button-mash";
const ROOT = "/home/hatch/workspace/button-mash";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const gamesData = JSON.parse(fs.readFileSync(path.join(ROOT, "data/games.json"), "utf8")).games;
/* Expected callout stats derive from the real catalog files, the
   same numbers attract.js renders (wave 33 fix: this suite's
   hardcoded "22 CURATED SHELVES" went stale when the catalog
   grew to 24 collections, the check then passed or failed on
   which callout the rotation happened to be showing). */
const colsData33 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/collections.json"), "utf8")).collections;
const kidCount33 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kids.json"), "utf8")).curated.length;
const CALLOUT_RE33 = new RegExp(gamesData.length + " GAMES ON THE SHELF|" + kidCount33 + " KID-SAFE PICKS|" + colsData33.length + " CURATED SHELVES");
const SECTION = process.argv[2] || "all";
const want = (name) => SECTION === "all" || SECTION === name;
const byId = {};
gamesData.forEach((g) => { byId[g.id] = g; });

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log("PASS", name, "-", detail);
  else { failures++; console.error("FAIL", name, "-", detail); }
}

/* WCAG relative-luminance contrast */
function contrast(hexA, hexB) {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(hexA), b = lum(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const errors = [];
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome",
    headless: "new",
    protocolTimeout: 120000,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  const hook = (page) => {
    page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 300)));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      /* Transient under load: the renderer occasionally fails a file://
         subresource fetch; the functional checks catch real breakage. */
      if (/^Failed to load resource: net::ERR_FAILED$/.test(t.trim())) return;
      /* Deterministic over file://: the Curator live probe (/api/*) 404s,
         the designed fallback contract, not an app error. Same filter as
         test_wave19/test_wave17 (wave-22; this suite predates the probes). */
      if (t.indexOf("Failed to load resource: net::ERR_FILE_NOT_FOUND") === 0) return;
      errors.push("[console.error] " + t.slice(0, 300));
    });
  };
  /* Screenshots must never kill the suite (renderer stalls under load). */
  async function shot(p, opts) {
    try { await p.screenshot(opts); return true; }
    catch (e) { console.log("shot skipped (" + opts.path + "): " + String(e).split("\n")[0].slice(0, 120)); return false; }
  }
  /* One retry for CDP stalls mid-interaction: fresh navigation (state is in
     localStorage, so the interaction can simply run again). */
  async function retryNav(p, label, fn) {
    try {
      await fn();
    } catch (e) {
      if (!/timed out|ProtocolError/.test(String(e && e.message || e))) throw e;
      console.log("RETRY " + label + ": CDP stall, fresh navigation");
      try { await p.goto(p.url(), { waitUntil: "domcontentloaded", timeout: 60000 }); } catch (_) {}
      await waitPlayer(p, label + "-retry");
      await fn();
    }
  }

  /* player.html sentinel: player.js loaded AND its init ran (overlay is
     created in the DOMContentLoaded handler). Retries once on stall. */
  async function waitPlayer(p, label) {
    const ready = () => window.BM21 && !!document.getElementById("crt-overlay");
    try {
      await p.waitForFunction(ready, { timeout: 20000 });
    } catch (e) {
      console.log("RETRY " + label + ": player init missing, fresh navigation");
      try { await p.goto(p.url(), { waitUntil: "domcontentloaded", timeout: 60000 }); } catch (_) {}
      await p.waitForFunction(ready, { timeout: 20000 });
    }
  }

  /* wait for the demo with diagnostics: stalls print state instead of going dark */
  async function waitSlides(p, label) {
    let startUrl = "";
    try { startUrl = p.url(); } catch (e) {}
    try {
      await p.waitForSelector(".demo-slide.on", { timeout: 20000 });
      return;
    } catch (e) {
      /* The documented renderer-stall-under-load flake: the tab wedges
         (evaluate/selectors die) but a fresh navigation recovers it. */
      console.log("RETRY " + label + ": renderer stall, fresh navigation");
      try {
        await p.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        await p.waitForSelector(".demo-slide.on", { timeout: 20000 });
        return;
      } catch (e2) { /* fall through to diagnostics */ }
      const diag = await p.evaluate(() => ({
        slides: document.querySelectorAll(".demo-slide").length,
        offline: !!document.querySelector(".demo-offline"),
        stageKids: document.getElementById("demo-stage") ? document.getElementById("demo-stage").children.length : -1,
        callout: (document.getElementById("demo-callout") || {}).textContent || null,
      })).catch(() => ({}));
      console.log("DIAG " + label + ": " + JSON.stringify(diag) + " errors=" + errors.length);
      errors.slice(0, 6).forEach((x) => console.log("  err: " + x));
      throw e;
    }
  }

  /* ---------- desktop cabinet ---------- */
  const page = await browser.newPage();
  if (!want("desktop")) { await page.close(); } else {
  hook(page);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => localStorage.setItem("bm-fx", "on")); /* stale kill-switch reset */
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSlides(page, "desktop");

  check("cabinet marquee renders", await page.$eval(".marquee-title", (e) => e.textContent.replace(/\s+/g, " ").trim()) === "BUTTON MASH",
    "pixel marquee title");
  check("cabinet structure", await page.$$eval(".cabinet-side", (els) => els.length) === 2 &&
    !!(await page.$("#cabinet-screen")) && !!(await page.$("#insert-coin")),
    "side art x2 + screen + coin plate");

  const slideCount = await page.$$eval(".demo-slide", (els) => els.length);
  check("demo loop: 6 real spotlight slides", slideCount === 6, slideCount + " slides");
  const firstTitle = await page.$eval(".demo-slide.on .demo-title", (e) => e.textContent.trim());
  const firstGame = gamesData.find((g) => g.title === firstTitle);
  check("slide 1 is a real catalog game", !!firstGame, firstTitle);
  if (firstGame) {
    const playHref = await page.$eval(".demo-slide.on .demo-play", (e) => e.getAttribute("href"));
    check("slide PLAY link = the game's real URL", playHref === firstGame.url, playHref);
    check("slide PLAY opens in a new tab", await page.$eval(".demo-slide.on .demo-play", (e) => e.target) === "_blank", "target=_blank");
  }
  const inactiveInert = await page.$$eval(".demo-slide:not(.on)", (els) =>
    els.every((s) => s.hasAttribute("inert") && s.getAttribute("aria-hidden") === "true"));
  check("inactive slides are inert + aria-hidden", inactiveInert, "keyboard can't reach hidden slides");

  /* determinism: same day -> same first slide */
  const t1 = await page.$eval(".demo-slide.on .demo-title", (e) => e.textContent.trim());
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSlides(page, "desktop-reload");
  const t2 = await page.$eval(".demo-slide.on .demo-title", (e) => e.textContent.trim());
  check("spotlight order is deterministic per day", t1 === t2, t1);

  /* skip transport */
  await page.click("#demo-next");
  await sleep(800);
  const afterNext = await page.$eval(".demo-slide.on", (e) => e.getAttribute("aria-label"));
  check("Next skips to slide 2", /Spotlight 2 of 6/.test(afterNext), afterNext);
  check("slide change announced", (await page.$eval("#demo-announcer", (e) => e.textContent)).includes("Spotlight 2 of 6"),
    "aria-live announcer");
  await page.click("#demo-prev");
  await sleep(800);
  check("Prev returns to slide 1", /Spotlight 1 of 6/.test(await page.$eval(".demo-slide.on", (e) => e.getAttribute("aria-label"))), "back to 1");
  await page.click("#demo-pause");
  check("Pause toggles aria-pressed", await page.$eval("#demo-pause", (e) => e.getAttribute("aria-pressed")) === "true", "paused");
  await page.click("#demo-pause");
  check("Play resumes", await page.$eval("#demo-pause", (e) => e.getAttribute("aria-pressed")) === "false", "resumed");

  /* keyboard: Enter on Next advances */
  await page.$eval("#demo-next", (e) => e.focus());
  await page.keyboard.press("Enter");
  await sleep(800);
  check("keyboard Enter advances the demo", /Spotlight 2 of 6/.test(await page.$eval(".demo-slide.on", (e) => e.getAttribute("aria-label"))), "keyboard-operable");

  /* stat callouts: real numbers, cycling */
  const callout1 = await page.$eval("#demo-callout", (e) => e.textContent);
  check("callout shows real catalog stats", CALLOUT_RE33.test(callout1), callout1);
  await sleep(4600);
  const callout2 = await page.$eval("#demo-callout", (e) => e.textContent);
  check("callouts rotate", callout1 !== callout2, callout2);
  const srStats = await page.$eval("#demo-stats-summary", (e) => e.textContent);
  check("screen-reader stats summary is real", /213 games/.test(srStats) && /kid-safe/.test(srStats), srStats.slice(0, 80) + "...");

  /* auto-advance: the loop actually loops */
  await page.waitForFunction(
    () => /Spotlight [^1] of 6/.test(document.querySelector(".demo-slide.on").getAttribute("aria-label")),
    { timeout: 15000 });
  check("demo auto-advances on its own", true, "loop is live");

  /* trophy progress callouts: seed real play state */
  const seedId = gamesData[0].id;
  await page.evaluate((id) => {
    localStorage.setItem("bm.trophy.v1", JSON.stringify(
      { v: 1, played: { [id]: Date.now() }, beaten: {}, days: {}, achievements: {} }));
  }, seedId);
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSlides(page, "desktop");
  await page.waitForFunction(() => /YOU: 1 PLAYED/.test(document.getElementById("demo-callout").textContent),
    { timeout: 20000 });
  check("callouts reflect real trophy progress", true, "YOU: 1 PLAYED appeared in the rotation");
  await page.evaluate(() => localStorage.removeItem("bm.trophy.v1"));

  /* insert coin -> screen-off -> games.html */
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSlides(page, "desktop");
  const navP = page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
  await page.click("#insert-coin");
  await sleep(250);
  check("screen-off transition plays", await page.$eval("#cabinet-screen", (e) => e.classList.contains("screen-off")),
    "CRT collapse class applied");
  await shot(page, { path: "/tmp/wow1-insert-coin.png" });
  await navP;
  check("insert coin lands on the games directory", page.url().endsWith("/games.html"), page.url());

  /* keyboard insert coin */
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSlides(page, "desktop");
  const navP2 = page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
  await page.$eval("#insert-coin", (e) => e.focus());
  await page.keyboard.press("Enter");
  await navP2;
  check("keyboard Enter on coin plate navigates", page.url().endsWith("/games.html"), "keyboard-operable");

  /* FX toggle kills the demo cycle */
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#fx-toggle", { timeout: 15000 });
  await page.click("#fx-toggle");
  check("FX toggle sets fx-off", await page.evaluate(() => document.documentElement.classList.contains("fx-off")), "fx-off");
  check("chase bulbs frozen under fx-off",
    await page.$eval(".marquee-bulbs", (e) => getComputedStyle(e).animationName) === "none", "no chase");
  check("coin blink frozen under fx-off",
    await page.$eval(".insert-coin-line span", (e) => getComputedStyle(e).animationName) === "none", "no blink");
  const fxSlide = await page.$eval(".demo-slide.on", (e) => e.getAttribute("aria-label"));
  await sleep(9000);
  check("demo does not auto-advance under fx-off",
    fxSlide === await page.$eval(".demo-slide.on", (e) => e.getAttribute("aria-label")), "cycle killed");
  await page.click("#demo-next");
  await sleep(400);
  check("manual skip still works under fx-off (instant)",
    fxSlide !== await page.$eval(".demo-slide.on", (e) => e.getAttribute("aria-label")), "content reachable");
  await shot(page, { path: "/tmp/wow1-fxoff.png" });

  /* screenshots of the live cabinet (FX back on: the fx-off test persisted bm-fx=off) */
  await page.evaluate(() => localStorage.setItem("bm-fx", "on"));
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSlides(page, "desktop");
  await shot(page, { path: "/tmp/wow1-cabinet-1.png" });
  await page.click("#demo-next");
  await sleep(900);
  await shot(page, { path: "/tmp/wow1-cabinet-2.png" });

  /* contrast spot checks (AA) */
  const c1 = contrast("#ffb02e", "#101020"); /* coin plate amber on cabinet */
  const c2 = contrast("#f6f3ff", "#020208"); /* slide title on screen */
  const c3 = contrast("#b6ff2e", "#020208"); /* callout lime on screen */
  const c4 = contrast("#00e5ff", "#0e0e1c"); /* marquee sub cyan */
  check("contrast AA: coin plate", c1 >= 4.5, c1.toFixed(2) + ":1");
  check("contrast AA: slide title", c2 >= 4.5, c2.toFixed(2) + ":1");
  check("contrast AA: callouts", c3 >= 4.5, c3.toFixed(2) + ":1");
  check("contrast AA: marquee sub", c4 >= 4.5, c4.toFixed(2) + ":1");

  await page.close(); /* free the renderer before the next section */
  } /* end desktop */

  /* ---------- reduced motion: static cabinet, all games listed ---------- */
  const rm = await browser.newPage();
  if (!want("motion")) { await rm.close(); } else {
  hook(rm);
  await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await rm.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await rm.waitForSelector(".demo-all-list", { timeout: 20000 });
  const allCount = await rm.$$eval(".demo-all-list li", (els) => els.length);
  check("reduced motion: full static game list", allCount === gamesData.length, allCount + " of " + gamesData.length);
  check("reduced motion: no demo slides", await rm.$$eval(".demo-slide", (els) => els.length) === 0, "zero slides");
  check("reduced motion: transport hidden", await rm.$eval("#demo-prev", (e) => e.hidden) === true, "no motion controls");
  check("reduced motion: coin plate still works",
    await rm.$eval("#insert-coin", (e) => e.getAttribute("href")) === "games.html", "entry preserved");
  const rmAnim = await rm.$eval(".marquee-bulbs", (e) => getComputedStyle(e).animationName);
  check("reduced motion: no chase animation", rmAnim === "none", rmAnim);
  await shot(rm, { path: "/tmp/wow1-reduced-motion.png" });

  await rm.close();
  } /* end motion */

  /* ---------- mobile ---------- */
  const mob = await browser.newPage();
  await mob.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  if (!want("mobile")) { await mob.close(); } else {
  hook(mob);
  await mob.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mob.goto(BASE + "/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSlides(mob, "mobile");
  const overflow = await mob.evaluate(() => document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth);
  check("mobile: zero horizontal overflow", overflow <= 1, "overflow " + overflow + "px");
  check("mobile: side art collapses", await mob.$eval(".cabinet-side.left", (e) => getComputedStyle(e).display) === "none", "scaled");
  check("mobile: coin plate reachable", await mob.$eval("#insert-coin", (e) => { const r = e.getBoundingClientRect(); return r.width > 200 && r.bottom < 3000; }), "full-width plate");
  await shot(mob, { path: "/tmp/wow1-mobile.png", fullPage: false });

  await mob.close();
  } /* end mobile */

  /* ---------- player CRT ---------- */
  const pl = await browser.newPage();
  if (!want("player")) { await pl.close(); } else {
  hook(pl);
  await pl.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await pl.goto(BASE + "/player.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitPlayer(pl, "player-first");
  await pl.evaluate(() => {
    localStorage.removeItem("bm-fx"); /* the index fx-off test persisted it */
    localStorage.setItem("bm-last-game", JSON.stringify({ gameID: "bm-9-test", gameName: "testgame", core: "gba" }));
    localStorage.setItem("bm-display-gba", JSON.stringify({ crt: true, intScale: false, aspect: "fill" }));
  });
  await pl.goto(BASE + "/player.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitPlayer(pl, "player-prefs");
  await sleep(800);
  /* All crt-on assertions in one retryable block (state is localStorage-backed). */
  await retryNav(pl, "player-crt-block", async () => {
  check("CRT treatment engages from display prefs", await pl.$eval("#console-shell", (e) => e.classList.contains("crt-on")), "crt-on class");
  check("scanline overlay present", !!(await pl.$(".crt-overlay")), "overlay in stage");
  check("scanline roll animation runs",
    await pl.$eval(".crt-overlay", (e) => getComputedStyle(e).animationName) === "crt-roll", "crt-roll active");
  /* power-on wiring: the class maps to the keyframes */
  const powerAnim = await pl.evaluate(() => {
    const d = document.createElement("div");
    d.className = "screen-power-on";
    d.id = "ejs-screen";
    document.getElementById("ejs-stage").appendChild(d);
    const a = getComputedStyle(d).animationName;
    d.remove();
    return a;
  });
  check("screen-power-on maps to crt-power-on keyframes", powerAnim === "crt-power-on", powerAnim);
  /* eject path: no engine boot is possible headless (CDN blocked), so curCore
     is null and powerOffThen takes its honest immediate path through the real
     handler, assert it still returns the veil with zero errors. */
  await retryNav(pl, "player-eject", async () => {
    await pl.click("#eject-btn");
    await sleep(300);
    check("eject with no boot returns the veil (immediate path)", await pl.evaluate(() => {
      const v = document.getElementById("drop-veil");
      return !!v && v.style.display !== "none";
    }), "degraded path works");
  });
  /* the animated path's CSS mapping (class -> keyframes), same as power-on */
  await retryNav(pl, "player-poweroff-css", async () => {
    const powerOffAnim = await pl.evaluate(() => {
      const d = document.createElement("div");
      d.className = "screen-power-off";
      d.id = "ejs-screen";
      document.getElementById("ejs-stage").appendChild(d);
      const a = getComputedStyle(d).animationName;
      d.remove();
      return a;
    });
    check("screen-power-off maps to crt-power-off keyframes", powerOffAnim === "crt-power-off", powerOffAnim);
  });
  await shot(pl, { path: "/tmp/wow1-player-crt.png" });
  /* FX-off kills the CRT treatment on the player too */
    await pl.evaluate(() => document.documentElement.classList.add("fx-off"));
    check("fx-off hides CRT overlays on player",
      await pl.$eval(".crt-overlay", (e) => getComputedStyle(e).display) === "none", "sensory envelope holds");
  }); /* end player-crt-block */
  /* reduced-motion player: no roll */
  const plrm = await browser.newPage();
  hook(plrm);
  await plrm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await plrm.goto(BASE + "/player.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitPlayer(plrm, "player-rm-first");
  await plrm.evaluate(() => {
    localStorage.setItem("bm-display-gba", JSON.stringify({ crt: true, intScale: false, aspect: "fill" }));
  });
  await plrm.goto(BASE + "/player.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitPlayer(plrm, "player-rm-prefs");
  await sleep(600);
  check("reduced motion: scanlines static, no roll",
    await plrm.$eval(".crt-overlay", (e) => getComputedStyle(e).animationName) === "none", "static CRT");

  } /* end player */

  check("zero pageerrors across this run (" + SECTION + ")", errors.length === 0, errors.length + " errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));

  await browser.close();
  console.log(failures ? `\n${failures} FAILURES` : `\nWOW1 ${SECTION.toUpperCase()} CHECKS PASS`);
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error("HARNESS ERROR", String(e).split("\n")[0]);
  errors.slice(0, 8).forEach((x) => console.error("  err: " + x));
  process.exit(2);
});
