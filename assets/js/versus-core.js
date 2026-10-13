/* Button Mash — Versus core: head-to-head comparison of any two
 * catalog games (wave 33).
 *
 * UMD module, DOM-free: the same code runs in the browser and under
 * node (scripts/test_versus33.js exercises it with the real catalog).
 * The Showdown pattern, kept honest for this catalog:
 *
 *   FACTS ONLY   every row is copied or counted from real catalog
 *   records — data/games.json (title, url, genre, controls,
 *   description, tags), data/collections.json (which shelves hold
 *   the game), data/kids.json's curated set (the Kids corner audit
 *   pass), and the two genre deep dives that exist on this site
 *   (genres/roguelike.html, genres/cozy.html). Nothing is scored,
 *   ranked, or rated: there are no invented numbers anywhere in
 *   this module, and no winner is ever declared.
 *
 *   YEAR         the catalog carries no structured year field —
 *   years live inside the descriptions, where the Curator census
 *   (waves 24–32) verified every one of them. Versus reads the
 *   first explicit 4-digit year a description names and labels it
 *   exactly that: "year named in its description". The census's
 *   own false positives are excluded by the same rules it used:
 *   2048's name/goal number is not a year, and a decade ("1930s")
 *   is not a release year (the regex cannot match one). A game
 *   whose description names no year gets no year — never a guess.
 *
 *   VERDICTS     the verdict strip reports only what the two
 *   records support: older/newer (both years named), a bigger or
 *   equal collection footprint, more written coverage on this
 *   site, a Kids corner pass on one side only. Ties are reported
 *   as ties. Quality is never a verdict — "better" is not in the
 *   data, so it is not on the page.
 *
 *   NO BASIS     when neither record carries a year, a shelf, a
 *   tag, coverage, or a Kids pass — the thin tail of the catalog —
 *   the comparison says so plainly instead of dressing up genre
 *   and controls as a contest. The rows still render; the strip
 *   refuses to invent a result.
 *
 *   PAIRING      a pairing is two catalog ids, shared as
 *   versus.html?a=<id>&b=<id>. Unknown ids are dropped, a game
 *   cannot face itself, and the share card is plain text listing
 *   only the rows and verdict lines the comparison produced.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BM = root.BM || {};
    root.BM.Versus = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* The only genres with a deep-dive page on this site. A game in
     another genre has no dive — the row says so by absence. */
  var GENRE_DIVES = { roguelike: 'genres/roguelike.html', cozy: 'genres/cozy.html' };

  function hostOf(url) {
    var m = /^https:\/\/([^/]+)/.exec(String(url || ''));
    return m ? m[1].replace(/^www\./, '') : '';
  }

  /* First explicit year a description names, or null. Exclusions
     mirror the Curator census (test_curator30): 2048's number is
     the game's name and goal, not a year. */
  function yearNamed(description, id) {
    var text = String(description || '');
    var re = /\b(?:19|20)\d{2}\b/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var y = parseInt(m[0], 10);
      if (id === '2048' && y === 2048) continue;
      return y;
    }
    return null;
  }

  /* Reduce a catalog game (+ site context) to everything Versus
     may say about it. ctx: { collections: [...], kidIds: Set|array }.
     Returns null for a record too broken to compare. */
  function profile(game, ctx) {
    if (!game || typeof game.id !== 'string' || !game.id ||
        typeof game.title !== 'string' || !game.title ||
        typeof game.url !== 'string' || !/^https:\/\//.test(game.url)) return null;
    ctx = ctx || {};
    var cols = (ctx.collections || []).filter(function (c) {
      return Array.isArray(c.game_ids) && c.game_ids.indexOf(game.id) !== -1;
    }).map(function (c) { return { id: c.id, title: c.title }; });
    var kidIds = ctx.kidIds;
    var kidSafe = kidIds
      ? (typeof kidIds.has === 'function' ? kidIds.has(game.id) : kidIds.indexOf(game.id) !== -1)
      : false;
    var coverage = [];
    if (GENRE_DIVES[game.genre]) {
      coverage.push({ label: 'Genre deep dive: ' + game.genre, href: GENRE_DIVES[game.genre] });
    }
    if (kidSafe) {
      coverage.push({ label: 'Kids corner listing, with a parent note', href: 'kids.html' });
    }
    return {
      id: game.id,
      title: game.title,
      url: game.url,
      host: hostOf(game.url),
      genre: typeof game.genre === 'string' ? game.genre : '',
      controls: typeof game.controls === 'string' ? game.controls : '',
      description: typeof game.description === 'string' ? game.description : '',
      tags: Array.isArray(game.tags) ? game.tags.slice() : [],
      year: yearNamed(game.description, game.id),
      collections: cols,
      collectionCount: cols.length,
      kidSafe: kidSafe,
      coverage: coverage,
      coverageCount: coverage.length,
    };
  }

  function compare(gameA, gameB, ctx) {
    var a = profile(gameA, ctx);
    var b = profile(gameB, ctx);
    if (!a || !b) return { ok: false, error: 'One of those records is too thin to compare.' };
    if (a.id === b.id) return { ok: false, error: 'A game cannot face itself — pick two different games.' };

    var verdicts = [];
    /* Era — only when both descriptions name a year. */
    if (a.year !== null && b.year !== null) {
      if (a.year < b.year) verdicts.push({ kind: 'era', text: a.title + ' is the older record — its description names ' + a.year + '; ' + b.title + ' names ' + b.year + '.' });
      else if (b.year < a.year) verdicts.push({ kind: 'era', text: b.title + ' is the older record — its description names ' + b.year + '; ' + a.title + ' names ' + a.year + '.' });
      else verdicts.push({ kind: 'era', text: 'Same year in both descriptions: ' + a.year + '.' });
    }
    /* Collection footprint — counted shelves, never a quality claim. */
    if (a.collectionCount !== b.collectionCount) {
      var big = a.collectionCount > b.collectionCount ? a : b;
      var small = big === a ? b : a;
      verdicts.push({ kind: 'footprint', text: big.title + ' sits on more of the site\u2019s shelves: ' + big.collectionCount + ' collections to ' + small.collectionCount + '.' });
    } else if (a.collectionCount > 0) {
      verdicts.push({ kind: 'footprint', text: 'Same shelf footprint: ' + a.collectionCount + (a.collectionCount === 1 ? ' collection' : ' collections') + ' each.' });
    }
    /* Written coverage on this site. */
    if (a.coverageCount !== b.coverageCount) {
      var cov = a.coverageCount > b.coverageCount ? a : b;
      var unc = cov === a ? b : a;
      verdicts.push({ kind: 'coverage', text: 'More written coverage for ' + cov.title + ' on this site (' + cov.coverage.map(function (c) { return c.label; }).join('; ') + '); ' + unc.title + ' has none of those pages.' });
    }
    /* Kids corner audit pass — a fact about the audit, not about fun. */
    if (a.kidSafe !== b.kidSafe) {
      var kid = a.kidSafe ? a : b;
      verdicts.push({ kind: 'kids', text: 'Only ' + kid.title + ' carries the Kids corner audit pass (no open chat, no gambling, no graphic content).' });
    }

    var sharedCols = a.collections.filter(function (c) {
      return b.collections.some(function (d) { return d.id === c.id; });
    });
    var sharedTags = a.tags.filter(function (t) { return b.tags.indexOf(t) !== -1; });
    var common = [];
    if (a.genre && a.genre === b.genre) common.push('Same genre shelf: ' + a.genre + '.');
    if (sharedCols.length) common.push('Shelved together in: ' + sharedCols.map(function (c) { return c.title; }).join('; ') + '.');
    if (sharedTags.length) common.push('Shared tags: ' + sharedTags.join(', ') + '.');
    if (a.host && a.host === b.host) common.push('Both play on ' + a.host + '.');
    if (a.collectionCount === 0 && b.collectionCount === 0) common.push('Neither game sits on a collection shelf yet — both are catalog-only records.');
    if (a.kidSafe && b.kidSafe) common.push('Both carry the Kids corner audit pass.');

    /* Thin = nothing the strip may report: no era pair, no shelf
       difference or shared footprint, no coverage difference, no
       one-sided Kids pass. Genre and controls still render as
       rows, but they are not a basis for a verdict. */
    var thin = verdicts.length === 0;

    return { ok: true, a: a, b: b, verdicts: verdicts, common: common, thin: thin };
  }

  /* ---------------- pairing (URL state) ---------------- */

  function encodePair(aId, bId) {
    return 'a=' + encodeURIComponent(aId) + '&b=' + encodeURIComponent(bId);
  }

  /* Parse a query string into a validated pairing. Unknown or
     repeated ids are dropped and reported, never guessed at. */
  function parsePair(search, byId) {
    var params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
    var a = (params.get('a') || '').trim().toLowerCase();
    var b = (params.get('b') || '').trim().toLowerCase();
    var dropped = [];
    if (a && !(byId && byId[a])) { dropped.push(a); a = ''; }
    if (b && !(byId && byId[b])) { dropped.push(b); b = ''; }
    if (a && b && a === b) { dropped.push(b); b = ''; }
    return { a: a || null, b: b || null, dropped: dropped };
  }

  /* ---------------- the share card ----------------
     Plain text, paste-anywhere. Only the rows and verdict lines
     the comparison itself produced — no score, no winner. */

  function shareCard(cmp, pairUrl) {
    if (!cmp || !cmp.ok) return '';
    var a = cmp.a, b = cmp.b;
    function row(label, va, vb) { return '  ' + label + ': ' + va + ' | ' + vb; }
    var lines = [
      'VERSUS — ' + a.title + ' vs ' + b.title + ' (Button Mash)',
      row('Year named', a.year !== null ? String(a.year) : 'none in its description', b.year !== null ? String(b.year) : 'none in its description'),
      row('Genre', a.genre || '—', b.genre || '—'),
      row('Controls', a.controls || '—', b.controls || '—'),
      row('Collections', a.collectionCount + (a.collections.length ? ' (' + a.collections.map(function (c) { return c.title; }).join('; ') + ')' : ''),
            b.collectionCount + (b.collections.length ? ' (' + b.collections.map(function (c) { return c.title; }).join('; ') + ')' : '')),
      row('Tags', a.tags.length ? a.tags.join(', ') : 'none', b.tags.length ? b.tags.join(', ') : 'none'),
      row('Kids corner', a.kidSafe ? 'audit pass' : 'not listed', b.kidSafe ? 'audit pass' : 'not listed'),
      '',
    ];
    if (cmp.thin) {
      lines.push('No basis to compare: neither catalog record carries a year, a shelf, a tag, coverage, or a Kids pass the strip could report. The records are the comparison.');
    } else {
      lines.push('What the records support:');
      cmp.verdicts.forEach(function (v) { lines.push('  • ' + v.text); });
    }
    if (cmp.common.length) {
      lines.push('', 'Common ground:');
      cmp.common.forEach(function (t) { lines.push('  • ' + t); });
    }
    lines.push('', 'Play ' + a.title + ': ' + a.url, 'Play ' + b.title + ': ' + b.url);
    if (pairUrl) lines.push('This pairing: ' + pairUrl);
    return lines.join('\n');
  }

  return {
    GENRE_DIVES: GENRE_DIVES,
    hostOf: hostOf,
    yearNamed: yearNamed,
    profile: profile,
    compare: compare,
    encodePair: encodePair,
    parsePair: parsePair,
    shareCard: shareCard,
  };
}));
