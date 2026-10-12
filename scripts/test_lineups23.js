/* Wave 23 "Game Night 2.1" checks: saved lineups + the rematch.
   (1) node unit checks against the UMD shelf module
   (assets/js/curator-night-lineups.js) with a fake storage backend and
   the real catalog + engine; (2) headless: deal -> name -> shelve ->
   reload (persistence) -> load -> rematch (fresh picks) -> retire;
   (3) mobile 390px shelf: zero overflow. Zero pageerrors throughout.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_lineups23.js
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

/* puppeteer-core 24 dropped page.$x — click the first visible button
   whose label contains `text`, optionally scoped to a container. */
async function clickText(page, text, scopeSel) {
  return page.evaluate((t, scope) => {
    const root = scope ? document.querySelector(scope) : document;
    if (!root) return false;
    const b = Array.from(root.querySelectorAll("button")).find(
      (x) => x.textContent.includes(t) && !x.hidden && x.offsetParent !== null);
    if (!b) return false;
    b.click();
    return true;
  }, text, scopeSel || null);
}

const CN = require(path.join(ROOT, "assets/js/curator-night.js"));
const BL = require(path.join(ROOT, "assets/js/curator-night-lineups.js"));
const gamesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8"));
const kidsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"));
const kidSafeIds = {};
(kidsDoc["kid-safe"] || []).forEach((k) => { kidSafeIds[k.id] = 1; });
const CAT = { games: gamesDoc.games, kidSafeIds: kidSafeIds, generated_at: gamesDoc.generated_at };

function fakeBackend() {
  const m = {};
  return {
    get: (k) => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
    set: (k, v) => { m[k] = v; },
    del: (k) => { delete m[k]; },
    _map: m,
  };
}

