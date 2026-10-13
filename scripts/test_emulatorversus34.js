/* Wave 34 flagship checks: Emulator Side-by-Side + seeded deals.

   (1) unit checks against the UMD core
   (assets/js/emulator-versus-core.js) with the real emulator
   records — profiles copy only real fields, word-described
   system lists stay uncounted, verdicts fire only where the
   records support them, seeded pairings reproduce exactly
   (FNV-1a over seed + sorted ids, mulberry32), pairings
   validate, and the share card names only what the comparison
   produced (plus the seed, when dealt by seed); (2) the same
   seed discipline on Versus's converted surprise button;
   (3) headless: the starter pairing renders on emulation.html,
   a seeded deal lands the core's exact pairing and re-deals
   identically after reload, an unknown id drops with a note;
   (4) mobile 390px: zero overflow. Zero pageerrors throughout.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_emulatorversus34.js
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

const E = require(path.join(ROOT, "assets/js/emulator-versus-core.js"));
const V = require(path.join(ROOT, "assets/js/versus-core.js"));
const emus = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/emulators.json"), "utf8")).emulators;
const games = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8")).games;
const byId = {}; emus.forEach((e) => { byId[e.id] = e; });

/* ---------------- (1) core unit checks ---------------- */
{
  check("core surface: UMD with profile/compare/seededPair/shareCard",
    typeof E.profile === "function" && typeof E.compare === "function" &&
    typeof E.seededPair === "function" && typeof E.shareCard === "function" &&
    emus.length === 10,
    "10 emulator records; the whole surface is DOM-free");

  check("profile: fields are the record's own — notes/license/systems verbatim",
    (() => { const p = E.profile(byId["mgba"]); return p.notes === byId["mgba"].notes &&
      p.license === "MPL-2.0" && p.systems.join(",") === "GBA,GB,GBC" && p.url === byId["mgba"].url; })(),
    "nothing paraphrased, nothing added");

  check("counting rule: word-described reach is shown, never counted",
    E.systemCount(byId["retroarch"].systems) === null &&
    E.systemCount(byId["emulatorjs"].systems) === null &&
    E.systemCount(byId["webretro"].systems) === null &&
    E.systemCount(byId["sameboy"].systems) === 2 &&
    emus.filter((e) => E.systemCount(e.systems) === null).length === 3,
    "exactly 3 of 10 records describe their reach in words");

  const bios = E.compare(byId["mgba"], byId["duckstation"]);
  check("verdicts: the one-sided BIOS fact fires; license difference reported as a difference",
    bios.ok && bios.verdicts.some((v) => v.kind === "bios" && v.text.includes("DuckStation")) &&
    bios.verdicts.some((v) => v.kind === "license" && v.text.includes("CC BY-NC-ND 4.0")) &&
    bios.verdicts.every((v) => !/score|rating|better|winner|best/i.test(v.text)),
    bios.verdicts.map((v) => v.kind).join(", "));

  const vague = E.compare(byId["emulatorjs"], byId["retroarch"]);
  check("verdicts: no systems line when neither list counts; the uncounted note lands in common ground",
    !vague.verdicts.some((v) => v.kind === "systems") &&
    vague.common.some((t) => t.includes("Neither record gives a countable system list")),
    vague.common.join(" "));

  check("refusals are plain answers: self-pairing and broken records refuse",
    E.compare(byId["mgba"], byId["mgba"]).ok === false &&
    E.compare(null, byId["mgba"]).ok === false &&
    E.compare({ id: "x" }, byId["mgba"]).ok === false,
    "no verdict exists before two real, different records do");

  const p1 = E.seededPair("cabinet-34", emus);
  const p2 = E.seededPair("cabinet-34", emus);
  const p3 = E.seededPair("cabinet-34", emus.slice().reverse());
  check("seed discipline: same seed + same catalog deals the same pairing, order-proof",
    p1 && p2 && p3 && p1.aId === p2.aId && p1.bId === p2.bId &&
    p1.aId === p3.aId && p1.bId === p3.bId && p1.aId !== p1.bId &&
    p1.inputs.join(",") === emus.map((e) => e.id).sort().join(","),
    "cabinet-34 -> " + (p1 ? p1.aId + " vs " + p1.bId : "nothing"));

  const variety = new Set();
  for (let i = 0; i < 24; i++) { const p = E.seededPair("seed-" + i, emus); variety.add(p.aId + "|" + p.bId); }
  check("seed discipline: different seeds deal different pairings; empty seed deals nothing",
    variety.size >= 6 && E.seededPair("", emus) === null && E.seededPair("   ", emus) === null,
    variety.size + " distinct pairings across 24 seeds");

  check("pairing: encode/parse round-trips with seed; unknown and repeated ids drop",
    E.encodePair("mgba", "sameboy", "cabinet-34") === "ea=mgba&eb=sameboy&seed=cabinet-34" &&
    (() => { const p = E.parsePair("?ea=mgba&eb=sameboy&seed=cabinet-34", byId); return p.a === "mgba" && p.b === "sameboy" && p.seed === "cabinet-34" && !p.dropped.length; })() &&
    (() => { const p = E.parsePair("?ea=mgba&eb=nope", byId); return p.a === "mgba" && p.b === null && p.dropped[0] === "nope"; })() &&
    (() => { const p = E.parsePair("?ea=mgba&eb=mgba", byId); return p.b === null; })(),
    "URL state is validated against the records on load");

  const cmp = E.compare(byId["mgba"], byId["sameboy"]);
  const card = E.shareCard(cmp, "emulation.html?ea=mgba&eb=sameboy&seed=cabinet-34", "cabinet-34");
  check("share card: rows + verdicts + the seed + real project URLs, no winner language",
    card.includes("EMULATOR SIDE BY SIDE — mGBA vs SameBoy") && card.includes('seed: "cabinet-34"') &&
    card.includes(byId["mgba"].url) && card.includes(byId["sameboy"].url) &&
    !/score|rating|winner/i.test(card),
    "the card is the comparison and its seed, in plain text");

  const v1 = V.seededPair("first-coin", games);
  const v2 = V.seededPair("first-coin", games);
  check("versus conversion: the game surprise deals seeded too, and its card can carry the seed",
    v1 && v2 && v1.aId === v2.aId && v1.bId === v2.bId &&
    !/Math\.random/.test(fs.readFileSync(path.join(ROOT, "assets/js/versus.js"), "utf8")) &&
    V.shareCard(V.compare(games[0], games[1], { collections: [], kidIds: new Set() }), "versus.html?a=x&b=y", "first-coin").includes('seed: "first-coin"'),
    "first-coin -> " + (v1 ? v1.aId + " vs " + v1.bId : "nothing"));
}

