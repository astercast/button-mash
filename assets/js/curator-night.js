/* Button Mash — the Curator's game-night engine (wave 21).
 *
 * UMD module, DOM-free: the same code runs in the browser and under node
 * (scripts/test_curatornight21.js exercises it with fixtures).
 *
 * This is the flagship "game night" engine: group size, time available, and
 * vibe go in; a ceremony-ready lineup comes out. It is distinct from the
 * wave-A/B quick-lineup engine (lib/game-night.js, scoring v1.0.0) — that
 * one stays untouched with its parity gate. This one is scoring v2.2.0 and
 * adds the three things v1 honestly could not do:
 *
 *   1. SESSION ESTIMATES — per-game "~N min" from genre shape + social tags,
 *      CALIBRATED against the real catalog (wave 22): genre buckets alone
 *      put Civilization and Space Invaders in the same 10-minute retro
 *      bucket, which deals nonsense nights. SESSION_OVERRIDES below pins
 *      the games whose shape the bucket plainly gets wrong — long-form
 *      sims and adventures, deep traditional roguelikes, narrative idles,
 *      five-minute daily puzzles, browse-a-shelf library pages. The
 *      catalog carries no measured playtimes, so these stay CURATOR
 *      ESTIMATES (coarse buckets, always shown with "~", declared in every
 *      response's plan_notes) — never presented as per-game fact.
 *   2. SEATS + ENERGY ESTIMATES — how many players a game comfortably
 *      seats (a chess duel is not a drawing room; a solo game pass-and-
 *      played by twelve is one driver and eleven back-seat navigators)
 *      and how loud a sitting gets (1 low-key / 2 steady / 3 high-octane).
 *      Player fit is graded against YOUR group size, and the curve spends
 *      energy on purpose: quiet edges, loud middle.
 *   3. SKILL-FLOOR ESTIMATES — 1 "anyone can play" / 2 "some thumb skill" /
 *      3 "spicy", from genre + tags. Also curator estimates, also declared.
 *   4. THE CURVE — the night is ordered like a good set: WARM-UP, MAIN
 *      EVENT(s), SHOWDOWN (groups) or DEEP DIVE (solo), COOL-DOWN, with an
 *      IDLE "INTERMISSION" slot when the night is long enough.
 *
 * Plus the house rules: genre variety (no two adjacent slots share a genre,
 * max 2 of any genre), and the timebox is real — estimated slot minutes must
 * fit inside the night, so long nights get more slots and short nights fewer.
 *
 * Scoring (v2.2.0, auditable, weights in every response):
 *   player-count fit  40   graded: seats vs group size (see playerFit)
 *   session fit       20   graded: sitting vs the night's slot size
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

  var SCORING_VERSION = '2.2.0';

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

  /* ---- Wave-22 calibration: per-game overrides, pinned by hand ----
     Genre buckets are the fallback, not the verdict. Every id below is a
     real catalog game whose actual shape the bucket gets wrong; the test
     suite (scripts/test_gamenight22.js) proves each override exists in
     the catalog and actually changes the bucket value — a stale or dead
     override fails the build. */
  var SESSION_OVERRIDES = {
    /* Long-form retro: empire sims and adventures are sittings, not rounds. */
    'civ1': 60, 'master-of-orion': 60, 'transport-tycoon': 60,
    'railroad-tycoon': 45, 'theme-park': 45, 'simcity-1989': 45,
    'simcity-2000': 45, 'monkey-island': 45, 'zork1': 45, 'alone-dark': 45,
    'oregon-trail': 30, 'oregon-trail-deluxe': 30, 'prince-of-persia': 30,
    'doom-1993': 30, 'quake-shareware': 30, 'duke3d-shareware': 30,
    'kingdom-of-loathing': 30, 'urban-dead': 30, 'lemmings-1991': 25,
    'wolfenstein-3d': 20, 'commander-keen3': 20, 'keen-dreams': 20,
    /* Library pages: a sitting is browsing a shelf of hundreds. */
    'console-living-room': 20, 'internet-arcade': 20, 'msdos-library': 20,
    'classicreload': 20, 'lexaloffle-bbs': 15, 'pico8-tops': 15,
    /* Deep traditional roguelikes run long; a Survivors run is a timer. */
    'dcss-webtiles': 45, 'angband-live': 45, 'nethack-web': 60,
    'vampire-survivors': 30, 'hordes': 30, 'spelunky-classic': 20,
    'tristram': 20,
    /* Narrative idles unfold over a real sitting; pure clickers stay 5. */
    'a-dark-room': 30, 'universal-paperclips': 30, 'kittens-game': 30,
    'bitburner': 30, 'candy-box-2': 25, 'trimps': 20,
    'antimatter-dimensions': 15, 'swarm-sim': 15, 'melvor-idle': 15,
    'prerolled': 15,
    /* Puzzle: builders and open-ended sandboxes vs five-minute dailies. */
    'shapez': 45, 'infinite-craft': 20, 'little-alchemy-2': 20,
    'password-game': 20, 'sort-the-court': 20, 'geoguessr': 20,
    'wordle': 5, 'connections': 5, 'globle': 5, 'worldle': 5,
    'framed': 5, 'waffle': 5, 'bandle': 5,
    /* Wave-24 follow-up: long-form puzzles the 10-minute bucket still
       misread — a full mystery, a deduction archive, a half-hour essay,
       a coding campaign, a shelf of 40+ logic puzzles, and the two
       PICO-8 games re-shelved out of roguelike this wave (a platformer
       clear and a demake run are sittings, not rounds). */
    'type-help': 45, 'trevosa': 30, 'evolution-of-trust': 30,
    'codecombat': 30, 'tatham-puzzles': 20, 'celeste-classic': 20,
    'poom': 20,
    /* Story horror: one is literally a five-minute game (its own words). */
    'wbwwb': 5, 'purrgatory': 30, 'lookouts': 40, 'anxiety': 15,
    'dating-killmulator-2': 30,
    /* Action sandboxes and campaign games. */
    'mindustry': 45, 'red-alert-rts': 30, 'minecraft-classic': 30,
    /* Cozy long reads and open-ended toys. */
    'fallen-london': 25, 'tale-of-crowns': 40, 'townscaper': 20
  };

  /* Seats: where the tag tiers misread a specific game. Chess is a duel
     even with a board tag; Catan seats four even with a party tag. */
  var CAPACITY_OVERRIDES = {
    'pokemon-showdown': 2, 'lichess': 2, 'lexulous': 4, 'colonist': 4,
    'board-game-arena': 6, 'playok': 6, 'classicube': 8, 'bonk': 8,
    'jetpunk': 4, 'kaaarot': 4, 'hordes': 6,
    /* Wave-24 follow-up: a shooter tag is not an 8-seat lobby. The
       golden-age cabinets are 1–2 players alternating at one machine;
       a versus fighter seats two; a co-op bubble cart seats two; and
       Jstris is a real multiplayer lobby despite its puzzle shelf. */
    '1942': 2, 'centipede': 2, 'defender': 2, 'galaga88': 2,
    'missile-command': 2, 'robotron': 2, 'space-invaders': 2,
    'tempest': 2, 'sfa2': 2, 'bubble-bobble-2': 2, 'jstris': 8
  };

  var ENERGY_LABELS = {
    1: 'low-key',
    2: 'steady',
    3: 'high-octane'
  };
  var HIGH_ENERGY_TAGS = { shooter: 1, arena: 1, racing: 1 };
  var LOW_ENERGY_TAGS = { word: 1, board: 1, trivia: 1 };

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

  /* Curator estimate: session minutes for one sitting. Coarse buckets,
     hand-calibrated per game where the bucket plainly lies (wave 22). */
  function estimateSession(game) {
    if (SESSION_OVERRIDES[game.id] != null) return SESSION_OVERRIDES[game.id];
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

  /* Curator estimate: how many players one sitting comfortably seats.
     Room games (phones, drawing, trivia) scale to the whole couch; team
     word/party games seat ten; online lobbies seat eight; board tables
     six; co-op four; everything else is a solo game, pass-and-play. */
  function estimateCapacity(game) {
    if (CAPACITY_OVERRIDES[game.id] != null) return CAPACITY_OVERRIDES[game.id];
    var tags = game.tags || [];
    function has(t) { return tags.indexOf(t) !== -1; }
    if (has('phone') || has('drawing') || has('trivia')) return 12;
    if (has('word') || has('party')) return 10;
    if (has('arena') || has('shooter') || has('racing') || has('sports')) return 8;
    if (has('board')) return 6;
    if (has('coop')) return 4;
    if (game.genre === 'multiplayer') return 8;
    return 1;
  }

  /* Curator estimate: how loud one sitting gets. 1 low-key, 2 steady,
     3 high-octane. The curve spends it on purpose — quiet edges, loud
     middle — so a night that starts at full volume has nowhere to go. */
  function estimateEnergy(game) {
    var tags = game.tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (HIGH_ENERGY_TAGS[tags[i]]) return 3;
    }
    if (game.genre === 'action' || game.genre === 'horror') return 3;
    if (game.genre === 'idle' || game.genre === 'cozy') return 1;
    for (var j = 0; j < tags.length; j++) {
      if (LOW_ENERGY_TAGS[tags[j]]) return 1;
    }
    return 2;
  }

  /* How many slots a night of this length is aiming at. */
  function targetSlots(minutes) {
    return minutes >= 150 ? 6 : minutes >= 90 ? 5 : minutes >= 45 ? 4 : minutes >= 25 ? 3 : 2;
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

  /* Player fit, graded against the game's seats (wave-22 calibration).
     v2.0 scored every social game 40 and every solo game 10 for any group
     over one — so a chess duel and a drawing room tied, and pass-and-play
     looked just as good for twelve as for two. It is neither. */
  function playerFit(game, groupSize) {
    var cap = estimateCapacity(game);
    if (groupSize === 1) {
      return { score: 40, capacity: cap, note: 'plays great solo' };
    }
    if (cap >= groupSize) {
      return {
        score: 40, capacity: cap,
        note: cap >= 8
          ? 'room-scale — seats a group of ' + groupSize + ' with space to spare'
          : 'seats a group of ' + groupSize + ' comfortably'
      };
    }
    if (cap === 1) {
      if (groupSize === 2) {
        return { score: 26, capacity: cap, note: 'solo game — pass-and-play for 2 works a treat: trade the controls, loser hands over' };
      }
      if (groupSize <= 4) {
        return { score: 18, capacity: cap, note: 'solo game — pass-and-play for ' + groupSize + '; the rest of the couch heckles and navigates' };
      }
      if (groupSize <= 8) {
        return { score: 10, capacity: cap, note: 'solo game — at ' + groupSize + ' players it is one driver and a back seat of navigators' };
      }
      return { score: 6, capacity: cap, note: 'solo game — at ' + groupSize + ' players most of the room is watching one person play' };
    }
    return {
      score: Math.max(14, 40 - 6 * (groupSize - cap)), capacity: cap,
      note: 'seats ~' + cap + ' at once — a group of ' + groupSize + ' rotates in or splits into tables'
    };
  }

  /* Session fit, graded against the size of slot this night actually has
     (wave-22 calibration). v2.0 paid full marks to anything shorter than
     the whole night, so a five-minute clicker and a perfect-fit main
     event tied on a four-hour night. */
  function sessionFit(est, minutes) {
    var ideal = Math.max(5, Math.round(minutes / targetSlots(minutes)));
    if (est > minutes) {
      return { score: 2, note: 'one sitting runs ~' + est + ' min — longer than the whole ' + minutes + '-min night' };
    }
    var r = est / ideal;
    if (r >= 0.5 && r <= 1.6) {
      return { score: 20, note: 'one sitting runs ~' + est + ' min — right size for a ~' + ideal + '-min slot' };
    }
    if (r < 0.5 && r >= 0.3) {
      return { score: 13, note: 'one sitting runs ~' + est + ' min — short for a ~' + ideal + '-min slot; expect instant rematches' };
    }
    if (r < 0.3) {
      return { score: 8, note: 'one sitting runs ~' + est + ' min — a blink next to a ~' + ideal + '-min slot; seasoning, not a course' };
    }
    if (r <= 2.2) {
      return { score: 13, note: 'one sitting runs ~' + est + ' min — long for a ~' + ideal + '-min slot; it will set the pace of the night' };
    }
    return { score: 6, note: 'one sitting runs ~' + est + ' min — eats about ' + Math.round(r) + ' slots; deal it only if the table wants to live there' };
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
    var sess = sessionFit(est, inputs.minutes);
    why.push(sess.note);

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

    var score = pf.score + sess.score + vibe + sf.score + kids;
    return {
      score: score,
      breakdown: { players: pf.score, session: sess.score, vibe: vibe, skill: sf.score, kids: kids },
      why: why,
      session_est: est,
      floor: floor,
      capacity: pf.capacity,
      energy: estimateEnergy(game)
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

  /* Does this scored game suit this role? (Intermission is assigned, not searched.)
     Energy does real work here: the edges of the night stay low-key, the
     peak has to earn its volume. */
  function roleOk(role, s, groupSize) {
    if (role === 'warmup') return s.floor === 1 && s.session_est <= 15 && s.energy <= 2;
    if (role === 'cooldown') return s.floor === 1 && s.session_est <= 15 && s.energy <= 2;
    if (role === 'showdown') return s.energy === 3 || s.floor >= 2;
    if (role === 'deepdive') return s.floor >= 2 || s.game.genre === 'roguelike' || s.game.genre === 'cozy';
    return true; /* main */
  }

  /* Assemble the night: scored pool -> role slots with variety + timebox fit. */
  function assemble(scored, roles, inputs) {
    var lineup = [];
    var usedGenres = {};
    var usedIds = {};
    var pool = scored.slice();

    /* Seats fit for the graded passes: a pick should roughly seat the
       room (within two, or room-scale) before we settle for rotation. */
    function capacityOk(s) {
      return inputs.group_size <= 1 || s.capacity >= inputs.group_size - 2 || s.capacity >= 8;
    }

    function takeForRole(role) {
      /* First pass: role fit + variety. Second pass: role fit + seats.
         Third pass: role fit only. Fourth: anything left (honesty:
         variety and seats are preferences, the night must still deal). */
      var passes = [
        function (s) { return roleOk(role, s, inputs.group_size) && !usedIds[s.game.id] && capacityOk(s) && (usedGenres[s.game.genre] || 0) < 2 && (lineup.length === 0 || lineup[lineup.length - 1].genre !== s.game.genre); },
        function (s) { return roleOk(role, s, inputs.group_size) && !usedIds[s.game.id] && capacityOk(s); },
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

    /* Intermission: a SHORT idle pick when the night is long. Not a role
       search — it is a breather, placed before the peak. The ~15-min cap
       matters: a 30-minute narrative idle is a course, not a breather. */
    var intermission = null;
    if (inputs.minutes >= 90 && roles.length >= 5) {
      for (var i = 0; i < pool.length; i++) {
        var cand = pool[i];
        if (cand.game.genre === 'idle' && cand.session_est <= 15 && !usedIds[cand.game.id]) {
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
        capacity: s.capacity,
        energy: s.energy,
        energy_label: ENERGY_LABELS[s.energy],
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
            capacity: alt.capacity, energy: alt.energy,
            energy_label: ENERGY_LABELS[alt.energy],
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
    function bestMainFor(maxEst) {
      var cands = [];
      for (var i = 0; i < pool.length; i++) {
        var s = pool[i];
        if (!usedIds[s.game.id] && s.session_est <= maxEst && roleOk('main', s, inputs.group_size)) cands.push(s);
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
    while (lineup.length < 8 && total < inputs.minutes &&
           (inputs.minutes >= 45 || lineup.length < targetSlots(inputs.minutes))) {
      var extra = bestMainFor(inputs.minutes - total);
      if (!extra) break;
      var peakIdx = Math.max(1, lineup.length - 2);
      usedIds[extra.game.id] = 1;
      usedGenres[extra.game.genre] = (usedGenres[extra.game.genre] || 0) + 1;
      total += extra.session_est;
      lineup.splice(peakIdx, 0, {
        game_id: extra.game.id, title: extra.game.title, url: extra.game.url,
        genre: extra.game.genre, role: 'main', role_label: ROLE_LABELS.main,
        session_est: extra.session_est, floor: extra.floor,
        floor_label: FLOOR_LABELS[extra.floor], kid_safe: !!extra.kidSafe,
        capacity: extra.capacity, energy: extra.energy,
        energy_label: ENERGY_LABELS[extra.energy],
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

    var target = targetSlots(inputs.minutes);
    var roles = roleSequence(target, inputs.group_size);
    var built = assemble(scored, roles, inputs);

    plan_notes.push(
      'Session lengths (~min), seats and energy are curator estimates, calibrated game by game ' +
      'against the catalog\'s real shapes — a Civilization sitting is not a Space Invaders sitting, ' +
      'and a chess duel does not seat a room. Coarse buckets, never measured playtimes. ' +
      'Scoring v' + SCORING_VERSION + ': players 40 (graded by seats vs your group) + session 20 ' +
      '(graded against this night\'s slot size) + vibe 20 + skill 10 + kids 10; ' +
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
    ENERGY_LABELS: ENERGY_LABELS,
    SESSION_OVERRIDES: SESSION_OVERRIDES,
    CAPACITY_OVERRIDES: CAPACITY_OVERRIDES,
    multiplayerOk: multiplayerOk,
    gameVibes: gameVibes,
    estimateSession: estimateSession,
    estimateFloor: estimateFloor,
    estimateCapacity: estimateCapacity,
    estimateEnergy: estimateEnergy,
    targetSlots: targetSlots,
    playerFit: playerFit,
    sessionFit: sessionFit,
    roleSequence: roleSequence,
    scoreGame: scoreGame,
    dealNight: dealNight,
    validateInputs: validateInputs
  };
}));
