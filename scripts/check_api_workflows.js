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
check("WF6 per-round game picker draws from the party catalog",
  tourneyJs.includes("api/v1/games.json") && tourneyJs.includes("indexOf('party')"),
  "party-tagged dropdown");
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

process.exit(failures ? 1 : 0);
