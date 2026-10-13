/* Wave 3 validation: executes the AGENT.md example workflows against the real
   local data/v1 JSON files plus the Converter v2 token contract.
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

const gamesEnv = load("data/v1/games.json");
const guidesEnv = load("data/v1/guides.json");
const indexEnv = load("data/v1/index.json");
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
const cols = load("data/v1/collections.json").collections;
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
const packsEnv = load("data/v1/homebrew-packs.json");
const packs = packsEnv["homebrew-packs"];
check("WF5 homebrew-packs envelope shape", packsEnv.endpoint === "homebrew-packs" && Array.isArray(packs) && packsEnv.count === packs.length,
  packs ? packs.length + " packs" : "missing");
check("WF5 7 system packs with 3+ verified URLs",
  packs && packs.length === 7 && packs.every((p) => p.entries.length >= 3 && p.entries.every((e) => /^https:\/\//.test(e.url))),
  packs ? packs.map((p) => p.system_id + ":" + p.entries.length).join(" ") : "missing");
const sysSlugs = ["gba", "snes", "nes", "n64", "ps1", "genesis", "gameboy"];
const sysGuides = guides.filter((g) => /^system-guide-/.test(g.id));
check("WF5 7 per-system guide records", sysGuides.length === 7 && sysSlugs.every((s) => guides.some((g) => g.slug === s)),
  sysGuides.map((g) => g.slug).join(", "));
const coreLinks = { gba: "gba", snes: "snes", nes: "nes", n64: "n64", ps1: "psx", genesis: "segaMD", gameboy: "gb" };
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
  tourneyJs.includes("data/v1/games.json") && tourneyJs.includes("indexOf('party')") &&
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
const kidEnv = load("data/v1/kid-safe.json");
const kids = kidEnv["kid-safe"];
const gameIds = new Set(games.map((g) => g.id));
check("WF7 kid-safe envelope shape", kidEnv.endpoint === "kid-safe" && Array.isArray(kids) && kidEnv.count === kids.length,
  kids.length + " records");
check("WF7 index.json registers kid-safe", !!indexEnv.endpoints["kid-safe"] && indexEnv.endpoints["kid-safe"].includes("data/v1/kid-safe.json"),
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
check("WF7 draft-07 schema exists", fs.existsSync(path.join(ROOT, "data/v1/schema/kid-safe.schema.json")),
  "data/v1/schema/kid-safe.schema.json");
check("WF7 kids-corner-guide skill exists", fs.existsSync(path.join(ROOT, "skills/kids-corner-guide.md")),
  "skills/kids-corner-guide.md");
const kidsHtml = fs.readFileSync(path.join(ROOT, "kids.html"), "utf8");
const kidsJs = fs.readFileSync(path.join(ROOT, "assets/js/kids.js"), "utf8");
const parentsHtml = fs.readFileSync(path.join(ROOT, "parents.html"), "utf8");
check("WF7 kids page renders the catalog + reduced-motion default",
  kidsJs.includes("data/v1/kid-safe.json") && kidsHtml.includes("age-chips") &&
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
const collectionsEnv = load("data/v1/collections.json");
const collections = collectionsEnv.collections;
const wave8Ids = ["tristram", "die-in-the-dungeon", "trevosa", "prerolled", "zombie-nest-gba",
  "dare-to-doku", "english-brick-breaker", "math-challenge", "tank-battle", "red-alert-rts", "3d-plane-battle"];
check("WF8 wave-8 games all in data/v1/games.json",
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
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("213-game directory") &&
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
check("WF11 kids pool stays inside the 113 curated kid-safe ids",
  (() => {
    const kidSafe = load("data/v1/kid-safe.json")["kid-safe"];
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
check("WF13 guides count 24 (23 + cheat-codes, wave 25)",
  guides.length === 24, guides.length + " guides");
check("WF13 all 6 new guides in data/v1/guides.json",
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
check("WF14 games count 213 (162 + 51 new)",
  games.length === 213, games.length + " games");
check("WF14 all 37 wave-14 games in data/v1/games.json",
  wave14Ids.every((id) => gameIds.has(id)), wave14Ids.length + " new games present");
check("WF14 new game records complete (https url, genre, controls, description)",
  wave14Ids.every((id) => {
    const g = byId.get(id);
    return g && g.url.startsWith("https://") && g.genre && g.controls && g.description && g.title;
  }), "all fields non-empty");
check("WF14 genre totals after expansion (wave-24 reshelve: 3 PICO-8 games out of roguelike)",
  (() => {
    const want = { puzzle: 48, action: 41, roguelike: 12, idle: 15, multiplayer: 31, retro: 44, horror: 6, cozy: 16 };
    return Object.entries(want).every(([gr, n]) => games.filter((g) => g.genre === gr).length === n);
  })(), "p48/a41/r12/i15/m31/re44/h6/c16");
const newCols = {
  "playable-essays": ["evolution-of-trust", "better-ballot", "parable-of-polygons", "wisdom-madness-crowds", "sight-and-light", "doing-work", "chogue"],
  "open-source-web": ["bitburner", "mindustry", "shapez", "dcss-webtiles", "angband-live", "nethack-web"],
  "code-playground": ["flexbox-froggy", "grid-garden", "codingame", "codecombat", "hacker-typer"],
  "daily-word-games": ["absurdle", "semantle", "waffle", "contexto", "bandle"],
  "cozy-toys": ["hatchstead", "powder-game", "pointer-pointer", "doing-work"],
  "roguelike-forever": ["dcss-webtiles", "angband-live", "nethack-web", "spelunky-classic", "vampire-survivors", "chogue"],
};
check("WF14 22 collections (19 + 3 new, +2 makeover = 24)",
  collections.length === 24, collections.length + " collections");
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
check("WF15 stale counts fixed (89 -> data-driven, static fallback = live count)",
  !indexHtml.includes("89 CURATED") && !indexHtml.includes("89 curated") &&
  gamesHtml.includes('id="games-hero-count"') &&
  gamesHtml.includes(">213 games.<") &&
  fs.readFileSync(path.join(ROOT, "assets/js/directory.js"), "utf8").includes("games-hero-count"),
  "directory hero count data-driven, static fallback = live 213");
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
const collJs = fs.readFileSync(path.join(ROOT, "assets/js/collections.js"), "utf8");
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
  dirJs.includes("empty-cabinet") && collJs.includes("SHELVES OFFLINE"),
  "unlit-cabinet no-results + retry states");
check("WF16 collections: shelf anchors + jump nav + hash scroll",
  collHtml.includes('id="shelf-jump"') && collJs.includes("'shelf-' + c.id") &&
  collJs.includes("scrollIntoView") && collJs.includes("Copy shelf link") &&
  w16css.includes(".shelf-jump") && w16css.includes("scroll-margin-top"),
  "19 jump links, deep-link scroll, per-shelf copy");
check("WF16 arcade.js on every page",
  allHtml.every(arcadeRef),
  allHtml.length + " pages carry the FX toggle + attract + tooltips");
check("WF16 coin-plate kick on every footer",
  allHtml.every((p) => fs.readFileSync(path.join(ROOT, p), "utf8").includes("coin-plate")),
  "kick-plate rhythm site-wide");


// ---- Wave 17: catalog expansion (51 new, 213 total) + 3 collections + 2 guides ----
const wave17Ids = ["simcity-1989", "lemmings-1991", "monkey-island", "duke3d-shareware",
  "zork1", "civ1", "alone-dark", "transport-tycoon", "theme-park", "master-of-orion",
  "railroad-tycoon", "quake-shareware", "simcity-2000", "oregon-trail-deluxe",
  "commander-keen3", "keen-dreams", "space-invaders", "dig-dug", "joust", "centipede",
  "missile-command", "defender", "qbert", "tempest", "robotron", "1942", "galaga88",
  "pac-gal-20th", "bubble-bobble-2", "sfa2", "congo-bongo", "fancy-pants-1",
  "alien-hominid-flash", "dad-n-me", "achievement-unlocked", "time-fcuk", "run-3",
  "subway-surfers", "stickman-hook", "arras-io", "hole-io", "tanki", "mope-io",
  "yohoho-io", "stumble-guys", "classicube", "synergism", "realm-grinder",
  "adventure-capitalist", "tatham-puzzles", "sort-the-court"];
check("WF17 all 51 wave-17 games in data/v1/games.json",
  wave17Ids.every((id) => gameIds.has(id)), wave17Ids.length + " new games present");
check("WF17 new game records complete (https url, genre, controls, description)",
  wave17Ids.every((id) => {
    const g = byId.get(id);
    return g && g.url.startsWith("https://") && g.genre && g.controls && g.description && g.title;
  }), "all fields non-empty");
const newCols17 = {
  "flash-back-machine": ["fancy-pants-1", "alien-hominid-flash", "dad-n-me", "time-fcuk",
    "achievement-unlocked", "canabalt", "line-rider", "happy-wheels", "qwop"],
  "score-attack": ["space-invaders", "galaga88", "dig-dug", "centipede", "missile-command",
    "defender", "qbert", "tempest", "robotron", "1942", "tetrio", "jstris"],
  "tycoon-corner": ["simcity-1989", "simcity-2000", "transport-tycoon", "theme-park",
    "railroad-tycoon", "master-of-orion", "civ1", "shapez"],
};
check("WF17 22 collections (19 + 3 new, +2 makeover = 24)",
  collections.length === 24, collections.length + " collections");
check("WF17 new collections exact contents",
  Object.entries(newCols17).every(([cid, ids]) => {
    const c = collections.find((x) => x.id === cid);
    return !!c && c.game_ids.length === ids.length && ids.every((id) => c.game_ids.includes(id));
  }), Object.keys(newCols17).join(", "));
check("WF17 every wave-17 game has a kids.json verdict",
  wave17Ids.every((id) => kids.some((k) => k.id === id) || load("data/kids.json").excluded.some((k) => k.id === id)),
  "38 curated + 13 excluded");
check("WF17 dropped candidates stayed out (unverifiable or taken-down URLs never shipped)",
  ["crazy-kong", "gartic-io", "1v1-lol", "hextris", "republia-times", "prestige-tree",
   "evolve-idle", "frogger", "donkey-kong", "asteroids", "pacman", "final-fight",
   "contra-arcade", "tmnt-arcade", "simpsons-arcade", "street-fighter-2", "bubble-bobble",
   "commander-keen5", "xcom-ufo"].every((id) => !gameIds.has(id)),
  "19 rejected, 0 in catalog");
check("WF17 22 guides (20 + 2 new), pages exist with the guide template",
  ["gamepad-setup", "pico8-spotlight"].every((slug) => {
    const h = fs.readFileSync(path.join(ROOT, "guides", slug + ".html"), "utf8");
    return h.includes('class="guide-page"') && h.includes('data-spy') &&
      h.includes("assets/js/guide-toc.js") && h.includes("assets/js/arcade.js") &&
      h.includes("coin-plate") && h.includes('class="reading-progress"');
  }), "template: guide-page + spy TOC + toc.js + arcade.js + coin plate + progress");
check("WF17 new guides in data/guides.json with 8 sections each",
  ["gamepad-setup", "pico8-spotlight"].every((id) => {
    const g = load("data/guides.json").find((x) => x.id === id);
    return !!g && g.slug === id && g.sections.length === 8 && g.title && g.summary;
  }), "records complete");
check("WF17 new guides in sitemap + llms.txt + emulation hub",
  ["guides/gamepad-setup.html", "guides/pico8-spotlight.html"].every((s) =>
    fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>" + s + "</loc>")) &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("guides/gamepad-setup.html") &&
  fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes("guides/gamepad-setup.html") &&
  fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes("guides/pico8-spotlight.html"),
  "sitemap + llms + hub cards");
check("WF17 new guide external links on the allowlist",
  ["gamepad-setup", "pico8-spotlight"].every((slug) => {
    const h = fs.readFileSync(path.join(ROOT, "guides", slug + ".html"), "utf8");
    const allowed = ["developer.mozilla.org", "html5gamepad.com", "www.w3.org",
      "lexaloffle.com", "www.lexaloffle.com"];
    const hrefs = [...h.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    return hrefs.every((u) => {
      try { return allowed.includes(new URL(u).hostname); }
      catch { return true; }
    });
  }), "MDN + html5gamepad + w3c + lexaloffle only");
check("WF17 llms.txt mentions new collections",
  ["Flash-back machine", "Score attack", "Tycoon corner"].every((title) =>
    fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes(title)),
  "new shelf titles in llms.txt");

// Workflow 18 (wave 18): "The Trophy Room" — persistent play-tracking
const trophyCore = fs.readFileSync(path.join(ROOT, "assets/js/trophy-core.js"), "utf8");
const trophyRoomHtml = fs.readFileSync(path.join(ROOT, "trophy-room.html"), "utf8");
const trophyRoomJs = fs.readFileSync(path.join(ROOT, "assets/js/trophy-room.js"), "utf8");
const trophyCss = fs.readFileSync(path.join(ROOT, "assets/css/trophy.css"), "utf8");
const storeJs = fs.readFileSync(path.join(ROOT, "assets/js/store.js"), "utf8");
check("WF18 trophy-core.js UMD + full API surface",
  trophyCore.includes("typeof module !== 'undefined' && module.exports") &&
  ["createStore", "initDefault", "getDefault", "ACHIEVEMENTS", "SCHEMA_VERSION",
   "EXPORT_SCHEMA", "storageMode", "streaks", "dayKey"].every((k) => trophyCore.includes(k)),
  "UMD, node-loadable, 9 API exports");
check("WF18 trophy namespace + export schema constants",
  trophyCore.includes("bm.trophy.v1") && trophyCore.includes("bm.trophy.export") &&
  trophyCore.includes("SCHEMA_VERSION = 1"),
  "bm.trophy.v1 store key, bm.trophy.export schema v1");
check("WF18 16 achievements, each with name + desc + rule",
  (trophyCore.match(/id: '[a-z0-9-]+',\s+name: '/g) || []).length === 16 &&
  trophyCore.includes("puzzle-breaker") && trophyCore.includes("shelf-clearer") &&
  trophyCore.includes("streak-7") && trophyCore.includes("marathon") &&
  trophyCore.includes("genre-master"),
  "16 prizes incl. puzzle-breaker, shelf-clearer, streak-7, marathon, genre-master");
check("WF18 beaten-implies-played + unplay-clears-beaten cascade",
  trophyCore.includes("if (!state.played[id]) state.played[id] = ts;") &&
  trophyCore.includes("delete state.played[id]; delete state.beaten[id];"),
  "markBeaten sets played; unmarkPlayed clears beaten");
check("WF18 import is atomic with corruption recovery",
  trophyCore.includes("Any failure leaves the current state untouched") &&
  trophyCore.includes("not-json") && trophyCore.includes("future-version") &&
  trophyCore.includes("bad-schema"),
  "validate-first-then-commit, 3 rejection classes, honest messages");
check("WF18 trophy-room.html page structure",
  trophyRoomHtml.includes("<title>The Trophy Room") &&
  trophyRoomHtml.includes("assets/js/trophy-core.js") &&
  trophyRoomHtml.includes("assets/js/trophy-room.js") &&
  trophyRoomHtml.includes("assets/js/arcade.js") &&
  trophyRoomHtml.includes('id="stat-band"') && trophyRoomHtml.includes('id="shelf-grid"') &&
  trophyRoomHtml.includes('id="prize-case"') && trophyRoomHtml.includes('id="collection-progress"') &&
  trophyRoomHtml.includes('id="export-btn"') && trophyRoomHtml.includes('id="import-btn"') &&
  trophyRoomHtml.includes('id="import-text"') && trophyRoomHtml.includes('id="reset-btn"') &&
  trophyRoomHtml.includes('id="storage-notice"') && trophyRoomHtml.includes("coin-plate") &&
  trophyRoomHtml.includes('aria-current="page">Trophy room'),
  "title + 4 scripts + 5 sections + backup UI + notice + coin plate + nav current");
check("WF18 trophy room wired into sitemap + llms.txt",
  fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>trophy-room.html</loc>") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("trophy-room.html"),
  "sitemap + llms.txt via build_site.py PAGES");
check("WF18 nav links trophy room on every page (correct ../ on sub-pages)",
  fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).every((f) =>
    !fs.readFileSync(path.join(ROOT, f), "utf8").includes('class="site-nav"') ||
    fs.readFileSync(path.join(ROOT, f), "utf8").includes('href="trophy-room.html"')) &&
  ["guides/pico8-spotlight.html", "genres/roguelike.html"].every((p) =>
    fs.readFileSync(path.join(ROOT, p), "utf8").includes('href="../trophy-room.html"')),
  "39 pages, ../-prefixed on guides/ + genres/");
check("WF18 games.html trophy wiring (assets + CTA + data-driven hero)",
  gamesHtml.includes("assets/js/trophy-core.js") && gamesHtml.includes("assets/css/trophy.css") &&
  gamesHtml.includes('href="trophy-room.html">» Trophy room</a>') &&
  gamesHtml.includes('id="games-hero-count"'),
  "core.js + css + hero CTA + data-driven count");
check("WF18 collections.html per-shelf progress",
  collHtml.includes("assets/js/trophy-core.js") &&
  collJs.includes("shelf-progress") &&
  collJs.includes("paintShelfProgress") &&
  collJs.includes("collectionProgress"),
  "core.js + strip markup + paint + store.collectionProgress");
check("WF18 arcade.js card controls + change events + prize toast",
  arcadeJs.includes("attachTrophyControls") && arcadeJs.includes("trophy-row") &&
  arcadeJs.includes("bm:trophy-changed") && arcadeJs.includes("showPrizeToast") &&
  arcadeJs.includes("initTrophy") && arcadeJs.includes("BM.trophyReady"),
  "token toggles, change fan-out, toast, shared store init");
check("WF18 store.js favorites merge for import",
  storeJs.includes("setFavs") && storeJs.includes("setFavs: setFavs") &&
  storeJs.includes("bm:favs-changed"),
  "setFavs union-merge + change event");
check("WF18 toggleFav dispatches bm:favs-changed (programmatic fav changes notify)",
  (storeJs.match(/new CustomEvent\('bm:favs-changed'\)/g) || []).length === 2,
  "toggleFav + setFavs dispatch; card ♥ handler relies on toggleFav");
check("WF18 fav changes re-evaluate achievements (heart-5/20 earnable from ♥)",
  arcadeJs.includes('"bm:favs-changed"') && arcadeJs.includes("store.evaluate()") &&
  arcadeJs.includes("showPrizeToast(newly)"),
  "favs-changed -> evaluate -> prize toast + trophy-changed fan-out");
check("WF18 trophy-room.js renders all sections from real catalog data",
  trophyRoomJs.includes("genreStats") && trophyRoomJs.includes("collectionProgress") &&
  trophyRoomJs.includes("achievements") && trophyRoomJs.includes("dialSVG") &&
  trophyRoomJs.includes("stackedBar") && trophyRoomJs.includes("importJSON") &&
  trophyRoomJs.includes("exportJSON") && trophyRoomJs.includes("MEMORY-ONLY MODE") &&
  trophyRoomJs.includes("bm:favs-changed"),
  "dials + bars + prizes + collections + backup + memory notice + fav sync");
check("WF18 trophy.css reduced-motion safe + identity motifs",
  !trophyCss.includes("@keyframes") &&
  trophyCss.includes(".trophy-btn") && trophyCss.includes(".dial-arc") &&
  trophyCss.includes(".prize-disc") && trophyCss.includes(".stacked-bar") &&
  trophyCss.includes(".prize-toast"),
  "no keyframes; token buttons, CRT dials, prize case, stacked bars, toast");
check("WF18 no ROM/BIOS download phrasing in new trophy files",
  !/download.{0,40}\b(roms?|bios)\b|\b(roms?|bios)\b.{0,40}download/i.test(trophyCore + trophyRoomJs) &&
  !/\b(roms?|bios)\b.{0,40}\bdownload\b/i.test(trophyRoomHtml),
  "legal lane holds on all new files");

// Workflow 19 (Vercel Wave B): frontend fallback contract + game-night wiring
const apiClientJs = fs.readFileSync(path.join(ROOT, "assets/js/api-client.js"), "utf8");
const directoryJs = fs.readFileSync(path.join(ROOT, "assets/js/directory.js"), "utf8");
const gnClientJs = fs.readFileSync(path.join(ROOT, "assets/js/game-night.js"), "utf8");
const gnUiJs = fs.readFileSync(path.join(ROOT, "assets/js/game-night-ui.js"), "utf8");
const gnLibJs = fs.readFileSync(path.join(ROOT, "lib/game-night.js"), "utf8");
const badgeCss = fs.readFileSync(path.join(ROOT, "assets/css/components.css"), "utf8");
const goLiveMd = fs.readFileSync(path.join(ROOT, "GO_LIVE.md"), "utf8");
const apiMd = fs.readFileSync(path.join(ROOT, "API.md"), "utf8");
const buildPy = fs.readFileSync(path.join(ROOT, "scripts/build.py"), "utf8");
check("WF19 api-client.js ships the spec contract",
  apiClientJs.includes("fetchWithFallback") && apiClientJs.includes("LIVE_TIMEOUT_MS = 7000") &&
  apiClientJs.includes("dataset.apiState") && apiClientJs.includes("\"waking server…\"") &&
  apiClientJs.includes("cached · updated") && apiClientJs.includes("never rejects"),
  "fetchWithFallback, 7s timeout, 4 badge states");
check("WF19 games.html badge wiring",
  gamesHtml.includes('id="directory-badge"') && gamesHtml.includes('class="api-badge"') &&
  gamesHtml.includes('role="status"') && gamesHtml.includes('tabindex="0"') &&
  gamesHtml.includes('src="assets/js/api-client.js"'),
  "badge: role=status, tabindex=0; api-client.js loaded before directory.js");
check("WF19 directory.js live-first with static fallback",
  directoryJs.includes("ApiClient.fetchWithFallback") &&
  directoryJs.includes("'/api/games?limit=200'") &&
  directoryJs.includes("'data/v1/games.json'") &&
  directoryJs.includes("probeLiveCatalog"),
  "static render first, live probe overlays enrichment by id");
check("WF19 game-night browser twin in sync",
  gnClientJs.includes("window.BMGameNight") && gnClientJs.includes("pickLineup") &&
  gnClientJs.includes("REGENERATED by scripts/build.py") &&
  /SCORING_VERSION = "([0-9.]+)"/.exec(gnClientJs)[1] === /SCORING_VERSION = "([0-9.]+)"/.exec(gnLibJs)[1] &&
  buildPy.includes("sync_game_night_client"),
  "twin exposes BMGameNight, scoring version matches lib, build.py regenerates");
const qlVibesBlock = (partyHtml.match(/<div class="pp-row" id="ql-vibes">[\s\S]*?<\/div>/) || [""])[0];
check("WF19 party-planner.html quick-lineup panel",
  partyHtml.includes('id="quick-lineup-form"') && partyHtml.includes('id="ql-group"') &&
  partyHtml.includes('id="ql-minutes"') && partyHtml.includes('id="ql-kids"') &&
  partyHtml.includes('id="ql-go"') &&
  partyHtml.includes('id="lineup-badge"') && partyHtml.includes('id="ql-results"') &&
  partyHtml.includes('src="assets/js/game-night.js"') &&
  partyHtml.includes('src="assets/js/game-night-ui.js"') &&
  ["cozy", "chaotic", "competitive", "party", "chill"]
    .every((v) => qlVibesBlock.includes('value="' + v + '"')),
  "form + 5 engine vibes + badge + results + scripts");
check("WF19 game-night-ui.js POST-first with client fallback",
  gnUiJs.includes("POST") && gnUiJs.includes("/api/game-night") &&
  gnUiJs.includes("7000") && gnUiJs.includes("clientLineup") &&
  gnUiJs.includes("BMGameNight.pickLineup") && gnUiJs.includes("cached · updated"),
  "7s POST, fallback computes from static catalog, honest cached badge");
check("WF19 badge CSS covers the four states distinctly",
  badgeCss.includes('.api-badge[data-api-state="live"]') &&
  badgeCss.includes('.api-badge[data-api-state="cached"]') &&
  badgeCss.includes('.api-badge[data-api-state="waking"]') &&
  badgeCss.includes('.api-badge[data-api-state="none"]') &&
  badgeCss.includes("var(--neon-lime)") && badgeCss.includes("var(--neon-amber)") &&
  badgeCss.includes(":focus-visible"),
  "live=green, cached=amber, waking=subtle, none=hidden, focus ring");
check("WF19 GO_LIVE.md follows the §11 template",
  goLiveMd.includes("LIVE-READY, NOT DEPLOYED") && goLiveMd.includes("Standard") &&
  goLiveMd.includes("Never Turbo") && goLiveMd.includes("1ZU1WJJS-0012") &&
  goLiveMd.includes("100 GB/mo") && goLiveMd.includes("100k/mo") &&
  goLiveMd.includes("Cold-start") && goLiveMd.includes("Cron behavior") &&
  goLiveMd.includes("Rollback") && goLiveMd.includes("CRON_SECRET") &&
  goLiveMd.includes("GITHUB_REPO_TOKEN") && goLiveMd.includes("REPO_STATIC_PREFIX"),
  "11 sections: banner, functions, prereqs, hookup, env vars, Hobby table, cold-start, cron, domains, rollback, cost rules");
check("WF19 API.md documents the live functions",
  ["/api/health", "/api/games", "/api/collections", "/api/game-night", "/api/cron/curator"]
    .every((p) => apiMd.includes(p)) && apiMd.includes("envelope"),
  "5 functions + envelope contract");
check("WF19 no ROM/BIOS download phrasing in new wave-B files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i
    .test(apiClientJs + gnUiJs + gnClientJs + goLiveMd),
  "legal lane holds on all new files");

// Workflow 20 (wow wave 1 "Attract Mode"): cabinet homepage + CRT player
const attractCss = fs.readFileSync(path.join(ROOT, "assets/css/attract.css"), "utf8");
const attractJs = fs.readFileSync(path.join(ROOT, "assets/js/attract.js"), "utf8");
check("WF20 cabinet markup on index.html (marquee + bezel + screen + deck + coin plate)",
  indexHtml.includes('id="arcade-cabinet"') && indexHtml.includes('class="cabinet-marquee"') &&
  indexHtml.includes('id="cabinet-screen"') && indexHtml.includes('id="demo-stage"') &&
  indexHtml.includes('id="insert-coin"') && indexHtml.includes('href="games.html">\u00BB INSERT COIN') &&
  indexHtml.includes('id="demo-prev"') && indexHtml.includes('id="demo-next"') &&
  indexHtml.includes('id="demo-pause"') && indexHtml.includes('id="demo-callout"') &&
  indexHtml.includes('id="demo-announcer"') && indexHtml.includes('assets/css/attract.css') &&
  indexHtml.includes('assets/js/attract.js'),
  "cabinet + transport + coin plate + announcer + assets wired");
check("WF20 demo loop is real catalog data (no canned slides)",
  attractJs.includes("BM.loadGames()") && attractJs.includes("pickSpotlights") &&
  attractJs.includes("data/collections.json") && attractJs.includes("data/v1/kid-safe.json") &&
  !/=\s*\[[^\]\s]/.test(attractJs.split("pickSpotlights")[1] || ""),
  "loadGames + deterministic daily picks from the live catalog");
check("WF20 stat callouts from real catalog + real trophy progress",
  attractJs.includes("buildCallouts") && attractJs.includes("store.counts()") &&
  attractJs.includes("store.achievements()") && attractJs.includes("store.streak()") &&
  attractJs.includes("GAMES ON THE SHELF") && attractJs.includes("KID-SAFE PICKS"),
  "catalog facts + played/beaten/prizes/streak, progress-gated");
check("WF20 demo is skippable + keyboard-operable",
  attractJs.includes('setAttribute("inert", "")') && attractJs.includes("aria-roledescription") &&
  indexHtml.includes('aria-live="polite"') && attractJs.includes("aria-pressed") &&
  indexHtml.includes('role="toolbar"') && indexHtml.includes('aria-label="Demo loop controls"'),
  "inert inactive slides, roledescription, live announcer, toolbar");
check("WF20 insert coin: screen-off transition to the real games directory",
  attractJs.includes("screen-off") && attractJs.includes('window.location.href = "games.html"') &&
  attractCss.includes("@keyframes crt-collapse") && attractCss.includes("@keyframes crt-flash"),
  "CRT collapse + flash keyframes, plain-link fallback preserved");
check("WF20 reduced-motion: static cabinet, all games listed, no motion",
  attractJs.includes("renderStaticList") && attractJs.includes("demo-all-list") &&
  attractCss.includes("@media (prefers-reduced-motion: reduce)") &&
  attractCss.includes(".demo-all-list"),
  "full static shelf list replaces the demo under reduced motion");
check("WF20 FX toggle kills the whole wave (sensory-envelope switch)",
  /classList\.contains\(['"]fx-off['"]\)/.test(attractJs) &&
  attractCss.includes("html.fx-off .marquee-bulbs") &&
  attractCss.includes("html.fx-off #console-shell.crt-on .crt-overlay") &&
  attractCss.includes("html.fx-off .demo-slide") &&
  /classList\.contains\(['"]fx-off['"]\)/.test(playerJs),
  "cabinet motion, demo cycle, and CRT treatment all die under fx-off");
check("WF20 cabinet mobile tuning",
  attractCss.includes("@media (max-width: 720px)") && attractCss.includes(".cabinet-side { display: none; }") &&
  attractCss.includes("@media (max-width: 480px)") && attractCss.includes(".insert-coin-plate { width: 100%;"),
  "side art collapses, deck wraps, coin plate full-width");
check("WF20 CRT player: scanline roll + sheen + phosphor glow, overlay-only",
  attractCss.includes("#console-shell.crt-on .ejs-stage::after") &&
  attractCss.includes("@keyframes crt-roll") &&
  attractCss.includes("phosphor glow") && attractCss.includes("pointer-events: none") &&
  playerJs.includes("toggle('crt-on'") || playerJs.includes('toggle("crt-on"'),
  "roll + glass sheen + glow; player.js only toggles a class");
check("WF20 CRT power on/off hooks in player.js (null-guarded, engine untouched)",
  playerJs.includes("powerOnScreen") && playerJs.includes("powerOffThen") &&
  playerJs.includes("screen-power-on") && playerJs.includes("screen-power-off") &&
  attractCss.includes("@keyframes crt-power-on") && attractCss.includes("@keyframes crt-power-off") &&
  playerJs.includes("EJS_emulator.destroy"),
  "boot powers on, eject powers off; teardown still destroys the engine");
const kfBlocks = [...attractCss.matchAll(/@keyframes\s+([\w-]+)\s*\{(?:[^{}]|\{[^{}]*\})*\}/g)];
const kfLayoutProps = kfBlocks.filter((m) =>
  /\b(width|height|top|left|right|bottom|margin|padding|background-position)\s*:/.test(m[2]));
check("WF20 player.html wired + transform/opacity-only animation discipline",
  playerHtml.includes("assets/css/attract.css") && kfBlocks.length >= 6 && kfLayoutProps.length === 0,
  "attract.css linked on player; " + kfBlocks.length + " keyframe blocks, zero layout-property animations");
check("WF20 CRT power-off / fx-off / reduced-motion CSS wiring",
  attractCss.includes("html:not(.fx-off) #ejs-screen.screen-power-off") &&
  attractCss.includes("html.fx-off #console-shell.crt-on .crt-overlay") &&
  attractCss.includes("html.fx-off #console-shell.crt-on .ejs-stage::after") &&
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#ejs-screen\.screen-power-off/.test(attractCss) &&
  playerJs.includes("powerOffThen(function ()") &&
  playerJs.includes("if (readDisplay(core).crt) powerOnScreen();"),
  "power-off gated, fx-off hides overlays, rm kills power motion, boot/eject wired");
check("WF20 demo offline state is honest, not a stub",
  attractJs.includes("demoOffline") && attractJs.includes("CABINET OFFLINE") &&
  attractJs.includes('a.href = "games.html"'),
  "fetch failure -> honest message + directory link");
check("WF20 no ROM/BIOS download phrasing in new wave-1 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(attractJs + attractCss) &&
  !/\b(roms?|bios)\b.{0,40}\bdownload\b/i.test(indexHtml.split("cabinet-section")[0] || ""),
  "legal lane holds");

// Wave 19 "Spotlight": the Curator's metadata surfaces go live in the browser.
const gamesApiSrc = fs.readFileSync(path.join(ROOT, "api/games.js"), "utf8");
const detailHtml = fs.readFileSync(path.join(ROOT, "game.html"), "utf8");
const detailJs = fs.readFileSync(path.join(ROOT, "assets/js/game-detail.js"), "utf8");
check("WF21 /api/games ?id= lookup (404 miss, 400 bad shape, filter win)",
  gamesApiSrc.includes('qp.get("id")') && gamesApiSrc.includes("NOT_FOUND") &&
  gamesApiSrc.includes('enrichGame(g, cat)') && gamesApiSrc.includes("filters: { id: id }") &&
  /id must match/.test(gamesApiSrc),
  "single-game lookup shares the enrichGame shape");
check("WF21 game.html wired (badge, panels, honest states)",
  detailHtml.includes('id="detail-badge"') && detailHtml.includes('role="status"') &&
  detailHtml.includes('id="trophy-panel"') && detailHtml.includes('id="shelves-panel"') &&
  detailHtml.includes('id="related-panel"') && detailHtml.includes('id="prevnext"') &&
  detailHtml.includes("assets/js/game-detail.js") && detailHtml.includes("assets/js/api-client.js") &&
  detailHtml.includes("assets/css/game-detail.css"),
  "detail page structure + scripts + css");
check("WF21 game-detail.js static-first + live overlay + badge preservation",
  detailJs.includes("fetchWithFallback") && detailJs.includes("/api/games?id=") &&
  detailJs.includes("NO GAME ON THIS CHANNEL") && detailJs.includes("CABINET OFFLINE") &&
  detailJs.includes("getElementById(\"detail-badge\")") && detailJs.includes("meta.appendChild(badge") &&
  detailJs.includes("/api/collections") && detailJs.includes("BM.trophyReady") &&
  detailJs.includes("togglePlayed") && detailJs.includes("Copy game-file link"),
  "static render, live probe, badge node survives re-render, trophy + shelves + share");
check("WF21 collections.js extracted + Curator-wired",
  collHtml.includes("assets/js/collections.js") && collHtml.includes("assets/js/api-client.js") &&
  !collHtml.includes("data/collections.json', { cache: 'no-store' })") &&
  collJs.includes("fetchWithFallback") && collJs.includes("/api/collections") &&
  collJs.includes("data/v1/collections.json") && collJs.includes("collections-badge") &&
  collJs.includes("game.html?id=") && collJs.includes("paintShelfProgress") &&
  collHtml.includes('id="collections-badge"'),
  "inline script gone, live probe with badge, shelf rows link to game files");
check("WF21 tooltip deep link to the game file",
  arcadeJs.includes("tip-file") && arcadeJs.includes("game.html?id=") &&
  arcadeJs.includes("full game file"),
  "every card tooltip carries a full-file link");
check("WF21 API.md documents ?id=",
  apiMd.includes("?id=") && /404/.test(apiMd.split("### `GET /api/games`")[1] || ""),
  "live function docs updated");
check("WF21 game.html + collections badge in sitemap/llms surface",
  fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>game.html</loc>") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("game.html?id="),
  "discoverable for crawlers and agents");
check("WF21 vercel.json: explicit function paths, maxDuration 10, no runtime key",
  (() => {
    try {
      const v = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
      const fns = v.functions || {};
      const want = ["api/health.js", "api/games.js", "api/collections.js", "api/game-night.js", "api/cron/curator.js"];
      const keys = Object.keys(fns);
      return keys.length === want.length && want.every((k) => keys.includes(k)) &&
        keys.every((k) => fns[k] && fns[k].maxDuration === 10 && !("runtime" in fns[k])) &&
        keys.every((k) => fs.existsSync(path.join(ROOT, k))) &&
        !JSON.stringify(fns).includes("runtime");
    } catch (e) { return false; }
  })(),
  "5 explicit paths, maxDuration 10 each, zero runtime keys (2026-10-12 deploy lesson)");
check("WF21 no ROM/BIOS download phrasing in wave-19 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(detailJs + collJs + gamesApiSrc) &&
  !/\b(roms?|bios)\b.{0,40}\bdownload\b/i.test(detailHtml),
  "legal lane holds");

// Wave 20 "Extreme Makeover": first-visit hierarchy + human-made bar.
const makeoverCss22 = fs.readFileSync(path.join(ROOT, "assets/css/makeover.css"), "utf8");
const indexHtml22 = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const attractJs22 = fs.readFileSync(path.join(ROOT, "assets/js/attract.js"), "utf8");
const liveChecklist22 = fs.readFileSync(path.join(ROOT, "LIVE_CHECKLIST.md"), "utf8");
check("WF22 data/v1 move: zero api/v1 references in code",
  (() => {
    const exts = [".js", ".html", ".py", ".sh", ".json"];
    const skip = ["WAVELOG.md", "node_modules", ".git", "__pycache__", "check_api_workflows.js"];
    function walk(dir) {
      let hits = [];
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (skip.some((s) => p.includes(s))) continue;
        const st = fs.statSync(p);
        if (st.isDirectory()) hits = hits.concat(walk(p));
        else if (exts.includes(path.extname(f))) {
          const s = fs.readFileSync(p, "utf8");
          if (s.includes("api/v1")) hits.push(p);
        }
      }
      return hits;
    }
    return walk(ROOT).length === 0;
  })(),
  "no api/v1 string survives anywhere in code");
check("WF22 api/ holds only function handlers",
  fs.readdirSync(path.join(ROOT, "api")).every((f) =>
    f === "cron" || f.endsWith(".js")) &&
  fs.readdirSync(path.join(ROOT, "api", "cron")).every((f) => f.endsWith(".js")) &&
  !fs.existsSync(path.join(ROOT, "api", "v1")),
  "5 handlers + cron, zero static data under api/");
check("WF22 two new collections with real curation",
  (() => {
    const cols = load("data/collections.json").collections;
    const cc = cols.find((c) => c.id === "curators-choice");
    const sh = cols.find((c) => c.id === "start-here");
    const ids = new Set(load("data/games.json").games.map((g) => g.id));
    return cols.length === 24 && !!cc && !!sh &&
      cc.game_ids.length === 8 && sh.game_ids.length === 7 &&
      cc.game_ids.concat(sh.game_ids).every((id) => ids.has(id)) &&
      /I did/.test(cc.description) && /First visit/.test(sh.description);
  })(),
  "curators-choice (8) + start-here (7), all ids real, voice in the copy");
check("WF22 homepage hero: 3-second read, one primary CTA",
  indexHtml22.includes('class="hero-title"') && indexHtml22.includes("Your browser") &&
  indexHtml22.includes("is the <em>console</em>") && indexHtml22.includes("data-game-count") &&
  indexHtml22.includes('href="games.html">» Browse the games</a>') &&
  indexHtml22.includes('href="#how"') && indexHtml22.includes('id="how"') &&
  indexHtml22.includes("assets/css/makeover.css") &&
  indexHtml22.indexOf('section class="hero"') < indexHtml22.indexOf("arcade-cabinet"),
  "hero before cabinet, single primary CTA, data-driven count");
check("WF22 curator note + human signals",
  indexHtml22.includes("curator-note") && indexHtml22.includes("A note from the curator") &&
  indexHtml22.includes("Especially</em> the weird ones") &&
  indexHtml22.includes("the high scores are all mine"),
  "signed note with opinions + view-source easter egg");
check("WF22 no AI-slop copy on the homepage",
  !/delve|unlock the power|game-changer|elevate your|fast-paced world|whether you.re a beginner or a pro/i.test(indexHtml),
  "denylist clean");
check("WF22 attract-mode craft: no horror lead + konami egg",
  attractJs22.includes('g.genre !== "horror"') && attractJs22.includes("KONAMI ACCEPTED") &&
  /konami/i.test(attractJs),
  "demo handshake, not jumpscare; cabinet notices the code");
check("WF22 LIVE_CHECKLIST carries the data/v1 rule",
  liveChecklist22.includes("Vercel never serves static files under api/") &&
  liveChecklist22.includes("data/v1/"),
  "deploy lesson recorded");

// Wave 21 "The Curator": game-night engine v2 + marquee ceremony.
const gnHtml = fs.readFileSync(path.join(ROOT, "game-night.html"), "utf8");
const cnEngine = fs.readFileSync(path.join(ROOT, "assets/js/curator-night.js"), "utf8");
const cnUi = fs.readFileSync(path.join(ROOT, "assets/js/curator-night-ui.js"), "utf8");
const cnCss = fs.readFileSync(path.join(ROOT, "assets/css/curator-night.css"), "utf8");
const v1engine = fs.readFileSync(path.join(ROOT, "lib/game-night.js"), "utf8");
check("WF23 game-night.html: marquee + form + ceremony stage wired",
  gnHtml.includes("cn-marquee") && gnHtml.includes('id="cn-form"') &&
  gnHtml.includes('id="cn-group"') && gnHtml.includes('id="cn-minutes"') &&
  gnHtml.includes('id="cn-vibes"') && gnHtml.includes('id="cn-deal"') &&
  gnHtml.includes('id="cn-announcer"') && gnHtml.includes('id="cn-stage"') &&
  gnHtml.includes('id="cn-error"') && gnHtml.includes("curator-night.js") &&
  gnHtml.includes("curator-night-ui.js") && gnHtml.includes("curator-night.css") &&
  gnHtml.includes("the curator's deck is stacked"),
  "marquee, sliders, vibe chips, deal button, aria-live announcer, stage, easter egg");
check("WF23 engine v2: UMD, DOM-free, scoring 2.2.0, honesty declared",
  cnEngine.includes("SCORING_VERSION = '2.2.0'") &&
  cnEngine.includes("typeof module") && !/document\.|window\./.test(cnEngine) &&
  /curator estimates/i.test(cnEngine) && cnEngine.includes("roleSequence") &&
  cnEngine.includes("assemble") && cnEngine.includes("validateInputs"),
  "UMD, no DOM, curve + variety + timebox fit, estimates declared");
check("WF23 v1 quick-lineup engine untouched (parity gate intact)",
  v1engine.includes('SCORING_VERSION = "1.0.0"') &&
  fs.readFileSync(path.join(ROOT, "assets/js/game-night.js"), "utf8").includes("do not hand-edit"),
  "lib/game-night.js still v1.0.0, client twin still generated");
check("WF23 ceremony: staggered reveal + reduced-motion/FX-off instant path",
  cnUi.includes("--reveal-delay") && cnUi.includes("aria-live") &&
  cnUi.includes("prefers-reduced-motion") && cnUi.includes("fx-off") &&
  cnUi.includes("SHUFFLING THE DECK") && cnCss.includes("@keyframes cn-slot-in"),
  "shuffle beat, per-slot delay, announcer, motion-safe");
check("WF23 keyframes are transform/opacity only (animation discipline)",
  (() => {
    const blocks = cnCss.match(/@keyframes[^{]+\{[^}]+\}[^}]*\}/g) || [];
    return blocks.length > 0 && blocks.every((b) => !/(background|color|width|height|margin|padding|border|box-shadow|top|left)\s*:/i.test(b));
  })(),
  "motion tokens respected");
check("WF23 nav links Game night on every full-nav page",
  (() => {
    const files = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
    return files.every((f) => {
      const h = fs.readFileSync(path.join(ROOT, f), "utf8");
      const nav = (h.match(/<nav class="site-nav"[^>]*>[\s\S]*?<\/nav>/) || [""])[0];
      if (!/>Party planner<\/a>/.test(nav)) return true; /* slim navs (404, system-picker) exempt */
      if (f === "game-night.html") return /aria-current="page">Game night/.test(nav);
      return />Game night<\/a>/.test(nav);
    });
  })(),
  "full navs carry it; game-night.html marks current");
