/* Button Mash, quick game-night lineup widget (party-planner.html).
   Wave B (server-program spec §3 + §7.7): POSTs the request to the live
   /api/game-night function first (7s timeout, the same contract as
   ApiClient.LIVE_TIMEOUT_MS), and falls back to the client-side engine
   (assets/js/game-night.js, the browser twin of lib/game-night.js) over the
   static data/v1/games.json + data/v1/kid-safe.json files. The badge next to
   the widget heading always tells the truth: "live" or
   "cached · updated HH:MM". The page never shows a broken or blank widget. */
(function () {
  'use strict';

  var POST_TIMEOUT_MS = 7000;
  var GAMES_URL = 'data/v1/games.json';
  var KIDSAFE_URL = 'data/v1/kid-safe.json';

  function $(id) { return document.getElementById(id); }

  function fmtTime(iso) {
    try { return new Date(iso).toISOString().slice(11, 16) + ' UTC'; }
    catch (e) { return 'unknown time'; }
  }

  /* Badge semantics mirror api-client.js (kept in sync by hand, api-client.js
     stays verbatim per the spec, so the POST path carries its own copy). */
  function setBadge(badgeEl, state, generatedAt, note) {
    if (!badgeEl) return;
    badgeEl.dataset.apiState = state; // live | waking | cached | none
    if (state === 'live') {
      badgeEl.textContent = 'live';
      badgeEl.title = 'Fresh from the server · ' + fmtTime(generatedAt);
    } else if (state === 'cached') {
      badgeEl.textContent = 'cached · updated ' + fmtTime(generatedAt);
      badgeEl.title = (note || 'Server unreachable, showing last published data.') +
        ' · ' + fmtTime(generatedAt);
    } else if (state === 'waking') {
      badgeEl.textContent = 'waking server…';
      badgeEl.title = 'Waiting on the server; static data shown meanwhile.';
    } else {
      badgeEl.textContent = '';
    }
  }

  function loadStaticCatalog() {
    return Promise.all([
      fetch(GAMES_URL, { cache: 'force-cache' }).then(function (r) {
        if (!r.ok) throw new Error('games ' + r.status);
        return r.json();
      }),
      fetch(KIDSAFE_URL, { cache: 'force-cache' }).then(function (r) {
        if (!r.ok) throw new Error('kid-safe ' + r.status);
        return r.json();
      })
    ]).then(function (pair) {
      var gamesEnv = pair[0], kidEnv = pair[1];
      var kidSafeIds = {};
      (kidEnv['kid-safe'] || []).forEach(function (k) { if (k.kid_safe) kidSafeIds[k.id] = true; });
      return {
        games: gamesEnv.games || [],
        kidSafeIds: kidSafeIds,
        generated_at: gamesEnv.generated_at || null
      };
    });
  }

  /* POST /api/game-night with the 7s timeout. Resolves the same result shape
     the fallback produces: { result, generatedAt, source, degraded, note }.
     Rejects on timeout / network error / non-ok envelope → caller falls back. */
  function postLineup(payload) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, POST_TIMEOUT_MS);
    return fetch('/api/game-night', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('live ' + r.status);
      return r.json();
    }).then(function (env) {
      if (!env || env.ok !== true) throw new Error('live envelope not ok');
      var meta = env.meta || {};
      return {
        result: env.data,
        generatedAt: meta.generated_at,
        source: 'live',
        degraded: !!meta.degraded,
        note: meta.note || null,
        staleSince: meta.stale_since || null
      };
    }).catch(function (e) { clearTimeout(timer); throw e; });
  }

  function clientLineup(payload) {
    // Client fallback: the browser twin scores the static catalog, the same
    // engine, same weights, same determinism as the server (parity-gated by
    // scripts/test_gamenight_parity.js).
    if (!window.BMGameNight) return Promise.reject(new Error('no client engine'));
    return loadStaticCatalog().then(function (cat) {
      var kidSet = new Set(Object.keys(cat.kidSafeIds));
      var result = window.BMGameNight.pickLineup({
        group_size: payload.group_size,
        minutes: payload.minutes,
        vibes: payload.vibe,
        kids: payload.kids
      }, { games: cat.games, kidSafeIds: kidSet, generated_at: cat.generated_at });
      return {
        result: {
          lineup: result.lineup,
          plan_notes: result.plan_notes,
          scored_from: result.scored_from,
          no_lineup_reason: result.no_lineup_reason,
          scoring_version: window.BMGameNight.SCORING_VERSION,
          metadata_as_of: cat.generated_at
        },
        generatedAt: cat.generated_at,
        source: 'static',
        degraded: true,
        note: 'Server unreachable, lineup computed in your browser from the last published catalog.',
        staleSince: null
      };
    });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderLineup(box, out) {
    var r = out.result;
    var html = '';
    var metaBits = [];
    if (r.scored_from) metaBits.push('scored from ' + r.scored_from + ' games');
    if (r.scoring_version) metaBits.push('scoring v' + r.scoring_version);
    if (r.metadata_as_of) metaBits.push('metadata as of ' + fmtTime(r.metadata_as_of));
    metaBits.push(out.source === 'live' ? 'computed live by the Curator' : 'computed in your browser');

    if (r.no_lineup_reason || !r.lineup || !r.lineup.length) {
      html += '<div class="empty-state empty-cabinet"><p class="empty-title">» NO LINEUP DEALT</p>' +
        '<p class="empty-sub">' + esc((r.plan_notes || ['No games matched that request.'])[0]) + '</p></div>';
    } else {
      html += '<ol class="ql-lineup">';
      r.lineup.forEach(function (pick, i) {
        html += '<li class="ql-pick"><h3>' + (i + 1) + '. <a href="' + esc('game.html?id=' + encodeURIComponent(pick.game_id || pick.id || '')) +
          '">' + esc(pick.title) + '</a></h3>' +
          '<p class="ql-meta">' + esc(pick.genre) + ' · slot ' + pick.slot_minutes + ' min · score ' +
          pick.score + '/100' + (pick.kid_safe ? ' · kid-safe' : '') + '</p>' +
          '<div class="ql-scorebar" role="img" aria-label="Fit score ' + pick.score + ' of 100">' +
          '<i style="width:' + Math.min(100, Math.max(0, pick.score)) + '%"></i></div>';
        if (pick.why && pick.why.length) {
          html += '<ul class="ql-why">' + pick.why.map(function (w) {
            return '<li>' + esc(w) + '</li>';
          }).join('') + '</ul>';
        }
        html += '</li>';
      });
      html += '</ol>';
    }
    if (r.plan_notes && r.plan_notes.length) {
      html += '<ul class="ql-notes">' + r.plan_notes.map(function (n) {
        return '<li>' + esc(n) + '</li>';
      }).join('') + '</ul>';
    }
    html += '<p class="ql-meta">' + esc(metaBits.join(' · ')) + '</p>';
    box.innerHTML = html;
  }

  function readInputs() {
    var group = parseInt(($('ql-group') || {}).value, 10);
    var minutes = parseInt(($('ql-minutes') || {}).value, 10);
    var vibes = [];
    var boxes = document.querySelectorAll('#ql-vibes input[type="checkbox"]:checked');
    for (var i = 0; i < boxes.length; i++) vibes.push(boxes[i].value);
    var kids = !!($('ql-kids') && $('ql-kids').checked);
    var problems = [];
    if (!Number.isInteger(group) || group < 1 || group > 12) problems.push('players must be 1-12');
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 240) problems.push('pick a time between 15 and 240 minutes');
    if (!vibes.length) problems.push('pick at least one vibe');
    return { group_size: group, minutes: minutes, vibe: vibes, kids: kids, problems: problems };
  }

  function deal() {
    var badge = $('lineup-badge');
    var box = $('ql-results');
    var errBox = $('ql-error');
    if (!box) return;
    errBox.hidden = true;
    errBox.textContent = '';
    var inputs = readInputs();
    if (inputs.problems.length) {
      errBox.textContent = 'Can\'t deal that hand: ' + inputs.problems.join('; ') + '.';
      errBox.hidden = false;
      return;
    }
    var payload = { group_size: inputs.group_size, minutes: inputs.minutes, vibe: inputs.vibe, kids: inputs.kids };
    setBadge(badge, 'waking', null, null);
    box.innerHTML = '<p class="ql-meta">Dealing from the catalog…</p>';

    postLineup(payload).then(function (out) {
      if (out.degraded) {
        setBadge(badge, 'cached', out.staleSince || out.generatedAt, out.note);
      } else {
        setBadge(badge, 'live', out.generatedAt, null);
      }
      renderLineup(box, out);
    }).catch(function () {
      // Live missed, client fallback over the static catalog.
      clientLineup(payload).then(function (out) {
        setBadge(badge, 'cached', out.generatedAt, out.note);
        renderLineup(box, out);
      }).catch(function () {
        setBadge(badge, 'none', null, null);
        box.innerHTML = '<div class="empty-state empty-cabinet"><p class="empty-title">» CABINET OFFLINE</p>' +
          '<p class="empty-sub">The server didn\'t answer and the local catalog couldn\'t load. ' +
          'Check your connection and try again.</p></div>';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var go = $('ql-go');
    if (go) go.addEventListener('click', deal);
    var form = $('quick-lineup-form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); deal(); });
  });
})();
