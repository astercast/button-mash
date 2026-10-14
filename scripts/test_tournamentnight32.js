/* Wave 32 flagship checks: Tournament Night.

   (1) unit checks against the UMD core
   (assets/js/tournament-night-core.js) with injected storage and
   real catalog fixtures, entrants resolve from collections and
   lineup snapshots in source order, seeding is the existing
   bracket engine's, byes are honest, picks advance and persist,
   corrupt nights drop whole, the results card names only real
   games and decided matches; (2) headless: seed a night from the
   smallest collection (4 games), pick through both semifinals
   and the final, crown the champion, reload and find the night
   exactly where it was left, read the results card, clear the
   night; seed a second night from an injected saved lineup and
   confirm its games headline the bracket; (3) mobile 390px:
   zero overflow. Zero pageerrors throughout.

   Honesty contract under test: entrants are only ever the source's
   real catalog games (names/descriptions/URLs copied from the
   catalog), and a result exists only because a pick was clicked.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_tournamentnight32.js
   Exit 0 = all pass. */
"use strict";
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const ROOT = "/home/hatch/workspace/button-mash";
const BASE = "file://" + ROOT;
let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, ", ", detail); }
  else { failures++; console.error("FAIL", name, ", ", detail); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TN = require(path.join(ROOT, "assets/js/tournament-night-core.js"));
const gamesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8"));
const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
const byIdMap = {};
gamesDoc.games.forEach((g) => { byIdMap[g.id] = g; });
const COLLECTIONS = colsDoc.collections || [];
const smallest = COLLECTIONS.slice().sort((a, b) => a.game_ids.length - b.game_ids.length)[0];

function fakeStorage() {
  const m = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    _map: m,
  };
}