check("WF23 footer Play column links Game night",
  (() => {
    const files = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
    return files.every((f) => {
      const h = fs.readFileSync(path.join(ROOT, f), "utf8");
      const foot = (h.match(/<footer class="site-footer">[\s\S]*?<\/footer>/) || [""])[0];
      if (!/>Party planner<\/a>/.test(foot)) return true; /* slim footers exempt */
      return />Game night<\/a>/.test(foot);
    });
  })(),
  "full footers carry it");
check("WF23 cross-links: party-planner + index point at game-night.html",
  fs.readFileSync(path.join(ROOT, "party-planner.html"), "utf8").includes('href="game-night.html">» Game night</a>') &&
  indexHtml22.includes('href="game-night.html"'),
  "quick lineup hands off to the ceremony; homepage promo strip");
check("WF23 sitemap + llms.txt include game-night.html",
  fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("game-night.html") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("game-night.html"),
  "agentic surface regenerated");
check("WF23 no ROM/BIOS download phrasing in wave-21 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(gnHtml + cnUi + cnCss) &&
  !/\b(roms?|bios)\b.{0,40}\bdownload\b/i.test(cnEngine),
  "legal lane holds; engine links catalog URLs only");
check("WF23 player.html null-guard fix: badge/toolbar writes guarded",
  (() => {
    const p = fs.readFileSync(path.join(ROOT, "assets/js/player.js"), "utf8");
    return !/\$\('(sys-badge|player-toolbar)'\)\.(textContent|hidden)\s*=/.test(p);
  })(),
  "no unguarded sys-badge/player-toolbar writes remain");

