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

  /* ---------- Feature detection: anchor positioning + Popover ---------- */
  var anchorOK = false, popoverOK = false;
  try {
    anchorOK = !!(window.CSS && CSS.supports("position-anchor: --bm-tip") &&
      CSS.supports("position-area: bottom"));
  } catch (e) { anchorOK = false; }
  try {
    popoverOK = typeof HTMLElement !== "undefined" &&
      "showPopover" in document.createElement("div");
  } catch (e) { popoverOK = false; }

  /* ---------- Kid-safe badges + tag tokens + tooltips on cards ---------- */
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
      var meta = card.querySelector(".game-meta");
      if (game && kidSafeSet.has(game.id) && meta) {
        var badge = document.createElement("span");
        badge.className = "kid-badge";
        badge.textContent = "\u2022 Kid safe";
        meta.appendChild(badge);
      }
      attachCardExtras(card, game, meta);
      return card;
    };
    wrapped._arcadeWrapped = true;
    BM.gameCard = wrapped;
  }

  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  /* Card extras: static tag tokens in the meta row + an anchored tooltip.
     The tooltip uses the Popover API with CSS position-anchor where
     supported; elsewhere it falls back to a fixed-position popover
     computed from the trigger rect (html.no-anchor), or a plain
     toggled div where Popover itself is missing (html.no-popover). */
  var tipSeq = 0;
  function attachCardExtras(card, game, meta) {
    if (!game) return;
    if (meta && game.tags && game.tags.length) {
      game.tags.forEach(function (t) {
        var s = document.createElement("span");
        s.className = "tag-mini";
        s.textContent = t;
        meta.appendChild(s);
      });
    }
    var n = ++tipSeq;
    var anchorName = "--bm-tip-" + n;

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "tip-trigger";
    trigger.setAttribute("aria-label", "About " + game.title);
    trigger.setAttribute("aria-expanded", "false");
    var dot = document.createElement("span");
    dot.className = "tip-i";
    dot.setAttribute("aria-hidden", "true");
    dot.textContent = "i";
    trigger.appendChild(dot);
    try { trigger.style.setProperty("anchor-name", anchorName); } catch (e) {}

    var tip = document.createElement("div");
    tip.className = "card-tip";
    tip.id = "bm-tip-" + n;
    tip.setAttribute("role", "tooltip");
    try { tip.style.setProperty("position-anchor", anchorName); } catch (e) {}
    if (popoverOK) {
      tip.setAttribute("popover", "manual");
    } else {
      tip.hidden = true;
    }
    var title = document.createElement("div");
    title.className = "tip-title";
    title.textContent = game.title;
    tip.appendChild(title);
    if (game.description) {
      var desc = document.createElement("p");
      desc.className = "tip-desc";
      desc.textContent = game.description;
      tip.appendChild(desc);
    }
    if (game.tags && game.tags.length) {
      var trow = document.createElement("div");
      trow.className = "tip-tags";
      game.tags.forEach(function (t) {
        var ts = document.createElement("span");
        ts.className = "tag-mini";
        ts.textContent = t;
        trow.appendChild(ts);
      });
      tip.appendChild(trow);
    }
    if (kidSafeSet.has(game.id)) {
      var kid = document.createElement("p");
      kid.className = "tip-line tip-kid";
      kid.textContent = "\u2022 KID SAFE \u2014 curated for young players";
      tip.appendChild(kid);
    }
    if (game.controls) {
      var ctl = document.createElement("p");
      ctl.className = "tip-line";
      ctl.textContent = "\u00BB CONTROLS: " + game.controls;
      tip.appendChild(ctl);
    }
    var dom = domainOf(game.url);
    if (dom) {
      var dl = document.createElement("p");
      dl.className = "tip-line tip-domain";
      dl.textContent = "\u25B8 play at " + dom + " \u00B7 opens in a new tab";
      tip.appendChild(dl);
    }
    card.appendChild(tip);
    if (meta) meta.appendChild(trigger); else card.appendChild(trigger);

    var showTimer = null, hideTimer = null;
    function cancelTimers() {
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }
    function show() {
      cancelTimers();
      if (!anchorOK) positionFallback(tip, trigger);
      if (popoverOK) { try { tip.showPopover(); } catch (e) {} }
      else { tip.hidden = false; tip.classList.add("tip-open"); }
      trigger.setAttribute("aria-expanded", "true");
    }
    function hide() {
      cancelTimers();
      if (popoverOK) { try { tip.hidePopover(); } catch (e) {} }
      else { tip.hidden = true; tip.classList.remove("tip-open"); }
      trigger.setAttribute("aria-expanded", "false");
    }
    trigger.addEventListener("mouseenter", function () {
      cancelTimers();
      showTimer = setTimeout(show, 160);
    });
    trigger.addEventListener("mouseleave", function () {
      cancelTimers();
      hideTimer = setTimeout(hide, 140);
    });
    tip.addEventListener("mouseenter", cancelTimers);
    tip.addEventListener("mouseleave", hide);
    trigger.addEventListener("focus", show);
    trigger.addEventListener("blur", hide);
    trigger.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { hide(); trigger.blur(); }
    });
  }

  /* Non-anchor fallback: pin the tooltip under the trigger, clamped to
     the viewport, flipping above when there is no room below. */
  function positionFallback(tip, trigger) {
    var r = trigger.getBoundingClientRect();
    var w = Math.min(340, window.innerWidth - 16);
    var x = r.left + r.width / 2 - w / 2;
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    var estH = 200;
    var y = r.bottom + 10;
    if (y + estH > window.innerHeight - 8) y = Math.max(8, r.top - estH - 10);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
    tip.style.width = w + "px";
  }

  /* ---------- Hover physics: a whisper of cabinet tilt ---------- */
  function initTilt() {
    var grid = document.getElementById("games-grid");
    if (!grid) return;
    var fine = false, noPref = false;
    try {
      fine = window.matchMedia("(pointer: fine)").matches;
      noPref = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    } catch (e) {}
    if (!fine || !noPref) return;
    var raf = null, current = null, cx = 0, cy = 0;
    function apply() {
      raf = null;
      if (!current) return;
      if (document.documentElement.classList.contains("fx-off")) {
        current.style.transform = "";
        return;
      }
      var r = current.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (cx - r.left) / r.width - 0.5;
      var py = (cy - r.top) / r.height - 0.5;
      current.style.transform =
        "translateY(-5px) perspective(900px) rotateX(" + (-py * 5).toFixed(2) +
        "deg) rotateY(" + (px * 5).toFixed(2) + "deg)";
    }
    grid.addEventListener("pointerover", function (ev) {
      var card = ev.target && ev.target.closest ? ev.target.closest(".game-card") : null;
      if (card && grid.contains(card)) current = card;
    });
    grid.addEventListener("pointermove", function (ev) {
      if (!current) return;
      cx = ev.clientX; cy = ev.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    grid.addEventListener("pointerout", function (ev) {
      var card = ev.target && ev.target.closest ? ev.target.closest(".game-card") : null;
      if (!card || current !== card) return;
      if (ev.relatedTarget && card.contains(ev.relatedTarget)) return; // still inside
      current.style.transform = "";
      current = null;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }

  /* ---------- Boot ---------- */
  if (window.BM) {
    BM.kidSafeReady = loadKidSafe();
    wrapGameCard();
  }
  document.documentElement.classList.add(anchorOK ? "anchor-ok" : "no-anchor");
  if (!popoverOK) document.documentElement.classList.add("no-popover");
  document.addEventListener("DOMContentLoaded", function () {
    injectFxToggle();
    fillTicker();
    initTilt();
    resetAttract();
  });
})();