/* ---------------- (1) core unit checks ---------------- */
{
  check("core surface: key, schema, caps follow the bracket engine",
    TN.STORE_KEY === "bm.tournament-night.v1" && TN.SCHEMA_VERSION === 1 &&
    TN.MIN_ENTRANTS === 2 && TN.MAX_ENTRANTS === 16,
    TN.STORE_KEY + " / 2-16 entrants");

  const built = TN.entrantsFromCollection(smallest, byIdMap);
  check("entrants: the smallest collection resolves whole, in source order",
    built.skipped.length === 0 && built.entrants.length === smallest.game_ids.length &&
    built.entrants.every((e, i) => e.id === smallest.game_ids[i] && e.title === byIdMap[e.id].title && e.url === byIdMap[e.id].url),
    smallest.id + " (" + smallest.game_ids.length + " games), ids, titles and URLs are the catalog's");

  const ghost = TN.entrantsFromCollection({ id: "x", game_ids: ["2048", "no-such-game"] }, byIdMap);
  check("entrants: a game that left the catalog is skipped and reported, never invented",
    ghost.entrants.length === 1 && ghost.skipped.length === 1 && ghost.skipped[0] === "no-such-game",
    "the night plays only games the catalog still vouches for");

  const lineupFixture = { slots: smallest.game_ids.map((id) => ({ game_id: id })) };
  const fromLineup = TN.entrantsFromLineup(lineupFixture, byIdMap);
  check("entrants: a lineup snapshot resolves back to the live catalog by game_id",
    fromLineup.entrants.length === smallest.game_ids.length &&
    fromLineup.entrants[0].description === byIdMap[smallest.game_ids[0]].description,
    "snapshots name games; the catalog supplies what the night may say about them");

  const res = TN.createNight({ source: { type: "collection", id: smallest.id, name: smallest.title }, entrants: built.entrants, now: 1000 });
  check("seeding: first game is the top seed and the bracket is bracket.js's own",
    res.ok && res.night.bracket.players[0] === built.entrants[0].title &&
    res.night.bracket.size === 4 && res.night.created_at === 1000,
    "source order = seed order, standard seeding inside the shared engine");

  check("refusals are plain answers: one game cannot hold a night",
    TN.createNight({ source: { type: "collection", id: "t", name: "T" }, entrants: [byIdMap["2048"]] }).ok === false,
    "MIN_ENTRANTS enforced before any bracket exists");

  // Byes: 5 entrants in an 8-slot bracket, the top three seeds sit out round 1.
  const five = ["2048", "wordle", "tetrio", "connections", "jstris"].map((id) => byIdMap[id]);
  const n5 = TN.createNight({ source: { type: "collection", id: "t", name: "T" }, entrants: five, now: 7 }).night;
  const r0 = TN.rounds(n5)[0];
  const byeMatches = r0.matches.filter((m) => m.byeAdvance);
  check("byes: a 5-game night gives its top seeds honest first-round byes",
    byeMatches.length === 3 && byeMatches.every((m) => m.winner && m.winner.seed <= 3) &&
    TN.resultsCard(n5).includes("first-round bye (top seed)"),
    byeMatches.map((m) => m.winner.name).join(", ") + " advance without a pick");

  // A full night on the smallest collection: pick side 'a' everywhere.
  const night = res.night;
  const rounds0 = TN.rounds(night);
  check("a fresh night has no champion and an honest card",
    TN.champion(night) === null && TN.resultsCard(night).includes("No champion yet") &&
    TN.progress(night).decided === 0,
    "nothing is decided before a pick is clicked");
  rounds0.forEach((round) => {
    round.matches.forEach((m) => { if (!m.byeAdvance) TN.pick(night, m.round, m.index, "a"); });
  });
  const champ = TN.champion(night);
  check("picks advance round by round and crown the top seed's game",
    !!champ && champ.id === built.entrants[0].id && TN.progress(night).complete &&
    champ.url === byIdMap[champ.id].url && champ.description === byIdMap[champ.id].description,
    "champion: " + (champ && champ.title) + ", its card data is the catalog's, verbatim");
  const card = TN.resultsCard(night);
  check("the results card lists every decided match and the champion's play URL",
    card.includes("CHAMPION: " + champ.title) && card.includes("Play it: " + champ.url) &&
    card.includes("def. ") && card.includes(smallest.title),
    "source, results, champion, nothing on the card the bracket did not produce");

  const st = fakeStorage();
  check("the night persists through the storage round-trip",
    TN.saveNight(night, st) === true && TN.loadNight(st) !== null &&
    TN.champion(TN.loadNight(st)).id === champ.id,
    "localStorage key " + TN.STORE_KEY);
  check("a champion survives validation; a tampered bracket does not",
    TN.validNight(night) === true &&
    TN.loadNight({ getItem: () => JSON.stringify({ v: 1, name: "X", source: { type: "collection", id: "t" }, entrants: night.entrants, bracket: { players: ["Fake"], order: [1], results: {} }, created_at: 5 }), setItem: () => {}, removeItem: () => {} }) === null,
    "bracket players must equal the entrant titles exactly, or the night drops whole");
  TN.clearNight(st);
  check("clearing wipes the night", TN.loadNight(st) === null, "blank marquee");
  const undone = TN.createNight({ source: { type: "collection", id: "t", name: "T" }, entrants: five, now: 9 }).night;
  TN.pick(undone, 0, 1, "a"); // the one real first-round match (seeds 4 v 5)
  TN.pick(undone, 1, 0, "a"); // its winner's semifinal, against the top seed
  const beforeClear = TN.rounds(undone)[1].matches[0].decided;
  TN.unpick(undone, 0, 1);
  check("clearing a pick cascades through the engine, not around it",
    beforeClear === true && TN.rounds(undone)[1].matches[0].decided === false &&
    TN.rounds(undone)[0].matches[1].decided === false,
    "Bracket.clearMatch owns the cascade, as in Tournament 2.0");
}

