/* Button Mash: Emulator Side-by-Side UI (wave 34).
 *
 * Thin DOM shell over assets/js/emulator-versus-core.js
 * (BM.EmulatorVersus): all comparison logic, verdict wording,
 * seeded dealing, pairing parsing, and the share card live in
 * the core and are unit-tested there. This file only loads the
 * real emulator records (data/v1/emulators.json, static-first
 * like every other page on the cabinet), fills the two pickers,
 * renders what the core returns, and keeps the pairing in the
 * URL (?ea=&eb=&seed=) so any side-by-side is a link.
 *
 * Honesty rules, enforced by the core and respected here: no
 * scores, no rankings, no declared winner; a systems list the
 * record describes in words is shown verbatim and never counted.
 * The surprise pairing is SEEDED (Seed-Reckoning): the seed sits
 * in the seed box and on the share card, and the same seed
 * against the same catalog deals the same pairing every time.
 */
(function () {
  'use strict';

  var E = window.BM && window.BM.EmulatorVersus;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  var state = { emulators: [], byId: {}, lastSeed: null };

  function pairUrl(a, b, seed) {
    return 'emulation.html?' + E.encodePair(a, b, seed);
  }

  function fillPicker(sel, emulators, selected) {
    sel.innerHTML = '';
    var ph = el('option', null, 'Pick an emulator…');
    ph.value = '';
    sel.appendChild(ph);
    emulators.forEach(function (e) {
      var o = el('option', null, e.name);
      o.value = e.id;
      if (e.id === selected) o.selected = true;
      sel.appendChild(o);
    });
  }

  function sideCard(p, sideLabel) {
    var card = el('article', 'vs-card');
    card.appendChild(el('p', 'vs-side', sideLabel));
    card.appendChild(el('h3', 'vs-title', p.name));
    var link = el('a', 'btn btn-primary vs-play', 'Project home »');
    link.href = p.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    card.appendChild(link);
    card.appendChild(el('p', 'vs-desc', p.notes));
    var rows = [
      ['Systems', p.systems.join(', ') + (p.systemCount === null ? ' (described in words, not a countable list)' : '')],
      ['Platforms', p.platforms.join(', ')],
      ['License', p.license || '-'],
      ['BIOS', p.biosRequired ? 'Needs a BIOS you dump from your own hardware' : 'None needed'],
    ];
    if (p.biosNote) rows.push(['BIOS note', p.biosNote]);
    var dl = el('dl', 'vs-rows');
    rows.forEach(function (r) {
      dl.appendChild(el('dt', null, r[0]));
      dl.appendChild(el('dd', null, r[1]));
    });
    card.appendChild(dl);
    return card;
  }

  function render() {
    var aId = $('ev-a').value;
    var bId = $('ev-b').value;
    var stage = $('ev-stage');
    var verdictBox = $('ev-verdict');
    var cardBox = $('ev-cardbox');
    var err = $('ev-error');
    err.textContent = '';
    stage.innerHTML = '';
    verdictBox.innerHTML = '';
    cardBox.hidden = true;

    /* Keep the URL honest: it always names the current pairing,
       plus the seed when the pairing was dealt by seed. */
    try {
      var qs = (aId || bId) ? '?' + E.encodePair(aId || '', bId || '', state.lastSeed) : '';
      history.replaceState(null, '', 'emulation.html' + qs);
    } catch (e) { /* file:// in some browsers, the page still works */ }

    if (!aId || !bId) {
      stage.appendChild(el('p', 'vs-empty', !aId && !bId
        ? 'No pairing yet. Pick two emulators above and the cabinet puts their records side by side.'
        : 'One side is still empty, pick the second emulator and the side-by-side lights up.'));
      $('ev-live').textContent = 'Emulator side-by-side is waiting for two emulators.';
      return;
    }
    var cmp = E.compare(state.byId[aId], state.byId[bId]);
    if (!cmp.ok) {
      err.textContent = cmp.error;
      $('ev-live').textContent = cmp.error;
      return;
    }

    var grid = el('div', 'vs-grid');
    grid.appendChild(sideCard(cmp.a, 'Corner A'));
    grid.appendChild(el('div', 'vs-mid', 'VS'));
    grid.appendChild(sideCard(cmp.b, 'Corner B'));
    stage.appendChild(grid);

    var strip = el('div', 'vs-strip' + (cmp.thin ? ' is-thin' : ''));
    if (cmp.thin) {
      strip.appendChild(el('p', 'vs-strip-head', 'No basis to compare'));
      strip.appendChild(el('p', 'vs-strip-line',
        'The two records agree on every countable row, same listed counts, same BIOS story, same license, so the strip reports nothing. ' +
        'What separates these two is in the rows above, in the records\u2019 own words. The strip does not invent a winner from that.'));
    } else {
      strip.appendChild(el('p', 'vs-strip-head', 'What the records support'));
      cmp.verdicts.forEach(function (v) {
        strip.appendChild(el('p', 'vs-strip-line', '• ' + v.text));
      });
      strip.appendChild(el('p', 'vs-strip-note', 'Counts and license/BIOS facts only, no scores, no rankings, and no winner. Which one you install is still your call.'));
    }
    verdictBox.appendChild(strip);

    if (cmp.common.length) {
      var common = el('div', 'vs-common');
      common.appendChild(el('h3', null, 'Common ground'));
      var ul = el('ul');
      cmp.common.forEach(function (t) { ul.appendChild(el('li', null, t)); });
      common.appendChild(ul);
      verdictBox.appendChild(common);
    }

    var absUrl = pairUrl(cmp.a.id, cmp.b.id, state.lastSeed);
    try { absUrl = new URL(absUrl, location.href).href; } catch (e) { /* keep relative */ }
    $('ev-card-text').textContent = E.shareCard(cmp, absUrl, state.lastSeed);
    cardBox.hidden = false;
    $('ev-live').textContent = cmp.thin
      ? cmp.a.name + ' versus ' + cmp.b.name + ': no basis to compare in the emulator records.'
      : cmp.a.name + ' versus ' + cmp.b.name + ': ' + cmp.verdicts.length + ' record-backed lines in the verdict strip.';
  }

  function copyText(text, btn, doneLabel) {
    function done() {
      var old = btn.textContent;
      btn.textContent = doneLabel;
      setTimeout(function () { btn.textContent = old; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else { done(); }
  }

  function boot(emulators) {
    state.emulators = emulators;
    emulators.forEach(function (e) { state.byId[e.id] = e; });

    var pair = E.parsePair(location.search, state.byId);
    fillPicker($('ev-a'), emulators, pair.a);
    fillPicker($('ev-b'), emulators, pair.b);
    if (pair.seed) {
      state.lastSeed = pair.seed;
      $('ev-seed').value = pair.seed;
    }
    /* A bare visit gets an honest starter pairing to look at:
       the catalog's first two picks, labelled as a starter. */
    if (!pair.a && !pair.b && emulators.length >= 2) {
      $('ev-a').value = emulators[0].id;
      $('ev-b').value = emulators[1].id;
      $('ev-starter').hidden = false;
    }
    render();
    /* The dropped-id notice posts AFTER render(), render clears
       the alert line on every pairing change. */
    if (pair.dropped.length) {
      $('ev-error').textContent = 'Dropped from the link: ' + pair.dropped.join(', ') +
        ', not an emulator id this cabinet can vouch for. The rest of the pairing stands.';
    }
  }

  function init() {
    if (!E) { $('ev-error').textContent = 'The side-by-side engine did not load, reload the page.'; return; }
    $('ev-a').addEventListener('change', function () { state.lastSeed = null; render(); });
    $('ev-b').addEventListener('change', function () { state.lastSeed = null; render(); });
    $('ev-swap').addEventListener('click', function () {
      var a = $('ev-a').value;
      $('ev-a').value = $('ev-b').value;
      $('ev-b').value = a;
      render();
    });
    $('ev-deal').addEventListener('click', function () {
      var dealt = E.seededPair($('ev-seed').value, state.emulators);
      if (!dealt) {
        $('ev-error').textContent = 'Type a seed first, any word or phrase. The same seed always deals the same pairing.';
        return;
      }
      state.lastSeed = dealt.seed;
      $('ev-a').value = dealt.aId;
      $('ev-b').value = dealt.bId;
      $('ev-starter').hidden = true;
      render();
      $('ev-seed-note').textContent = 'Dealt by seed "' + dealt.seed + '", re-deal it any time; the same seed against the same catalog lands on this exact pairing.';
    });
    $('ev-copy').addEventListener('click', function () {
      copyText($('ev-card-text').textContent, $('ev-copy'), '✓ Card copied');
    });
    $('ev-copy-link').addEventListener('click', function () {
      var u = pairUrl($('ev-a').value, $('ev-b').value, state.lastSeed);
      try { u = new URL(u, location.href).href; } catch (e) { /* keep relative */ }
      copyText(u, $('ev-copy-link'), '✓ Link copied');
    });

    fetch('data/v1/emulators.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (doc) { boot(doc.emulators || []); })
      .catch(function () {
        $('ev-error').textContent = 'The emulator records did not load, so there is nothing honest to compare. Reload to try again.';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