// Wave 22 "Game Night 2.0": bucket calibration against the real catalog.
const CN24 = require(path.join(ROOT, "assets/js/curator-night.js"));
const gn22Test = fs.readFileSync(path.join(ROOT, "scripts/test_gamenight22.js"), "utf8");
check("WF24 engine calibration surface exported",
  typeof CN24.estimateCapacity === "function" && typeof CN24.estimateEnergy === "function" &&
  typeof CN24.playerFit === "function" && typeof CN24.sessionFit === "function" &&
  typeof CN24.targetSlots === "function" && CN24.SCORING_VERSION === "2.2.0" &&
  Object.keys(CN24.SESSION_OVERRIDES).length >= 60 && Object.keys(CN24.CAPACITY_OVERRIDES).length >= 10,
  "capacity/energy estimators + graded fits + override tables, scoring v2.2.0");
check("WF24 overrides: real ids, every pin load-bearing",
  (() => {
    const byId = {};
    games.forEach((x) => { byId[x.id] = x; });
    const ghostS = (x) => CN24.estimateSession({ genre: x.genre, tags: x.tags || [] });
    const ghostC = (x) => CN24.estimateCapacity({ genre: x.genre, tags: x.tags || [] });
    return Object.keys(CN24.SESSION_OVERRIDES).every((id) => byId[id] && CN24.SESSION_OVERRIDES[id] !== ghostS(byId[id])) &&
      Object.keys(CN24.CAPACITY_OVERRIDES).every((id) => byId[id] && CN24.CAPACITY_OVERRIDES[id] !== ghostC(byId[id]));
  })(),
  "no invented ids, no dead pins (suite: scripts/test_gamenight22.js)");
