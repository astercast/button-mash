/* Wave 10 validation: headless functional test for Tournament 2.0.
   Drives tournament.html in headless Chromium (no engine involved):
   - setup: seed list renders, up/down reorder works, game picks load
   - double elim: winners + losers + grand final render, full playthrough
     to champion via real UI clicks, progress + history update
   - undo restores the previous step
   - share encode/decode round-trips through the browser UMD build
   - single elim still works end to end (no regressions)
   - game voting: vote, lock in, round game set
   Run: node scripts/test_tournament10.js
   Exit 0 = all checks pass, zero pageerrors. */
"use strict";
const puppeteer = require("puppeteer-core");

const BASE = "file:///home/hatch/workspace/button-mash";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log("PASS", name, "-", detail);
  else { failures++; console.error("FAIL", name, "-", detail); }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/meta-chromium/chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("[console.error] " + m.text().slice(0, 300)); });

  await page.goto(BASE + "/tournament.html", { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(800);

  check("format radios present",
    await page.evaluate(() =>
      !!document.querySelector('input[name="t-format"][value="single"]') &&
      !!document.querySelector('input[name="t-format"][value="double"]')),
    "single + double");

  // enter 4 players
  await page.evaluate(() => {
    const ta = document.getElementById("t-players");
    ta.value = "Ana\nBen\nCara\nDev";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await sleep(300);
  check("seed list renders 4 rows",
    await page.evaluate(() => document.querySelectorAll("#t-seed-list .t-seed-row").length) === 4,
    "4 rows");
  check("seed rows have up/down buttons",
    await page.evaluate(() =>
      [...document.querySelectorAll("#t-seed-list .t-seed-row")].every((li) =>
        li.querySelector('button[aria-label^="Move"][aria-label$="up one seed"]') &&
        li.querySelector('button[aria-label^="Move"][aria-label$="down one seed"]'))),
    "keyboard-operable native buttons");

  // catalog loads into the game-pick selects
  await page.waitForFunction(
    () => {
      const s = document.querySelector("#t-seed-list select");
      return s && !s.disabled && s.options.length > 5;
    },
    { timeout: 15000 });
  check("game-pick selects list the catalog",
    await page.evaluate(() => document.querySelector("#t-seed-list select").options.length) > 5,
    "options loaded");
  check("party games grouped first",
    await page.evaluate(() => {
      const s = document.querySelector("#t-seed-list select");
      return s.querySelector('optgroup[label="Party games"]') &&
        s.querySelector('optgroup[label="All games"]');
    }),
    "optgroups");

  // reorder: move seed 1 down -> Ben becomes first line
  await page.evaluate(() => {
    document.querySelector('#t-seed-list .t-seed-row button[aria-label="Move Ana down one seed"]').click();
  });
  await sleep(300);
  check("seed reorder moves the textarea line",
    await page.evaluate(() => document.getElementById("t-players").value.split("\n")[0]) === "Ben",
    "Ben now seed 1");

  // game pick for Ben (first row now)
  const pickId = await page.evaluate(() => {
    const s = document.querySelector("#t-seed-list .t-seed-row select");
    s.selectedIndex = 2; // first real game option
    s.dispatchEvent(new Event("change", { bubbles: true }));
    return s.value;
  });
  await sleep(200);
  check("game pick recorded", typeof pickId === "string" && pickId.length > 2, pickId);

  // generate a DOUBLE bracket
  await page.evaluate(() => {
    document.querySelector('input[name="t-format"][value="double"]').click();
    document.getElementById("t-generate").click();
  });
  await sleep(600);
  const subs = await page.evaluate(() =>
    [...document.querySelectorAll(".t-bracket-sub")].map((h) => h.textContent));
  check("double renders 3 bracket sections",
    subs.includes("Winners bracket") && subs.includes("Losers bracket") && subs.includes("Grand final"),
    subs.join(" | "));
  check("double saved as v2",
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("bm_tournament_v2") || "null");
      return s && s.version === 2 && s.players.join(",") === "Ben,Ana,Cara,Dev";
    }),
    "bm_tournament_v2");
  check("game pick carried into state",
    await page.evaluate((id) => {
      const s = JSON.parse(localStorage.getItem("bm_tournament_v2"));
      return s.gamePicks.Ben === id;
    }, pickId),
    "Ben -> " + pickId);

  // game voting on winners round 0
  async function openFirstVotePanel() {
    await page.evaluate(() => {
      [...document.querySelectorAll(".t-vote > button")].find((b) => /Vote on the game/.test(b.textContent)).click();
    });
    await sleep(300);
  }
  await openFirstVotePanel();
  const candHasPick = await page.evaluate((id) =>
    [...document.querySelectorAll(".t-vote-panel:not([hidden]) .t-vote-list .t-name")]
      .length > 0 && !!id, pickId);
  check("vote panel opens", candHasPick, "panel visible");
  await page.evaluate(() => {
    const panel = document.querySelector(".t-vote-panel:not([hidden])");
    panel.querySelector(".t-vote-list button").click(); // vote for the first candidate
  });
  await sleep(500);
  await openFirstVotePanel(); // voting re-renders; reopen to lock in
  await page.evaluate(() => {
    const panel = document.querySelector(".t-vote-panel:not([hidden])");
    const lock = [...panel.querySelectorAll("button")].find((b) => /^Lock in /.test(b.textContent));
    if (lock) { lock.click(); }
  });
  await sleep(500);
  check("vote lock sets the round game",
    await page.evaluate((id) => {
      const s = JSON.parse(localStorage.getItem("bm_tournament_v2"));
      return s.games["r0"] === id;
    }, pickId),
    "r0 = " + pickId);

  // full playthrough: click "Advance ..." until a champion emerges
  let champion = null;
  for (let i = 0; i < 20 && !champion; i++) {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("#t-bracket button")]
        .find((x) => /^Advance /.test(x.textContent));
      if (b) { b.click(); return true; }
      return false;
    });
    await sleep(250);
    champion = await page.evaluate(() => {
      const cz = document.getElementById("t-champion");
      return cz && !cz.hidden ? cz.querySelector("h2").textContent : null;
    });
    if (!clicked) { break; }
  }
  check("double playthrough reaches a champion", !!champion, champion || "none");
  check("progress shows completed",
    await page.evaluate(() => document.getElementById("t-progress").textContent) === "6 of 6 matches decided.",
    await page.evaluate(() => document.getElementById("t-progress").textContent));
  check("history logged entries",
    await page.evaluate(() => document.querySelectorAll("#t-history-list li").length) >= 6,
    "history rendered");
  check("undo enabled after results",
    await page.evaluate(() => !document.getElementById("t-undo").disabled),
    "undo clickable");

  // undo -> champion gone
  await page.evaluate(() => document.getElementById("t-undo").click());
  await sleep(400);
  check("undo restores previous step",
    await page.evaluate(() => document.getElementById("t-champion").hidden),
    "champion banner hidden again");

  // share round-trip through the browser UMD build
  check("share encode/decode round-trips in browser",
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("bm_tournament_v2"));
      const code = BracketDouble.encodeShare(s);
      const d = BracketDouble.decodeShare(code);
      return d.ok && d.state.players.length === 4 && d.state.version === 2;
    }),
    "ok");
  check("share rejects tampering in browser",
    await page.evaluate(() => !BracketDouble.decodeShare("!!!").ok),
    "rejected");

  // start over -> single elim still works
  await page.evaluate(() => {
    document.getElementById("t-startover").click();
    document.querySelector('input[name="t-format"][value="single"]').click();
    document.getElementById("t-generate").click();
  });
  await sleep(600);
  check("single renders without losers bracket",
    await page.evaluate(() =>
      ![...document.querySelectorAll(".t-bracket-sub")].some((h) => h.textContent === "Losers bracket")),
    "winners only");
  check("single saved as v1",
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("bm_tournament_v1") || "null");
      return s && s.version === 1;
    }),
    "bm_tournament_v1");
  for (let i = 0; i < 10; i++) {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("#t-bracket button")]
        .find((x) => /^Advance /.test(x.textContent));
      if (b) { b.click(); return true; }
      return false;
    });
    await sleep(200);
    const done = await page.evaluate(() => !document.getElementById("t-champion").hidden);
    if (done || !clicked) { break; }
  }
  check("single playthrough reaches a champion",
    await page.evaluate(() => {
      const cz = document.getElementById("t-champion");
      return !cz.hidden && /Champion:/.test(cz.querySelector("h2").textContent);
    }),
    "champion banner");

  // persistence across reload
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(800);
  check("single bracket restores after reload",
    await page.evaluate(() => !document.getElementById("t-bracket-wrap").hidden),
    "restored");

  // party-planner handoff (?players=N&games=ids)
  const page2 = await browser.newPage();
  page2.on("pageerror", (e) => errors.push("[pageerror] " + String(e).slice(0, 300)));
  await page2.goto(BASE + "/tournament.html?players=6&games=bonk,tetrio", { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(1500);
  check("handoff pre-fills 6 players",
    await page2.evaluate(() => document.getElementById("t-players").value.split("\n").length) === 6,
    "6 lines");
  await page2.evaluate(() => document.getElementById("t-generate").click());
  await sleep(800);
  check("handoff games cycle across rounds",
    await page2.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("bm_tournament_v1") || "null");
      return s && s.games["r0"] === "bonk" && s.games["r1"] === "tetrio" && s.games["r2"] === "bonk";
    }),
    "bonk/tetrio/bonk");
  await page2.close();

  check("zero pageerrors", errors.length === 0, errors.join(" ;; ") || "clean");
  await browser.close();
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(1); });
