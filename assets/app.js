/* Button Mash game browser: genre/player filters, search, random pick. */
(function () {
  "use strict";

  var GAMES_URL = "api/v1/games.json";

  var GENRE_LABELS = {
    "io": ".io arena", "browse": "itch.io picks", "collection": "archive collection"
  };
  var PLAYER_LABELS = { "single": "single-player", "multiplayer": "multiplayer", "both": "solo or multiplayer" };

  var state = { games: [], genre: "all", players: "all", q: "" };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function genreLabel(g) { return GENRE_LABELS[g] || g; }
  function playerLabel(p) { return PLAYER_LABELS[p] || p; }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return state.games.filter(function (g) {
      if (state.genre !== "all" && g.genre !== state.genre) return false;
      if (state.players !== "all") {
        if (state.players === "multiplayer") {
          if (g.players !== "multiplayer" && g.players !== "both") return false;
        } else if (g.players !== state.players && g.players !== "both") return false;
      }
      if (q) {
        var hay = (g.title + " " + g.genre + " " + g.description).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function card(g) {
    var a = el("article", "card");
    var h = el("h3");
    var link = el("a", null, g.title);
    link.href = "games/" + g.id + ".html";
    h.appendChild(link);
    a.appendChild(h);
    a.appendChild(el("p", "card-meta", genreLabel(g.genre) + " · " + playerLabel(g.players)));
    a.appendChild(el("p", null, g.description));
    var pl = el("p", "play-link");
    var pa = el("a", null, "▶ Play now");
    pa.href = g.url;
    pa.target = "_blank";
    pa.rel = "noopener";
    pl.appendChild(pa);
    a.appendChild(pl);
    return a;
  }

  function render() {
    var list = filtered();
    var grid = document.getElementById("cards");
    grid.textContent = "";
    list.forEach(function (g) { grid.appendChild(card(g)); });
    var count = document.getElementById("result-count");
    count.textContent = list.length === 1
      ? "1 game"
      : list.length + " games";
    if (list.length === 0) {
      grid.appendChild(el("p", null, "No games match — try clearing a filter."));
    }
  }

  function chipRow(container, name, options, current, onPick) {
    options.forEach(function (opt) {
      var b = el("button", "chip", opt.label);
      b.type = "button";
      b.setAttribute("aria-pressed", opt.value === current ? "true" : "false");
      b.addEventListener("click", function () {
        container.querySelectorAll(".chip").forEach(function (c) {
          c.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", "true");
        onPick(opt.value);
      });
      container.appendChild(b);
    });
  }

  function buildFilters() {
    var genres = {};
    state.games.forEach(function (g) { genres[g.genre] = true; });
    var genreOpts = [{ value: "all", label: "All" }].concat(
      Object.keys(genres).sort().map(function (g) {
        return { value: g, label: genreLabel(g) };
      })
    );
    chipRow(document.getElementById("genre-chips"), "genre", genreOpts, "all", function (v) {
      state.genre = v; render();
    });

    chipRow(document.getElementById("player-chips"), "players", [
      { value: "all", label: "All" },
      { value: "single", label: "Single-player" },
      { value: "multiplayer", label: "Multiplayer" }
    ], "all", function (v) { state.players = v; render(); });

    var search = document.getElementById("search");
    search.addEventListener("input", function () {
      state.q = search.value; render();
    });

    document.getElementById("random-btn").addEventListener("click", randomPick);
  }

  function randomPick() {
    var list = filtered();
    if (!list.length) return;
    var g = list[Math.floor(Math.random() * list.length)];

    var backdrop = el("div", "modal-backdrop");
    var modal = el("div", "modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Random game pick");
    modal.appendChild(el("p", "kicker", "🎲 the machine has spoken"));
    modal.appendChild(el("h2", null, g.title));
    modal.appendChild(el("p", "card-meta", genreLabel(g.genre) + " · " + playerLabel(g.players)));
    var desc = el("p", null, g.description);
    desc.style.color = "var(--muted)";
    modal.appendChild(desc);

    var row = el("div", "btn-row");
    var play = el("a", "btn btn-play", "▶ Play it");
    play.href = g.url; play.target = "_blank"; play.rel = "noopener";
    var again = el("button", "btn btn-ghost", "Reroll");
    again.type = "button";
    var close = el("button", "btn btn-ghost", "Close");
    close.type = "button";
    row.appendChild(play); row.appendChild(again); row.appendChild(close);
    modal.appendChild(row);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    function dismiss() {
      backdrop.remove();
      document.getElementById("random-btn").focus();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKey);
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) dismiss();
    });
    close.addEventListener("click", dismiss);
    again.addEventListener("click", function () {
      dismiss(); randomPick();
    });
    play.focus();
  }

  function renderGuides(guides) {
    var ul = document.getElementById("guide-list");
    guides.forEach(function (gd) {
      var li = document.createElement("li");
      var a = el("a", null, gd.title);
      a.href = "guides/" + gd.slug + ".html";
      li.appendChild(a);
      li.appendChild(el("p", "guide-meta", gd.difficulty + " · ~" + gd.time_minutes + " min"));
      li.appendChild(el("p", null, gd.summary));
      ul.appendChild(li);
    });
  }

  function init() {
    var statGames = document.getElementById("stat-games");
    fetch(GAMES_URL).then(function (r) { return r.json(); }).then(function (games) {
      state.games = games;
      if (statGames) statGames.textContent = games.length;
      var sg = document.getElementById("stat-genres");
      if (sg) {
        var s = {};
        games.forEach(function (g) { s[g.genre] = 1; });
        sg.textContent = Object.keys(s).length;
      }
      buildFilters();
      render();
    }).catch(function () {
      document.getElementById("result-count").textContent = "Could not load the game list.";
    });

    fetch("api/v1/guides.json").then(function (r) { return r.json(); }).then(function (guides) {
      renderGuides(guides);
      var st = document.getElementById("stat-guides");
      if (st) st.textContent = guides.length;
    }).catch(function () { /* guides list stays empty */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
