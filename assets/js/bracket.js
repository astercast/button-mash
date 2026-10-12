/* Button Mash tournament bracket logic — pure functions, no DOM.
   UMD: works in the browser (window.Bracket) and under node (module.exports)
   so scripts/test_bracket.js can verify seeding, byes, and advancement.

   Model:
   - players: array of names; index 0 = seed 1 (entry order = seed order,
     unless shuffled). Seeds are the stable player ids.
   - order: first-round slot order as seed numbers (standard tournament
     seeding), e.g. 8 players -> [1,8,4,5,2,7,3,6].
   - results: map "r{round}m{match}" -> {aWins, bWins, winner (seed or null)}.
     Slots for rounds > 0 are derived from previous-round winners.
   - A first-round slot whose seed number exceeds the player count is a BYE;
     the other side advances automatically and honestly (shown as a bye). */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.Bracket = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MIN_PLAYERS = 2;
  var MAX_PLAYERS = 16;
  var BEST_OF_OPTIONS = [1, 3, 5, 7];

  function nextPow2(n) {
    var p = 1;
    while (p < n) { p *= 2; }
    return p;
  }

  /* Standard single-elimination seeding: 1vN, 8v9, 4v13 ... */
  function seedOrder(n) {
    if (n === 2) { return [1, 2]; }
    var prev = seedOrder(n / 2);
    var out = [];
    prev.forEach(function (s) { out.push(s); out.push(n + 1 - s); });
    return out;
  }

  function neededWins(bestOf) {
    return Math.floor(bestOf / 2) + 1;
  }

  function roundName(roundIdx, totalRounds) {
    var fromEnd = totalRounds - 1 - roundIdx;
    if (fromEnd === 0) { return 'Final'; }
    if (fromEnd === 1) { return 'Semifinal'; }
    if (fromEnd === 2) { return 'Quarterfinal'; }
    return 'Round ' + (roundIdx + 1);
  }

  function key(roundIdx, matchIdx) { return 'r' + roundIdx + 'm' + matchIdx; }

  function normalizeNames(raw) {
    var seen = {};
    var out = [];
    raw.forEach(function (n) {
      var name = String(n).trim();
      if (!name) { return; }
      var base = name, i = 2;
      while (seen[name.toLowerCase()]) { name = base + ' ' + i; i++; }
      seen[name.toLowerCase()] = true;
      out.push(name);
    });
    return out;
  }

  function validatePlayers(names) {
    if (!names || names.length < MIN_PLAYERS) {
      return 'Add at least ' + MIN_PLAYERS + ' players (one per line).';
    }
    if (names.length > MAX_PLAYERS) {
      return 'Tournaments cap at ' + MAX_PLAYERS + ' players — trim the list.';
    }
    return null;
  }

  function createTournament(playerNames) {
    var players = normalizeNames(playerNames || []);
    var err = validatePlayers(players);
    if (err) { return { error: err }; }
    var size = nextPow2(players.length);
    var totalRounds = Math.log(size) / Math.log(2);
    var bestOf = {};
    var games = {};
    for (var r = 0; r < totalRounds; r++) { bestOf[r] = 1; games[r] = ''; }
    return {
      version: 1,
      players: players,
      size: size,
      totalRounds: totalRounds,
      order: seedOrder(size),
      bestOf: bestOf,
      games: games,
      results: {}
    };
  }

  /* Slot: {seed, name, bye}. null = not yet decided (waiting on earlier round). */
  function slotFor(state, seed) {
    if (seed == null) { return null; }
    if (seed > state.players.length) { return { seed: seed, name: 'BYE', bye: true }; }
    return { seed: seed, name: state.players[seed - 1], bye: false };
  }

  function getResult(state, roundIdx, matchIdx) {
    return state.results[key(roundIdx, matchIdx)] || null;
  }

  /* Build the full computed bracket: rounds -> matches.
     Match: {round, index, a: slot|null, b: slot|null,
             aWins, bWins, winner: slot|null, decided: bool, byeAdvance: bool} */
  function rounds(state) {
    var out = [];
    var prevWinners = []; // seed numbers (or null) from the previous round
    for (var r = 0; r < state.totalRounds; r++) {
      var matches = [];
      var nMatches = state.size / Math.pow(2, r + 1);
      var thisWinners = [];
      for (var m = 0; m < nMatches; m++) {
        var aSeed, bSeed;
        if (r === 0) {
          aSeed = state.order[m * 2];
          bSeed = state.order[m * 2 + 1];
        } else {
          aSeed = prevWinners[m * 2];
          bSeed = prevWinners[m * 2 + 1];
        }
        var a = slotFor(state, aSeed);
        var b = slotFor(state, bSeed);
        var res = getResult(state, r, m);
        var aWins = res ? res.aWins : 0;
        var bWins = res ? res.bWins : 0;
        var winner = null;
        var byeAdvance = false;
        if (a && b) {
          if (a.bye && !b.bye) { winner = b; byeAdvance = true; }
          else if (b.bye && !a.bye) { winner = a; byeAdvance = true; }
          else if (res && res.winner != null) {
            winner = res.winner === a.seed ? a : b;
          }
        }
        matches.push({
          round: r, index: m, a: a, b: b,
          aWins: aWins, bWins: bWins,
          winner: winner, decided: !!winner, byeAdvance: byeAdvance
        });
        thisWinners.push(winner ? winner.seed : null);
      }
      prevWinners = thisWinners;
      out.push({
        index: r,
        name: roundName(r, state.totalRounds),
        bestOf: state.bestOf[r] || 1,
        game: state.games[r] || '',
        matches: matches
      });
    }
    return out;
  }

  function champion(state) {
    var rs = rounds(state);
    var fin = rs[rs.length - 1].matches[0];
    return fin && fin.winner && !fin.winner.bye ? fin.winner : null;
  }

  function matchComplete(state) {
    var n = 0, decided = 0;
    rounds(state).forEach(function (round) {
      round.matches.forEach(function (mt) { n++; if (mt.decided) { decided++; } });
    });
    return { total: n, decided: decided };
  }

  /* Record one game win for a side ('a'|'b'). At majority, the winner advances.
     Returns {ok, winner: slot|null, error}. Bye matches reject manual wins. */
  function recordWin(state, roundIdx, matchIdx, side) {
    var rs = rounds(state);
    var round = rs[roundIdx];
    if (!round) { return { ok: false, error: 'No such round.' }; }
    var mt = round.matches[matchIdx];
    if (!mt) { return { ok: false, error: 'No such match.' }; }
    if (!mt.a || !mt.b) { return { ok: false, error: 'Match is not set yet — finish the earlier round first.' }; }
    if (mt.byeAdvance) { return { ok: false, error: 'That match is a bye — the player advances automatically.' }; }
    if (mt.decided) { return { ok: false, error: 'That match already has a winner. Clear it first to change the result.' }; }
    if (side !== 'a' && side !== 'b') { return { ok: false, error: 'Side must be "a" or "b".' }; }
    var k = key(roundIdx, matchIdx);
    var res = state.results[k] || { aWins: 0, bWins: 0, winner: null };
    res[side + 'Wins']++;
    var need = neededWins(round.bestOf);
    var winner = null;
    if (res.aWins >= need) { winner = mt.a; }
    else if (res.bWins >= need) { winner = mt.b; }
    if (winner) { res.winner = winner.seed; }
    state.results[k] = res;
    return { ok: true, winner: winner };
  }

  /* Remove one recorded game win (score correction). Never goes below zero,
     never un-decides a match silently: if the match was decided, refuse and
     point at clearMatch instead. */
  function removeWin(state, roundIdx, matchIdx, side) {
    var k = key(roundIdx, matchIdx);
    var res = state.results[k];
    if (!res || res.winner != null) {
      return { ok: false, error: 'Nothing to correct — use "clear winner" on a decided match.' };
    }
    if (side !== 'a' && side !== 'b') { return { ok: false, error: 'Side must be "a" or "b".' }; }
    res[side + 'Wins'] = Math.max(0, res[side + 'Wins'] - 1);
    if (res.aWins === 0 && res.bWins === 0) { delete state.results[k]; }
    return { ok: true };
  }

  /* Clear a match's winner (and everything downstream that depended on it). */
  function clearMatch(state, roundIdx, matchIdx) {
    var k = key(roundIdx, matchIdx);
    if (!state.results[k]) { return { ok: false, error: 'That match has no result to clear.' }; }
    /* Cascade: any later-round match whose slot came from this match's
       winner must be cleared too. Recompute downstream by wiping every
       result from this round onward that is now unreachable. */
    delete state.results[k];
    var rs = rounds(state);
    for (var r = roundIdx + 1; r < state.totalRounds; r++) {
      rs[r].matches.forEach(function (mt) {
        var kk = key(r, mt.index);
        if (state.results[kk] && (!mt.a || !mt.b)) { delete state.results[kk]; }
      });
      rs = rounds(state); /* recompute after each round's wipes */
    }
    return { ok: true };
  }

  /* Randomize seed order (Fisher-Yates on the players array = new seeds). */
  function shufflePlayers(state) {
    for (var i = state.players.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = state.players[i];
      state.players[i] = state.players[j];
      state.players[j] = t;
    }
    state.results = {};
    return state;
  }

  function describeByes(state) {
    var n = state.players.length;
    var byes = state.size - n;
    if (!byes) { return null; }
    var names = [];
    for (var i = 0; i < byes; i++) { names.push(state.players[i]); }
    return names;
  }

  return {
    MIN_PLAYERS: MIN_PLAYERS,
    MAX_PLAYERS: MAX_PLAYERS,
    BEST_OF_OPTIONS: BEST_OF_OPTIONS,
    nextPow2: nextPow2,
    seedOrder: seedOrder,
    neededWins: neededWins,
    roundName: roundName,
    normalizeNames: normalizeNames,
    validatePlayers: validatePlayers,
    createTournament: createTournament,
    rounds: rounds,
    champion: champion,
    matchComplete: matchComplete,
    recordWin: recordWin,
    removeWin: removeWin,
    clearMatch: clearMatch,
    shufflePlayers: shufflePlayers,
    describeByes: describeByes
  };
}));
