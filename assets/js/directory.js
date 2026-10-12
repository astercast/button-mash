/* Button Mash — games directory: search, genre filters, favorites, random, game-of-the-day. */
(function () {
  'use strict';

  function genreLabel(g) {
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  async function initDirectory() {
    var grid = document.getElementById('games-grid');
    if (!grid) return;
    var games;
    try { games = await BM.loadGames(); }
    catch (e) {
      grid.innerHTML = '<div class="empty-state"><p>Could not load the game list. Check your connection and try again.</p></div>';
      return;
    }

    var searchInput = document.getElementById('game-search');
    var genreChips = document.getElementById('genre-chips');
    var favOnlyBtn = document.getElementById('fav-only');
    var randomBtn = document.getElementById('random-game');
    var countEl = document.getElementById('results-count');

    var state = { q: '', genre: 'all', favsOnly: false };

    // Build genre chips
    var genres = ['all'].concat(Array.from(new Set(games.map(function (g) { return g.genre; })))).sort();
    genres.forEach(function (g) {
      var chip = BM.el('button', 'chip', g === 'all' ? 'All' : genreLabel(g));
      chip.type = 'button';
      chip.setAttribute('aria-pressed', g === 'all' ? 'true' : 'false');
      chip.dataset.genre = g;
      chip.addEventListener('click', function () {
        state.genre = g;
        genreChips.querySelectorAll('.chip').forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        render();
      });
      genreChips.appendChild(chip);
    });

    function filtered() {
      var q = state.q.trim().toLowerCase();
      return games.filter(function (g) {
        if (state.favsOnly && !BM.isFav(g.id)) return false;
        if (state.genre !== 'all' && g.genre !== state.genre) return false;
        if (q && (g.title + ' ' + g.description).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
    }

    function render() {
      var list = filtered();
      // Same-document view transition for filter/search changes (web-craft finding:
      // Baseline since Oct 2025; gated on no-preference so reduced-motion users get
      // the instant path). Content is never hidden waiting on the transition.
      var apply = function () {
        grid.innerHTML = '';
        if (!list.length) {
          grid.innerHTML = '<div class="empty-state"><p>No games match. Try a different search or genre.</p></div>';
        } else {
          list.forEach(function (g) { grid.appendChild(BM.gameCard(g)); });
        }
        countEl.textContent = list.length + ' of ' + games.length + ' games';
      };
      if (document.startViewTransition &&
          window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
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

    if (searchInput) {
      searchInput.addEventListener('input', function () { state.q = searchInput.value; render(); });
    }
    if (favOnlyBtn) {
      favOnlyBtn.addEventListener('click', function () {
        state.favsOnly = !state.favsOnly;
        favOnlyBtn.setAttribute('aria-pressed', state.favsOnly ? 'true' : 'false');
        render();
      });
    }
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
