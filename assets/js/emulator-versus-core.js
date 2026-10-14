/* Button Mash: Emulator Side-by-Side core (wave 34).
 *
 * UMD module, DOM-free: the same code runs in the browser and
 * under node (scripts/test_emulatorversus34.js exercises it with
 * the real emulator records). The Versus pattern applied to the
 * catalog's other record shape, data/emulators.json's 10 picks.
 *
 *   FACTS ONLY   every row is copied or counted from a real
 *   emulator record (name, url, notes, license, systems,
 *   platforms, bios_required, bios_note). Nothing is scored,
 *   ranked, or rated, and no winner is ever declared, the same
 *   honesty contract as Versus (wave 33).
 *
 *   COUNTING     a systems list is only counted when every entry
 *   names a specific system. Three records describe their reach
 *   in words instead ("Dozens via cores", "Many via libretro
 *   cores", a list ending "and more"), those lists are shown
 *   verbatim and left uncounted, and the strip says why instead
 *   of comparing a number against a shrug. Platform lists are
 *   specific on every record, so platform counts always stand.
 *
 *   SEED DISCIPLINE (the Seed-Reckoning pattern)   the surprise
 *   pairing is SEEDED, never unseeded chance: an FNV-1a hash of the
 *   recorded seed string + the sorted catalog ids feeds a
 *   mulberry32 PRNG, and two distinct picks fall out. The seed
 *   is shown on the page and printed on the share card, so the
 *   same seed against the same catalog deals the same pairing
 *   every time, anyone can re-deal it and check.
 *
 *   PAIRING      a pairing is two emulator ids, shared as
 *   emulation.html?ea=<id>&eb=<id> (plus &seed=<seed> when the
 *   pairing was dealt by the seeded surprise). Unknown ids drop
 *   with a note; an emulator cannot face itself.
 */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BM = root.BM || {};
    root.BM.EmulatorVersus = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VAGUE_SYSTEM = /dozens|many|and more/i;

  /* A systems list counts only when every entry is specific. */
  function systemCount(systems) {
    if (!Array.isArray(systems) || !systems.length) return null;
    for (var i = 0; i < systems.length; i++) {
      if (typeof systems[i] !== 'string' || VAGUE_SYSTEM.test(systems[i])) return null;
    }
    return systems.length;
  }

  function profile(emu) {
    if (!emu || typeof emu.id !== 'string' || !emu.id ||
        typeof emu.name !== 'string' || !emu.name ||
        typeof emu.url !== 'string' || !/^https:\/\//.test(emu.url)) return null;
    var systems = Array.isArray(emu.systems) ? emu.systems.slice() : [];
    var platforms = Array.isArray(emu.platforms) ? emu.platforms.slice() : [];
    return {
      id: emu.id,
      name: emu.name,
      url: emu.url,
      notes: typeof emu.notes === 'string' ? emu.notes : '',
      license: typeof emu.license === 'string' ? emu.license : '',
      systems: systems,
      platforms: platforms,
      systemCount: systemCount(systems),
      platformCount: platforms.length,
      biosRequired: emu.bios_required === true,
      biosNote: typeof emu.bios_note === 'string' ? emu.bios_note : '',
    };
  }

  function compare(emuA, emuB) {
    var a = profile(emuA);
    var b = profile(emuB);
    if (!a || !b) return { ok: false, error: 'One of those records is too thin to compare.' };
    if (a.id === b.id) return { ok: false, error: 'An emulator cannot face itself, pick two different emulators.' };

    var verdicts = [];
    /* Listed systems, only when both records give a countable list. */
    if (a.systemCount !== null && b.systemCount !== null) {
      if (a.systemCount !== b.systemCount) {
        var wide = a.systemCount > b.systemCount ? a : b;
        var narrow = wide === a ? b : a;
        verdicts.push({ kind: 'systems', text: wide.name + ' lists more systems by name: ' + wide.systemCount + ' to ' + narrow.systemCount + '.' });
      } else {
        verdicts.push({ kind: 'systems', text: 'Same listed system count: ' + a.systemCount + ' each.' });
      }
    }
    /* Platforms, every record's list is specific, so this always stands. */
    if (a.platformCount !== b.platformCount) {
      var broad = a.platformCount > b.platformCount ? a : b;
      var slim = broad === a ? b : a;
      verdicts.push({ kind: 'platforms', text: broad.name + ' lists more platforms: ' + broad.platformCount + ' to ' + slim.platformCount + '.' });
    } else if (a.platformCount > 0) {
      verdicts.push({ kind: 'platforms', text: 'Same platform count: ' + a.platformCount + ' each.' });
    }
    /* BIOS, a fact about what the visitor must supply, not a score. */
    if (a.biosRequired !== b.biosRequired) {
      var needy = a.biosRequired ? a : b;
      var free = needy === a ? b : a;
      verdicts.push({ kind: 'bios', text: 'Only ' + needy.name + ' needs a BIOS file, one you dump from your own hardware; ' + free.name + ' needs none.' });
    }
    /* License, difference reported as a difference, never a ranking. */
    if (a.license && b.license && a.license !== b.license) {
      verdicts.push({ kind: 'license', text: 'Different licenses: ' + a.name + ' is ' + a.license + '; ' + b.name + ' is ' + b.license + '.' });
    }

    var sharedSystems = a.systems.filter(function (s) { return b.systems.indexOf(s) !== -1; });
    var sharedPlatforms = a.platforms.filter(function (p) { return b.platforms.indexOf(p) !== -1; });
    var common = [];
    if (sharedSystems.length) common.push('Both list: ' + sharedSystems.join(', ') + '.');
    if (sharedPlatforms.length) common.push('Both run on: ' + sharedPlatforms.join(', ') + '.');
    if (a.license && a.license === b.license) common.push('Same license: ' + a.license + '.');
    if (a.biosRequired && b.biosRequired) common.push('Both need a BIOS you dump from your own hardware.');
    if (!a.biosRequired && !b.biosRequired) common.push('Neither needs a BIOS file.');
    if ((a.systemCount === null) !== (b.systemCount === null)) {
      var vague = a.systemCount === null ? a : b;
      common.push(vague.name + ' describes its reach in words, not a countable system list, its systems are shown verbatim and left uncounted.');
    } else if (a.systemCount === null && b.systemCount === null) {
      common.push('Neither record gives a countable system list, both describe their reach in words, shown verbatim.');
    }

    return { ok: true, a: a, b: b, verdicts: verdicts, common: common, thin: verdicts.length === 0 };
  }

  /* ---------------- seeded surprise (Seed-Reckoning) ---------------- */

  /* FNV-1a 32-bit over the seed string, small, stable, and the
     same in every JS engine, which is the whole point. */
  function hashSeed(str) {
    var h = 0x811c9dc5;
    var s = String(str);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function mulberry32(seedInt) {
    var t = seedInt >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Deal a pairing from a recorded seed + the recorded catalog.
     Inputs: the seed string and the emulator ids, sorted, the
     catalog's own order cannot smuggle variation in. Returns
     null when the seed is empty or the catalog has < 2 records. */
  function seededPair(seed, emulators) {
    if (typeof seed !== 'string' || !seed.trim()) return null;
    var ids = (emulators || []).map(function (e) { return e && e.id; })
      .filter(function (id) { return typeof id === 'string' && id; })
      .sort();
    if (ids.length < 2) return null;
    var rand = mulberry32(hashSeed(seed.trim() + '|' + ids.join(',')));
    var i = Math.floor(rand() * ids.length);
    var j = Math.floor(rand() * (ids.length - 1));
    if (j >= i) j += 1;
    return { seed: seed.trim(), aId: ids[i], bId: ids[j], inputs: ids };
  }

  /* ---------------- pairing (URL state) ---------------- */

  function encodePair(aId, bId, seed) {
    var q = 'ea=' + encodeURIComponent(aId) + '&eb=' + encodeURIComponent(bId);
    if (seed) q += '&seed=' + encodeURIComponent(seed);
    return q;
  }

  function parsePair(search, byId) {
    var params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
    var a = (params.get('ea') || '').trim().toLowerCase();
    var b = (params.get('eb') || '').trim().toLowerCase();
    var seed = (params.get('seed') || '').trim();
    var dropped = [];
    if (a && !(byId && byId[a])) { dropped.push(a); a = ''; }
    if (b && !(byId && byId[b])) { dropped.push(b); b = ''; }
    if (a && b && a === b) { dropped.push(b); b = ''; }
    return { a: a || null, b: b || null, seed: seed || null, dropped: dropped };
  }

  /* ---------------- the share card ---------------- */

  function shareCard(cmp, pairUrl, seed) {
    if (!cmp || !cmp.ok) return '';
    var a = cmp.a, b = cmp.b;
    function row(label, va, vb) { return '  ' + label + ': ' + va + ' | ' + vb; }
    function sysText(p) {
      return p.systems.join(', ') + (p.systemCount !== null ? ' (' + p.systemCount + ' listed)' : ' (list not countable, described in words)');
    }
    var lines = [
      'EMULATOR SIDE BY SIDE, ' + a.name + ' vs ' + b.name + ' (Button Mash)',
      row('Systems', sysText(a), sysText(b)),
      row('Platforms', a.platforms.join(', '), b.platforms.join(', ')),
      row('License', a.license || '-', b.license || '-'),
      row('BIOS', a.biosRequired ? 'needs your own dumped BIOS' : 'none needed', b.biosRequired ? 'needs your own dumped BIOS' : 'none needed'),
      '',
    ];
    if (cmp.thin) {
      lines.push('No basis to compare: the two records agree on every countable row. The records are the comparison.');
    } else {
      lines.push('What the records support:');
      cmp.verdicts.forEach(function (v) { lines.push('  • ' + v.text); });
    }
    if (cmp.common.length) {
      lines.push('', 'Common ground:');
      cmp.common.forEach(function (t) { lines.push('  • ' + t); });
    }
    if (seed) {
      lines.push('', 'Seeded pairing, seed: "' + seed + '". Same seed + same catalog deals this same pairing; re-deal it on the Emulation hub and check.');
    }
    lines.push('', a.name + ': ' + a.url, b.name + ': ' + b.url);
    if (pairUrl) lines.push('This pairing: ' + pairUrl);
    return lines.join('\n');
  }

  return {
    systemCount: systemCount,
    profile: profile,
    compare: compare,
    hashSeed: hashSeed,
    mulberry32: mulberry32,
    seededPair: seededPair,
    encodePair: encodePair,
    parsePair: parsePair,
    shareCard: shareCard,
  };
}));
