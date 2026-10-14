/* Wave 11 validation: pinned fixtures for the Party 2.0 logic module
   (assets/js/party2.js). Covers:
   - guest validation (counts, dupes, bad names)
   - game voting: one vote per guest, re-vote moves, ties -> earliest pick
   - rotation math: 5 guests / 5 slots -> everyone sits out exactly once,
     plays exactly 4 times; 4 guests -> no sit-outs
   - timeline phases: setup -> games -> snack -> tournament -> free play,
     wall-clock labels with a start time
   - share-link encode/decode round-trip + tamper rejections
   - kids-party pool filtering by age band (subset of the 75 curated ids)
   Run: node scripts/test_party11.js
   Exit 0 = all checks pass. */
"use strict";
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const P2 = require(path.join(ROOT, "assets/js/party2.js"));

let failures = 0, total = 0;
function check(name, cond, detail) {
  total++;
  if (cond) { console.log("PASS", name, ", ", detail); }
  else { failures++; console.error("FAIL", name, ", ", detail); }
}

const GAMES = ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"];

// ---- guest validation ----
check("guests: 4 names ok",
  (() => { const p = P2.createParty(["Ana", "Ben", "Cara", "Dev"], {}, GAMES); return !p.error && p.guests.length === 4; })(),
  "createParty accepts 4 guests");
check("guests: rejects 1 guest",
  P2.createParty(["Solo"], {}, GAMES).error != null, "party needs 2+");
check("guests: rejects 17 guests",
  P2.createParty(Array.from({ length: 17 }, (_, i) => "G" + i), {}, GAMES).error != null, "16 max");
check("guests: rejects duplicates",
  P2.createParty(["Ana", "Ana"], {}, GAMES).error != null, "dupe names");
check("guests: rejects script-ish names",
  P2.createParty(["Ana", "<script>"], {}, GAMES).error != null, "bad chars");
check("guests: rejects 33-char name",
  P2.createParty(["Ana", "B" + "x".repeat(33)], {}, GAMES).error != null, "32-char cap");
check("guests: trims whitespace",
  (() => { const p = P2.createParty(["  Ana  ", "Ben"], {}, GAMES); return !p.error && p.guests[0] === "Ana"; })(),
  "collapsed + trimmed");

// ---- voting ----
const vstate = P2.createParty(["Ana", "Ben", "Cara", "Dev"], {}, GAMES);
check("votes: four votes recorded",
  ["Ana", "Ben", "Cara", "Dev"].every((g) => P2.addVote(vstate, g, "g1").ok), "one vote each");
check("votes: re-vote moves the vote",
  (() => { P2.addVote(vstate, "Ana", "g2"); return vstate.votes["Ana"] === "g2" &&
    P2.tally(vstate).find((t) => t.gameId === "g1").count === 3; })(), "Ana moved to g2");
check("votes: tie goes to earliest pick",
  (() => {
    const s = P2.createParty(["A", "B"], {}, GAMES);
    P2.addVote(s, "A", "g3"); P2.addVote(s, "B", "g7");   // 1-1 tie
    return P2.topVoted(s, 2)[0] === "g3";                  // g3 picked first
  })(), "g3 before g7");
check("votes: rejects non-guest voter",
  P2.addVote(vstate, "Zoe", "g1").error != null, "unknown guest");
check("votes: rejects non-candidate game",
  P2.addVote(vstate, "Ana", "evil").error != null, "unknown game");
check("votes: unanimous tally order",
  (() => { const t = P2.tally(vstate); return t[0].gameId === "g1" && t[0].count === 3; })(),
  "g1 leads 3-1");

// ---- rotation math (pinned fixture: 5 guests, 5 slots) ----
const guests5 = ["A", "B", "C", "D", "E"];
const slots5 = guests5.map((_, i) => ({ gameId: "g" + i, hotseat: true }));
const rot = P2.scheduleRotation(guests5, slots5);
const plays = {}, sits = {};
rot.forEach((r) => {
  r.plays.forEach((g) => { plays[g] = (plays[g] || 0) + 1; });
  r.sits.forEach((g) => { sits[g] = (sits[g] || 0) + 1; });
});
check("rotation: 5 guests / 5 hot-seat slots -> everyone plays 4x",
  guests5.every((g) => plays[g] === 4), JSON.stringify(plays));
check("rotation: 5 guests / 5 hot-seat slots -> everyone sits 1x",
  guests5.every((g) => sits[g] === 1), JSON.stringify(sits));
check("rotation: slot 0 plays first 4, sits last",
  rot[0].plays.join(",") === "A,B,C,D" && rot[0].sits.join(",") === "E", "group offset rotates");
check("rotation: 4 guests -> nobody sits out",
  (() => { const r = P2.scheduleRotation(["A", "B", "C", "D"], slots5); return r.every((x) => x.sits.length === 0); })(),
  "group size 4 = full table");