check("WF24 graded fits behave like the room",
  CN24.playerFit(games.find((x) => x.id === "2048"), 12).score < CN24.playerFit(games.find((x) => x.id === "2048"), 2).score &&
  CN24.playerFit(games.find((x) => x.id === "skribbl"), 12).score === 40 &&
  CN24.estimateSession(games.find((x) => x.id === "civ1")) === 60 &&
  CN24.estimateSession(games.find((x) => x.id === "wordle")) === 5 &&
  CN24.estimateCapacity(games.find((x) => x.id === "lichess")) === 2 &&
  CN24.sessionFit(15, 60).score === 20 && CN24.sessionFit(5, 240).score === 8,
  "pass-and-play decays, room games hold, civ 60 / wordle 5 / lichess seats 2, session fit peaks at slot size");
check("WF24 ceremony surfaces seats + energy; page copy declares calibration",
  cnUi.includes("seats ~") && cnUi.includes("slot.energy_label") &&
  gnHtml.includes("calibrated game by game"),
  "slot meta carries seats ~N + energy label; hint copy updated");
check("WF24 game-detail collections overlay accepts both shapes",
  detailJs.includes("c.game_ids || (c.games || [])"),
  "static fallback (game_ids) no longer wipes the shelf render (wave-19 bug)");