/* ---------------- (3)+(4) headless ---------------- */
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto(BASE + "/emulation.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#ev-stage .vs-card", { timeout: 15000 });
  await sleep(300);
  const titles = await page.$$eval("#ev-stage .vs-title", (ns) => ns.map((n) => n.textContent));
  check("headless: the starter pairing renders the first two records",
    titles.length === 2 && titles[0] === "EmulatorJS" && titles[1] === "RetroArch",
    titles.join(" vs "));
  const strip = await page.$eval("#ev-verdict", (n) => n.textContent);
  check("headless: the strip reports the platform count and keeps the no-winner note",
    strip.includes("What the records support") && strip.includes("lists more platforms") && strip.includes("no winner"),
    strip.slice(0, 140) + "…");

  const expected = E.seededPair("cabinet-34", emus);
  await page.click("#ev-deal");
  await sleep(300);
  const dealt = await page.$$eval("#ev-stage .vs-title", (ns) => ns.map((n) => n.textContent));
  const dealtLoc = await page.evaluate(() => location.search);
  check("headless: the seeded deal lands the core's exact pairing, seed in the URL",
    dealt[0] === byId[expected.aId].name && dealt[1] === byId[expected.bId].name &&
    dealtLoc.includes("seed=cabinet-34"),
    dealt.join(" vs ") + " @ " + dealtLoc);
  const cardText = await page.$eval("#ev-card-text", (n) => n.textContent);
  check("headless: the share card carries the seed line",
    cardText.includes('Seeded pairing — seed: "cabinet-34"'),
    "re-deal it and check");

  await page.goto(BASE + "/emulation.html?ea=mgba&eb=no-such-emu", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction(
    () => document.querySelector("#ev-error") && document.querySelector("#ev-error").textContent.includes("no-such-emu"),
    { timeout: 20000 }).catch(() => {});
  const dropNote = await page.$eval("#ev-error", (n) => n.textContent);
  check("headless: an unknown id in the link is dropped with a note, never guessed",
    dropNote.includes("no-such-emu") && dropNote.includes("not an emulator id"),
    dropNote);

  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + "/emulation.html?ea=mgba&eb=duckstation", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#ev-stage .vs-card", { timeout: 15000 });
  await sleep(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("mobile 390px: zero horizontal overflow", overflow <= 0, "scrollWidth-clientWidth=" + overflow);

  check("zero pageerrors across the whole headless run", errors.length === 0, errors.join(" | ") || "clean");
  await browser.close();

  console.log(failures ? "\nEMUVER34: " + failures + " FAILURE(S)" : "\nEMUVER34 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
