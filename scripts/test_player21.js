/* Wave 9 validation: headless functional test for Player 2.1.
   Exercises the new UI without booting the engine (CDN is blocked in the
   sandbox; the gated real-boot test lives in ~/workspace/smoke/test.js PART 4):
   - save slots render from seeded IndexedDB + localStorage (last-game fallback)
   - rename / restore / new-slot round-trips
   - per-system remap: key capture via trusted keyboard events, Esc cancel, reset
   - quick-settings dialog: opens, display prefs persist across reload
   - autosave pass writes the auto-save slot
   - remapper/slot controls are native keyboard-focusable buttons
   Run: node scripts/test_player21.js
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

function idbGetBytes(page, key) {
  return page.evaluate((k) => new Promise((res, rej) => {
    const req = indexedDB.open("EmulatorJS-states", 1);
    req.onsuccess = () => {
      const g = req.result.transaction(["states"], "readonly").objectStore("states").get(k);
      g.onsuccess = () => res(g.result ? Array.from(new Uint8Array(g.result)) : null);
      g.onerror = () => rej(g.error);
    };
    req.onerror = () => rej(req.error);
  }), key);
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

  await page.goto(BASE + "/player.html", { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(1200);

  // seed: last game + engine slot + one named slot (no engine boot needed)
  await page.evaluate(() => {
    localStorage.setItem("bm-last-game",
      JSON.stringify({ gameID: "bm-9-test", gameName: "testgame", core: "gba" }));
    return new Promise((res, rej) => {
      const req = indexedDB.open("EmulatorJS-states", 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains("states")) req.result.createObjectStore("states");
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(["states"], "readwrite");
        tx.objectStore("states").put(new Uint8Array([1, 2, 3, 4]), "testgame.state");
        tx.objectStore("states").put(new Uint8Array([9, 9, 9]), "testgame.bm-slot-1.state");
        tx.oncomplete = () => res(true);
        tx.onerror = () => rej(tx.error);
      };
      req.onerror = () => rej(req.error);
    });
  });
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(2500);

  // 1. slots render from the last-game fallback
  const slotInfo = await page.evaluate(() => ({
    rows: document.querySelectorAll("#slots-list .slot-row").length,
    labels: Array.from(document.querySelectorAll("#slots-list .slot-label")).map((e) => e.textContent),
    sysLabel: document.querySelector("#display-sys") ? document.querySelector("#display-sys").textContent : null,
  }));
  check("slots render (engine + named, last-game fallback)",
    slotInfo.rows >= 2 && slotInfo.labels.includes("Slot 1") && slotInfo.labels.includes("Engine slot"),
    JSON.stringify(slotInfo.labels));
  check("display panel follows last-game system", slotInfo.sysLabel === "Game Boy Advance", String(slotInfo.sysLabel));

  // 2. rename round-trip (inline input, Enter commits)
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("#slots-list .slot-row"))
      .find((r) => r.querySelector(".slot-label").textContent === "Slot 1");
    Array.from(row.querySelectorAll("button")).find((b) => b.textContent.includes("Rename")).click();
  });
  await sleep(400);
  check("rename inline input appears",
    await page.evaluate(() => !!document.querySelector("#slots-list .slot-rename input")), "inline rename");
  await page.evaluate(() => {
    const i = document.querySelector("#slots-list .slot-rename input");
    i.value = "Boss fight";
    i.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  });
  await sleep(900);
  const meta = await page.evaluate(() => localStorage.getItem("bm-slots-bm-9-test"));
  check("rename persists label", !!meta && meta.includes("Boss fight"), (meta || "").slice(0, 120));

  // 3. restore copies slot bytes over the engine key
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("#slots-list .slot-row"))
      .find((r) => r.querySelector(".slot-label").textContent === "Boss fight");
    Array.from(row.querySelectorAll("button")).find((b) => b.textContent.includes("Restore")).click();
  });
  await sleep(1200);
  const engBytes = await idbGetBytes(page, "testgame.state");
  check("restore copies slot bytes to engine key",
    JSON.stringify(engBytes) === "[9,9,9]", JSON.stringify(engBytes));

  // 4. new slot from the engine slot
  await page.evaluate(() => document.querySelector("#slot-new").click());
  await sleep(1200);
  const labelsAfterNew = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#slots-list .slot-label")).map((e) => e.textContent));
  check("new slot created", labelsAfterNew.includes("Slot 2"), JSON.stringify(labelsAfterNew));

  // 5. per-system remap: snes renders its own labels
  await page.select("#remap-system", "snes");
  await sleep(700);
  const snes = await page.evaluate(() => ({
    rows: document.querySelectorAll("#controls-tbody tr").length,
    status: document.querySelector("#controls-status").textContent,
  }));
  check("remap renders per-system (snes)", snes.rows > 5 && /SNES/.test(snes.status), snes.rows + " rows");
  await page.select("#remap-system", "gba");
  await sleep(700);

  // 6. key capture persists to bm-remap-gba (first gba row = id 8 "A")
  await page.evaluate(() => {
    document.querySelector('#controls-tbody tr button[aria-label^="Remap keyboard"]').click();
  });
  await sleep(300);
  await page.keyboard.press("z"); // keyCode 90
  await sleep(900);
  const remap = await page.evaluate(() => localStorage.getItem("bm-remap-gba"));
  let remapOk = false;
  try { remapOk = !!remap && JSON.parse(remap).player0["8"].value === 90; } catch (e) {}
  check("key capture persists per-system map", remapOk, (remap || "").slice(0, 90));
  const kbdShown = await page.evaluate(() => {
    const k = document.querySelector("#controls-tbody tr kbd.key");
    return k ? k.textContent : null;
  });
  check("captured key shown in table", kbdShown === "z", String(kbdShown));

  // 7. Esc cancels a key capture without writing
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#controls-tbody tr button[aria-label^="Remap keyboard"]');
    btns[1].click();
  });
  await sleep(300);
  await page.keyboard.press("Escape");
  await sleep(600);
  const cancelStatus = await page.evaluate(() => document.querySelector("#controls-status").textContent);
  const remap2 = await page.evaluate(() => localStorage.getItem("bm-remap-gba"));
  let untouched = false;
  try { untouched = JSON.parse(remap2).player0["0"].value === "x"; } catch (e) {}
  check("Esc cancels key capture", /cancel/i.test(cancelStatus) && untouched, cancelStatus.slice(0, 70));

  // 8. reset clears the per-system map
  await page.evaluate(() => document.querySelector("#remap-reset").click());
  await sleep(600);
  check("reset to defaults clears system map",
    await page.evaluate(() => localStorage.getItem("bm-remap-gba") === null), "key removed");

  // 9. quick-settings dialog opens; display prefs change
  await page.evaluate(() => document.querySelector("#settings-open-2").click());
  await sleep(600);
  check("settings dialog opens",
    await page.evaluate(() => { const d = document.querySelector("#settings-dialog"); return !!d && d.open; }),
    "showModal");
  await page.evaluate(() => document.querySelector("#dlg-crt").click());
  await sleep(400);
  // simulate the post-boot DOM: the engine screen div only exists after a boot
  await page.evaluate(() => {
    if (!document.querySelector("#ejs-screen")) {
      const d = document.createElement("div");
      d.id = "ejs-screen";
      document.querySelector("#ejs-stage").appendChild(d);
    }
  });
  await page.select("#dlg-aspect", "16:9");
  await sleep(600);
  const disp = await page.evaluate(() => ({
    stored: localStorage.getItem("bm-display-gba"),
    arClass: document.querySelector("#ejs-screen").className,
    overlayOn: document.querySelector("#crt-overlay") ? document.querySelector("#crt-overlay").style.display !== "none" : null,
  }));
  let crtStored = false;
  try { crtStored = JSON.parse(disp.stored).crt === true; } catch (e) {}
  check("dialog display prefs persist", crtStored && /ar-169/.test(disp.arClass) && disp.overlayOn === true,
    (disp.stored || "").slice(0, 80) + " / " + disp.arClass);
  await page.evaluate(() => {
    document.querySelector('#settings-dialog form[method="dialog"] button').click();
  });
  await sleep(400);
  check("dialog closes",
    await page.evaluate(() => !document.querySelector("#settings-dialog").open), "Done button");

  // 10. prefs survive reload (per-system round-trip)
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(2200);
  const persisted = await page.evaluate(() => {
    if (!document.querySelector("#ejs-screen")) {
      const d = document.createElement("div");
      d.id = "ejs-screen";
      document.querySelector("#ejs-stage").appendChild(d);
    }
    window.BM21.applyDisplayPrefs("gba");
    return {
      crt: document.querySelector("#disp-crt").checked,
      aspect: document.querySelector("#disp-aspect").value,
      arClass: document.querySelector("#ejs-screen").className,
    };
  });
  check("display prefs round-trip across reload",
    persisted.crt === true && persisted.aspect === "16:9" && /ar-169/.test(persisted.arClass),
    JSON.stringify(persisted));

  // 11. autosave: enable, run a pass, slot appears
  await page.evaluate(() => document.querySelector("#autosave-toggle").click());
  await sleep(400);
  const pref = await page.evaluate(() => localStorage.getItem("bm-autosave-bm-9-test"));
  let prefOk = false;
  try { prefOk = JSON.parse(pref).enabled === true; } catch (e) {}
  check("autosave toggle persists", prefOk, String(pref));
  const passResult = await page.evaluate(() => window.BM21.autosavePass());
  check("autosave pass copies engine slot", passResult === true, String(passResult));
  await sleep(1500);
  /* Converter 4.0 (Phase 0): new autosaves are content-addressed,
     "<gameID>.bm-autosave.state"; the legacy name-based key stays readable. */
  const autoBytes = await idbGetBytes(page, "bm-9-test.bm-autosave.state");
  const autoLabel = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#slots-list .slot-label")).map((e) => e.textContent));
  check("auto-save slot written + listed",
    JSON.stringify(autoBytes) === "[9,9,9]" && autoLabel.includes("Auto-save"),
    JSON.stringify(autoBytes) + " / " + JSON.stringify(autoLabel));

  // 12. keyboard operability: native buttons throughout
  const kb = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("#controls-tbody button, #slots-list button, #slots-list input"));
    return { n: btns.length, native: btns.every((b) => b.tagName === "BUTTON" || b.tagName === "INPUT") };
  });
  check("remapper/slot controls keyboard-focusable", kb.n > 10 && kb.native, kb.n + " controls");

  check("zero pageerrors", errors.length === 0, errors.length ? errors.join(" | ") : "clean");
  await browser.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PLAYER 2.1 CHECKS PASSED");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
