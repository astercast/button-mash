/* Button Mash: Tournament Night core: a full bracket night whose
 * entrants are real catalog games (wave 32).
 *
 * UMD module, DOM-free: the same code runs in the browser and under
 * node (scripts/test_tournamentnight32.js exercises it with
 * fixtures). The bracket math is NOT reinvented here, every round,
 * bye, advancement and champion is computed by the cabinet's own
 * single-elimination engine, assets/js/bracket.js (window.Bracket
 * in the browser, require() under node). This module owns only the
 * night around it:
 *
 *   SOURCE   a saved Game Night lineup (bm.lineups.v1 record) or a
 *            hand-built collection (data/v1/collections.json). The
 *            entrants are that source's real games, in source order:
 *            first game = top seed. Names, descriptions and URLs are
 *            copied from the catalog at seed time, this module
 *            never invents a game, a stat, or a result.
 *   PICKS    one click per match: the picked game wins the match
 *            (best-of-1, the bracket engine's default). Picks are
 *            recorded through Bracket.recordWin, so a downstream
 *            match only exists when its feeders are decided, and
 *            clearing a pick cascades exactly like Tournament 2.0.
 *   STATE    localStorage key "bm.tournament-night.v1", in-memory
 *            fallback with an honest on-page notice when storage
 *            is blocked, the passport/lineups discipline. Records
 *            validate field by field on load: a corrupt night is
 *            dropped whole (a bracket is one record, not a shelf),
 *            never half-rendered.
 *   CARD     the finished (or in-progress) night as plain text:
 *            source, every round's results, the champion with its
 *            real catalog description and play URL.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./bracket.js'));
  } else {
    root.BM = root.BM || {};
    root.BM.TournamentNight = factory(root.Bracket);
  }
}(typeof self !== 'undefined' ? self : this, function (Bracket) {
  'use strict';

  var SCHEMA_VERSION = 1;
  var STORE_KEY = 'bm.tournament-night.v1';
  var PROBE_KEY = 'bm.tournament-night.probe';
  var MIN_ENTRANTS = 2;
  var MAX_ENTRANTS = 16; // the bracket engine's own cap
  var MAX_NAME = 80;

  /* ---------------- storage ---------------- */

  var lsOK = null;
  function lsAvailable() {
    if (lsOK !== null) return lsOK;
    try {
      if (typeof localStorage === 'undefined') throw new Error('no localStorage');
      localStorage.setItem(PROBE_KEY, '1');
      localStorage.removeItem(PROBE_KEY);
      lsOK = true;
    } catch (e) { lsOK = false; }
    return lsOK;
  }
  var memory = null;
  function defaultStorage() {
    if (lsAvailable()) return localStorage;
    if (!memory) {
      var m = {};
      memory = {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
        setItem: function (k, v) { m[k] = String(v); },
        removeItem: function (k) { delete m[k]; },
      };
    }
    return memory;
  }
  function usingFallback(storage) {
    return storage !== undefined ? false : !lsAvailable();
  }

  /* ---------------- entrants ----------------
     An entrant is a catalog game reduced to what a bracket night
     may say about it: id, title, url, genre, description. Anything
     else a renderer wants, it looks up in the catalog itself. */

  function entrantFromGame(g) {
    if (!g || typeof g.id !== 'string' || !g.id ||
        typeof g.title !== 'string' || !g.title ||
        typeof g.url !== 'string' || !/^https:\/\//.test(g.url)) return null;
    return {
      id: g.id, title: g.title, url: g.url,
      genre: typeof g.genre === 'string' ? g.genre : '',
      description: typeof g.description === 'string' ? g.description : '',
    };
  }

  /* A saved lineup's slots are snapshots; resolve each slot back
     to the live catalog by game_id so the night always plays the
     catalog's current record for that game. Slots whose game has
     left the catalog are skipped and reported, never invented. */
  function entrantsFromLineup(record, gamesById) {
    var out = [], skipped = [];
    if (!record || !Array.isArray(record.slots)) return { entrants: out, skipped: skipped };
    record.slots.forEach(function (s) {
      var g = gamesById && gamesById[s.game_id];
      var e = g ? entrantFromGame(g) : null;
      if (e) out.push(e); else skipped.push(s.game_id);
    });
    return { entrants: out, skipped: skipped };
  }

  function entrantsFromCollection(collection, gamesById) {
    var out = [], skipped = [];
    if (!collection || !Array.isArray(collection.game_ids)) return { entrants: out, skipped: skipped };
    collection.game_ids.forEach(function (id) {
      var g = gamesById && gamesById[id];
      var e = g ? entrantFromGame(g) : null;
      if (e) out.push(e); else skipped.push(id);
    });
    return { entrants: out, skipped: skipped };
  }

  /* ---------------- the night ---------------- */

  function cleanName(name, sourceName) {
    var n = String(name == null ? '' : name).replace(/\s+/g, ' ').trim();
    if (!n) n = (sourceName || 'Tournament') + ': Tournament Night';
    return n.slice(0, MAX_NAME);
  }

  /* Seed a night. source: {type:'collection'|'lineup', id, name}.
     Returns {ok:true, night} or {ok:false, error}, refusals are
     plain answers (too few / too many real games), never throws. */
  function createNight(opts) {
    opts = opts || {};
    var entrants = (opts.entrants || []).map(entrantFromGame).filter(Boolean);
    if (entrants.length < MIN_ENTRANTS) {
      return { ok: false, error: 'A tournament night needs at least ' + MIN_ENTRANTS +
        ' real games, that source only offers ' + entrants.length + '.' };
    }
    if (entrants.length > MAX_ENTRANTS) {
      return { ok: false, error: 'A bracket night caps at ' + MAX_ENTRANTS +
        ' games, that source offers ' + entrants.length + '.' };
    }
    var titles = entrants.map(function (e) { return e.title; });
    if (new Set(titles.map(function (t) { return t.toLowerCase(); })).size !== titles.length) {
      return { ok: false, error: 'Two entrants share a title, a bracket cannot tell them apart.' };
    }
    var bracket = Bracket.createTournament(titles);
    if (bracket.error) return { ok: false, error: bracket.error };
    var src = opts.source || {};
    var night = {
      v: SCHEMA_VERSION,
      name: cleanName(opts.name, src.name),
      source: {
        type: src.type === 'lineup' ? 'lineup' : 'collection',
        id: typeof src.id === 'string' ? src.id : '',
        name: typeof src.name === 'string' ? src.name : '',
      },
      entrants: entrants,
      bracket: bracket,
      created_at: typeof opts.now === 'number' && opts.now > 0 ? opts.now : Date.now(),
    };
    return { ok: true, night: night };
  }

  /* ---------------- validation ----------------
     A stored night is data a stranger's browser could hand us.
     The bracket half must agree with the entrant half exactly:
     same titles, same order, plausible shape. Anything less and
     the night is dropped whole, a half-valid bracket is worse
     than a blank marquee. */

  function validNight(n) {
    if (!n || typeof n !== 'object' || n.v !== SCHEMA_VERSION) return false;
    if (typeof n.name !== 'string' || !n.name || n.name.length > MAX_NAME) return false;
    if (!n.source || (n.source.type !== 'collection' && n.source.type !== 'lineup')) return false;
    if (!Array.isArray(n.entrants) || n.entrants.length < MIN_ENTRANTS || n.entrants.length > MAX_ENTRANTS) return false;
    if (!n.entrants.every(function (e) { return entrantFromGame(e) !== null; })) return false;
    var b = n.bracket;
    if (!b || !Array.isArray(b.players) || !Array.isArray(b.order) || typeof b.results !== 'object' || !b.results) return false;
    var titles = n.entrants.map(function (e) { return e.title; });
    if (JSON.stringify(b.players) !== JSON.stringify(titles)) return false;
    if (b.size !== Bracket.nextPow2(titles.length)) return false;
    if (typeof n.created_at !== 'number' || !(n.created_at > 0)) return false;
    return true;
  }

  function loadNight(storage) {
    var store = storage || defaultStorage();
    try {
      var raw = store.getItem(STORE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return validNight(parsed) ? parsed : null;
    } catch (e) { return null; }
  }
  function saveNight(night, storage) {
    if (!validNight(night)) return false;
    var store = storage || defaultStorage();
    try { store.setItem(STORE_KEY, JSON.stringify(night)); return true; } catch (e) { return false; }
  }
  function clearNight(storage) {
    var store = storage || defaultStorage();
    try { store.removeItem(STORE_KEY); } catch (e) {}
  }

  /* ---------------- play ---------------- */

  function rounds(night) { return Bracket.rounds(night.bracket); }

  /* Record a pick: side 'a'|'b' of a match. One pick decides the
     match (best-of-1) and advances the winner. Delegates to the
     bracket engine, so byes, undecided feeders and already-decided
     matches refuse with the engine's own plain reasons. */
  function pick(night, roundIdx, matchIdx, side) {
    return Bracket.recordWin(night.bracket, roundIdx, matchIdx, side);
  }
  function unpick(night, roundIdx, matchIdx) {
    return Bracket.clearMatch(night.bracket, roundIdx, matchIdx);
  }

  function entrantBySeed(night, seed) {
    return night.entrants[seed - 1] || null;
  }
  function champion(night) {
    var c = Bracket.champion(night.bracket);
    return c ? entrantBySeed(night, c.seed) : null;
  }
  function runnerUp(night) {
    var rs = rounds(night);
    var fin = rs[rs.length - 1].matches[0];
    if (!fin || !fin.winner || fin.byeAdvance) return null;
    var loser = fin.winner.seed === (fin.a && fin.a.seed) ? fin.b : fin.a;
    return loser && !loser.bye ? entrantBySeed(night, loser.seed) : null;
  }
  function progress(night) {
    var p = Bracket.matchComplete(night.bracket);
    return { total: p.total, decided: p.decided, complete: p.decided === p.total, champion: champion(night) };
  }

  /* ---------------- the results card ----------------
     Plain text, paste-anywhere. Every game named is a real entrant;
     every result line is a decided match from the bracket itself.
     An unfinished night says so and lists only what is decided. */

  function resultsCard(night) {
    var champ = champion(night);
    var lines = [
      'TOURNAMENT NIGHT: "' + night.name + '" (Button Mash)',
      (night.source.type === 'lineup' ? 'Saved lineup: ' : 'Collection: ') + night.source.name +
        ' · ' + night.entrants.length + ' games · single elimination · picks saved in this browser',
      '',
    ];
    rounds(night).forEach(function (round) {
      var played = round.matches.filter(function (m) { return m.decided && !m.byeAdvance; });
      var byes = round.matches.filter(function (m) { return m.byeAdvance; });
      if (!played.length && !byes.length) return;
      lines.push(round.name + ':');
      byes.forEach(function (m) {
        lines.push('  ' + m.winner.name + ', first-round bye (top seed)');
      });
      played.forEach(function (m) {
        var loser = m.winner.seed === m.a.seed ? m.b : m.a;
        lines.push('  ' + m.winner.name + ' def. ' + loser.name);
      });
      lines.push('');
    });
    if (champ) {
      var ru = runnerUp(night);
      lines.push('🏆 CHAMPION: ' + champ.title + (ru ? ' (def. ' + ru.title + ' in the final)' : ''));
      lines.push(champ.description);
      lines.push('On Button Mash: game.html?id=' + champ.id);
    } else {
      var p = progress(night);
      lines.push('No champion yet, ' + p.decided + ' of ' + p.total + ' matches decided. The night is still on.');
    }
    return lines.join('\n');
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORE_KEY: STORE_KEY,
    MIN_ENTRANTS: MIN_ENTRANTS,
    MAX_ENTRANTS: MAX_ENTRANTS,
    usingFallback: usingFallback,
    entrantFromGame: entrantFromGame,
    entrantsFromLineup: entrantsFromLineup,
    entrantsFromCollection: entrantsFromCollection,
    createNight: createNight,
    validNight: validNight,
    loadNight: loadNight,
    saveNight: saveNight,
    clearNight: clearNight,
    rounds: rounds,
    pick: pick,
    unpick: unpick,
    entrantBySeed: entrantBySeed,
    champion: champion,
    runnerUp: runnerUp,
    progress: progress,
    resultsCard: resultsCard,
  };
}));