/* ---------------- (1) shelf unit checks ---------------- */
{
  check("shelf surface: key, cap, schema",
    BL.STORE_KEY === "bm.lineups.v1" && BL.MAX_LINEUPS === 12 && BL.EXPORT_SCHEMA === "bm.lineup.v1",
    BL.STORE_KEY + " / cap " + BL.MAX_LINEUPS);
  check("node store (no localStorage) reports memory mode",
    BL.createStore().storageMode() === "memory", "honest fallback, same as the Trophy Room");

  const be = fakeBackend();
  const store = BL.createStore(be);
  check("injected backend reports local mode", store.storageMode() === "local", "persists");

  const inputs = { group_size: 4, minutes: 120, vibes: ["party", "chaotic"], skill: "mixed", kids: false };
  const dealt = CN.dealNight(inputs, CAT);
  const saved = store.save(dealt, "Friday With The Cousins");
  check("save a dealt night", saved.ok && BL.validRecord(saved.record), saved.ok ? saved.record.id : saved.error);
  check("record snapshots the deal (ids, roles, estimates)",
    saved.record.slots.length === dealt.lineup.length &&
    saved.record.slots.every((s, i) => s.game_id === dealt.lineup[i].game_id && s.role === dealt.lineup[i].role) &&
    saved.record.total_est_minutes === dealt.total_est_minutes &&
    saved.record.scoring_version === "2.1.0",
    saved.record.slots.length + " slots snapshotted");
  check("snapshot is a copy, not a reference",
    (() => { dealt.lineup[0].title = "MUTATED"; const again = store.get(saved.record.id); return again.slots[0].title !== "MUTATED"; })(),
    "mutating the deal leaves the shelf untouched");

  const store2 = BL.createStore(be); /* a "reload": new store, same backend */
  check("shelf survives a reload (new store, same storage)",
    store2.count() === 1 && store2.list()[0].name === "Friday With The Cousins",
    "1 night on the shelf");

  const auto = store.save(CN.dealNight({ group_size: 2, minutes: 60, vibes: ["cozy"], skill: "casual", kids: false }, CAT), "   ");
  check("blank name falls back to a suggested name",
    auto.ok && /2 players/.test(auto.record.name) && /cozy/.test(auto.record.name), auto.record.name);
  const long = store.save(CN.dealNight(inputs, CAT), "x".repeat(90));
  check("names are capped at " + BL.MAX_NAME + " chars", long.ok && long.record.name.length === BL.MAX_NAME, "len=" + long.record.name.length);
  check("newest first on the shelf",
    store.list()[0].id === long.record.id && store.list()[2].id === saved.record.id, "unshift order");

  check("empty lineup refused with a plain reason",
    (() => { const r = store.save({ lineup: [], inputs_echo: inputs }, "nope"); return !r.ok && /no picks/.test(r.error); })(),
    "no silent no-op");
  check("remove: known id true, unknown id false",
    store.remove(auto.record.id) === true && store.remove("ln-nope") === false && store.count() === 2,
    "shelf back to 2");

  /* the cap: fill to 12, the 13th is refused, nothing is dropped */
  const capBe = fakeBackend();
  const capStore = BL.createStore(capBe);
  for (let i = 0; i < BL.MAX_LINEUPS; i++) capStore.save(CN.dealNight(inputs, CAT), "Night " + i);
  const over = capStore.save(CN.dealNight(inputs, CAT), "One Too Many");
  check("cap: 13th night refused, shelf keeps all 12",
    !over.ok && /shelf is full/.test(over.error) && capStore.count() === BL.MAX_LINEUPS &&
    capStore.list().every((r) => r.name !== "One Too Many"),
    over.error);

  /* corruption: one bad record never wipes the shelf */
  const mixBe = fakeBackend();
  const mixStore = BL.createStore(mixBe);
  const good = mixStore.save(CN.dealNight(inputs, CAT), "The Good One").record;
  const raw = JSON.parse(mixBe._map[BL.STORE_KEY]);
  raw.lineups.unshift({ schema: "bm.lineup.v1", v: 1, id: "ln-bad", name: "Tampered", saved_at: 1,
    inputs: good.inputs, total_est_minutes: 10,
    slots: [{ game_id: "x", title: "X", url: "http://insecure.example/", genre: "puzzle", role: "main",
      role_label: "THE MAIN EVENT", session_est: 10, floor_label: "anyone can play", energy_label: "steady",
      capacity: 1, score: 50, why: ["planted"] }] });
  raw.lineups.push({ garbage: true });
  mixBe._map[BL.STORE_KEY] = JSON.stringify(raw);
  const survivors = mixStore.list();
  check("corrupt records dropped one by one, good nights survive",
    survivors.length === 1 && survivors[0].name === "The Good One",
    survivors.length + " survivor(s)");
  mixBe._map[BL.STORE_KEY] = "{not json";
  check("unparseable storage reads as an empty shelf, never throws",
    mixStore.count() === 0, "clean read");

  /* ---------------- rematch ---------------- */
  const rec = BL.createStore(fakeBackend()).save(CN.dealNight(inputs, CAT), "Rematch Source").record;
  const rm = BL.rematch(rec, CAT, CN);
  const savedIds = {};
  rec.slots.forEach((s) => { savedIds[s.game_id] = 1; });
  check("rematch: ok + every pick fresh",
    rm.ok && rm.fresh && rm.result.lineup.every((s) => !savedIds[s.game_id]),
    rm.result.lineup.map((s) => s.game_id).join(","));
  check("rematch: same setup echoed back",
    JSON.stringify(rm.result.inputs_echo) === JSON.stringify(rec.inputs),
    JSON.stringify(rm.result.inputs_echo));
  /* The role curve is the structure: edges, intermission, peak position.
     The main-event count follows the timebox (fresh picks run longer or
     shorter), so count may differ by one — the total never overruns. */
  const curve = (slots) => slots.map((s) => s.role).filter((r) => r !== "main");
  check("rematch: same role curve (edges + intermission + peak), timebox intact",
    JSON.stringify(curve(rm.result.lineup)) === JSON.stringify(curve(rec.slots)) &&
    Math.abs(rm.result.lineup.length - rec.slots.length) <= 1 &&
    rm.result.total_est_minutes <= rec.inputs.minutes,
    rm.result.lineup.map((s) => s.role).join(" > ") + " | ~" + rm.result.total_est_minutes + " min");
  const kidsRec = BL.createStore(fakeBackend()).save(
    CN.dealNight({ group_size: 5, minutes: 60, vibes: ["party"], skill: "casual", kids: true }, CAT), "Kids Rematch").record;
  const kidsRm = BL.rematch(kidsRec, CAT, CN);
  check("rematch: kids night stays kid-safe + fresh",
    kidsRm.ok && kidsRm.fresh && kidsRm.result.lineup.every((s) => s.kid_safe),
    kidsRm.result.lineup.length + " fresh kid-safe picks");
  check("rematch: unreadable record refused plainly",
    (() => { const r = BL.rematch({ name: "ghost" }, CAT, CN); return !r.ok && /not readable/.test(r.error); })(),
    "no deal from a ghost");

  /* ---------------- the card ---------------- */
  const card = BL.lineupAsText(rec);
  check("card: names the night, lists every slot with its URL",
    card.includes('"Rematch Source"') &&
    rec.slots.every((s) => card.includes(s.title) && card.includes(s.url)) &&
    card.includes("GAME NIGHT"),
    card.split("\n")[0]);
  check("card: carries the estimates disclaimer",
    /curator estimates, not measured times/.test(card), "honesty travels with the card");
  check("card: settings line matches the saved setup",
    /4 players · 120 min · party\/chaotic · mixed/.test(card), card.split("\n")[1]);
  check("card: invalid record yields empty string, not a half-card",
    BL.lineupAsText({ name: "ghost" }) === "", "refused");
  check("suggestName: weekday + headcount + vibes",
    /— 4 players · party \+ chaotic/.test(BL.suggestName(inputs, Date.UTC(2026, 9, 16, 12))),
    BL.suggestName(inputs, Date.UTC(2026, 9, 16, 12)));
}

