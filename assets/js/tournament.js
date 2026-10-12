/* Button Mash Tournament brackets — bracket builder UI.
   Pure bracket math lives in bracket.js (window.Bracket).
   Party/multiplayer game options come from api/v1/games.json (party-tagged).
   State persists in localStorage under bm_tournament_v1. */
(function () {
  'use strict';

  var STORE_KEY = 'bm_tournament_v1';
  var B = window.Bracket;
  if (!B) { return; }

  var catalog = [];        // party-tagged games from the catalog
  var catalogById = {};
  var pendingGameIds = []; // from the party-planner handoff (?games=a,b)

  function $(id) { return document.getElementById(id); }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) { return null; }
      var s = JSON.parse(raw);
      if (!s || s.version !== 1 || !Array.isArray(s.players)) { return null; }
      return s;
    } catch (e) { return null; }
  }
  function saveState(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function dropState() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  }

  function announce(msg) {
    var live = $('t-live');
    if (live) { live.textContent = ''; window.setTimeout(function () { live.textContent = msg; }, 30); }
  }

  function gameLabel(id) {
    var g = catalogById[id];
    return g ? g.title : id;
  }

  /* ---------- setup ---------- */

  function readNames() {
    var raw = $('t-players').value.split('\n');
    return B.normalizeNames(raw);
  }

  function updateCount() {
    var n = readNames().length;
    $('t-count').textContent = n + (n === 1 ? ' player' : ' players') +
      (n < B.MIN_PLAYERS ? ' — need at least ' + B.MIN_PLAYERS :
       n > B.MAX_PLAYERS ? ' — max ' + B.MAX_PLAYERS : '');
  }

  function applyPendingGames(state) {
    if (!pendingGameIds.length || !catalog.length) { return; }
    var valid = pendingGameIds.filter(function (id) { return !!catalogById[id]; });
    if (!valid.length) { return; }
    for (var r = 0; r < state.totalRounds; r++) {
      state.games[r] = valid[r % valid.length];
    }
    pendingGameIds = [];
    saveState(state);
  }

  function generate() {
    var names = readNames();
    var t = B.createTournament(names);
    if (t.error) {
      announce(t.error);
      $('t-setup-error').textContent = t.error;
      return;
    }
    $('t-setup-error').textContent = '';
    applyPendingGamesSoon(t);
    saveState(t);
    renderAll(t);
    announce('Bracket generated for ' + t.players.length + ' players. ' +
      (B.describeByes(t) ? B.describeByes(t).join(', ') + ' get first-round byes.' : 'No byes.'));
    var head = $('t-bracket-heading');
    if (head) { head.focus({ preventScroll: false }); }
  }

  /* pendingGameIds may arrive before the catalog loads; apply when possible */
  function applyPendingGamesSoon(state) {
    if (catalog.length) { applyPendingGames(state); }
  }

  /* ---------- bracket rendering ---------- */

  function roundHeader(state, round) {
    var wrap = BM.el('div', 't-round-head', '');
    var h = BM.el('h3', '', round.name);
    wrap.appendChild(h);

    var boLabel = BM.el('label', 't-setting', 'Best of ');
    var bo = document.createElement('select');
    bo.setAttribute('aria-label', round.name + ' format');
    B.BEST_OF_OPTIONS.forEach(function (n) {
      var o = document.createElement('option');
      o.value = n; o.textContent = 'Best of ' + n;
      if (round.bestOf === n) { o.selected = true; }
      bo.appendChild(o);
    });
    bo.addEventListener('change', function () {
      state.bestOf[round.index] = parseInt(bo.value, 10);
      saveState(state);
      renderAll(state);
      announce(round.name + ' is now best of ' + bo.value + '.');
    });
    boLabel.appendChild(bo);
    wrap.appendChild(boLabel);

    var gLabel = BM.el('label', 't-setting', 'Game ');
    var gs = document.createElement('select');
    gs.setAttribute('aria-label', round.name + ' game');
    var none = document.createElement('option');
    none.value = ''; none.textContent = 'Pick a party game…';
    gs.appendChild(none);
    catalog.forEach(function (g) {
      var o = document.createElement('option');
      o.value = g.id; o.textContent = g.title;
      if (round.game === g.id) { o.selected = true; }
      gs.appendChild(o);
    });
    if (!catalog.length) {
      gs.disabled = true;
      none.textContent = 'Game catalog unavailable';
    }
    gs.addEventListener('change', function () {
      state.games[round.index] = gs.value;
      saveState(state);
      announce(round.name + ' game: ' + (gs.value ? gameLabel(gs.value) : 'none') + '.');
    });
    gLabel.appendChild(gs);
    wrap.appendChild(gLabel);

    if (round.game && catalogById[round.game]) {
      var link = document.createElement('a');
      link.className = 't-game-link';
      link.href = catalogById[round.game].url;
      link.target = '_blank'; link.rel = 'noopener';
      link.textContent = 'Open ' + gameLabel(round.game) + ' ↗';
      wrap.appendChild(link);
    }
    /* Screen hides this (settings are interactive selects); print shows it. */
    var printOnly = BM.el('p', 't-print-only',
      'Best of ' + round.bestOf + (round.game ? ' · ' + gameLabel(round.game) : ' · no game picked'));
    wrap.appendChild(printOnly);
    return wrap;
  }

  function playerRow(state, round, mt, side) {
    /* side: 'a' | 'b' */
    var slot = side === 'a' ? mt.a : mt.b;
    var li = BM.el('li', 't-player', '');
    if (!slot) {
      li.appendChild(BM.el('span', 't-tbd', 'Winner of earlier match'));
      return li;
    }
    if (slot.bye) {
      li.appendChild(BM.el('span', 't-bye', 'BYE — ' +
        (side === 'a' ? mt.b.name : mt.a.name) + ' advances automatically'));
      li.classList.add('is-bye');
      return li;
    }
    var wins = side === 'a' ? mt.aWins : mt.bWins;
    var name = BM.el('span', 't-name', slot.name + ' (seed ' + slot.seed + ')');
    li.appendChild(name);
    if (mt.decided) {
      var won = mt.winner && mt.winner.seed === slot.seed;
      li.classList.add(won ? 'is-winner' : 'is-loser');
      var badge = BM.el('span', 't-badge', won ? '✓ advances' : 'out');
      badge.setAttribute('aria-hidden', 'true');
      li.appendChild(badge);
    } else if (round.bestOf === 1) {
      var adv = BM.el('button', 'btn btn-small', 'Advance ' + slot.name);
      adv.type = 'button';
      adv.setAttribute('aria-label', 'Advance ' + slot.name + ' to the next round');
      adv.addEventListener('click', function () {
        var res = B.recordWin(state, round.index, mt.index, side);
        if (!res.ok) { announce(res.error); return; }
        saveState(state);
        renderAll(state);
        afterAdvance(state, round, slot);
      });
      li.appendChild(adv);
    } else {
      var score = BM.el('span', 't-score', '');
      var sw = BM.el('span', 't-score-num', String(wins));
      sw.id = 'score-r' + round.index + 'm' + mt.index + side;
      score.appendChild(sw);
      var plus = BM.el('button', 'btn btn-small', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Add a game win for ' + slot.name);
      plus.addEventListener('click', function () {
        var res = B.recordWin(state, round.index, mt.index, side);
        if (!res.ok) { announce(res.error); return; }
        saveState(state);
        renderAll(state);
        afterAdvance(state, round, res.winner || slot);
      });
      var minus = BM.el('button', 'btn btn-small btn-ghost', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Remove a game win for ' + slot.name);
      minus.addEventListener('click', function () {
        var res = B.removeWin(state, round.index, mt.index, side);
        if (!res.ok) { announce(res.error); return; }
        saveState(state);
        renderAll(state);
      });
      li.appendChild(score);
      li.appendChild(plus);
      li.appendChild(minus);
    }
    return li;
  }

  function afterAdvance(state, round, slot) {
    var champ = B.champion(state);
    if (champ) {
      announce('🏆 ' + champ.name + ' wins the tournament!');
    } else {
      var nextName = round.index + 1 < state.totalRounds
        ? B.roundName(round.index + 1, state.totalRounds) : 'done';
      announce(slot.name + ' advances to the ' + nextName + '.');
    }
  }

  function matchCard(state, round, mt) {
    var li = BM.el('li', 't-match', '');
    if (mt.decided) { li.classList.add('is-decided'); }
    var head = BM.el('p', 't-match-head',
      round.name + ' · Match ' + (mt.index + 1) +
      (round.bestOf > 1 && !mt.byeAdvance ? ' · first to ' + B.neededWins(round.bestOf) : ''));
    li.appendChild(head);
    var ul = BM.el('ul', 't-players', '');
    ul.appendChild(playerRow(state, round, mt, 'a'));
    ul.appendChild(playerRow(state, round, mt, 'b'));
    li.appendChild(ul);
    if (mt.decided && !mt.byeAdvance) {
      var clear = BM.el('button', 'btn btn-small btn-ghost t-clear', '↺ Clear winner');
      clear.type = 'button';
      clear.setAttribute('aria-label', 'Clear the winner of ' + round.name + ' match ' + (mt.index + 1));
      clear.addEventListener('click', function () {
        var res = B.clearMatch(state, round.index, mt.index);
        if (!res.ok) { announce(res.error); return; }
        saveState(state);
        renderAll(state);
        announce('Winner cleared for ' + round.name + ' match ' + (mt.index + 1) + '.');
      });
      li.appendChild(clear);
    }
    return li;
  }

  function renderBracket(state) {
    var out = $('t-bracket');
    out.innerHTML = '';
    var rounds = B.rounds(state);
    var cols = BM.el('div', 't-cols', '');
    rounds.forEach(function (round) {
      var col = BM.el('section', 't-round', '');
      col.setAttribute('aria-label', round.name);
      col.appendChild(roundHeader(state, round));
      var ol = BM.el('ol', 't-matches', '');
      round.matches.forEach(function (mt) { ol.appendChild(matchCard(state, round, mt)); });
      col.appendChild(ol);
      cols.appendChild(col);
    });
    out.appendChild(cols);

    var prog = B.matchComplete(state);
    $('t-progress').textContent = prog.decided + ' of ' + prog.total + ' matches decided.';

    var champ = B.champion(state);
    var cz = $('t-champion');
    if (champ) {
      cz.hidden = false;
      cz.innerHTML = '';
      var trophy = BM.el('p', 't-trophy', '🏆');
      trophy.setAttribute('aria-hidden', 'true');
      var h = BM.el('h2', '', 'Champion: ' + champ.name);
      var sub = BM.el('p', 't-champion-sub',
        state.players.length + '-player tournament · ' + rounds.map(function (r) { return r.name; }).join(' → '));
      cz.appendChild(trophy); cz.appendChild(h); cz.appendChild(sub);
    } else {
      cz.hidden = true;
      cz.innerHTML = '';
    }

    var hasByes = B.describeByes(state);
    $('t-bye-note').textContent = hasByes
      ? 'Byes (top seeds skip round one): ' + hasByes.join(', ') + '.'
      : '';
  }

  function renderAll(state) {
    if (!state) {
      $('t-bracket-wrap').hidden = true;
      $('t-actions').hidden = true;
      $('t-progress').textContent = '';
      return;
    }
    applyPendingGamesSoon(state);
    $('t-bracket-wrap').hidden = false;
    $('t-actions').hidden = false;
    renderBracket(state);
  }

  /* ---------- share / print ---------- */

  function bracketText(state) {
    var rounds = B.rounds(state);
    var lines = [];
    lines.push('🏆 Button Mash tournament — ' + state.players.length + ' players');
    var champ = B.champion(state);
    lines.push('Champion: ' + (champ ? champ.name : '(undecided)') + '');
    lines.push('');
    var byes = B.describeByes(state);
    if (byes) { lines.push('Byes: ' + byes.join(', ') + ''); lines.push(''); }
    rounds.forEach(function (round) {
      var head = round.name + ' — best of ' + round.bestOf;
      head += round.game ? ' — ' + gameLabel(round.game) : ' — (no game picked)';
      lines.push(head);
      round.matches.forEach(function (mt, i) {
        var label = '  M' + (i + 1) + ': ';
        if (!mt.a || !mt.b) {
          label += '(waiting on earlier results)';
        } else if (mt.byeAdvance) {
          var adv = mt.winner;
          label += adv.name + ' — bye (advances automatically)';
        } else if (mt.winner) {
          var loser = mt.winner.seed === mt.a.seed ? mt.b : mt.a;
          var score = round.bestOf > 1
            ? ' (' + mt.aWins + '–' + mt.bWins + ')' : '';
          label += mt.winner.name + ' def. ' + loser.name + score;
        } else {
          var s = round.bestOf > 1 ? ' (' + mt.aWins + '–' + mt.bWins + ')' : '';
          label += mt.a.name + ' vs ' + mt.b.name + ' — not played' + s;
        }
        lines.push(label);
      });
      lines.push('');
    });
    lines.push('Made with Button Mash — your browser is the console.');
    return lines.join('\n');
  }

  function copyBracket(state) {
    var text = bracketText(state);
    function done(ok) {
      announce(ok ? 'Bracket copied — paste it anywhere.' : 'Copy failed — your browser blocked it.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done(ok);
    }
  }

  /* ---------- init ---------- */

  function initFromURL() {
    var q;
    try { q = new URLSearchParams(window.location.search); }
    catch (e) { return; }
    var n = parseInt(q.get('players'), 10);
    if (n >= B.MIN_PLAYERS && n <= B.MAX_PLAYERS) {
      var lines = [];
      for (var i = 1; i <= n; i++) { lines.push('Player ' + i); }
      $('t-players').value = lines.join('\n');
    }
    var games = (q.get('games') || '').split(',').map(function (s) { return s.trim(); })
      .filter(function (s) { return /^[a-z0-9-]+$/.test(s); });
    if (games.length) { pendingGameIds = games.slice(0, 8); }
  }

  function loadCatalog() {
    return BM.loadGames().then(function (games) {
      catalog = games
        .filter(function (g) { return (g.tags || []).indexOf('party') !== -1; })
        .sort(function (a, b) { return a.title.localeCompare(b.title); });
      catalogById = {};
      catalog.forEach(function (g) { catalogById[g.id] = g; });
    }).catch(function () {
      catalog = [];
      catalogById = {};
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('t-players')) { return; }
    initFromURL();
    updateCount();
    $('t-players').addEventListener('input', updateCount);
    $('t-generate').addEventListener('click', generate);
    $('t-shuffle').addEventListener('click', function () {
      var ta = $('t-players');
      var arr = ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      ta.value = arr.join('\n');
      updateCount();
      announce('Entry order shuffled — that shuffles the seeds too.');
    });
    $('t-startover').addEventListener('click', function () {
      dropState();
      renderAll(null);
      announce('Tournament cleared. Enter players to start a new one.');
      $('t-players').focus();
    });
    $('t-print').addEventListener('click', function () { window.print(); });
    $('t-copy').addEventListener('click', function () {
      var s = loadState();
      if (s) { copyBracket(s); }
    });

    loadCatalog().then(function () {
      var saved = loadState();
      if (saved) {
        /* re-validate saved players against the logic (data shape drift) */
        var err = B.validatePlayers(saved.players);
        if (err) { dropState(); renderAll(null); return; }
        if ($('t-players').value.trim() === '') {
          $('t-players').value = saved.players.join('\n');
        }
        applyPendingGamesSoon(saved);
        saveState(saved);
        renderAll(saved);
      } else {
        renderAll(null);
      }
      updateCount();
    });
  });
})();
