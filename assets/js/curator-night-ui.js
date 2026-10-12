/* curator-night-ui.js — Game Night: the Curator deals your night (wave 21).
   Client-side only, by design: the v2 engine (assets/js/curator-night.js)
   scores the static data/v1 catalog right here in the browser. No server,
   nothing stored, nothing sent anywhere.

   The ceremony: DEAL THE NIGHT -> "SHUFFLING THE DECK…" beat -> slots
   revealed one at a time like a marquee lighting up, announced via
   aria-live. Reduced-motion and FX-off skip straight to the full lineup. */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function motionOK() {
    var rm = false;
    try { rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    return !rm && !document.documentElement.classList.contains('fx-off');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CATALOG = null; /* { games, kidSafeIds, generated_at } */

  function loadCatalog() {
    return Promise.all([
      fetch('data/v1/games.json', { cache: 'force-cache' }).then(function (r) {
        if (!r.ok) throw new Error('games.json ' + r.status);
        return r.json();
      }),
      fetch('data/v1/kid-safe.json', { cache: 'force-cache' }).then(function (r) {
        if (!r.ok) throw new Error('kid-safe.json ' + r.status);
        return r.json();
      })
    ]).then(function (docs) {
      var games = docs[0].games || [];
      var kids = docs[1]['kid-safe'] || [];
      var set = {};
      kids.forEach(function (k) { set[k.id] = 1; });
      CATALOG = { games: games, kidSafeIds: set, generated_at: docs[0].generated_at || null };
      return CATALOG;
    });
  }

  /* ---- form wiring ---- */
  function readForm() {
    var group = parseInt($('cn-group').value, 10);
    var minutes = parseInt($('cn-minutes').value, 10);
    var vibes = Array.prototype.slice.call(document.querySelectorAll('#cn-vibes input:checked'))
      .map(function (el) { return el.value; });
    var skillEl = document.querySelector('input[name="cn-skill"]:checked');
    return {
      group_size: group,
      minutes: minutes,
      vibes: vibes,
      skill: skillEl ? skillEl.value : 'mixed',
      kids: $('cn-kids').checked
    };
  }

  function syncRange(id, valId, fmt) {
    var r = $(id), v = $(valId);
    if (!r || !v) return;
    var paint = function () { v.textContent = fmt(parseInt(r.value, 10)); };
    r.addEventListener('input', paint);
    paint();
  }

  function showError(msgs) {
    var box = $('cn-error');
    box.hidden = false;
    box.innerHTML = '';
    msgs.forEach(function (m, i) {
      var p = document.createElement('p');
      p.style.margin = i ? '0.35rem 0 0' : '0';
      p.textContent = '» ' + m;
      box.appendChild(p);
    });
    box.scrollIntoView({ block: 'nearest' });
  }
  function clearError() { var box = $('cn-error'); box.hidden = true; box.innerHTML = ''; }

  /* ---- suggestion seeds: house presets, rotated daily ---- */
  var SEED_PRESETS = [
    { name: 'FRIDAY CHAOS', sub: '6 players · 2 hours · chaotic + party', group_size: 6, minutes: 120, vibes: ['chaotic', 'party'], skill: 'mixed', kids: false },
    { name: 'COZY COUCH', sub: '2 players · 1 hour · cozy + chill', group_size: 2, minutes: 60, vibes: ['cozy', 'chill'], skill: 'casual', kids: false },
    { name: 'SCORE CHASERS', sub: '4 players · 90 min · competitive', group_size: 4, minutes: 90, vibes: ['competitive'], skill: 'gamers', kids: false },
    { name: 'KIDS TABLE', sub: '5 players · 1 hour · party · kid-safe', group_size: 5, minutes: 60, vibes: ['party'], skill: 'casual', kids: true },
    { name: 'SOLO DESCENT', sub: '1 player · 2 hours · chill', group_size: 1, minutes: 120, vibes: ['chill'], skill: 'mixed', kids: false },
    { name: 'LUNCH BREAK', sub: '3 players · 30 min · party', group_size: 3, minutes: 30, vibes: ['party', 'chaotic'], skill: 'mixed', kids: false }
  ];
  function seedSuggestions() {
    var now = new Date();
    var day = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
    var row = $('cn-seeds');
    for (var i = 0; i < 3; i++) {
      var p = SEED_PRESETS[(day + i * 2) % SEED_PRESETS.length];
      (function (preset) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cn-seed';
        var nm = document.createElement('strong');
        nm.textContent = preset.name;
        var sb = document.createElement('small');
        sb.textContent = preset.sub;
        b.appendChild(nm);
        b.appendChild(sb);
        b.setAttribute('aria-label', 'Load the ' + preset.name + ' preset into the form');
        b.addEventListener('click', function () {
          $('cn-group').value = preset.group_size;
          $('cn-minutes').value = preset.minutes;
          $('cn-group').dispatchEvent(new Event('input'));
          $('cn-minutes').dispatchEvent(new Event('input'));
          Array.prototype.forEach.call(document.querySelectorAll('#cn-vibes input'), function (el) {
            el.checked = preset.vibes.indexOf(el.value) !== -1;
          });
          var sk = document.querySelector('input[name="cn-skill"][value="' + preset.skill + '"]');
          if (sk) sk.checked = true;
          $('cn-kids').checked = preset.kids;
          clearError();
          $('cn-stage').scrollIntoView({ block: 'start', behavior: motionOK() ? 'smooth' : 'auto' });
        });
        row.appendChild(b);
      })(p);
    }
  }

  /* ---- the ceremony ---- */
  function slotCard(slot, idx) {
    var li = document.createElement('li');
    li.className = 'cn-slot';
    li.setAttribute('data-role', slot.role);
    li.style.setProperty('--reveal-delay', (idx * 160) + 'ms');

    var head = document.createElement('div');
    head.className = 'cn-slot-head';
    var role = document.createElement('span');
    role.className = 'cn-role';
    role.textContent = slot.role_label;
    var h3 = document.createElement('h3');
    var a = document.createElement('a');
    a.href = slot.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = slot.title;
    a.setAttribute('aria-label', slot.title + ' — play at ' + slot.url.replace(/^https?:\/\//, '').split('/')[0] + ' (opens in a new tab)');
    h3.appendChild(a);
    head.appendChild(role);
    head.appendChild(h3);
    li.appendChild(head);

    var meta = document.createElement('p');
    meta.className = 'cn-meta';
    var bits = [
      '~' + slot.session_est + ' min',
      slot.genre,
      slot.floor_label,
      slot.energy_label,
      slot.score + '/100'
    ];
    if (slot.capacity > 1) bits.splice(2, 0, 'seats ~' + slot.capacity);
    if (slot.kid_safe) bits.push('• KID SAFE');
    meta.textContent = bits.join(' · ');
    li.appendChild(meta);

    var why = document.createElement('ul');
    why.className = 'cn-why';
    slot.why.slice(0, 3).forEach(function (w) {
      var wli = document.createElement('li');
      wli.textContent = w;
      why.appendChild(wli);
    });
    var file = document.createElement('li');
    var fa = document.createElement('a');
    fa.href = 'game.html?id=' + encodeURIComponent(slot.game_id);
    fa.textContent = 'full game file'; /* the li::before already prints » */
    file.appendChild(fa);
    why.appendChild(file);
    li.appendChild(why);

    return li;
  }

  function renderNight(result) {
    var stage = $('cn-stage');
    stage.innerHTML = '';
    var live = $('cn-announcer');

    if (!result.lineup.length) {
      var empty = document.createElement('div');
      empty.className = 'cn-shuffle';
      empty.textContent = '» ' + (result.plan_notes[0] || 'No lineup.');
      stage.appendChild(empty);
      live.textContent = 'The Curator could not deal a night for these settings.';
      return;
    }

    /* Summary first (screen readers + print get the shape of the night). */
    var sum = document.createElement('div');
    sum.className = 'cn-summary';
    var in0 = result.inputs_echo;
    sum.innerHTML =
      '<span class="mono">~' + result.total_est_minutes + ' MIN</span> across ' +
      result.lineup.length + ' picks · ' + in0.group_size +
      (in0.group_size === 1 ? ' player' : ' players') + ' · ' +
      result.lineup.filter(function (s, i, arr) { return arr.findIndex(function (x) { return x.genre === s.genre; }) === i; }).length +
      ' genres · dealt from ' + result.scored_from + ' eligible games';
    stage.appendChild(sum);

    var ol = document.createElement('ol');
    ol.className = 'cn-slots';
    ol.setAttribute('aria-label', 'Your game-night lineup');
    stage.appendChild(ol);

    var notes = document.createElement('ul');
    notes.className = 'cn-notes';
    result.plan_notes.forEach(function (n) {
      var nli = document.createElement('li');
      nli.textContent = n;
      notes.appendChild(nli);
    });
    stage.appendChild(notes);

    var actions = document.createElement('div');
    actions.className = 'cn-actions';
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-ghost';
    copyBtn.textContent = '» Copy the night as text';
    var printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.className = 'btn btn-ghost';
    printBtn.textContent = '» Print the night';
    var copyNote = document.createElement('span');
    copyNote.className = 'cn-copy-note';
    copyNote.setAttribute('role', 'status');
    actions.appendChild(copyBtn);
    actions.appendChild(printBtn);
    actions.appendChild(copyNote);
    stage.appendChild(actions);

    copyBtn.addEventListener('click', function () {
      var txt = nightAsText(result);
      var done = function (ok) {
        copyNote.textContent = ok ? 'Copied — paste it in the group chat.' : 'Copy failed — select and copy manually.';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
    printBtn.addEventListener('click', function () { window.print(); });

    /* The reveal: one slot at a time. Reduced-motion / FX-off: all at once. */
    var slots = result.lineup.map(function (s, i) { return slotCard(s, i); });
    if (!motionOK()) {
      slots.forEach(function (el) { ol.appendChild(el); });
      live.textContent = 'Your lineup is dealt: ' + result.lineup.length + ' picks, about ' +
        result.total_est_minutes + ' minutes. First up: ' + result.lineup[0].role_label + ' — ' +
        result.lineup[0].title + '.';
      return;
    }
    var i = 0;
    function revealNext() {
      if (i >= slots.length) return;
      var s = result.lineup[i];
      ol.appendChild(slots[i]);
      live.textContent = 'Slot ' + (i + 1) + ' of ' + slots.length + ' — ' + s.role_label + ': ' + s.title + '.';
      i++;
      if (i < slots.length) setTimeout(revealNext, 520);
    }
    revealNext();
  }

  function nightAsText(result) {
    var in0 = result.inputs_echo;
    var lines = [
      'GAME NIGHT — dealt by the Curator (Button Mash)',
      in0.group_size + (in0.group_size === 1 ? ' player' : ' players') + ' · ' +
        in0.minutes + ' min · ' + in0.vibes.join('/') + ' · ' + in0.skill +
        (in0.kids ? ' · kids table' : ''),
      ''
    ];
    result.lineup.forEach(function (s, i) {
      lines.push((i + 1) + '. ' + s.role_label + ' — ' + s.title + ' (~' + s.session_est + ' min, ' + s.floor_label + ', ' + s.energy_label + (s.capacity > 1 ? ', seats ~' + s.capacity : '') + ')');
      lines.push('   ' + s.url);
    });
    lines.push('');
    lines.push('~' + result.total_est_minutes + ' min of play estimated; the rest is snacks and rematches.');
    lines.push('Session lengths, seats, energy + skill floors are curator estimates, not measured times.');
    return lines.join('\n');
  }

  function deal() {
    clearError();
    if (!CATALOG) {
      showError(['The catalog is still loading — one more second.']);
      return;
    }
    var raw = readForm();
    var v = window.BMCuratorNight.validateInputs(raw);
    if (!v.ok) { showError(v.errors); return; }

    var stage = $('cn-stage');
    var live = $('cn-announcer');
    var result = window.BMCuratorNight.dealNight(v.inputs, CATALOG);

    if (!motionOK()) { renderNight(result); return; }

    /* The ceremony beat: shuffle, then the marquee lights up. */
    stage.innerHTML = '';
    var sh = document.createElement('div');
    sh.className = 'cn-shuffle';
    sh.textContent = '» SHUFFLING THE DECK…';
    stage.appendChild(sh);
    live.textContent = 'Shuffling the deck…';
    setTimeout(function () { renderNight(result); }, 650);
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncRange('cn-group', 'cn-group-val', function (n) { return n + (n === 1 ? ' player' : ' players'); });
    syncRange('cn-minutes', 'cn-minutes-val', function (n) {
      if (n < 60) return n + ' min';
      var h = Math.floor(n / 60), m = n % 60;
      return h + 'h' + (m ? ' ' + m + 'm' : '');
    });
    seedSuggestions();

    $('cn-deal').addEventListener('click', deal);
    $('cn-form').addEventListener('submit', function (e) { e.preventDefault(); deal(); });

    loadCatalog().then(function (c) {
      var meta = $('cn-catalog-meta');
      if (meta) {
        var when = c.generated_at ? c.generated_at.slice(0, 10) : 'unknown date';
        meta.textContent = 'Catalog: ' + c.games.length + ' verified browser games · published ' + when +
          ' · every pick links the game\'s own verified page, never a download.';
      }
    }).catch(function () {
      var stage = $('cn-stage');
      stage.innerHTML = '';
      var off = document.createElement('div');
      off.className = 'cn-shuffle';
      off.textContent = '» CABINET OFFLINE — the game catalog could not be loaded. Check your connection and reload.';
      stage.appendChild(off);
      $('cn-deal').disabled = true;
    });
  });
})();
