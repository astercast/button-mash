/* Tournament Night, the page (tournament-night.html).
 *
 * One night, one bracket, games as entrants. The page owns only
 * rendering and clicks: sources come from the live catalog
 * (data/v1) and the saved-lineup shelf (bm.lineups.v1, read through
 * BMCuratorLineups' own store), the bracket math is bracket.js, and
 * the night's state is tournament-night-core.js over
 * bm.tournament-night.v1. A pick is a click on a game; the pick is
 * saved the moment it lands, so the night survives a reload exactly
 * where the room left it. Nothing is sent anywhere. */
(function () {
  'use strict';

  var TN = null, gamesById = {}, collections = [], lineupStore = null;
  var night = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { return window.BM.el(tag, cls, text); }

  function lineupRecords() {
    try { return lineupStore ? lineupStore.list() : []; } catch (e) { return []; }
  }

  /* ---------------- setup rendering ---------------- */

  function renderSources() {
    var colSel = $('tn-collection');
    colSel.innerHTML = '';
    collections.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.title + ', ' + c.game_ids.length + ' games';
      colSel.appendChild(o);
    });
    var linSel = $('tn-lineup');
    linSel.innerHTML = '';
    var recs = lineupRecords();
    recs.forEach(function (r) {
      var o = document.createElement('option');
      o.value = r.id;
      o.textContent = r.name + ', ' + r.slots.length + ' games';
      linSel.appendChild(o);
    });
    var none = $('tn-lineup-none');
    if (none) none.hidden = recs.length > 0;
    linSel.disabled = recs.length === 0;
    var linRadio = document.querySelector('input[name="tn-source"][value="lineup"]');
    if (linRadio) linRadio.disabled = recs.length === 0;
    syncSourcePanels();
  }

  function sourceType() {
    var r = document.querySelector('input[name="tn-source"]:checked');
    return r ? r.value : 'collection';
  }
  function syncSourcePanels() {
    var t = sourceType();
    $('tn-collection-panel').hidden = t !== 'collection';
    $('tn-lineup-panel').hidden = t !== 'lineup';
  }

  /* ---------------- bracket rendering ---------------- */

  function entrantButton(n, match, slot, side) {
    var btn = el('button', 'tn-entrant');
    btn.type = 'button';
    if (!slot) {
      btn.disabled = true;
      btn.appendChild(el('span', 'tn-entrant-title tn-tbd', 'To be decided'));
      btn.appendChild(el('span', 'tn-entrant-meta', 'winner of an earlier match'));
      return btn;
    }
    if (slot.bye) {
      btn.disabled = true;
      btn.classList.add('is-bye');
      btn.appendChild(el('span', 'tn-entrant-title', 'BYE'));
      btn.appendChild(el('span', 'tn-entrant-meta', 'no game drew this slot'));
      return btn;
    }
    var game = TN.entrantBySeed(n, slot.seed);
    var decided = match.decided;
    if (decided && match.winner && match.winner.seed === slot.seed) btn.classList.add('is-winner');
    if (decided && !(match.winner && match.winner.seed === slot.seed)) btn.classList.add('is-loser');
    btn.appendChild(el('span', 'tn-seed', 'Seed ' + slot.seed));
    btn.appendChild(el('span', 'tn-entrant-title', slot.name));
    btn.appendChild(el('span', 'tn-entrant-meta', game ? game.genre : ''));
    if (decided) {
      btn.disabled = true;
      if (match.winner && match.winner.seed === slot.seed) {
        btn.appendChild(el('span', 'tn-badge', '✓ advances'));
      }
    } else {
      btn.setAttribute('aria-label', 'Pick ' + slot.name + ' to win this match');
      btn.addEventListener('click', function () {
        var res = TN.pick(night, match.round, match.index, side);
        var live = $('tn-live');
        if (!res.ok) { if (live) live.textContent = res.error; return; }
        TN.saveNight(night);
        if (live) live.textContent = slot.name + ' advances.';
        renderNight();
      });
    }
    return btn;
  }

  function renderNight() {
    var wrap = $('tn-night');
    var empty = $('tn-empty');
    if (!night) {
      wrap.hidden = true;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    wrap.hidden = false;

    $('tn-night-name').textContent = night.name;
    var src = $('tn-night-source');
    src.textContent = (night.source.type === 'lineup' ? 'Saved lineup · ' : 'Collection · ') +
      night.source.name + ' · ' + night.entrants.length + ' games · single elimination';

    var prog = TN.progress(night);
    $('tn-progress').textContent = prog.complete
      ? 'The night is decided, all ' + prog.total + ' matches in.'
      : prog.decided + ' of ' + prog.total + ' matches decided. Click a game to pick its match.';

    var bracketEl = $('tn-bracket');
    bracketEl.innerHTML = '';
    TN.rounds(night).forEach(function (round) {
      var col = el('section', 'tn-round');
      col.setAttribute('aria-label', round.name);
      col.appendChild(el('h3', 'tn-round-name', round.name));
      var list = el('div', 'tn-matches');
      round.matches.forEach(function (m) {
        var card = el('article', 'tn-match' + (m.decided ? ' is-decided' : ''));
        card.appendChild(el('p', 'tn-match-head', 'Match ' + (m.index + 1)));
        if (m.byeAdvance) {
          card.appendChild(entrantButton(night, m, m.winner, 'a'));
          card.appendChild(el('p', 'tn-bye-note', m.winner.name + ' takes the top-seed bye.'));
        } else {
          card.appendChild(entrantButton(night, m, m.a, 'a'));
          card.appendChild(el('p', 'tn-vs', 'vs'));
          card.appendChild(entrantButton(night, m, m.b, 'b'));
          if (m.decided) {
            var clear = el('button', 'btn btn-small btn-ghost tn-clear', 'Clear pick');
            clear.type = 'button';
            clear.addEventListener('click', function () {
              var res = TN.unpick(night, m.round, m.index);
              if (!res.ok) { var live = $('tn-live'); if (live) live.textContent = res.error; return; }
              TN.saveNight(night);
              renderNight();
            });
            card.appendChild(clear);
          }
        }
        list.appendChild(card);
      });
      col.appendChild(list);
      bracketEl.appendChild(col);
    });

    var champ = TN.champion(night);
    var champEl = $('tn-champion');
    champEl.innerHTML = '';
    if (champ) {
      champEl.hidden = false;
      champEl.appendChild(el('p', 'tn-trophy', '🏆'));
      champEl.appendChild(el('p', 'tn-champion-kicker', 'Tournament Night champion'));
      champEl.appendChild(el('h2', 'tn-champion-title', champ.title));
      champEl.appendChild(el('p', 'tn-champion-desc', champ.description));
      var ru = TN.runnerUp(night);
      if (ru) champEl.appendChild(el('p', 'tn-champion-sub', 'Beat ' + ru.title + ' in the final.'));
      var play = el('a', 'btn btn-primary', '▶ Play ' + champ.title);
      play.href = champ.url;
      play.target = '_blank';
      play.rel = 'noopener noreferrer';
      champEl.appendChild(play);
    } else {
      champEl.hidden = true;
    }
    $('tn-card').hidden = false;
    var pre = $('tn-card-text');
    if (pre) pre.textContent = TN.resultsCard(night);
  }

  /* ---------------- wiring ---------------- */

  function startNight() {
    var err = $('tn-setup-error');
    err.textContent = '';
    var type = sourceType();
    var built, source;
    if (type === 'lineup') {
      var rec = lineupRecords().filter(function (r) { return r.id === $('tn-lineup').value; })[0];
      if (!rec) { err.textContent = 'Pick a saved lineup first, or deal one on the Game Night page.'; return; }
      built = TN.entrantsFromLineup(rec, gamesById);
      source = { type: 'lineup', id: rec.id, name: rec.name };
    } else {
      var col = collections.filter(function (c) { return c.id === $('tn-collection').value; })[0];
      if (!col) { err.textContent = 'Pick a collection first.'; return; }
      built = TN.entrantsFromCollection(col, gamesById);
      source = { type: 'collection', id: col.id, name: col.title };
    }
    var res = TN.createNight({ source: source, entrants: built.entrants, name: $('tn-name').value });
    if (!res.ok) { err.textContent = res.error; return; }
    night = res.night;
    TN.saveNight(night);
    renderNight();
    var live = $('tn-live');
    if (live) live.textContent = 'Tournament night started: ' + night.name + ', ' + night.entrants.length + ' games seeded.';
    $('tn-night-heading').focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.BM || !window.BM.TournamentNight || !window.Bracket) return;
    TN = window.BM.TournamentNight;
    if (window.BMCuratorLineups) lineupStore = window.BMCuratorLineups.createStore();

    var notice = $('tn-storage-notice');
    if (notice && TN.usingFallback()) {
      notice.hidden = false;
      notice.textContent = 'Browser storage is blocked, so this tournament night lives in memory only and resets when the tab closes.';
    }

    document.querySelectorAll('input[name="tn-source"]').forEach(function (r) {
      r.addEventListener('change', syncSourcePanels);
    });
    $('tn-start').addEventListener('click', startNight);
    $('tn-clear').addEventListener('click', function () {
      if (!window.confirm('Clear this tournament night? Every pick is wiped.')) return;
      TN.clearNight();
      night = null;
      renderNight();
    });
    $('tn-copy').addEventListener('click', function () {
      if (!night) return;
      var text = TN.resultsCard(night);
      var done = function () { $('tn-copy').textContent = '✓ Copied'; setTimeout(function () { $('tn-copy').textContent = '📋 Copy results card'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    });

    night = TN.loadNight();

    Promise.all([
      fetch('data/v1/games.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
      fetch('data/v1/collections.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
    ]).then(function (docs) {
      (docs[0].games || []).forEach(function (g) { gamesById[g.id] = g; });
      collections = docs[1].collections || [];
      renderSources();
      renderNight();
    }).catch(function () {
      renderSources();
      renderNight();
      var err = $('tn-setup-error');
      if (err) err.textContent = 'The catalog could not be loaded, so no new night can be seeded. A saved night still renders above.';
    });
  });
})();
