/* game-detail.js — the Curator's per-game metadata surface (game.html?id=).
   Static-first: renders from data/v1/games.json immediately, then probes
   GET /api/games?id=<id> for live enrichment through
   ApiClient.fetchWithFallback (badge: live / cached · updated HH:MM /
   waking / none). "On these shelves" cross-links come from
   data/v1/collections.json with the same live-first treatment. Kid-safe marks
   come from BM.kidSafeReady (static data/v1/kid-safe.json). Play-tracking
   rides the shared BM.Trophy store. Everything honest: no data is invented,
   and every fallback state says so. */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function readId() {
    var p;
    try { p = new URLSearchParams(location.search); }
    catch (e) { return null; }
    var raw = p.get("id");
    if (!raw) return null;
    var id = raw.trim().toLowerCase();
    return /^[a-z0-9-]+$/.test(id) && id.length <= 64 ? id : "!";
  }

  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function genreLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }

  function offlineState(main, title, sub) {
    main.innerHTML = "";
    var s = el("div", "empty-state empty-cabinet");
    s.appendChild(el("p", "empty-title", "» " + title));
    s.appendChild(el("p", "empty-sub", sub));
    var back = el("a", "chip", "» Browse the full directory");
    back.href = "games.html";
    s.appendChild(back);
    main.appendChild(s);
  }

  function chip(text, extra) {
    return el("span", "chip meta-chip" + (extra ? " " + extra : ""), text);
  }

  function makeBadge() {
    var b = el("span", "api-badge");
    b.id = "detail-badge";
    b.setAttribute("data-api-state", "waking");
    b.setAttribute("role", "status");
    b.setAttribute("tabindex", "0");
    return b;
  }

  function renderHero(game, enrich) {
    var hero = $("game-hero");
    // Keep the SAME badge node across re-renders so the live/cached state
    // the probe painted is never clobbered by a fresh "waking" node.
    var badge = document.getElementById("detail-badge");
    hero.innerHTML = "";
    var kick = el("span", "kicker", "GAME FILE // " + game.id.toUpperCase());
    hero.appendChild(kick);
    var h1 = el("h1", "game-title", game.title);
    hero.appendChild(h1);

    var meta = el("div", "game-meta-row");
    meta.appendChild(badge || makeBadge());
    meta.appendChild(chip(genreLabel(game.genre), "chip-genre"));
    if (game.tags && game.tags.length) {
      game.tags.forEach(function (t) { meta.appendChild(chip(t, "tag-mini")); });
    }
    if (enrich && enrich.multiplayer) meta.appendChild(chip("multiplayer", "chip-mp"));
    if (enrich && Array.isArray(enrich.vibes)) {
      enrich.vibes.forEach(function (v) { meta.appendChild(chip(v, "chip-vibe")); });
    }
    hero.appendChild(meta);

    var lede = el("p", "lede", game.description || "");
    hero.appendChild(lede);

    if (game.controls) {
      var ctl = el("p", "game-controls");
      ctl.appendChild(el("span", "kicker-sm", "» CONTROLS: "));
      ctl.appendChild(document.createTextNode(game.controls));
      hero.appendChild(ctl);
    }

    var dom = domainOf(game.url);
    var playRow = el("div", "play-row");
    var play = el("a", "btn-primary play-btn", "» PLAY AT " + (dom || "THE OFFICIAL PAGE"));
    play.href = game.url;
    play.target = "_blank";
    play.rel = "noopener noreferrer";
    playRow.appendChild(play);
    var note = el("p", "play-note",
      "Opens in a new tab. Button Mash never hosts the game itself — this link is the official page, verified live.");
    playRow.appendChild(note);
    hero.appendChild(playRow);
  }

  function renderTrophy(game) {
    var box = $("trophy-panel");
    if (!box || !window.BM || !BM.trophyReady) return;
    BM.trophyReady.then(function (store) {
      if (!store) return;
      box.innerHTML = "";
      box.appendChild(el("h2", null, "Your wall"));
      var row = el("div", "trophy-row detail-trophy");
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", "Track play status for " + game.title);
      // data-game + data-trophy: arcade.js's shared syncTrophyRow manages
      // every .trophy-row on the page (it disables rows with no data-game
      // on the first store change), so the detail row speaks the same
      // protocol as the cards instead of fighting it.
      row.setAttribute("data-game", game.id);
      function mk(kind, label, glyph) {
        var b = el("button", "trophy-btn", null);
        b.type = "button";
        b.setAttribute("data-trophy", kind);
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", label + ": " + game.title);
        b.appendChild(el("span", "trophy-glyph", glyph));
        b.appendChild(el("span", "trophy-label", label));
        b.addEventListener("click", function () {
          var res = kind === "played" ? store.togglePlayed(game.id) : store.toggleBeaten(game.id);
          if (!res || res.error) return;
          sync();
        });
        return b;
      }
      var bp = mk("played", "Played", "▶");
      var bb = mk("beaten", "Beaten", "✔");
      row.appendChild(bp);
      row.appendChild(bb);
      function sync() {
        var st = store.status(game.id);
        bp.setAttribute("aria-pressed", st.played ? "true" : "false");
        bb.setAttribute("aria-pressed", st.beaten ? "true" : "false");
      }
      sync();
      box.appendChild(row);
      box.appendChild(el("p", "trophy-hint",
        "Marks sync with your Trophy Room. Everything stays in your browser."));
    });
  }

  function renderShelves(game, collections) {
    var box = $("shelves-panel");
    if (!box) return;
    box.innerHTML = "";
    box.appendChild(el("h2", null, "On these shelves"));
    if (!collections) {
      // Honest offline state: the shelf list failed to load — that is not
      // the same as "this game is on no shelves".
      box.appendChild(el("p", "muted", "» SHELVES OFFLINE — the shelf list could not be loaded. The directory still has every game."));
      return;
    }
    var mine = collections.filter(function (c) {
      return (c.game_ids || []).indexOf(game.id) !== -1;
    });
    if (!mine.length) {
      box.appendChild(el("p", "muted", "Not on any curated shelf yet — it is still listed in the full directory."));
      return;
    }
    var ul = el("ul", "shelf-links");
    mine.forEach(function (c) {
      var li = document.createElement("li");
      var a = el("a", null, c.title);
      a.href = "collections.html#shelf-" + c.id;
      li.appendChild(a);
      if (c.tagline) li.appendChild(document.createTextNode(" — " + c.tagline));
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  function renderRelated(game, games) {
    var box = $("related-panel");
    if (!box || !window.BM || !BM.gameCard) return;
    var same = games.filter(function (g) {
      return g.id !== game.id && g.genre === game.genre;
    }).sort(function (a, b) { return a.title < b.title ? -1 : 1; }).slice(0, 4);
    if (!same.length) return;
    box.innerHTML = "";
    box.appendChild(el("h2", null, "More " + genreLabel(game.genre).toLowerCase() + " on the shelf"));
    var grid = el("div", "grid cols-2 detail-related");
    same.forEach(function (g) { grid.appendChild(BM.gameCard(g)); });
    box.appendChild(grid);
  }

  function renderNav(game, games) {
    var box = $("prevnext");
    if (!box) return;
    var sorted = games.slice().sort(function (a, b) { return a.title < b.title ? -1 : 1; });
    var i = sorted.findIndex(function (g) { return g.id === game.id; });
    if (i === -1) return;
    var prev = sorted[(i - 1 + sorted.length) % sorted.length];
    var next = sorted[(i + 1) % sorted.length];
    box.innerHTML = "";
    var a1 = el("a", "chip", "« " + prev.title);
    a1.href = "game.html?id=" + encodeURIComponent(prev.id);
    var a2 = el("a", "chip", next.title + " »");
    a2.href = "game.html?id=" + encodeURIComponent(next.id);
    var share = el("button", "chip", "» Copy game-file link");
    share.type = "button";
    share.addEventListener("click", function () {
      var url = location.origin + location.pathname + "?id=" + encodeURIComponent(game.id);
      var done = function (ok) {
        share.textContent = ok ? "» Copied!" : "» Copy failed";
        setTimeout(function () { share.textContent = "» Copy game-file link"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
    box.appendChild(a1);
    box.appendChild(share);
    box.appendChild(a2);
  }

  function loadStaticJSON(path) {
    return fetch(path, { cache: "force-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " " + r.status);
      return r.json();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var main = $("main");
    if (!main) return;
    var id = readId();
    if (id === null) {
      offlineState(main, "NO GAME ON THIS CHANNEL", "This page needs a game id — pick one from the directory.");
      return;
    }
    if (id === "!") {
      offlineState(main, "NO GAME ON THIS CHANNEL", "That game id is not shaped like a real one. The directory has the full list.");
      return;
    }

    Promise.all([
      loadStaticJSON("data/v1/games.json").then(function (j) { return j.games || []; }),
      // A failed shelf-list fetch resolves to null (not []): the panel must
      // say the shelves are offline, never "this game is on no shelves".
      loadStaticJSON("data/v1/collections.json").then(function (j) { return j.collections || []; })
        .catch(function () { return null; })
    ]).then(function (parts) {
      var games = parts[0];
      var collections = parts[1];
      var game = games.find(function (g) { return g.id === id; });
      if (!game) {
        offlineState(main, "NO GAME ON THIS CHANNEL",
          "No game with id \"" + id + "\" on the shelf. It may have been renamed — try the directory search.");
        return;
      }
      document.title = game.title + " — Button Mash";

      // Static render first: the page is complete even with the functions down.
      renderHero(game, null);
      renderShelves(game, collections);
      renderRelated(game, games);
      renderTrophy(game);
      renderNav(game, games);

      // Live probe: the Curator's enrichment (multiplayer / kid_safe / vibes)
      // overlaid onto the static render; badge tells the truth about freshness.
      var badge = $("detail-badge");
      if (window.ApiClient && badge) {
        window.ApiClient.fetchWithFallback("/api/games?id=" + encodeURIComponent(id),
          "data/v1/games.json", { badgeEl: badge })
          .then(function (res) {
            var list = (res.data && res.data.games) || [];
            var live = list.find(function (g) { return g.id === id; });
            if (res.source === "live" && live) {
              renderHero(game, live);
              renderShelves(game, collections);
              renderRelated(game, games);
            }
          });
        // Collections get the same live-first treatment; resolved titles/URLs
        // are identical content, the badge honesty is the point.
        window.ApiClient.fetchWithFallback("/api/collections", "data/v1/collections.json", { badgeEl: null })
          .then(function (res) {
            var cols = (res.data && res.data.collections) || [];
            if (cols.length) {
              var shaped = cols.map(function (c) {
                return { id: c.id, title: c.title, tagline: c.tagline, game_ids: (c.games || []).map(function (g) { return g.id; }) };
              });
              renderShelves(game, shaped);
            }
          });
      }

      // Kid-safe mark rides the static verdict file (same source as the cards).
      if (window.BM && BM.kidSafeReady) {
        BM.kidSafeReady.then(function (set) {
          if (set && set.has && set.has(game.id)) {
            var meta = document.querySelector(".game-meta-row");
            if (meta) meta.appendChild(chip("• KID SAFE", "kid-chip"));
          }
        });
      }
    }).catch(function () {
      offlineState(main, "CABINET OFFLINE", "Could not load the game catalog. Check your connection and try again.");
    });
  });
})();