check("rotation: everyone-in game -> all play",
  (() => { const r = P2.scheduleRotation(guests5, [{ gameId: "g0", hotseat: false }]); return r[0].plays.length === 5; })(),
  "arena game");
check("rotation: isHotseat tags",
  P2.isHotseat({ tags: ["party", "drawing"] }) && !P2.isHotseat({ tags: ["party", "arena"] }), "drawing yes / arena no");

// ---- timeline ----
const tl = P2.buildTimeline({ startClock: "19:00", snackMin: 15 }, [
  { gameId: "g1", title: "Game One", start: 0, end: 20 },
  { gameId: "g2", title: "Game Two", start: 20, end: 40 },
], null);
const phases = tl.phases.map((p) => p.phase);
check("timeline: phase order",
  phases.join(",") === "setup,game,snack,game,tournament,freeplay", phases.join(","));
check("timeline: setup starts 30 min before",
  tl.phases[0].start === -30 && tl.phases[0].clockStart === "6:30 PM" && tl.phases[0].clockEnd === "7:00 PM", "wall-clock setup");
check("timeline: snack after slot index 0 of 2 (middle)",
  tl.snackAfterSlot === 0 && tl.phases[2].phase === "snack" && tl.phases[2].clockStart === "7:20 PM", "snack placement");
check("timeline: relative offsets without a start time",
  (() => { const r = P2.buildTimeline({ snackMin: 10 }, [{ gameId: "g1", title: "G", start: 0, end: 20 }], 0);
    return r.phases[0].clockStart === null && r.phases[1].start === 0; })(), "no clock = relative");

// ---- share links ----
const shared = P2.createParty(["Ana", "Ben"], { vibe: "chill", kids: true }, ["g1", "g2"]);
P2.addVote(shared, "Ana", "g2");
const enc = P2.encodeShare(shared);
const dec = P2.decodeShare(enc);
check("share: round-trip",
  dec.ok && dec.state.guests.join(",") === "Ana,Ben" && dec.state.votes["Ana"] === "g2" &&
  dec.state.opts.vibe === "chill" && dec.state.opts.kids === true, "state survives");
check("share: rejects garbage", !P2.decodeShare("!!!not-base64!!!").ok, "bad base64");
check("share: rejects wrong version",
  !P2.decodeShare(Buffer.from(JSON.stringify({ v: 99, guests: ["A", "B"], games: ["g1"] })).toString("base64url")).ok,
  "version gate");
check("share: rejects 17 guests",
  !P2.decodeShare(P2.encodeShare({ version: 1, guests: Array.from({ length: 17 }, (_, i) => "G" + i),
    opts: {}, games: ["g1"], votes: {} })).ok, "guest cap on import");
check("share: rejects dupes on import",
  !P2.decodeShare(P2.encodeShare({ version: 1, guests: ["A", "A"], opts: {}, games: ["g1"], votes: {} })).ok,
  "dupe gate");
check("share: drops votes from non-guests / unknown games",
  (() => {
    const d = P2.decodeShare(Buffer.from(JSON.stringify({
      v: 1, guests: ["A", "B"], opts: {}, games: ["g1"],
      votes: { A: "g1", Zoe: "g1", B: "evil" }
    })).toString("base64url"));
    return d.ok && d.state.votes["A"] === "g1" && !d.state.votes["Zoe"] && !d.state.votes["B"];
  })(), "votes sanitized");

// ---- kids-party pool ----
const kidSafe = JSON.parse(fs.readFileSync(path.join(ROOT, "data/v1/kid-safe.json"), "utf8"))["kid-safe"];
const pool7 = P2.kidPool(kidSafe, "5-7");
const poolAll = P2.kidPool(kidSafe, "11-12");
check("kids pool: 5-7 band is 24 games", pool7.length === 24, pool7.length + " games");
check("kids pool: 11-12 band is all 113", poolAll.length === 113, poolAll.length + " games");
check("kids pool: 5-7 subset of 11-12",
  pool7.every((id) => poolAll.indexOf(id) !== -1), "bands nest");
check("kids pool: only 5-7 age bands",
  pool7.every((id) => kidSafe.find((r) => r.id === id).age_band === "5-7"), "band filter");
check("kids pool: unknown band defaults to full set",
  P2.kidPool(kidSafe, "nope").length === kidSafe.length, "fallback");

// ---- option cleaning ----
check("opts: bad vibe/skill fall back",
  (() => { const o = P2.cleanOpts({ vibe: "wild", skill: "pro" }); return o.vibe === "chaotic" && o.skill === "mixed"; })(),
  "enum fallback");
check("opts: kids + band + format pass through",
  (() => { const o = P2.cleanOpts({ kids: true, kidBand: "5-7", format: "double", snackMin: 20 });
    return o.kids && o.kidBand === "5-7" && o.format === "double" && o.snackMin === 20; })(),
  "kids fields");

console.log("\n" + (total - failures) + "/" + total + " checks passed.");
process.exit(failures ? 1 : 0);
