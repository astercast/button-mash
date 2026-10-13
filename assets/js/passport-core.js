/* Button Mash — Arcade Passport core: collection-stamp state.
 *
 * UMD module, DOM-free: the same code runs in the browser and under
 * node (scripts/test_passport31.js exercises it with fixtures).
 *
 * State model (localStorage key "bm.passport.v1", in-memory fallback
 * when localStorage is unavailable):
 *   { v: 1, stamps: { collectionId: timestampMs, ... } }
 *
 * HONESTY RULES, load-bearing:
 * - A stamp exists only because the Collections page actually showed
 *   that shelf to this visitor: the UI layer (collections.js)
 *   observes a shelf card entering the viewport and calls stamp().
 *   Nothing here invents visits, plays, or dates.
 * - Guide marks are NOT stored in this state. They are derived at
 *   render time from the site's existing checklist store
 *   (bm_checks_v1, read through BM.getChecks) over the checklist
 *   registry below, so the passport can never disagree with the
 *   guides themselves. A mark is earned when every step of a
 *   guide's checklist is ticked — the only guide completion the
 *   site tracks anywhere.
 * - The registry's step counts are pinned against the real guide
 *   pages by test_passport31; if a guide's checklist changes, the
 *   registry must change with it or the suite fails.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BM = root.BM || {};
    root.BM.Passport = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA_VERSION = 1;
  var STORE_KEY = 'bm.passport.v1';
  var PROBE_KEY = 'bm.passport.probe';

  /* Guides that carry an interactive checklist (ul.checklist[data-page])
     — the only guides whose completion the site can observe. */
  var GUIDE_CHECKLISTS = [
    { page: 'retroarch-setup', steps: 5, title: 'RetroArch setup',
      url: 'guides/retroarch-setup.html' },
    { page: 'emulatorjs-setup', steps: 5, title: 'EmulatorJS self-hosting',
      url: 'guides/emulatorjs-self-hosting.html' },
  ];

  /* ---------------- storage ---------------- */

  var lsOK = null;
  function lsAvailable() {
    if (lsOK !== null) return lsOK;
    try {
      localStorage.setItem(PROBE_KEY, '1');
      localStorage.removeItem(PROBE_KEY);
      lsOK = true;
    } catch (e) { lsOK = false; }
    return lsOK;
  }
  // In-memory fallback: same shape, dies with the tab, and the UI
  // says so on the page (the lineups/trophy honesty pattern).
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

  /* ---------------- state ---------------- */

  function emptyState() { return { v: SCHEMA_VERSION, stamps: {} }; }

  /* Field-by-field validation: one corrupt stamp entry is dropped,
     the rest of the passport survives; unparseable storage reads
     as a blank passport, never a crash (the lineups rule). */
  function validateState(raw) {
    var state = emptyState();
    if (!raw || typeof raw !== 'object') return state;
    var stamps = raw.stamps;
    if (stamps && typeof stamps === 'object') {
      Object.keys(stamps).forEach(function (id) {
        var ts = stamps[id];
        if (typeof id === 'string' && id && typeof ts === 'number' && isFinite(ts) && ts > 0) {
          state.stamps[id] = ts;
        }
      });
    }
    return state;
  }

  function loadState(storage) {
    var store = storage || defaultStorage();
    try {
      var raw = store.getItem(STORE_KEY);
      return validateState(raw ? JSON.parse(raw) : null);
    } catch (e) { return emptyState(); }
  }
  function saveState(state, storage) {
    var store = storage || defaultStorage();
    try { store.setItem(STORE_KEY, JSON.stringify(validateState(state))); } catch (e) {}
  }

  /* ---------------- stamps ---------------- */

  function stamp(state, collectionId, now) {
    if (typeof collectionId !== 'string' || !collectionId) return false;
    if (state.stamps[collectionId]) return false; // first visit wins; never re-dated
    state.stamps[collectionId] = typeof now === 'number' && now > 0 ? now : Date.now();
    return true;
  }
  function hasStamp(state, collectionId) {
    return Object.prototype.hasOwnProperty.call(state.stamps, collectionId);
  }
  function stampIds(state) { return Object.keys(state.stamps).sort(); }
  function stampCount(state) { return Object.keys(state.stamps).length; }
  function firstStampAt(state) {
    var ts = Object.keys(state.stamps).map(function (id) { return state.stamps[id]; });
    return ts.length ? Math.min.apply(null, ts) : null;
  }
  function clearStamps(state) { state.stamps = {}; }

  /* ---------------- guide marks (derived, never stored) ---------------- */

  /* getChecks(page) -> array of ticked step indexes, the BM store's
     own reader. A mark is complete only when every registered step
     is ticked; partial progress is reported, not rounded up. */
  function guideMarks(getChecks) {
    return GUIDE_CHECKLISTS.map(function (g) {
      var done = [];
      try { done = getChecks(g.page) || []; } catch (e) { done = []; }
      var ticked = done.filter(function (i) {
        return typeof i === 'number' && i >= 0 && i < g.steps;
      }).length;
      return {
        page: g.page, title: g.title, url: g.url, steps: g.steps,
        ticked: ticked, complete: ticked >= g.steps,
      };
    });
  }

  /* ---------------- summary ---------------- */

  function progress(state, collections, marks) {
    var total = (collections || []).length;
    var stamped = (collections || []).filter(function (c) { return hasStamp(state, c.id); }).length;
    var marksDone = (marks || []).filter(function (m) { return m.complete; }).length;
    return {
      stamps: stamped, stampsTotal: total,
      marks: marksDone, marksTotal: (marks || []).length,
      startedAt: firstStampAt(state),
    };
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORE_KEY: STORE_KEY,
    GUIDE_CHECKLISTS: GUIDE_CHECKLISTS,
    emptyState: emptyState,
    validateState: validateState,
    loadState: loadState,
    saveState: saveState,
    usingFallback: usingFallback,
    stamp: stamp,
    hasStamp: hasStamp,
    stampIds: stampIds,
    stampCount: stampCount,
    firstStampAt: firstStampAt,
    clearStamps: clearStamps,
    guideMarks: guideMarks,
    progress: progress,
  };
}));
