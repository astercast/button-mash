/* Wow wave 1: unit test for the player.js CRT power helpers.
   Exercises powerOnScreen / powerOffThen / crtMotionOK logic with stubbed
   DOM + timers — the browser-level wiring is covered by test_wow1.js and
   WF20; this pins the branching logic (immediate vs animated path).
   Run: node scripts/test_wow1_powerunit.js — exit 0 = pass. */
"use strict";
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "player.js"), "utf8");

function extract(name) {
  const m = src.match(new RegExp("function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}"));
  if (!m) throw new Error("function not found: " + name);
  return m[0];
}

/* ---- stub world ---- */
const classes = {};
function mkEl() {
  return {
    _cls: [],
    classList: {
      add: function (c) { if (this._l.indexOf(c) === -1) this._l.push(c); },
      remove: function (c) { this._l = this._l.filter((x) => x !== c); },
      contains: function (c) { return this._l.indexOf(c) !== -1; },
      _l: [],
    },
  };
}
const els = { "ejs-screen": mkEl(), "console-shell": mkEl() };
let reduceMotion = false, fxOff = false, curCore = null, crtPref = false;
const timers = [];
function $(id) { return els[id] || null; }
function readDisplay() { return { crt: crtPref, intScale: false, aspect: "fill" }; }
const documentStub = {
  documentElement: { classList: { contains: (c) => c === "fx-off" && fxOff } },
};
const windowStub = {
  matchMedia: (q) => ({ matches: /reduce/.test(q) && reduceMotion }),
};
function setTimeoutStub(fn) { timers.push(fn); return timers.length; }

const prelude = `
var $ = __stub.$, readDisplay = __stub.readDisplay, curCore = __stub.curCore;
var document = __stub.document, window = __stub.window, setTimeout = __stub.setTimeout;
`;
function load() {
  const fns = ["crtMotionOK", "powerOnScreen", "powerOffThen"].map(extract).join("\n");
  const factory = new Function("__stub", prelude + fns +
    "\nreturn { crtMotionOK, powerOnScreen, powerOffThen };");
  return factory({
    $,
    readDisplay: () => readDisplay(),
    get curCore() { return curCore; },
    document: documentStub, window: windowStub, setTimeout: setTimeoutStub,
  });
}

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log("PASS", name, "-", detail);
  else { failures++; console.error("FAIL", name, "-", detail); }
}
function reset() {
  timers.length = 0;
  Object.values(els).forEach((e) => { e.classList._l = []; });
  reduceMotion = false; fxOff = false; curCore = null; crtPref = false;
}

(function () {
  /* crtMotionOK */
  reset();
  let api = load();
  check("motion ok by default", api.crtMotionOK() === true, "no-preference, fx on");
  reduceMotion = true; api = load();
  check("reduced motion blocks it", api.crtMotionOK() === false, "reduce");
  reduceMotion = false; fxOff = true; api = load();
  check("fx-off blocks it", api.crtMotionOK() === false, "fx-off");

  /* powerOnScreen */
  reset(); api = load();
  api.powerOnScreen();
  check("power-on adds the class", els["ejs-screen"].classList.contains("screen-power-on"), "class added");
  check("power-on schedules removal", timers.length === 1, "one timer");
  timers[0]();
  check("power-on timer removes the class", !els["ejs-screen"].classList.contains("screen-power-on"), "cleaned");

  /* powerOffThen: immediate path (no screen) */
  reset(); api = load();
  delete els["ejs-screen"];
  let ran = false;
  api.powerOffThen(() => { ran = true; });
  check("no screen -> immediate", ran === true && timers.length === 0, "fn runs, no delay");
  els["ejs-screen"] = mkEl();

  /* immediate path (no boot: curCore null) */
  reset(); crtPref = true; api = load();
  ran = false;
  api.powerOffThen(() => { ran = true; });
  check("no boot -> immediate even with crt pref", ran === true && timers.length === 0, "curCore null");

  /* immediate path (crt pref off) */
  reset(); curCore = "gba"; crtPref = false; api = load();
  ran = false;
  api.powerOffThen(() => { ran = true; });
  check("crt off -> immediate", ran === true && timers.length === 0, "pref off");

  /* immediate path (reduced motion) */
  reset(); curCore = "gba"; crtPref = true; reduceMotion = true; api = load();
  ran = false;
  api.powerOffThen(() => { ran = true; });
  check("reduced motion -> immediate", ran === true && timers.length === 0, "no animation");

  /* animated path */
  reset(); curCore = "gba"; crtPref = true; api = load();
  ran = false;
  api.powerOffThen(() => { ran = true; });
  check("animated path adds the class", els["ejs-screen"].classList.contains("screen-power-off"), "collapse class");
  check("animated path delays fn", ran === false && timers.length === 1, "waits 400ms");
  timers[0]();
  check("timer runs fn", ran === true, "fn after collapse");

  console.log(failures ? `\n${failures} FAILURES` : "\nPOWER UNIT: ALL PASS");
  process.exit(failures ? 1 : 0);
})();
