/* game-detail.js, the Curator's per-game metadata surface (game.html?id=).
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

    // The description and the controls no longer sit in the hero: the
    // machine page below the backglass carries them (the premise leads
    // The Loop, the controls are stated in The Cabinet and again in the
    // spec list). The hero is the backglass only: name, marks, play.
    // House rule (user order, 2026-10-14): Button Mash does not link
    // out to play. The play row points at the site's own machines, the
    // Player and the Converter; the game's own URL stays in the record
    // as provenance (footnote one), never as a play link.
    var playRow = el("div", "play-row");
    var play = el("a", "btn-primary play-btn", "» PLAY IN THE PLAYER");
    play.href = "player.html";
    playRow.appendChild(play);
    var convert = el("a", "card-link", "» Convert a game you own");
    convert.href = "converter.html";
    playRow.appendChild(convert);
    var journalLink = el("a", "card-link", "» Journal this game");
    journalLink.href = "journal.html?game=" + game.id;
    playRow.appendChild(journalLink);
    hero.appendChild(playRow);
  }

  /* ---- The machine page (rotation 22, MASH-STUDY Section 4.1) ----
     The game as a machine, in the Analogue anatomy: claim headlines in
     the machine's own order with the specifications written as prose
     inside the claims, then the page closes in apparatus, a ruled spec
     list and numbered footnotes carrying provenance, version notes,
     and the Curator's qualifications. Editions print with their numbers
     in the AP formula's manner (BM_01, BM_02), the same formula the
     listings and the credits lists carry. All copy is composed from
     the game's record (data/v1/games.json); nothing is invented at
     render time beyond the grammar that joins the facts. */

  function editionCode(i) { return "BM_" + (i + 1 < 10 ? "0" : "") + (i + 1); }

  function shelvedRung(game) {
    var eds = game.editions || [];
    for (var i = 0; i < eds.length; i++) {
      if (eds[i].shelved) return { index: i, rung: eds[i] };
    }
    return null;
  }

  function splitSentences(text) {
    var parts = String(text || "").split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/);
    return parts.map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function lcFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

  var FEEL_CLAIMS = {
    puzzle: "Quiet on the surface, loud in the head.",
    action: "Hands first, questions later.",
    roguelike: "Death is the tutorial.",
    idle: "It plays while you watch, and while you do not.",
    multiplayer: "Better with witnesses.",
    retro: "An old machine, still warm.",
    horror: "Small shelf, long shadows.",
    cozy: "No timers, no teeth."
  };

  var LOOP_FALLBACK = {
    puzzle: "The loop is the whole game: one board, one decision at a time, and a restart that is always one click away.",
    action: "The loop is the whole game: drop in, stir it up, and go again before the dust settles.",
    roguelike: "The loop is the whole game: one run teaches the next, and the next run proves it.",
    idle: "The loop is the whole game: set it growing, come back, and spend what it earned you.",
    multiplayer: "The loop is the whole game: one more round with the same crowd, and then one more after that.",
    retro: "The loop is the whole game: the same cabinet ritual that worked the first time, quarters optional.",
    horror: "The loop is the whole game: walk in, learn what the place wants, and try to walk out.",
    cozy: "The loop is the whole game: potter, wander, make a small thing, and close the tab smiling."
  };

  function claimSection(verdict, claim, proseParts) {
    var s = el("section", "machine-claim");
    s.appendChild(el("h2", "claim-verdict", verdict));
    s.appendChild(el("p", "claim-headline", claim));
    proseParts.forEach(function (p) {
      if (p) s.appendChild(el("p", "claim-prose", p));
    });
    return s;
  }

  function renderMachine(game) {
    var box = $("machine-page");
    if (!box || !game.maker || !game.editions) return;
    box.innerHTML = "";
    var dom = domainOf(game.url);
    var shelved = shelvedRung(game);
    var t = game.time || {};
    var sentences = splitSentences(game.description || "");
    var premise = sentences.length ? sentences[0] : (game.description || "");
    var rest = sentences.slice(1).join(" ");

    // THE CABINET. Where the machine lives, and who built it.
    var cabinetProse = game.title + " is a " + genreLabel(game.genre).toLowerCase() +
      " game by " + game.maker + ". It lives at " + dom + ", the official page, and runs " +
      "in the browser with nothing to install and no account to make. The controls are " +
      lcFirst(game.controls || "whatever the page asks of you") + ".";
    box.appendChild(claimSection("The Cabinet.", game.title + " runs in a tab.", [cabinetProse]));

    // THE LOOP. The premise leads, as the claim; the rest is prose.
    var loopProse = [];
    if (rest) loopProse.push(rest);
    else if (LOOP_FALLBACK[game.genre]) loopProse.push(LOOP_FALLBACK[game.genre]);
    box.appendChild(claimSection("The Loop.", premise, loopProse));

    // THE FEEL. The genre's claim, and the maker's name on it.
    var feelProse = "The Curator files " + game.title + " under " +
      genreLabel(game.genre).toLowerCase() + ", and the filing is the maker's fault: " +
      game.maker + " built it that way.";
    if (game.tags && game.tags.length) {
      feelProse += " It travels with the " + game.tags.join(" and ") + " crowd.";
    }
    box.appendChild(claimSection("The Feel.", FEEL_CLAIMS[game.genre] || "Filed, verified, and on the shelf.", [feelProse]));

    // THE MODES. Who the machine seats, and the times stated in prose.
    var modesClaim = game.players === "1 player"
      ? "One pair of hands is the whole arcade."
      : "Built to be played with other people.";
    var modesProse = "Seats: " + lcFirst(game.players || "1 player") + ". " +
      "Main story: " + lcFirst(t.main || "") + ". " +
      "Main + extra: " + lcFirst(t.extra || "") + ". " +
      "Completionist: " + lcFirst(t.full || "") + ".";
    box.appendChild(claimSection("The Modes.", modesClaim, [modesProse]));

    // THE APPARATUS, part one: the ruled spec list.
    var app = el("section", "machine-apparatus");
    app.appendChild(el("h2", "claim-verdict", "The Specifications."));
    var dl = el("dl", "spec-list");
    function specRow(term, value) {
      var row = el("div", "spec-row");
      row.appendChild(el("dt", null, term));
      var dd = el("dd", null, value);
      row.appendChild(dd);
      dl.appendChild(row);
    }
    specRow("Maker", game.maker);
    specRow("Players", game.players);
    specRow("Controls", game.controls || "");
    specRow("Main story", t.main || "");
    specRow("Main + extra", t.extra || "");
    specRow("Completionist", t.full || "");
    if (shelved) {
      specRow("Versions", editionCode(shelved.index) + " of " + game.editions.length +
        " on record: " + shelved.rung.name + " is the shelved build");
    }
    app.appendChild(dl);

    // The edition ladder, numbered in the AP formula's manner.
    if (game.editions.length) {
      var ladder = el("ol", "edition-ladder");
      game.editions.forEach(function (rung, i) {
        var li = el("li", "ladder-rung" + (rung.shelved ? " rung-shelved" : ""));
        li.appendChild(el("span", "rung-code", editionCode(i)));
        li.appendChild(el("span", "rung-name", rung.name));
        li.appendChild(el("span", "rung-note", rung.note));
        if (rung.shelved) li.appendChild(el("span", "rung-mark", "ON THE SHELF"));
        ladder.appendChild(li);
      });
      app.appendChild(ladder);
    }

    // THE APPARATUS, part two: the numbered footnotes.
    app.appendChild(el("h2", "claim-verdict", "The Fine Print."));
    var notes = el("ol", "footnotes");
    function note(text) { notes.appendChild(el("li", null, text)); }
    if (shelved) {
      note("Provenance. The build of record is " + editionCode(shelved.index) + ", " +
        shelved.rung.name + ", served at " + dom + ", and the Curator verified it live " +
        "for this record. This file links nowhere else to play: games on Button Mash " +
        "are played on Button Mash.");
    }
    if (game.editions.length > 1) {
      note("Versions. The ladder lists every form of this game the Curator's record " +
        "holds, oldest first. Mash shelves " + editionCode(shelved ? shelved.index : 0) +
        "; the other rungs are named so the record is complete, not because the site " +
        "links them.");
    } else {
      note("Versions. One form is on record: " + (shelved ? shelved.rung.name : "") +
        ". If this game exists in other forms, the record does not hold them yet.");
    }
    note("The times. The session figures are the Curator's editorial estimates for a " +
      "browser game, the same table the Game Night dealer uses, and they are never " +
      "copied from any other catalog. The basis for this game: " +
      (t.signal === "pinned"
        ? "pinned by hand, because the genre bucket plainly misread this one."
        : "genre-typical, the honest average for its kind until a hand pin says otherwise."));
    note("The credit. " + game.maker + ", as the Curator records it. Where a game's " +
      "own page or its preservation record names a person or a studio, that is what " +
      "prints; where the record holds only the maker's published imprint, the imprint " +
      "prints. Corrections are welcome and land in the record.");
    app.appendChild(notes);

    box.appendChild(app);
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
      // Honest offline state: the shelf list failed to load, that is not
      // the same as "this game is on no shelves".
      box.appendChild(el("p", "muted", "» SHELVES OFFLINE, the shelf list could not be loaded. The directory still has every game."));
      return;
    }
    var mine = collections.filter(function (c) {
      return (c.game_ids || []).indexOf(game.id) !== -1;
    });
    if (!mine.length) {
      box.appendChild(el("p", "muted", "Not on any curated shelf yet, it is still listed in the full directory."));
      return;
    }
    var ul = el("ul", "shelf-links");
    mine.forEach(function (c) {
      var li = document.createElement("li");
      var a = el("a", null, c.title);
      a.href = "collections.html#shelf-" + c.id;
      li.appendChild(a);
      if (c.tagline) li.appendChild(document.createTextNode(": " + c.tagline));
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
      offlineState(main, "NO GAME ON THIS CHANNEL", "This page needs a game id, pick one from the directory.");
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
          "No game with id \"" + id + "\" on the shelf. It may have been renamed, try the directory search.");
        return;
      }
      document.title = game.title + ": Button Mash";

      // Static render first: the page is complete even with the functions down.
      renderHero(game, null);
      renderMachine(game);
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
              // Two shapes reach here: the live function resolves game_ids
              // into games[]; the static fallback carries raw game_ids.
              // Accept both, mapping only games[] turned every fallback
              // shelf into an empty game list and wiped the static render.
              var shaped = cols.map(function (c) {
                return {
                  id: c.id, title: c.title, tagline: c.tagline,
                  game_ids: c.game_ids || (c.games || []).map(function (g) { return g.id; })
                };
              }).filter(function (c) { return c.game_ids.length; });
              if (shaped.length) renderShelves(game, shaped);
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
