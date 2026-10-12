/* collections.js — curated shelves, wired to the Curator (wave 19).
   Static-first: renders all 22 shelves from data/v1/collections.json
   immediately, then probes GET /api/collections through
   ApiClient.fetchWithFallback. Live → the Curator's resolved titles/URLs are
   overlaid onto the shelf rows and the badge reads "live". Miss/timeout →
   the static shelves stay and the badge reads "cached · updated HH:MM".
   Trophy-room shelf-progress strips ride the shared BM.Trophy store and are
   repainted on every bm:trophy-changed. */
(function () {
  'use strict';

  function copyText(text, btn, idleLabel) {
    var done = function (ok) {
      btn.textContent = ok ? '\u00BB Copied!' : '\u00BB Copy failed';
      setTimeout(function () { btn.textContent = idleLabel; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else { done(false); }
  }

  function renderShelves(grid, jump, cols, byId) {
    grid.innerHTML = '';
    // Shelf jump-links: anchor nav across the long shelf list.
    if (jump && !jump.hasAttribute('data-built')) {
      jump.setAttribute('data-built', '1');
      jump.appendChild(BM.el('span', 'jump-label', '\u00BB Jump to a shelf:'));
      cols.forEach(function (c) {
        var a = BM.el('a', null, c.title);
        a.href = '#shelf-' + c.id;
        jump.appendChild(a);
      });
    }
    cols.forEach(function (c) {
      var card = BM.el('article', 'collection-card');
      card.id = 'shelf-' + c.id;
      var top = BM.el('div', 'card-top');
      top.appendChild(BM.el('span', 'badge', c.tagline));
      var link = BM.el('button', 'chip shelf-link', '\u00BB Copy shelf link');
      link.type = 'button';
      link.setAttribute('aria-label', 'Copy link to the ' + c.title + ' shelf');
      link.addEventListener('click', function () {
        copyText(location.origin + location.pathname + '#shelf-' + c.id, link, '\u00BB Copy shelf link');
      });
      top.appendChild(link);
      card.appendChild(top);
      card.appendChild(BM.el('h3', null, c.title));
      card.appendChild(BM.el('p', null, c.description));
      // Trophy Room: per-shelf completion strip (played/beaten progress).
      var prog = BM.el('div', 'shelf-progress');
      prog.setAttribute('data-collection', c.id);
      var bar = BM.el('div', 'stacked-bar');
      bar.setAttribute('role', 'img');
      var bp = BM.el('span', 'bar-played');
      var bb = BM.el('span', 'bar-beaten');
      bar.appendChild(bp); bar.appendChild(bb);
      prog.appendChild(bar);
      var plabel = BM.el('p', 'shelf-progress-label', '\u00BB shelf progress loading\u2026');
      prog.appendChild(plabel);
      card.appendChild(prog);
      var ol = BM.el('ol');
      (c.game_ids || []).forEach(function (gid) {
        var g = byId[gid];
        if (!g) return;
        var li = BM.el('li');
        var row = BM.el('span', 'shelf-row');
        var a = BM.el('a', null, g.title);
        a.href = g.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        row.appendChild(a);
        // Wave 19: every shelf row links to the game's full metadata file.
        var det = BM.el('a', 'shelf-detail-link', '\u00BB file');
        det.href = 'game.html?id=' + encodeURIComponent(gid);
        det.setAttribute('aria-label', 'Full game file for ' + g.title);
        row.appendChild(det);
        li.appendChild(row);
        li.appendChild(document.createTextNode(' \u2014 ' + (g.description || '')));
        ol.appendChild(li);
      });
      card.appendChild(ol);
      grid.appendChild(card);
    });
    paintShelfProgress(grid, cols);
  }

  function paintShelfProgress(grid, cols) {
    if (!window.BM || !BM.Trophy || !BM.trophyReady) return;
    BM.trophyReady.then(function (store) {
      if (!store) return;
      var strips = grid.querySelectorAll('.shelf-progress');
      for (var i = 0; i < strips.length; i++) {
        (function (el) {
          var cid = el.getAttribute('data-collection');
          var col = null;
          for (var j = 0; j < cols.length; j++) {
            if (cols[j].id === cid) { col = cols[j]; break; }
          }
          if (!col) return;
          var p = store.collectionProgress(col);
          el.querySelector('.bar-played').style.width = p.playedPct + '%';
          el.querySelector('.bar-beaten').style.width = p.beatenPct + '%';
          el.querySelector('.stacked-bar').setAttribute('aria-label',
            col.title + ': ' + p.played + ' of ' + p.total + ' played, ' + p.beaten + ' beaten');
          var label = el.querySelector('.shelf-progress-label');
          label.innerHTML = '';
          label.appendChild(BM.el('span', 'c-played', p.played + '/' + p.total + ' played'));
          label.appendChild(document.createTextNode(' \u00B7 '));
          label.appendChild(BM.el('span', 'c-beaten', p.beaten + ' beaten'));
        })(strips[i]);
      }
    });
  }

  function scrollToShelf() {
    var h = location.hash;
    if (h.indexOf('#shelf-') !== 0) return;
    var target = document.getElementById(h.slice(1));
    if (!target) return;
    // Instant (not smooth): this fires during page load, where Chrome
    // defers smooth scrollIntoView by up to ~2s.
    try { target.scrollIntoView({ behavior: 'auto', block: 'start' }); }
    catch (e) { if (target.scrollIntoView) target.scrollIntoView(); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('collections-grid');
    var jump = document.getElementById('shelf-jump');
    if (!grid || !window.BM) return;

    function fail() {
      grid.innerHTML = '<div class="empty-state empty-cabinet"><p class="empty-title">\u00BB SHELVES OFFLINE</p>' +
        '<p class="empty-sub">Could not load collections. Check your connection and try again.</p>' +
        '<button class="chip" type="button" onclick="location.reload()">\u00BB Retry</button></div>';
    }

    Promise.all([
      BM.loadGames(),
      fetch('data/v1/collections.json', { cache: 'force-cache' }).then(function (r) {
        if (!r.ok) throw new Error('collections ' + r.status);
        return r.json();
      }).then(function (j) { return j.collections || []; })
    ]).then(function (parts) {
      var games = parts[0] || [];
      var cols = parts[1] || [];
      var byId = {};
      games.forEach(function (g) { byId[g.id] = g; });

      // Static shelves first: the page is complete even if the functions
      // are cold, down, or unreachable.
      renderShelves(grid, jump, cols, byId);
      scrollToShelf();
      document.addEventListener('bm:trophy-changed', function () { paintShelfProgress(grid, cols); });

      // Live probe: overlay the Curator's resolved titles/URLs by id and let
      // the badge tell the truth about freshness.
      var badge = document.getElementById('collections-badge');
      if (window.ApiClient && badge) {
        window.ApiClient.fetchWithFallback('/api/collections', 'data/v1/collections.json', { badgeEl: badge })
          .then(function (res) {
            if (res.source !== 'live' || !res.data || !Array.isArray(res.data.collections)) return;
            res.data.collections.forEach(function (c) {
              (c.games || []).forEach(function (rg) {
                var g = byId[rg.id];
                if (g && rg.title) { g.title = rg.title; g.url = rg.url || g.url; }
              });
            });
            renderShelves(grid, jump, cols, byId);
          });
      }
    }).catch(fail);
  });
})();
