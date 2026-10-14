/* Button Mash Converter 4.0, single-file core logic (UMD: browser + node).
   The 5 proven profiles live here unchanged; Converter 4.0 routing,
   detection and declines live in converter4-core.js.
   Pure, DOM-free functions: system profiles, ROM validation, output naming,
   template token assembly, and the sequential batch runner. The DOM layer
   (assets/js/converter.js) and the test suite (scripts/test_converter12.js)
   both build on this module so the tested code IS the shipped code.

   Honesty rules baked in:
   - Validation only asserts what the bytes can prove. A blank GBA header is a
     WARNING, not an error: many homebrew ROMs ship zeroed headers and mGBA
     boots them fine (verified: tests/homebrew-test-roms/rkanoid-latest-demo.gba).
     Wave 8 rejected zeroed-header files only as *boot-test candidates*, never
     as "corrupt", this module keeps that distinction.
   - NES validity is structural: every .nes ROM carries the 16-byte iNES header
     starting with the magic "NES\x1A". Missing magic = not a NES ROM, error.
   - GB/GBC header checksum (bytes 0x134-0x14C vs byte 0x14D) needs no
     copyrighted logo bytes to verify, pure arithmetic per the GB spec. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ConverterCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MB = 1024 * 1024;

  /* Per-system conversion profiles. max = largest real cart for the system;
     warn = file size above which embedding gets unwieldy (base64 adds ~33%). */
  var PROFILES = {
    gba: {
      key: 'gba',
      ext: /\.gba$/i, core: 'gba', engine: 'mGBA',
      system: 'Game Boy Advance',
      max: 32 * MB, warn: 16 * MB,
      hint: 'keyboard works out of the box (arrow keys + Z/X cover most GBA games)',
      biosNote: 'The mGBA core ships its own built-in BIOS replacement, no extra files, boots instantly.'
    },
    gb: {
      key: 'gb',
      ext: /\.(gb|gbc)$/i, core: 'gb', engine: 'Gambatte',
      system: 'Game Boy / Game Boy Color',
      max: 8 * MB, warn: 2 * MB,
      hint: 'keyboard works out of the box (arrow keys + Z/X = A/B)',
      biosNote: 'Gambatte needs no BIOS at all: GB and GBC games boot with zero extra files.'
    },
    nes: {
      key: 'nes',
      ext: /\.nes$/i, core: 'nes', engine: 'FCEUmm',
      system: 'NES',
      max: 4 * MB, warn: 1 * MB,
      hint: 'keyboard works out of the box (arrow keys + Z/X = B/A, Enter = Start)',
      biosNote: 'FCEUmm needs no BIOS at all: NES games boot with zero extra files.'
    },
    snes: {
      key: 'snes',
      ext: /\.(sfc|smc)$/i, core: 'snes', engine: 'Snes9x',
      system: 'Super Nintendo',
      max: 6 * MB, warn: 3 * MB,
      hint: 'keyboard works out of the box (arrow keys + Z/X cover the main buttons)',
      biosNote: 'Snes9x needs no BIOS at all: SNES games boot with zero extra files.'
    },
    segamd: {
      key: 'segamd',
      ext: /\.(md|gen)$/i, core: 'segaMD', engine: 'Genesis Plus GX',
      system: 'Sega Genesis',
      max: 4 * MB, warn: 2 * MB,
      hint: 'keyboard works out of the box (arrow keys + Z/X cover the main buttons)',
      biosNote: 'Genesis Plus GX needs no BIOS for cartridge games, boots with zero extra files.'
    }
  };

  /* Compression levels offered in the UI. level 0 = plain base64 (no pako).
     Higher levels = smaller output, slower encode; decode speed is roughly
     flat across levels (inflate doesn't care how hard deflate worked). */
  var COMPRESSION = [
    { id: 'none',     level: 0, label: 'None, fastest build',  note: 'Plain base64. Fastest to build; biggest file (~33% over the ROM).' },
    { id: 'fast',     level: 1, label: 'Fast',                  note: 'Quick deflate pass. Noticeably smaller, barely slower.' },
    { id: 'balanced', level: 6, label: 'Balanced (recommended)', note: 'The sweet spot: much smaller file, a few extra seconds to build.' },
    { id: 'best',     level: 9, label: 'Best, smallest file',  note: 'Squeezes hardest. Slowest build (big ROMs take a while); decode is just as fast.' }
  ];

  /* Full template token contract. buildHtml() replaces every one and throws
     if any token survives, a leftover token would ship a broken game. */
  var TOKENS = [
    '__BM_GAME_NAME__', '__BM_GAME_ID__', '__BM_BUILD_DATE__', '__BM_ROM_SIZE__',
    '__BM_ROM_B64__', '__BM_CORE__', '__BM_CORE_LABEL__', '__BM_SYSTEM__',
    '__BM_HINT__', '__BM_COMPRESSED__', '__BM_COVER__'
  ];

  function profileFor(name) {
    var keys = Object.keys(PROFILES);
    for (var i = 0; i < keys.length; i++) {
      if (PROFILES[keys[i]].ext.test(name)) return PROFILES[keys[i]];
    }
    return null;
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function slugify(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'game';
  }

  function baseName(fileName, profile) {
    return String(fileName).replace(profile.ext, '');
  }

  function makeGameId(name, size) {
    return 'bm-' + slugify(name) + '-' + Number(size).toString(36);
  }

  function makeDownloadName(title) {
    return slugify(title) + '.html';
  }

  /* Batch-safe download names: two files with the same title must not
     produce the same download filename (the second would clobber or
     confuse the first). taken = download names already claimed this batch. */
  function uniqueDownloadName(title, taken) {
    taken = taken || [];
    var base = makeDownloadName(title);
    if (taken.indexOf(base) === -1) return base;
    var stem = base.replace(/\.html$/, '');
    var n = 2, cand;
    do { cand = stem + '-' + n + '.html'; n++; } while (taken.indexOf(cand) !== -1);
    return cand;
  }

  function allZero(bytes) {
    for (var i = 0; i < bytes.length; i++) if (bytes[i] !== 0) return false;
    return true;
  }

  function regionZero(bytes, len) {
    var n = Math.min(len, bytes.length);
    for (var i = 0; i < n; i++) if (bytes[i] !== 0) return false;
    return true;
  }

  /* GB/GBC header checksum: x = x - b[i] - 1 over 0x134..0x14C, compare low
     byte against 0x14D. Pure spec arithmetic, no logo bytes involved. */
  function gbHeaderChecksumOk(bytes) {
    if (bytes.length < 0x150) return null; /* too short to say */
    var x = 0;
    for (var i = 0x134; i <= 0x14C; i++) x = (x - bytes[i] - 1) & 0xFF;
    return x === bytes[0x14D];
  }

  /* Validate ROM bytes against what the format can actually prove.
     Returns { errors: [...], warnings: [...], notes: [...] }, errors block
     conversion, warnings are shown but the user may proceed, notes are
     neutral facts (e.g. a copier header we keep as-is). */
  function validateRom(bytes, profileKey) {
    var errors = [];
    var warnings = [];
    var notes = [];
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);

    if (b.length === 0) {
      errors.push('This file is empty (0 bytes), there is nothing to convert.');
      return { errors: errors, warnings: warnings, notes: notes };
    }
    if (allZero(b)) {
      errors.push('Every byte in this file is zero, that is what a failed or blank dump looks like, not a game. Re-dump or re-download the file.');
      return { errors: errors, warnings: warnings, notes: notes };
    }

    if (profileKey === 'nes') {
      var magic = b.length >= 4 && b[0] === 0x4E && b[1] === 0x45 && b[2] === 0x53 && b[3] === 0x1A;
      if (!magic) {
        errors.push('Not a valid NES ROM: the file is missing the "NES" signature every .nes file starts with. It may be corrupt, truncated, or simply not a NES file.');
      } else if (b.length >= 16 && b[4] === 0) {
        errors.push('This .nes header declares zero program banks, the file cannot hold a game. The download is corrupt.');
      }
    }

    if (profileKey === 'gba' && regionZero(b.subarray(4), 0xBD - 4)) {
      warnings.push('Blank cartridge header, the header region (logo, title, checksums) is all zero. Many homebrew ROMs look exactly like this and the mGBA core boots them fine, so this is not a blocker; commercial cartridge dumps always carry a header here.');
    }

    if (profileKey === 'gb') {
      if (b.length >= 0x150 && regionZero(b, 0x150)) {
        warnings.push('Blank cartridge header region. Many homebrew ROMs ship this way and Gambatte boots them fine, not a blocker.');
      } else {
        var chk = gbHeaderChecksumOk(b);
        if (chk === false) {
          warnings.push('Header checksum mismatch, the bytes in the title area do not add up. The file may be corrupt or truncated; the game might still boot, but treat it as suspect.');
        }
      }
    }

    if (profileKey === 'snes' && snesCopierHeader(b)) {
      notes.push('512-byte copier header detected, kept as-is; the Snes9x core skips it automatically.');
    }

    if (profileKey === 'segamd' && genesisHasSegaString(b) === false) {
      warnings.push('No "SEGA" header string at 0x100, most Genesis ROMs, including homebrew, carry it. The emulator does not check it, so the game will likely still boot, but treat the dump as suspect.');
    }

    return { errors: errors, warnings: warnings, notes: notes };
  }

  /* SNES copier-header detection: .smc files often carry a 512-byte copier
     header (size % 1024 === 512); Snes9x skips it automatically. */
  function snesCopierHeader(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    return b.length > 512 && (b.length % 1024) === 512;
  }

  /* Genesis TMSS string: "SEGA" at 0x100. Real hardware checks it; emulators
     don't, so a missing string warns, never errors. */
  function genesisHasSegaString(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    if (b.length < 0x104) return null;
    return b[0x100] === 0x53 && b[0x101] === 0x45 && b[0x102] === 0x47 && b[0x103] === 0x41;
  }

  /* GB cartridge subtype from the CGB flag (byte 0x143). Informational only. */
  function gbSubtype(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    if (b.length < 0x144) return null;
    var f = b[0x143];
    if (f === 0xC0) return 'Game Boy Color only';
    if (f === 0x80) return 'Game Boy + Color enhanced';
    return 'Original Game Boy';
  }

  /* iNES header facts: PRG/CHR bank counts. Informational only. */
  function nesInfo(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    if (b.length < 16) return null;
    if (!(b[0] === 0x4E && b[1] === 0x45 && b[2] === 0x53 && b[3] === 0x1A)) return null;
    return { prgKB: b[4] * 16, chrKB: b[5] * 8 };
  }

  /* Assemble the final game page. fields: {name, gameId, buildDate, romSize,
     romB64, core, coreLabel, system, hint, compressed ('1'|'0'), cover}.
     Throws if any token is missing from the template or survives replacement. */
  function buildHtml(template, fields) {
    var missing = TOKENS.filter(function (t) { return template.indexOf(t) === -1; });
    if (missing.length) throw new Error('Template is missing tokens: ' + missing.join(', '));
    var html = template;
    var values = {
      '__BM_GAME_NAME__': escHtml(fields.name),
      '__BM_GAME_ID__': escHtml(fields.gameId),
      '__BM_BUILD_DATE__': escHtml(fields.buildDate),
      '__BM_ROM_SIZE__': escHtml(fields.romSize),
      '__BM_ROM_B64__': fields.romB64,
      '__BM_CORE__': escHtml(fields.core),
      '__BM_CORE_LABEL__': escHtml(fields.coreLabel),
      '__BM_SYSTEM__': escHtml(fields.system),
      '__BM_HINT__': fields.hint, /* profile hints contain trusted <kbd> markup */
      '__BM_COMPRESSED__': fields.compressed === '1' ? '1' : '0',
      '__BM_COVER__': fields.cover ? escHtml(fields.cover) : ''
    };
    TOKENS.forEach(function (t) { html = html.split(t).join(values[t]); });
    var leftover = html.match(/__BM_[A-Z0-9_]+__/g);
    if (leftover) throw new Error('Unreplaced template tokens would ship a broken game: ' + leftover.join(', '));
    return html;
  }

  /* Batch queue stats for the summary line. */
  function queueStats(items) {
    var s = { total: items.length, queued: 0, active: 0, done: 0, failed: 0, cancelled: 0, bytesIn: 0, bytesOut: 0 };
    items.forEach(function (it) {
      if (it.status === 'queued') s.queued++;
      else if (it.status === 'done') { s.done++; s.bytesIn += it.fileSize || 0; s.bytesOut += it.outSize || 0; }
      else if (it.status === 'error') s.failed++;
      else if (it.status === 'cancelled') s.cancelled++;
      else s.active++;
    });
    return s;
  }

  /* Sequential batch runner with error isolation: one bad file never kills
     the batch. worker(item) does the per-file work and may throw; onCancel()
     is polled between files. Returns when the queue is drained or cancelled. */
  async function processQueue(items, worker, onCancel) {
    for (var i = 0; i < items.length; i++) {
      if (onCancel && onCancel()) break;
      var it = items[i];
      if (it.status !== 'queued') continue;
      try {
        await worker(it);
      } catch (e) {
        if (e && e.cancelled) {
          it.status = 'cancelled'; /* user hit cancel: not a failure */
        } else {
          it.status = 'error';
          it.message = { kind: 'error', text: (e && e.message) || String(e) };
        }
        if (typeof it.onUpdate === 'function') it.onUpdate();
      }
    }
  }

  return {
    VERSION: '4.0',
    PROFILES: PROFILES,
    COMPRESSION: COMPRESSION,
    TOKENS: TOKENS,
    profileFor: profileFor,
    fmtBytes: fmtBytes,
    escHtml: escHtml,
    slugify: slugify,
    baseName: baseName,
    makeGameId: makeGameId,
    makeDownloadName: makeDownloadName,
    uniqueDownloadName: uniqueDownloadName,
    validateRom: validateRom,
    gbHeaderChecksumOk: gbHeaderChecksumOk,
    gbSubtype: gbSubtype,
    nesInfo: nesInfo,
    snesCopierHeader: snesCopierHeader,
    genesisHasSegaString: genesisHasSegaString,
    buildHtml: buildHtml,
    queueStats: queueStats,
    processQueue: processQueue
  };
}));
