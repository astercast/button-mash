/* Button Mash — Play Journal core (T-MASH-2, wave 40): a personal
 * play journal & backlog over the real catalog.
 *
 * UMD module, DOM-free: the same code runs in the browser and under
 * node (scripts/test_journal40.js exercises it with the real catalog).
 *
 * State model (localStorage key "bm.journal.v1", in-memory fallback
 * when localStorage is unavailable — the Trophy Room's pattern):
 *   { v: 1,
 *     entries: { gameId: { status: "want"|"playing"|"finished"|null,
 *                          logs: [{ date: "YYYY-MM-DD", text }] } } }
 *
 * HONESTY: the journal stores only what the visitor typed — a shelf
 * status they chose and log entries they wrote, dated with the date
 * they picked. Nothing is inferred, imported, or invented: a game
 * with no entry has no status and no logs, and the core never creates
 * an entry on read. Unknown game ids are the caller's problem — the
 * UI validates against the catalog; the core validates shape only
 * (status vocabulary, real calendar dates, non-empty log text).
 * Multiple logs per game are the point: a playthrough is a list,
 * appended in the order written, never merged or deduped.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BM = root.BM || {};
    root.BM.Journal = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA_VERSION = 1;
  var STORE_KEY = 'bm.journal.v1';
  var PROBE_KEY = 'bm.journal.probe';
  var STATUSES = ['want', 'playing', 'finished'];
  var STATUS_LABELS = { want: 'Want to play', playing: 'Playing', finished: 'Finished' };
  var MAX_LOG_TEXT = 500;

  /* ---------------- storage (trophy-core pattern) ---------------- */

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
  var memStore = {};
  var memBackend = {
    get: function (k) { return Object.prototype.hasOwnProperty.call(memStore, k) ? memStore[k] : null; },
    set: function (k, v) { memStore[k] = v; },
    del: function (k) { delete memStore[k]; }
  };
  function backend() {
    if (lsAvailable()) return {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
    };
    return memBackend;
  }

  /* ---------------- validation ---------------- */

  function isStatus(s) { return STATUSES.indexOf(s) !== -1; }
  function isDateStr(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = s.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  }
  function cleanText(t) {
    if (typeof t !== 'string') return null;
    var c = t.trim();
    return c && c.length <= MAX_LOG_TEXT ? c : null;
  }

  function blankState() { return { v: SCHEMA_VERSION, entries: {} }; }

  function sanitize(raw) {
    var st = blankState();
    if (!raw || typeof raw !== 'object') return st;
    var entries = raw.entries;
    if (!entries || typeof entries !== 'object') return st;
    Object.keys(entries).forEach(function (id) {
      var e = entries[id];
      if (!e || typeof e !== 'object') return;
      var status = isStatus(e.status) ? e.status : null;
      var logs = [];
      if (Array.isArray(e.logs)) e.logs.forEach(function (l) {
        if (l && isDateStr(l.date) && cleanText(l.text) !== null) logs.push({ date: l.date, text: l.text });
      });
      if (status !== null || logs.length) st.entries[id] = { status: status, logs: logs };
    });
    return st;
  }

  /* ---------------- store ---------------- */

  function createStore() {
    var be = backend();
    var state;
    try { state = sanitize(JSON.parse(be.get(STORE_KEY) || 'null')); }
    catch (e) { state = blankState(); }
    function save() { be.set(STORE_KEY, JSON.stringify(state)); }
    function entry(id, create) {
      if (typeof id !== 'string' || !id) return null;
      if (!state.entries[id] && create) state.entries[id] = { status: null, logs: [] };
      return state.entries[id] || null;
    }
    function prune(id) {
      var e = state.entries[id];
      if (e && e.status === null && !e.logs.length) delete state.entries[id];
    }
    return {
      /* reads never create entries */
      getStatus: function (id) { var e = entry(id, false); return e ? e.status : null; },
      getLogs: function (id) { var e = entry(id, false); return e ? e.logs.slice() : []; },
      getEntry: function (id) {
        var e = entry(id, false);
        return e ? { status: e.status, logs: e.logs.slice() } : { status: null, logs: [] };
      },
      ids: function () { return Object.keys(state.entries); },
      counts: function () {
        var c = { want: 0, playing: 0, finished: 0, logged: 0, logs: 0 };
        Object.keys(state.entries).forEach(function (id) {
          var e = state.entries[id];
          if (e.status) c[e.status]++;
          if (e.logs.length) { c.logged++; c.logs += e.logs.length; }
        });
        return c;
      },
      byStatus: function (status) {
        if (!isStatus(status)) return [];
        return Object.keys(state.entries).filter(function (id) { return state.entries[id].status === status; });
      },
      /* writes validate; an invalid write changes nothing */
      setStatus: function (id, status) {
        if (typeof id !== 'string' || !id) return false;
        if (status !== null && !isStatus(status)) return false;
        var e = entry(id, true);
        e.status = status;
        prune(id); save();
        return true;
      },
      addLog: function (id, date, text) {
        var clean = cleanText(text);
        if (typeof id !== 'string' || !id || !isDateStr(date) || clean === null) return null;
        var e = entry(id, true);
        var log = { date: date, text: clean };
        e.logs.push(log);
        save();
        return log;
      },
      removeLog: function (id, index) {
        var e = entry(id, false);
        if (!e || typeof index !== 'number' || index < 0 || index >= e.logs.length) return false;
        e.logs.splice(index, 1);
        prune(id); save();
        return true;
      },
      state: function () { return JSON.parse(JSON.stringify(state)); }
    };
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORE_KEY: STORE_KEY,
    STATUSES: STATUSES,
    STATUS_LABELS: STATUS_LABELS,
    MAX_LOG_TEXT: MAX_LOG_TEXT,
    isStatus: isStatus,
    isDateStr: isDateStr,
    sanitize: sanitize,
    createStore: createStore
  };
}));
