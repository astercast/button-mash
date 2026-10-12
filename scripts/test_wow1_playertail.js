/* Wow wave 1 — player tail checks, minimal CDP footprint for loaded machines.
   Covers what test_wow1.js player validated before the wedge lottery:
   eject immediate path, power-off keyframe mapping, fx-off kill,
   reduced-motion static CRT. Run: NODE_PATH=~/workspace/smoke/node_modules
   node scripts/test_wow1_playertail.js — exit 0 = pass, zero pageerrors. */
"use strict";
const puppeteer = require("puppeteer-core");
const BASE = "file:///home/hatch/workspace/button-mash";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const errors = [];
function check(name, cond, detail) {
  if (cond) console.log("PASS", name, "-", detail);
  else { failures++; console.error("FAIL", name, "-", detail); }
}
async function navReady(p, url, label) {
  for (let i = 0; i < 3; i++) {
    try {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await p.waitForFunction(() => window.BM21 && !!document.getElementById("crt-overlay"), { timeout: 15000 });
      return;
    } catch (e) { console.log("RETRY " + label + " (" + (i + 1) + ")"); }
  }
  throw new Error("navigation failed 3x: " + label);
}
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome",
    headless: "new",
    protocolTimeout: 120000,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/^Failed to load resource: net::ERR_FAILED$/.test(m.text().trim())) return;
    errors.push("[console.error] " + m.text().slice(0, 200));
  });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await navReady(page, BASE + "/player.html", "tail-first");
  await page.evaluate(() => {
    localStorage.removeItem("bm-fx");
    localStorage.setItem("bm-last-game", JSON.stringify({ gameID: "bm-9-test", gameName: "testgame", core: "gba" }));
    localStorage.setItem("bm-display-gba", JSON.stringify({ crt: true, intScale: false, aspect: "fill" }));
  });
  await navReady(page, BASE + "/player.html", "tail-prefs");

  check("crt-on engaged", await page.$eval("#console-shell",
    (e) => e.classList.contains("crt-on")), "pref applied on load");

  /* eject immediate path through the real handler */
  await page.click("#eject-btn");
  await sleep(400);
  check("eject returns the veil", await page.evaluate(() => {
    const v = document.getElementById("drop-veil");
    return !!v && v.style.display !== "none";
  }), "immediate path, no crash");

  /* power-off keyframe mapping */
  check("screen-power-off -> crt-power-off", await page.evaluate(() => {
    const d = document.createElement("div");
    d.className = "screen-power-off"; d.id = "ejs-screen";
    document.getElementById("ejs-stage").appendChild(d);
    const a = getComputedStyle(d).animationName; d.remove(); return a;
  }) === "crt-power-off", "keyframes wired");

  try { await page.screenshot({ path: "/tmp/wow1-player-crt.png" }); }
  catch (e) { console.log("shot skipped: " + String(e).split("\n")[0].slice(0, 100)); }

  /* fx-off kill */
  await page.evaluate(() => document.documentElement.classList.add("fx-off"));
  check("fx-off hides CRT overlays", await page.$eval(".crt-overlay",
    (e) => getComputedStyle(e).display) === "none", "sensory envelope holds");

  /* reduced-motion: static scanlines */
  const rm = await browser.newPage();
  rm.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await navReady(rm, BASE + "/player.html", "tail-rm");
  await rm.evaluate(() => {
    localStorage.setItem("bm-display-gba", JSON.stringify({ crt: true, intScale: false, aspect: "fill" }));
  });
  await navReady(rm, BASE + "/player.html", "tail-rm-prefs");
  check("reduced motion: no scanline roll", await rm.$eval(".crt-overlay",
    (e) => getComputedStyle(e).animationName) === "none", "static CRT");

  check("zero pageerrors", errors.length === 0, errors.length + " errors");
  await browser.close();
  console.log(failures ? `\n${failures} FAILURES` : "\nWOW1 PLAYER-TAIL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", String(e).split("\n")[0]); process.exit(2); });
