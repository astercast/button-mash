/* Button Mash Party Planner 2.0 — guest list, game voting, rotation
   scheduler, snack-break timer, party timeline, tournament handoff 2.0,
   share links, print party pack, copy-as-text, kids-party mode.
   Pure logic lives in party2.js (Party2); this file is the DOM layer and
   needs BM (store.js) + Party2 loaded first. */
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

  var KID_SAFE_URL = 'api/v1/kid-safe.json';
  var KID_GAMES_URL = 'api/v1/games.json';

  var catalog = [];       // full catalog records
  var byId = {};          // id -> record
  var kidRecords = [];    // kid-safe.json "kid-safe" records
  var kidIds = {};        // kid-safe id set
  var party = null;       // Party2 state {guests, opts, games, votes}
  var slots = [];         // derived slots (records + times)
  var rotations = [];     // Party2.scheduleRotation output
  var timeline = null;    // Party2.buildTimeline output
  var snackTimer = null;  // {remaining, total, handle, paused}

  function $(id) { return document.getElementById(id); }

  /* ---------- shared catalog filters (wave 3 logic, unchanged) ---------- */

  function inputExcluded(game, inputs) {
    var tags = game.tags || [];
    var kb = inputs.indexOf('keyboard') !== -1;
    var mouse = inputs.indexOf('mouse') !== -1;
    var touch = inputs.indexOf('touch') !== -1;
    var phone = inputs.indexOf('phone') !== -1;
    function hasAny() { return tags.some(function (t) { return ['shooter', 'racing'].indexOf(t) !== -1; }); }
    function drawing() { return tags.indexOf('drawing') !== -1; }
    if (hasAny() && !(kb && mouse)) return true;
    if (drawing() && !(mouse || touch || phone)) return true;
    if (tags.indexOf('phone') !== -1 && !phone) return true;
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

  function hourShuffle(arr) {
    /* Stable shuffle seeded by the hour so a plan is re-runnable but varied. */
    var seed = Math.floor(Date.now() / 3600000);
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  /* ---------- form reading ---------- */

  function readGuests() {
    var ta = $('pp-guests-list');
    if (!ta) return [];
    var seen = {}, out = [];
    ta.value.split('\n').forEach(function (line) {
      var n = line.trim().replace(/\s+/g, ' ');
      if (!n || seen[n]) return;
      seen[n] = true;
      if (n.length <= 32) out.push(n);
    });
    return out;
  }

  function readForm() {
    function radio(name) {
      var el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }
    var inputs = Array.prototype.map.call(
      document.querySelectorAll('input[name="pp-input"]:checked'), function (el) { return el.value; });
    var kids = !!($('pp-kids') && $('pp-kids').checked);
    var kb = $('pp-kidband');
    var fmt = $('pp-format');
    var snack = $('pp-snackmin');
    var start = $('pp-start');
    return {
      guests: readGuests(),
      minutes: parseInt($('pp-minutes').value, 10) || 60,
      vibe: kids ? 'chaotic' : (radio('pp-vibe') || 'chaotic'),
      skill: radio('pp-skill') || 'mixed',
      inputs: inputs.length ? inputs : ['keyboard', 'mouse'],
      kids: kids,
      kidBand: kb ? kb.value : '8-10',
      startClock: start && start.value ? start.value : null,
      snackMin: snack ? (parseInt(snack.value, 10) || 15) : 15,
      format: fmt ? fmt.value : 'single'
    };
  }

  function updateGuestCount() {
    var c = $('pp-count');
    if (c) {
      var n = readGuests().length;
      c.textContent = n + (n === 1 ? ' guest' : ' guests');
    }
  }

  function syncKidsMode() {
    var kids = !!($('pp-kids') && $('pp-kids').checked);
    var opts = $('pp-kids-opts');
    if (opts) opts.hidden = !kids;
    ['pp-vibe-fieldset', 'pp-skill-fieldset'].forEach(function (id) {
      var fs = $(id);
      if (!fs) return;
      fs.classList.toggle('pp-fieldset-disabled', kids);
      Array.prototype.forEach.call(fs.querySelectorAll('input'), function (inp) {
        inp.disabled = kids;
      });
    });
  }

  /* ---------- game pool ---------- */

  function pickGames(opts) {
    if (opts.kids) {
      /* Kids party: the kid-safe catalog only, youngest-band filter,
         sorted youngest band first, hot-seat by design. */
      var ids = Party2.kidPool(kidRecords, opts.kidBand);
      var recs = ids.map(function (id) { return byId[id]; }).filter(Boolean);
      var rank = { '5-7': 0, '8-10': 1, '11-12': 2 };
      recs.sort(function (a, b) {
        var ka = kidRecords.filter(function (r) { return r.id === a.id; })[0];
        var kb2 = kidRecords.filter(function (r) { return r.id === b.id; })[0];
        return (rank[ka ? ka.age_band : '11-12'] || 0) - (rank[kb2 ? kb2.age_band : '11-12'] || 0);
      });
      return hourShuffle(recs);
    }
    var want = VIBE_TAGS[opts.vibe] || [];
    var avoid = SKILL_AVOID[opts.skill] || [];
    var pool = catalog.filter(function (g) {
      var tags = g.tags || [];
      if (tags.indexOf('party') === -1) return false;
      if (!tags.some(function (t) { return want.indexOf(t) !== -1; })) return false;
      if (tags.some(function (t) { return avoid.indexOf(t) !== -1; })) return false;
      if (inputExcluded(g, opts.inputs)) return false;
      return true;
    });
    return hourShuffle(pool);
  }

  function fmtTime(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + 'h ' : '') + (m ? m + 'm' : h ? '' : '0m');
  }

  function buildSlots(orderedGames, opts) {
    var slow = opts.vibe === 'cooperative' || opts.vibe === 'chill';
    var slotLen = slow ? 30 : 20;
    var nSlots = Math.max(1, Math.min(8, Math.round(opts.minutes / slotLen)));
    var out = [];
    var t = 0;
    for (var s = 0; s < nSlots; s++) {
      var game = orderedGames[s % orderedGames.length];
      if (!game) break;
      var hotseat = opts.kids ? true : Party2.isHotseat(game);
      out.push({
        gameId: game.id, title: game.title, url: game.url,
        description: game.description, tags: game.tags || [],
        hotseat: hotseat, start: t, end: Math.min(t + slotLen, opts.minutes)
      });
      t += slotLen;
      if (t >= opts.minutes) break;
    }
    return out;
  }

  function voteOrder() {
    /* Slot game order: voted games first (votes desc, ties -> earliest
       pick), then the rest of the pool in pool order. */
    if (!party) return [];
    var tally = Party2.tally(party);
    var votedIds = tally.filter(function (t) { return t.count > 0; }).map(function (t) { return t.gameId; });
    var seen = {};
    votedIds.forEach(function (id) { seen[id] = true; });
    var rest = party.games.filter(function (id) { return !seen[id]; });
    var ids = votedIds.concat(rest);
    return ids.map(function (id) { return byId[id]; }).filter(Boolean);
  }

  function rebuildDerived() {
    var ordered = voteOrder();
    if (!ordered.length) ordered = party.games.map(function (id) { return byId[id]; }).filter(Boolean);
    slots = buildSlots(ordered, party.opts);
    rotations = Party2.scheduleRotation(party.guests, slots);
    var snackIdx = Math.floor((slots.length - 1) / 2);
    timeline = Party2.buildTimeline(party.opts, slots, snackIdx);
  }

  /* ---------- renderers ---------- */

  function slotWhen(slot) {
    if (party.opts.startClock) {
      var parts = party.opts.startClock.split(':');
      var base = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      return fmtClock(base + slot.start) + '–' + fmtClock(base + slot.end);
    }
    return 'Slot time ' + fmtTime(slot.start) + '–' + fmtTime(slot.end);
  }

  function fmtClock(totalMin) {
    totalMin = ((totalMin % 1440) + 1440) % 1440;
    var h = Math.floor(totalMin / 60), m = totalMin % 60;
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function renderPlan() {
    var out = $('pp-plan');
    var summary = $('pp-summary');
    if (!out || !summary) return;
    out.innerHTML = '';
    if (!slots.length) {
      summary.textContent = 'No games in the catalog match that combination. Try a different vibe or more inputs.';
      out.innerHTML = '<div class="empty-state"><p>No matching party games found. Loosen a filter and try again.</p></div>';
      return;
    }
    var totalMin = slots[slots.length - 1].end;
    var kidNote = party.opts.kids ? ' (kids party — kid-safe picks)' : '';
    summary.textContent = 'Party plan ready: ' + slots.length + ' games over about ' + fmtTime(totalMin) +
      ' for ' + party.guests.length + ' guests' + kidNote + '.';

    var h = BM.el('h2', '', 'Your ' + fmtTime(totalMin) + ' game night');
    h.id = 'pp-plan-heading'; h.tabIndex = -1;
    out.appendChild(h);

    /* Timeline: setup -> games -> snack -> tournament -> free play */
    var th = BM.el('h3', '', 'Party timeline');
    th.id = 'pp-timeline-heading'; th.tabIndex = -1;
    out.appendChild(th);
    var tl = document.createElement('ol');
    tl.className = 'pp-timeline';
    tl.setAttribute('aria-label', 'Party timeline');
    timeline.phases.forEach(function (ph) {
      var li = document.createElement('li');
      li.className = 'tl-phase';
      li.setAttribute('data-phase', ph.phase);
      var when = BM.el('p', 'tl-when',
        ph.clockStart ? (ph.clockStart + ' – ' + ph.clockEnd) : ('+' + fmtTime(Math.max(0, ph.start)) + ' – +' + fmtTime(ph.end)));
      li.appendChild(when);
      var p = BM.el('p', '', ph.label);
      if (ph.phase === 'tournament') {
        p.appendChild(document.createTextNode(' '));
        var link = document.createElement('a');
        link.href = handoffUrl();
        link.textContent = 'Open the bracket';
        p.appendChild(link);
      }
      li.appendChild(p);
      tl.appendChild(li);
    });
    out.appendChild(tl);

    /* Game slots with rotation */
    var sh = BM.el('h3', '', 'Game slots & rotation');
    out.appendChild(sh);
    var ol = document.createElement('ol');
    ol.className = 'plan-slots';
    slots.forEach(function (slot, i) {
      var rot = rotations[i];
      var li = document.createElement('li');
      li.className = 'plan-slot';
      li.appendChild(BM.el('p', 'plan-time', 'Slot ' + (i + 1) + ' · ' + slotWhen(slot)));
      var title = BM.el('h3', '', '');
      var a = document.createElement('a');
      a.href = slot.url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = slot.title;
      title.appendChild(a);
      li.appendChild(title);
      li.appendChild(BM.el('p', 'plan-why', slot.description));
      li.appendChild(BM.el('p', 'plan-setup', 'Setup: ' + setupNote({ id: slot.gameId, tags: slot.tags })));
      var rotP = BM.el('p', 'plan-rotation', '');
      var strong = document.createElement('strong');
      if (slot.hotseat) {
        strong.textContent = '🤝 Hand the controller: ';
        rotP.appendChild(strong);
        var names = rot.plays.map(function (g, k) {
          return (k === 0 ? g + ' starts' : g);
        }).join(' → ');
        rotP.appendChild(document.createTextNode(names));
        if (rot.sits.length) {
          rotP.appendChild(document.createElement('br'));
          var sit = document.createElement('span');
          sit.textContent = 'Sits this round: ' + rot.sits.join(', ') + ' (they\'re up next round)';
          rotP.appendChild(sit);
        }
      } else {
        strong.textContent = '⚔️ Everyone in: ';
        rotP.appendChild(strong);
        rotP.appendChild(document.createTextNode(party.guests.join(', ')));
      }
      li.appendChild(rotP);
      ol.appendChild(li);
    });
    out.appendChild(ol);

    renderVotePanel(out);
    renderTimer(out);
    renderActions(out);

    var tip = BM.el('p', 'plan-tip', 'Tip: the starting player rotates every slot, so nobody hogs the first turn twice. ' +
      'Print this page (or save as PDF) to take the party pack to the couch.');
    out.appendChild(tip);
    h.focus({ preventScroll: false });
  }

  /* ---------- voting UI ---------- */

  function renderVotePanel(out) {
    var panel = BM.el('section', 'vote-panel', '');
    panel.id = 'pp-vote';
    panel.setAttribute('aria-label', 'Vote on the games');
    panel.appendChild(BM.el('h2', '', '🗳️ Vote on the games'));
    panel.appendChild(BM.el('p', 'pp-note',
      'One vote per guest — voting again moves your vote. Ties go to the game picked earliest. ' +
      'Voted games lead the plan, and the tournament handoff takes the top picks.'));

    var row = BM.el('div', 'vote-row', '');
    var gLab = document.createElement('label');
    gLab.appendChild(document.createTextNode('Guest'));
    var gSel = document.createElement('select');
    gSel.id = 'pp-vote-guest';
    party.guests.forEach(function (g) {
      var o = document.createElement('option');
      o.value = g; o.textContent = g;
      gSel.appendChild(o);
    });
    gLab.appendChild(gSel);
    var gmLab = document.createElement('label');
    gmLab.appendChild(document.createTextNode('Game'));
    var gmSel = document.createElement('select');
    gmSel.id = 'pp-vote-game';
    var cands = party.games.slice(0, 12).map(function (id) { return byId[id]; }).filter(Boolean);
    cands.forEach(function (g) {
      var o = document.createElement('option');
      o.value = g.id; o.textContent = g.title;
      gmSel.appendChild(o);
    });
    gmLab.appendChild(gmSel);
    row.appendChild(gLab); row.appendChild(gmLab);
    var voteBtn = BM.el('button', 'btn btn-primary', 'Cast vote');
    voteBtn.type = 'button'; voteBtn.id = 'pp-vote-cast';
    row.appendChild(voteBtn);
    var applyBtn = BM.el('button', 'btn', '↻ Rebuild plan with voted games');
    applyBtn.type = 'button'; applyBtn.id = 'pp-vote-apply';
    row.appendChild(applyBtn);
    panel.appendChild(row);

    var ul = document.createElement('ul');
    ul.className = 'vote-tally';
    ul.id = 'pp-vote-tally';
    ul.setAttribute('aria-live', 'polite');
    panel.appendChild(ul);
    renderTally(ul);

    voteBtn.addEventListener('click', function () {
      var r = Party2.addVote(party, gSel.value, gmSel.value);
      if (r.ok) { renderTally(ul); persistInputs(); }
      else { announce('Vote not counted: ' + r.error); }
    });
    applyBtn.addEventListener('click', function () {
      rebuildDerived();
      renderPlan();
      announce('Plan rebuilt with the voted games first.');
    });
    out.appendChild(panel);
  }

  function renderTally(ul) {
    ul.innerHTML = '';
    var tally = Party2.tally(party);
    var voted = tally.filter(function (t) { return t.count > 0; });
    if (!voted.length) {
      ul.appendChild(BM.el('li', '', 'No votes yet — be the first.'));
      return;
    }
    voted.forEach(function (t) {
      var g = byId[t.gameId];
      var li = BM.el('li', '', '');
      var name = document.createElement('strong');
      name.textContent = g ? g.title : t.gameId;
      li.appendChild(name);
      var voters = Object.keys(party.votes).filter(function (v) { return party.votes[v] === t.gameId; });
      li.appendChild(document.createTextNode(t.count + ' vote' + (t.count === 1 ? '' : 's') + ' — ' + voters.join(', ')));
      ul.appendChild(li);
    });
  }

  /* ---------- snack-break timer ---------- */

  function renderTimer(out) {
    var box = BM.el('section', 'pp-timer', '');
    box.id = 'pp-timer';
    box.setAttribute('aria-label', 'Snack-break timer');
    box.appendChild(BM.el('h2', '', '⏲️ Snack-break timer'));
    box.appendChild(BM.el('p', 'pp-note',
      'When the timeline hits the snack break, start the timer — it counts down the ' +
      party.opts.snackMin + '-minute break.'));
    var face = BM.el('p', 'timer-face', fmtTimer(party.opts.snackMin * 60));
    face.id = 'pp-timer-face';
    face.setAttribute('role', 'timer');
    face.setAttribute('aria-label', 'Snack-break time remaining');
    box.appendChild(face);
    var ctrls = BM.el('div', 'timer-controls pp-actions', '');
    ['Start', 'Pause', 'Reset'].forEach(function (label) {
      var b = BM.el('button', 'btn', label);
      b.type = 'button';
      b.id = 'pp-timer-' + label.toLowerCase();
      b.addEventListener('click', function () { timerControl(label.toLowerCase()); });
      ctrls.appendChild(b);
    });
    box.appendChild(ctrls);
    out.appendChild(box);
    resetTimer();
  }

  function fmtTimer(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function resetTimer() {
    if (snackTimer && snackTimer.handle) { clearInterval(snackTimer.handle); }
    snackTimer = { remaining: party.opts.snackMin * 60, total: party.opts.snackMin * 60,
                   handle: null, paused: true };
    var face = $('pp-timer-face');
    if (face) face.textContent = fmtTimer(snackTimer.remaining);
  }

  function timerControl(action) {
    var face = $('pp-timer-face');
    if (!snackTimer || !face) return;
    if (action === 'reset') {
      resetTimer();
      announce('Snack timer reset to ' + fmtTimer(snackTimer.remaining) + '.');
      return;
    }
    if (action === 'pause') {
      if (snackTimer.handle) { clearInterval(snackTimer.handle); snackTimer.handle = null; snackTimer.paused = true; }
      announce('Snack timer paused at ' + fmtTimer(snackTimer.remaining) + '.');
      return;
    }
    /* start */
    if (snackTimer.handle) return;
    if (snackTimer.remaining <= 0) resetTimer();
    snackTimer.paused = false;
    announce('Snack timer started — ' + fmtTimer(snackTimer.remaining) + ' remaining.');
    snackTimer.handle = setInterval(function () {
      snackTimer.remaining--;
      face.textContent = fmtTimer(Math.max(0, snackTimer.remaining));
      if (snackTimer.remaining <= 0) {
        clearInterval(snackTimer.handle); snackTimer.handle = null;
        announce('Snack break over — back to the games!');
      }
    }, 1000);
  }

  /* ---------- share / print / copy / handoff ---------- */

  function partyUrl() {
    return window.location.href.split('#')[0] + '#p=' + Party2.encodeShare(party);
  }

  function handoffUrl() {
    var names = party.guests.map(encodeURIComponent).join(',');
    var votedIds = Party2.topVoted(party, 8);
    var games = votedIds.length ? votedIds : party.games.slice(0, 8);
    return 'tournament.html?players=' + party.guests.length +
      '&names=' + names + '&games=' + games.join(',') + '&format=' + party.opts.format;
  }

  function planText() {
    var L = [];
    var totalMin = slots.length ? slots[slots.length - 1].end : 0;
    L.push('GAME NIGHT — ' + party.guests.length + ' guests, about ' + fmtTime(totalMin) +
      (party.opts.kids ? ' (kids party)' : ''));
    L.push('Guests: ' + party.guests.join(', '));
    L.push('');
    L.push('TIMELINE');
    timeline.phases.forEach(function (ph) {
      var when = ph.clockStart ? (ph.clockStart + '–' + ph.clockEnd)
        : ('+' + fmtTime(Math.max(0, ph.start)) + '–+' + fmtTime(ph.end));
      L.push('  [' + when + '] ' + ph.label);
    });
    L.push('');
    L.push('GAMES');
    slots.forEach(function (slot, i) {
      var rot = rotations[i];
      L.push('  ' + (i + 1) + '. ' + slot.title + ' (' + slotWhen(slot) + ')');
      if (slot.hotseat) {
        L.push('     Play: ' + rot.plays.join(' → ') + (rot.sits.length ? ' | sits out: ' + rot.sits.join(', ') : ''));
      } else {
        L.push('     Everyone plays at once.');
      }
    });
    var voted = Party2.tally(party).filter(function (t) { return t.count > 0; });
    if (voted.length) {
      L.push('');
      L.push('VOTES');
      voted.forEach(function (t) {
        var g = byId[t.gameId];
        var voters = Object.keys(party.votes).filter(function (v) { return party.votes[v] === t.gameId; });
        L.push('  ' + (g ? g.title : t.gameId) + ' — ' + t.count + ' (' + voters.join(', ') + ')');
      });
    }
    L.push('');
    L.push('Tournament for this party: ' + window.location.href.split('?')[0].replace(/party-planner\.html$/, '') + handoffUrl());
    L.push('Share this party: ' + partyUrl());
    return L.join('\n');
  }

  function announce(msg) {
    var s = $('pp-summary');
    if (s) s.textContent = msg;
  }

  function copyText(text, msg) {
    function done() { announce(msg); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  function renderActions(out) {
    var wrap = BM.el('div', 'pp-actions no-print', '');
    function btn(id, text, cls) {
      var b = BM.el('button', cls || 'btn', text);
      b.type = 'button'; b.id = id;
      wrap.appendChild(b);
      return b;
    }
    btn('pp-share', '🔗 Copy party link', 'btn btn-cyan').addEventListener('click', function () {
      copyText(partyUrl(), 'Party link copied — anyone opening it gets this exact party plan.');
    });
    btn('pp-copytext', '📋 Copy plan as text').addEventListener('click', function () {
      copyText(planText(), 'Party plan copied as text — paste it in the group chat.');
    });
    btn('pp-print', '🖨️ Print party pack').addEventListener('click', function () { window.print(); });
    if (party.guests.length >= 2) {
      var a = document.createElement('a');
      a.className = 'btn btn-primary';
      a.href = handoffUrl();
      a.textContent = '🏆 Run a tournament for this party';
      wrap.appendChild(a);
    }
    out.appendChild(wrap);
    var note = BM.el('p', 'pp-share-note no-print', 'Party links stay in the URL — no account, no server. Anyone with the link sees the plan.');
    out.appendChild(note);
  }

  /* ---------- share import ---------- */

  function initFromHash() {
    try {
      if (!window.location.hash || window.location.hash.indexOf('#p=') !== 0) return null;
      var d = Party2.decodeShare(window.location.hash.slice(3));
      if (!d.ok) {
        announce('Party link problem: ' + d.error);
        return null;
      }
      var known = d.state.games.filter(function (id) { return byId[id]; });
      var dropped = d.state.games.filter(function (id) { return !byId[id]; });
      d.state.games = known;
      if (!known.length) {
        announce('Party link problem: none of its games are in the catalog anymore.');
        return null;
      }
      d.state.droppedNote = dropped.length ? (dropped.length + ' game' + (dropped.length === 1 ? '' : 's') +
        ' from the link ' + (dropped.length === 1 ? 'is' : 'are') + ' no longer in the catalog.') : null;
      return d.state;
    } catch (e) { return null; }
  }

  function applyStateToForm(state) {
    var ta = $('pp-guests-list');
    if (ta) ta.value = state.guests.join('\n');
    var mins = $('pp-minutes');
    if (mins) mins.value = String(state.opts.minutes);
    var start = $('pp-start');
    if (start) start.value = state.opts.startClock || '';
    var snack = $('pp-snackmin');
    if (snack) snack.value = String(state.opts.snackMin);
    var fmt = $('pp-format');
    if (fmt) fmt.value = state.opts.format;
    var kids = $('pp-kids');
    if (kids) kids.checked = !!state.opts.kids;
    var band = $('pp-kidband');
    if (band) band.value = state.opts.kidBand;
    document.querySelectorAll('input[name="pp-vibe"]').forEach(function (el) {
      el.checked = el.value === state.opts.vibe;
    });
    document.querySelectorAll('input[name="pp-skill"]').forEach(function (el) {
      el.checked = el.value === state.opts.skill;
    });
    document.querySelectorAll('input[name="pp-input"]').forEach(function (el) {
      el.checked = state.opts.inputs.indexOf(el.value) !== -1;
    });
    updateGuestCount();
    syncKidsMode();
  }

  function persistInputs() {
    try {
      localStorage.setItem('bm_party_inputs_v1', JSON.stringify({
        guests: party ? party.guests : readGuests(),
        opts: party ? party.opts : null,
        votes: party ? party.votes : {}
      }));
    } catch (e) {}
  }

  function restoreInputs() {
    try {
      var raw = localStorage.getItem('bm_party_inputs_v1');
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && d.guests && d.guests.length) {
        var ta = $('pp-guests-list');
        if (ta && ta.value.split('\n').filter(Boolean).length <= 4) {
          /* only restore when the user hasn't typed their own list */
          var def = ['Alex', 'Sam', 'Riley', 'Jordan'];
          var cur = ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
          if (cur.every(function (n) { return def.indexOf(n) !== -1; })) {
            ta.value = d.guests.join('\n');
          }
        }
      }
    } catch (e) {}
  }

  /* ---------- data loading ---------- */

  function loadData() {
    return BM.loadGames().then(function (games) {
      catalog = games || [];
      byId = {};
      catalog.forEach(function (g) { byId[g.id] = g; });
      return fetch(KID_SAFE_URL).then(function (r) { return r.json(); }).catch(function () { return null; });
    }).then(function (kd) {
      if (kd && Array.isArray(kd['kid-safe'])) {
        kidRecords = kd['kid-safe'];
        kidIds = {};
        kidRecords.forEach(function (r) { kidIds[r.id] = true; });
      }
    });
  }

  /* ---------- generate ---------- */

  function generate() {
    var f = readForm();
    if (f.guests.length < 2) {
      announce('Add at least 2 guest names to build a party plan.');
      return;
    }
    var pool = pickGames(f);
    if (!pool.length) {
      party = null; slots = [];
      renderPlanEmpty(f);
      return;
    }
    var state = Party2.createParty(f.guests, {
      vibe: f.vibe, skill: f.skill, inputs: f.inputs, minutes: f.minutes,
      kids: f.kids, kidBand: f.kidBand, startClock: f.startClock,
      snackMin: f.snackMin, format: f.format
    }, pool.map(function (g) { return g.id; }));
    if (state.error) { announce('Could not build the party: ' + state.error); return; }
    party = state;
    rebuildDerived();
    persistInputs();
    renderPlan();
    if (window.location.hash.indexOf('#p=') === 0) {
      try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
    }
  }

  function renderPlanEmpty() {
    var out = $('pp-plan');
    var summary = $('pp-summary');
    out.innerHTML = '';
    summary.textContent = 'No games in the catalog match that combination. Try a different vibe or more inputs.';
    out.innerHTML = '<div class="empty-state"><p>No matching party games found. Loosen a filter and try again.</p></div>';
  }

  /* ---------- init ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    var genBtn = $('pp-generate');
    if (!genBtn) return;
    loadData().then(function () {
      var gl = $('pp-guests-list');
      if (gl) gl.addEventListener('input', updateGuestCount);
      updateGuestCount();
      var kids = $('pp-kids');
      if (kids) kids.addEventListener('change', syncKidsMode);
      syncKidsMode();
      restoreInputs();
      updateGuestCount();
      syncKidsMode();
      genBtn.addEventListener('click', generate);

      var shared = initFromHash();
      if (shared) {
        applyStateToForm(shared);
        var pool = pickGames(shared.opts);
        /* Merge the shared candidate order (voted order survives), then
           filter to games that still exist in the catalog. */
        var ordered = shared.games.filter(function (id) { return byId[id]; });
        pool.forEach(function (g) { if (ordered.indexOf(g.id) === -1) ordered.push(g.id); });
        shared.games = ordered;
        party = shared;
        rebuildDerived();
        renderPlan();
        if (shared.droppedNote) announce('Shared party loaded. ' + shared.droppedNote);
        else announce('Shared party loaded: ' + shared.guests.length + ' guests, ' + shared.games.length + ' candidate games.');
        return;
      }
    }).catch(function () {
      $('pp-summary').textContent = 'Could not load the game catalog. Check your connection and try again.';
    });
  });
})();
