/* Button Mash — Versus UI (wave 33).
 *
 * Thin DOM shell over assets/js/versus-core.js (BM.Versus): all
 * comparison logic, verdict wording, pairing parsing, and the
 * share card live in the core and are unit-tested there. This file
 * only loads the real catalog (data/v1/games.json +
 * collections.json + kid-safe.json, static-first like every other
 * page on the cabinet — the page works with the functions cold),
 * fills the two pickers, renders what the core returns, and keeps
 * the pairing in the URL (?a=&b=) so any face-off is a link.
 *
 * Honesty rules, enforced by the core and respected here: no
 * scores, no rankings, no declared winner; the verdict strip
 * prints only the core's verdict lines; a thin pairing renders
 * the core's no-basis state instead of a dressed-up tie.
 */
(function () {
  'use strict';

  var V = window.BM && window.BM.Versus;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  var state = { games: [], byId: {}, ctx: null };

  function pairUrl(a, b) {
    return 'versus.html?' + V.encodePair(a, b);
  }

  function fillPicker(sel, games, selected) {
    sel.innerHTML = '';
    var ph = el('option', null, 'Pick a game…');
    ph.value = '';
    sel.appendChild(ph);
    games.forEach(function (g) {
      var o = el('option', null, g.title + ' (' + g.genre + ')');
      o.value = g.id;
      if (g.id === selected) o.selected = true;
      sel.appendChild(o);
    });
  }

  function sideCard(p, sideLabel) {
    var card = el('article', 'vs-card');
    card.appendChild(el('p', 'vs-side', sideLabel));
    var h = el('h3', 'vs-title', p.title);
    card.appendChild(h);
    var play = el('a', 'btn btn-primary vs-play', '▶ Play ' + p.title);
    play.href = p.url;
    play.target = '_blank';
    play.rel = 'noopener noreferrer';
    card.appendChild(play);
    var file = el('a', 'vs-file', 'Full game file »');
    file.href = 'game.html?id=' + encodeURIComponent(p.id);
    card.appendChild(file);
    card.appendChild(el('p', 'vs-desc', p.description));
    var rows = [
      ['Year named in its description', p.year !== null ? String(p.year) : 'No year named'],
      ['Genre', p.genre || '—'],
      ['Controls', p.controls || '—'],
      ['Plays on', p.host || '—'],
      ['Collections', p.collections.length
        ? p.collections.map(function (c) { return c.title; }).join('; ')
        : 'Not on a collection shelf yet'],
      ['Tags', p.tags.length ? p.tags.join(', ') : 'No tags'],
      ['Kids corner', p.kidSafe ? 'Audit pass — listed in Kids corner' : 'Not listed in Kids corner'],
    ];
    var dl = el('dl', 'vs-rows');
    rows.forEach(function (r) {
      dl.appendChild(el('dt', null, r[0]));
      dl.appendChild(el('dd', null, r[1]));
    });
    card.appendChild(dl);
    var cov = el('div', 'vs-coverage');
    cov.appendChild(el('p', 'vs-cov-head', 'Written coverage on this site'));
    if (p.coverage.length) {
      p.coverage.forEach(function (c) {
        var a = el('a', 'chip', c.label);
        a.href = c.href;
        cov.appendChild(a);
      });
    } else {
      cov.appendChild(el('p', 'vs-none', 'No deep dive or Kids listing covers this one yet.'));
    }
    card.appendChild(cov);
    return card;
  }

  function render() {
    var aId = $('vs-a').value;
    var bId = $('vs-b').value;
    var stage = $('vs-stage');
    var verdictBox = $('vs-verdict');
    var cardBox = $('vs-cardbox');
    var err = $('vs-error');
    err.textContent = '';
    stage.innerHTML = '';
    verdictBox.innerHTML = '';
    cardBox.hidden = true;

    /* Keep the URL honest: it always names the current pairing. */
    try {
      var qs = (aId || bId) ? '?' + V.encodePair(aId || '', bId || '') : '';
      history.replaceState(null, '', 'versus.html' + qs);
    } catch (e) { /* file:// in some browsers — the page still works */ }

    if (!aId || !bId) {
      stage.appendChild(el('p', 'vs-empty', !aId && !bId
        ? 'No pairing yet. Pick two games above and the cabinet puts their records side by side.'
        : 'One side is still empty — pick the second game and the face-off lights up.'));
      $('vs-live').textContent = 'Versus is waiting for two games.';
      return;
    }
    var cmp = V.compare(state.byId[aId], state.byId[bId], state.ctx);
    if (!cmp.ok) {
      err.textContent = cmp.error;
      $('vs-live').textContent = cmp.error;
      return;
    }

    var grid = el('div', 'vs-grid');
    grid.appendChild(sideCard(cmp.a, 'Corner A'));
    var mid = el('div', 'vs-mid', 'VS');
    grid.appendChild(mid);
    grid.appendChild(sideCard(cmp.b, 'Corner B'));
    stage.appendChild(grid);

    var strip = el('div', 'vs-strip' + (cmp.thin ? ' is-thin' : ''));
    if (cmp.thin) {
      strip.appendChild(el('p', 'vs-strip-head', 'No basis to compare'));
      strip.appendChild(el('p', 'vs-strip-line',
        'Neither catalog record carries a year, a shelf, a tag, written coverage, or a Kids corner pass the strip could report — so the strip reports nothing. ' +
        'What separates these two is in the rows above: genre, controls, and the catalog\u2019s own words. Versus does not invent a winner from that.'));
    } else {
      strip.appendChild(el('p', 'vs-strip-head', 'What the records support'));
      cmp.verdicts.forEach(function (v) {
        strip.appendChild(el('p', 'vs-strip-line', '• ' + v.text));
      });
      strip.appendChild(el('p', 'vs-strip-note', 'Counts and dates only — no scores, no rankings, and no winner. Which one you play is still your call.'));
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

    var absUrl = pairUrl(cmp.a.id, cmp.b.id);
    try { absUrl = new URL(absUrl, location.href).href; } catch (e) { /* keep relative */ }
    $('vs-card-text').textContent = V.shareCard(cmp, absUrl);
    cardBox.hidden = false;
    $('vs-live').textContent = cmp.thin
      ? cmp.a.title + ' versus ' + cmp.b.title + ': no basis to compare in the catalog records.'
      : cmp.a.title + ' versus ' + cmp.b.title + ': ' + cmp.verdicts.length + ' record-backed lines in the verdict strip.';
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

  function boot(games, collections, kidIds) {
    state.games = games;
    games.forEach(function (g) { state.byId[g.id] = g; });
    state.ctx = { collections: collections, kidIds: kidIds };

    var pair = V.parsePair(location.search, state.byId);
    fillPicker($('vs-a'), games, pair.a);
    fillPicker($('vs-b'), games, pair.b);
    /* A bare visit gets an honest default pairing to look at:
       the catalog's first game against its oldest dated record —
       chosen from the data, labelled as a starter, changeable. */
    if (!pair.a && !pair.b) {
      var dated = games.filter(function (g) { return V.yearNamed(g.description, g.id) !== null; })
        .sort(function (x, y) { return V.yearNamed(x.description, x.id) - V.yearNamed(y.description, y.id); })[0];
      if (dated && games[0] && dated.id !== games[0].id) {
        $('vs-a').value = games[0].id;
        $('vs-b').value = dated.id;
        $('vs-starter').hidden = false;
      }
    }
    render();
    /* The dropped-id notice is posted AFTER render() — render
       clears the alert line on every pairing change, and a notice
       set before it would never be seen. */
    if (pair.dropped.length) {
      $('vs-error').textContent = 'Dropped from the link: ' + pair.dropped.join(', ') +
        ' — not a catalog id this cabinet can vouch for. The rest of the pairing stands.';
    }
  }

  function init() {
    if (!V) { $('vs-error').textContent = 'The Versus engine did not load — reload the page.'; return; }
    $('vs-a').addEventListener('change', render);
    $('vs-b').addEventListener('change', render);
    $('vs-swap').addEventListener('click', function () {
      var a = $('vs-a').value;
      $('vs-a').value = $('vs-b').value;
      $('vs-b').value = a;
      render();
    });
    $('vs-surprise').addEventListener('click', function () {
      if (state.games.length < 2) return;
      var i = Math.floor(Math.random() * state.games.length);
      var j = Math.floor(Math.random() * (state.games.length - 1));
      if (j >= i) j += 1;
      $('vs-a').value = state.games[i].id;
      $('vs-b').value = state.games[j].id;
      render();
    });
    $('vs-copy').addEventListener('click', function () {
      copyText($('vs-card-text').textContent, $('vs-copy'), '✓ Card copied');
    });
    $('vs-copy-link').addEventListener('click', function () {
      var a = $('vs-a').value, b = $('vs-b').value;
      var u = pairUrl(a, b);
      try { u = new URL(u, location.href).href; } catch (e) { /* keep relative */ }
      copyText(u, $('vs-copy-link'), '✓ Link copied');
    });

    Promise.all([
      fetch('data/v1/games.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
      fetch('data/v1/collections.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
      fetch('data/v1/kid-safe.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
    ]).then(function (parts) {
      var kidIds = new Set((parts[2]['kid-safe'] || []).filter(function (k) { return k.kid_safe; }).map(function (k) { return k.id; }));
      boot(parts[0].games || [], parts[1].collections || [], kidIds);
    }).catch(function () {
      $('vs-error').textContent = 'The catalog did not load, so there is nothing honest to compare. Reload to try again.';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
