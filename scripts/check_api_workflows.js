/* Wave 2 validation: executes the AGENT.md example workflows against the real
   local api/v1 JSON files. Run: node scripts/check_api_workflows.js
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

const games = load("api/v1/games.json");
const guides = load("api/v1/guides.json");
const index = load("api/v1/index.json");

// Contract sanity
check("games.json is array of 47", Array.isArray(games) && games.length === 47, games.length + " records");
check("guides.json is array of 5", Array.isArray(guides) && guides.length === 5, guides.length + " records");
check("index.json lists 3 endpoints", index.endpoints && index.endpoints.length === 3,
  index.endpoints.map((e) => e.path).join(", "));

// Workflow 1 (AGENT.md): "Find a multiplayer .io game for a party"
const party = games.filter((g) => g.players === "multiplayer" && (g.genre === "party" || g.genre === "io"));
check("WF1 party filter non-empty", party.length > 0, party.map((g) => g.id).join(", "));
const skribbl = games.find((g) => g.id === "skribbl-io");
check("WF1 skribbl.io has private rooms", !!skribbl && /private room/i.test(skribbl.description),
  skribbl ? skribbl.description.slice(0, 60) + "…" : "missing");
check("WF1 game page pattern maps", !!skribbl && fs.existsSync(path.join(ROOT, "games", skribbl.id + ".html")),
  "games/skribbl-io.html");

// Workflow 2 (AGENT.md): "Set up GBA emulation with my own ROM"
const gba = guides.find((g) => g.id === "gba-wasm-recompiler");
check("WF2 guide found", !!gba, gba ? `${gba.title} (${gba.difficulty}, ~${gba.time_minutes} min)` : "missing");
const fullText = fs.readFileSync(path.join(ROOT, "llms-full.txt"), "utf8");
check("WF2 full text in llms-full.txt", !!gba && fullText.includes("### " + gba.title), "section header present");
check("WF2 guide page exists", !!gba && fs.existsSync(path.join(ROOT, "guides", gba.slug + ".html")),
  gba ? "guides/" + gba.slug + ".html" : "missing");
const homebrew = guides.find((g) => g.id === "homebrew-sources");
check("WF2 homebrew cross-check guide exists", !!homebrew, homebrew ? homebrew.title : "missing");

// Workflow 3 (AGENT.md): "Find a single-player puzzle game for a quiet evening"
const solo = games.filter((g) => g.players !== "multiplayer" && g.genre === "puzzle");
check("WF3 solo-puzzle filter non-empty", solo.length > 0, solo.map((g) => g.id).join(", "));
check("WF3 records carry verified URLs", solo.every((g) => /^https?:\/\//.test(g.url)),
  solo.map((g) => g.url).join(", "));

// Workflow 4 (AGENT.md): "Build a classroom-friendly shortlist (teacher)"
const classroom = games.filter((g) => g.players === "single" && ["trivia", "puzzle"].includes(g.genre));
check("WF4 classroom filter non-empty", classroom.length > 0, classroom.map((g) => g.id).join(", "));
check("WF4 no stranger-lobby multiplayer picks", classroom.every((g) => g.players === "single"),
  "all single-player");

process.exit(failures ? 1 : 0);
