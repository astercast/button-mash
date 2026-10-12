/* Button Mash — games directory: search, genre filters, favorites, random, game-of-the-day. */
(function () {
  'use strict';

  function genreLabel(g) {
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  /* ---------- URL-synced filter state ----------
     Filters live in the query string (?q=&genre=&tags=a,b&favs=1) so any
     view is shareable. State is read on load (validated against the
     catalog) and written with replaceState on every change — no history
     spam, no reloads. */
  function readURLState(knownGenres, knownTags) {
    var p;
    try { p = new URLSearchParams(location.search); }
    catch (e) { return { q: "", genre: "all", tags: [], favsOnly: false }; }
    var st = { q: "", genre: "all", tags: [], favsOnly: false };
    var q = p.get("q");
    if (q) st.q = q.slice(0, 120);
    var g = p.get("genre");
    if (g && knownGenres.indexOf(g) !== -1) st.genre = g;
    var t = p.get("tags");
    if (t) {
      st.tags = t.split(",").filter(function (x) { return knownTags.indexOf(x) !== -1; });
    }
    st.favsOnly = p.get("favs") === "1";
    return st;
  }

  async function initDirectory() {
    var grid = document.getElementById('games-grid');
    if (!grid) return;
    var games;
    try { games = await BM.loadGames(); }
    catch (e) {
      grid.innerHTML = '<div class="empty-state empty-cabinet"><p class="empty-title">» CABINET OFFLINE</p>' +
        '<p class="empty-sub">Could not load the game list. Check your connection and try again.</p>' +
        '<button class="chip" type="button" onclick="location.reload()">» Retry</button></div>';
      return;
    }

    var searchInput = document.getElementById('game-search');
    var genreChips = document.getElementById('genre-chips');
    var tagWrap = document.getElementById('tag-chips');
    var hitsWrap = document.getElementById('tag-hits');
    var favOnlyBtn = document.getElementById('fav-only');
    var copyViewBtn = document.getElementById('copy-view');
    var randomBtn = document.getElementById('random-game');
    var countEl = document.getElementById('results-count');

    // Data-driven hero count (static HTML carries the last verified number as fallback)
    var heroCount = document.getElementById('games-hero-count');
    if (heroCount) heroCount.textContent = games.length + ' games.';

    // Known values for URL validation + tag counts for the token row
    var genres = ['all'].concat(Array.from(new Set(games.map(function (g) { return g.genre; })))).sort();
    var tagCounts = {};
    games.forEach(function (g) {
      (g.tags || []).forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });
    var knownTags = Object.keys(tagCounts).sort(function (a, b) {
      return tagCounts[b] - tagCounts[a] || (a < b ? -1 : a > b ? 1 : 0);
    });

    var state = readURLState(genres, knownTags);

    function writeURLState() {
      var p = new URLSearchParams();
      if (state.q.trim()) p.set('q', state.q.trim());
      if (state.genre !== 'all') p.set('genre', state.genre);
      if (state.tags.length) p.set('tags', state.tags.join(','));
      if (state.favsOnly) p.set('favs', '1');
      var qs = p.toString();
      try {
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
      } catch (e) {}
    }

    // Build genre chips
    genres.forEach(function (g) {
      var chip = BM.el('button', 'chip', g === 'all' ? 'All' : genreLabel(g));
      chip.type = 'button';
      chip.setAttribute('aria-pressed', state.genre === g ? 'true' : 'false');
      chip.dataset.genre = g;
      chip.addEventListener('click', function () {
        state.genre = g;
        syncGenreChips();
        render();
      });
      genreChips.appendChild(chip);
    });
    function syncGenreChips() {
      genreChips.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', state.genre === c.dataset.genre ? 'true' : 'false');
      });
    }

    // Build tag filter tokens (arcade prize tokens, counts included)
    if (tagWrap) {
      knownTags.forEach(function (t) {
        var chip = BM.el('button', 'tag-token', t + ' ');
        chip.type = 'button';
        chip.dataset.tag = t;
        chip.setAttribute('aria-pressed', state.tags.indexOf(t) !== -1 ? 'true' : 'false');
        chip.title = tagCounts[t] + ' game' + (tagCounts[t] === 1 ? '' : 's') + ' tagged ' + t;
        var n = BM.el('span', 'tok-n', String(tagCounts[t]));
        chip.appendChild(n);
        chip.addEventListener('click', function () {
          var i = state.tags.indexOf(t);
          if (i === -1) state.tags.push(t); else state.tags.splice(i, 1);
          syncTagChips();
          render();
        });
        tagWrap.appendChild(chip);
      });
    }
    function syncTagChips() {
      if (!tagWrap) return;
      tagWrap.querySelectorAll('.tag-token').forEach(function (c) {
        c.setAttribute('aria-pressed', state.tags.indexOf(c.dataset.tag) !== -1 ? 'true' : 'false');
      });
    }

    function filtered() {
      var q = state.q.trim().toLowerCase();
      return games.filter(function (g) {
        if (state.favsOnly && !BM.isFav(g.id)) return false;
        if (state.genre !== 'all' && g.genre !== state.genre) return false;
        if (state.tags.length &&
            !state.tags.every(function (t) { return (g.tags || []).indexOf(t) !== -1; })) return false;
        if (q) {
          // Search-across-tags: titles, descriptions, AND tags all match.
          var hay = (g.title + ' ' + g.description + ' ' + (g.tags || []).join(' ')).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    // Matched-tag strip: when the query hits tag names, show them as
    // toggle chips so the match is visible and one click filters by it.
    function renderTagHits() {
      if (!hitsWrap) return;
      var q = state.q.trim().toLowerCase();
      hitsWrap.innerHTML = '';
      if (!q) { hitsWrap.hidden = true; return; }
      var matched = knownTags.filter(function (t) { return t.toLowerCase().indexOf(q) !== -1; });
      if (!matched.length) { hitsWrap.hidden = true; return; }
      hitsWrap.hidden = false;
      hitsWrap.appendChild(BM.el('span', 'tag-hits-label', '\u00BB tag match:'));
      matched.forEach(function (t) {
        var b = BM.el('button', 'tag-token tag-hit', t + ' ');
        b.type = 'button';
        b.dataset.tag = t;
        b.setAttribute('aria-pressed', state.tags.indexOf(t) !== -1 ? 'true' : 'false');
        b.title = 'Toggle the ' + t + ' tag filter (' + tagCounts[t] + ' games)';
        var n = BM.el('span', 'tok-n', String(tagCounts[t]));
        b.appendChild(n);
        b.addEventListener('click', function () {
          var i = state.tags.indexOf(t);
          if (i === -1) state.tags.push(t); else state.tags.splice(i, 1);
          syncTagChips();
          render();
        });
        hitsWrap.appendChild(b);
      });
    }

    function emptyCabinet() {
      return '<div class="empty-state empty-cabinet">' +
        '<p class="empty-title">\u00BB NO GAMES ON THIS CHANNEL</p>' +
        '<p class="empty-sub">The cabinet is empty \u2014 loosen a filter or two.</p>' +
        '<button class="chip" id="clear-filters" type="button">\u00BB Clear all filters</button></div>';
    }

    var firstRender = true;
    function render() {
      var list = filtered();
      renderTagHits();
      writeURLState();
      // Same-document view transition for filter/search changes (web-craft finding:
      // Baseline since Oct 2025; gated on no-preference so reduced-motion users get
      // the instant path). Content is never hidden waiting on the transition.
      // The first render skips the transition and plays the entrance
      // choreography instead (staggered cabinet power-on, CSS .enter).
      var apply = function () {
        grid.innerHTML = '';
        if (!list.length) {
          grid.innerHTML = emptyCabinet();
        } else {
          list.forEach(function (g, i) {
            var card = BM.gameCard(g);
            if (firstRender) card.style.setProperty('--i', Math.min(i, 14));
            grid.appendChild(card);
          });
          if (firstRender) {
            grid.classList.add('enter');
            setTimeout(function () { grid.classList.remove('enter'); }, 1400);
          }
        }
        firstRender = false;
        countEl.textContent = list.length + ' of ' + games.length + ' games';
      };
      var noPref = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
      if (!firstRender && document.startViewTransition && noPref) {
        // Swallow skip-rejections: rapid successive filters abort the in-flight
        // transition, which rejects its promises — that is normal, not an error.
        var vt = document.startViewTransition(apply);
        if (vt) {
          ["finished", "ready", "updateCallbackDone"].forEach(function (k) {
            if (vt[k] && vt[k].catch) vt[k].catch(function () {});
          });
        }
      } else {
        apply();
      }
    }

    // Restore URL state into the controls before first paint
    if (searchInput) {
      searchInput.value = state.q;
      searchInput.addEventListener('input', function () { state.q = searchInput.value; render(); });
    }
    if (favOnlyBtn) {
      favOnlyBtn.setAttribute('aria-pressed', state.favsOnly ? 'true' : 'false');
      favOnlyBtn.addEventListener('click', function () {
        state.favsOnly = !state.favsOnly;
        favOnlyBtn.setAttribute('aria-pressed', state.favsOnly ? 'true' : 'false');
        render();
      });
    }
    if (copyViewBtn) {
      copyViewBtn.addEventListener('click', function () {
        var orig = copyViewBtn.textContent;
        var done = function (ok) {
          copyViewBtn.textContent = ok ? '\u00BB Copied!' : '\u00BB Copy failed';
          setTimeout(function () { copyViewBtn.textContent = orig; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); });
        } else { done(false); }
      });
    }
    grid.addEventListener('click', function (ev) {
      if (ev.target && ev.target.id === 'clear-filters') {
        state = { q: '', genre: 'all', tags: [], favsOnly: false };
        if (searchInput) searchInput.value = '';
        syncGenreChips();
        syncTagChips();
        if (favOnlyBtn) favOnlyBtn.setAttribute('aria-pressed', 'false');
        render();
      }
    });
    if (randomBtn) {
      randomBtn.addEventListener('click', function () {
        var g = BM.randomGame(filtered().length ? filtered() : games);
        if (g) window.open(g.url, '_blank', 'noopener,noreferrer');
      });
    }
    document.addEventListener('bm:favs-changed', function () {
      if (state.favsOnly) render();
    });

    // Kid-safe badges (arcade.js): wait for the id set so first paint is complete.
    try { if (BM.kidSafeReady) await BM.kidSafeReady; } catch (e) {}

    render();
  }

  /* Home page: game of the day + a genre sampler */
  async function initHome() {
    var gotdBox = document.getElementById('gotd');
    if (!gotdBox) return;
    var games;
    try { games = await BM.loadGames(); } catch (e) { return; }
    var pick = BM.gameOfDay(games);
    if (!pick) return;
    // Live catalog counts (data-driven; static HTML carries the last verified number as fallback)
    var heroCount = document.getElementById('hero-game-count');
    if (heroCount) heroCount.textContent = games.length + ' free games.';
    var browseBtn = document.getElementById('browse-games-btn');
    if (browseBtn) browseBtn.textContent = 'Browse ' + games.length + ' games';
    var allLink = document.getElementById('all-games-link');
    if (allLink) allLink.textContent = 'All ' + games.length + ' games \u203a';
    gotdBox.innerHTML = '';
    gotdBox.appendChild(BM.el('span', 'gotd-label', 'Game of the day'));
    var h = BM.el('h3');
    var a = BM.el('a', null, pick.title);
    a.href = pick.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    h.appendChild(a);
    gotdBox.appendChild(h);
    gotdBox.appendChild(BM.el('p', null, pick.description));
    var row = BM.el('div', 'hero-actions');
    var play = BM.el('a', 'btn btn-primary btn-sm', '» Play now');
    play.href = pick.url; play.target = '_blank'; play.rel = 'noopener noreferrer';
    var browse = BM.el('a', 'btn btn-ghost btn-sm', 'Browse all games');
    browse.href = 'games.html';
    row.appendChild(play); row.appendChild(browse);
    gotdBox.appendChild(row);

    var sampler = document.getElementById('genre-sampler');
    if (sampler) {
      var picks = {};
      games.forEach(function (g) { if (!picks[g.genre]) picks[g.genre] = g; });
      Object.keys(picks).slice(0, 4).forEach(function (k) {
        sampler.appendChild(BM.gameCard(picks[k]));
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDirectory();
    initHome();
  });
})();
