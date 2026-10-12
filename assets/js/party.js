/* Button Mash Party Planner — players + time + vibe + skill + inputs ->
   a timed rotation plan across the party-tagged games in the catalog.
   All data comes from the local catalog (tags on api/v1/games.json). */
(function () {
  'use strict';

  /* Vibe -> game tags it wants. Tags live on game records in games.json. */
  var VIBE_TAGS = {
    competitive: ['shooter', 'arena', 'racing', 'sports'],
    cooperative: ['coop', 'board'],
    creative: ['drawing', 'word'],
    chaotic: ['arena', 'drawing', 'word'],
    chill: ['trivia', 'board', 'word']
  };

  /* Skill mix -> tags to avoid (high skill floor for casual players). */
  var SKILL_AVOID = {
    gamers: [],
    mixed: ['shooter'],
    casual: ['shooter', 'arena', 'racing']
  };

  /* Input limits -> tags that need that hardware. */
  function inputExcluded(game, inputs) {
    var tags = game.tags || [];
    var kb = inputs.indexOf('keyboard') !== -1;
    var mouse = inputs.indexOf('mouse') !== -1;
    var touch = inputs.indexOf('touch') !== -1;
    var phone = inputs.indexOf('phone') !== -1;
    function hasAny() { return tags.some(function (t) { return ['shooter', 'racing'].indexOf(t) !== -1; }); }
    function drawing() { return tags.indexOf('drawing') !== -1; }
    if (hasAny() && !(kb && mouse)) return true;              /* shooters/racers need kb+mouse */
    if (drawing() && !(mouse || touch || phone)) return true; /* drawing needs a pointer */
    if (tags.indexOf('phone') !== -1 && !phone) return true;   /* airconsole-style hubs */
    return false;
  }

  function setupNote(game) {
    var tags = game.tags || [];
    if (game.id === 'airconsole') return 'Open airconsole.com on the big screen, everyone joins on their phone.';
    if (tags.indexOf('drawing') !== -1) return 'Private room: create a room and share the link in the group chat.';
    if (game.id === 'skribbl' || game.id === 'bonk' || game.id === 'gartic-phone') return 'Private room: create a room and share the link — 5 minutes of setup.';
    if (tags.indexOf('shooter') !== -1 || tags.indexOf('arena') !== -1) return 'Drop-in: everyone opens the link, no lobby needed.';
    if (tags.indexOf('board') !== -1) return 'Create a table/room and share the invite link.';
    return 'Open the link together and follow the on-screen setup.';
  }

  function $(id) { return document.getElementById(id); }

  function readForm() {
    var players = Math.max(1, Math.min(16, parseInt($('pp-players').value, 10) || 4));
    var minutes = parseInt($('pp-minutes').value, 10) || 60;
    function radio(name) {
      var el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }
    var inputs = Array.prototype.map.call(
      document.querySelectorAll('input[name="pp-input"]:checked'), function (el) { return el.value; });
    return { players: players, minutes: minutes, vibe: radio('pp-vibe') || 'chaotic',
             skill: radio('pp-skill') || 'mixed', inputs: inputs.length ? inputs : ['keyboard', 'mouse'] };
  }

  function pickGames(games, opts) {
    var want = VIBE_TAGS[opts.vibe] || [];
    var avoid = SKILL_AVOID[opts.skill] || [];
    var pool = games.filter(function (g) {
      var tags = g.tags || [];
      if (tags.indexOf('party') === -1) return false;
      if (!tags.some(function (t) { return want.indexOf(t) !== -1; })) return false;
      if (tags.some(function (t) { return avoid.indexOf(t) !== -1; })) return false;
      if (inputExcluded(g, opts.inputs)) return false;
      return true;
    });
    /* Stable shuffle seeded by the hour so a plan is re-runnable but varied. */
    var seed = Math.floor(Date.now() / 3600000);
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool;
  }

  function fmtTime(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + 'h ' : '') + (m ? m + 'm' : h ? '' : '0m');
  }

  function buildPlan(pool, opts) {
    var slow = opts.vibe === 'cooperative' || opts.vibe === 'chill';
    var slotLen = slow ? 30 : 20;
    var nSlots = Math.max(1, Math.min(8, Math.round(opts.minutes / slotLen)));
    if (!pool.length) return null;
    var slots = [];
    var t = 0;
    for (var s = 0; s < nSlots; s++) {
      var game = pool[s % pool.length];
      var tags = game.tags || [];
      var hotseat = tags.some(function (x) { return ['drawing', 'word', 'trivia', 'board'].indexOf(x) !== -1; });
      /* Rotation: hot-seat games pass the controller; arenas are everyone-in. */
      var starter = (s % opts.players) + 1;
      var order = [];
      for (var p = 0; p < opts.players; p++) order.push('P' + (((starter - 1 + p) % opts.players) + 1));
      slots.push({
        start: t, end: Math.min(t + slotLen, opts.minutes),
        game: game, hotseat: hotseat,
        rotation: hotseat ? order.join(' → ') : 'Everyone plays at once'
      });
      t += slotLen;
      if (t >= opts.minutes) break;
    }
    return slots;
  }

  function renderPlan(slots, opts) {
    var out = $('pp-plan');
    var summary = $('pp-summary');
    out.innerHTML = '';
    if (!slots) {
      summary.textContent = 'No games in the catalog match that combination. Try a different vibe or more inputs.';
      out.innerHTML = '<div class="empty-state"><p>No matching party games found. Loosen a filter and try again.</p></div>';
      return;
    }
    var totalMin = slots[slots.length - 1].end;
    summary.textContent = 'Party plan ready: ' + slots.length + ' games over about ' + fmtTime(totalMin) +
      ' for ' + opts.players + ' players (' + opts.vibe + ' vibe).';

    var h = BM.el('h2', '', 'Your ' + fmtTime(totalMin) + ' game night');
    h.id = 'pp-plan-heading'; h.tabIndex = -1;
    out.appendChild(h);

    var ol = document.createElement('ol');
    ol.className = 'plan-slots';
    slots.forEach(function (slot, i) {
      var li = document.createElement('li');
      li.className = 'plan-slot';
      var when = BM.el('p', 'plan-time', 'Slot ' + (i + 1) + ' · ' + fmtTime(slot.start) + '–' + fmtTime(slot.end));
      var title = BM.el('h3', '', '');
      var a = document.createElement('a');
      a.href = slot.game.url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = slot.game.title;
      title.appendChild(a);
      var why = BM.el('p', 'plan-why', slot.game.description);
      var setup = BM.el('p', 'plan-setup', 'Setup: ' + setupNote(slot.game));
      var rot = BM.el('p', 'plan-rotation', '');
      var strong = document.createElement('strong');
      strong.textContent = slot.hotseat ? '🤝 Hand the controller: ' : '⚔️ Everyone in: ';
      rot.appendChild(strong);
      rot.appendChild(document.createTextNode(slot.rotation));
      li.appendChild(when); li.appendChild(title); li.appendChild(why);
      li.appendChild(setup); li.appendChild(rot);
      ol.appendChild(li);
    });
    out.appendChild(ol);

    var tip = BM.el('p', 'plan-tip', 'Tip: the starter rotates every slot, so nobody hogs the first turn twice. ' +
      'Print this page (or save as PDF) to take the plan to the couch.');
    out.appendChild(tip);
    h.focus({ preventScroll: false });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = $('pp-generate');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var opts = readForm();
      $('pp-summary').textContent = 'Building your plan…';
      BM.loadGames().then(function (games) {
        var pool = pickGames(games, opts);
        renderPlan(buildPlan(pool, opts), opts);
      }).catch(function () {
        $('pp-summary').textContent = 'Could not load the game catalog. Check your connection and try again.';
      });
    });
  });
})();