/* ---------------- (2-3) headless ---------------- */
async function newPage(browser, viewport, motion) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (t.indexOf("Failed to load resource: net::ERR_FILE_NOT_FOUND") === 0) return;
    errors.push("[console.error] " + t.slice(0, 200));
  });
  page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 200)));
  page.on("requestfailed", (r) => {
    if (r.url().includes("/api/")) return;
    errors.push("[requestfailed] " + r.url().slice(0, 120));
  });
  await page.setViewport(viewport || { width: 1280, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: motion === "reduce" ? "reduce" : "no-preference" }]);
  return { page, errors };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  try {
    try {
      await browser.defaultBrowserContext().overridePermissions("file://", ["clipboard-read", "clipboard-write"]);
    } catch (e) { /* older builds: copy assertions read the status note either way */ }

    const { page, errors } = await newPage(browser, null, "reduce");
    await page.goto(BASE + "/game-night.html", { waitUntil: "networkidle0", timeout: 60000 });
    check("shelf hidden before anything is saved",
      await page.$eval("#cn-shelf", (el) => el.hidden), "progressive disclosure: no empty shelf");

    /* Deal, then save with a name. */
    await page.click("#cn-deal");
    await page.waitForSelector(".cn-slot", { timeout: 15000 });
    await sleep(600);
    const dealtTitles = await page.$$eval(".cn-slot h3 a", (els) => els.map((e) => e.textContent));
    check("dealt a lineup to save", dealtTitles.length >= 3, dealtTitles.length + " slots");
    check("save action offered on a dealt night",
      await clickText(page, "Save this night", "#cn-stage"), "one save button");
    await page.waitForSelector(".cn-save-name", { visible: true, timeout: 5000 });
    await page.type(".cn-save-name", "TEST NIGHT ALPHA");
    await clickText(page, "Shelve it", "#cn-stage");
    await sleep(400);
    const stageNote = await page.$eval(".cn-actions .cn-copy-note", (el) => el.textContent);
    check("save confirmed in place", /Shelved as “TEST NIGHT ALPHA”/.test(stageNote), stageNote.slice(0, 60));
    const shelfVisible = await page.$eval("#cn-shelf", (el) => !el.hidden);
    const shelfName = await page.$eval(".cn-shelf-card h3", (el) => el.textContent);
    check("shelf shows the saved night", shelfVisible && shelfName === "TEST NIGHT ALPHA", shelfName);

    /* Reload: the shelf persists (localStorage, this browser only). */
    await page.reload({ waitUntil: "networkidle0" });
    const afterReload = await page.$$eval(".cn-shelf-card h3", (els) => els.map((e) => e.textContent));
    check("saved night survives a reload", afterReload.length === 1 && afterReload[0] === "TEST NIGHT ALPHA",
      afterReload.join(","));
    const shelfTitles = await page.$eval(".cn-shelf-titles", (el) => el.textContent);
    check("shelf card lists the night's picks in order",
      dealtTitles.every((t) => shelfTitles.includes(t)), shelfTitles.slice(0, 70));

    /* Copy the card from the shelf. */
    await clickText(page, "Copy card", "#cn-shelf-list");
    await sleep(400);
    const copyNote = await page.$eval(".cn-shelf-actions .cn-copy-note", (el) => el.textContent);
    let clip = "";
    try { clip = await page.evaluate(() => navigator.clipboard.readText()); } catch (e) {}
    check("copy card: clipboard carries the card (or honest fallback note)",
      /TEST NIGHT ALPHA/.test(clip) || /Copied|Copy failed/.test(copyNote),
      clip ? "clipboard: " + clip.split("\n")[0] : "note: " + copyNote);

    /* Load it back: banner + the same picks, saved-mode actions. */
    await clickText(page, "Load it", "#cn-shelf-list");
    await page.waitForSelector(".cn-saved-banner", { timeout: 10000 });
    const banner = await page.$eval(".cn-saved-banner", (el) => el.textContent);
    check("load: saved banner names the night", /SAVED NIGHT/.test(banner) && /TEST NIGHT ALPHA/.test(banner), banner.slice(0, 60));
    const loadedTitles = await page.$$eval(".cn-slot h3 a", (els) => els.map((e) => e.textContent));
    check("load: same picks, same order as dealt",
      JSON.stringify(loadedTitles) === JSON.stringify(dealtTitles), loadedTitles.join(" / ").slice(0, 70));

    /* The rematch: same setup, fresh picks. */
    check("rematch action offered on a loaded night",
      await clickText(page, "Deal the rematch", "#cn-stage"), "one rematch button");
    await page.waitForFunction(
      () => /THE REMATCH/.test(document.querySelector(".cn-saved-banner")?.textContent || ""),
      { timeout: 15000 });
    const rematchTitles = await page.$$eval(".cn-slot h3 a", (els) => els.map((e) => e.textContent));
    const rematchRoles = await page.$$eval(".cn-slot .cn-role", (els) => els.map((e) => e.textContent));
    check("rematch: every pick fresh, curve edges intact (count follows the timebox)",
      rematchTitles.length >= dealtTitles.length - 1 &&
      rematchTitles.every((t) => !dealtTitles.includes(t)) &&
      rematchRoles[0] === "THE WARM-UP" && rematchRoles[rematchRoles.length - 1] === "THE COOL-DOWN",
      rematchTitles.join(" / ").slice(0, 70));

    /* Retire from the shelf: shelf empties and hides again. */
    await clickText(page, "Retire", "#cn-shelf-list");
    await sleep(400);
    const shelfGone = await page.$eval("#cn-shelf", (el) => el.hidden);
    check("retire: shelf empties and hides", shelfGone, "back to no-shelf state");
    check("zero pageerrors/console errors across the whole flow", errors.length === 0, errors.join(" | ") || "clean");

    /* Mobile: save flow at 390px, shelf card must not overflow. */
    await page.setViewport({ width: 390, height: 844 });
    await page.click("#cn-deal");
    await page.waitForSelector(".cn-slot", { timeout: 15000 });
    await sleep(600);
    await clickText(page, "Save this night", "#cn-stage");
    await page.waitForSelector(".cn-save-name", { visible: true, timeout: 5000 });
    await page.type(".cn-save-name", "MOBILE NIGHT");
    await clickText(page, "Shelve it", "#cn-stage");
    await sleep(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("mobile 390px: shelf + save form, zero horizontal overflow", overflow <= 1, "overflow=" + overflow + "px");
    check("zero errors on mobile flow", errors.length === 0, errors.join(" | ") || "clean");
    await page.close();
  } finally {
    await browser.close();
  }
  console.log(failures === 0 ? "ALL PASS" : failures + " FAILURES");
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