check("WF24 parity suite reads data/v1 (wave-20 move fallout fixed)",
  fs.readFileSync(path.join(ROOT, "scripts/test_gamenight_parity.js"), "utf8").includes('"data", "v1"') &&
  gn22Test.includes("grid sweep"),
  "parity gate back on the real catalog path; calibration suite carries the sweep");
check("WF24 no ROM/BIOS download phrasing in wave-22 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(gn22Test + cnUi),
  "legal lane holds");

// Wave 23 "Game Night 2.1": saved lineups (the shelf) + the rematch.
const BL25 = require(path.join(ROOT, "assets/js/curator-night-lineups.js"));
const CAT24 = (() => {
  const ks = {};
  (load("data/v1/kid-safe.json")["kid-safe"] || []).forEach((k) => { ks[k.id] = 1; });
  return { games: games, kidSafeIds: ks, generated_at: gamesEnv.generated_at };
})();
const blJs = fs.readFileSync(path.join(ROOT, "assets/js/curator-night-lineups.js"), "utf8");
const gn23Test = fs.readFileSync(path.join(ROOT, "scripts/test_lineups23.js"), "utf8");
check("WF25 shelf module: UMD, DOM-free, storage key + cap + schema",
  blJs.includes("STORE_KEY = 'bm.lineups.v1'") && blJs.includes("typeof module") &&
  !/document\.|window\./.test(blJs) && BL25.MAX_LINEUPS === 12 &&
  BL25.EXPORT_SCHEMA === "bm.lineup.v1" && typeof BL25.createStore === "function" &&
  typeof BL25.rematch === "function" && typeof BL25.lineupAsText === "function",
  "bm.lineups.v1, cap 12, snapshot records validated one by one");
check("WF25 game-night.html: shelf section + module wired, honest storage copy",
  gnHtml.includes('id="cn-shelf"') && gnHtml.includes('id="cn-shelf-list"') &&
  gnHtml.includes("curator-night-lineups.js") &&
  gnHtml.indexOf("curator-night-lineups.js") < gnHtml.indexOf("curator-night-ui.js") &&
  gnHtml.includes("saved nights live in this browser only") &&
  !gnHtml.includes("nothing is stored") && !gnHtml.includes("nothing stored"),
  "shelf markup present, module loads before the UI, no stale nothing-stored claim");
check("WF25 UI: save / load / rematch / retire / copy-card all wired",
  cnUi.includes("LINEUPS.save") && cnUi.includes("LINEUPS.remove") &&
  cnUi.includes("BMCuratorLineups.rematch") && cnUi.includes("BMCuratorLineups.lineupAsText") &&
  cnUi.includes("renderShelf") && cnUi.includes("resultFromRecord") &&
  cnUi.includes("cn-shelf-card") && cnUi.includes("storageMode"),
  "stage actions + shelf cards share one store; memory-mode notice honored");
check("WF25 save/snapshot round-trip over the real catalog (in-suite)",
  (() => {
    const m = {};
    const be = { get: (k) => (k in m ? m[k] : null), set: (k, v) => { m[k] = v; }, del: (k) => { delete m[k]; } };
    const st = BL25.createStore(be);
    const inp = { group_size: 4, minutes: 120, vibes: ["party", "chaotic"], skill: "mixed", kids: false };
    const r = st.save(CN24.dealNight(inp, CAT24), "WF25 Probe Night");
    if (!r.ok) return false;
    const back = BL25.createStore(be).get(r.record.id);
    return !!back && back.slots.length === r.record.slots.length &&
      back.slots.every((s, i) => s.game_id === r.record.slots[i].game_id);
  })(),
  "deal -> shelve -> fresh store reads the same night back");
check("WF25 rematch over the real catalog: fresh picks, same curve, timebox intact",
  (() => {
    const m = {};
    const be = { get: (k) => (k in m ? m[k] : null), set: (k, v) => { m[k] = v; }, del: (k) => { delete m[k]; } };
    const st = BL25.createStore(be);
    const inp = { group_size: 4, minutes: 120, vibes: ["party", "chaotic"], skill: "mixed", kids: false };
    const rec = st.save(CN24.dealNight(inp, CAT24), "WF25 Rematch Probe").record;
    const rm = BL25.rematch(rec, CAT24, CN24);
    const held = {};
    rec.slots.forEach((s) => { held[s.game_id] = 1; });
    const curve = (slots) => slots.map((s) => s.role).filter((x) => x !== "main");
    return rm.ok && rm.fresh && rm.result.lineup.every((s) => !held[s.game_id]) &&
      JSON.stringify(curve(rm.result.lineup)) === JSON.stringify(curve(rec.slots)) &&
      rm.result.total_est_minutes <= inp.minutes &&
      /curator estimates, not measured times/.test(BL25.lineupAsText(rec));
  })(),
  "held-out deck, zero repeats, role curve preserved, card carries the disclaimer");
check("WF25 shelf CSS: cards + save form styled, print hides the shelf",
  cnCss.includes(".cn-shelf-card") && cnCss.includes(".cn-save-form") &&
  cnCss.includes(".cn-saved-banner") && /\.cn-shelf[^{]*\{[^}]*display: none/.test(cnCss),
  "cabinet styling; paper copies stay the dealt night only");
check("WF25 no ROM/BIOS download phrasing in wave-23 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(blJs + gn23Test),
  "legal lane holds");

// Wave 24 "The Curator, second pass": verified metadata fixes + calibration
// follow-ups + the NES system guide (wave-20 flagged gap).
const byId24 = {};
games.forEach((x) => { byId24[x.id] = x; });
check("WF26 curator facts: the five verified description fixes hold",
  byId24["robotron"].description.includes("1982") && !byId24["robotron"].description.includes("1984") &&
  byId24["alone-dark"].description.includes("Emily Hartwood") && !byId24["alone-dark"].description.includes("Aline") &&
  !/named the genre/.test(byId24["nethack-web"].description) &&
  !/invented the FPS/.test(byId24["doom-1993"].description) &&
  !/granddaddy/.test(byId24["angband-live"].description),
  "robotron 1982 (not 1984, popularized not invented), alone-dark Emily Hartwood, nethack/doom/angband claims corrected");
check("WF26 curator links: Little Alchemy 2 points at the sequel's own site",
  byId24["little-alchemy-2"].url === "https://littlealchemy2.com/",
  "littlealchemy.com is the first game (its page banners the sequel); the entry is the sequel");
check("WF26 curator shelves: three PICO-8 games out of the roguelike bin",
  byId24["celeste-classic"].genre === "action" && byId24["poom"].genre === "action" &&
  byId24["kaaarot"].genre === "multiplayer",
  "celeste-classic = platformer, poom = shooter demake, kaaarot = party brawler (its own description)");
check("WF26 calibration follow-ups: long-form session pins are load-bearing",
  ["type-help", "trevosa", "evolution-of-trust", "codecombat", "tatham-puzzles", "celeste-classic", "poom"]
    .every((id) => CN24.SESSION_OVERRIDES[id] != null &&
      CN24.SESSION_OVERRIDES[id] !== CN24.estimateSession({ genre: byId24[id].genre, tags: byId24[id].tags || [] })),
  "type-help 45, trevosa/evolution-of-trust/codecombat 30, tatham 20, celeste/poom 20 — no dead pins");
check("WF26 calibration follow-ups: cabinets seat two, lobbies seat eight",
  ["1942", "centipede", "defender", "galaga88", "missile-command", "robotron", "space-invaders", "tempest", "sfa2", "bubble-bobble-2"]
    .every((id) => CN24.estimateCapacity(byId24[id]) === 2) &&
  CN24.estimateCapacity(byId24["jstris"]) === 8 && CN24.SCORING_VERSION === "2.2.0",
  "a shooter tag is not an 8-seat lobby; jstris is a lobby despite the puzzle shelf; scoring v2.2.0");
check("WF26 NES guide: record + page + hub card + pack, all wired",
  guides.some((g) => g.id === "system-guide-nes" && g.slug === "nes" && g.section_count === 7) &&
  fs.readFileSync(path.join(ROOT, "guides/nes.html"), "utf8").includes("player.html?core=nes") &&
  fs.readFileSync(path.join(ROOT, "guides/nes.html"), "utf8").includes("FCEUmm") &&
  fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes("guides/nes.html") &&
  packs.some((p) => p.system_id === "nes" && p.guide_slug === "nes" && p.entries.length >= 3),
  "the wave-20 flagged NES gap is closed: guide, deep link, hub card, starter pack");
check("WF26 no ROM/BIOS download phrasing in wave-24 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(
    fs.readFileSync(path.join(ROOT, "guides/nes.html"), "utf8")),
  "legal lane holds");

// ---- Wave 25: rotation-4 follow-ups — the cheat-code guide (wave 20's
// last flagged gap), the DuckStation license re-check with a clean source,
// and the cozy/horror taxonomy call (evidence + recommendation recorded in
// WAVELOG; deliberately NO reshelve without a human call).
const cheatHtml = fs.readFileSync(path.join(ROOT, "guides/cheat-codes.html"), "utf8");
const emuEnv25 = load("data/v1/emulators.json");
const duck25 = (emuEnv25.emulators || emuEnv25).find((e) => e.id === "duckstation");
check("WF27 cheat-code guide: record + page + hub card + sitemap, all wired",
  guides.some((g) => g.id === "cheat-codes" && g.slug === "cheat-codes" && g.section_count === 8) &&
  cheatHtml.includes('class="guide-page"') && cheatHtml.includes("coin-plate") &&
  cheatHtml.includes("assets/js/guide-toc.js") && cheatHtml.includes("assets/js/arcade.js") &&
  fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8").includes("guides/cheat-codes.html") &&
  fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").includes("<loc>guides/cheat-codes.html</loc>") &&
  fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8").includes("cheat-codes"),
  "the wave-20 flagged cheat-code gap is closed: guide, record, hub card, sitemap, llms");
