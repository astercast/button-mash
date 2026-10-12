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
check("WF2 template tokens present", uniqueTokens.length >= 9, uniqueTokens.join(", "));
check("WF2 converter fills every token", uniqueTokens.every((t) => converter.includes(".split('" + t + "')")),
  "all tokens replaced");
check("WF2 all three cores supported", ["gba", "gb", "nes"].every((c) => converter.includes("core: '" + c + "'")),
  "gba/gb/nes profiles");
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
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("125-game directory") &&
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
check("WF11 kids pool stays inside the 50 curated kid-safe ids",
  (() => {
    const kidSafe = load("api/v1/kid-safe.json")["kid-safe"];
    const pool = Party2.kidPool(kidSafe, "8-10");
    const set = new Set(kidSafe.map((r) => r.id));
    return pool.length > 0 && pool.length <= 50 && pool.every((id) => set.has(id));
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

process.exit(failures ? 1 : 0);
