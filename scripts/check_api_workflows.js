/* Wave 3 validation: executes the AGENT.md example workflows against the real
   local api/v1 JSON files plus the Converter v2 token contract.
   Run: node scripts/check_api_workflows.js
   Exit 0 = all workflows produce non-empty, contract-correct results. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log("PASS", name, "—", detail); }
  else { failures++; console.error("FAIL", name, "—", detail); }
}

const gamesEnv = load("api/v1/games.json");
const guidesEnv = load("api/v1/guides.json");
const indexEnv = load("api/v1/index.json");
const games = gamesEnv.games;
const guides = guidesEnv.guides;

// Contract sanity
check("games envelope shape", gamesEnv.endpoint === "games" && Array.isArray(games) && gamesEnv.count === games.length,
  games.length + " records");
check("100+ games", games.length >= 100, games.length + " records");
check("no duplicate ids", new Set(games.map((g) => g.id)).size === games.length, "unique");
check("guides envelope shape", guidesEnv.endpoint === "guides" && guidesEnv.count === guides.length,
  guides.length + " guides");
check("index.json lists endpoints", indexEnv.endpoints && Object.keys(indexEnv.endpoints).length >= 4,
  Object.keys(indexEnv.endpoints).join(", "));

// Workflow 1 (AGENT.md): "Find a multiplayer party game"
const party = games.filter((g) => (g.tags || []).includes("party") && g.genre === "multiplayer");
check("WF1 party filter non-empty", party.length > 0, party.map((g) => g.id).join(", "));
const skribbl = games.find((g) => g.id === "skribbl");
check("WF1 skribbl.io has private rooms", !!skribbl && /private room/i.test(skribbl.description),
  skribbl ? skribbl.description.slice(0, 60) + "…" : "missing");

// Workflow 2 (AGENT.md): "Convert my own GBA/GB/NES file to a browser game"
const template = fs.readFileSync(path.join(ROOT, "assets/vendor/template-game.html"), "utf8");
const converter = fs.readFileSync(path.join(ROOT, "assets/js/converter.js"), "utf8");
const tokens = template.match(/__BM_[A-Z0-9_]+__/g) || [];
const uniqueTokens = [...new Set(tokens)];
check("WF2 template tokens present", uniqueTokens.length === 11, uniqueTokens.join(", "));
check("WF2 converter fills every token (via ConverterCore.buildHtml)",
  ["name:", "gameId:", "buildDate:", "romSize:", "romB64:", "core:", "coreLabel:", "system:", "hint:", "compressed:", "cover:"]
    .every((f) => converter.includes(f)),
  "all 11 fields passed");
check("WF2 all five cores supported",
  ["key: 'gba'", "key: 'gb'", "key: 'nes'", "key: 'snes'", "key: 'segamd'"].every((k) =>
    fs.readFileSync(path.join(ROOT, "assets/js/converter-core.js"), "utf8").includes(k)),
  "gba/gb/nes/snes/segamd profiles");
check("WF2 BIOS-free documented",
  fs.readFileSync(path.join(ROOT, "converter.html"), "utf8").includes("No BIOS needed"),
  "per-core BIOS notes on converter.html");

// Workflow 3 (AGENT.md): "Something cozy for a rainy day"
const cols = load("api/v1/collections.json").collections;
const cozy = cols.find((c) => c.id === "rainy-day-cozy");
const byId = new Map(games.map((g) => [g.id, g]));
check("WF3 cozy collection resolves", !!cozy && cozy.game_ids.every((id) => byId.has(id)),
  cozy ? cozy.game_ids.length + " games" : "missing");

// Workflow 4 (AGENT.md): "Plan our game night" (party planner)
const vibes = { chaotic: ["arena", "drawing", "word"], competitive: ["shooter", "arena", "racing", "sports"],
  cooperative: ["coop", "board"], creative: ["drawing", "word"], chill: ["trivia", "board", "word"] };
let wf4ok = true;
const wf4detail = [];
for (const [vibe, tags] of Object.entries(vibes)) {
  const pool = games.filter((g) => (g.tags || []).includes("party") && (g.tags || []).some((t) => tags.includes(t)));
  wf4ok = wf4ok && pool.length >= 2;
  wf4detail.push(vibe + ":" + pool.length);
}
check("WF4 every vibe has a pool", wf4ok, wf4detail.join(" "));
check("WF4 aria-live summary in page",
  fs.readFileSync(path.join(ROOT, "party-planner.html"), "utf8").includes('aria-live="polite"'),
  "plan summary announced");

// Workflow 5 (AGENT.md): "Which system should I emulate?"
const packsEnv = load("api/v1/homebrew-packs.json");
const packs = packsEnv["homebrew-packs"];
check("WF5 homebrew-packs envelope shape", packsEnv.endpoint === "homebrew-packs" && Array.isArray(packs) && packsEnv.count === packs.length,
  packs ? packs.length + " packs" : "missing");
check("WF5 6 system packs with 3+ verified URLs",
  packs && packs.length === 6 && packs.every((p) => p.entries.length >= 3 && p.entries.every((e) => /^https:\/\//.test(e.url))),
  packs ? packs.map((p) => p.system_id + ":" + p.entries.length).join(" ") : "missing");
const sysSlugs = ["gba", "snes", "n64", "ps1", "genesis", "gameboy"];
const sysGuides = guides.filter((g) => /^system-guide-/.test(g.id));
check("WF5 6 per-system guide records", sysGuides.length === 6 && sysSlugs.every((s) => guides.some((g) => g.slug === s)),
  sysGuides.map((g) => g.slug).join(", "));
const coreLinks = { gba: "gba", snes: "snes", n64: "n64", ps1: "psx", genesis: "segaMD", gameboy: "gb" };
let wf5ok = true;
for (const s of sysSlugs) {
  const html = fs.readFileSync(path.join(ROOT, "guides/" + s + ".html"), "utf8");
  if (!html.includes("player.html?core=" + coreLinks[s])) { wf5ok = false; break; }
}
check("WF5 every system guide has a Player deep link", wf5ok, sysSlugs.map((s) => "?core=" + coreLinks[s]).join(" "));
check("WF5 picker quiz page exists and scores",
  fs.readFileSync(path.join(ROOT, "system-picker.html"), "utf8").includes('aria-live="polite"') &&
  fs.readFileSync(path.join(ROOT, "assets/js/system-picker.js"), "utf8").includes("ineligible"),
  "quiz with weak-device exclusions");

// Workflow 6 (AGENT.md): "Run a tournament for game night"
const tourneyHtml = fs.readFileSync(path.join(ROOT, "tournament.html"), "utf8");
const tourneyJs = fs.readFileSync(path.join(ROOT, "assets/js/tournament.js"), "utf8");
check("WF6 tournament page wires bracket logic + UI",
  tourneyHtml.includes("assets/js/bracket.js") && tourneyHtml.includes("assets/js/tournament.js") &&
  tourneyJs.includes("bm_tournament_v1"),
  "bracket.js + tournament.js + localStorage");
check("WF6 per-round game picker draws from the full catalog (party first)",
  tourneyJs.includes("api/v1/games.json") && tourneyJs.includes("indexOf('party')") &&
  tourneyJs.includes("optgroup"),
  "full catalog dropdown, party-tagged group first");
check("WF6 print + copy controls present",
  tourneyHtml.includes('id="t-print"') && tourneyHtml.includes('id="t-copy"') &&
  tourneyHtml.includes("@media print"),
  "print layout + copy-my-bracket");
check("WF6 champion banner is reduced-motion safe",
  !/animation|@keyframes|flash/i.test(tourneyHtml.split("<style>")[1].split("</style>")[0] + tourneyJs) ||
  tourneyHtml.includes("prefers-reduced-motion"),
  "no flashing, static banner");
check("WF6 party planner hands off to the tournament",
  fs.readFileSync(path.join(ROOT, "assets/js/party.js"), "utf8").includes("tournament.html?players=") &&
  tourneyJs.includes("URLSearchParams"),
  "?players=N&games=ids handoff");
check("WF6 tournament-runner skill exists",
  fs.existsSync(path.join(ROOT, "skills/tournament-runner.md")),
  "skills/tournament-runner.md");
// Bracket math itself: run the logic suite inline
const Bracket = require(path.join(ROOT, "assets/js/bracket.js"));
const t6 = Bracket.createTournament(["A", "B", "C", "D", "E", "F"]);
const r6 = Bracket.rounds(t6);
const byeM = r6[0].matches.filter((m) => m.byeAdvance);
check("WF6 6 players: 2 byes, top seeds",
  !t6.error && byeM.length === 2 &&
  JSON.stringify(Bracket.describeByes(t6)) === JSON.stringify(["A", "B"]),
  "A, B get byes");
check("WF6 sitemap lists tournament.html",
  fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>tournament.html</loc>"),
  "in sitemap");

// ---- Wave 7: Kids mode ----
const kidEnv = load("api/v1/kid-safe.json");
const kids = kidEnv["kid-safe"];
const gameIds = new Set(games.map((g) => g.id));
check("WF7 kid-safe envelope shape", kidEnv.endpoint === "kid-safe" && Array.isArray(kids) && kidEnv.count === kids.length,
  kids.length + " records");
check("WF7 index.json registers kid-safe", !!indexEnv.endpoints["kid-safe"] && indexEnv.endpoints["kid-safe"].includes("api/v1/kid-safe.json"),
  "registered in manifest");
check("WF7 every record references a real game", kids.every((k) => gameIds.has(k.id)),
  "all ids exist in games.json");
check("WF7 every flag has a basis", kids.every((k) =>
  k.kid_safe === true && k.no_chat === true &&
  ["5-7", "8-10", "11-12"].includes(k.age_band) &&
  typeof k.parent_note === "string" && k.parent_note.trim().length > 0 &&
  typeof k.audit_basis === "string" && k.audit_basis.trim().length > 0 &&
  typeof k.verify_live === "boolean"),
  "kid_safe/no_chat/age_band/parent_note/audit_basis/verify_live all present");
check("WF7 no duplicate ids", new Set(kids.map((k) => k.id)).size === kids.length, "unique");
check("WF7 band coverage", ["5-7", "8-10", "11-12"].every((b) => kids.some((k) => k.age_band === b)),
  "5-7: " + kids.filter((k) => k.age_band === "5-7").length + ", 8-10: " +
  kids.filter((k) => k.age_band === "8-10").length + ", 11-12: " +
  kids.filter((k) => k.age_band === "11-12").length);
check("WF7 excluded games are not kid-safe", !kids.some((k) => ["krunker", "happy-wheels", "skribbl", "geoguessr"].includes(k.id)),
  "chat/shooter/horror picks excluded");
check("WF7 draft-07 schema exists", fs.existsSync(path.join(ROOT, "api/v1/schema/kid-safe.schema.json")),
  "api/v1/schema/kid-safe.schema.json");
check("WF7 kids-corner-guide skill exists", fs.existsSync(path.join(ROOT, "skills/kids-corner-guide.md")),
  "skills/kids-corner-guide.md");
const kidsHtml = fs.readFileSync(path.join(ROOT, "kids.html"), "utf8");
const kidsJs = fs.readFileSync(path.join(ROOT, "assets/js/kids.js"), "utf8");
const parentsHtml = fs.readFileSync(path.join(ROOT, "parents.html"), "utf8");
check("WF7 kids page renders the catalog + reduced-motion default",
  kidsJs.includes("api/v1/kid-safe.json") && kidsHtml.includes("age-chips") &&
  kidsHtml.includes("animation: none !important"),
  "fetch + age chips + unconditional motion kill");
check("WF7 parent guide covers honesty + screen-time + save states",
  /first 10 minutes together/i.test(parentsHtml) && /screen-time/i.test(parentsHtml) &&
  /one more level/i.test(parentsHtml) && !/pediatrician|diagnos|prescrib|disorder|therapist|medical advice|AAP recommends/i.test(parentsHtml),
  "honesty policy, tips, no medical claims");
check("WF7 sitemap lists kids + parents pages",
  fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>kids.html</loc>") &&
  fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>parents.html</loc>"),
  "in sitemap");
check("WF7 llms.txt mentions kids corner + kid-safe endpoint",
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("kid-safe.json"),
  "llms.txt updated");

// ---- Wave 8: homebrew radar sweep + archive expansion ----
const collectionsEnv = load("api/v1/collections.json");
const collections = collectionsEnv.collections;
const wave8Ids = ["tristram", "die-in-the-dungeon", "trevosa", "prerolled", "zombie-nest-gba",
  "dare-to-doku", "english-brick-breaker", "math-challenge", "tank-battle", "red-alert-rts", "3d-plane-battle"];
check("WF8 wave-8 games all in api/v1/games.json",
  wave8Ids.every((id) => gameIds.has(id)), wave8Ids.length + " new games present");
const radar = collections.find((c) => c.id === "homebrew-radar");
const vanilla = collections.find((c) => c.id === "vanilla-js");
check("WF8 homebrew-radar collection (6 games, all wave-8 ids)",
  !!radar && radar.game_ids.length === 6 &&
  ["tristram", "die-in-the-dungeon", "trevosa", "prerolled", "zombie-nest-gba", "dare-to-doku"].every((id) => radar.game_ids.includes(id)),
  radar ? radar.game_ids.join(", ") : "missing");
check("WF8 vanilla-js collection (5 games, all wave-8 ids)",
  !!vanilla && vanilla.game_ids.length === 5 &&
  ["english-brick-breaker", "math-challenge", "tank-battle", "red-alert-rts", "3d-plane-battle"].every((id) => vanilla.game_ids.includes(id)),
  vanilla ? vanilla.game_ids.join(", ") : "missing");
const gbaPack = packs.find((p) => p.system_id === "gba");
check("WF8 GBA homebrew pack gained the GBA Jam 2026 entries page",
  !!gbaPack && gbaPack.entries.some((e) => e.url === "https://itch.io/jam/gbajam26/entries"),
  gbaPack ? gbaPack.entries.length + " entries" : "missing");
check("WF8 collections.html header nav has Tournament + Party planner links",
  fs.readFileSync(path.join(ROOT, "collections.html"), "utf8").includes('href="tournament.html"') &&
  /<header[\s\S]*?href="party-planner\.html"[\s\S]*?<\/header>/.test(fs.readFileSync(path.join(ROOT, "collections.html"), "utf8")),
  "wave-6 inconsistency fixed");
check("WF8 llms.txt has live counts + new collections",
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("162-game directory") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("Homebrew radar"),
  "dynamic counts in build_site.py");
check("WF8 every wave-8 game has a kids.json verdict",
  wave8Ids.every((id) => kids.some((k) => k.id === id) || load("data/kids.json").excluded.some((k) => k.id === id)),
  "6 curated + 5 excluded");

// ---- Wave 9: Player 2.1 — save slots, per-system remap, display options ----
const playerHtml = fs.readFileSync(path.join(ROOT, "player.html"), "utf8");
const playerJs = fs.readFileSync(path.join(ROOT, "assets/js/player.js"), "utf8");
const compCss = fs.readFileSync(path.join(ROOT, "assets/css/components.css"), "utf8");
check("WF9 save-slots UI (list, new-slot, autosave, dialog)",
  playerHtml.includes('id="slots-list"') && playerHtml.includes('id="slot-new"') &&
  playerHtml.includes('id="autosave-toggle"') && playerHtml.includes('id="autosave-mins"') &&
  playerHtml.includes('id="settings-dialog"') && playerHtml.includes('id="settings-btn"'),
  "slots manager + quick-settings markup");
check("WF9 per-system remap (system select, reset, storage, migration)",
  playerHtml.includes('id="remap-system"') && playerHtml.includes('id="remap-reset"') &&
  playerJs.includes('bm-remap-') && playerJs.includes('migrateLegacyRemap') &&
  playerJs.includes('applySystemRemapToEngine') && playerJs.includes('bm-last-game'),
  "per-system storage + legacy migration + last-game fallback");
check("WF9 display options (aspect select, int-scale, per-system prefs)",
  playerHtml.includes('id="disp-aspect"') && playerHtml.includes('id="disp-intscale"') &&
  playerJs.includes('bm-display-') && playerJs.includes('applyIntScale') &&
  compCss.includes('.ar-43') && compCss.includes('.ar-169') && compCss.includes('.int-scale'),
  "display prefs per system + aspect/int-scale CSS");
check("WF9 null-guard discipline intact (w3.1)",
  playerJs.includes('may not exist if the DOM changed') && /wave 3\.1 discipline/.test(playerJs),
  "veilError guard + discipline comment");
check("WF9 reduced-motion (CRT flicker gated + player chrome transition kill)",
  compCss.includes('prefers-reduced-motion: no-preference') && compCss.includes('prefers-reduced-motion: reduce'),
  "motion safety");
check("WF9 keyboard-operable remapper (Esc cancels key + pad capture)",
  (playerJs.match(/e\.key === 'Escape'/g) || []).length >= 3,
  "esc cancel paths");
check("WF9 player-guide skill documents 2.1",
  fs.readFileSync(path.join(ROOT, "skills/player-guide.md"), "utf8").includes('Player 2.1') &&
  fs.readFileSync(path.join(ROOT, "skills/player-guide.md"), "utf8").includes('bm-remap-') &&
  fs.readFileSync(path.join(ROOT, "skills/player-guide.md"), "utf8").includes('bm-display-'),
  "skill updated");
check("WF9 AGENT.md + llms.txt mention Player 2.1",
  fs.readFileSync(path.join(ROOT, "AGENT.md"), "utf8").includes('Player 2.1') &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes('Player 2.1'),
  "agentic surface current");

// ---- Wave 10: Tournament 2.0 — double elim, seeding UI, voting, history/undo, share links ----
const BracketDouble = require(path.join(ROOT, "assets/js/bracket-double.js"));
const t10 = BracketDouble.createTournamentDouble(["A", "B", "C", "D"]);
check("WF10 bracket-double module loads (UMD, node)",
  !t10.error && t10.version === 2 && typeof BracketDouble.recordLosersWin === "function" &&
  typeof BracketDouble.recordGrandWin === "function" && typeof BracketDouble.encodeShare === "function" &&
  typeof BracketDouble.decodeShare === "function",
  "double-elim logic module");
check("WF10 double-elim inline fixture (reset path)",
  (() => {
    const t = BracketDouble.createTournamentDouble(["A", "B", "C", "D"]);
    BracketDouble.recordWinnersWin(t, 0, 0, "a");
    BracketDouble.recordWinnersWin(t, 0, 1, "b");
    BracketDouble.recordLosersWin(t, 0, 0, "a");
    BracketDouble.recordWinnersWin(t, 1, 0, "b");
    BracketDouble.recordLosersWin(t, 1, 0, "b");
    BracketDouble.recordGrandWin(t, 0, "b"); // losers champ wins -> reset
    if (!BracketDouble.grandFinalInfo(t).needsReset) { return false; }
    BracketDouble.recordGrandWin(t, 1, "a");
    const c = BracketDouble.champion(t);
    return !!c && c.name === "C";
  })(),
  "4-player pinned run ends with champion C");
check("WF10 share validation rejects tampering",
  !BracketDouble.decodeShare("!!!").ok &&
  BracketDouble.decodeShare(BracketDouble.encodeShare(t10)).ok,
  "encode/decode round-trip + rejection");
check("WF10 tournament.html has 2.0 controls",
  tourneyHtml.includes('name="t-format"') && tourneyHtml.includes('id="t-seed-list"') &&
  tourneyHtml.includes('id="t-seed-random"') && tourneyHtml.includes('id="t-history-list"') &&
  tourneyHtml.includes('id="t-undo"') && tourneyHtml.includes('id="t-sharelink"') &&
  tourneyHtml.includes("assets/js/bracket-double.js"),
  "format radios, seeding, history, undo, share link");
check("WF10 tournament.js wires double elim + voting + undo",
  tourneyJs.includes("bm_tournament_v2") && tourneyJs.includes("BracketDouble") &&
  tourneyJs.includes("t-vote-panel") && tourneyJs.includes("undoStack") &&
  tourneyJs.includes("initFromHash"),
  "v2 storage, vote UI, undo stack, hash import");
check("WF10 logic + UI test suites exist",
  fs.existsSync(path.join(ROOT, "scripts/test_bracket_double.js")) &&
  fs.existsSync(path.join(ROOT, "scripts/test_tournament10.js")),
  "test_bracket_double.js + test_tournament10.js");
check("WF10 AGENT.md + llms.txt mention double elimination",
  fs.readFileSync(path.join(ROOT, "AGENT.md"), "utf8").includes("double-elimination") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("double-elimination"),
  "agentic surface current");
check("WF10 tournament-runner skill documents 2.0",
  (() => {
    const s = fs.readFileSync(path.join(ROOT, "skills/tournament-runner.md"), "utf8");
    return s.includes("double elimination") && s.includes("bracket reset") &&
      s.includes("Copy share link") && s.includes("Undo last result");
  })(),
  "skill updated");
check("WF10 build_site tournament blurb is 2.0",
  fs.readFileSync(path.join(ROOT, "scripts/build_site.py"), "utf8").includes("Tournament brackets 2.0"),
  "llms.txt source updated");

// ---- Wave 11: Party Planner 2.0 — guests, voting, rotation, timeline, share, kids mode ----
const Party2 = require(path.join(ROOT, "assets/js/party2.js"));
const partyHtml = fs.readFileSync(path.join(ROOT, "party-planner.html"), "utf8");
const partyJs = fs.readFileSync(path.join(ROOT, "assets/js/party.js"), "utf8");
const w11party = Party2.createParty(["Ana", "Ben", "Cara"], { format: "double" }, ["skribbl", "bonk", "gartic-phone"]);
check("WF11 party2 module loads (UMD, node)",
  !w11party.error && w11party.version === 1 && typeof Party2.tally === "function" &&
  typeof Party2.scheduleRotation === "function" && typeof Party2.buildTimeline === "function" &&
  typeof Party2.encodeShare === "function" && typeof Party2.decodeShare === "function",
  "party 2.0 logic module");
check("WF11 voting: tie goes to earliest pick, re-vote moves",
  (() => {
    const s = Party2.createParty(["A", "B", "C"], {}, ["g1", "g2"]);
    Party2.addVote(s, "A", "g2"); Party2.addVote(s, "B", "g1"); // 1-1 tie
    if (Party2.topVoted(s, 2)[0] !== "g1") return false;        // g1 picked first
    Party2.addVote(s, "A", "g1");                              // A re-votes
    return Party2.tally(s)[0].gameId === "g1" && Party2.tally(s)[0].count === 2;
  })(), "tie-break + re-vote pinned fixture");
check("WF11 rotation: 5 guests / 5 slots -> everyone sits exactly once",
  (() => {
    const g = ["A", "B", "C", "D", "E"];
    const rot = Party2.scheduleRotation(g, g.map(() => ({ hotseat: true })));
    const sits = {};
    rot.forEach((r) => r.sits.forEach((x) => { sits[x] = (sits[x] || 0) + 1; }));
    return g.every((x) => sits[x] === 1);
  })(), "fair sit-out rotation");
check("WF11 timeline: setup -> games -> snack -> tournament -> free play",
  (() => {
    const tl = Party2.buildTimeline({ startClock: "19:00", snackMin: 15 },
      [{ gameId: "g1", title: "G", start: 0, end: 20 }], 0);
    return tl.phases.map((p) => p.phase).join(",") === "setup,game,snack,tournament,freeplay" &&
      tl.phases[0].clockStart === "6:30 PM";
  })(), "phase order + wall clock");
check("WF11 share validation rejects tampering",
  !Party2.decodeShare("!!!").ok && !Party2.decodeShare(
    Buffer.from(JSON.stringify({ v: 99, guests: ["A", "B"], games: ["g1"] })).toString("base64url")).ok &&
    Party2.decodeShare(Party2.encodeShare(w11party)).ok,
  "round-trip + version gate");
check("WF11 kids pool stays inside the 75 curated kid-safe ids",
  (() => {
    const kidSafe = load("api/v1/kid-safe.json")["kid-safe"];
    const pool = Party2.kidPool(kidSafe, "8-10");
    const set = new Set(kidSafe.map((r) => r.id));
    return pool.length > 0 && pool.length <= kidSafe.length && pool.every((id) => set.has(id));
  })(), "kid-safe subset");
check("WF11 party-planner.html has 2.0 controls",
  partyHtml.includes('id="pp-guests-list"') && partyHtml.includes('id="pp-kids"') &&
  partyHtml.includes('id="pp-start"') && partyHtml.includes('id="pp-format"') &&
  partyHtml.includes("assets/js/party2.js"),
  "guests, kids toggle, start time, format, party2.js");
check("WF11 party.js wires voting + timeline + share + timer + handoff 2.0",
  partyJs.includes("pp-vote-cast") && partyJs.includes("buildTimeline") &&
  partyJs.includes("#p=") && partyJs.includes("'pp-timer-'") &&
  partyJs.includes("&names=") && partyJs.includes("&format="),
  "vote UI, timeline, share links, snack timer, names handoff");
check("WF11 tournament.js accepts the names= handoff",
  tourneyJs.includes("q.get('names')") && tourneyJs.includes("handoffParams = true;"),
  "?names= pre-fills real guest names");
check("WF11 logic + UI test suites exist",
  fs.existsSync(path.join(ROOT, "scripts/test_party11.js")) &&
  fs.existsSync(path.join(ROOT, "scripts/test_party_planner11.js")),
  "test_party11.js + test_party_planner11.js");
check("WF11 party-planner-runner skill documents 2.0",
  (() => {
    const s = fs.readFileSync(path.join(ROOT, "skills/party-planner-runner.md"), "utf8");
    return s.includes("one vote per guest") && s.includes("kid-safe") && s.includes("#p=") &&
      s.includes("names=");
  })(), "skill updated");
check("WF11 AGENT.md + llms.txt mention Party Planner 2.0",
  fs.readFileSync(path.join(ROOT, "AGENT.md"), "utf8").includes("Party Planner 2.0") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("Party planner 2.0"),
  "agentic surface current");

// Workflow 12 (AGENT.md): Converter 3.0 — batch conversion, compression, validation
const convCore = require("../assets/js/converter-core.js");
const convHtml = fs.readFileSync(path.join(ROOT, "converter.html"), "utf8");
const convUiJs = fs.readFileSync(path.join(ROOT, "assets/js/converter.js"), "utf8");
const convTemplate = fs.readFileSync(path.join(ROOT, "assets/vendor/template-game.html"), "utf8");
check("WF12 converter-core loads (UMD, node)",
  convCore.VERSION === "3.0" && Object.keys(convCore.PROFILES).length === 5, "v3.0, 5 profiles");
check("WF12 format detection: 8 extensions, rejects others",
  ["a.gba", "b.gb", "c.gbc", "d.nes", "e.sfc", "f.smc", "g.md", "h.gen"].every((n) => convCore.profileFor(n)) &&
  ["i.zip", "j.smd", "k.bin", "l.iso"].every((n) => !convCore.profileFor(n)), "gba/gb/gbc/nes/sfc/smc/md/gen only");
check("WF12 validation: real homebrew warns, never errors",
  (() => {
    const b = new Uint8Array(fs.readFileSync(path.join(ROOT, "tests/homebrew-test-roms/rkanoid-latest-demo.gba")));
    const v = convCore.validateRom(b, "gba");
    return v.errors.length === 0 && v.warnings.length > 0;
  })(), "rkanoid zeroed header -> warning");
check("WF12 validation: bad NES refused",
  convCore.validateRom(new Uint8Array([1, 2, 3, 4]), "nes").errors.length > 0, "missing magic");
check("WF12 token contract: 11 tokens, all replaced",
  convCore.TOKENS.length === 11 &&
  convCore.TOKENS.every((t) => convTemplate.includes(t)) &&
  !/__BM_[A-Z0-9_]+__/.test(convCore.buildHtml(convTemplate, {
    name: "t", gameId: "g", buildDate: "d", romSize: "s", romB64: "QUJD",
    core: "gba", coreLabel: "mGBA core", system: "Game Boy Advance",
    hint: "h", compressed: "1", cover: ""
  })), "template + assembly agree");
check("WF12 pako vendored for compression",
  fs.existsSync(path.join(ROOT, "assets/vendor/pako.min.js")) &&
  convHtml.includes("assets/vendor/pako.min.js"), "local, no new CDN dep");
check("WF12 output boots compressed builds + links Player",
  convTemplate.includes("DecompressionStream") && convTemplate.includes("player.html?core=__BM_CORE__") &&
  convTemplate.includes("__BM_COVER__"), "inflate path, deep link, cover token");
check("WF12 batch UI present",
  ["conv-queue", "conv-cancel", "conv-download-all", "conv-cover", "conv-status", 'value="best"']
    .every((s) => convHtml.includes(s)) && convHtml.includes('multiple'), "queue, cancel, cover, radios, multi");
check("WF12 error isolation + cancel in UI layer",
  convUiJs.includes("processQueue") && convUiJs.includes("cancelFlag"), "sequential runner, cancel");
check("WF12 converter12 test suite exists",
  fs.existsSync(path.join(ROOT, "scripts/test_converter12.js")), "pinned fixtures");
check("WF12 converter skill documents 3.0",
  (() => {
    const s = fs.readFileSync(path.join(ROOT, "skills/converter-multi-system.md"), "utf8");
    return s.includes("3.0") && s.includes("batch") && s.includes("compression") && s.includes("11 tokens");
  })(), "skill current");
check("WF12 AGENT.md + llms.txt mention Converter 3.0",
  fs.readFileSync(path.join(ROOT, "AGENT.md"), "utf8").includes("Converter 3.0") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("Converter 3.0"),
  "agentic surface current");

// Wave 13: deep-dive guides knowledge hub
const w13Slugs = ["homebrew-development", "netplay", "save-workflows",
  "crt-shaders-display", "accessibility-in-retro-gaming", "preserving-your-games"];
check("WF13 guides count 20 (14 + 6 new)",
  guides.length === 20, guides.length + " guides");
check("WF13 all 6 new guides in api/v1/guides.json",
  w13Slugs.every((s) => guides.some((g) => g.slug === s)), w13Slugs.join(", "));
check("WF13 new guide pages exist + load TOC spy script + progress bar",
  w13Slugs.every((s) => {
    const p = path.join(ROOT, "guides", s + ".html");
    if (!fs.existsSync(p)) return false;
    const h = fs.readFileSync(p, "utf8");
    return h.includes('data-spy') && h.includes('reading-progress') &&
      h.includes('assets/js/guide-toc.js') && h.includes('aria-current="page"') &&
      h.includes('<ol>') && (h.match(/<section class="guide-section"/g) || []).length >= 6;
  }), "breadcrumb trail, sticky spy TOC, progress bar, 6+ sections each");
check("WF13 new guides in sitemap.xml",
  (() => {
    const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
    return w13Slugs.every((s) => sm.includes(`<loc>guides/${s}.html</loc>`));
  })(), "6 loc entries");
check("WF13 new guides in llms.txt + emulation hub deep-dives section",
  w13Slugs.every((s) => fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes(s)) &&
    fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes('id="deep-dives"') &&
    w13Slugs.every((s2) => fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes(`guides/${s2}.html`)),
  "llms.txt + hub cards");
check("WF13 guide-toc.js is dependency-free + null-safe",
  (() => {
    const j = fs.readFileSync(path.join(ROOT, "assets/js/guide-toc.js"), "utf8");
    return !/require\(|import /.test(j) && j.includes("IntersectionObserver") &&
      j.includes('querySelector("[data-spy]")');
  })(), "UMD-free IIFE, guards");
check("WF13 cross-linking: new guides link each other + hub",
  (() => {
    const links = { "homebrew-development": ["preserving-your-games", "homebrew-and-public-domain"],
      "netplay": ["save-workflows", "retroarch-setup"], "save-workflows": ["preserving-your-games", "netplay"],
      "crt-shaders-display": ["accessibility-in-retro-gaming", "save-workflows"],
      "accessibility-in-retro-gaming": ["crt-shaders-display", "netplay"],
      "preserving-your-games": ["save-workflows", "homebrew-development"] };
    return Object.entries(links).every(([s, targets]) => {
      const h = fs.readFileSync(path.join(ROOT, "guides", s + ".html"), "utf8");
      return targets.every((t) => h.includes(`${t}.html`));
    });
  })(), "sibling deep links");
check("WF13 design CSS: progress bar + sticky TOC + view-transition present",
  (() => {
    const c = fs.readFileSync(path.join(ROOT, "assets/css/guides.css"), "utf8");
    return c.includes("animation-timeline: scroll()") && c.includes(".toc--sticky") &&
      c.includes("@view-transition") && c.includes("prefers-reduced-motion: no-preference") &&
      c.includes("@media print");
  })(), "scroll chrome, motion-safe VT, print");

// ---- Wave 14: games catalog expansion (37 new, 162 total) ----
const wave14Ids = ["evolution-of-trust", "better-ballot", "parable-of-polygons", "wisdom-madness-crowds",
  "sight-and-light", "bitburner", "mindustry", "shapez", "dcss-webtiles", "angband-live", "nethack-web",
  "spelunky-classic", "powder-game", "stick-ranger", "flexbox-froggy", "grid-garden", "codingame",
  "codecombat", "vampire-survivors", "doing-work", "chogue", "absurdle", "semantle", "waffle",
  "contexto", "bandle", "pointer-pointer", "hacker-typer", "doom-1993", "oregon-trail", "prince-of-persia",
  "wolfenstein-3d", "recoil-foundry", "hatchstead", "floodlines", "hydro-operator", "skystack"];
check("WF14 games count 162 (125 + 37 new)",
  games.length === 162, games.length + " games");
check("WF14 all 37 wave-14 games in api/v1/games.json",
  wave14Ids.every((id) => gameIds.has(id)), wave14Ids.length + " new games present");
check("WF14 new game records complete (https url, genre, controls, description)",
  wave14Ids.every((id) => {
    const g = byId.get(id);
    return g && g.url.startsWith("https://") && g.genre && g.controls && g.description && g.title;
  }), "all fields non-empty");
check("WF14 genre totals after expansion",
  (() => {
    const want = { puzzle: 45, action: 30, roguelike: 15, idle: 12, multiplayer: 25, retro: 13, horror: 6, cozy: 16 };
    return Object.entries(want).every(([gr, n]) => games.filter((g) => g.genre === gr).length === n);
  })(), "p45/a30/r15/i12/m25/re13/h6/c16");
const newCols = {
  "playable-essays": ["evolution-of-trust", "better-ballot", "parable-of-polygons", "wisdom-madness-crowds", "sight-and-light", "doing-work", "chogue"],
  "open-source-web": ["bitburner", "mindustry", "shapez", "dcss-webtiles", "angband-live", "nethack-web"],
  "code-playground": ["flexbox-froggy", "grid-garden", "codingame", "codecombat", "hacker-typer"],
  "daily-word-games": ["absurdle", "semantle", "waffle", "contexto", "bandle"],
  "cozy-toys": ["hatchstead", "powder-game", "pointer-pointer", "doing-work"],
  "roguelike-forever": ["dcss-webtiles", "angband-live", "nethack-web", "spelunky-classic", "vampire-survivors", "chogue"],
};
check("WF14 19 collections (13 + 6 new)",
  collections.length === 19, collections.length + " collections");
check("WF14 new collections exact contents",
  Object.entries(newCols).every(([cid, ids]) => {
    const c = collections.find((x) => x.id === cid);
    return !!c && c.game_ids.length === ids.length && ids.every((id) => c.game_ids.includes(id));
  }), Object.keys(newCols).join(", "));
check("WF14 every wave-14 game has a kids.json verdict",
  wave14Ids.every((id) => kids.some((k) => k.id === id) || load("data/kids.json").excluded.some((k) => k.id === id)),
  "25 curated + 12 excluded");
check("WF14 llms.txt mentions new collections",
  ["Playable essays", "Open source, zero install", "Roguelikes, forever"].every((t) =>
    fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes(t)),
  "new shelf titles in llms.txt");
check("WF14 dropped candidates stayed out (unverifiable URLs never shipped)",
  ["freeciv-web", "ztype", "sinuous", "gridland", "sql-murder-mystery", "css-diner",
   "spaceteam", "shattered-pixel-dungeon", "artist-is-present", "redactle",
   "spend-bill-gates-money", "design-next-iphone"].every((id) => !gameIds.has(id)),
  "12 rejected, 0 in catalog");

// Workflow 15 (wave 15): "The Arcade" identity system
const tokens15 = fs.readFileSync(path.join(ROOT, "assets/css/tokens.css"), "utf8");
const base15 = fs.readFileSync(path.join(ROOT, "assets/css/base.css"), "utf8");
const layout15 = fs.readFileSync(path.join(ROOT, "assets/css/layout.css"), "utf8");
const comp15 = compCss;
const guides15 = fs.readFileSync(path.join(ROOT, "assets/css/guides.css"), "utf8");
const arcadeJs = fs.readFileSync(path.join(ROOT, "assets/js/arcade.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const gamesHtml = fs.readFileSync(path.join(ROOT, "games.html"), "utf8");
const woff2magic = (p) => fs.readFileSync(path.join(ROOT, p)).subarray(0, 4).toString("hex") === "774f4632";
check("WF15 self-hosted fonts vendored (valid WOFF2)",
  ["assets/fonts/press-start-2p-latin.woff2", "assets/fonts/vt323-latin.woff2",
   "assets/fonts/space-grotesk-latin.woff2"].every(woff2magic),
  "press-start-2p / vt323 / space-grotesk");
check("WF15 @font-face wired in tokens.css",
  ["Press Start 2P", "VT323", "Space Grotesk"].every((f) => tokens15.includes('font-family: "' + f + '"')),
  "display + readout + body faces");
check("WF15 motion tokens defined",
  ["--dur-fast", "--dur-base", "--dur-moderate", "--dur-slow",
   "--ease-standard", "--ease-decelerate", "--ease-accelerate"].every((t) => tokens15.includes(t)),
  "5 durations + named easings");
check("WF15 texture tokens defined",
  ["--scanlines", "--grille", "--side-art", "--bulb", "--chase-period", "--chase-dur"]
    .every((t) => tokens15.includes(t)),
  "scanlines/grille/side-art/bulb/chase");
check("WF15 chase-light keyframes in layout.css",
  layout15.includes("@keyframes chase-x") && layout15.includes(".site-header::after") &&
  layout15.includes("prefers-reduced-motion: no-preference"),
  "header chase, motion-gated");
check("WF15 coin-slot CTA in components.css",
  comp15.includes(".btn-primary::after") && comp15.includes(".coin-plate-cta") &&
  comp15.includes(".kid-badge"),
  "coin slot, coin plate, kid badge");
check("WF15 arcade.js contracts",
  arcadeJs.includes("bm-fx") && arcadeJs.includes("attract") &&
  arcadeJs.includes("kid-safe.json") && arcadeJs.includes("kidSafeReady"),
  "FX toggle + attract + ticker + kid-safe");
check("WF15 arcade.js on in-scope pages",
  ["index.html", "games.html", "player.html", "converter.html"]
    .every((p) => fs.readFileSync(path.join(ROOT, p), "utf8").includes("assets/js/arcade.js")) &&
  fs.readdirSync(path.join(ROOT, "guides")).filter((f) => f.endsWith(".html"))
    .every((f) => fs.readFileSync(path.join(ROOT, "guides", f), "utf8").includes("assets/js/arcade.js")),
  "home + games + player + converter + 20 guides");
check("WF15 stale counts fixed (89 -> 162)",
  !indexHtml.includes("89 CURATED") && !indexHtml.includes("89 curated") &&
  gamesHtml.includes("162 games."),
  "marquee + meta + directory hero");
check("WF15 guides template arcade treatment",
  guides15.includes("chase-x") && guides15.includes(".guide-page h1::before") &&
  guides15.includes("border-image"),
  "marquee h1, chase bulbs, side-art dividers");
check("WF15 custom 404 exists",
  fs.existsSync(path.join(ROOT, "404.html")) &&
  fs.readFileSync(path.join(ROOT, "404.html"), "utf8").includes("GAME OVER"),
  "arcade 404 with insert-coin CTA");
check("WF15 reduced-motion + FX-off kills",
  base15.includes("html.fx-off") && comp15.includes("html:not(.fx-off)") &&
  base15.includes("@media (prefers-reduced-motion: reduce)"),
  "sensory envelope + reduced motion");

// ---- Wave 16: "The Arcade" identity wave 2 ----
const dirJs = fs.readFileSync(path.join(ROOT, "assets/js/directory.js"), "utf8");
const w16css = fs.readFileSync(path.join(ROOT, "assets/css/wave16.css"), "utf8");
const collHtml = fs.readFileSync(path.join(ROOT, "collections.html"), "utf8");
const allHtml = ["index.html", "games.html", "collections.html", "404.html"]
  .concat(fs.readdirSync(ROOT).filter((f) => f.endsWith(".html") && !["index.html", "games.html", "collections.html", "404.html"].includes(f)))
  .concat(fs.readdirSync(path.join(ROOT, "guides")).filter((f) => f.endsWith(".html")).map((f) => "guides/" + f))
  .concat(fs.readdirSync(path.join(ROOT, "genres")).filter((f) => f.endsWith(".html")).map((f) => "genres/" + f));
const arcadeRef = (p) => {
  const h = fs.readFileSync(path.join(ROOT, p), "utf8");
  return h.includes("assets/js/arcade.js");
};
check("WF16 URL-synced filters: replaceState + q/genre/tags/favs params",
  dirJs.includes("history.replaceState") && dirJs.includes("URLSearchParams") &&
  ["p.set('q'", "p.set('genre'", "p.set('tags'", "p.set('favs'"].every((s) => dirJs.includes(s)),
  "?q=&genre=&tags=a,b&favs=1, replaceState (no history spam)");
check("WF16 filter state restored from URL on load (validated)",
  dirJs.includes("readURLState") && dirJs.includes("knownGenres.indexOf(g)") &&
  dirJs.includes("knownTags.indexOf(x)") && dirJs.includes("searchInput.value = state.q"),
  "genre/tag validated against catalog, controls pre-set");
check("WF16 tag filter chips built from data with counts",
  gamesHtml.includes('id="tag-chips"') && dirJs.includes("tagCounts") &&
  dirJs.includes("tag-token") && dirJs.includes("tok-n") &&
  dirJs.includes("state.tags.every"),
  "11 tag tokens, counts, multi-select AND semantics");
check("WF16 search matches tags as well as titles/descriptions",
  dirJs.includes("(g.tags || []).join(' ')") && dirJs.includes("tag-hits"),
  "tag haystack + matched-tag strip");
check("WF16 matched-tag strip toggles the tag filter",
  dirJs.includes("renderTagHits") && dirJs.includes("tag-hits-label") &&
  dirJs.includes("Toggle the ' + t + ' tag filter"),
  "visible match chips, one click filters");
check("WF16 copy-view-link button shares the filtered URL",
  gamesHtml.includes('id="copy-view"') && dirJs.includes("clipboard.writeText") &&
  dirJs.includes("location.href"),
  "copies the shareable ?q=&genre=&tags= URL");
check("WF16 card tooltips: Popover + position-anchor contract",
  arcadeJs.includes('tip.setAttribute("popover", "manual")') &&
  arcadeJs.includes("anchor-name") && arcadeJs.includes("position-anchor") &&
  arcadeJs.includes("showPopover") && arcadeJs.includes("positionFallback") &&
  arcadeJs.includes("no-anchor") && arcadeJs.includes("tip-trigger"),
  "manual popover, per-card anchor, fixed-rect fallback");
check("WF16 tooltip CSS: anchored + fallback paths",
  w16css.includes(".card-tip") && w16css.includes(".tip-trigger") &&
  w16css.includes("html.anchor-ok .card-tip") &&
  w16css.includes("position-area: bottom") &&
  w16css.includes("html.no-anchor .card-tip") &&
  w16css.includes("html.no-popover .card-tip"),
  "anchor-ok / no-anchor / no-popover rules");
check("WF16 entrance choreography gated on motion prefs + FX",
  w16css.includes("@keyframes hero-in") && w16css.includes("@keyframes card-in") &&
  w16css.includes("html:not(.fx-off) .hero-inner > *") &&
  w16css.includes("html:not(.fx-off) #games-grid.enter .game-card") &&
  w16css.includes("prefers-reduced-motion: no-preference") &&
  dirJs.includes("grid.classList.add('enter')"),
  "hero cascade + staggered card power-on, first paint only");
check("WF16 custom empty states",
  dirJs.includes("NO GAMES ON THIS CHANNEL") && dirJs.includes("clear-filters") &&
  dirJs.includes("empty-cabinet") && collHtml.includes("SHELVES OFFLINE"),
  "unlit-cabinet no-results + retry states");
check("WF16 collections: shelf anchors + jump nav + hash scroll",
  collHtml.includes('id="shelf-jump"') && collHtml.includes("'shelf-' + c.id") &&
  collHtml.includes("scrollIntoView") && collHtml.includes("Copy shelf link") &&
  w16css.includes(".shelf-jump") && w16css.includes("scroll-margin-top"),
  "19 jump links, deep-link scroll, per-shelf copy");
check("WF16 arcade.js on every page",
  allHtml.every(arcadeRef),
  allHtml.length + " pages carry the FX toggle + attract + tooltips");
check("WF16 coin-plate kick on every footer",
  allHtml.every((p) => fs.readFileSync(path.join(ROOT, p), "utf8").includes("coin-plate")),
  "kick-plate rhythm site-wide");

process.exit(failures ? 1 : 0);