check("WF27 cheat-code guide: the verified facts are the ones on the page",
  cheatHtml.includes("Hashimoto") && cheatHtml.includes("Gradius") && cheatHtml.includes("30 lives") &&
  cheatHtml.includes("Codemasters") && cheatHtml.includes("Galoob") &&
  cheatHtml.includes("Lewis Galoob Toys") && cheatHtml.includes("compare") &&
  cheatHtml.includes("GameShark") && cheatHtml.includes("Datel") && cheatHtml.includes("EJS_cheats"),
  "konami-code origin, genie makers + compare byte, the 1992 ruling, datel/interact, player wiring");
check("WF27 DuckStation license corrected with evidence (relicensing verified outside the repo)",
  !!duck25 && duck25.license === "CC BY-NC-ND 4.0" && /Sept 2024/.test(duck25.notes) &&
  /GPL-3\.0 until then/.test(duck25.notes),
  "was GPL-3.0 in the catalog; upstream commit 9ca6b54 (Sept 2024) dropped GPLv3 for PolyForm Strict, then CC BY-NC-ND 4.0");
check("WF27 taxonomy call recorded, games NOT reshelved (human call pending)",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  fs.readFileSync(path.join(ROOT, "WAVELOG.md"), "utf8").includes("Taxonomy recommendation"),
  "purrgatory + lookouts stay in horror until a human rules; evidence + recommendation live in the wave-25 WAVELOG entry");
check("WF27 no ROM/BIOS download phrasing in wave-25 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(cheatHtml),
  "legal lane holds");

// ---- Wave 26: accuracy sweep — the blanket-claim audit. Wave 25 corrected
// DuckStation's record to CC BY-NC-ND 4.0 (source-available, not open
// source), which made every blanket "emulators are open-source" line on
// the site strictly false. The flagged emulation-hub hero is corrected,
// the same blanket in the how-emulation-works legal note is corrected,
// and the audit's other findings are pinned here so they cannot regress.
const emuHtml26 = fs.readFileSync(path.join(ROOT, "emulation.html"), "utf8");
const howEmu26 = fs.readFileSync(path.join(ROOT, "guides/how-emulation-works.html"), "utf8");
const playLegal26 = fs.readFileSync(path.join(ROOT, "play-legal.html"), "utf8");
check("WF28 hero copy: the blanket open-source claim is gone from the emulation hub",
  emuHtml26.includes("legal, fascinating, and mostly open-source") &&
  !emuHtml26.includes("legal, open-source, and fascinating"),
  "one of the ten catalog emulators (DuckStation) is source-available since Sept 2024, not open source");
check("WF28 guide legal note: the same blanket is gone from how-emulation-works",
  howEmu26.includes("legal, and mostly open-source") &&
  !howEmu26.includes("legal and open-source"),
  "the legal note now matches the catalog's own license data");
check("WF28 audit — specific claims that checked out stay exactly as written",
  playLegal26.includes("EmulatorJS, RetroArch, mGBA — all legal, all open-source") &&
  fs.readFileSync(path.join(ROOT, "player.html"), "utf8").includes("Powered by the open-source") &&
  fs.readFileSync(path.join(ROOT, "guides/best-emulator-per-system.html"), "utf8")
    .includes("emulators are legal software. They ship with zero games"),
  "the named three are GPL-3.0/GPL-3.0/MPL-2.0 in data/v1/emulators.json; the best-emulator note claims legality, not licenses");
check("WF28 audit — emulator catalog licenses still sum to nine open + one source-available",
  (emuEnv25.emulators || []).filter((e) => e.license !== "CC BY-NC-ND 4.0").length === 9 &&
  (emuEnv25.emulators || []).length === 10,
  "'mostly' is the accurate word for 9 of 10");
check("WF28 audit — Mindustry's unverifiable superlative is softened, its verified claim kept",
  byId24["mindustry"].description.includes("Open-source factory defense") &&
  !byId24["mindustry"].description.includes("full game") &&
  byId24["mindustry"].description.includes("runs right in your browser"),
  "GPL-3.0 verified outside the repo; 'the web build is the full game' could not be, so it no longer ships");
check("WF28 no ROM/BIOS download phrasing in wave-26 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(emuHtml26 + howEmu26),
  "legal lane holds");

// ---- Wave 27: the taxonomy brief + Curator pass 3. The brief
// (TAXONOMY_BRIEF.md) puts the cozy/horror call in front of a human
// with the evidence and decides nothing — both games stay pinned in
// horror below. Pass 3 verified the retro shelf's year/maker claims
// against sources outside the repo: fourteen stand as written, and
// two entries are corrected (1942's origin claim, Transport Tycoon's
// unnamed edition).
const brief27 = fs.readFileSync(path.join(ROOT, "TAXONOMY_BRIEF.md"), "utf8");
check("WF29 brief: the human decision brief exists with census effect + recommendation",
  brief27.includes("UNDECIDED") && brief27.includes("horror 6 → 4, cozy 16 → 18") &&
  brief27.includes("**Move purrgatory and Lookouts to cozy"),
  "one page, evidence first, nothing decided for the human");
check("WF29 brief: the Spooky Town case rides the same ruling",
  brief27.includes("Little Troubles in Spooky Town") && brief27.includes("Cozy, Cute, Ghosts"),
  "its own itch page tags it Cozy/Cute/Wholesome (checked 2026-10-12)");
check("WF29 taxonomy: STILL not reshelved — brief asks, tests pin",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF29 curator pass 3 — 1942 corrected to the claim that checks out",
  byId24["1942"].description.includes("first of the 19XX series") &&
  !byId24["1942"].description.includes("granddaddy"),
  "the shmup lineage runs through Space Invaders (1978) and Xevious (1982), not 1942");
check("WF29 curator pass 3 — Transport Tycoon names the edition it links",
  byId24["transport-tycoon"].description.includes("1995 Deluxe edition (the original is 1994)") &&
  byId24["transport-tycoon"].url.includes("Transport_Tycoon_Deluxe_1995"),
  "original Nov 1994; the linked archive build is the 1995 Deluxe edition");
check("WF29 curator pass 3 — verified tranche stands as written",
  byId24["tempest"].description.includes("first game with a selectable starting level") &&
  byId24["missile-command"].description.includes("six cities with three batteries") &&
  byId24["master-of-orion"].description.includes("The 1993 4X that named the genre") &&
  byId24["galaga88"].description.includes("triple-ship power-ups"),
  "Tempest's SkillStep, Missile Command's 6 cities/3 bases, the 4X coinage, the triple fighter — all confirmed outside the repo");
check("WF29 no ROM/BIOS download phrasing in wave-27 files",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(brief27),
  "legal lane holds");

// ---- Wave 28: Curator pass 4 — the Flash-era (Ruffle shelf)
// year/creator claims, verified outside the repo. Three stand as
// written; two attribution fixes: Alien Hominid's Flash prototype
// was Fulp & Paladin's, not The Behemoth's (the company formed
// after it), and Dad 'n Me's singular possessive dropped Paladin.
// Taxonomy untouched again — the brief's call stays UNDECIDED.
check("WF30 curator pass 4 — Alien Hominid credits the Flash game's actual makers",
  byId24["alien-hominid-flash"].description.startsWith("Tom Fulp and Dan Paladin's 2002") &&
  !byId24["alien-hominid-flash"].description.includes("Behemoth"),
  "Fulp (code) + Paladin (art), Newgrounds Aug 2002; The Behemoth formed afterwards");
check("WF30 curator pass 4 — Dad 'n Me credits both makers",
  byId24["dad-n-me"].description.startsWith("Tom Fulp and Dan Paladin's 2005"),
  "July 27, 2005; the game's own credits split programming (Fulp) and art (Paladin)");
check("WF30 curator pass 4 — verified tranche stands as written",
  byId24["fancy-pants-1"].description.startsWith("Brad Borne's 2006") &&
  byId24["achievement-unlocked"].description.startsWith("John Cooney's 2008") &&
  byId24["achievement-unlocked"].description.includes("100 achievements") &&
  byId24["time-fcuk"].description.startsWith("Edmund McMillen's 2009"),
  "Borne (World 1, Mar 14 2006), Cooney (Dec 17 2008, exactly 100), McMillen (Sep 16 2009)");
check("WF30 curator pass 4 — the shelf's other four carry no year/creator claim",
  ["canabalt", "line-rider", "happy-wheels", "qwop"].every((id) =>
    !/\b(19|20)\d\d\b/.test(byId24[id].description)),
  "nothing unverified left on the Ruffle shelf");
check("WF30 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF30 no ROM/BIOS download phrasing in wave-28 entries",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(
    byId24["alien-hominid-flash"].description + byId24["dad-n-me"].description),
  "legal lane holds");

// ---- Wave 29: Curator pass 5 — the DOS / shareware and early-PC
// shelf's year/maker claims, verified outside the repo. Sixteen of
// seventeen stand as written; one edition fix: Prince of Persia's
// bare 1990 was the DOS port it links — the game is Mechner's 1989
// Apple II original, and the entry now names the port (the
// Transport Tycoon shape). Taxonomy untouched — UNDECIDED still.
check("WF31 curator pass 5 — Prince of Persia names the edition it links",
  byId24["prince-of-persia"].description.includes("its 1990 DOS port (the Apple II original is 1989)") &&
  byId24["prince-of-persia"].url.includes("msdos_Prince_of_Persia_1990"),
  "Apple II original 1989; the linked archive build is the 1990 DOS port");
check("WF31 curator pass 5 — the named makers stand as written",
  byId24["zork1"].description.includes("The 1980 text adventure") &&
  byId24["simcity-1989"].description.includes("Will Wright's 1989 original") &&
  byId24["monkey-island"].description.includes("Lucasfilm Games' 1990") &&
  byId24["lemmings-1991"].description.includes("DMA Design's 1991") &&
  byId24["theme-park"].description.includes("Bullfrog's 1994"),
  "Zork I (Dec 1980), Wright's SimCity (Feb 1989), Lucasfilm Games (Oct 1990), DMA Design (Feb 1991), Bullfrog (1994)");
check("WF31 curator pass 5 — the four shareware episodes stand as written",
  byId24["wolfenstein-3d"].description.includes("1992 shareware episode") &&
  byId24["doom-1993"].description.includes("1993 shareware episode") &&
  byId24["quake-shareware"].description.includes("id Software's 1996") &&
  byId24["duke3d-shareware"].description.includes("Hollywood Holocaust"),
  "May 5 1992 / Dec 10 1993 / Jun 22 1996 / Jan 29 1996 shareware releases, each entry linking its episode");
check("WF31 curator pass 5 — the similar DOS claims stand as written",
  byId24["oregon-trail"].description.startsWith("The 1990 DOS classic") &&
  byId24["oregon-trail-deluxe"].description.startsWith("The 1992 deluxe edition") &&
  byId24["civ1"].description.includes("the 1991 original 4X") &&
  byId24["railroad-tycoon"].description.includes("Sid Meier's 1990") &&
  byId24["keen-dreams"].description.includes("id's 1991 fever dream"),
  "MECC's DOS editions (1990/1992), Civilization (Sep 1991), Meier's Railroad Tycoon (1990), Keen Dreams the game (1991)");
check("WF31 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF31 no ROM/BIOS download phrasing in wave-29 entries",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(
    byId24["prince-of-persia"].description),
  "legal lane holds");

