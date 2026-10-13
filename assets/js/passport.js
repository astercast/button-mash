/* Arcade Passport — the booklet page (passport.html).
 *
 * Renders the stamp booklet from BM.Passport state plus the live
 * catalog: stamps come from bm.passport.v1 (earned on the
 * Collections page, where shelves are actually seen), guide marks
 * are derived on the spot from the checklist store via BM.getChecks
 * — nothing on this page is estimated, cached from a server, or
 * counted twice. Everything lives in this browser. */
(function () {
  'use strict';

  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function render(collections) {
    var P = window.BM.Passport;
    var state = P.loadState();
    var marks = P.guideMarks(window.BM.getChecks);
    var prog = P.progress(state, collections, marks);

    var band = document.getElementById('stat-band');
    if (band) {
      band.innerHTML = '';
      [
        [prog.stamps + ' / ' + prog.stampsTotal, 'shelves stamped'],
        [prog.marks + ' / ' + prog.marksTotal, 'guide marks'],
        [prog.startedAt ? fmtDate(prog.startedAt) : '—', 'first stamp'],
      ].forEach(function (pair) {
        var cell = BM.el('div', 'stat-readout');
        cell.appendChild(BM.el('div', 'stat-num', pair[0]));
        cell.appendChild(BM.el('div', 'stat-label', pair[1]));
        band.appendChild(cell);
      });
    }

    var line = document.getElementById('pp-progress-line');
    if (line) {
      line.innerHTML = '';
      line.appendChild(document.createTextNode('Holder progress: '));
      var strong = BM.el('strong', null, prog.stamps + ' of ' + prog.stampsTotal + ' shelves stamped');
      line.appendChild(strong);
      line.appendChild(document.createTextNode(
        prog.stamps === 0 ? ' — no stamps yet. The booklet is blank, the cabinet is patient.'
        : prog.stamps === prog.stampsTotal ? ' — every shelf in the cabinet, seen. Full booklet.'
        : ' — ' + (prog.stampsTotal - prog.stamps) + ' to go.'));
    }

    var grid = document.getElementById('stamp-grid');
    if (grid) {
      grid.innerHTML = '';
      collections.forEach(function (c) {
        var h = hashStr(c.id);
        var li = BM.el('li', 'stamp-cell s-ink-' + (h % 4));
        var stamped = P.hasStamp(state, c.id);
        if (stamped) li.classList.add('is-stamped');
        li.appendChild(BM.el('h3', null, c.title));
        li.appendChild(BM.el('p', 'pp-tag', c.tagline));
        if (stamped) {
          li.appendChild(BM.el('span', 'pp-games', (c.game_ids || []).length + ' games on this shelf'));
          var ink = BM.el('span', 'ink-stamp', 'Stamped');
          ink.style.transform = 'rotate(' + ((h % 13) - 6) + 'deg)';
          ink.appendChild(BM.el('span', 'pp-date', fmtDate(state.stamps[c.id])));
          li.appendChild(ink);
        } else {
          var a = BM.el('a', 'pp-visit', '» Visit this shelf');
          a.href = 'collections.html#shelf-' + c.id;
          li.appendChild(a);
          li.appendChild(BM.el('span', 'pp-unvisited', 'Not yet visited'));
        }
        grid.appendChild(li);
      });
    }

    var visa = document.getElementById('visa-list');
    if (visa) {
      visa.innerHTML = '';
      marks.forEach(function (m) {
        var li = BM.el('li', 'visa-row');
        var h3 = BM.el('h3', null, m.title);
        li.appendChild(h3);
        li.appendChild(BM.el('span', 'pp-steps',
          m.ticked + ' / ' + m.steps + ' checklist steps ticked'));
        var a = BM.el('a', 'pp-visit', m.complete ? '» Revisit the guide' : '» Open the guide');
        a.href = m.url;
        li.appendChild(a);
        var mark = BM.el('span', 'pp-mark' + (m.complete ? '' : ' is-pending'),
          m.complete ? 'Guide mark earned' : 'Mark not yet earned');
        li.appendChild(mark);
        visa.appendChild(li);
      });
    }

    var empty = document.getElementById('pp-empty');
    if (empty) empty.hidden = prog.stamps > 0 || prog.marks > 0;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.BM || !window.BM.Passport) return;
    var notice = document.getElementById('storage-notice');
    if (notice && window.BM.Passport.usingFallback()) {
      notice.hidden = false;
      notice.textContent = 'Browser storage is blocked, so this passport lives in memory only and resets when the tab closes.';
    }
    var collections = [];
    function paint() { render(collections); }
    fetch('data/v1/collections.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return fetch('data/collections.json').then(function (r) { return r.json(); }); })
      .then(function (doc) { collections = doc.collections || []; paint(); })
      .catch(function () { paint(); });

    document.addEventListener('bm:passport-changed', paint);
    window.addEventListener('storage', function (e) {
      if (e.key === window.BM.Passport.STORE_KEY || e.key === 'bm_checks_v1') paint();
    });

    var reset = document.getElementById('pp-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        if (!window.confirm('Surrender this passport? Every stamp is cleared. Guide checklists are not touched.')) return;
        var P = window.BM.Passport;
        var state = P.loadState();
        P.clearStamps(state);
        P.saveState(state);
        document.dispatchEvent(new CustomEvent('bm:passport-changed'));
        paint();
      });
    }
  });
})();
