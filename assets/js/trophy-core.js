/* Button Mash: Trophy Room core: persistent play-tracking state.
 *
 * UMD module, DOM-free: the same code runs in the browser and under node
 * (scripts/test_trophy18.js exercises it with fixtures).
 *
 * State model (localStorage key "bm.trophy.v1", in-memory fallback when
 * localStorage is unavailable):
 *   { v: 1,
 *     played:  { gameId: timestampMs... },
 *     beaten:  { gameId: timestampMs... },   // beaten implies played
 *     days:    { dayKey: markCount... },     // dayKey = floor(Date.now()/86400000) UTC
 *     achievements: { achId: timestampMs... } }
 *
 * Favorites are NOT duplicated here: they stay in wave-16's "bm_favs_v1"
 * (BM.getFavs / BM.setFavs) and are read through an injected provider, so
 * the directory's ♥ filter and the Trophy Room can never disagree.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BM = root.BM || {};
    root.BM.Trophy = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA_VERSION = 1;
  var EXPORT_SCHEMA = 'bm.trophy.export';
  var STORE_KEY = 'bm.trophy.v1';
  var PROBE_KEY = 'bm.trophy.probe';
  var MS_PER_DAY = 86400000;

  /* ---------------- storage ---------------- */

  // null = untested; localStorage throws in private mode / when disabled.
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

  // In-memory fallback store (one shared map so every store on the page
  // sees the same fallback data, like localStorage would).
  var memStore = {};
  var memBackend = {
    get: function (k) { return Object.prototype.hasOwnProperty.call(memStore, k) ? memStore[k] : null; },
    set: function (k, v) { memStore[k] = v; },
    del: function (k) { delete memStore[k]; }
  };
  function lsBackend() {
    return {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* quota/private: stay silent, memory copy already holds it */ } },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
    };
  }

  /* ---------------- helpers ---------------- */

  function dayKey(ts) { return String(Math.floor(ts / MS_PER_DAY)); }
  function nowMs() { return Date.now(); }
  function isFiniteNum(x) { return typeof x === 'number' && isFinite(x); }

  function blankState() {
    return { v: SCHEMA_VERSION, played: {}, beaten: {}, days: {}, achievements: {} };
  }

  /* ---------------- achievements ----------------
     Every rule is a pure function of (ctx). ctx:
       played: Set<id>, beaten: Set<id>, favs: [id],
       genrePlayed: {genre: n}, beatenByGenre: {genre: n},
       genreCount: number of genres in the catalog,
       days: {dayKey: count}, collections: [{id, game_ids[]}]            */
  var ACHIEVEMENTS = [
    { id: 'first-play',    name: 'First Token',   desc: 'Mark your first game played. The cabinet remembers.', check: function (c) { return c.played.size >= 1; } },
    { id: 'first-beat',    name: 'High Score',    desc: 'Beat your first game.', check: function (c) { return c.beaten.size >= 1; } },
    { id: 'heart-5',       name: 'Regular',       desc: 'Favorite 5 games.', check: function (c) { return c.favs.length >= 5; } },
    { id: 'heart-20',      name: 'Collector',     desc: 'Favorite 20 games.', check: function (c) { return c.favs.length >= 20; } },
    { id: 'player-10',     name: 'Warming Up',    desc: 'Play 10 different games.', check: function (c) { return c.played.size >= 10; } },
    { id: 'player-50',     name: 'Arcade Rat',    desc: 'Play 50 different games.', check: function (c) { return c.played.size >= 50; } },
    { id: 'player-100',    name: 'Centurion',     desc: 'Play 100 different games.', check: function (c) { return c.played.size >= 100; } },
    { id: 'beater-5',      name: 'Closer',        desc: 'Beat 5 games.', check: function (c) { return c.beaten.size >= 5; } },
    { id: 'beater-25',     name: 'Champion',      desc: 'Beat 25 games.', check: function (c) { return c.beaten.size >= 25; } },
    { id: 'puzzle-breaker', name: 'Puzzle Breaker', desc: 'Beat 5 puzzle games.', check: function (c) { return (c.beatenByGenre.puzzle || 0) >= 5; } },
    { id: 'genre-tourist', name: 'Genre Tourist', desc: 'Play games in 5 different genres.', check: function (c) { return Object.keys(c.genrePlayed).length >= 5; } },
    { id: 'genre-master',  name: 'Genre Master',  desc: 'Play games in every genre on the site.', check: function (c) { return Object.keys(c.genrePlayed).length >= c.genreCount && c.genreCount > 0; } },
    { id: 'streak-3',     name: 'Three-Day Grind', desc: 'Play on 3 days in a row.', check: function (c) { return c.bestStreak >= 3; } },
    { id: 'streak-7',     name: 'Week Warrior',  desc: 'Play on 7 days in a row.', check: function (c) { return c.bestStreak >= 7; } },
    { id: 'shelf-clearer', name: 'Shelf Clearer', desc: 'Beat every game in any one collection.', check: function (c) {
        return c.collections.some(function (col) {
          return col.game_ids.length > 0 &&
            col.game_ids.every(function (id) { return c.beaten.has(id); });
        });
      } },
    { id: 'marathon',      name: 'Marathon',      desc: 'Mark 5 games played in a single day.', check: function (c) {
        return Object.keys(c.days).some(function (k) { return c.days[k] >= 5; });
      } }
  ];
  var ACH_IDS = {};
  ACHIEVEMENTS.forEach(function (a) { ACH_IDS[a.id] = true; });

  /* ---------------- streak math ---------------- */

  function streaks(days) {
    // days: {dayKey: count}. Returns {current, best} in whole days.
    var keys = Object.keys(days).map(Number).filter(function (k) { return isFinite(k); }).sort(function (a, b) { return a - b; });
    if (!keys.length) return { current: 0, best: 0 };
    var best = 1, run = 1;
    for (var i = 1; i < keys.length; i++) {
      if (keys[i] === keys[i - 1] + 1) { run++; }
      else if (keys[i] !== keys[i - 1]) { run = 1; }
      if (run > best) best = run;
    }
    var today = Math.floor(nowMs() / MS_PER_DAY);
    var last = keys[keys.length - 1];
    var current = 0;
    if (last === today || last === today - 1) {
      // Walk back from the most recent active day.
      current = 1;
      for (var j = keys.length - 1; j > 0; j--) {
        if (keys[j] === keys[j - 1] + 1) current++;
        else break;
      }
      if (last === today - 1) {
        // Streak is alive but today has no activity yet: still counts.
      }
    }
    return { current: current, best: best };
  }

  /* ---------------- store ---------------- */

  function createStore(opts) {
    opts = opts || {};
    var backend = opts.backend || (lsAvailable() ? lsBackend() : memBackend);
    var gameIds = null;      // Set of catalog ids (for sanitizing)
    var genreOf = {};        // id -> genre
    var genreCount = 0;
    var collections = [];
    var getFavs = opts.getFavs || function () { return []; };
    var setFavs = opts.setFavs || function () {};
    var listeners = [];
    var loadInfo = { corrupt: false, futureVersion: false };

    function setCatalog(games, cols) {
      gameIds = {};
      genreOf = {};
      var genres = {};
      (games || []).forEach(function (g) {
        if (!g || !g.id) return;
        gameIds[g.id] = true;
        genreOf[g.id] = g.genre || 'unknown';
        genres[g.genre || 'unknown'] = true;
      });
      genreCount = Object.keys(genres).length;
      collections = (cols || []).filter(function (c) { return c && c.id && Array.isArray(c.game_ids); });
      // Re-sanitize the loaded state against the fresh catalog.
      state = sanitize(loadRaw());
      save();
    }

    function loadRaw() {
      var raw = backend.get(STORE_KEY);
      if (!raw) return blankState();
      var parsed;
      try { parsed = JSON.parse(raw); }
      catch (e) { loadInfo.corrupt = true; return blankState(); }
      if (!parsed || typeof parsed !== 'object') { loadInfo.corrupt = true; return blankState(); }
      if (parsed.v !== SCHEMA_VERSION) {
        if (typeof parsed.v === 'number' && parsed.v > SCHEMA_VERSION) {
          loadInfo.futureVersion = true;
          return blankState(); // refuse to adopt newer-version data
        }
        // Older or missing version: best-effort migrate through sanitize.
      }
      return sanitize(parsed);
    }

    function sanitize(s) {
      var out = blankState();
      function cleanMap(src) {
        var m = {};
        if (src && typeof src === 'object' && !Array.isArray(src)) {
          Object.keys(src).forEach(function (id) {
            if ((!gameIds || gameIds[id]) && isFiniteNum(src[id])) m[id] = src[id];
          });
        }
        return m;
      }
      out.played = cleanMap(s.played);
      out.beaten = cleanMap(s.beaten);
      // beaten implies played: repair any beaten-without-played rows.
      Object.keys(out.beaten).forEach(function (id) {
        if (!out.played[id]) out.played[id] = out.beaten[id];
      });
      if (s.days && typeof s.days === 'object' && !Array.isArray(s.days)) {
        Object.keys(s.days).forEach(function (k) {
          if (/^\d+$/.test(k) && isFiniteNum(s.days[k]) && s.days[k] >= 0) {
            out.days[k] = Math.floor(s.days[k]);
          }
        });
      }
      if (s.achievements && typeof s.achievements === 'object' && !Array.isArray(s.achievements)) {
        Object.keys(s.achievements).forEach(function (id) {
          if (ACH_IDS[id] && isFiniteNum(s.achievements[id])) out.achievements[id] = s.achievements[id];
        });
      }
      return out;
    }

    var state = loadRaw();

    function save() {
      try { backend.set(STORE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function emit() {
      listeners.forEach(function (cb) { try { cb(); } catch (e) {} });
    }

    function touchDay(ts) {
      var k = dayKey(ts == null ? nowMs() : ts);
      state.days[k] = (state.days[k] || 0) + 1;
    }

    function buildCtx() {
      var played = {}, beaten = {};
      Object.keys(state.played).forEach(function (id) { played[id] = true; });
      Object.keys(state.beaten).forEach(function (id) { beaten[id] = true; });
      var genrePlayed = {}, beatenByGenre = {};
      Object.keys(played).forEach(function (id) {
        var g = genreOf[id] || 'unknown';
        genrePlayed[g] = (genrePlayed[g] || 0) + 1;
      });
      Object.keys(beaten).forEach(function (id) {
        var g = genreOf[id] || 'unknown';
        beatenByGenre[g] = (beatenByGenre[g] || 0) + 1;
      });
      var favs = [];
      try { favs = getFavs() || []; } catch (e) { favs = []; }
      if (gameIds) favs = favs.filter(function (id) { return gameIds[id]; });
      var st = streaks(state.days);
      return {
        played: newSet(Object.keys(played)),
        beaten: newSet(Object.keys(beaten)),
        favs: favs,
        genrePlayed: genrePlayed,
        beatenByGenre: beatenByGenre,
        genreCount: genreCount,
        days: state.days,
        collections: collections,
        bestStreak: st.best,
        currentStreak: st.current
      };
    }

    function newSet(arr) {
      // ES5-safe Set substitute with .has/.size used by achievement checks.
      var map = {};
      arr.forEach(function (x) { map[x] = true; });
      return {
        has: function (x) { return !!map[x]; },
        get size() { return arr.length; }
      };
    }

    function evaluate() {
      var ctx = buildCtx();
      var newly = [];
      var ts = nowMs();
      ACHIEVEMENTS.forEach(function (a) {
        if (!state.achievements[a.id]) {
          var ok = false;
          try { ok = !!a.check(ctx); } catch (e) { ok = false; }
          if (ok) { state.achievements[a.id] = ts; newly.push(a.id); }
        }
      });
      if (newly.length) save();
      return newly;
    }

    function validId(id) {
      return typeof id === 'string' && id.length > 0 && (!gameIds || gameIds[id]);
    }

    function mutate(id, fn) {
      if (!validId(id)) return { changed: false, newlyEarned: [], error: 'unknown-game' };
      var before = JSON.stringify([state.played[id], state.beaten[id]]);
      var ts = nowMs();
      fn(ts);
      var after = JSON.stringify([state.played[id], state.beaten[id]]);
      var changed = before !== after;
      var newlyEarned = [];
      if (changed) {
        touchDay(ts);
        save();
        newlyEarned = evaluate();
        emit();
      }
      return { changed: changed, newlyEarned: newlyEarned };
    }

    var store = {
      /* catalog + fav wiring */
      setCatalog: setCatalog,
      setFavProviders: function (get, set) { if (get) getFavs = get; if (set) setFavs = set; },
      storageMode: function () { return lsAvailable() ? 'local' : 'memory'; },
      loadInfo: function () { return { corrupt: loadInfo.corrupt, futureVersion: loadInfo.futureVersion }; },
      onChange: function (cb) { listeners.push(cb); },

      /* per-game state */
      markPlayed: function (id) {
        return mutate(id, function (ts) { if (!state.played[id]) state.played[id] = ts; });
      },
      unmarkPlayed: function (id) {
        // Un-playing a game also clears its beaten flag: you cannot have
        // beaten a game you have not played.
        return mutate(id, function () { delete state.played[id]; delete state.beaten[id]; });
      },
      markBeaten: function (id) {
        // Beating implies playing: both flags are set together.
        return mutate(id, function (ts) {
          if (!state.played[id]) state.played[id] = ts;
          if (!state.beaten[id]) state.beaten[id] = ts;
        });
      },
      unmarkBeaten: function (id) {
        return mutate(id, function () { delete state.beaten[id]; });
      },
      togglePlayed: function (id) {
        return this.status(id).played ? this.unmarkPlayed(id) : this.markPlayed(id);
      },
      toggleBeaten: function (id) {
        return this.status(id).beaten ? this.unmarkBeaten(id) : this.markBeaten(id);
      },
      status: function (id) {
        return { played: !!state.played[id], beaten: !!state.beaten[id] };
      },

      /* aggregates */
      counts: function () {
        var favs = [];
        try { favs = getFavs() || []; } catch (e) {}
        if (gameIds) favs = favs.filter(function (id) { return gameIds[id]; });
        return {
          played: Object.keys(state.played).length,
          beaten: Object.keys(state.beaten).length,
          favorites: favs.length
        };
      },
      streak: function () { return streaks(state.days); },
      genreStats: function (games) {
        var totals = {};
        (games || []).forEach(function (g) {
          if (!g || !g.genre) return;
          totals[g.genre] = (totals[g.genre] || 0) + 1;
        });
        var playedBy = {}, beatenBy = {};
        Object.keys(state.played).forEach(function (id) {
          var g = genreOf[id]; if (!g) return;
          playedBy[g] = (playedBy[g] || 0) + 1;
        });
        Object.keys(state.beaten).forEach(function (id) {
          var g = genreOf[id]; if (!g) return;
          beatenBy[g] = (beatenBy[g] || 0) + 1;
        });
        return Object.keys(totals).sort().map(function (genre) {
          var total = totals[genre];
          var played = playedBy[genre] || 0, beaten = beatenBy[genre] || 0;
          return {
            genre: genre, total: total, played: played, beaten: beaten,
            playedPct: total ? Math.round(played / total * 100) : 0,
            beatenPct: total ? Math.round(beaten / total * 100) : 0
          };
        });
      },
      collectionProgress: function (col) {
        var ids = (col && col.game_ids) || [];
        var total = ids.length, played = 0, beaten = 0;
        ids.forEach(function (id) {
          if (state.played[id]) played++;
          if (state.beaten[id]) beaten++;
        });
        return {
          total: total, played: played, beaten: beaten,
          playedPct: total ? Math.round(played / total * 100) : 0,
          beatenPct: total ? Math.round(beaten / total * 100) : 0
        };
      },
      achievements: function () {
        var self = this;
        return ACHIEVEMENTS.map(function (a) {
          return {
            id: a.id, name: a.name, desc: a.desc,
            earned: !!state.achievements[a.id],
            earnedAt: state.achievements[a.id] || null
          };
        });
      },
      achievementById: function (id) {
        for (var i = 0; i < ACHIEVEMENTS.length; i++) {
          if (ACHIEVEMENTS[i].id === id) return ACHIEVEMENTS[i];
        }
        return null;
      },
      evaluate: evaluate,

      /* export / import */
      exportJSON: function () {
        var favs = [];
        try { favs = getFavs() || []; } catch (e) {}
        if (gameIds) favs = favs.filter(function (id) { return gameIds[id]; });
        return JSON.stringify({
          schema: EXPORT_SCHEMA,
          schemaVersion: SCHEMA_VERSION,
          exportedAt: new Date(nowMs()).toISOString(),
          app: 'button-mash',
          data: {
            played: state.played,
            beaten: state.beaten,
            favorites: favs,
            days: state.days,
            achievements: state.achievements
          }
        }, null, 2);
      },
      importJSON: function (text) {
        // Atomic: validate everything first; only then replace state.
        // Any failure leaves the current state untouched.
        var doc;
        try { doc = JSON.parse(text); }
        catch (e) { return { ok: false, error: 'not-json', message: 'That is not valid JSON. Your current trophies are untouched.' }; }
        if (!doc || typeof doc !== 'object' || doc.schema !== EXPORT_SCHEMA || !doc.data || typeof doc.data !== 'object') {
          return { ok: false, error: 'bad-schema', message: 'Not a Button Mash trophy export (schema mismatch). Your current trophies are untouched.' };
        }
        if (typeof doc.schemaVersion !== 'number' || doc.schemaVersion > SCHEMA_VERSION) {
          return { ok: false, error: 'future-version', message: 'This export was made by a newer version of the site. Your current trophies are untouched.' };
        }
        if (doc.schemaVersion < 1) {
          return { ok: false, error: 'bad-schema', message: 'Unsupported export version. Your current trophies are untouched.' };
        }
        var dropped = { played: 0, beaten: 0, favorites: 0, days: 0, achievements: 0 };
        function cleanMap(src, dropKey) {
          var m = {};
          if (src && typeof src === 'object' && !Array.isArray(src)) {
            Object.keys(src).forEach(function (id) {
              if ((!gameIds || gameIds[id]) && isFiniteNum(src[id])) m[id] = src[id];
              else dropped[dropKey]++;
            });
          } else if (src !== undefined) {
            dropped[dropKey]++;
          }
          return m;
        }
        var played = cleanMap(doc.data.played, 'played');
        var beaten = cleanMap(doc.data.beaten, 'beaten');
        Object.keys(beaten).forEach(function (id) { if (!played[id]) played[id] = beaten[id]; });
        var favs = [];
        if (Array.isArray(doc.data.favorites)) {
          var seen = {};
          doc.data.favorites.forEach(function (id) {
            if (typeof id === 'string' && (!gameIds || gameIds[id]) && !seen[id]) { seen[id] = true; favs.push(id); }
            else dropped.favorites++;
          });
        } else if (doc.data.favorites !== undefined) { dropped.favorites++; }
        var days = {};
        if (doc.data.days && typeof doc.data.days === 'object' && !Array.isArray(doc.data.days)) {
          Object.keys(doc.data.days).forEach(function (k) {
            if (/^\d+$/.test(k) && isFiniteNum(doc.data.days[k]) && doc.data.days[k] >= 0) days[k] = Math.floor(doc.data.days[k]);
            else dropped.days++;
          });
        } else if (doc.data.days !== undefined) { dropped.days++; }
        var ach = {};
        if (doc.data.achievements && typeof doc.data.achievements === 'object' && !Array.isArray(doc.data.achievements)) {
          Object.keys(doc.data.achievements).forEach(function (id) {
            if (ACH_IDS[id] && isFiniteNum(doc.data.achievements[id])) ach[id] = doc.data.achievements[id];
            else dropped.achievements++;
          });
        } else if (doc.data.achievements !== undefined) { dropped.achievements++; }

        // Commit.
        state = { v: SCHEMA_VERSION, played: played, beaten: beaten, days: days, achievements: ach };
        save();
        try { setFavs(favs); } catch (e) {}
        // Backfill: grant any achievements the imported data already satisfies
        // (e.g. imports from older versions with fewer prizes).
        evaluate();
        emit();
        return {
          ok: true, dropped: dropped,
          imported: {
            played: Object.keys(state.played).length,
            beaten: Object.keys(state.beaten).length,
            favorites: favs.length,
            achievements: Object.keys(state.achievements).length
          }
        };
      },

      reset: function () {
        state = blankState();
        save();
        emit();
      },

      /* test seam */
      _state: function () { return state; }
    };

    return store;
  }

  /* ---------------- default singleton (browser glue) ---------------- */

  var defaultStore = null;
  function initDefault(catalogGames, catalogCollections, favProviders) {
    if (!defaultStore) {
      defaultStore = createStore({
        getFavs: favProviders && favProviders.getFavs,
        setFavs: favProviders && favProviders.setFavs
      });
    }
    defaultStore.setCatalog(catalogGames, catalogCollections);
    if (favProviders) defaultStore.setFavProviders(favProviders.getFavs, favProviders.setFavs);
    return defaultStore;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    EXPORT_SCHEMA: EXPORT_SCHEMA,
    STORE_KEY: STORE_KEY,
    ACHIEVEMENTS: ACHIEVEMENTS,
    createStore: createStore,
    initDefault: initDefault,
    getDefault: function () { return defaultStore; },
    dayKey: dayKey,
    streaks: streaks,
    storageMode: function () { return lsAvailable() ? 'local' : 'memory'; }
  };
}));
