/* Wave 33 flagship checks: Versus.

   (1) unit checks against the UMD core (assets/js/versus-core.js)
   with the real catalog — profiles copy/count only real record
   fields, the year rule matches the Curator census (45 games name
   a verified year; 2048's name number is not one), verdicts fire
   only where the records support them, the thin state fires on
   the catalog's bare tail, pairings validate, and the share card
   names only what the comparison produced; (2) headless: a dated
   pairing renders both record cards + verdict strip + card, a
   bare pairing renders the no-basis state, an unknown id in the
   URL is dropped with a note, a swap exchanges the corners;
   (3) mobile 390px: zero overflow. Zero pageerrors throughout.

   Honesty contract under test: no score, ranking, or winner is
   ever produced — the strip's lines are counts, dates, and audit
   facts copied or counted from the catalog records themselves.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_versus33.js
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

const V = require(path.join(ROOT, "assets/js/versus-core.js"));
const gamesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/games.json"), "utf8"));
const colsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/collections.json"), "utf8"));
const kidsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"));
const games = gamesDoc.games;
const byId = {};
games.forEach((g) => { byId[g.id] = g; });
const kidIds = new Set((kidsDoc["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id));
const CTX = { collections: colsDoc.collections || [], kidIds: kidIds };

/* ---------------- (1) core unit checks ---------------- */
{
  check("core surface: UMD, genre-dive registry names only the dives that exist",
    typeof V.compare === "function" && typeof V.profile === "function" &&
    Object.keys(V.GENRE_DIVES).sort().join(",") === "action,cozy,multiplayer,puzzle,retro,roguelike" &&
    fs.existsSync(path.join(ROOT, "genres/roguelike.html")) && fs.existsSync(path.join(ROOT, "genres/cozy.html")) &&
    fs.existsSync(path.join(ROOT, "genres/puzzle.html")) && fs.existsSync(path.join(ROOT, "genres/retro.html")) &&
    fs.existsSync(path.join(ROOT, "genres/action.html")) && fs.existsSync(path.join(ROOT, "genres/multiplayer.html")),
    "roguelike + cozy + puzzle (wave 36) + retro (wave 37) + action (wave 38) + multiplayer (wave 39) dives exist on disk; no other genre is claimed");

  check("year rule: 2048's name number is not a year (the census exclusion)",
    V.yearNamed(byId["2048"].description, "2048") === null &&
    V.profile(byId["2048"], CTX).year === null,
    "the tile goal never renders as a release year");

  const dated = games.filter((g) => V.profile(g, CTX).year !== null);
  check("year rule: exactly the census's 45 verified year claims name a year",
    dated.length === 45 && V.yearNamed(byId["zork1"].description, "zork1") === 1980 &&
    V.yearNamed(byId["pac-gal-20th"].description, "pac-gal-20th") === 2000,
    dated.length + " dated records; Zork names 1980, the reunion cabinet names its 2000 first");

  const zork = V.profile(byId["zork1"], CTX);
  const g2048 = V.profile(byId["2048"], CTX);
  check("profile: fields are the catalog's own — host, genre, controls, description verbatim",
    zork.host === "archive.org" && zork.genre === byId["zork1"].genre &&
    zork.controls === byId["zork1"].controls && zork.description === byId["zork1"].description &&
    zork.url === byId["zork1"].url,
    "nothing paraphrased, nothing added");

  check("profile: collection footprint is counted from collections.json, both ways reconciled",
    games.every((g) => {
      const p = V.profile(g, CTX);
      return p.collectionCount === p.collections.length &&
        p.collections.every((c) => (colsDoc.collections.find((x) => x.id === c.id) || { game_ids: [] }).game_ids.includes(g.id));
    }) && g2048.collectionCount === 3 && zork.collectionCount === 0,
    "2048 sits on 3 shelves; Zork I on none — the orphan fact renders as a fact");

  const cmp = V.compare(byId["zork1"], byId["2048"], CTX);
  check("verdicts: only record-backed lines — footprint fires; coverage tied since wave 37 (Zork has the retro dive, 2048 the puzzle dive, both Kids-listed at 2 each), era stays silent (one year missing)",
    cmp.ok && !cmp.thin && cmp.verdicts.length === 1 &&
    cmp.verdicts[0].kind === "footprint" &&
    zork.coverageCount === 2 && g2048.coverageCount === 2 &&
    zork.coverage.some((c) => c.label === "Genre deep dive: retro") &&
    g2048.coverage.some((c) => c.label === "Genre deep dive: puzzle") &&
    cmp.verdicts.every((v) => !/score|rating|better|winner|best/i.test(v.text)),
    cmp.verdicts.map((v) => v.text).join(" "));

  const era = V.compare(byId["zork1"], byId["space-invaders"], CTX);
  check("verdicts: era fires when both descriptions name a year, older side named with both years",
    era.verdicts.some((v) => v.kind === "era" && v.text.includes("1978") && v.text.includes("1980")),
    era.verdicts.filter((v) => v.kind === "era").map((v) => v.text).join(" "));

  check("refusals are plain answers: a game cannot face itself, a broken record cannot compare",
    V.compare(byId["wordle"], byId["wordle"], CTX).ok === false &&
    V.compare(null, byId["wordle"], CTX).ok === false &&
    V.compare({ id: "x" }, byId["wordle"], CTX).ok === false,
    "self-pairing and thin air both refuse before any verdict exists");

  const bare = ["lookouts", "dating-killmulator-2"]
    .filter((id) => { const p = V.profile(byId[id], CTX); return p.year === null && p.collectionCount === 0 && !p.tags.length && !p.kidSafe && p.coverageCount === 0; });
  const thinCmp = V.compare(byId["lookouts"], byId["dating-killmulator-2"], CTX);
  check("thin state: the catalog's bare tail (no year/shelf/tag/coverage/Kids pass) gets no verdict",
    bare.length === 2 && thinCmp.ok && thinCmp.thin === true && thinCmp.verdicts.length === 0 &&
    V.shareCard(thinCmp, "").includes("No basis to compare"),
    bare.join(", ") + " — the strip refuses rather than dressing up genre and controls");

  check("pairing: encode/parse round-trips; unknown and repeated ids drop, never guess",
    V.encodePair("zork1", "2048") === "a=zork1&b=2048" &&
    (() => { const p = V.parsePair("?a=zork1&b=2048", byId); return p.a === "zork1" && p.b === "2048" && p.dropped.length === 0; })() &&
    (() => { const p = V.parsePair("?a=zork1&b=no-such-game", byId); return p.a === "zork1" && p.b === null && p.dropped[0] === "no-such-game"; })() &&
    (() => { const p = V.parsePair("?a=wordle&b=wordle", byId); return p.a === "wordle" && p.b === null; })(),
    "URL state is validated against the catalog on load");

  const card = V.shareCard(cmp, "versus.html?a=zork1&b=2048");
  check("share card: rows + verdict lines + real play URLs only, no score or winner language",
    card.includes("VERSUS — Zork I vs 2048") && card.includes(byId["zork1"].url) && card.includes(byId["2048"].url) &&
    card.includes(cmp.verdicts[0].text) && !/score|rating|winner/i.test(card),
    "the card is the comparison, in plain text");

  check("coverage: a cozy game with a Kids pass carries both coverage entries; since wave 38 every action game carries the action dive, since wave 39 every multiplayer game carries the multiplayer dive, and a dive-less genre still carries none",
    (() => { const cozyKid = games.find((g) => { const p = V.profile(g, CTX); return p.genre === "cozy" && p.kidSafe; }); return cozyKid && V.profile(cozyKid, CTX).coverageCount === 2; })() &&
    V.profile(byId["krunker"], CTX).coverageCount === 1 &&
    V.profile(byId["krunker"], CTX).coverage.some((c) => c.label === "Genre deep dive: action" && c.href === "genres/action.html") &&
    V.profile(byId["kaaarot"], CTX).coverageCount === 1 &&
    V.profile(byId["kaaarot"], CTX).coverage.some((c) => c.label === "Genre deep dive: multiplayer" && c.href === "genres/multiplayer.html") &&
    V.profile(byId["lookouts"], CTX).coverageCount === 0,
    "coverage counts pages that exist, per game — krunker (action, no Kids pass) carries exactly its dive; kaaarot (multiplayer) carries the multiplayer dive since wave 39; lookouts (horror, no dive yet) carries none");
}

