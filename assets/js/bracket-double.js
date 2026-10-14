/* Button Mash double-elimination bracket logic, pure functions, no DOM.
   UMD: browser (window.BracketDouble; needs window.Bracket loaded first)
   and node (module.exports) so scripts/test_bracket_double.js can verify
   losers-bracket construction, the grand final, bracket reset, reseeding,
   share-link encode/decode/validation, and game voting with pinned fixtures.

   Model (version 2 state):
   - Winners bracket: standard single elimination, delegated to Bracket
     through a view object (players/size/order/bestOf/games + results.winners).
   - Losers bracket: computed round by round. Losers-round j entrants:
       j = 0       -> losers of winners round 0. A first-round BYE match
                      contributes NO loser (it never played anyone).
       j even (>0) -> winners of losers round j-1, paired in match order.
       j odd       -> winners of losers round j-1 merged with the losers
                      dropping out of winners round (j+1)/2. Pairing rule:
                      survivor[i] vs drop-in[D-1-i]; then leftover
                      survivors pair up, leftover drop-ins pair up; a
                      trailing lone entrant gets an honest BYE.
     Round count = 2k-2 for k winners rounds (k >= 2). With 2 players
     (k = 1) there are zero losers rounds and the losers' "champion" is
     simply the loser of the winners final, a straight rematch.
   - Grand final: winners champion vs losers champion. Winners champ wins
     -> champion. Losers champ wins -> bracket reset: one more final,
     winner takes the tournament.
   - results.winners / results.losers keyed "r{round}m{match}". Losers
     results snapshot their entrant seeds (aSeed/bSeed) so syncLosers()
     can wipe results whose matchup changed after an upstream edit
     (e.g. clearing a winners match).
   - history: append-only [{t, text}] match log, capped at 200 entries.
   - gamePicks: {playerName: gameId}; gameVotes: {voteKey: {voter: gameId}}.
     voteKey 'r0' = winners round 0, 'L0' = losers round 0, 'GF' = grand final.
   - Share links: encodeShare/decodeShare move a canonical subset of the
     state through a URL hash (#b=...). decodeShare VALIDATES everything
     and rebuilds a full state; anything malformed is rejected. */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(require('./bracket.js')); }
  else { root.BracketDouble = factory(root.Bracket); }
}(typeof self !== 'undefined' ? self : this, function (B) {
  'use strict';

  if (!B) { throw new Error('BracketDouble needs window.Bracket (bracket.js) loaded first.'); }

  var HISTORY_CAP = 200;
  var SHARE_MAX_LEN = 20000;
  var GAME_ID_RE = /^[a-z0-9-]{1,64}$/;

  function key(roundIdx, matchIdx) { return 'r' + roundIdx + 'm' + matchIdx; }

  function losersRoundCount(k) { return k < 2 ? 0 : 2 * k - 2; }

  function createTournamentDouble(playerNames) {
    var players = B.normalizeNames(playerNames || []);
    var err = B.validatePlayers(players);
    if (err) { return { error: err }; }
    var size = B.nextPow2(players.length);
    var k = Math.round(Math.log(size) / Math.log(2));
    var bestOf = {}, games = {}, losersBestOf = {};
    for (var r = 0; r < k; r++) { bestOf[r] = 1; games[r] = ''; }
    for (var j = 0; j < losersRoundCount(k); j++) { losersBestOf[j] = 1; }
    return {
      version: 2,
      format: 'double',
      players: players,
      size: size,
      totalWinnersRounds: k,
      order: B.seedOrder(size),
      bestOf: bestOf,
      losersBestOf: losersBestOf,
      grandFinalBestOf: 1,
      games: games,
      results: { winners: {}, losers: {} },
      grandFinal: null,
      grandFinalReset: null,
      gamePicks: {},
      gameVotes: {},
      history: []
    };
  }

  /* The winners bracket is a plain single-elim state; delegate to Bracket. */
  function winnersView(state) {
    return {
      players: state.players,
      size: state.size,
      totalRounds: state.totalWinnersRounds,
      order: state.order,
      bestOf: state.bestOf,
      games: state.games,
      results: state.results.winners
    };
  }

  function slotFor(state, seed) {
    if (seed == null) { return null; }
    if (seed > state.players.length) { return { seed: seed, name: 'BYE', bye: true }; }
    return { seed: seed, name: state.players[seed - 1], bye: false };
  }

  function winnersRounds(state) { return B.rounds(winnersView(state)); }

  /* Losers of the decided, non-bye matches of winners round r, in match
     order. Undecided matches hold a null placeholder (positional); round-0
     BYE matches contribute nothing at all. */
  function winnersDropIns(state, r) {
    var out = [];
    var round = winnersRounds(state)[r];
    if (!round) { return out; }
    round.matches.forEach(function (mt) {
      if (mt.byeAdvance) { return; }
      if (!mt.decided || !mt.winner) { out.push(null); return; }
      out.push(mt.winner.seed === mt.a.seed ? mt.b.seed : mt.a.seed);
    });
    return out;
  }

  /* Merge rule (documented, pinned in tests): survivors in match order,
     drop-ins in match order; survivor[i] faces drop-in[D-1-i]; leftover
     survivors pair up; leftover drop-ins pair up. Nulls hold positions. */
  function mergeEntrants(survivors, dropIns) {
    var out = [];
    var n = Math.min(survivors.length, dropIns.length);
    var i;
    for (i = 0; i < n; i++) { out.push(survivors[i]); out.push(dropIns[dropIns.length - 1 - i]); }
    for (i = n; i < survivors.length; i++) { out.push(survivors[i]); }
    for (i = 0; i < dropIns.length - n; i++) { out.push(dropIns[i]); }
    return out;
  }

  function losersEntrants(state, j, prevWinnerSeeds) {
    if (j === 0) { return winnersDropIns(state, 0); }
    var survivors = prevWinnerSeeds.filter(function (s) { return s != null; });
    if (j % 2 === 0) { return prevWinnerSeeds.slice(); } /* nulls hold positions */
    return mergeEntrants(survivors, winnersDropIns(state, (j + 1) / 2));
  }

  /* Pair an entrant list into [aSeed, bSeed|null, isBye]. A trailing lone
     decided entrant gets an honest BYE; all-null pairs are dropped. */
  function pairEntrants(entrants) {
    var pairs = [];
    for (var i = 0; i < entrants.length; i += 2) {
      var a = entrants[i];
      var b = (i + 1 < entrants.length) ? entrants[i + 1] : 'BYE';
      if (a == null && (b == null || b === 'BYE')) { continue; }
      pairs.push({ aSeed: a, bSeed: b === 'BYE' ? null : b, bye: b === 'BYE' });
    }
    return pairs;
  }

  function buildLosersMatch(state, j, m, pair) {
    var kk = key(j, m);
    var res = state.results.losers[kk] || null;
    var a = slotFor(state, pair.aSeed);
    var b = pair.bye
      ? { seed: 0, name: 'BYE', bye: true }
      : slotFor(state, pair.bSeed);
    var aWins = res ? res.aWins : 0;
    var bWins = res ? res.bWins : 0;
    var winner = null;
    var byeAdvance = false;
    if (a && b) {
      if (pair.bye) { winner = a; byeAdvance = true; }
      else if (res && res.aSeed === pair.aSeed && res.bSeed === pair.bSeed && res.winner != null) {
        winner = res.winner === a.seed ? a : b;
      }
    }
    return {
      round: j, index: m, a: a, b: b,
      aWins: aWins, bWins: bWins,
      winner: winner, decided: !!winner, byeAdvance: byeAdvance
    };
  }

  function losersRoundName(j, total) {
    if (j === total - 1) { return 'Losers Final'; }
    return 'Losers Round ' + (j + 1);
  }

  function losersRounds(state) {
    var out = [];
    var L = losersRoundCount(state.totalWinnersRounds);
    var prevWinnerSeeds = [];
    for (var j = 0; j < L; j++) {
      var entrants = losersEntrants(state, j, prevWinnerSeeds);
      var pairs = pairEntrants(entrants);
      var matches = [];
      for (var m = 0; m < pairs.length; m++) {
        matches.push(buildLosersMatch(state, j, m, pairs[m]));
      }
      out.push({
        index: j,
        name: losersRoundName(j, L),
        bestOf: state.losersBestOf[j] || 1,
        matches: matches
      });
      prevWinnerSeeds = matches.map(function (mt) { return mt.winner ? mt.winner.seed : null; });
    }
    return out;
  }

  /* Reconcile losers + grand-final results with the current winners state.
     Any losers result whose matchup no longer matches is wiped; wipes
     propagate forward because each round is reconciled in order. */
  function syncLosers(state) {
    var L = losersRoundCount(state.totalWinnersRounds);
    var prevWinnerSeeds = [];
    for (var j = 0; j < L; j++) {
      var entrants = losersEntrants(state, j, prevWinnerSeeds);
      var pairs = pairEntrants(entrants);
      var seen = {};
      for (var m = 0; m < pairs.length; m++) {
        var kk = key(j, m);
        seen[kk] = true;
        var res = state.results.losers[kk];
        if (res && (res.aSeed !== pairs[m].aSeed || res.bSeed !== pairs[m].bSeed || pairs[m].aSeed == null)) {
          delete state.results.losers[kk];
        }
      }
      /* Orphaned results: the round now has fewer matches than before
         (e.g. an upstream clear shrank the entrant list), so any stored
         result past the last live match index is stale. */
      var roundRe = new RegExp('^r' + j + 'm\\d+$');
      Object.keys(state.results.losers).forEach(function (k2) {
        if (roundRe.test(k2) && !seen[k2]) { delete state.results.losers[k2]; }
      });
      var matches = [];
      for (var m2 = 0; m2 < pairs.length; m2++) {
        matches.push(buildLosersMatch(state, j, m2, pairs[m2]));
      }
      prevWinnerSeeds = matches.map(function (mt) { return mt.winner ? mt.winner.seed : null; });
    }
    var slots = grandFinalSlots(state);
    var gf = state.grandFinal;
    if (gf && (gf.aSeed !== slots.a || gf.bSeed !== slots.b || slots.a == null || slots.b == null)) {
      state.grandFinal = null;
      state.grandFinalReset = null;
    }
    var gfr = state.grandFinalReset;
    var ngf = state.grandFinal;
    if (gfr && (!ngf || ngf.winner == null || ngf.winner !== ngf.bSeed ||
        gfr.aSeed !== ngf.aSeed || gfr.bSeed !== ngf.bSeed)) {
      state.grandFinalReset = null;
    }
  }

  function grandFinalSlots(state) {
    var wv = winnersView(state);
    var wchamp = B.champion(wv);
    var a = wchamp ? wchamp.seed : null;
    var L = losersRoundCount(state.totalWinnersRounds);
    var b = null;
    if (L === 0) {
      var rs = B.rounds(wv);
      var fin = rs[rs.length - 1].matches[0];
      if (fin && fin.decided && !fin.byeAdvance && fin.winner) {
        b = fin.winner.seed === fin.a.seed ? fin.b.seed : fin.a.seed;
      }
    } else {
      var lrs = losersRounds(state);
      var last = lrs[lrs.length - 1];
      var lm = last.matches[last.matches.length - 1];
      if (lm && lm.decided && lm.winner && !lm.winner.bye) { b = lm.winner.seed; }
    }
    return { a: a, b: b };
  }

  function grandFinalInfo(state) {
    var slots = grandFinalSlots(state);
    var a = slotFor(state, slots.a);
    var b = slotFor(state, slots.b);
    function shape(s) {
      if (!s) { return null; }
      return {
        aSeed: s.aSeed, bSeed: s.bSeed, aWins: s.aWins, bWins: s.bWins,
        winner: s.winner != null ? slotFor(state, s.winner) : null,
        decided: s.winner != null
      };
    }
    var final = shape(state.grandFinal);
    var reset = shape(state.grandFinalReset);
    return {
      a: a, b: b,
      ready: !!(a && b),
      bestOf: state.grandFinalBestOf || 1,
      game: state.games.GF || '',
      final: final,
      reset: reset,
      needsReset: !!(final && final.decided && final.winner && slots.b != null && final.winner.seed === slots.b)
    };
  }

  function champion(state) {
    var info = grandFinalInfo(state);
    if (!info.final || !info.final.decided || !info.final.winner) { return null; }
    if (info.a && info.final.winner.seed === info.a.seed) { return info.a; }
    if (info.reset && info.reset.decided && info.reset.winner) { return info.reset.winner; }
    return null;
  }

  function matchProgress(state) {
    var wp = B.matchComplete(winnersView(state));
    var total = wp.total, decided = wp.decided;
    losersRounds(state).forEach(function (r) {
      r.matches.forEach(function (m) { total++; if (m.decided) { decided++; } });
    });
    total++;
    if (state.grandFinal && state.grandFinal.winner != null) { decided++; }
    var info = grandFinalInfo(state);
    if (info.needsReset || (state.grandFinalReset && state.grandFinalReset.winner != null)) {
      total++;
      if (state.grandFinalReset && state.grandFinalReset.winner != null) { decided++; }
    }
    return { total: total, decided: decided };
  }

  /* ---------- history ---------- */

  function logHistory(state, text) {
    if (!state.history) { state.history = []; }
    state.history.push({ t: Date.now(), text: String(text).slice(0, 500) });
    while (state.history.length > HISTORY_CAP) { state.history.shift(); }
    return state;
  }

  function scoreText(mt) {
    return ' ' + mt.aWins + '-' + mt.bWins;
  }

  /* ---------- winners-bracket mutations (delegated, then synced) ---------- */

  function recordWinnersWin(state, r, m, side) {
    var wv = winnersView(state);
    var res = B.recordWin(wv, r, m, side);
    if (!res.ok) { return res; }
    syncLosers(state);
    var rs = B.rounds(wv);
    var mt = rs[r].matches[m];
    logHistory(state, 'Winners · ' + rs[r].name + ' M' + (m + 1) + ': ' +
      mt.a.name + scoreText(mt) + ' ' + mt.b.name +
      (res.winner ? ', ' + res.winner.name + ' advances' : ''));
    return res;
  }

  function removeWinnersWin(state, r, m, side) {
    var wv = winnersView(state);
    var res = B.removeWin(wv, r, m, side);
    if (!res.ok) { return res; }
    syncLosers(state);
    return res;
  }

  function clearWinnersMatch(state, r, m) {
    var wv = winnersView(state);
    var before = B.rounds(wv)[r].matches[m];
    var was = before && before.winner ? before.winner.name : null;
    var res = B.clearMatch(wv, r, m);
    if (!res.ok) { return res; }
    syncLosers(state);
    logHistory(state, 'Winners · ' + B.roundName(r, state.totalWinnersRounds) + ' M' + (m + 1) +
      ' cleared' + (was ? ' (was: ' + was + ' advancing)' : '') + ', dependent losers results wiped.');
    return res;
  }

  /* ---------- losers-bracket mutations ---------- */

  function recordLosersWin(state, j, m, side) {
    var lrs = losersRounds(state);
    var round = lrs[j];
    if (!round) { return { ok: false, error: 'No such losers round.' }; }
    var mt = round.matches[m];
    if (!mt) { return { ok: false, error: 'No such match.' }; }
    if (!mt.a || !mt.b) { return { ok: false, error: 'Match is not set yet, finish the earlier round first.' }; }
    if (mt.byeAdvance) { return { ok: false, error: 'That match is a bye, the player advances automatically.' }; }
    if (mt.decided) { return { ok: false, error: 'That match already has a winner. Clear it first to change the result.' }; }
    if (side !== 'a' && side !== 'b') { return { ok: false, error: 'Side must be "a" or "b".' }; }
    var kk = key(j, m);
    var res = state.results.losers[kk] || { aSeed: mt.a.seed, bSeed: mt.b.seed, aWins: 0, bWins: 0, winner: null };
    res.aSeed = mt.a.seed;
    res.bSeed = mt.b.seed;
    res[side + 'Wins']++;
    var need = B.neededWins(round.bestOf);
    var winner = null;
    if (res.aWins >= need) { winner = mt.a; }
    else if (res.bWins >= need) { winner = mt.b; }
    if (winner) { res.winner = winner.seed; }
    state.results.losers[kk] = res;
    syncLosers(state);
    logHistory(state, 'Losers · ' + round.name + ' M' + (m + 1) + ': ' +
      mt.a.name + scoreText({ aWins: res.aWins, bWins: res.bWins }) + ' ' + mt.b.name +
      (winner ? ', ' + winner.name + ' advances' : ''));
    return { ok: true, winner: winner };
  }

  function removeLosersWin(state, j, m, side) {
    var kk = key(j, m);
    var res = state.results.losers[kk];
    if (!res || res.winner != null) {
      return { ok: false, error: 'Nothing to correct, use "clear winner" on a decided match.' };
    }
    if (side !== 'a' && side !== 'b') { return { ok: false, error: 'Side must be "a" or "b".' }; }
    res[side + 'Wins'] = Math.max(0, res[side + 'Wins'] - 1);
    if (res.aWins === 0 && res.bWins === 0) { delete state.results.losers[kk]; }
    syncLosers(state);
    return { ok: true };
  }

  function clearLosersMatch(state, j, m) {
    var kk = key(j, m);
    var lrs = losersRounds(state);
    var mt = lrs[j] && lrs[j].matches[m];
    var was = mt && mt.winner ? mt.winner.name : null;
    if (!state.results.losers[kk]) { return { ok: false, error: 'That match has no result to clear.' }; }
    delete state.results.losers[kk];
    syncLosers(state);
    logHistory(state, 'Losers · ' + (lrs[j] ? lrs[j].name : 'Round ' + (j + 1)) + ' M' + (m + 1) +
      ' cleared' + (was ? ' (was: ' + was + ' advancing)' : '') + ', later losers results wiped.');
    return { ok: true };
  }

  /* ---------- grand final ---------- */

  function recordGrandWin(state, which, side) {
    var info = grandFinalInfo(state);
    if (!info.ready) {
      return { ok: false, error: 'The grand final is not set yet, finish both brackets first.' };
    }
    if (side !== 'a' && side !== 'b') { return { ok: false, error: 'Side must be "a" or "b".' }; }
    var isReset = which === 1;
    if (isReset && !info.needsReset && !(info.reset && info.reset.decided)) {
      return { ok: false, error: 'No bracket reset, the winners-bracket champion took the final outright.' };
    }
    var prop = isReset ? 'grandFinalReset' : 'grandFinal';
    var cur = state[prop];
    if (cur && cur.winner != null) {
      return { ok: false, error: 'That final already has a winner. Clear it first to change the result.' };
    }
    var res = cur || { aSeed: info.a.seed, bSeed: info.b.seed, aWins: 0, bWins: 0, winner: null };
    res.aSeed = info.a.seed;
    res.bSeed = info.b.seed;
    res[side + 'Wins']++;
    var need = B.neededWins(info.bestOf);
    var winner = null;
    if (res.aWins >= need) { winner = info.a; }
    else if (res.bWins >= need) { winner = info.b; }
    if (winner) { res.winner = winner.seed; }
    state[prop] = res;
    var label = isReset ? 'Grand Final (bracket reset)' : 'Grand Final';
    logHistory(state, label + ': ' + info.a.name + ' ' + res.aWins + '-' + res.bWins + ' ' + info.b.name +
      (winner ? ', ' + winner.name + ' wins' : ''));
    return { ok: true, winner: winner };
  }

  function clearGrandFinal(state, which) {
    var prop = which === 1 ? 'grandFinalReset' : 'grandFinal';
    if (!state[prop]) { return { ok: false, error: 'That final has no result to clear.' }; }
    var was = state[prop].winner != null ? slotFor(state, state[prop].winner).name : null;
    state[prop] = null;
    if (which === 0) { state.grandFinalReset = null; }
    logHistory(state, (which === 1 ? 'Grand Final (bracket reset)' : 'Grand Final') +
      ' cleared' + (was ? ' (was: ' + was + ')' : ''));
    return { ok: true };
  }

  /* ---------- reseeding ---------- */

  /* newOrder: array of names (same set, new seed order). Results are wiped
    , seeds changed, so every matchup is new. Picks/votes survive (keyed by
     name); the wipe is logged in the history. */
  function reseedPlayers(state, newOrder) {
    var players = B.normalizeNames(newOrder || []);
    if (players.length !== state.players.length) {
      return { ok: false, error: 'Reseed needs the same players.' };
    }
    var sorted = function (a) { return a.slice().sort(); };
    if (sorted(players).join('|') !== sorted(state.players).join('|')) {
      return { ok: false, error: 'Reseed needs the same players.' };
    }
    state.players = players;
    state.results = { winners: {}, losers: {} };
    state.grandFinal = null;
    state.grandFinalReset = null;
    logHistory(state, 'Seeds reordered, all bracket results cleared.');
    return { ok: true };
  }

  /* ---------- game voting ---------- */

  function gameForKey(state, gameKey) {
    return state.games[gameKey] || '';
  }

  /* Candidates: distinct participant picks in seed order, then the round's
     currently-picked game if it is not already listed. */
  function voteCandidates(state, gameKey) {
    var out = [], seen = {};
    state.players.forEach(function (name) {
      var g = state.gamePicks[name];
      if (g && !seen[g]) { seen[g] = true; out.push(g); }
    });
    var cur = gameForKey(state, gameKey);
    if (cur && !seen[cur]) { out.push(cur); }
    return out;
  }

  function setGameVote(state, voteKey, voter, gameId) {
    if (state.players.indexOf(voter) === -1) { return { ok: false, error: 'Unknown player.' }; }
    if (typeof gameId !== 'string' || !GAME_ID_RE.test(gameId)) {
      return { ok: false, error: 'Unknown game.' };
    }
    if (!state.gameVotes) { state.gameVotes = {}; }
    if (!state.gameVotes[voteKey]) { state.gameVotes[voteKey] = {}; }
    state.gameVotes[voteKey][voter] = gameId;
    return { ok: true };
  }

  function removeGameVote(state, voteKey, voter) {
    if (state.gameVotes && state.gameVotes[voteKey]) { delete state.gameVotes[voteKey][voter]; }
    return { ok: true };
  }

  /* Winner: most votes; ties go to the earliest-listed candidate
     (documented in the UI). */
  function computeGameVote(state, voteKey, candidates) {
    var votes = (state.gameVotes && state.gameVotes[voteKey]) || {};
    var tally = {};
    Object.keys(votes).forEach(function (v) {
      var g = votes[v];
      tally[g] = (tally[g] || 0) + 1;
    });
    var best = null, bestN = 0;
    (candidates || []).forEach(function (g) {
      var n = tally[g] || 0;
      if (n > bestN) { best = g; bestN = n; }
    });
    return { tally: tally, winner: best, votes: bestN, total: Object.keys(votes).length };
  }

  /* ---------- share links ---------- */

  function sharePayload(state) {
    var p = {
      v: state.version,
      format: state.format || 'single',
      players: state.players,
      bestOf: state.bestOf,
      games: state.games,
      results: state.results,
      gamePicks: state.gamePicks || {},
      gameVotes: state.gameVotes || {},
      history: (state.history || []).slice(-50)
    };
    if (state.version === 2) {
      p.losersBestOf = state.losersBestOf;
      p.grandFinalBestOf = state.grandFinalBestOf;
      p.grandFinal = state.grandFinal;
      p.grandFinalReset = state.grandFinalReset;
    }
    return p;
  }

  function b64urlEncode(str) {
    var b64;
    if (typeof Buffer !== 'undefined') { b64 = Buffer.from(str, 'utf8').toString('base64'); }
    else { b64 = btoa(unescape(encodeURIComponent(str))); }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlDecode(s) {
    var b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) { b64 += '='; }
    if (typeof Buffer !== 'undefined') { return Buffer.from(b64, 'base64').toString('utf8'); }
    return decodeURIComponent(escape(atob(b64)));
  }

  function encodeShare(state) {
    return b64urlEncode(JSON.stringify(sharePayload(state)));
  }

  function isInt(x) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x; }

  function validMatchResult(r) {
    return r && isInt(r.aWins) && r.aWins >= 0 && r.aWins <= 7 &&
      isInt(r.bWins) && r.bWins >= 0 && r.bWins <= 7 &&
      (r.winner == null || isInt(r.winner));
  }

  function validResultMap(map, double) {
    if (!map || typeof map !== 'object') { return false; }
    /* single: map itself is the key->result map; double: {winners, losers}.
       Losers results snapshot their entrant seeds (aSeed/bSeed); winners
       results come from Bracket and carry no snapshots. */
    var maps = double ? [map.winners, map.losers] : [map];
    var needSnap = [false, true];
    for (var i = 0; i < maps.length; i++) {
      var m = maps[i];
      if (!m || typeof m !== 'object') { return false; }
      var keys = Object.keys(m);
      if (keys.length > 64) { return false; }
      for (var k = 0; k < keys.length; k++) {
        if (!/^r\d+m\d+$/.test(keys[k])) { return false; }
        var r = m[keys[k]];
        if (!validMatchResult(r)) { return false; }
        if (double && needSnap[i] && (!isInt(r.aSeed) || !isInt(r.bSeed))) { return false; }
      }
    }
    return true;
  }

  function validBestOfMap(m) {
    if (!m || typeof m !== 'object') { return false; }
    return Object.keys(m).every(function (k) {
      return /^\d+$/.test(k) && B.BEST_OF_OPTIONS.indexOf(m[k]) !== -1;
    });
  }

  function validGamesMap(m) {
    if (!m || typeof m !== 'object') { return false; }
    return Object.keys(m).every(function (k) {
      return /^[A-Za-z0-9]+$/.test(k) &&
        (m[k] === '' || (typeof m[k] === 'string' && GAME_ID_RE.test(m[k])));
    });
  }

  function validGrandFinal(g) {
    if (g == null) { return true; }
    return g && isInt(g.aSeed) && isInt(g.bSeed) &&
      isInt(g.aWins) && g.aWins >= 0 && g.aWins <= 7 &&
      isInt(g.bWins) && g.bWins >= 0 && g.bWins <= 7 &&
      (g.winner == null || isInt(g.winner));
  }

  /* Rebuild a full, live state from a validated payload. Never trusts the
     payload's derived fields (size/order/rounds), recomputes them. */
  function decodeShare(str) {
    if (typeof str !== 'string' || !str.length || str.length > SHARE_MAX_LEN) {
      return { ok: false, error: 'That share link is empty or too long.' };
    }
    if (!/^[A-Za-z0-9\-_]+$/.test(str)) {
      return { ok: false, error: 'That share link has invalid characters.' };
    }
    var obj;
    try { obj = JSON.parse(b64urlDecode(str)); }
    catch (e) { return { ok: false, error: 'That share link could not be decoded.' }; }
    if (!obj || typeof obj !== 'object') { return { ok: false, error: 'That share link is malformed.' }; }
    if (obj.v !== 1 && obj.v !== 2) { return { ok: false, error: 'That share link is from an unknown bracket version.' }; }
    var wantDouble = obj.v === 2;
    if ((obj.format === 'double') !== wantDouble) {
      return { ok: false, error: 'That share link has a mismatched format.' };
    }
    if (!Array.isArray(obj.players) || obj.players.length < B.MIN_PLAYERS || obj.players.length > B.MAX_PLAYERS) {
      return { ok: false, error: 'That share link has a bad player list.' };
    }
    for (var i = 0; i < obj.players.length; i++) {
      var nm = obj.players[i];
      if (typeof nm !== 'string' || !nm.trim() || nm.length > 60) {
        return { ok: false, error: 'That share link has a bad player name.' };
      }
    }
    if (!validBestOfMap(obj.bestOf) || !validGamesMap(obj.games) || !validResultMap(obj.results, wantDouble)) {
      return { ok: false, error: 'That share link has bad bracket data.' };
    }
    var hist = obj.history || [];
    if (!Array.isArray(hist) || hist.length > HISTORY_CAP) {
      return { ok: false, error: 'That share link has a bad history log.' };
    }
    for (var h = 0; h < hist.length; h++) {
      if (!hist[h] || typeof hist[h].text !== 'string' || hist[h].text.length > 500) {
        return { ok: false, error: 'That share link has a bad history log.' };
      }
    }
    var picks = obj.gamePicks || {}, votes = obj.gameVotes || {};
    if (typeof picks !== 'object' || typeof votes !== 'object') {
      return { ok: false, error: 'That share link has bad game data.' };
    }

    var state = wantDouble ? createTournamentDouble(obj.players) : B.createTournament(obj.players);
    if (state.error) { return { ok: false, error: state.error }; }
    state.bestOf = obj.bestOf;
    state.games = obj.games;
    state.gamePicks = picks;
    state.gameVotes = votes;
    state.history = hist;
    if (wantDouble) {
      if (!validBestOfMap(obj.losersBestOf) ||
          B.BEST_OF_OPTIONS.indexOf(obj.grandFinalBestOf) === -1 ||
          !validGrandFinal(obj.grandFinal) || !validGrandFinal(obj.grandFinalReset)) {
        return { ok: false, error: 'That share link has bad finals data.' };
      }
      state.results = { winners: obj.results.winners || {}, losers: obj.results.losers || {} };
      state.losersBestOf = obj.losersBestOf;
      state.grandFinalBestOf = obj.grandFinalBestOf;
      state.grandFinal = obj.grandFinal || null;
      state.grandFinalReset = obj.grandFinalReset || null;
      syncLosers(state); /* drop anything the payload's results can't support */
    } else {
      state.results = obj.results;
    }
    return { ok: true, state: state };
  }

  return {
    HISTORY_CAP: HISTORY_CAP,
    losersRoundCount: losersRoundCount,
    createTournamentDouble: createTournamentDouble,
    winnersView: winnersView,
    winnersRounds: winnersRounds,
    winnersDropIns: winnersDropIns,
    mergeEntrants: mergeEntrants,
    losersRounds: losersRounds,
    losersRoundName: losersRoundName,
    grandFinalSlots: grandFinalSlots,
    grandFinalInfo: grandFinalInfo,
    champion: champion,
    matchProgress: matchProgress,
    recordWinnersWin: recordWinnersWin,
    removeWinnersWin: removeWinnersWin,
    clearWinnersMatch: clearWinnersMatch,
    recordLosersWin: recordLosersWin,
    removeLosersWin: removeLosersWin,
    clearLosersMatch: clearLosersMatch,
    recordGrandWin: recordGrandWin,
    clearGrandFinal: clearGrandFinal,
    syncLosers: syncLosers,
    reseedPlayers: reseedPlayers,
    logHistory: logHistory,
    gameForKey: gameForKey,
    voteCandidates: voteCandidates,
    setGameVote: setGameVote,
    removeGameVote: removeGameVote,
    computeGameVote: computeGameVote,
    encodeShare: encodeShare,
    decodeShare: decodeShare
  };
}));