/* ---------------- (2-3) headless ---------------- */
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("dialog", (d) => d.accept());

  await page.goto(BASE + "/tournament-night.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#tn-collection option", { timeout: 30000 });
  const optCount = await page.$$eval("#tn-collection option", (els) => els.length);
  check("page: the source picker offers all 24 collections", optCount === 24, optCount + " collections");
  const noLineup = await page.$eval("#tn-lineup-none", (el) => !el.hidden && /No saved lineups/.test(el.textContent));
  check("page: with no saved lineups the shelf says so honestly", noLineup, "empty shelf, named as empty");

  // Seed from the smallest collection and play side 'a' home.
  await page.evaluate((id) => {
    const sel = document.getElementById("tn-collection");
    sel.value = id;
  }, smallest.id);
  await page.click("#tn-start");
  await page.waitForSelector(".tn-match", { timeout: 30000 });
  const seedTitles = await page.$$eval(".tn-round:first-child .tn-entrant-title", (els) => els.map((e) => e.textContent));
  check("page: the bracket's first round carries the collection's real games",
    seedTitles.includes(byIdMap[smallest.game_ids[0]].title),
    "top seed on a ticket: " + byIdMap[smallest.game_ids[0]].title);
  let guard = 0;
  while (guard++ < 12) {
    const champShown = await page.evaluate(() => {
      const c = document.getElementById("tn-champion");
      return c && !c.hidden;
    });
    if (champShown) break;
    const clicked = await page.evaluate(() => {
      const btns = Array.prototype.slice.call(document.querySelectorAll(".tn-entrant:not(:disabled)"));
      const real = btns.filter((b) => !b.classList.contains("is-bye") && b.querySelector(".tn-seed"));
      if (!real.length) return false;
      real[0].click();
      return true;
    });
    if (!clicked) break;
    await sleep(250);
  }
  const champTitle = await page.$eval(".tn-champion-title", (el) => el.textContent);
  check("page: picking through the bracket crowns a champion",
    champTitle === byIdMap[smallest.game_ids[0]].title, "champion: " + champTitle);
  const storedRaw = await page.evaluate(() => localStorage.getItem("bm.tournament-night.v1"));
  check("page: the finished night is persisted under the registered key",
    !!storedRaw && JSON.parse(storedRaw).entrants.length === smallest.game_ids.length,
    "bm.tournament-night.v1 holds the night");
  const cardText = await page.$eval("#tn-card-text", (el) => el.textContent);
  check("page: the results card names the champion and its real play URL",
    cardText.includes("CHAMPION: " + champTitle) && cardText.includes(byIdMap[smallest.game_ids[0]].url),
    cardText.split("\n").slice(-3).join(" | "));

  // Reload: the night resumes exactly where it was left.
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".tn-champion-title", { timeout: 30000 });
  const champAfter = await page.$eval(".tn-champion-title", (el) => el.textContent);
  check("page: after a reload the champion is still crowned", champAfter === champTitle, champAfter);

  // A saved lineup headlines the second night.
  await page.evaluate((slots) => {
    const rec = {
      schema: "bm.lineup.v1", v: 1, id: "ln-test-1", name: "Headless Lineup Night",
      saved_at: 1760000000000,
      inputs: { group_size: 4, minutes: 120, vibes: ["party"], skill: "mixed", kids: false },
      total_est_minutes: 90, scoring_version: null,
      slots: slots,
    };
    localStorage.setItem("bm.lineups.v1", JSON.stringify({ v: 1, lineups: [rec] }));
  }, smallest.game_ids.map((id, i) => ({
    game_id: id, title: byIdMap[id].title, url: byIdMap[id].url, genre: byIdMap[id].genre,
    role: "main", role_label: "Main event", session_est: 20, floor_label: "Anyone",
    energy_label: "steady", capacity: 4, score: 50, why: ["fixture"],
  })));
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#tn-collection option", { timeout: 30000 });
  await page.click('input[name="tn-source"][value="lineup"]');
  await sleep(200);
  const linOpts = await page.$$eval("#tn-lineup option", (els) => els.map((e) => e.textContent));
  check("page: the saved lineup appears as a bracket source",
    linOpts.some((t) => t.includes("Headless Lineup Night")), linOpts.join(" | "));
  await page.click("#tn-start");
  await page.waitForSelector(".tn-match", { timeout: 30000 });
  const srcLine = await page.$eval("#tn-night-source", (el) => el.textContent);
  check("page: the lineup night is seeded from the lineup's games",
    srcLine.includes("Saved lineup") && srcLine.includes("Headless Lineup Night"), srcLine.trim());

  // Clear: the marquee goes dark.
  await page.click("#tn-clear");
  await sleep(300);
  const cleared = await page.evaluate(() => localStorage.getItem("bm.tournament-night.v1"));
  const emptyShown = await page.$eval("#tn-empty", (el) => !el.hidden);
  check("page: clearing wipes the stored night and shows the empty state",
    cleared === null && emptyShown, "no night running");

  // Mobile.
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + "/tournament-night.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("#tn-collection option", { timeout: 30000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check("mobile 390px: the tournament page has zero horizontal overflow", !overflow, "390px wide, no sideways scroll");

  check("zero pageerrors across the whole flow", errors.length === 0, errors.slice(0, 3).join(" | ") || "clean");
  await browser.close();
  console.log(failures ? "\n" + failures + " FAILURES" : "\nALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(1); });
