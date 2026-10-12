/* Button Mash Tournament 2.0 — bracket builder UI.
   Pure bracket math lives in bracket.js (single elim, window.Bracket) and
   bracket-double.js (double elim, window.BracketDouble).
   Game options come from the full catalog (data/v1/games.json data, loaded
   here via BM.loadGames which reads data/games.json) — party-tagged games
   first, then everything else.
   State persists in localStorage: bm_tournament_v1 (single) and
   bm_tournament_v2 (double); bm_tournament_active remembers the format.
   Share links: #b=<base64url> validated by BracketDouble.decodeShare.
   Undo: in-memory snapshot stack (this browser session only).
   Null-guard discipline (w3.1): every DOM lookup below is guarded before use. */
(function () {
  'use strict';

  var STORE_KEYS = { single: 'bm_tournament_v1', double: 'bm_tournament_v2' };
  var ACTIVE_KEY = 'bm_tournament_active';
  var B = window.Bracket;
  var B2 = window.BracketDouble;
  if (!B || !B2) { return; }

  var catalog = [];        // full game catalog, party-tagged first
  var catalogById = {};
  var partyIds = {};
  var pendingGameIds = []; // from the party-planner handoff (?games=a,b)
  var handoffParams = false; // ?players=/&games=/&format= present: user is starting fresh
  var pickByName = {};     // seeding-list game picks, keyed by player name
  var undoStack = [];
  var activeFormat = 'single';

  function $(id) { return document.getElementById(id); }

  function storeKey() { return STORE_KEYS[activeFormat] || STORE_KEYS.single; }

  /* v1 states saved by earlier waves keyed games by round number ("0");
     2.0 uses "r0" everywhere (winners), "L0" (losers), "GF" (grand final). */
  function migrateV1(state) {
    if (state && state.version === 1 && state.games && typeof state.games === 'object') {
      var g2 = {};
      Object.keys(state.games).forEach(function (k) {
        g2[/^r/i.test(k) ? k : 'r' + k] = state.games[k];
      });
      state.games = g2;
    }
    return state;
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(storeKey());
      if (!raw) { return null; }
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.players)) { return null; }
      if (activeFormat === 'double' && s.version !== 2) { return null; }
      if (activeFormat === 'single' && s.version !== 1) { return null; }
      return migrateV1(s);
    } catch (e) { return null; }
  }
  function saveState(state) {
    try {
      localStorage.setItem(storeKey(), JSON.stringify(state));
      localStorage.setItem(ACTIVE_KEY, activeFormat);
    } catch (e) {}
  }
  function dropState() {
    try { localStorage.removeItem(storeKey()); } catch (e) {}
  }

  function pushUndo(state) {
    if (!state) { return; }
    try {
      undoStack.push(JSON.stringify(state));
      while (undoStack.length > 50) { undoStack.shift(); }
    } catch (e) {}
  }
  function popUndo() {
    if (!undoStack.length) { return null; }
    try { return JSON.parse(undoStack.pop()); }
    catch (e) { return null; }
  }

  function announce(msg) {
    var live = $('t-live');
    if (live) { live.textContent = ''; window.setTimeout(function () { live.textContent = msg; }, 30); }
  }

  function gameLabel(id) {
    var g = catalogById[id];
    return g ? g.title : id;
  }

  function hist(state, text) { B2.logHistory(state, text); }

  /* ---------- setup: names, format, seeding ---------- */

  function readNames() {
    var ta = $('t-players');
    if (!ta) { return []; }
    return B.normalizeNames(ta.value.split('\n'));
  }

  function updateCount() {
    var el = $('t-count');
    if (!el) { return; }
    var n = readNames().length;
    el.textContent = n + (n === 1 ? ' player' : ' players') +
      (n < B.MIN_PLAYERS ? ' — need at least ' + B.MIN_PLAYERS :
       n > B.MAX_PLAYERS ? ' — max ' + B.MAX_PLAYERS : '');
  }

  function currentFormatChoice() {
    var checked = document.querySelector('input[name="t-format"]:checked');
    return checked ? checked.value : 'single';
  }

  function syncFormatRadio() {
    var radio = document.querySelector('input[name="t-format"][value="' + activeFormat + '"]');
    if (radio) { radio.checked = true; }
  }

  /* Seed list: entry order = seed order. Up/down buttons move the matching
     textarea line (single source of truth stays the textarea). Each row also
     takes an optional game pick from the full catalog for game voting. */
  function renderSeedList() {
    var list = $('t-seed-list');
    if (!list) { return; }
    list.innerHTML = '';
    var names = readNames();
    names.forEach(function (name, i) {
      var li = BM.el('li', 't-seed-row', '');
      li.appendChild(BM.el('span', 't-seed-num', 'Seed ' + (i + 1)));
      li.appendChild(BM.el('span', 't-name', name));
      var up = BM.el('button', 'btn btn-small btn-ghost', '↑');
      up.type = 'button';
      up.setAttribute('aria-label', 'Move ' + name + ' up one seed');
      up.disabled = i === 0;
      up.addEventListener('click', function () { moveSeed(i, -1); });
      var down = BM.el('button', 'btn btn-small btn-ghost', '↓');
      down.type = 'button';
      down.setAttribute('aria-label', 'Move ' + name + ' down one seed');
      down.disabled = i === names.length - 1;
      down.addEventListener('click', function () { moveSeed(i, 1); });
      li.appendChild(up);
      li.appendChild(down);
      var plabel = BM.el('label', 't-pick-label', 'Game pick ');
      var psel = document.createElement('select');
      psel.setAttribute('aria-label', 'Game pick for ' + name);
      buildGameOptions(psel, pickByName[name] || '', true, 'No pick');
      psel.addEventListener('change', function () {
        if (psel.value) {
          pickByName[name] = psel.value;
          announce(name + ' picks ' + gameLabel(psel.value) + '.');
        } else {
          delete pickByName[name];
          announce(name + "'s game pick cleared.");
        }
      });
      plabel.appendChild(psel);
      li.appendChild(plabel);
      list.appendChild(li);
    });
  }

  function moveSeed(i, dir) {
    var ta = $('t-players');
    if (!ta) { return; }
    var lines = ta.value.split('\n');
    var idx = [];
    lines.forEach(function (ln, li) { if (ln.trim()) { idx.push(li); } });
    var a = idx[i], b = idx[i + dir];
    if (a == null || b == null) { return; }
    var t = lines[a]; lines[a] = lines[b]; lines[b] = t;
    ta.value = lines.join('\n');
    updateCount();
    renderSeedList();
    announce('Seed order updated.');
  }

  function applyPendingGames(state) {
    if (!pendingGameIds.length || !catalog.length) { return; }
    var valid = pendingGameIds.filter(function (id) { return !!catalogById[id]; });
    if (!valid.length) { return; }
    var rounds = state.version === 2 ? state.totalWinnersRounds : state.totalRounds;
    for (var r = 0; r < rounds; r++) {
      state.games['r' + r] = valid[r % valid.length];
    }
    pendingGameIds = [];
    saveState(state);
  }

  function generate() {
    var names = readNames();
    var format = currentFormatChoice();
    var t = format === 'double' ? B2.createTournamentDouble(names) : B.createTournament(names);
    var errEl = $('t-setup-error');
    if (t.error) {
      announce(t.error);
      if (errEl) { errEl.textContent = t.error; }
      return;
    }
    if (errEl) { errEl.textContent = ''; }
    t = migrateV1(t);
    t.gamePicks = {};
    t.gameVotes = {};
    t.history = [];
    names.forEach(function (n) {
      if (pickByName[n] && catalogById[pickByName[n]]) { t.gamePicks[n] = pickByName[n]; }
    });
    var old = loadStateFor(format);
    if (old) { pushUndo(old); }
    activeFormat = format;
    applyPendingGamesSoon(t);
    saveState(t);
    renderAll(t);
    var fmtName = format === 'double' ? 'double-elimination' : 'single-elimination';
    announce('Bracket generated: ' + fmtName + ', ' + t.players.length + ' players. ' +
      (B.describeByes(t) ? B.describeByes(t).join(', ') + ' get first-round byes.' : 'No byes.'));
    var head = $('t-bracket-heading');
    if (head) { head.focus({ preventScroll: false }); }
  }

  function loadStateFor(format) {
    var prev = activeFormat;
    activeFormat = format;
    var s = loadState();
    activeFormat = prev;
    return s;
  }

  /* pendingGameIds may arrive before the catalog loads; apply when possible */
  function applyPendingGamesSoon(state) {
    if (catalog.length) { applyPendingGames(state); }
  }

  /* ---------- game catalog ---------- */

  function buildGameOptions(select, selectedId, includeEmpty, emptyLabel) {
    select.innerHTML = '';
    if (includeEmpty) {
      var none = document.createElement('option');
      none.value = ''; none.textContent = emptyLabel || 'Pick a game…';
      select.appendChild(none);
    }
    if (!catalog.length) {
      var na = document.createElement('option');
      na.value = ''; na.textContent = 'Game catalog unavailable';
      select.appendChild(na);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    var pg = document.createElement('optgroup'); pg.label = 'Party games';
    var ag = document.createElement('optgroup'); ag.label = 'All games';
    catalog.forEach(function (g) {
      var o = document.createElement('option');
      o.value = g.id; o.textContent = g.title;
      if (g.id === selectedId) { o.selected = true; }
      (partyIds[g.id] ? pg : ag).appendChild(o);
    });
    if (pg.children.length) { select.appendChild(pg); }
    select.appendChild(ag);
  }

  /* ---------- ops: bracket-variant adapters for the shared renderers ---------- */

  function singleOps(state) {
    return {
      bestOf: function (round) { return state.bestOf[round.index] || 1; },
      record: function (r, m, side) {
        var res = B.recordWin(state, r, m, side);
        if (res.ok) {
          var mt = B.rounds(state)[r].matches[m];
          hist(state, B.roundName(r, state.totalRounds) + ' M' + (m + 1) + ': ' +
            mt.a.name + ' ' + mt.aWins + '–' + mt.bWins + ' ' + mt.b.name +
            (res.winner ? ' — ' + res.winner.name + ' advances' : ''));
        }
        return res;
      },
      remove: function (r, m, side) { return B.removeWin(state, r, m, side); },
      clear: function (r, m) {
        var mt0 = B.rounds(state)[r].matches[m];
        var was = mt0 && mt0.winner ? mt0.winner.name : null;
        var res = B.clearMatch(state, r, m);
        if (res.ok) {
          hist(state, B.roundName(r, state.totalRounds) + ' M' + (m + 1) + ' cleared' +
            (was ? ' (was: ' + was + ' advancing)' : '') + '.');
        }
        return res;
      },
      after: function (round, slot) {
        var champ = B.champion(state);
        if (champ) { announce('🏆 ' + champ.name + ' wins the tournament!'); }
        else {
          var nextName = round.index + 1 < state.totalRounds
            ? B.roundName(round.index + 1, state.totalRounds) : 'done';
          announce(slot.name + ' advances to the ' + nextName + '.');
        }
      }
    };
  }

  function winnersOps(state) {
    return {
      bestOf: function (round) { return state.bestOf[round.index] || 1; },
      record: function (r, m, side) { return B2.recordWinnersWin(state, r, m, side); },
      remove: function (r, m, side) { return B2.removeWinnersWin(state, r, m, side); },
      clear: function (r, m) { return B2.clearWinnersMatch(state, r, m); },
      after: function (round, slot) {
        var champ = B2.champion(state);
        if (champ) { announce('🏆 ' + champ.name + ' wins the tournament!'); }
        else { announce(slot.name + ' advances in the winners bracket.'); }
      }
    };
  }

  function losersOps(state) {
    return {
      bestOf: function (round) { return state.losersBestOf[round.index] || 1; },
      record: function (r, m, side) { return B2.recordLosersWin(state, r, m, side); },
      remove: function (r, m, side) { return B2.removeLosersWin(state, r, m, side); },
      clear: function (r, m) { return B2.clearLosersMatch(state, r, m); },
      after: function (round, slot) {
        var champ = B2.champion(state);
        if (champ) { announce('🏆 ' + champ.name + ' wins the tournament!'); }
        else { announce(slot.name + ' advances in the losers bracket.'); }
      }
    };
  }

  function grandFinalOps(state, which) {
    var label = which === 1 ? 'bracket reset' : 'grand final';
    return {
      bestOf: function () { return state.grandFinalBestOf || 1; },
      record: function (r, m, side) { return B2.recordGrandWin(state, which, side); },
      remove: function () { return { ok: false, error: 'Use "clear winner" to change a final.' }; },
      clear: function () { return B2.clearGrandFinal(state, which); },
      after: function (round, slot, res) {
        var champ = B2.champion(state);
        if (champ) { announce('🏆 ' + champ.name + ' wins the tournament!'); }
        else if (res && res.winner) { announce(res.winner.name + ' wins the ' + label + '.'); }
        else { announce(slot.name + ' takes a game in the ' + label + '.'); }
      }
    };
  }

  /* ---------- bracket rendering (shared) ---------- */

  /* cfg: { getBestOf(round)->n, setBestOf(round,n),
            gameKey(round)->string, voteKey(round)->string } */
  function winnersCfg(state) {
    return {
      getBestOf: function (round) { return state.bestOf[round.index] || 1; },
      setBestOf: function (round, n) { state.bestOf[round.index] = n; },
      gameKey: function (round) { return 'r' + round.index; },
      voteKey: function (round) { return 'r' + round.index; }
    };
  }
  function losersCfg(state) {
    return {
      getBestOf: function (round) { return state.losersBestOf[round.index] || 1; },
      setBestOf: function (round, n) { state.losersBestOf[round.index] = n; },
      gameKey: function (round) { return 'L' + round.index; },
      voteKey: function (round) { return 'L' + round.index; }
    };
  }
  function grandFinalCfg(state) {
    return {
      getBestOf: function () { return state.grandFinalBestOf || 1; },
      setBestOf: function (round, n) { state.grandFinalBestOf = n; },
      gameKey: function () { return 'GF'; },
      voteKey: function () { return 'GF'; }
    };
  }

  function roundHeader(state, round, cfg) {
    var wrap = BM.el('div', 't-round-head', '');
    var h = BM.el('h3', '', round.name);
    wrap.appendChild(h);

    var bestOf = cfg.getBestOf(round);
    var boLabel = BM.el('label', 't-setting', 'Best of ');
    var bo = document.createElement('select');
    bo.setAttribute('aria-label', round.name + ' format');
    B.BEST_OF_OPTIONS.forEach(function (n) {
      var o = document.createElement('option');
      o.value = n; o.textContent = 'Best of ' + n;
      if (bestOf === n) { o.selected = true; }
      bo.appendChild(o);
    });
    bo.addEventListener('change', function () {
      cfg.setBestOf(round, parseInt(bo.value, 10));
      saveState(state);
      renderAll(state);
      announce(round.name + ' is now best of ' + bo.value + '.');
    });
    boLabel.appendChild(bo);
    wrap.appendChild(boLabel);

    var gameKey = cfg.gameKey(round);
    var gLabel = BM.el('label', 't-setting', 'Game ');
    var gs = document.createElement('select');
    gs.setAttribute('aria-label', round.name + ' game');
    buildGameOptions(gs, state.games[gameKey] || '', true);
    gs.addEventListener('change', function () {
      state.games[gameKey] = gs.value;
      saveState(state);
      renderAll(state);
      announce(round.name + ' game: ' + (gs.value ? gameLabel(gs.value) : 'none') + '.');
    });
    gLabel.appendChild(gs);
    wrap.appendChild(gLabel);

    var gid = state.games[gameKey];
    if (gid && catalogById[gid]) {
      var link = document.createElement('a');
      link.className = 't-game-link';
      link.href = catalogById[gid].url;
      link.target = '_blank'; link.rel = 'noopener';
      link.textContent = 'Open ' + gameLabel(gid) + ' ↗';
      wrap.appendChild(link);
    }
    wrap.appendChild(buildVotePanel(state, cfg, round));
    /* Screen hides this (settings are interactive selects); print shows it. */
    var printOnly = BM.el('p', 't-print-only',
      'Best of ' + bestOf + (gid ? ' · ' + gameLabel(gid) : ' · no game picked'));
    wrap.appendChild(printOnly);
    return wrap;
  }

  function buildVotePanel(state, cfg, round) {
    var voteKey = cfg.voteKey(round);
    var gameKey = cfg.gameKey(round);
    var wrap = BM.el('div', 't-vote', '');
    var toggle = BM.el('button', 'btn btn-small btn-ghost', '🗳 Vote on the game');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    var panel = BM.el('div', 't-vote-panel', '');
    panel.hidden = true;
    toggle.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) { renderVotePanel(state, panel, voteKey, gameKey); }
    });
    wrap.appendChild(toggle);
    wrap.appendChild(panel);
    return wrap;
  }

  function renderVotePanel(state, panel, voteKey, gameKey) {
    panel.innerHTML = '';
    var cands = B2.voteCandidates(state, gameKey);
    if (!cands.length) {
      panel.appendChild(BM.el('p', 't-note',
        'No game picks yet — add a game pick per player in the seeding list above, or pick a game for this round and it becomes a candidate.'));
    } else {
      panel.appendChild(BM.el('p', 't-note',
        'One vote per player — voting again moves your vote. Ties go to the earliest-picked game.'));
      var asLabel = BM.el('label', 't-setting', 'Voting as ');
      var asSel = document.createElement('select');
      asSel.setAttribute('aria-label', 'Who is voting');
      state.players.forEach(function (name) {
        var o = document.createElement('option');
        o.value = name; o.textContent = name;
        asSel.appendChild(o);
      });
      asLabel.appendChild(asSel);
      panel.appendChild(asLabel);
      var result = B2.computeGameVote(state, voteKey, cands);
      var ul = BM.el('ul', 't-vote-list', '');
      cands.forEach(function (gid) {
        var li = BM.el('li', '', '');
        li.appendChild(BM.el('span', 't-name', gameLabel(gid)));
        li.appendChild(BM.el('span', 't-vote-count', String(result.tally[gid] || 0) + ' votes'));
        var vb = BM.el('button', 'btn btn-small', 'Vote');
        vb.type = 'button';
        vb.setAttribute('aria-label', 'Vote for ' + gameLabel(gid));
        vb.addEventListener('click', function () {
          var voter = asSel.value;
          pushUndo(state);
          var r = B2.setGameVote(state, voteKey, voter, gid);
          if (!r.ok) { announce(r.error); return; }
          saveState(state);
          renderAll(state);
          announce(voter + ' voted for ' + gameLabel(gid) + '.');
        });
        li.appendChild(vb);
        ul.appendChild(li);
      });
      panel.appendChild(ul);
      if (result.winner) {
        panel.appendChild(BM.el('p', 't-vote-leader',
          'Leading: ' + gameLabel(result.winner) + ' (' + result.votes + ' of ' +
          state.players.length + ' votes)'));
        var lock = BM.el('button', 'btn btn-small btn-cyan', 'Lock in ' + gameLabel(result.winner));
        lock.type = 'button';
        lock.addEventListener('click', function () {
          pushUndo(state);
          state.games[gameKey] = result.winner;
          hist(state, 'Game vote locked (' + gameKey + '): ' + gameLabel(result.winner) +
            ' — ' + result.votes + ' votes.');
          saveState(state);
          renderAll(state);
          announce('Game locked in: ' + gameLabel(result.winner) + '.');
        });
        panel.appendChild(lock);
      }
    }
  }

  function playerRow(state, round, mt, side, ops) {
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
    } else if (ops.bestOf(round) === 1) {
      var adv = BM.el('button', 'btn btn-small', 'Advance ' + slot.name);
      adv.type = 'button';
      adv.setAttribute('aria-label', 'Advance ' + slot.name + ' to the next round');
      adv.addEventListener('click', function () {
        pushUndo(state);
        var res = ops.record(round.index, mt.index, side);
        if (!res.ok) { announce(res.error); return; }
        saveState(state);
        renderAll(state);
        ops.after(round, slot, res);
      });
      li.appendChild(adv);
    } else {
      var score = BM.el('span', 't-score', '');
      var sw = BM.el('span', 't-score-num', String(wins));
      score.appendChild(sw);
      var plus = BM.el('button', 'btn btn-small', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Add a game win for ' + slot.name);
      plus.addEventListener('click', function () {
        pushUndo(state);
        var res = ops.record(round.index, mt.index, side);
        if (!res.ok) { announce(res.error); return; }
        saveState(state);
        renderAll(state);
        ops.after(round, slot, res);
      });
      var minus = BM.el('button', 'btn btn-small btn-ghost', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Remove a game win for ' + slot.name);
      minus.addEventListener('click', function () {
        pushUndo(state);
        var res = ops.remove(round.index, mt.index, side);
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

  function matchCard(state, round, mt, ops) {
    var li = BM.el('li', 't-match', '');
    if (mt.decided) { li.classList.add('is-decided'); }
    var bestOf = ops.bestOf(round);
    var head = BM.el('p', 't-match-head',
      round.name + ' · Match ' + (mt.index + 1) +
      (bestOf > 1 && !mt.byeAdvance ? ' · first to ' + B.neededWins(bestOf) : ''));
    li.appendChild(head);
    var ul = BM.el('ul', 't-players', '');
    ul.appendChild(playerRow(state, round, mt, 'a', ops));
    ul.appendChild(playerRow(state, round, mt, 'b', ops));
    li.appendChild(ul);
    if (mt.decided && !mt.byeAdvance) {
      var clear = BM.el('button', 'btn btn-small btn-ghost t-clear', '↺ Clear winner');
      clear.type = 'button';
      clear.setAttribute('aria-label', 'Clear the winner of ' + round.name + ' match ' + (mt.index + 1));
      clear.addEventListener('click', function () {
        pushUndo(state);
        var res = ops.clear(round.index, mt.index);
        if (!res.ok) { announce(res.error); return; }
        saveState(state);
        renderAll(state);
        announce('Winner cleared for ' + round.name + ' match ' + (mt.index + 1) + '.');
      });
      li.appendChild(clear);
    }
    return li;
  }

  function roundSection(state, round, cfg, ops) {
    var col = BM.el('section', 't-round', '');
    col.setAttribute('aria-label', round.name);
    col.appendChild(roundHeader(state, round, cfg));
    var ol = BM.el('ol', 't-matches', '');
    round.matches.forEach(function (mt) { ol.appendChild(matchCard(state, round, mt, ops)); });
    col.appendChild(ol);
    return col;
  }

  function renderChampion(state, champ, sub) {
    var cz = $('t-champion');
    if (!cz) { return; }
    if (champ) {
      cz.hidden = false;
      cz.innerHTML = '';
      var trophy = BM.el('p', 't-trophy', '🏆');
      trophy.setAttribute('aria-hidden', 'true');
      cz.appendChild(trophy);
      cz.appendChild(BM.el('h2', '', 'Champion: ' + champ.name));
      cz.appendChild(BM.el('p', 't-champion-sub', sub));
    } else {
      cz.hidden = true;
      cz.innerHTML = '';
    }
  }

  /* ---------- single elimination render ---------- */

  function renderSingle(state) {
    var out = $('t-bracket');
    if (!out) { return; }
    out.innerHTML = '';
    var ops = singleOps(state);
    var cfg = winnersCfg(state);
    var rounds = B.rounds(state);
    var cols = BM.el('div', 't-cols', '');
    rounds.forEach(function (round) {
      cols.appendChild(roundSection(state, round, cfg, ops));
    });
    out.appendChild(cols);

    var prog = B.matchComplete(state);
    var pe = $('t-progress');
    if (pe) { pe.textContent = prog.decided + ' of ' + prog.total + ' matches decided.'; }

    renderChampion(state, B.champion(state),
      state.players.length + '-player single-elimination tournament');

    var hasByes = B.describeByes(state);
    var bn = $('t-bye-note');
    if (bn) {
      bn.textContent = hasByes
        ? 'Byes (top seeds skip round one): ' + hasByes.join(', ') + '.'
        : '';
    }
  }

  /* ---------- double elimination render ---------- */

  function grandFinalCard(state) {
    var info = B2.grandFinalInfo(state);
    var card = BM.el('section', 't-round t-grandfinal', '');
    card.setAttribute('aria-label', 'Grand final');
    var fakeRound = { index: 'GF', name: 'Grand Final' };
    card.appendChild(roundHeader(state, fakeRound, grandFinalCfg(state)));
    if (!info.ready) {
      card.appendChild(BM.el('p', 't-note',
        'Finish the winners and losers brackets to set the grand final.'));
      return card;
    }
    function gfMatch(res, which) {
      return {
        round: 'GF', index: 0,
        a: info.a, b: info.b,
        aWins: res ? res.aWins : 0,
        bWins: res ? res.bWins : 0,
        winner: res ? res.winner : null,
        decided: !!(res && res.decided),
        byeAdvance: false
      };
    }
    var ops = grandFinalOps(state, 0);
    card.appendChild(matchCard(state,
      { index: 'GF', name: 'Grand Final' }, gfMatch(info.final, 0), ops));
    var showReset = info.needsReset ||
      (info.reset && (info.reset.decided || info.reset.aWins > 0 || info.reset.bWins > 0));
    if (showReset) {
      var rc = BM.el('div', 't-reset', '');
      var rh = BM.el('h4', '', 'Bracket reset — winner takes the tournament');
      rc.appendChild(rh);
      rc.appendChild(BM.el('p', 't-note',
        'The losers-bracket champion beat the winners-bracket champion, so the bracket resets: one more final, winner takes it all.'));
      rc.appendChild(matchCard(state,
        { index: 'GF', name: 'Bracket reset' }, gfMatch(info.reset, 1), grandFinalOps(state, 1)));
      card.appendChild(rc);
    } else if (info.final && info.final.decided) {
      card.appendChild(BM.el('p', 't-note',
        'Winners-bracket champion took the final outright — no reset needed.'));
    }
    return card;
  }

  function renderDouble(state) {
    var out = $('t-bracket');
    if (!out) { return; }
    out.innerHTML = '';

    out.appendChild(BM.el('h3', 't-bracket-sub', 'Winners bracket'));
    var wcols = BM.el('div', 't-cols', '');
    var wcfg = winnersCfg(state);
    var wops = winnersOps(state);
    B2.winnersRounds(state).forEach(function (round) {
      wcols.appendChild(roundSection(state, round, wcfg, wops));
    });
    out.appendChild(wcols);

    var lrs = B2.losersRounds(state);
    out.appendChild(BM.el('h3', 't-bracket-sub', 'Losers bracket'));
    if (lrs.length) {
      var lcols = BM.el('div', 't-cols', '');
      var lcfg = losersCfg(state);
      var lops = losersOps(state);
      lrs.forEach(function (round) {
        lcols.appendChild(roundSection(state, round, lcfg, lops));
      });
      out.appendChild(lcols);
    } else {
      out.appendChild(BM.el('p', 't-note',
        'Two players, no losers bracket — the grand final is a straight rematch.'));
    }

    out.appendChild(BM.el('h3', 't-bracket-sub', 'Grand final'));
    out.appendChild(grandFinalCard(state));

    var prog = B2.matchProgress(state);
    var pe = $('t-progress');
    if (pe) { pe.textContent = prog.decided + ' of ' + prog.total + ' matches decided.'; }

    renderChampion(state, B2.champion(state),
      state.players.length + '-player double-elimination tournament');

    var hasByes = B.describeByes(state);
    var bn = $('t-bye-note');
    if (bn) {
      bn.textContent = hasByes
        ? 'Byes (top seeds skip round one): ' + hasByes.join(', ') + '.'
        : '';
    }
  }

  function renderAll(state) {
    var wrap = $('t-bracket-wrap');
    var actions = $('t-actions');
    if (!state) {
      if (wrap) { wrap.hidden = true; }
      if (actions) { actions.hidden = true; }
      var pe = $('t-progress');
      if (pe) { pe.textContent = ''; }
      renderHistory(null);
      return;
    }
    applyPendingGamesSoon(state);
    activeFormat = state.version === 2 ? 'double' : 'single';
    syncFormatRadio();
    if (wrap) { wrap.hidden = false; }
    if (actions) { actions.hidden = false; }
    if (state.version === 2) { renderDouble(state); }
    else { renderSingle(state); }
    renderHistory(state);
  }

  /* ---------- history + undo ---------- */

  function renderHistory(state) {
    var wrap = $('t-history-wrap');
    if (!wrap) { return; }
    var histArr = (state && state.history) || [];
    if (!state || !histArr.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    var ol = $('t-history-list');
    if (!ol) { return; }
    ol.innerHTML = '';
    for (var i = histArr.length - 1; i >= 0; i--) {
      var li = document.createElement('li');
      var time = BM.el('time', '', '');
      try {
        time.textContent = new Date(histArr[i].t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) { time.textContent = ''; }
      li.appendChild(time);
      li.appendChild(document.createTextNode(' ' + histArr[i].text));
      ol.appendChild(li);
    }
    var undo = $('t-undo');
    if (undo) { undo.disabled = undoStack.length === 0; }
  }

  /* ---------- share / print ---------- */

  function bracketText(state) {
    var isDouble = state.version === 2;
    var lines = [];
    lines.push('🏆 Button Mash tournament (' + (isDouble ? 'double' : 'single') +
      ' elimination) — ' + state.players.length + ' players');
    var champ = isDouble ? B2.champion(state) : B.champion(state);
    lines.push('Champion: ' + (champ ? champ.name : '(undecided)') + '');
    lines.push('');
    var byes = B.describeByes(state);
    if (byes) { lines.push('Byes: ' + byes.join(', ') + ''); lines.push(''); }

    function roundLines(round, gameKey) {
      var gid = state.games[gameKey] || '';
      var head = round.name + ' — best of ' + (round.bestOf || 1);
      head += gid ? ' — ' + gameLabel(gid) : ' — (no game picked)';
      lines.push(head);
      round.matches.forEach(function (mt, i) {
        var label = '  M' + (i + 1) + ': ';
        if (!mt.a || !mt.b) {
          label += '(waiting on earlier results)';
        } else if (mt.byeAdvance) {
          label += mt.winner.name + ' — bye (advances automatically)';
        } else if (mt.winner) {
          var loser = mt.winner.seed === mt.a.seed ? mt.b : mt.a;
          var score = (round.bestOf || 1) > 1 ? ' (' + mt.aWins + '–' + mt.bWins + ')' : '';
          label += mt.winner.name + ' def. ' + loser.name + score;
        } else {
          var s = (round.bestOf || 1) > 1 ? ' (' + mt.aWins + '–' + mt.bWins + ')' : '';
          label += mt.a.name + ' vs ' + mt.b.name + ' — not played' + s;
        }
        lines.push(label);
      });
      lines.push('');
    }

    if (isDouble) {
      lines.push('WINNERS BRACKET');
      B2.winnersRounds(state).forEach(function (round) { roundLines(round, 'r' + round.index); });
      lines.push('LOSERS BRACKET');
      var lrs = B2.losersRounds(state);
      if (lrs.length) {
        lrs.forEach(function (round) { roundLines(round, 'L' + round.index); });
      } else {
        lines.push('(no losers bracket — 2 players)');
        lines.push('');
      }
      var info = B2.grandFinalInfo(state);
      var gid = state.games.GF || '';
      lines.push('GRAND FINAL — best of ' + info.bestOf + (gid ? ' — ' + gameLabel(gid) : ' — (no game picked)'));
      if (!info.ready) {
        lines.push('  (waiting on both brackets)');
      } else {
        var f = info.final;
        lines.push('  ' + info.a.name + ' (winners) vs ' + info.b.name + ' (losers)' +
          (f ? ' — ' + f.aWins + '–' + f.bWins + (f.winner ? ', ' + f.winner.name + ' wins' : ' — not played') : ' — not played'));
        if (info.needsReset || (info.reset && (info.reset.decided || info.reset.aWins > 0 || info.reset.bWins > 0))) {
          var rs = info.reset;
          lines.push('  BRACKET RESET — ' + (rs
            ? info.a.name + ' ' + rs.aWins + '–' + rs.bWins + ' ' + info.b.name +
              (rs.winner ? ', ' + rs.winner.name + ' wins the tournament' : ' — not played')
            : 'not played'));
        }
      }
      lines.push('');
    } else {
      B.rounds(state).forEach(function (round) { roundLines(round, 'r' + round.index); });
    }

    var histArr = state.history || [];
    if (histArr.length) {
      lines.push('RECENT RESULTS');
      histArr.slice(-10).forEach(function (e) { lines.push('  ' + e.text); });
      lines.push('');
    }
    lines.push('Made with Button Mash — your browser is the console.');
    return lines.join('\n');
  }

  function copyText(text, okMsg) {
    function done(ok) {
      announce(ok ? okMsg : 'Copy failed — your browser blocked it.');
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

  function shareUrl(state) {
    return window.location.href.split('#')[0] + '#b=' + B2.encodeShare(state);
  }

  function initFromHash() {
    try {
      if (!window.location.hash || window.location.hash.indexOf('#b=') !== 0) { return null; }
      var d = B2.decodeShare(window.location.hash.slice(3));
      if (!d.ok) {
        var errEl = $('t-setup-error');
        if (errEl) { errEl.textContent = 'Share link problem: ' + d.error; }
        announce('Share link problem: ' + d.error);
        return null;
      }
      return d.state;
    } catch (e) { return null; }
  }

  /* ---------- init ---------- */

  function initFromURL() {
    var q;
    try { q = new URLSearchParams(window.location.search); }
    catch (e) { return; }
    var n = parseInt(q.get('players'), 10);
    var ta = $('t-players');
    /* ?names=Ana,Ben,... (party planner 2.0 handoff): real guest names,
       one per line. Validated: 2-16 names, safe characters, <= 32 chars. */
    var names = (q.get('names') || '').split(',').map(function (s) { return s.trim().replace(/\s+/g, ' '); })
      .filter(function (s) { return s.length >= 1 && s.length <= 32 && /^[A-Za-z0-9 .'\-+_]+$/.test(s); })
      .slice(0, 16);
    if (names.length >= 2 && ta) {
      ta.value = names.join('\n');
      handoffParams = true;
    } else if (n >= B.MIN_PLAYERS && n <= B.MAX_PLAYERS && ta) {
      var lines = [];
      for (var i = 1; i <= n; i++) { lines.push('Player ' + i); }
      ta.value = lines.join('\n');
      handoffParams = true;
    }
    var games = (q.get('games') || '').split(',').map(function (s) { return s.trim(); })
      .filter(function (s) { return /^[a-z0-9-]+$/.test(s); });
    if (games.length) { pendingGameIds = games.slice(0, 8); handoffParams = true; }
    var fmt = (q.get('format') || '').toLowerCase();
    if (fmt === 'double' || fmt === 'single') {
      var radio = document.querySelector('input[name="t-format"][value="' + fmt + '"]');
      if (radio) { radio.checked = true; }
      handoffParams = true;
    }
  }

  function loadCatalog() {
    return BM.loadGames().then(function (games) {
      var party = [], rest = [];
      games.forEach(function (g) {
        if ((g.tags || []).indexOf('party') !== -1) { party.push(g); } else { rest.push(g); }
      });
      function byTitle(a, b) { return a.title.localeCompare(b.title); }
      party.sort(byTitle);
      rest.sort(byTitle);
      catalog = party.concat(rest);
      catalogById = {};
      partyIds = {};
      party.forEach(function (g) { partyIds[g.id] = true; });
      catalog.forEach(function (g) { catalogById[g.id] = g; });
    }).catch(function () {
      catalog = [];
      catalogById = {};
      partyIds = {};
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('t-players')) { return; }
    initFromURL();
    updateCount();
    renderSeedList();
    var ta = $('t-players');
    ta.addEventListener('input', function () { updateCount(); renderSeedList(); });
    var gen = $('t-generate');
    if (gen) { gen.addEventListener('click', generate); }
    var seedRandom = $('t-seed-random');
    if (seedRandom) {
      seedRandom.addEventListener('click', function () {
        var ta2 = $('t-players');
        if (!ta2) { return; }
        var arr = ta2.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        ta2.value = arr.join('\n');
        updateCount();
        renderSeedList();
        announce('Seeds randomized — entry order is the new seed order.');
      });
    }
    var startover = $('t-startover');
    if (startover) {
      startover.addEventListener('click', function () {
        pushUndo(loadState());
        dropState();
        renderAll(null);
        announce('Tournament cleared. Enter players to start a new one.');
        var tp = $('t-players');
        if (tp) { tp.focus(); }
      });
    }
    var printBtn = $('t-print');
    if (printBtn) { printBtn.addEventListener('click', function () { window.print(); }); }
    var copyBtn = $('t-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var s = loadState();
        if (s) { copyText(bracketText(s), 'Bracket copied — paste it anywhere.'); }
      });
    }
    var shareBtn = $('t-sharelink');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var s = loadState();
        if (s) { copyText(shareUrl(s), 'Share link copied — anyone opening it gets this exact bracket.'); }
      });
    }
    var undoBtn = $('t-undo');
    if (undoBtn) {
      undoBtn.addEventListener('click', function () {
        var prev = popUndo();
        if (!prev) { announce('Nothing to undo.'); return; }
        activeFormat = prev.version === 2 ? 'double' : 'single';
        saveState(prev);
        renderAll(prev);
        announce('Undone — bracket restored to the previous step.');
      });
    }

    loadCatalog().then(function () {
      renderSeedList(); /* game-pick selects need the catalog */
      var shared = initFromHash();
      if (shared) {
        var old = loadStateFor(shared.version === 2 ? 'double' : 'single');
        if (old) { pushUndo(old); }
        activeFormat = shared.version === 2 ? 'double' : 'single';
        hist(shared, 'Bracket loaded from a share link.');
        saveState(shared);
        renderAll(shared);
        announce('Shared bracket loaded: ' + shared.players.length + ' players.');
        updateCount();
        return;
      }
      var savedActive = null;
      try { savedActive = localStorage.getItem(ACTIVE_KEY); } catch (e) {}
      if (handoffParams) {
        /* Fresh handoff (?players=/&games=/&format=): the user is starting a
           new tournament — don't restore the old saved bracket under it.
           The pre-filled names + pending games wait for Generate. */
        renderAll(null);
        updateCount();
        return;
      }
      if (savedActive === 'double' || savedActive === 'single') { activeFormat = savedActive; }
      var saved = loadState();
      if (!saved && activeFormat === 'double') {
        /* active said double but only a single-elim save exists (or vice versa) */
        var other = activeFormat === 'double' ? 'single' : 'double';
        var s2 = loadStateFor(other);
        if (s2) { activeFormat = other; saved = s2; }
      }
      if (saved) {
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