// ---- Wave 30: the full-catalog claim census. Wave 29 closed
// the Curator's named list; this wave counts what no pass ever
// scoped — every year/maker/superlative claim in all 213
// descriptions, by the definitions in test_curator30. Finding:
// 119 claim instances across 72 entries; 88 verified in waves
// 24–29; 31 instances across 29 entries remain unverified
// (5 year, 19 maker/attribution, 7 superlative), each named in
// test_curator30's remainder lists. Nothing was fixed or
// reshelved this wave — the census is the finding.
check("WF32 census: the catalog and claim totals reconcile",
  games.length === 213 &&
  games.filter((g) => /\b(19|20)\d\d\b/.test(g.description)).length === 46,
  "213 entries; 46 explicit-year hits = 45 verified year claims + 2048's title number (wave 31 removed the 47th)");
check("WF32 census: the year remainder is closed (wave 31)",
  byId24["urban-dead"].description.includes("2005") &&
  byId24["minecraft-classic"].description.includes("2009") &&
  byId24["dare-to-doku"].description.includes("2026") &&
  !/\b(19|20)\d\d\b/.test(byId24["recoil-foundry"].description) &&
  byId24["adventure-capitalist"].description.includes("2014"),
  "three verified as written; recoil-foundry's unsettled 2026 removed; AdVenture Capitalist corrected 2015 → 2014");
check("WF32 census: the maker tranche stood as counted (closed by wave 32 — see WF35)",
  byId24["song-maker"].description.includes("Google's") &&
  byId24["doing-work"].description.includes("Pippin Barr's") &&
  byId24["chogue"].description.includes("Jonathan Lessard's") &&
  byId24["subway-surfers"].description.includes("SYBO's") &&
  byId24["sort-the-court"].description.includes("Graebor's") &&
  byId24["nested"].description.includes("Cookie Clicker creator") &&
  byId24["tristram"].description.includes("Ludum Dare 55"),
  "named makers, official-status and provenance claims — the 18-instance tranche test_curator30 counted and test_curator32 closed");
check("WF32 census: the superlative remainder is closed (wave 31)",
  byId24["canabalt"].description.includes("popularized the endless runner") &&
  byId24["cookie-clicker"].description.includes("popularized idle games") &&
  byId24["agar"].description.includes("defined .io games") &&
  !byId24["powder-game"].description.includes("original") &&
  byId24["spelunky-classic"].description.includes("The original free Spelunky"),
  "four verified as written, two softened to the record's own verb, one false 'original' removed");
check("WF32 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF32 no ROM/BIOS download phrasing in the census remainder entries",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(
    byId24["urban-dead"].description + byId24["canabalt"].description +
    byId24["sort-the-court"].description),
  "legal lane holds");

// ---- Wave 31: Curator pass 6 — the census remainder's
// superlatives and years, worked in the wave-30 order. Four
// superlatives and three years stand as written; Canabalt and
// Cookie Clicker are softened to "popularized" (the record's own
// verb — Ovenbreak predates Canabalt, Cow Clicker/Candy Box!
// predate Cookie Clicker); Powder Game's false "original" and
// Recoil Foundry's unsettled "2026 jam gem" are removed;
// AdVenture Capitalist's year is corrected to the 2014 its
// linked Kongregate edition owns, settling its Hyper Hippo
// maker claim in passing. Census: 117 instances, 99 verified,
// 18 unverified — all maker/attribution. Taxonomy untouched.
check("WF33 curator pass 6 — the verified superlatives stand as written",
  byId24["agar"].description.includes("defined .io games") &&
  byId24["celeste-classic"].description.includes("The original PICO-8 Celeste") &&
  byId24["spelunky-classic"].description.includes("The original free Spelunky") &&
  byId24["minecraft-classic"].description.includes("original 32 blocks"),
  "Agar.io birthed the .io genre; Celeste Classic is the 2015 PICO-8 original; Spelunky Classic is the 2008 freeware; Mojang's own statement gives Minecraft Classic 32 blocks");
check("WF33 curator pass 6 — the two 'popularized' fixes carry the record's verb",
  byId24["canabalt"].description ===
    "The one-button endless runner that popularized the endless runner. Jump or die." &&
  byId24["cookie-clicker"].description ===
    "The idle game that popularized idle games. Bake cookies. Achieve absurdity.",
  "Wikipedia credits both with popularizing their genres; neither started or defined them");
check("WF33 curator pass 6 — the two closures by removal",
  byId24["powder-game"].description ===
    "A falling-sand toy: pour powder, water, fire, and acid into a sandbox and watch the physics play out." &&
  byId24["recoil-foundry"].description ===
    "Build one gun whose recoil throws you across a factory. Movement IS the weapon — master the kick.",
  "Powder Game (2007) is not the falling-sand original (2005 Dofi-Blog applet); Recoil Foundry's own page names no jam and no year");
check("WF33 curator pass 6 — the verified years stand, the one edition fix holds",
  byId24["urban-dead"].description.includes("A 2005 classic") &&
  byId24["dare-to-doku"].description.includes("GBA Jam 2026") &&
  byId24["adventure-capitalist"].description ===
    "Hyper Hippo's capitalist clicker: lemonade stands to moon shoes, the idle game that ate 2014 — officially on Kongregate.",
  "Urban Dead launched July 3, 2005; Dare to Doku's own page names GBA Jam 2026; AdVenture Capitalist launched on Kongregate May 30, 2014 and was its most played game of 2014");
check("WF33 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF33 no ROM/BIOS download phrasing in wave-31 entries",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(
    byId24["canabalt"].description + byId24["powder-game"].description +
    byId24["recoil-foundry"].description + byId24["adventure-capitalist"].description),
  "legal lane holds");

// ---- Wave 31 flagship: the Arcade Passport. A stamp booklet for
// the 24 collections: a stamp lands only when a shelf actually
// scrolls into view on collections.html (IntersectionObserver,
// first sighting wins); guide marks derive live from the guides'
// own checklist store (bm_checks_v1). State bm.passport.v1,
// browser-local, no play telemetry invented.
const PP31 = require(path.join(ROOT, "assets/js/passport-core.js"));
const ppCoreJs = fs.readFileSync(path.join(ROOT, "assets/js/passport-core.js"), "utf8");
const ppHtml = fs.readFileSync(path.join(ROOT, "passport.html"), "utf8");
const colHtml31 = fs.readFileSync(path.join(ROOT, "collections.html"), "utf8");
const colJs31 = fs.readFileSync(path.join(ROOT, "assets/js/collections.js"), "utf8");
check("WF34 passport core: UMD, DOM-free, storage key + honesty registry",
  ppCoreJs.includes("STORE_KEY = 'bm.passport.v1'") && ppCoreJs.includes("typeof module") &&
  !/document\.|window\./.test(ppCoreJs) && PP31.STORE_KEY === "bm.passport.v1" &&
  PP31.GUIDE_CHECKLISTS.length === 2 &&
  typeof PP31.stamp === "function" && typeof PP31.guideMarks === "function",
  "bm.passport.v1; marks derive from the checklist store, never stored twice");
check("WF34 passport core: stamp semantics — first sighting wins, corrupt entries dropped",
  (() => {
    const s = PP31.emptyState();
    const added = PP31.stamp(s, "rainy-day-cozy", 1000);
    const redated = PP31.stamp(s, "rainy-day-cozy", 2000);
    const clean = PP31.validateState({ stamps: { a: 5, b: "x", c: -1, d: 7 } });
    return added && !redated && s.stamps["rainy-day-cozy"] === 1000 &&
      PP31.stampCount(clean) === 2 && clean.stamps.a === 5 && clean.stamps.d === 7;
  })(),
  "re-visits never re-date; validation is per-entry, not all-or-nothing");
check("WF34 passport core: a guide mark means every checklist step ticked",
  (() => {
    const partial = PP31.guideMarks((p) => (p === "retroarch-setup" ? [0, 1, 2] : []));
    const full = PP31.guideMarks((p) => [0, 1, 2, 3, 4]);
    return partial[0].ticked === 3 && !partial[0].complete &&
      full.every((m) => m.complete) && full.length === 2;
  })(),
  "partial progress reported as progress; the mark is all-steps or nothing");
check("WF34 passport page: booklet wired, honest counting copy, nav present",
  ppHtml.includes('id="stamp-grid"') && ppHtml.includes('id="visa-list"') &&
  ppHtml.includes("assets/js/passport-core.js") && ppHtml.includes("assets/js/passport.js") &&
  ppHtml.includes("never claims you played") && ppHtml.includes('href="passport.html" aria-current="page"') &&
  ppHtml.includes("Surrender passport"),
  "stamp grid + visa pages + the no-play-telemetry disclaimer on the page itself");
check("WF34 collections wiring: observer stamps, chip counts, core loaded before the page script",
  colJs31.includes("IntersectionObserver") && colJs31.includes("stampShelf") &&
  colJs31.includes("passport-chip") && colHtml31.includes('id="passport-chip"') &&
  colHtml31.indexOf("assets/js/passport-core.js") < colHtml31.indexOf("assets/js/collections.js") &&
  colHtml31.includes("assets/css/passport.css"),
  "shelves stamp on first view; the chip reads the same store the booklet renders");
check("WF34 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF34 no ROM/BIOS download phrasing on the passport page",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(ppHtml),
  "legal lane holds");

// ---- Wave 32: Curator pass 7 — the final tranche. All 18
// maker/attribution claims worked against sources outside the
// repo: 17 stand as written (publishers' own pages, makers' own
// sites/repos, Wikipedia, MobyGames); Chogue's singular
// possessive is fixed to co-credit Jonathan Lessard alongside
// Pippin Barr (the Dad 'n Me shape); Run 3's link moves from the
// author's blog root to /run/3/, the game's own page on the same
// domain. Census CLOSED: 117 instances, all verified, 0 left.
check("WF35 curator pass 7 — the verified makers stand as written",
  byId24["codenames"].description === "The official online version of the word-association party classic." &&
  byId24["song-maker"].description.includes("Google's") &&
  byId24["nested"].description.includes("from the Cookie Clicker creator") &&
  byId24["tristram"].description.includes("Made in 72 hours for Ludum Dare 55") &&
  byId24["vampire-survivors"].description.includes("The official web demo") &&
  byId24["tatham-puzzles"].description.includes("official JavaScript builds"),
  "CGE's own Codenames site; Google's Song Maker; Orteil's Nested; Tristram's own LD55 line; poncle's own demo FAQ; Tatham's own JS builds");
check("WF35 curator pass 7 — the official-status and linked-build claims stand",
  byId24["subway-surfers"].description.includes("officially on Poki") &&
  byId24["stickman-hook"].description.includes("officially on Poki") &&
  byId24["realm-grinder"].description.includes("officially on Kongregate") &&
  byId24["realm-grinder"].url.includes("kongregate.com/games/divinegames/") &&
  byId24["synergism"].url.includes("pseudo-corp.github.io/SynergismOfficial/") &&
  byId24["stumble-guys"].description.includes("Scopely's official web version"),
  "SYBO/Poki partnership pages; Madbox credited on its Poki page; Divine Games' own Kongregate upload; Pseudo-Corp's own Pages build; Scopely's own web version");
check("WF35 curator pass 7 — Chogue co-credits its second maker",
  byId24["chogue"].description ===
    "Chess meets roguelike: every piece you capture joins your party for a dungeon crawl. Pippin Barr and Jonathan Lessard's strangest hybrid." &&
  !byId24["chogue"].description.includes("Pippin Barr's"),
  "the game's own repo/press kit name Jonathan Lessard and Pippin Barr as its creators");
check("WF35 curator pass 7 — Run 3 links the game, not the author's blog root",
  byId24["run-3"].url === "https://www.player03.com/run/3/" &&
  byId24["run-3"].description.includes("Player03's"),
  "player03.com's root is now the author's blog; /run/3/ is the release's official author page on the same domain");
