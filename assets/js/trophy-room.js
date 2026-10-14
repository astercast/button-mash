/* Button Mash: Trophy Room page: stats band, genre shelves with CRT
   completion dials, the 16-prize achievement case, collection progress,
   and JSON export/import/reset. All numbers come from the real catalog
   via BM.Trophy; nothing here is a placeholder. */
(function () {
  'use strict';

  function genreLabel(g) {
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  function dialSVG(stat) {
    var C = 2 * Math.PI * 44;
    var frac = stat.total ? stat.played / stat.total : 0;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'dial');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', genreLabel(stat.genre) + ': ' + stat.played + ' of ' +
      stat.total + ' played (' + stat.playedPct + ' percent), ' + stat.beaten + ' beaten');
    function circle(cls, r, dash) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('cx', '60'); c.setAttribute('cy', '60'); c.setAttribute('r', String(r));
      if (dash != null) {
        c.setAttribute('stroke-dasharray', (frac * C).toFixed(1) + ' ' + C.toFixed(1));
        c.setAttribute('transform', 'rotate(-90 60 60)');
      }
      return c;
    }
    svg.appendChild(circle('dial-tube', 54));
    svg.appendChild(circle('dial-track', 44));
    svg.appendChild(circle('dial-arc', 44, true));
    function text(cls, x, y, s) {
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('class', cls);
      t.setAttribute('x', String(x)); t.setAttribute('y', String(y));
      t.textContent = s;
      return t;
    }
    svg.appendChild(text('dial-num', 60, 60, stat.playedPct + '%'));
    svg.appendChild(text('dial-sub', 60, 82, stat.played + '/' + stat.total));
    return svg;
  }

  function stackedBar(playedPct, beatenPct) {
    var bar = BM.el('div', 'stacked-bar');
    bar.setAttribute('role', 'img');
    var p = BM.el('span', 'bar-played');
    p.style.width = playedPct + '%';
    var b = BM.el('span', 'bar-beaten');
    b.style.width = beatenPct + '%';
    bar.appendChild(p); bar.appendChild(b);
    return bar;
  }

  function renderStats(store, box) {
    var c = store.counts();
    var st = store.streak();
    var ach = store.achievements();
    var earned = ach.filter(function (a) { return a.earned; }).length;
    var rows = [
      [String(c.played), 'Games played'],
      [String(c.beaten), 'Games beaten'],
      [String(c.favorites), 'Favorites'],
      [String(st.current), st.current === 1 ? 'Day streak' : 'Day streak'],
      [earned + '/' + ach.length, 'Prizes earned']
    ];
    box.innerHTML = '';
    rows.forEach(function (r) {
      var d = BM.el('div', 'stat-readout');
      d.appendChild(BM.el('div', 'stat-num', r[0]));
      d.appendChild(BM.el('div', 'stat-label', r[1]));
      box.appendChild(d);
    });
    return c;
  }

  function renderShelves(store, games, grid, emptyBox, counts) {
    var stats = store.genreStats(games);
    grid.innerHTML = '';
    var anyActivity = counts.played + counts.beaten + counts.favorites > 0;
    emptyBox.hidden = anyActivity;
    stats.forEach(function (s) {
      var card = BM.el('article', 'genre-shelf');
      card.appendChild(BM.el('h3', null, genreLabel(s.genre)));
      card.appendChild(dialSVG(s));
      var meta = BM.el('div', 'shelf-meta');
      var countsP = BM.el('p', 'shelf-counts');
      countsP.innerHTML = '';
      var ps = BM.el('span', 'c-played', s.played + ' played');
      var mid = document.createTextNode(' · ');
      var bs = BM.el('span', 'c-beaten', s.beaten + ' beaten');
      var tail = document.createTextNode(' of ' + s.total);
      countsP.appendChild(ps); countsP.appendChild(mid); countsP.appendChild(bs); countsP.appendChild(tail);
      meta.appendChild(countsP);
      var bar = stackedBar(s.playedPct, s.beatenPct);
      bar.setAttribute('aria-label', genreLabel(s.genre) + ': ' + s.playedPct + '% played, ' + s.beatenPct + '% beaten');
      meta.appendChild(bar);
      card.appendChild(meta);
      grid.appendChild(card);
    });
  }

  function renderPrizes(store, box) {
    var ach = store.achievements();
    box.innerHTML = '';
    ach.forEach(function (a) {
      var card = BM.el('article', 'prize-token-card' + (a.earned ? ' earned' : ''));
      var disc = BM.el('div', 'prize-disc', a.earned ? '\u25C9' : '\u25CB');
      disc.setAttribute('aria-hidden', 'true');
      card.appendChild(disc);
      card.appendChild(BM.el('h3', null, a.name));
      card.appendChild(BM.el('p', null, a.desc));
      var st = BM.el('p', 'prize-when', a.earned
        ? '\u00BB Won ' + new Date(a.earnedAt).toLocaleDateString()
        : '\u00BB Not yet won');
      card.appendChild(st);
      box.appendChild(card);
    });
  }

  function renderCollections(store, cols, box) {
    box.innerHTML = '';
    cols.forEach(function (c) {
      var p = store.collectionProgress(c);
      var row = BM.el('article', 'collection-row');
      var h = BM.el('h3');
      var a = BM.el('a', null, c.title);
      a.href = 'collections.html#shelf-' + c.id;
      h.appendChild(a);
      row.appendChild(h);
      var wrap = BM.el('div');
      var bar = stackedBar(p.playedPct, p.beatenPct);
      bar.setAttribute('aria-label', c.title + ': ' + p.playedPct + '% played, ' + p.beatenPct + '% beaten');
      wrap.appendChild(bar);
      row.appendChild(wrap);
      var counts = BM.el('p', 'col-counts');
      var ps = BM.el('span', 'c-played', p.played + '/' + p.total + ' played');
      counts.appendChild(ps);
      counts.appendChild(document.createTextNode(' · '));
      counts.appendChild(BM.el('span', 'c-beaten', p.beaten + ' beaten'));
      row.appendChild(counts);
      box.appendChild(row);
    });
  }

  function wireBackup(store) {
    var exportBtn = document.getElementById('export-btn');
    var importBtn = document.getElementById('import-btn');
    var importFile = document.getElementById('import-file');
    var importText = document.getElementById('import-text');
    var result = document.getElementById('import-result');
    var resetBtn = document.getElementById('reset-btn');
    var schemaEl = document.getElementById('schema-version');
    if (schemaEl && window.BM && BM.Trophy) schemaEl.textContent = 'v' + BM.Trophy.SCHEMA_VERSION;

    function say(ok, msg) {
      result.textContent = msg;
      result.className = ok ? 'ok' : 'err';
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var json = store.exportJSON();
        var blob = new Blob([json], { type: 'application/json' });
        var a = document.createElement('a');
        var d = new Date().toISOString().slice(0, 10);
        a.href = URL.createObjectURL(blob);
        a.download = 'button-mash-trophies-' + d + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          URL.revokeObjectURL(a.href);
          a.remove();
        }, 4000);
      });
    }
    if (importFile && importText) {
      importFile.addEventListener('change', function () {
        var f = importFile.files && importFile.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () { importText.value = String(rd.result || ''); };
        rd.readAsText(f);
      });
    }
    if (importBtn) {
      importBtn.addEventListener('click', function () {
        var text = importText.value.trim();
        if (!text) { say(false, '\u00BB Nothing to import, paste an export or choose a file first.'); return; }
        var res = store.importJSON(text);
        if (res.ok) {
          var d = res.dropped;
          var droppedN = d.played + d.beaten + d.favorites + d.days + d.achievements;
          var note = droppedN ? ' (' + droppedN + ' stale entr' + (droppedN === 1 ? 'y' : 'ies') + ' skipped)' : '';
          say(true, '\u00BB Imported: ' + res.imported.played + ' played · ' +
            res.imported.beaten + ' beaten · ' + res.imported.favorites +
            ' favorites · ' + res.imported.achievements + ' prizes' + note + '.');
          importText.value = '';
        } else {
          say(false, '\u00BB Import failed: ' + res.message);
        }
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var c = store.counts();
        if (!window.confirm('Reset the whole trophy room? ' + c.played +
          ' played, ' + c.beaten + ' beaten and every prize will be wiped. This cannot be undone.')) return;
        store.reset();
        say(true, '\u00BB Trophy room reset. Fresh wall, fresh start.');
      });
    }
  }

  function showNotice(kind) {
    var box = document.getElementById('storage-notice');
    if (!box) return;
    if (kind === 'memory') {
      box.textContent = '\u00BB MEMORY-ONLY MODE: this browser is blocking local storage (private mode or disabled), ' +
        'so trophies live in memory and vanish when the tab closes. Export your wall if you want to keep it.';
      box.hidden = false;
    } else if (kind === 'corrupt') {
      box.textContent = '\u00BB The saved trophy data was unreadable, so the wall started fresh. ' +
        'If you have an export file, import it below to restore.';
      box.hidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var statBox = document.getElementById('stat-band');
    var shelfGrid = document.getElementById('shelf-grid');
    var emptyBox = document.getElementById('wall-empty');
    var prizeBox = document.getElementById('prize-case');
    var colBox = document.getElementById('collection-progress');
    if (!statBox || !window.BM || !BM.Trophy) return;

    function fail(msg) {
      statBox.innerHTML = '<div class="wall-empty"><p>' + msg + '</p></div>';
    }

    Promise.all([
      fetch('data/games.json', { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('games ' + r.status);
        return r.json();
      }),
      fetch('data/collections.json', { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('collections ' + r.status);
        return r.json();
      }).catch(function () { return { collections: [] }; })
    ]).then(function (parts) {
      var games = (parts[0] && parts[0].games) || [];
      var cols = (parts[1] && parts[1].collections) || [];
      if (!games.length) { fail('\u00BB Could not load the game catalog. Check your connection and reload.'); return; }
      var store = BM.Trophy.initDefault(games, cols, {
        getFavs: function () { return BM.getFavs(); },
        setFavs: function (ids) { return BM.setFavs(ids); }
      });
      if (BM.Trophy.storageMode() === 'memory') showNotice('memory');
      else if (store.loadInfo().corrupt) showNotice('corrupt');

      function renderAll() {
        var counts = renderStats(store, statBox);
        renderShelves(store, games, shelfGrid, emptyBox, counts);
        renderPrizes(store, prizeBox);
        renderCollections(store, cols, colBox);
      }
      renderAll();
      store.onChange(renderAll);
      document.addEventListener('bm:favs-changed', renderAll);
      wireBackup(store);
    }).catch(function () {
      fail('\u00BB Could not load the game catalog. Check your connection and reload.');
    });
  });
})();
