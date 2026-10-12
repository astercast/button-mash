/* Button Mash — "The Arcade" chrome (wave 15).
   Progressive enhancement, zero required: FX toggle (scanlines/chase/
   flicker/marquee kill-switch, persisted), idle attract mode, the
   attract ticker (data-driven from the catalog), kid-safe badges.
   Everything degrades to static content without JS. */
(function () {
  "use strict";

  var BASE = (function () {
    try {
      var src = document.currentScript && document.currentScript.src || "";
      return src.replace(/assets\/js\/arcade\.js.*$/, "");
    } catch (e) { return ""; }
  })();
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- FX switch: the sensory envelope ---------- */
  var FX_KEY = "bm-fx";
  function fxOn() {
    var stored = null;
    try { stored = localStorage.getItem(FX_KEY); } catch (e) {}
    if (stored === "off") return false;
    if (stored === "on") return true;
    return !reduceMotion; // first visit: calm by default for reduced-motion users
  }
  function applyFx(on, btn) {
    document.documentElement.classList.toggle("fx-off", !on);
    try { localStorage.setItem(FX_KEY, on ? "on" : "off"); } catch (e) {}
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.querySelector(".fx-label").textContent = on ? "FX ON" : "FX OFF";
    }
  }
  function injectFxToggle() {
    var headerInner = document.querySelector(".header-inner");
    if (!headerInner || document.getElementById("fx-toggle")) return;
    var utils = document.createElement("div");
    utils.className = "header-utils";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "fx-toggle";
    btn.className = "fx-toggle";
    btn.setAttribute("aria-pressed", "true");
    btn.title = "Toggle arcade effects (scanlines, chase lights, marquee motion)";
    var led = document.createElement("span");
    led.className = "fx-led";
    led.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.className = "fx-label";
    label.textContent = "FX ON";
    btn.appendChild(led);
    btn.appendChild(label);
    btn.addEventListener("click", function () {
      applyFx(document.documentElement.classList.contains("fx-off"), btn);
      resetAttract(); // FX change resets the idle clock
    });
    utils.appendChild(btn);
    headerInner.appendChild(utils);
    applyFx(fxOn(), btn);
  }

  /* ---------- Attract mode: the cabinet idles, then performs ---------- */
  var ATTRACT_MS = 30000;
  var attractTimer = null;
  function clearAttract() {
    document.body.classList.remove("attract");
    if (attractTimer) { clearTimeout(attractTimer); attractTimer = null; }
  }
  function resetAttract() {
    clearAttract();
    if (reduceMotion) return;
    if (document.documentElement.classList.contains("fx-off")) return;
    attractTimer = setTimeout(function () {
      document.body.classList.add("attract");
    }, ATTRACT_MS);
  }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, resetAttract, { passive: true });
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) clearAttract(); else resetAttract();
  });

  /* ---------- Attract ticker: real game titles on the marquee ---------- */
  function fillTicker() {
    var track = document.querySelector(".marquee-track");
    if (!track || !window.BM || !BM.loadGames) return;
    BM.loadGames().then(function (games) {
      if (!games || !games.length) return;
      // Deterministic slice: rotate by day-of-year so the marquee changes daily.
      var now = new Date();
      var start = (now.getDate() + now.getMonth() * 31) % games.length;
      var items = [];
      for (var i = 0; i < 24; i++) {
        var g = games[(start + i * 7) % games.length];
        items.push("\u2022 " + g.title.toUpperCase() + " \u00B7 " + g.genre.toUpperCase());
      }
      var half = items.map(function (t) {
        var s = document.createElement("span");
        s.textContent = t;
        return s;
      });
      track.innerHTML = "";
      half.concat(half.map(function (s) { return s.cloneNode(true); }))
        .forEach(function (s) { track.appendChild(s); });
    }).catch(function () {
      // Static fallback stays; just duplicate it once for the -50% loop.
      var kids = Array.prototype.slice.call(track.children);
      kids.forEach(function (k) { track.appendChild(k.cloneNode(true)); });
    });
  }

  /* ---------- Kid-safe badges on directory cards ---------- */
  var kidSafeSet = new Set();
  var kidSafeReady = null;
  function loadKidSafe() {
    if (kidSafeReady) return kidSafeReady;
    kidSafeReady = fetch(BASE + "api/v1/kid-safe.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("kid-safe " + res.status);
        return res.json();
      })
      .then(function (data) {
        (data["kid-safe"] || []).forEach(function (g) { if (g && g.id) kidSafeSet.add(g.id); });
        return kidSafeSet;
      })
      .catch(function () { return kidSafeSet; }); // never rejects: badges are decoration
    return kidSafeReady;
  }
  function wrapGameCard() {
    if (!window.BM || !BM.gameCard || BM.gameCard._arcadeWrapped) return;
    var orig = BM.gameCard;
    var wrapped = function (game) {
      var card = orig(game);
      if (game && kidSafeSet.has(game.id)) {
        var meta = card.querySelector(".game-meta");
        if (meta) {
          var badge = document.createElement("span");
          badge.className = "kid-badge";
          badge.textContent = "\u2022 Kid safe";
          meta.appendChild(badge);
        }
      }
      return card;
    };
    wrapped._arcadeWrapped = true;
    BM.gameCard = wrapped;
  }

  /* ---------- Boot ---------- */
  if (window.BM) {
    BM.kidSafeReady = loadKidSafe();
    wrapGameCard();
  }
  document.addEventListener("DOMContentLoaded", function () {
    injectFxToggle();
    fillTicker();
    resetAttract();
  });
})();