check("WF35 census closed: no claim type has an unverified remainder",
  games.length === 213 &&
  games.filter((g) => /\b(19|20)\d\d\b/.test(g.description)).length === 46,
  "117 of 117 instances verified (45 year + 50 maker + 22 superlative); test_curator30's gate keeps the census closed");
check("WF35 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF35 no ROM/BIOS download phrasing in wave-32 entries",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(
    byId24["chogue"].description + byId24["run-3"].description + byId24["nested"].description),
  "legal lane holds");

// ---- Wave 32 flagship: Tournament Night. A bracket night whose
// entrants are real catalog games: a saved lineup or a collection
// seeds a single-elimination bracket in source order on the
// existing bracket engine (bracket.js); picks persist in
// bm.tournament-night.v1; the champion and the results card
// derive from the bracket only. Core: tournament-night-core.js.
const TN32 = require(path.join(ROOT, "assets/js/tournament-night-core.js"));
const tnCoreJs = fs.readFileSync(path.join(ROOT, "assets/js/tournament-night-core.js"), "utf8");
const tnHtml = fs.readFileSync(path.join(ROOT, "tournament-night.html"), "utf8");
check("WF36 tournament night core: UMD over the existing bracket engine, storage key registered",
  TN32.STORE_KEY === "bm.tournament-night.v1" && tnCoreJs.includes("require('./bracket.js')") &&
  tnCoreJs.includes("root.Bracket") && typeof TN32.createNight === "function" &&
  typeof TN32.resultsCard === "function",
  "bm.tournament-night.v1; bracket math delegated to bracket.js, never reinvented");
check("WF36 tournament night: entrants resolve from a real collection, in source order",
  (() => {
    const byIdMap = {}; games.forEach((g) => { byIdMap[g.id] = g; });
    const col = cols.find((c) => c.id === "rainy-day-cozy");
    const built = TN32.entrantsFromCollection(col, byIdMap);
    const res = TN32.createNight({ source: { type: "collection", id: col.id, name: col.title }, entrants: built.entrants, now: 1000 });
    return built.skipped.length === 0 && res.ok &&
      JSON.stringify(res.night.bracket.players) === JSON.stringify(col.game_ids.map((id) => byIdMap[id].title)) &&
      res.night.entrants.length === col.game_ids.length;
  })(),
  "seeds are the collection's real games, first game = top seed");
check("WF36 tournament night: picks advance on bracket.js and crown a real champion",
  (() => {
    const byIdMap = {}; games.forEach((g) => { byIdMap[g.id] = g; });
    const four = ["2048", "wordle", "tetrio", "connections"].map((id) => byIdMap[id]);
    const res = TN32.createNight({ source: { type: "collection", id: "t", name: "T" }, entrants: four, now: 1000 });
    const n = res.night;
    TN32.pick(n, 0, 0, "a"); TN32.pick(n, 0, 1, "b");
    const fin = TN32.pick(n, 1, 0, "a");
    const champ = TN32.champion(n);
    return fin.ok && champ && champ.id === "2048" && TN32.progress(n).complete &&
      TN32.resultsCard(n).includes("CHAMPION: 2048") && TN32.resultsCard(n).includes(champ.url);
  })(),
  "two semifinals + a final on the shared engine; the card names the champion with its real play URL");
check("WF36 tournament night: a corrupt stored night is dropped whole, never half-rendered",
  TN32.loadNight({ getItem: () => JSON.stringify({ v: 1, name: "X", entrants: [] }), setItem: () => {}, removeItem: () => {} }) === null &&
  TN32.createNight({ source: { type: "collection", id: "t", name: "T" }, entrants: [games[0]] }).ok === false,
  "validation is whole-bracket; a one-game source refuses with a plain reason");
check("WF36 tournament night page: marquee, one primary action, core before UI, nav present",
  tnHtml.includes('id="tn-start"') && tnHtml.includes("Start the night") &&
  tnHtml.includes('id="tn-bracket"') && tnHtml.includes('id="tn-card-text"') &&
  tnHtml.indexOf("assets/js/bracket.js") < tnHtml.indexOf("assets/js/tournament-night-core.js") &&
  tnHtml.indexOf("assets/js/tournament-night-core.js") < tnHtml.indexOf("assets/js/tournament-night.js") &&
  tnHtml.includes('href="tournament-night.html" aria-current="page"') &&
  tnHtml.includes("No invented games. No invented results."),
  "seed → bracket → champion → results card, wired in dependency order");
check("WF36 tournament night: lineup sources read the shelf's own store, never a copy",
  fs.readFileSync(path.join(ROOT, "assets/js/tournament-night.js"), "utf8").includes("BMCuratorLineups.createStore()") &&
  fs.readFileSync(path.join(ROOT, "assets/js/tournament-night.js"), "utf8").includes("entrantsFromLineup"),
  "saved lineups resolve through curator-night-lineups.js against the live catalog");
check("WF36 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF36 no ROM/BIOS download phrasing on the tournament night page",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(tnHtml),
  "legal lane holds");

// ---- Wave 33 flagship: Versus. Any two catalog games side by side
// from their real records (versus-core.js): year named in the
// description under the census's rules, collection footprint,
// genre/controls/tags, Kids corner pass, written coverage. The
// verdict strip reports only what the data supports; thin pairs
// get the no-basis state. No scores, rankings, or winners, ever.
const VS33 = require(path.join(ROOT, "assets/js/versus-core.js"));
const vsHtml = fs.readFileSync(path.join(ROOT, "versus.html"), "utf8");
const vsCtx = { collections: cols, kidIds: new Set((load("data/v1/kid-safe.json")["kid-safe"] || []).filter((k) => k.kid_safe).map((k) => k.id)) };
check("WF37 versus core: UMD, no bracket/storage deps, dive registry names only existing dives",
  typeof VS33.compare === "function" && typeof VS33.shareCard === "function" &&
  Object.keys(VS33.GENRE_DIVES).sort().join(",") === "cozy,roguelike",
  "comparison is pure record math over the catalog, nothing else");
check("WF37 versus: the year rule matches the closed census (45 dated records, 2048 excluded)",
  games.filter((g) => VS33.profile(g, vsCtx).year !== null).length === 45 &&
  VS33.yearNamed(byId24["2048"].description, "2048") === null &&
  VS33.yearNamed(byId24["zork1"].description, "zork1") === 1980,
  "every year Versus can show is a census-verified description claim");
check("WF37 versus: verdicts fire only on era/footprint/coverage/Kids facts, never quality language",
  (() => {
    const c = VS33.compare(byId24["zork1"], byId24["2048"], vsCtx);
    return c.ok && !c.thin && c.verdicts.length === 1 && c.verdicts[0].kind === "footprint" &&
      !/score|rating|better|winner|best/i.test(c.verdicts.map((v) => v.text).join(" ")) &&
      VS33.compare(byId24["wordle"], byId24["wordle"], vsCtx).ok === false;
  })(),
  "one-sided year stays silent; self-pairing refuses; no winner is ever declared");
check("WF37 versus: the bare tail gets the honest no-basis state",
  (() => { const t = VS33.compare(byId24["kaaarot"], byId24["bloxd"], vsCtx); return t.ok && t.thin && t.verdicts.length === 0; })() &&
  VS33.shareCard(VS33.compare(byId24["kaaarot"], byId24["bloxd"], vsCtx), "").includes("No basis to compare"),
  "no year/shelf/tag/coverage/Kids pass on either side → the strip reports nothing");
check("WF37 versus: pairing validates against the catalog (unknown ids drop)",
  (() => { const p = VS33.parsePair("?a=zork1&b=no-such-game", byId24); return p.a === "zork1" && p.b === null && p.dropped[0] === "no-such-game"; })(),
  "versus.html?a=&b= state is catalog-checked on load");
check("WF37 versus page: two pickers, verdict strip, share card, core before UI, nav present",
  vsHtml.includes('id="vs-a"') && vsHtml.includes('id="vs-b"') && vsHtml.includes('id="vs-verdict"') &&
  vsHtml.includes('id="vs-card-text"') && vsHtml.includes("No scores. No rankings. No invented winner.") &&
  vsHtml.indexOf("assets/js/versus-core.js") < vsHtml.indexOf("assets/js/versus.js") &&
  vsHtml.includes('href="versus.html" aria-current="page"'),
  "call the pairing → records → strip → card, wired in dependency order");
check("WF37 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");
check("WF37 no ROM/BIOS download phrasing on the versus page",
  !/\b(roms?|bios)\b.{0,40}\bdownload\b|\bdownload\b.{0,40}\b(roms?|bios)\b/i.test(vsHtml),
  "legal lane holds");

// ---- Foundry round 2 + QA-006: social-card wiring and the
// one-h1 homepage. The OG card (Foundry, gate-passed) lives at
// assets/og-card.png; every page head carries the og:/twitter:
// block immediately after its description meta, reusing that
// page's own <title> and description verbatim — no invented
// copy. Page heads are source (the build regenerates only
// llms/sitemap/data), so the block survives rebuilds by
// construction; these checks are the tripwire that fails the
// suite if any page ever loses it.
const allPages38 = [];
(function walk38(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== ".git" && !full.includes(path.join("assets", "vendor"))) walk38(full); }
    else if (e.name.endsWith(".html")) allPages38.push(full);
  }
}(ROOT));
check("WF38 og card: the Foundry asset is in the repo at the canonical path, 1200x630",
  (() => {
    try {
      const buf = fs.readFileSync(path.join(ROOT, "assets/og-card.png"));
      return buf.length > 10000 && buf.readUInt32BE(16) === 1200 && buf.readUInt32BE(20) === 630;
    } catch (e) { return false; }
  })(),
  "assets/og-card.png — the arcade-cabinet card, copied per the Foundry manifest");
check("WF38 og wiring: every page carries og:image + summary_large_image, titles/descriptions reused verbatim",
  allPages38.length === 46 && allPages38.every((f) => {
    const t = fs.readFileSync(f, "utf8");
    const title = (t.match(/<title>([^<]*)<\/title>/) || [])[1];
    const desc = (t.match(/<meta name="description" content="([^"]*)">/) || [])[1];
    const img = (t.match(/<meta property="og:image" content="([^"]*)">/) || [])[1];
    return title && desc && img && img.endsWith("assets/og-card.png") &&
      t.includes('<meta name="twitter:card" content="summary_large_image">') &&
      t.includes('<meta property="og:title" content="' + title + '">') &&
      t.includes('<meta property="og:description" content="' + desc + '">') &&
      t.includes('<meta name="twitter:image" content="' + img + '">') &&
      fs.existsSync(path.resolve(path.dirname(f), img));
  }),
  "46 pages; og:image resolves to a real file from every page's depth; no invented copy");
check("WF38 QA-006: homepage has exactly one h1 — the hero title; the cabinet marquee sign is an h2",
  (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/<h1[\s>]/g) || []).length === 1 &&
  vsHtml && fs.readFileSync(path.join(ROOT, "index.html"), "utf8").includes('<h1 class="hero-title">') &&
  fs.readFileSync(path.join(ROOT, "index.html"), "utf8").includes('<h2 class="marquee-title">'),
  "h1Count = 1 on the homepage (QA Corps round 1, verify-close ready)");
check("WF38 taxonomy: STILL not reshelved — the brief's call stays with the human",
  byId24["purrgatory"].genre === "horror" && byId24["lookouts"].genre === "horror" &&
  byId24["spooky-town"].genre === "horror" &&
  games.filter((g) => g.genre === "horror").length === 6 &&
  games.filter((g) => g.genre === "cozy").length === 16,
  "horror 6 / cozy 16 until a human rules");

process.exit(failures ? 1 : 0);
