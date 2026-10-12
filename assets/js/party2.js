/* Button Mash Party Planner 2.0 — pure logic, no DOM.
   UMD: browser (window.Party2) and node (module.exports) so
   scripts/test_party11.js can verify voting ties, rotation math,
   share-link encode/decode/validation, kids-party filtering, and the
   party timeline with pinned fixtures.

   State (version 1) — only INPUTS are encoded into share links; slots
   and the timeline are derived from them on import (never trusted):
   - guests: [names...]            (2..16, each 1..32 chars)
   - opts: { vibe, skill, inputs[], minutes, kids, kidBand, startClock,
             snackMin, format }    (enums validated on import)
   - games: [gameIds...]           (candidate pool, pick order matters for
                                   tie-breaking: ties go to the earlier pick)
   - votes: { guestName: gameId }  (one vote per guest; re-vote moves it)

   Rotation model: hot-seat games (all kid-party games + drawing/word/
   trivia/board tags) play in groups of up to 4, offset rotated one guest
   per slot, so over a full cycle every guest sits out the same number of
   times. Everyone-in games (arenas, most .io) list no sit-outs. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Party2 = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = 1;
  var MAX_GUESTS = 16;
  var MAX_NAME = 32;
  var MAX_GAMES = 16;
  var GAME_ID_RE = /^[a-z0-9-]+$/;
  var NAME_RE = /^[A-Za-z0-9 .'\-+_]+$/;

  var VIBES = ['chaotic', 'competitive', 'cooperative', 'creative', 'chill'];
  var SKILLS = ['gamers', 'mixed', 'casual'];
  var INPUTS = ['keyboard', 'mouse', 'touch', 'phone'];
  var BANDS = ['5-7', '8-10', '11-12'];
  var FORMATS = ['single', 'double'];

  /* Hot-seat tag list mirrors party.js's rotation rule. */
  var HOTSEAT_TAGS = ['drawing', 'word', 'trivia', 'board'];

  function isHotseat(game) {
    var tags = (game && game.tags) || [];
    return HOTSEAT_TAGS.some(function (t) { return tags.indexOf(t) !== -1; });
  }

  function validName(n) {
    return typeof n === 'string' && n.length >= 1 && n.length <= MAX_NAME && NAME_RE.test(n);
  }

  function cleanGuests(guests) {
    if (!Array.isArray(guests)) return { error: 'guests must be a list' };
    var seen = {}, out = [];
    for (var i = 0; i < guests.length; i++) {
      var n = String(guests[i]).trim().replace(/\s+/g, ' ');
      if (!validName(n)) return { error: 'bad guest name: "' + String(guests[i]).slice(0, 40) + '"' };
      if (seen[n]) return { error: 'duplicate guest name: "' + n + '"' };
      seen[n] = true; out.push(n);
    }
    if (out.length < 2) return { error: 'need at least 2 guests' };
    if (out.length > MAX_GUESTS) return { error: 'too many guests (max ' + MAX_GUESTS + ')' };
    return { guests: out };
  }

  function cleanOpts(opts) {
    opts = opts || {};
    var o = {};
    o.vibe = VIBES.indexOf(opts.vibe) !== -1 ? opts.vibe : 'chaotic';
    o.skill = SKILLS.indexOf(opts.skill) !== -1 ? opts.skill : 'mixed';
    o.inputs = Array.isArray(opts.inputs)
      ? opts.inputs.filter(function (x) { return INPUTS.indexOf(x) !== -1; }) : ['keyboard', 'mouse'];
    if (!o.inputs.length) o.inputs = ['keyboard', 'mouse'];
    o.minutes = parseInt(opts.minutes, 10);
    if (!(o.minutes >= 15 && o.minutes <= 480)) o.minutes = 60;
    o.kids = !!opts.kids;
    o.kidBand = BANDS.indexOf(opts.kidBand) !== -1 ? opts.kidBand : '11-12';
    o.startClock = typeof opts.startClock === 'string' && /^\d{2}:\d{2}$/.test(opts.startClock)
      ? opts.startClock : null;
    o.snackMin = parseInt(opts.snackMin, 10);
    if (!(o.snackMin >= 5 && o.snackMin <= 60)) o.snackMin = 15;
    o.format = FORMATS.indexOf(opts.format) !== -1 ? opts.format : 'single';
    return o;
  }

  function cleanGames(games) {
    if (!Array.isArray(games)) return { error: 'games must be a list' };
    var seen = {}, out = [], dropped = [];
    for (var i = 0; i < games.length; i++) {
      var id = String(games[i]);
      if (!GAME_ID_RE.test(id) || seen[id]) { dropped.push(id); continue; }
      seen[id] = true; out.push(id);
    }
    if (!out.length) return { error: 'no valid game ids', dropped: dropped };
    return { games: out.slice(0, MAX_GAMES), dropped: dropped };
  }

  function createParty(guests, opts, games) {
    var g = cleanGuests(guests);
    if (g.error) return { error: g.error };
    var gm = cleanGames(games || []);
    if (gm.error) return { error: gm.error };
    return { version: VERSION, guests: g.guests, opts: cleanOpts(opts),
             games: gm.games, votes: {} };
  }

  /* ---------- game voting ---------- */
  /* One vote per guest; re-voting moves the vote. Guests and game ids
     are validated against the party state. */

  function addVote(state, guest, gameId) {
    if (!state || !state.guests) return { error: 'no party state' };
    var n = String(guest || '').trim().replace(/\s+/g, ' ');
    if (state.guests.indexOf(n) === -1) return { error: 'not a party guest: "' + n + '"' };
    var id = String(gameId || '');
    if (state.games.indexOf(id) === -1) return { error: 'not a candidate game: "' + id + '"' };
    state.votes[n] = id;
    return { ok: true };
  }

  function tally(state) {
    /* [{gameId, count}] ordered by votes desc, tie -> earliest pick. */
    var counts = {}, order = {};
    state.games.forEach(function (id, i) { order[id] = i; counts[id] = 0; });
    Object.keys(state.votes).forEach(function (g) {
      var id = state.votes[g];
      if (id in counts) counts[id]++;
    });
    return Object.keys(counts).map(function (id) {
      return { gameId: id, count: counts[id] };
    }).sort(function (a, b) {
      return (b.count - a.count) || (order[a.gameId] - order[b.gameId]);
    });
  }

  function topVoted(state, n) {
    n = n || state.games.length;
    return tally(state).slice(0, n).map(function (t) { return t.gameId; });
  }

  /* ---------- rotation scheduler ---------- */
  /* For each slot (with its game record), who plays and who sits out.
     Hot-seat games: play groups of up to 4 rotate one guest per slot.
     Everyone-in games: all guests play, no sit-outs. */

  var PLAY_GROUP = 4;

  function scheduleRotation(guests, slots) {
    return slots.map(function (slot, s) {
      var hot = !!slot.hotseat;
      if (!hot || guests.length <= PLAY_GROUP) {
        return { slotIndex: s, hotseat: hot, plays: guests.slice(), sits: [] };
      }
      var plays = [], sits = [];
      for (var i = 0; i < guests.length; i++) {
        var k = (i + s) % guests.length;         /* group offset rotates */
        if (i < PLAY_GROUP) plays.push(guests[k]); else sits.push(guests[k]);
      }
      return { slotIndex: s, hotseat: true, plays: plays, sits: sits };
    });
  }

  /* ---------- party timeline ---------- */
  /* Phases: setup (30 min before start) -> games (the slots, with the
     snack break inserted after snackSlotIdx) -> tournament (suggested
     30 min, wired to the tournament.html handoff) -> free play (30 min).
     startClock "HH:MM" gives wall-clock labels; without it, relative
     offsets are returned instead. */

  var SETUP_MIN = 30;
  var TOURNEY_MIN = 30;
  var FREEPLAY_MIN = 30;

  function fmtClock(totalMin) {
    totalMin = ((totalMin % 1440) + 1440) % 1440;
    var h = Math.floor(totalMin / 60), m = totalMin % 60;
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function buildTimeline(opts, slots, snackSlotIdx) {
    var tl = [];
    var clock = null;
    if (opts.startClock) {
      var parts = opts.startClock.split(':');
      clock = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    function label(off) { return clock == null ? null : fmtClock(clock + off); }

    var t = -SETUP_MIN;
    tl.push({ phase: 'setup', start: t, end: 0, clockStart: label(t), clockEnd: label(0),
              label: 'Setup — open the game links, share rooms, set out snacks' });

    var idx = Math.max(0, Math.min(slots.length - 1, snackSlotIdx == null ? Math.floor((slots.length - 1) / 2) : snackSlotIdx));
    var at = 0, ti = 0;
    slots.forEach(function (slot, s) {
      var dur = slot.end - slot.start;
      tl.push({ phase: 'game', start: at, end: at + dur, clockStart: label(at), clockEnd: label(at + dur),
                label: 'Game ' + (s + 1) + ' — ' + (slot.title || slot.gameId), gameId: slot.gameId });
      at += dur; ti++;
      if (s === idx && opts.snackMin > 0) {
        tl.push({ phase: 'snack', start: at, end: at + opts.snackMin,
                  clockStart: label(at), clockEnd: label(at + opts.snackMin),
                  label: 'Snack break — ' + opts.snackMin + ' min' });
        at += opts.snackMin;
      }
    });
    tl.push({ phase: 'tournament', start: at, end: at + TOURNEY_MIN,
              clockStart: label(at), clockEnd: label(at + TOURNEY_MIN),
              label: 'Tournament — run a bracket with this party\'s guests + voted games' });
    at += TOURNEY_MIN;
    tl.push({ phase: 'freeplay', start: at, end: at + FREEPLAY_MIN,
              clockStart: label(at), clockEnd: label(at + FREEPLAY_MIN),
              label: 'Free play — replay favorites or open requests' });
    return { phases: tl, totalMin: at + FREEPLAY_MIN - (-SETUP_MIN), snackAfterSlot: idx };
  }

  /* ---------- share links ---------- */
  /* base64url JSON of the INPUT state only (guests, opts, games, votes).
     decodeShare validates everything and rebuilds a clean state; slots
     and timeline are re-derived by the caller, never trusted. */

  function b64uEncode(str) {
    var b = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(str)))
      : Buffer.from(str, 'utf8').toString('base64');
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64uDecode(s) {
    var b = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    if (typeof atob === 'function') return decodeURIComponent(escape(atob(b)));
    return Buffer.from(b, 'base64').toString('utf8');
  }

  function encodeShare(state) {
    return b64uEncode(JSON.stringify({
      v: VERSION,
      guests: state.guests,
      opts: state.opts,
      games: state.games,
      votes: state.votes
    }));
  }

  function decodeShare(str) {
    var d;
    try { d = JSON.parse(b64uDecode(String(str))); }
    catch (e) { return { ok: false, error: 'not a valid share link' }; }
    if (!d || d.v !== VERSION) return { ok: false, error: 'unsupported party link version' };
    var g = cleanGuests(d.guests);
    if (g.error) return { ok: false, error: 'bad guests: ' + g.error };
    var gm = cleanGames(d.games);
    if (gm.error) return { ok: false, error: 'bad games: ' + gm.error };
    if (d.votes && typeof d.votes !== 'object') return { ok: false, error: 'bad votes' };
    var state = { version: VERSION, guests: g.guests, opts: cleanOpts(d.opts),
                  games: gm.games, votes: {} };
    Object.keys(d.votes || {}).forEach(function (guest) {
      if (state.guests.indexOf(guest) === -1) return;       /* drop unknown guests */
      if (state.games.indexOf(d.votes[guest]) === -1) return; /* drop unknown games */
      state.votes[guest] = d.votes[guest];
    });
    return { ok: true, state: state, droppedGames: gm.dropped || [] };
  }

  /* ---------- kids-party pool ---------- */
  /* Kids party: pool is restricted to kid-safe ids (no vibe-subtag
     filtering — the kid-safe catalog has no party tags by design).
     Age bands: 5-7 < 8-10 < 11-12; selecting a youngest band includes
     that band and everything below it. */

  function kidPool(kidRecords, kidBand) {
    /* kidRecords: the kid-safe.json "kid-safe" array (carries age_band).
       Youngest band selects that band and everything below it. */
    var rank = { '5-7': 0, '8-10': 1, '11-12': 2 };
    var maxRank = rank[kidBand] == null ? 2 : rank[kidBand];
    var out = [];
    (kidRecords || []).forEach(function (rec) {
      var r = rank[rec.age_band];
      if (rec.id && r != null && r <= maxRank) out.push(rec.id);
    });
    return out;
  }

  return {
    VERSION: VERSION,
    HOTSEAT_TAGS: HOTSEAT_TAGS,
    PLAY_GROUP: PLAY_GROUP,
    isHotseat: isHotseat,
    createParty: createParty,
    cleanOpts: cleanOpts,
    addVote: addVote,
    tally: tally,
    topVoted: topVoted,
    scheduleRotation: scheduleRotation,
    buildTimeline: buildTimeline,
    encodeShare: encodeShare,
    decodeShare: decodeShare,
    kidPool: kidPool
  };
}));
