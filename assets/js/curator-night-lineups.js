/* Button Mash: Game Night saved lineups: the cabinet's coat-check (wave 23).
 *
 * UMD module, DOM-free: the same code runs in the browser and under node
 * (scripts/test_lineups23.js exercises it with a fake backend).
 *
 * Wave 22 calibrated the Curator's buckets and left every dealt night
 * ephemeral, close the tab, lose the night. This module is the shelf the
 * nights live on:
 *
 *   SAVE    a dealt night, under a name you pick, in this browser only
 *           (localStorage key "bm.lineups.v1", in-memory fallback with an
 *           honest notice when storage is blocked, same discipline as
 *           the Trophy Room's bm.trophy.v1). Nothing is sent anywhere;
 *           there is no account and no server copy.
 *   LOAD    the saved night back exactly as dealt, same picks, same
 *           order, same curator estimates. A saved night is a snapshot,
 *           not a re-score: later calibration waves never rewrite it.
 *   REMATCH the same setup (headcount, minutes, vibes, skill, kids)
 *           re-dealt with the saved picks held out of the deck, so every
 *           slot comes back fresh on the same role curve the inputs
 *           produce, warm-up, mains, intermission, peak, cool-down.
 *           The main-event count follows the timebox, exactly as on a
 *           fresh deal: longer fresh picks can fill the night in one
 *           fewer slot, and the rematch never overruns to force a fit.
 *   CARD    the night as plain text, ready to paste into a group chat.
 *
 * The shelf holds MAX_LINEUPS nights. Saving past the cap is refused
 * with a plain reason, the cabinet never silently throws a night away.
 * Records validate one by one on load: a corrupt entry is dropped, the
 * rest of the shelf survives untouched.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BMCuratorLineups = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA_VERSION = 1;
  var STORE_KEY = 'bm.lineups.v1';
  var PROBE_KEY = 'bm.lineups.probe';
  var EXPORT_SCHEMA = 'bm.lineup.v1';
  var MAX_LINEUPS = 12;
  var MAX_NAME = 60;

  /* ---------------- storage backends ----------------
     Same shape as trophy-core.js: real localStorage when it answers a
     probe write, one shared in-memory map when it doesn't (private mode,
     disabled storage, node tests without an injected backend). */

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
  function lsBackend() {
    return {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* memory copy already holds it */ } },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
    };
  }
  function defaultBackend() { return lsAvailable() ? lsBackend() : memBackend; }

  /* ---------------- validation ----------------
     A saved night is data a stranger's browser could hand us (edited
     storage, an old schema). Nothing unvalidated reaches the renderer. */

  function isStr(x, max) { return typeof x === 'string' && x.length > 0 && x.length <= (max || 200); }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }

  function validSlot(s) {
    return !!s && typeof s === 'object' &&
      isStr(s.game_id, 80) && isStr(s.title, 160) &&
      typeof s.url === 'string' && /^https:\/\//.test(s.url) &&
      isStr(s.genre, 40) && isStr(s.role, 24) && isStr(s.role_label, 40) &&
      isNum(s.session_est) && s.session_est > 0 && s.session_est <= 600 &&
      isStr(s.floor_label, 40) && isStr(s.energy_label, 24) &&
      isNum(s.capacity) && s.capacity >= 1 &&
      isNum(s.score) && s.score >= 0 && s.score <= 100 &&
      Array.isArray(s.why) && s.why.every(function (w) { return isStr(w, 300); });
  }

  function validInputs(i) {
    return !!i && typeof i === 'object' &&
      isNum(i.group_size) && i.group_size >= 1 && i.group_size <= 12 &&
      isNum(i.minutes) && i.minutes >= 15 && i.minutes <= 240 &&
      Array.isArray(i.vibes) && i.vibes.length >= 1 &&
      i.vibes.every(function (v) { return isStr(v, 24); }) &&
      isStr(i.skill, 24) && typeof i.kids === 'boolean';
  }

  function validRecord(r) {
    return !!r && typeof r === 'object' &&
      r.schema === EXPORT_SCHEMA && r.v === SCHEMA_VERSION &&
      isStr(r.id, 40) && isStr(r.name, MAX_NAME) &&
      isNum(r.saved_at) && r.saved_at > 0 &&
      validInputs(r.inputs) &&
      isNum(r.total_est_minutes) && r.total_est_minutes >= 0 &&
      Array.isArray(r.slots) && r.slots.length >= 1 && r.slots.length <= 10 &&
      r.slots.every(validSlot);
  }

  /* ---------------- record building ---------------- */

  var idCounter = 0;
  function makeId(now) {
    idCounter++;
    return 'ln-' + now.toString(36) + '-' + idCounter.toString(36) +
      Math.floor(Math.random() * 1679616).toString(36);
  }

  /* Snapshot a slot from a dealt lineup: only the fields the card and
     the renderer use, copied, later engine changes never reach in. */
  function snapshotSlot(s) {
    return {
      game_id: s.game_id, title: s.title, url: s.url, genre: s.genre,
      role: s.role, role_label: s.role_label,
      session_est: s.session_est, floor: s.floor, floor_label: s.floor_label,
      capacity: s.capacity, energy: s.energy, energy_label: s.energy_label,
      kid_safe: !!s.kid_safe, score: s.score,
      score_breakdown: s.score_breakdown || null,
      why: (s.why || []).slice()
    };
  }

  function cleanName(name, inputs, when) {
    var n = String(name == null ? '' : name).replace(/\s+/g, ' ').trim();
    if (!n) n = suggestName(inputs, when);
    return n.slice(0, MAX_NAME);
  }

  /* A name that says what the night is, for when the name field is left
     blank: "Fri 16 Oct: 4 players · party + chaotic". */
  function suggestName(inputs, when) {
    var d = when ? new Date(when) : new Date();
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var head = days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()];
    var who = inputs.group_size + (inputs.group_size === 1 ? ' player' : ' players');
    var vibes = (inputs.vibes || []).join(' + ');
    return head + ', ' + who + (vibes ? ' · ' + vibes : '') + (inputs.kids ? ' · kids table' : '');
  }

  /* ---------------- the store ---------------- */

  function createStore(backend) {
    var be = backend || defaultBackend();
    var persistent = be !== memBackend;

    function readAll() {
      var raw = null;
      try { raw = be.get(STORE_KEY); } catch (e) { raw = null; }
      if (!raw) return [];
      var parsed;
      try { parsed = JSON.parse(raw); } catch (e) { return []; }
      if (!parsed || parsed.v !== SCHEMA_VERSION || !Array.isArray(parsed.lineups)) return [];
      /* One bad record never wipes the shelf: keep the valid ones. */
      return parsed.lineups.filter(validRecord);
    }
    function writeAll(list) {
      try { be.set(STORE_KEY, JSON.stringify({ v: SCHEMA_VERSION, lineups: list })); } catch (e) {}
    }

    return {
      /* 'local' when nights survive a reload, 'memory' when they don't. */
      storageMode: function () { return persistent ? 'local' : 'memory'; },

      /* Newest first. */
      list: function () { return readAll(); },

      get: function (id) {
        var all = readAll();
        for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
        return null;
      },

      /* Save a dealNight() result under a name. Returns
         { ok:true, record } or { ok:false, error }, cap refusals and
         empty lineups are plain answers, never exceptions. */
      save: function (result, name) {
        if (!result || !Array.isArray(result.lineup) || result.lineup.length === 0) {
          return { ok: false, error: 'That night has no picks to save, deal one first.' };
        }
        if (!validInputs(result.inputs_echo)) {
          return { ok: false, error: 'That night is missing its setup (headcount, time, vibes), deal a fresh one.' };
        }
        var all = readAll();
        if (all.length >= MAX_LINEUPS) {
          return { ok: false, error: 'The shelf is full, ' + MAX_LINEUPS + ' saved nights is the cabinet limit. Retire one to make room.' };
        }
        var now = Date.now();
        var record = {
          schema: EXPORT_SCHEMA,
          v: SCHEMA_VERSION,
          id: makeId(now),
          name: cleanName(name, result.inputs_echo, now),
          saved_at: now,
          inputs: {
            group_size: result.inputs_echo.group_size,
            minutes: result.inputs_echo.minutes,
            vibes: result.inputs_echo.vibes.slice(),
            skill: result.inputs_echo.skill,
            kids: !!result.inputs_echo.kids
          },
          total_est_minutes: result.total_est_minutes || 0,
          scoring_version: result.scoring_version || null,
          slots: result.lineup.map(snapshotSlot)
        };
        if (!validRecord(record)) {
          return { ok: false, error: 'That night did not pass the shelf check, deal a fresh one and try again.' };
        }
        all.unshift(record);
        writeAll(all);
        return { ok: true, record: record };
      },

      remove: function (id) {
        var all = readAll();
        var next = all.filter(function (r) { return r.id !== id; });
        if (next.length === all.length) return false;
        writeAll(next);
        return true;
      },

      count: function () { return readAll().length; }
    };
  }

  /* ---------------- rematch ----------------
     Same setup, fresh picks: re-deal the saved inputs with every saved
     game held out of the deck. The engine is deterministic, so the
     smaller deck is what makes the night new, same role curve, same
     timebox, zero repeated picks while the catalog can fill the slots.
     `engine` is curator-night.js (dealNight); `catalog` is the live one. */
  function rematch(record, catalog, engine) {
    if (!validRecord(record)) {
      return { ok: false, error: 'That saved night is not readable, it may predate the shelf format.' };
    }
    var heldOut = {};
    record.slots.forEach(function (s) { heldOut[s.game_id] = 1; });
    var deck = {
      games: catalog.games.filter(function (g) { return !heldOut[g.id]; }),
      kidSafeIds: catalog.kidSafeIds,
      generated_at: catalog.generated_at
    };
    var result = engine.dealNight({
      group_size: record.inputs.group_size,
      minutes: record.inputs.minutes,
      vibes: record.inputs.vibes.slice(),
      skill: record.inputs.skill,
      kids: record.inputs.kids
    }, deck);
    var fresh = result.lineup.every(function (s) { return !heldOut[s.game_id]; });
    return {
      ok: result.lineup.length > 0,
      result: result,
      fresh: fresh,
      held_out: record.slots.length,
      source_name: record.name
    };
  }

  /* ---------------- the shareable card ----------------
     Plain text, paste-anywhere: the saved night with its name, its
     setup, every slot in order, and the estimates disclaimer the live
     page carries. Mirrors the dealt-night format on purpose. */
  function lineupAsText(record) {
    if (!validRecord(record)) return '';
    var i0 = record.inputs;
    var when = new Date(record.saved_at);
    var lines = [
      'GAME NIGHT: "' + record.name + '" (saved on Button Mash)',
      i0.group_size + (i0.group_size === 1 ? ' player' : ' players') + ' · ' +
        i0.minutes + ' min · ' + i0.vibes.join('/') + ' · ' + i0.skill +
        (i0.kids ? ' · kids table' : '') +
        ' · saved ' + when.getFullYear() + '-' +
        String(when.getMonth() + 1).padStart(2, '0') + '-' +
        String(when.getDate()).padStart(2, '0'),
      ''
    ];
    record.slots.forEach(function (s, i) {
      lines.push((i + 1) + '. ' + s.role_label + ', ' + s.title + ' (~' + s.session_est + ' min, ' +
        s.floor_label + ', ' + s.energy_label + (s.capacity > 1 ? ', seats ~' + s.capacity : '') + ')');
      lines.push('   On Button Mash: game.html?id=' + s.game_id);
    });
    lines.push('');
    lines.push('~' + record.total_est_minutes + ' min of play estimated; the rest is snacks and rematches.');
    lines.push('Session lengths, seats, energy + skill floors are curator estimates, not measured times.');
    return lines.join('\n');
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORE_KEY: STORE_KEY,
    EXPORT_SCHEMA: EXPORT_SCHEMA,
    MAX_LINEUPS: MAX_LINEUPS,
    MAX_NAME: MAX_NAME,
    validRecord: validRecord,
    validSlot: validSlot,
    validInputs: validInputs,
    suggestName: suggestName,
    createStore: createStore,
    rematch: rematch,
    lineupAsText: lineupAsText
  };
}));
