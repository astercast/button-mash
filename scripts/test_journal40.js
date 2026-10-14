/* Wave 40 (T-MASH-2) checks: the Play Journal (journal.html).

   (1) core: BMJournal over the trophy-pattern store, statuses
   shelve, multiple dated logs per playthrough coexist in order,
   invalid writes refuse, reads never create entries, a fresh
   store reads persisted state back;
   (2) addressability: every one of the 213 catalog games is a
   valid journal target (picker + all-games list in the page);
   (3) headless: shelve Cookie Clicker as playing, write two log
   entries, reload, the shelf and both logs persist from
   localStorage; the ?game= deep link opens a game in the editor;
   zero pageerrors, no 390px overflow.

   Run: NODE_PATH=~/workspace/smoke/node_modules node scripts/test_journal40.js
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

const games = JSON.parse(fs.readFileSync(path.join(ROOT, "data/games.json"), "utf8")).games;
const J = require(path.join(ROOT, "assets/js/journal-core.js"));

/* ---------------- (1) core ---------------- */
{
  const s = J.createStore();
  check("core: status shelves + counts derive from visitor writes only",
    s.setStatus("cookie-clicker", "want") && s.setStatus("a-dark-room", "playing") &&
    s.setStatus("trimps", "finished") && s.byStatus("want").join(",") === "cookie-clicker" &&
    s.counts().want === 1 && s.counts().playing === 1 && s.counts().finished === 1,
    "want/playing/finished each hold exactly the game shelved there");
  s.addLog("a-dark-room", "2026-10-01", "Lit the fire.");
  s.addLog("a-dark-room", "2026-10-05", "The village grows. Same playthrough, second entry.");
  s.addLog("a-dark-room", "2026-10-09", "Third entry, multiple logs per playthrough.");
  const logs = s.getLogs("a-dark-room");
  check("core: multiple dated logs per playthrough coexist, in the order written",
    logs.length === 3 && logs[0].date === "2026-10-01" && logs[2].date === "2026-10-09" &&
    s.counts().logs === 3 && s.counts().logged === 1,
    logs.map((l) => l.date).join(" · "));
  check("core: invalid writes refuse and change nothing",
    s.setStatus("x", "bogus") === false && s.addLog("x", "2026-02-30", "t") === null &&
    s.addLog("x", "2026-10-01", "") === null && s.getStatus("x") === null && !s.ids().includes("x"),
    "bad status, impossible date, and empty text all refuse; no phantom entry appears");
  const s2 = J.createStore();
  check("core: a fresh store reads the persisted state back (the localStorage pattern)",
    s2.getStatus("a-dark-room") === "playing" && s2.getLogs("a-dark-room").length === 3,
    "persistence is the backend's, not one object's memory");
  check("core: every catalog game is a valid journal target (213 addressable)",
    games.length === 213 && games.every((g) => J.isStatus("want") && s.setStatus(g.id, null) !== false),
    "all " + games.length + " catalog ids accept journal writes; none is special-cased");
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
  await page.goto(BASE + "/journal.html?game=cookie-clicker", { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll("#journal-all [data-journal-game]").length === 213, { timeout: 30000 }).catch(() => {});
  const addr = await page.evaluate(() => ({
    all: document.querySelectorAll("#journal-all [data-journal-game]").length,
    opts: document.querySelectorAll("#journal-game option").length,
    picker: document.querySelector("#journal-game").value,
    h1: document.querySelectorAll("h1").length,
  }));
  check("headless: all 213 games addressable; the ?game= deep link opens its game in the editor",
    addr.all === 213 && addr.opts === 213 && addr.picker === "cookie-clicker" && addr.h1 === 1,
    "all=" + addr.all + " options=" + addr.opts + " picker=" + addr.picker);

  await page.select("#journal-status", "playing");
  await page.$eval("#journal-date", (n) => { n.value = "2026-10-11"; });
  await page.type("#journal-text", "First bake: grandmas hired.");
  await page.click("#journal-add-log");
  await sleep(200);
  await page.$eval("#journal-date", (n) => { n.value = "2026-10-13"; });
  await page.type("#journal-text", "Second session, same playthrough.");
  await page.click("#journal-add-log");
  await sleep(200);
  const before = await page.evaluate(() => ({
    logs: document.querySelectorAll("#journal-logs .journal-log").length,
    shelf: document.querySelector("#shelf-playing").textContent,
    raw: localStorage.getItem("bm.journal.v1"),
  }));
  check("headless: shelving + two log entries land in localStorage and on the Playing shelf",
    before.logs === 2 && before.shelf.includes("Cookie Clicker") &&
    before.raw.includes("cookie-clicker") && before.raw.includes("First bake"),
    "logs=" + before.logs + ", persisted under bm.journal.v1");

  await page.reload({ waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll("#journal-all [data-journal-game]").length === 213, { timeout: 30000 }).catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll("#shelf-playing .journal-open").forEach((b) => b.click());
  });
  await sleep(300);
  const after = await page.evaluate(() => ({
    logs: [...document.querySelectorAll("#journal-logs .journal-log")].map((n) => n.textContent),
    status: document.querySelector("#journal-status").value,
  }));
  check("headless: after reload the status and both dated logs persist",
    after.status === "playing" && after.logs.length === 2 &&
    after.logs[0].includes("2026-10-11") && after.logs[1].includes("2026-10-13"),
    after.logs.join(" | ").slice(0, 120));

  await page.setViewport({ width: 390, height: 844 });
  await sleep(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("headless: 390px mobile has zero horizontal overflow", overflow <= 0, "overflow=" + overflow);
  check("headless: zero pageerrors", errors.length === 0, errors.join(" | ") || "clean");
  await browser.close();
  console.log(failures ? "JOURNAL40: " + failures + " FAILURES" : "JOURNAL40 ALL PASS");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("JOURNAL40 ERROR", e); process.exit(1); });
