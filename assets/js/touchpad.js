/* touchpad.js: PortPlay phone controls. Plain JS, no libraries. Sends presses straight to the engine's own input
   function, gameManager.simulateInput(player, button, value), the same call EmulatorJS's own on-screen pad makes.
   Button numbers are the RetroPad numbers the engine uses: B0 Y1 Select2 Start3 Up4 Down5 Left6 Right7 A8 X9 L10 R11 L2 12 R2 13.
   Usage: PortplayPad.mount(window.EJS_emulator, { scheme: "nes", host: document.body, onMenu: fn }) -> returns { destroy }.   */
(function () {
  "use strict";
  /* per scheme: face buttons as [label, retropad number, x, y] on a 0..100 grid (right cluster), shoulders, and the small centre keys */
  var SCHEMES = {
    nes:   { face: [["B", 0, 14, 62], ["A", 8, 62, 34]], mid: [["Select", 2], ["Start", 3]] },
    gb:    { face: [["B", 0, 14, 62], ["A", 8, 62, 34]], mid: [["Select", 2], ["Start", 3]] },
    gba:   { face: [["B", 0, 14, 62], ["A", 8, 62, 34]], mid: [["Select", 2], ["Start", 3]], top: [["L", 10, "l"], ["R", 11, "r"]] },
    snes:  { face: [["X", 9, 38, 4], ["Y", 1, 6, 36], ["A", 8, 70, 36], ["B", 0, 38, 68]], mid: [["Select", 2], ["Start", 3]], top: [["L", 10, "l"], ["R", 11, "r"]] },
    segaMD:{ face: [["A", 1, 2, 62], ["B", 0, 34, 62], ["C", 8, 66, 62], ["X", 10, 2, 22], ["Y", 9, 34, 22], ["Z", 11, 66, 22]], mid: [["Mode", 2], ["Start", 3]] },
    segaMS:{ face: [["1", 0, 14, 62], ["2", 8, 62, 34]], mid: [] },
    segaGG:{ face: [["1", 0, 14, 62], ["2", 8, 62, 34]], mid: [["Start", 3]] },
    psx:   { face: [["△", 9, 38, 4], ["□", 1, 6, 36], ["○", 8, 70, 36], ["✕", 0, 38, 68]], mid: [["Select", 2], ["Start", 3]], top: [["L1", 10, "l"], ["R1", 11, "r"], ["L2", 12, "l2"], ["R2", 13, "r2"]] }
  };
  SCHEMES.gbc = SCHEMES.gb; SCHEMES.segaCD = SCHEMES.sega32x = SCHEMES.segaMD; SCHEMES.pce = SCHEMES.nes; SCHEMES.ws = SCHEMES.nes;

  var CSS = [
    ".pp-pad{position:fixed;inset:0;z-index:50;pointer-events:none;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;font:600 14px system-ui,sans-serif;--s:1;--o:.55}",
    ".pp-pad *{box-sizing:border-box;touch-action:none}",
    ".pp-deck{position:absolute;left:0;right:0;bottom:0;pointer-events:none;padding:0 max(14px,env(safe-area-inset-left)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-right))}",
    ".pp-portrait .pp-deck{height:var(--deck,300px);background:#0b0d0c}",
    ".pp-dpad{position:absolute;left:max(14px,env(safe-area-inset-left));bottom:max(24px,env(safe-area-inset-bottom));width:calc(150px*var(--s));height:calc(150px*var(--s));border-radius:50%;pointer-events:auto;opacity:var(--o);background:radial-gradient(circle at 50% 50%,#2a2f2d 0 58%,#1a1d1c 59% 100%)}",
    ".pp-dpad i{position:absolute;width:34%;height:34%;border-radius:8px;background:#444b48;transition:background .05s}",
    ".pp-dpad i.on{background:#d9e2dc}",
    ".pp-dpad .u{left:33%;top:6%}.pp-dpad .d{left:33%;bottom:6%}.pp-dpad .l{left:6%;top:33%}.pp-dpad .r{right:6%;top:33%}",
    ".pp-face{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));width:calc(176px*var(--s));height:calc(150px*var(--s));pointer-events:none}",
    ".pp-btn{position:absolute;width:calc(60px*var(--s));height:calc(60px*var(--s));border-radius:50%;pointer-events:auto;opacity:var(--o);background:#2a2f2d;color:#e8eeea;border:2px solid #4c5551;display:grid;place-items:center;font-size:calc(20px*var(--s));font-weight:800}",
    ".pp-btn.on{background:#d9e2dc;color:#0b0d0c}",
    ".pp-mid{position:absolute;left:0;right:0;bottom:max(8px,env(safe-area-inset-bottom));display:flex;justify-content:center;gap:14px;pointer-events:none}",
    ".pp-mid .pp-btn{position:static;width:auto;height:34px;padding:0 16px;border-radius:17px;font-size:13px}",
    ".pp-top{position:absolute;left:0;right:0;top:max(8px,env(safe-area-inset-top));display:flex;justify-content:space-between;padding:0 max(14px,env(safe-area-inset-left));pointer-events:none}",
    ".pp-top .pp-btn{position:static;width:calc(86px*var(--s));height:calc(44px*var(--s));border-radius:12px;font-size:15px}",
    ".pp-menu{position:absolute;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:44px;height:30px;border-radius:15px;pointer-events:auto;background:#1b1f1d;color:#cfd8d3;border:1px solid #3b4440;display:grid;place-items:center;opacity:.7;font-size:18px;line-height:1}",
    ".pp-sheet{position:absolute;left:50%;top:max(46px,calc(env(safe-area-inset-top) + 40px));transform:translateX(-50%);min-width:220px;background:#101312;color:#e8eeea;border:1px solid #3b4440;border-radius:12px;padding:10px;display:none;pointer-events:auto;gap:8px;flex-direction:column}",
    ".pp-sheet.open{display:flex}",
    ".pp-sheet button,.pp-sheet label{font:inherit;color:inherit;background:#1b1f1d;border:1px solid #3b4440;border-radius:8px;padding:10px 12px;text-align:left}",
    ".pp-sheet input[type=range]{width:100%}",
    /* landscape: shoulders stay on the top corners, menu in the middle; portrait: the game sits above the deck */
    ".pp-landscape .pp-mid{bottom:max(10px,env(safe-area-inset-bottom))}",
    ".pp-portrait .pp-mid{bottom:auto;top:12px}",
    "@media (prefers-reduced-motion:reduce){.pp-dpad i{transition:none}}"
  ].join("\n");

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var PREF = "pp.pad.v1";
  function loadPrefs() { try { return Object.assign({ size: 1, opacity: .55, left: false, haptics: true }, JSON.parse(localStorage.getItem(PREF) || "{}")); } catch (e) { return { size: 1, opacity: .55, left: false, haptics: true }; } }
  function savePrefs(p) { try { localStorage.setItem(PREF, JSON.stringify(p)); } catch (e) {} }   /* size, opacity, hand only. No game data. */

  function mount(emu, opts) {
    opts = opts || {};
    /* Prefs persist only where the host surface allows storage
       (opts.storePrefs). The stage promises nothing is stored, so its
       frame mounts the pad with storePrefs off: the settings still
       adjust for the session, they are just never written. The full
       player, whose save slots are a promised feature, keeps them. */
    var canStore = opts.storePrefs !== false;
    var scheme = SCHEMES[opts.scheme] || SCHEMES.nes, host = opts.host || document.body, prefs = canStore ? loadPrefs() : { size: 1, opacity: .55, left: false, haptics: true };
    function persist() { if (canStore) savePrefs(prefs); }
    if (!document.getElementById("pp-pad-css")) { var st = el("style"); st.id = "pp-pad-css"; st.textContent = CSS; document.head.appendChild(st); }
    try { emu.toggleVirtualGamepad(false); } catch (e) {}                                    /* hide the engine's own pad; ours replaces it */
    var root = el("div", "pp-pad"), deck = el("div", "pp-deck"), held = {}, pointers = new Map();
    root.appendChild(deck);
    function send(n, v) { if (held[n] === v) return; held[n] = v; try { emu.gameManager.simulateInput(0, n, v); } catch (e) {} if (v && prefs.haptics && navigator.vibrate) navigator.vibrate(7); }
    /* d-pad: one round zone, eight directions from the angle, small dead centre, and a slide never lifts */
    var dpad = el("div", "pp-dpad"); ["u", "d", "l", "r"].forEach(function (c) { dpad.appendChild(el("i", c)); });
    function dirs(x, y, r) {
      var dx = x - r.left - r.width / 2, dy = y - r.top - r.height / 2, d = Math.hypot(dx, dy), out = { u: 0, d: 0, l: 0, r: 0 };
      if (d < r.width * .12) return out;
      var a = Math.atan2(dy, dx) * 180 / Math.PI;                                              /* 0 = right, 90 = down */
      if (a > -67.5 && a < 67.5) out.r = 1; if (a > 22.5 && a < 157.5) out.d = 1; if (a > 112.5 || a < -112.5) out.l = 1; if (a < -22.5 && a > -157.5) out.u = 1;
      return out;
    }
    function setDpad(o) { var map = { u: 4, d: 5, l: 6, r: 7 }; for (var k in map) { send(map[k], o[k]); dpad.querySelector("." + k).classList.toggle("on", !!o[k]); } }
    function clearDpad() { setDpad({ u: 0, d: 0, l: 0, r: 0 }); }
    dpad.addEventListener("pointerdown", function (e) { dpad.setPointerCapture(e.pointerId); pointers.set(e.pointerId, "dpad"); setDpad(dirs(e.clientX, e.clientY, dpad.getBoundingClientRect())); e.preventDefault(); });
    dpad.addEventListener("pointermove", function (e) { if (pointers.get(e.pointerId) === "dpad") setDpad(dirs(e.clientX, e.clientY, dpad.getBoundingClientRect())); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { dpad.addEventListener(t, function (e) { if (pointers.get(e.pointerId) === "dpad") { pointers.delete(e.pointerId); clearDpad(); } }); });
    /* buttons: press on touch, release on lift, and sliding a finger from one button to the next moves the press */
    var btns = [];
    function mkBtn(label, n, cls) { var b = el("button", "pp-btn " + (cls || ""), label); b.type = "button"; b.dataset.n = n; b.setAttribute("aria-label", label); btns.push(b); return b; }
    var face = el("div", "pp-face"), mid = el("div", "pp-mid"), top = el("div", "pp-top");
    scheme.face.forEach(function (f) { var b = mkBtn(f[0], f[1]); b.style.left = f[2] * 1.2 * 1 + "%"; b.style.top = f[3] * 1 + "%"; face.appendChild(b); });
    (scheme.mid || []).forEach(function (m) { mid.appendChild(mkBtn(m[0], m[1])); });
    (scheme.top || []).forEach(function (t) { top.appendChild(mkBtn(t[0], t[1])); });
    [face, mid, top].forEach(function (g) { g.addEventListener("pointerdown", onDown); g.addEventListener("pointermove", onMove); ["pointerup", "pointercancel"].forEach(function (t) { g.addEventListener(t, onUp); }); });
    function under(e) { var t = document.elementFromPoint(e.clientX, e.clientY); return t && t.classList && t.classList.contains("pp-btn") ? t : null; }
    function press(pid, b) { var cur = pointers.get(pid); if (cur === b) return; if (cur && cur !== "dpad") { send(+cur.dataset.n, 0); cur.classList.remove("on"); } if (b) { send(+b.dataset.n, 1); b.classList.add("on"); pointers.set(pid, b); } else pointers.delete(pid); }
    function onDown(e) { var b = under(e); if (b) { e.currentTarget.setPointerCapture(e.pointerId); press(e.pointerId, b); } e.preventDefault(); }
    function onMove(e) { if (pointers.has(e.pointerId) && pointers.get(e.pointerId) !== "dpad") press(e.pointerId, under(e)); }
    function onUp(e) { var cur = pointers.get(e.pointerId); if (cur && cur !== "dpad") { send(+cur.dataset.n, 0); cur.classList.remove("on"); } pointers.delete(e.pointerId); }
    /* menu */
    var mbtn = el("button", "pp-menu", "☰"); mbtn.type = "button"; mbtn.setAttribute("aria-label", "Menu");
    var sheet = el("div", "pp-sheet"), paused = false;
    function row(t, f) { var b = el("button", "", t); b.type = "button"; b.addEventListener("click", f); sheet.appendChild(b); return b; }
    var pbtn = row("Pause", function () { paused = !paused; try { paused ? emu.pause() : emu.play(); } catch (e) {} pbtn.textContent = paused ? "Resume" : "Pause"; });
    row("Restart", function () { try { emu.gameManager.restart(); } catch (e) {} sheet.classList.remove("open"); });
    row("Full screen", function () { try { (document.fullscreenElement ? document.exitFullscreen() : (opts.fsTarget || document.documentElement).requestFullscreen()); } catch (e) {} });
    row("More (saves, cheats, settings)", function () { document.body.classList.toggle("pp-engine-menu"); sheet.classList.remove("open"); });
    if (window.parent !== window) row("Exit game", function () { parent.postMessage({ t: "portplay-exit" }, location.origin); });
    var lab = el("label", "", "Size"), size = el("input"); size.type = "range"; size.min = .7; size.max = 1.4; size.step = .05; size.value = prefs.size; lab.appendChild(size); sheet.appendChild(lab);
    var lab2 = el("label", "", "Opacity"), op = el("input"); op.type = "range"; op.min = .25; op.max = 1; op.step = .05; op.value = prefs.opacity; lab2.appendChild(op); sheet.appendChild(lab2);
    row("Switch hand", function () { prefs.left = !prefs.left; apply(); persist(); });
    row("Haptics: " + (prefs.haptics ? "on" : "off"), function (e) { prefs.haptics = !prefs.haptics; e.currentTarget.textContent = "Haptics: " + (prefs.haptics ? "on" : "off"); persist(); });
    size.addEventListener("input", function () { prefs.size = +size.value; apply(); persist(); });
    op.addEventListener("input", function () { prefs.opacity = +op.value; apply(); persist(); });
    mbtn.addEventListener("click", function () { sheet.classList.toggle("open"); });
    deck.appendChild(dpad); deck.appendChild(face); deck.appendChild(mid); root.appendChild(top); root.appendChild(mbtn); root.appendChild(sheet);
    host.appendChild(root);
    function apply() {
      root.style.setProperty("--s", prefs.size); root.style.setProperty("--o", prefs.opacity);
      dpad.style.left = prefs.left ? "" : ""; if (prefs.left) { dpad.style.left = "auto"; dpad.style.right = "max(14px,env(safe-area-inset-right))"; face.style.right = "auto"; face.style.left = "max(14px,env(safe-area-inset-left))"; }
      else { dpad.style.left = ""; dpad.style.right = ""; face.style.right = ""; face.style.left = ""; }
      layout();
    }
    /* portrait: leave the top of the frame for the game, the deck underneath. landscape: pad floats over the sides. */
    var gameBox = opts.gameBox || document.getElementById("game") || document.querySelector("#ejs-screen");
    var mq = matchMedia("(orientation: portrait)");
    function layout() {
      var portrait = mq.matches; root.classList.toggle("pp-portrait", portrait); root.classList.toggle("pp-landscape", !portrait);
      var deckH = Math.round(Math.min(320, Math.max(230, innerHeight * .36 * prefs.size)));
      root.style.setProperty("--deck", deckH + "px");
      if (gameBox) { gameBox.style.bottom = portrait ? deckH + "px" : "0"; }
      try { emu.handleResize(); } catch (e) {}
    }
    mq.addEventListener("change", layout); addEventListener("resize", layout);
    document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    /* safety: if the page hides or the phone locks, let go of everything and pause so a held button never sticks */
    function letGo() { for (var n in held) if (held[n]) send(+n, 0); btns.forEach(function (b) { b.classList.remove("on"); }); clearDpad(); pointers.clear(); }
    function vis() { if (document.hidden) { letGo(); try { emu.pause(); } catch (e) {} } else if (!paused) { try { emu.play(); } catch (e) {} } }
    document.addEventListener("visibilitychange", vis);
    apply();
    return { destroy: function () { letGo(); root.remove(); document.removeEventListener("visibilitychange", vis); }, press: send };
  }
  window.PortplayPad = { mount: mount, SCHEMES: SCHEMES };
})();