/* ---------------- (2)+(3) headless ---------------- */
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome", headless: "new",
    args: ["--no-sandbox", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto(BASE + "/versus.html?a=zork1&b=2048", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".vs-card", { timeout: 15000 });
  await sleep(300);
  const titles = await page.$$eval(".vs-title", (ns) => ns.map((n) => n.textContent));
  check("headless: the dated pairing renders both record cards in URL order",
    titles.length === 2 && titles[0] === "Zork I" && titles[1] === "2048",
    titles.join(" vs "));
  const strip = await page.$eval("#vs-verdict", (n) => n.textContent);
  check("headless: verdict strip prints the footprint line and the no-score note",
    strip.includes("What the records support") && strip.includes("sits on more of the site") && strip.includes("no winner"),
    strip.slice(0, 140) + "…");
  const cardText = await page.$eval("#vs-card-text", (n) => n.textContent);
  check("headless: share card is populated with the pairing link",
    cardText.includes("VERSUS — Zork I vs 2048") && cardText.includes("versus.html?a=zork1&b=2048"),
    "card + link, ready to copy");

  await page.goto(BASE + "/versus.html?a=lookouts&b=dating-killmulator-2", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".vs-card", { timeout: 15000 });
  await sleep(300);
  const thinStrip = await page.$eval("#vs-verdict", (n) => n.textContent);
  check("headless: a bare pairing renders the honest no-basis state, rows still up",
    thinStrip.includes("No basis to compare") && thinStrip.includes("does not invent a winner"),
    thinStrip.slice(0, 120) + "…");

  await page.goto(BASE + "/versus.html?a=wordle&b=no-such-game", { waitUntil: "networkidle0", timeout: 60000 });
  /* Wait for the boot to actually land the note (a fixed sleep raced
     the catalog fetch under load and flaked once — wait on the
     condition, not the clock). */
  await page.waitForFunction(
    () => document.querySelector("#vs-error") && document.querySelector("#vs-error").textContent.includes("no-such-game"),
    { timeout: 20000 }).catch(() => {});
  const dropNote = await page.$eval("#vs-error", (n) => n.textContent);
  check("headless: an unknown id in the link is dropped with a note, never guessed",
    dropNote.includes("no-such-game") && dropNote.includes("not a catalog id"),
    dropNote);

  await page.goto(BASE + "/versus.html?a=zork1&b=2048", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".vs-card", { timeout: 15000 });
  await page.click("#vs-swap");
  await sleep(300);
  const swapped = await page.$$eval(".vs-title", (ns) => ns.map((n) => n.textContent));
  const loc = await page.evaluate(() => location.search);
  check("headless: swap exchanges the corners and the URL follows",
    swapped[0] === "2048" && swapped[1] === "Zork I" && loc === "?a=2048&b=zork1",
    swapped.join(" vs ") + " @ " + loc);

  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + "/versus.html?a=zork1&b=2048", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector(".vs-card", { timeout: 15000 });
  await sleep(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("mobile 390px: zero horizontal overflow", overflow <= 0, "scrollWidth-clientWidth=" + overflow);

  check("zero pageerrors across the whole headless run", errors.length === 0, errors.join(" | ") || "clean");
  await browser.close();

  console.log(failures ? "\nVERSUS33: " + failures + " FAILURE(S)" : "\nVERSUS33 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
