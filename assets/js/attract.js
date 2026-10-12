/* Button Mash — wow wave 1 "Attract Mode": the homepage cabinet.
   The demo screen cycles real game spotlights from the live catalog
   (deterministic daily rotation, never canned slides) with high-score-style
   stat callouts drawn from the real catalog + the player's actual Trophy
   Room progress. INSERT COIN drops into the games directory with a CRT
   screen-off transition. Everything is skippable, keyboard-operable, and
   fully gated on the FX toggle + prefers-reduced-motion (reduced motion
   gets a static cabinet with every game listed, no cycling).
   Pure enhancement: without JS the coin plate is a plain link. */
(function () {
  "use strict";

  var screen = document.getElementById("cabinet-screen");
  if (!screen || !window.BM || !BM.loadGames) return; /* not the homepage */

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function fxOff() { return document.documentElement.classList.contains("fx-off"); }

  var SLIDE_MS = 8000, CALLOUT_MS = 4000, N_SLIDES = 6;
  var stage = document.getElementById("demo-stage");
  var announcer = document.getElementById("demo-announcer");
  var calloutEl = document.getElementById("demo-callout");
  var statsSummary = document.getElementById("demo-stats-summary");
  var prevBtn = document.getElementById("demo-prev");
  var nextBtn = document.getElementById("demo-next");
  var pauseBtn = document.getElementById("demo-pause");
  var coin = document.getElementById("insert-coin");

  var slides = [], slideIdx = 0, slideTimer = 0, calloutTimer = 0;
  var callouts = [], calloutIdx = 0;
  var userPaused = false, hoverPaused = false; /* explicit pause vs transient hover/focus pause */
  function isPaused() { return userPaused || hoverPaused; }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  /* Deterministic daily spotlight pick: round-robin across genres, seeded
     offset within each genre, so the demo changes every day and always
     shows real catalog records. */
  function pickSpotlights(games) {
    var dayIdx = Math.floor(Date.now() / 86400000);
    var byGenre = {};
    games.forEach(function (g) {
      if (g && g.genre) (byGenre[g.genre] = byGenre[g.genre] || []).push(g);
    });
    var genres = Object.keys(byGenre).sort();
    if (!genres.length) return [];
    var out = [], seen = {};
    for (var i = 0; i < N_SLIDES * 2 && out.length < N_SLIDES; i++) {
      var pool = byGenre[genres[(dayIdx + i) % genres.length]];
      var pick = pool[(dayIdx * 13 + i * 29) % pool.length];
      if (pick && !seen[pick.id]) { seen[pick.id] = 1; out.push(pick); }
    }
    return out;
  }

  function trophyStore(games, cols) {
    if (!window.BM || !BM.Trophy) return null;
    try {
      return BM.Trophy.initDefault(games, cols, {
        getFavs: function () { return BM.getFavs(); },
        setFavs: function (ids) { return BM.setFavs(ids); }
      });
    } catch (e) { return null; }
  }

  /* High-score-style callouts: real catalog facts first, then the player's
     real Trophy Room progress where it exists. */
  function buildCallouts(games, cols, kidCount, store) {
    var out = [
      "\u00BB " + games.length + " GAMES ON THE SHELF",
      "\u00BB " + kidCount + " KID-SAFE PICKS",
      "\u00BB " + cols.length + " CURATED SHELVES"
    ];
    var hasProgress = false;
    if (store) {
      try {
        var c = store.counts();
        var ach = store.achievements().filter(function (a) { return a.earned; });
        var st = store.streak();
        hasProgress = (c.played + c.beaten + c.favorites) > 0;
        if (hasProgress) {
          out.push("YOU: " + c.played + " PLAYED \u00B7 " + c.beaten + " BEATEN");
          if (ach.length) out.push("\u00BB " + ach.length + " PRIZES ON YOUR WALL");
          if (st && st.current >= 2) out.push(st.current + "-DAY STREAK \u2014 KEEP IT LIT");
        }
      } catch (e) { /* stats are decoration; the demo must not die on them */ }
    }
    if (!hasProgress) out.push("PRESS START \u2014 YOUR SHELF AWAITS");
    return out;
  }

  function buildSlide(game, i, total, kidSafe) {
    var s = el("article", "demo-slide");
    s.setAttribute("aria-roledescription", "slide");
    s.setAttribute("aria-label", "Spotlight " + (i + 1) + " of " + total + ": " + game.title);
    s.appendChild(el("p", "demo-kicker", "\u00BB SPOTLIGHT " + (i + 1) + "/" + total));
    s.appendChild(el("h2", "demo-title", game.title));
    var meta = el("p", "demo-meta");
    meta.appendChild(el("span", "genre-tag genre-" + game.genre, game.genre));
    if (kidSafe.has(game.id)) meta.appendChild(el("span", "kid-badge", "\u2022 Kid safe"));
    if (game.controls) meta.appendChild(el("span", "controls-hint", game.controls));
    s.appendChild(meta);
    if (game.description) s.appendChild(el("p", "demo-desc", game.description));
    if (game.tags && game.tags.length) {
      var tags = el("p", "demo-tags");
      game.tags.slice(0, 5).forEach(function (t) { tags.appendChild(el("span", "tag-mini", t)); });
      s.appendChild(tags);
    }
    var dom = domainOf(game.url);
    var play = el("a", "demo-play", "\u00BB PLAY AT " + (dom || "THE ARCADE").toUpperCase());
    play.href = game.url;
    play.target = "_blank";
    play.rel = "noopener noreferrer";
    play.setAttribute("aria-label", "Play " + game.title + " at " + (dom || "its site") + " (opens in a new tab)");
    s.appendChild(play);
    return s;
  }

  function showSlide(n, announce) {
    if (!slides.length) return;
    slideIdx = ((n % slides.length) + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      var on = i === slideIdx;
      s.classList.toggle("on", on);
      if (on) { s.removeAttribute("inert"); s.removeAttribute("aria-hidden"); }
      else { s.setAttribute("inert", ""); s.setAttribute("aria-hidden", "true"); }
    });
    if (announce !== false && announcer) {
      announcer.textContent = "Spotlight " + (slideIdx + 1) + " of " + slides.length +
        ": " + slides[slideIdx].getAttribute("aria-label").replace(/^Spotlight \d+ of \d+: /, "");
    }
  }

  function cycling() {
    return !reduceMotion && !fxOff() && !isPaused() && !document.hidden && slides.length > 1;
  }
  function restartSlideTimer() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = 0; }
    if (reduceMotion || fxOff()) return;
    slideTimer = setInterval(function () {
      if (cycling()) showSlide(slideIdx + 1);
    }, SLIDE_MS);
  }
  function showCallout(n) {
    if (!callouts.length || !calloutEl) return;
    calloutIdx = ((n % callouts.length) + callouts.length) % callouts.length;
    var swap = function () {
      calloutEl.textContent = callouts[calloutIdx];
      calloutEl.classList.remove("swap-out");
    };
    if (reduceMotion || fxOff()) { swap(); return; }
    calloutEl.classList.add("swap-out");
    setTimeout(swap, 220);
  }
  function restartCalloutTimer() {
    if (calloutTimer) { clearInterval(calloutTimer); calloutTimer = 0; }
    if (reduceMotion || fxOff() || callouts.length < 2) return;
    calloutTimer = setInterval(function () {
      if (!document.hidden && !fxOff()) showCallout(calloutIdx + 1);
    }, CALLOUT_MS);
  }

  /* Reduced motion: no demo, no transport — the full catalog, static. */
  function renderStaticList(games, kidSafe) {
    stage.style.display = "none";
    [prevBtn, nextBtn, pauseBtn].forEach(function (b) { if (b) b.hidden = true; });
    var head = el("p", "demo-all-head", "\u00BB THE FULL SHELF \u2014 " + games.length + " GAMES");
    screen.insertBefore(head, stage);
    var list = el("ul", "demo-all-list");
    list.setAttribute("aria-label", "All " + games.length + " games");
    var sorted = games.slice().sort(function (a, b) {
      return String(a.title).localeCompare(String(b.title));
    });
    sorted.forEach(function (g) {
      var li = document.createElement("li");
      var a = el("a", null, g.title);
      a.href = g.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      li.appendChild(a);
      li.appendChild(el("span", "genre-tag genre-" + g.genre, g.genre));
      if (kidSafe.has(g.id)) li.appendChild(el("span", "kid-badge", "\u2022 Kid safe"));
      list.appendChild(li);
    });
    screen.insertBefore(list, stage.nextSibling);
    if (statsSummary) {
      statsSummary.classList.remove("sr-only");
      statsSummary.classList.add("demo-static-stats");
    }
  }

  function demoOffline() {
    stage.innerHTML = "";
    var d = el("div", "demo-offline");
    d.innerHTML = "";
    d.appendChild(el("p", null, "\u00BB CABINET OFFLINE \u2014 the demo feed hiccuped."));
    var a = el("a", null, "Browse the games directory \u203A");
    a.href = "games.html";
    d.appendChild(a);
    stage.appendChild(d);
    [prevBtn, nextBtn, pauseBtn].forEach(function (b) { if (b) b.hidden = true; });
  }

  /* INSERT COIN: CRT screen-off, then the games directory. Plain link
     behavior (new tab, no JS) is preserved; reduced-motion/FX-off skips
     the transition and navigates immediately. */
  function bindCoin() {
    if (!coin) return;
    coin.addEventListener("click", function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button === 1) return;
      ev.preventDefault();
      if (reduceMotion || fxOff()) { window.location.href = "games.html"; return; }
      screen.classList.add("screen-off");
      setTimeout(function () { window.location.href = "games.html"; }, 520);
    });
  }

  function bindTransport() {
    if (prevBtn) prevBtn.addEventListener("click", function () {
      showSlide(slideIdx - 1); restartSlideTimer();
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      showSlide(slideIdx + 1); restartSlideTimer();
    });
    if (pauseBtn) pauseBtn.addEventListener("click", function () {
      userPaused = !userPaused;
      pauseBtn.setAttribute("aria-pressed", userPaused ? "true" : "false");
      pauseBtn.innerHTML = "";
      pauseBtn.appendChild(el("span", null, userPaused ? "\u25B6 Play" : "\u23F8 Pause"));
      if (!userPaused) restartSlideTimer();
    });
    /* Politeness pauses: hover/focus on the screen, hidden tab. */
    screen.addEventListener("pointerenter", function () { hoverPaused = true; });
    screen.addEventListener("pointerleave", function () { hoverPaused = false; });
    screen.addEventListener("focusin", function () { hoverPaused = true; });
    screen.addEventListener("focusout", function () { hoverPaused = false; });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) restartSlideTimer();
    });
    /* The FX toggle is the kill switch: stop the cycle the moment it flips. */
    try {
      new MutationObserver(function () { restartSlideTimer(); restartCalloutTimer(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {}
  }

  /* Boot: real catalog -> real slides -> real callouts. */
  var boot = function () {
    bindCoin();
    var kidSafe = new Set();
    var gamesP = BM.loadGames();
    var kidsP = fetch("api/v1/kid-safe.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("kids " + r.status); return r.json(); })
      .then(function (d) { (d["kid-safe"] || []).forEach(function (g) { if (g && g.id) kidSafe.add(g.id); }); })
      .catch(function () { /* badges are decoration; the demo plays on */ });
    var colsP = fetch("data/collections.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("cols " + r.status); return r.json(); })
      .then(function (d) { return (d && d.collections) || []; })
      .catch(function () { return []; });

    Promise.all([gamesP, kidsP, colsP]).then(function (parts) {
      var games = parts[0] || [], cols = parts[2] || [];
      if (!games.length) { demoOffline(); return; }
      var store = trophyStore(games, cols);
      callouts = buildCallouts(games, cols, kidSafe.size, store);
      if (statsSummary) {
        statsSummary.textContent = "Shelf stats: " + games.length + " games, " +
          cols.length + " collections, " + kidSafe.size + " kid-safe picks." +
          (store ? (function () {
            try {
              var c = store.counts();
              return " Your progress: " + c.played + " played, " + c.beaten + " beaten, " +
                c.favorites + " favorites.";
            } catch (e) { return ""; }
          })() : "");
      }
      if (reduceMotion) { renderStaticList(games, kidSafe); return; }
      var picks = pickSpotlights(games);
      if (!picks.length) { demoOffline(); return; }
      picks.forEach(function (g, i) {
        var s = buildSlide(g, i, picks.length, kidSafe);
        stage.appendChild(s);
        slides.push(s);
      });
      showSlide(0, false);
      if (announcer) announcer.textContent = "Demo loop: " + slides.length +
        " game spotlights. Use Previous and Next to skip, or Insert Coin for the full directory.";
      showCallout(0);
      bindTransport();
      restartSlideTimer();
      restartCalloutTimer();
    }).catch(function () { demoOffline(); });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
