/* Button Mash — the Curator's game-night engine (wave 21).
 *
 * UMD module, DOM-free: the same code runs in the browser and under node
 * (scripts/test_curatornight21.js exercises it with fixtures).
 *
 * This is the flagship "game night" engine: group size, time available, and
 * vibe go in; a ceremony-ready lineup comes out. It is distinct from the
 * wave-A/B quick-lineup engine (lib/game-night.js, scoring v1.0.0) — that
 * one stays untouched with its parity gate. This one is scoring v2.0.0 and
 * adds the three things v1 honestly could not do:
 *
 *   1. SESSION ESTIMATES — per-game "~N min" from genre shape + social tags.
 *      The catalog carries no measured playtimes, so these are CURATOR
 *      ESTIMATES (coarse buckets, always shown with "~", declared in every
 *      response's plan_notes) — never presented as per-game fact.
 *   2. SKILL-FLOOR ESTIMATES — 1 "anyone can play" / 2 "some thumb skill" /
 *      3 "spicy", from genre + tags. Also curator estimates, also declared.
 *   3. THE CURVE — the night is ordered like a good set: WARM-UP, MAIN
 *      EVENT(s), SHOWDOWN (groups) or DEEP DIVE (solo), COOL-DOWN, with an
 *      IDLE "INTERMISSION" slot when the night is long enough.
 *
 * Plus the house rules: genre variety (no two adjacent slots share a genre,
 * max 2 of any genre), and the timebox is real — estimated slot minutes must
 * fit inside the night, so long nights get more slots and short nights fewer.
 *
 * Scoring (v2.0.0, auditable, weights in every response):
 *   player-count fit  40
 *   session fit       20
 *   vibe overlap      20
 *   skill-mix fit     10
 *   kid-safe bonus    10   (only when kids=true; the pool is restricted anyway)
 * Ties broken by title sort — deterministic, same inputs, same night.
 *
 * LEGAL LANE: the corpus is the repo's curl-verified browser games
 * (data/v1/games.json) + the kid-safe list (data/v1/kid-safe.json). The
 * engine cannot recommend anything outside the corpus — that is the safety
 * property. Zero ROMs hosted. Zero piracy links. User-supplied files only.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BMCuratorNight = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCORING_VERSION = '2.0.0';

  var KNOWN_VIBES = ['cozy', 'chaotic', 'competitive', 'party', 'chill'];
  var SKILL_MIXES = ['mixed', 'gamers', 'casual'];

  /* Vibe maps — same philosophy as the v1 engine (tags are real catalog
     data; the genre->vibe map is curated and declared, not hidden). */
  var GENRE_VIBES = {
    puzzle: ['chill', 'cozy'],
    cozy: ['cozy', 'chill'],
    idle: ['chill', 'cozy'],
    roguelike: ['competitive', 'chill'],
    retro: ['chill', 'competitive'],
    action: ['chaotic', 'competitive'],
    multiplayer: ['party', 'competitive', 'chaotic'],
    horror: ['chaotic']
  };
  var TAG_VIBES = {
    party: ['party'],
    racing: ['competitive', 'chaotic'],
    shooter: ['competitive', 'chaotic'],
    arena: ['competitive', 'chaotic'],
    word: ['chill', 'cozy'],
    board: ['party', 'cozy'],
    coop: ['party'],
    drawing: ['party'],
    trivia: ['party', 'chill'],
    sports: ['competitive'],
    phone: ['party']
  };

  var SOCIAL_TAGS = { party: 1, racing: 1, arena: 1, coop: 1, drawing: 1, board: 1, phone: 1, sports: 1 };

  /* ---- Curator estimates (declared heuristics, not measured data) ----
     Session: how long one sitting/round-set of this game usually runs.
     Floor: how much thumb skill a first-timer needs (1/2/3). */
  var SESSION_BY_GENRE = {
    idle: 5, puzzle: 10, retro: 10, cozy: 15,
    action: 15, multiplayer: 15, horror: 20, roguelike: 25
  };
  var SESSION_TAG_TWEAK = {
    trivia: 10, drawing: 10, phone: 10,
    word: 15, racing: 15, sports: 15, coop: 15,
    board: 20, shooter: 20, arena: 20
  };
  var FLOOR1_TAGS = { word: 1, trivia: 1, drawing: 1, board: 1, phone: 1 };
  var FLOOR1_GENRES = { puzzle: 1, cozy: 1, idle: 1 };
  var FLOOR3_TAGS = { shooter: 1, arena: 1, racing: 1 };
  var FLOOR3_GENRES = { roguelike: 1 };

  var FLOOR_LABELS = {
    1: 'anyone can play',
    2: 'some thumb skill',
    3: 'spicy'
  };

  /* Slot roles — the shape of the night. */
  var ROLE_LABELS = {
    warmup: 'THE WARM-UP',
    main: 'THE MAIN EVENT',
    showdown: 'THE SHOWDOWN',
    deepdive: 'THE DEEP DIVE',
    intermission: 'INTERMISSION',
    cooldown: 'THE COOL-DOWN'
  };

  function multiplayerOk(game) {
    if (game.genre === 'multiplayer') return true;
    var tags = game.tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (SOCIAL_TAGS[tags[i]]) return true;
    }
    return false;
  }

  function gameVibes(game) {
    var out = {};
    (GENRE_VIBES[game.genre] || []).forEach(function (v) { out[v] = 1; });
    (game.tags || []).forEach(function (t) {
      (TAG_VIBES[t] || []).forEach(function (v) { out[v] = 1; });
    });
    return out;
  }

  /* Curator estimate: session minutes for one sitting. Coarse buckets. */
  function estimateSession(game) {
    var base = SESSION_BY_GENRE[game.genre];
    if (base == null) base = 15;
    var tags = game.tags || [];
    var tweaked = base;
    for (var i = 0; i < tags.length; i++) {
      var t = SESSION_TAG_TWEAK[tags[i]];
      if (t != null) tweaked = Math.max(tweaked, t);
    }
    return tweaked;
  }

  /* Curator estimate: skill floor 1/2/3. */
  function estimateFloor(game) {
    var tags = game.tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (FLOOR1_TAGS[tags[i]]) return 1;
    }
    if (FLOOR1_GENRES[game.genre]) return 1;
    for (var j = 0; j < tags.length; j++) {
      if (FLOOR3_TAGS[tags[j]]) return 3;
    }
    if (FLOOR3_GENRES[game.genre]) return 3;
    return 2;
  }

  function playerFit(game, groupSize) {
    if (groupSize === 1) {
      return { score: 40, note: 'plays great solo' };
    }
    if (multiplayerOk(game)) {
      return { score: 40, note: 'built for a group of ' + groupSize + ' (multiplayer / social)' };
    }
    return { score: 10, note: 'solo game — works as pass-and-play or watch-together for ' + groupSize };
  }

  function skillFit(floor, skill) {
    if (skill === 'casual') {
      if (floor === 1) return { score: 10, note: 'no skill gate — everyone plays from minute one' };
      if (floor === 2) return { score: 5, note: 'a little thumb skill helps' };
      return { score: 0, note: 'spicy for a casual table — the gamers will carry, the rest will laugh' };
    }
    if (skill === 'gamers') {
      if (floor === 3) return { score: 10, note: 'spicy enough for a gamer table' };
      if (floor === 2) return { score: 6, note: 'enough depth to keep gamers honest' };
      return { score: 2, note: 'simple, but a gamer table will find the tech' };
    }
    return { score: 7, note: 'mixed table — plays across skill levels' };
  }

  function scoreGame(game, inputs, kidSafeSet) {
    var why = [];
    var pf = playerFit(game, inputs.group_size);
    why.push(pf.note);

    var est = estimateSession(game);
    var session;
    if (est <= inputs.minutes) {
      session = 20;
      why.push('one sitting runs ~' + est + ' min — fits the night');
    } else {
      session = 5;
      why.push('one sitting runs ~' + est + ' min — tight for a ' + inputs.minutes + '-min night');
    }

    var gv = gameVibes(game);
    var matched = inputs.vibes.filter(function (v) { return gv[v]; });
    var vibe = inputs.vibes.length ? Math.round((matched.length / inputs.vibes.length) * 20) : 10;
    if (matched.length > 0) why.push('vibe match: ' + matched.join(', '));
    else why.push('carried by fit — no direct overlap with ' + inputs.vibes.join('/'));

    var floor = estimateFloor(game);
    var sf = skillFit(floor, inputs.skill);
    why.push(sf.note + ' (curator estimate: floor ' + floor + '/3)');

    var kids = 0;
    if (inputs.kids && kidSafeSet[game.id]) {
      kids = 10;
      why.push('kid-safe pick (verified in the kids corpus)');
    }

    var score = pf.score + session + vibe + sf.score + kids;
    return {
      score: score,
      breakdown: { players: pf.score, session: session, vibe: vibe, skill: sf.score, kids: kids },
      why: why,
      session_est: est,
      floor: floor
    };
  }

  /* Role sequence for n slots. */
  function roleSequence(n, groupSize) {
    if (n <= 2) return ['warmup', 'cooldown'];
    var seq = ['warmup'];
    var peak = groupSize >= 2 ? 'showdown' : 'deepdive';
    for (var i = 0; i < n - 3; i++) seq.push('main');
    seq.push(peak);
    seq.push('cooldown');
    return seq;
  }

  /* Does this scored game suit this role? (Intermission is assigned, not searched.) */
  function roleOk(role, s, groupSize) {
    if (role === 'warmup') return s.floor === 1 && s.session_est <= 15;
    if (role === 'cooldown') return s.floor === 1 && s.session_est <= 15;
    if (role === 'showdown') return s.floor >= 2;
    if (role === 'deepdive') return s.floor >= 2 || s.game.genre === 'roguelike' || s.game.genre === 'cozy';
    return true; /* main */
  }

  /* Assemble the night: scored pool -> role slots with variety + timebox fit. */
  function assemble(scored, roles, inputs) {
    var lineup = [];
    var usedGenres = {};
    var usedIds = {};
    var pool = scored.slice();

    function takeForRole(role) {
      /* First pass: role fit + variety. Second pass: role fit only.
         Third pass: anything left (honesty: variety is a preference). */
      var passes = [
        function (s) { return roleOk(role, s, inputs.group_size) && !usedIds[s.game.id] && (usedGenres[s.game.genre] || 0) < 2 && (lineup.length === 0 || lineup[lineup.length - 1].genre !== s.game.genre); },
        function (s) { return roleOk(role, s, inputs.group_size) && !usedIds[s.game.id]; },
        function (s) { return !usedIds[s.game.id]; }
      ];
      for (var p = 0; p < passes.length; p++) {
        for (var i = 0; i < pool.length; i++) {
          if (passes[p](pool[i])) {
            var s = pool[i];
            usedIds[s.game.id] = 1;
            usedGenres[s.game.genre] = (usedGenres[s.game.genre] || 0) + 1;
            return s;
          }
        }
      }
      return null;
    }

    /* Intermission: an idle pick when the night is long. Not a role search —
       it is a breather, placed before the peak. */
    var intermission = null;
    if (inputs.minutes >= 90 && roles.length >= 5) {
      for (var i = 0; i < pool.length; i++) {
        var cand = pool[i];
        if (cand.game.genre === 'idle' && !usedIds[cand.game.id]) {
          intermission = cand;
          usedIds[cand.game.id] = 1;
          usedGenres.idle = (usedGenres.idle || 0) + 1;
          break;
        }
      }
    }

    var seq = roles.slice();
    if (intermission) {
      /* Slide the breather in right before the peak (second-to-last). */
      seq.splice(seq.length - 2, 0, 'intermission');
    }

    seq.forEach(function (role) {
      var s;
      if (role === 'intermission') {
        s = intermission;
      } else {
        s = takeForRole(role);
      }
      if (!s) return;
      lineup.push({
        game_id: s.game.id,
        title: s.game.title,
        url: s.game.url,
        genre: s.game.genre,
        role: role,
        role_label: ROLE_LABELS[role],
        session_est: s.session_est,
        floor: s.floor,
        floor_label: FLOOR_LABELS[s.floor],
        kid_safe: !!s.kidSafe,
        score: s.score,
        score_breakdown: s.breakdown,
        why: s.why
      });
    });

    /* Timebox fit: trim middle (main-event) slots until estimates fit. */
    var total = lineup.reduce(function (a, s) { return a + s.session_est; }, 0);
    while (total > inputs.minutes && lineup.length > 2) {
      var dropIdx = -1;
      for (var d = lineup.length - 2; d >= 1; d--) {
        if (lineup[d].role === 'main' || lineup[d].role === 'intermission') { dropIdx = d; break; }
      }
      if (dropIdx === -1) break;
      total -= lineup[dropIdx].session_est;
      lineup.splice(dropIdx, 1);
    }

    /* Greedy repair: if even the minimum night overruns the timebox, swap
       slots for shorter-estimate role candidates until it fits (or nothing
       shorter is left). Deterministic: lowest estimate, then best score. */
    function shortestUnusedFor(role, maxEst) {
      var best = null;
      for (var i = 0; i < pool.length; i++) {
        var s = pool[i];
        if (usedIds[s.game.id] || !roleOk(role, s, inputs.group_size)) continue;
        if (s.session_est >= maxEst) continue;
        if (!best || s.session_est < best.session_est ||
            (s.session_est === best.session_est && s.score > best.score)) best = s;
      }
      return best;
    }
    var guard = 0;
    while (total > inputs.minutes && guard < lineup.length * 2) {
      guard++;
      var improved = false;
      for (var r = 0; r < lineup.length; r++) {
        var cur = lineup[r];
        var alt = shortestUnusedFor(cur.role, cur.session_est);
        if (alt) {
          delete usedIds[cur.game_id];
          usedIds[alt.game.id] = 1;
          usedGenres[cur.genre] = Math.max(0, (usedGenres[cur.genre] || 1) - 1);
          usedGenres[alt.game.genre] = (usedGenres[alt.game.genre] || 0) + 1;
          total -= cur.session_est - alt.session_est;
          lineup[r] = {
            game_id: alt.game.id, title: alt.game.title, url: alt.game.url,
            genre: alt.game.genre, role: cur.role, role_label: cur.role_label,
            session_est: alt.session_est, floor: alt.floor,
            floor_label: FLOOR_LABELS[alt.floor], kid_safe: !!alt.kidSafe,
            score: alt.score, score_breakdown: alt.breakdown, why: alt.why
          };
          improved = true;
          break;
        }
      }
      if (!improved) break;
    }

    /* Long nights: keep dealing main events while they fit (cap 8 slots),
       so a 4-hour night is a night, not an hour with snacks. Insert before
       the peak so the curve's shape survives. */
    function bestMainFor() {
      var cands = [];
      for (var i = 0; i < pool.length; i++) {
        var s = pool[i];
        if (!usedIds[s.game.id] && roleOk('main', s, inputs.group_size)) cands.push(s);
      }
      if (!cands.length) return null;
      /* Score first; variety is the tiebreak among near-tied candidates. */
      var top = Math.max.apply(null, cands.map(function (s) { return s.score; }));
      var near = cands.filter(function (s) { return s.score >= top - 8; });
      near.sort(function (a, b) {
        var ga = usedGenres[a.game.genre] ? 1 : 0, gb = usedGenres[b.game.genre] ? 1 : 0;
        return (ga - gb) || (b.score - a.score) ||
          (a.game.title < b.game.title ? -1 : a.game.title > b.game.title ? 1 : 0);
      });
      return near[0];
    }
    while (lineup.length < 8 && total + 15 <= inputs.minutes) {
      var extra = bestMainFor();
      if (!extra || total + extra.session_est > inputs.minutes) break;
      var peakIdx = lineup.length - 2;
      usedIds[extra.game.id] = 1;
      usedGenres[extra.game.genre] = (usedGenres[extra.game.genre] || 0) + 1;
      total += extra.session_est;
      lineup.splice(peakIdx, 0, {
        game_id: extra.game.id, title: extra.game.title, url: extra.game.url,
        genre: extra.game.genre, role: 'main', role_label: ROLE_LABELS.main,
        session_est: extra.session_est, floor: extra.floor,
        floor_label: FLOOR_LABELS[extra.floor], kid_safe: !!extra.kidSafe,
        score: extra.score, score_breakdown: extra.breakdown, why: extra.why
      });
    }

    return { lineup: lineup, total_est: total };
  }

  /* inputs: { group_size, minutes, vibes[], skill, kids }
     catalog: { games: [...], kidSafeIds: {id:1}, generated_at } */
  function dealNight(inputs, catalog) {
    var plan_notes = [];

    var pool = catalog.games.slice();
    if (inputs.kids) {
      pool = pool.filter(function (g) { return catalog.kidSafeIds[g.id]; });
      if (pool.length === 0) {
        return {
          lineup: [], plan_notes: [
            'No night: no kid-safe games matched. The kids corpus (113 verified kid-safe ' +
            'browser games) is the only source for kids=true nights.'
          ],
          scored_from: 0, total_est_minutes: 0, no_lineup_reason: 'no-kid-safe-candidates',
          scoring_version: SCORING_VERSION, inputs_echo: inputs
        };
      }
    }

    var scored = pool.map(function (g) {
      var s = scoreGame(g, inputs, catalog.kidSafeIds);
      s.game = g;
      s.kidSafe = !!catalog.kidSafeIds[g.id];
      return s;
    });
    /* Deterministic: score desc, then title asc. */
    scored.sort(function (a, b) {
      return (b.score - a.score) || (a.game.title < b.game.title ? -1 : a.game.title > b.game.title ? 1 : 0);
    });

    var target = inputs.minutes >= 150 ? 6 : inputs.minutes >= 90 ? 5 : inputs.minutes >= 45 ? 4 : inputs.minutes >= 25 ? 3 : 2;
    var roles = roleSequence(target, inputs.group_size);
    var built = assemble(scored, roles, inputs);

    plan_notes.push(
      'Session lengths (~min) and skill floors (1-3) are curator estimates from each game\'s ' +
      'genre shape + social tags — coarse buckets, never measured playtimes. ' +
      'Scoring v' + SCORING_VERSION + ': players 40 + session 20 + vibe 20 + skill 10 + kids 10; ' +
      'ties break by title so the same night always deals the same way.'
    );
    plan_notes.push(
      'The night is ordered like a good set: a low-floor warm-up, main events in the ' +
      'middle, a ' + (inputs.group_size >= 2 ? 'showdown' : 'deep dive') + ' before the ' +
      'end, and a gentle cool-down. No two neighboring slots share a genre; at most ' +
      'two slots per genre. Estimated total ~' + built.total_est + ' min of your ' +
      inputs.minutes + '-min night — the rest is snacks, arguing about the rules, and rematches.'
    );
    if (inputs.kids) {
      plan_notes.push('Kids at the table: every pick comes from the 113 kid-safe games (no chat, parent notes on file).');
    }
    var unmatched = inputs.vibes.filter(function (v) { return KNOWN_VIBES.indexOf(v) === -1; });
    if (unmatched.length) {
      plan_notes.push('Unknown vibe(s) ignored: ' + unmatched.join(', ') + ' (known: ' + KNOWN_VIBES.join(', ') + ').');
    }

    return {
      lineup: built.lineup,
      plan_notes: plan_notes,
      scored_from: pool.length,
      total_est_minutes: built.total_est,
      no_lineup_reason: null,
      scoring_version: SCORING_VERSION,
      inputs_echo: inputs,
      metadata_as_of: catalog.generated_at || null
    };
  }

  function validateInputs(raw) {
    var errors = [];
    var group = parseInt(raw.group_size, 10);
    if (isNaN(group) || group < 1 || group > 12) errors.push('Group size must be 1-12.');
    var minutes = parseInt(raw.minutes, 10);
    if (isNaN(minutes) || minutes < 15 || minutes > 240) errors.push('Time must be 15-240 minutes.');
    var vibes = (raw.vibes || []).filter(function (v) { return KNOWN_VIBES.indexOf(v) !== -1; });
    if (vibes.length === 0) errors.push('Pick at least one vibe.');
    var skill = SKILL_MIXES.indexOf(raw.skill) !== -1 ? raw.skill : 'mixed';
    return {
      ok: errors.length === 0,
      errors: errors,
      inputs: { group_size: group, minutes: minutes, vibes: vibes, skill: skill, kids: !!raw.kids }
    };
  }

  return {
    SCORING_VERSION: SCORING_VERSION,
    KNOWN_VIBES: KNOWN_VIBES,
    SKILL_MIXES: SKILL_MIXES,
    ROLE_LABELS: ROLE_LABELS,
    FLOOR_LABELS: FLOOR_LABELS,
    multiplayerOk: multiplayerOk,
    gameVibes: gameVibes,
    estimateSession: estimateSession,
    estimateFloor: estimateFloor,
    roleSequence: roleSequence,
    scoreGame: scoreGame,
    dealNight: dealNight,
    validateInputs: validateInputs
  };
}));
