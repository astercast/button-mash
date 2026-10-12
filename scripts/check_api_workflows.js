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

process.exit(failures ? 1 : 0);
