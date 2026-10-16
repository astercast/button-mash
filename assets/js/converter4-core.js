/* PortPlay converter core logic (UMD: browser + node).
   Pure, DOM-free functions for the Rotation 23 build:
   - content-hash game identity (dossier section 3.6)
   - content-first file detection + the detect-and-decline table
     (dossier section 3.3): PS2 / GameCube / Wii / PS3 / Xbox /
     Xbox 360 / Switch are named and routed to the guide, never
     silently misrouted. Saturn / PSP / Dreamcast are recognised
     and declined as "not in Converter 4.0" (Phase 2 frontier).
   - ISO9660-lite disc sniffing (root listing + SYSTEM.CNF read)
   - ZIP listing / extraction / stored-ZIP writing (multi-file
     boot sets, DOS bundles, saves export)
   - M3U generation for multi-disc PlayStation sets (section 3.5)
   - DOS bundle planning (executable pick + dosbox.conf)
   The DOM layers (player.js, converter.js, dos.js, library.js)
   build on this module so the tested code IS the shipped code. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Converter4Core = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------- content identity ---------------- */

  /* FNV-1a 32-bit: the synchronous, always-available content hash.
     Used for large-file sampled identity and as the fallback when
     crypto.subtle is unavailable (non-secure contexts). */
  function fnv1a(bytes) {
    var h = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = (h * 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  /* SHA-256 hex via WebCrypto when present; resolves null otherwise. */
  function sha256Hex(bytes) {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
        return crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
          var b = new Uint8Array(buf), out = '';
          for (var i = 0; i < b.length; i++) out += ('0' + b[i].toString(16)).slice(-2);
          return out;
        });
      }
    } catch (e) { /* fall through */ }
    return Promise.resolve(null);
  }

  /* The stable game ID for a file: derived from CONTENT, never from
     the file name, so renaming a dump keeps its saves (dossier 3.6).
     Small files hash whole; large files hash a documented sample
     (size + first 1MB + middle 1MB + last 64KB) so a 700MB disc
     identifies in milliseconds and still changes if the disc does. */
  var SAMPLE_FULL_MAX = 64 * 1024 * 1024;
  function sampledBytes(fileSize, readSlice) {
    /* readSlice(offset, length) -> Promise<Uint8Array> */
    if (fileSize <= SAMPLE_FULL_MAX) return readSlice(0, fileSize);
    var parts = [];
    var head = 1024 * 1024, tail = 64 * 1024;
    var midOff = Math.max(0, Math.floor(fileSize / 2) - Math.floor(head / 2));
    return readSlice(0, head).then(function (h) {
      parts.push(h);
      return readSlice(midOff, head);
    }).then(function (m) {
      parts.push(m);
      return readSlice(Math.max(0, fileSize - tail), tail);
    }).then(function (t) {
      parts.push(t);
      var total = parts.reduce(function (a, p) { return a + p.length; }, 0);
      var out = new Uint8Array(total + 8), off = 0, i;
      /* fold the exact size into the sample so two discs that differ
         only past the sampled windows still differ here when their
         sizes differ */
      var sz = fileSize;
      for (i = 0; i < 8; i++) { out[off++] = sz & 0xFF; sz = Math.floor(sz / 256); }
      parts.forEach(function (p) { out.set(p, off); off += p.length; });
      return out;
    });
  }
  function contentIdFor(system, fileSize, readSlice) {
    return sampledBytes(fileSize, readSlice).then(function (bytes) {
      return sha256Hex(bytes).then(function (hex) {
        var digest = hex ? hex.slice(0, 24) : fnv1a(bytes) + fnv1a(bytes.slice(97));
        return 'bm4-' + system + '-' + digest;
      });
    });
  }

  /* ---------------- small byte helpers ---------------- */

  function strAt(bytes, off, len) {
    var s = '';
    for (var i = 0; i < len && off + i < bytes.length; i++) s += String.fromCharCode(bytes[off + i]);
    return s;
  }
  function hasStr(bytes, off, needle) { return strAt(bytes, off, needle.length) === needle; }
  function extOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }
  function u16le(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32le(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
  function u32be(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }

  /* ---------------- CRC32 + ZIP ---------------- */

  var CRC_TABLE = null;
  function crc32(bytes) {
    if (!CRC_TABLE) {
      CRC_TABLE = [];
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        CRC_TABLE[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /* Write a stored (uncompressed) ZIP from [{name, data:Uint8Array}].
     Stored keeps this dependency-free and fast; the consumers
     (EmulatorJS zip intake, js-dos, saves export) all read stored
     entries fine. */
  function zipStore(files) {
    var chunks = [], central = [], offset = 0, i, j;
    function push(arr) { chunks.push(arr); offset += arr.length; }
    function u16(v) { return new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF]); }
    function u32(v) { return new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]); }
    function join(parts) {
      var n = parts.reduce(function (a, p) { return a + p.length; }, 0);
      var out = new Uint8Array(n), o = 0;
      parts.forEach(function (p) { out.set(p, o); o += p.length; });
      return out;
    }
    files.forEach(function (f) {
      var nameBytes = new Uint8Array(f.name.length);
      for (j = 0; j < f.name.length; j++) nameBytes[j] = f.name.charCodeAt(j) & 0x7F;
      var crc = crc32(f.data);
      var localOff = offset;
      push(join([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(f.data.length), u32(f.data.length), u16(nameBytes.length), u16(0)]));
      push(nameBytes);
      push(f.data);
      central.push(join([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(f.data.length), u32(f.data.length), u16(nameBytes.length),
        u16(0), u16(0), u16(0), u16(0), u32(0), u32(localOff)]));
      central[central.length - 1] = join([central[central.length - 1], nameBytes]);
    });
    var cdStart = offset;
    central.forEach(function (c) { push(c); });
    var cdSize = offset - cdStart;
    push(join([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(cdSize), u32(cdStart), u16(0)]));
    return join(chunks);
  }

  /* List ZIP entries from the central directory. Returns
     [{name, size, method, localOffset}] or null if not a ZIP. */
  function zipList(bytes) {
    if (!bytes || bytes.length < 22) return null;
    var eocd = -1;
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65536); i--) {
      if (u32le(bytes, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd === -1) return null;
    var count = u16le(bytes, eocd + 10);
    var off = u32le(bytes, eocd + 16);
    var out = [];
    for (var n = 0; n < count && off + 46 <= bytes.length; n++) {
      if (u32le(bytes, off) !== 0x02014b50) break;
      var method = u16le(bytes, off + 10);
      var size = u32le(bytes, off + 24);
      var nameLen = u16le(bytes, off + 28);
      var extraLen = u16le(bytes, off + 30);
      var commentLen = u16le(bytes, off + 32);
      var localOffset = u32le(bytes, off + 42);
      out.push({ name: strAt(bytes, off + 46, nameLen), size: size, method: method, localOffset: localOffset });
      off += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  }

  /* Extract one entry. Method 0 (stored) is copied; method 8
     (deflate) needs an inflater, supplied by the caller (the site
     vendors pako; its inflateRaw is passed in). */
  function zipExtract(bytes, entry, inflateRaw) {
    var off = entry.localOffset;
    if (u32le(bytes, off) !== 0x04034b50) return null;
    var nameLen = u16le(bytes, off + 26);
    var extraLen = u16le(bytes, off + 28);
    var compSize = u32le(bytes, off + 18);
    var dataOff = off + 30 + nameLen + extraLen;
    var raw = bytes.subarray(dataOff, dataOff + compSize);
    if (entry.method === 0) return new Uint8Array(raw);
    if (entry.method === 8 && inflateRaw) return inflateRaw(raw);
    return null;
  }

  /* ---------------- ISO9660-lite ----------------
     2048-byte sectors only (the common .iso form). Reads the
     primary volume descriptor's root directory record, lists the
     root, and can read one small root file (SYSTEM.CNF). Raw-mode
     2352-byte dumps fall through to extension routing, honestly. */
  function isoInfo(bytes) {
    if (!bytes || bytes.length < 0x8000 + 6) return null;
    if (!hasStr(bytes, 0x8001, 'CD001')) return null;
    var pvd = 0x8000;
    var rootRec = pvd + 156;
    var extent = u32le(bytes, rootRec + 2);
    var dataLen = u32le(bytes, rootRec + 10);
    return { extent: extent, dataLen: dataLen };
  }
  function isoRootEntries(bytes) {
    var info = isoInfo(bytes);
    if (!info) return null;
    var off = info.extent * 2048;
    var end = Math.min(bytes.length, off + info.dataLen);
    var names = [];
    var guard = 0;
    while (off < end && guard++ < 512) {
      var len = bytes[off];
      if (!len) { /* pad to next sector */
        off = (Math.floor(off / 2048) + 1) * 2048;
        if (off >= end) break;
        continue;
      }
      var nameLen = bytes[off + 32];
      var flags = bytes[off + 25];
      var name = strAt(bytes, off + 33, nameLen);
      if (name && name.charCodeAt(0) > 1) {
        names.push({ name: name.replace(/;1$/, ''), dir: !!(flags & 2), extent: u32le(bytes, off + 2), size: u32le(bytes, off + 10) });
      }
      off += len;
    }
    return names;
  }
  function isoReadRootFile(bytes, want) {
    var entries = isoRootEntries(bytes);
    if (!entries) return null;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].name.toUpperCase() === want.toUpperCase() && !entries[i].dir) {
        var start = entries[i].extent * 2048;
        var slice = bytes.subarray(start, Math.min(bytes.length, start + entries[i].size));
        return new Uint8Array(slice);
      }
    }
    return null;
  }

  /* ---------------- the decline table ----------------
     Copy law: respectful, specific, names the native path in a few
     steps, links the guide. Switch carries NO emulator walkthrough
     (dossier 2.13): preservation only. */
  var DECLINES = {
    ps2: {
      system: 'PlayStation 2', tone: 'guide-only',
      headline: 'That is a PlayStation 2 game, and a browser cannot run it yet.',
      body: 'No browser engine plays the PS2 library today. The one browser build that exists drops whole classes of games, and the emulator that plays the library properly, PCSX2, has no web version. Your game is not stuck, it just plays on a computer instead of in a tab.',
      steps: ['Install PCSX2 on your computer (free, Windows, Mac and Linux).', 'Dump the BIOS from your own PlayStation 2, the dumping guide walks it.', 'Load this disc image and play. Your save files live in PCSX2 memory cards you control.'],
      guide: 'guide.html', guideLabel: 'Read the path in the guide'
    },
    gamecube: {
      system: 'GameCube', tone: 'guide-only',
      headline: 'That is a GameCube game, and it plays natively, not in a tab.',
      body: 'Dolphin, the GameCube and Wii emulator, has no browser build. The one WebAssembly prototype is a single-game research demo, not a way to play your library. On a computer, Dolphin plays GameCube games beautifully, many of them better than the original hardware did.',
      steps: ['Install Dolphin on your computer.', 'This file is already in a format Dolphin reads (.iso, .gcm, .rvz and .wbfs all work).', 'Any gamepad works; a GameCube controller adapter works too.'],
      guide: 'guide.html', guideLabel: 'Read the path in the guide'
    },
    wii: {
      system: 'Wii', tone: 'guide-only',
      headline: 'That is a Wii game, and it plays natively, not in a tab.',
      body: 'Beyond the missing browser engine, Wii games expect a Wii Remote: pointer aim and motion have no honest equivalent in a browser tab. Dolphin on a computer handles both, emulated with a mouse and pad, or with a real Wii Remote over Bluetooth.',
      steps: ['Install Dolphin on your computer.', 'Load this disc image; Dolphin reads .iso, .rvz and .wbfs.', 'Map the Wii Remote to your mouse and pad, or pair a real one over Bluetooth.'],
      guide: 'guide.html', guideLabel: 'Read the path in the guide'
    },
    ps3: {
      system: 'PlayStation 3', tone: 'guide-only',
      headline: 'That is a PlayStation 3 game, and no browser can run it.',
      body: 'The PS3 chip is a PowerPC core welded to eight co-processors; the working emulator, RPCS3, asks for a strong desktop CPU and a modern graphics card even before it runs natively. A browser tab is not close, and this site will not pretend otherwise.',
      steps: ['Install RPCS3 on a desktop computer (a mid laptop will frustrate; the guide says why).', 'Install the PS3 system software from the update file for your own console.', 'Check your game on the RPCS3 compatibility list before you invest an evening.'],
      guide: 'guide.html', guideLabel: 'Read the path in the guide'
    },
    xbox: {
      system: 'Xbox (original)', tone: 'guide-only',
      headline: 'That is an original Xbox game, and it plays natively, not in a tab.',
      body: 'The Xbox emulator xemu is a full PC-class machine emulator with no browser build anywhere. It also needs two small files dumped from your own Xbox, which is exactly the kind of thing the guide exists to walk through.',
      steps: ['Install xemu on your computer.', 'Dump the MCPX boot ROM and BIOS from your own Xbox, and convert your disc dump to XISO format.', 'Check your game on the xemu compatibility list; about the popular half of the library plays well.'],
      guide: 'guide.html', guideLabel: 'Read the path in the guide'
    },
    xbox360: {
      system: 'Xbox 360', tone: 'guide-only',
      headline: 'That is an Xbox 360 game, and no browser can run it.',
      body: 'Xenia, the 360 emulator, is native-only and needs a modern CPU and graphics card to transpile a triple-core PowerPC in real time. The interesting exception: a few 360 games have been statically recompiled into native PC ports, Sonic Unleashed among them, and those ports are the best way those games exist anywhere.',
      steps: ['Install Xenia on a Windows computer with a Vulkan-capable graphics card.', 'Load your own dumped disc image or install folder.', 'If your game has a Recompiled release, use that instead; the recompilation guide explains how to find out.'],
      guide: 'guide.html#recompilation', guideLabel: 'Read the recompilation guide'
    },
    n3ds: {
      system: 'Nintendo 3DS', tone: 'guide-only',
      headline: 'That is a Nintendo 3DS game, and it plays natively, not in a tab.',
      body: 'A browser core for the 3DS exists now, but 3DS games are encrypted: a working copy needs keys and decryption from your own console, files run to gigabytes, and browser performance is unproven. The native emulator Azahar, fed a copy you decrypted from your own 3DS, is the honest path today.',
      steps: ['Install Azahar on your computer (free, Windows, Mac and Linux).', 'Decrypt the dump with keys from your own 3DS; an encrypted dump plays nowhere, including here.', 'Load the decrypted copy in Azahar and play.'],
      guide: 'guide.html#3ds', guideLabel: 'Read the path in the guide'
    },
    wiiu: {
      system: 'Wii U', tone: 'guide-only',
      headline: 'That is a Wii U game, and it plays natively, not in a tab.',
      body: 'No browser engine plays Wii U games at all. The native emulator Cemu plays much of the library well on a computer, including the GamePad screen on a second display or a controller stick layout.',
      steps: ['Install Cemu on your computer.', 'Dump your game and its keys from your own Wii U; the guide names the pattern.', 'Load the dump in Cemu and map the GamePad to your controller.'],
      guide: 'guide.html#wiiu', guideLabel: 'Read the path in the guide'
    },
    vita: {
      system: 'PlayStation Vita', tone: 'guide-only',
      headline: 'That is a PlayStation Vita game, and it plays natively, not in a tab.',
      body: 'No browser engine plays Vita games. The native emulator Vita3K plays a growing share of the library on a computer and needs the Vita system files from your own console to do it well.',
      steps: ['Install Vita3K on your computer.', 'Install the Vita firmware from the update file for your own console.', 'Install this package in Vita3K; check your game on its compatibility list first.'],
      guide: 'guide.html#vita', guideLabel: 'Read the path in the guide'
    },
    switch: {
      system: 'Nintendo Switch', tone: 'guide-only',
      headline: 'That is a Switch game, and it stays on your Switch.',
      body: 'This one is a matter of care, not just power. The Switch emulators were shut down under legal action in 2024, and pointing you at what replaced them would put you and this site at risk. Your games play on the hardware you own; what PortPlay can honestly help with is keeping your saves and your collection safe.',
      steps: ['Play it on your Switch; that is the whole path, stated plainly.', 'Back up your saves from your own console so a lost machine is not a lost library.', 'Keep cartridges and receipts; a cared-for collection outlives every storefront.'],
      guide: 'guide.html#switch', guideLabel: 'Read the preservation notes'
    },
    psp: {
      system: 'PSP', tone: 'not-yet',
      headline: 'That is a PSP game. It is on the bench, not on the shelf yet.',
      body: 'PSP in the browser exists as an experimental core, and PortPlay does not ship experiments under a promise. The native emulator PPSSPP is excellent, runs on almost anything, and needs no BIOS: PPSSPP carries its own replacement firmware.',
      steps: ['Install PPSSPP on your computer or phone.', 'Load this file; PPSSPP reads .iso, .cso and .pbp dumps of your own UMDs and purchases.', 'Watch this space: PSP joins the player as a labelled experiment in a later build.'],
      guide: 'guide.html', guideLabel: 'Read more in the guide'
    },
    saturn: {
      system: 'Sega Saturn', tone: 'not-yet',
      headline: 'That is a Sega Saturn game. It is on the bench, not on the shelf yet.',
      body: 'Saturn emulation is real in browser cores, but it is the first system where "your game may run slowly" has to be said out loud, and it needs a BIOS dumped from your own Saturn. PortPlay ships it as a labelled beta in a later build rather than overselling it now.',
      steps: ['Native path today: RetroArch with the Beetle Saturn core, or Yabause for lighter machines.', 'Dump your Saturn BIOS from your own console; the dumping guide covers the pattern.', 'CHD is the kindest format for Saturn discs if you convert your dumps on your computer.'],
      guide: 'guide.html', guideLabel: 'Read more in the guide'
    },
    dreamcast: {
      system: 'Dreamcast', tone: 'not-yet',
      headline: 'That is a Dreamcast game. It is on the bench, not on the shelf yet.',
      body: 'The Dreamcast emulator Flycast is strong natively, but its browser build is the unstable end of the spectrum, so it waits here rather than shipping wobbly. Flycast can even boot through a built-in replacement BIOS when you have no dump handy.',
      steps: ['Install Flycast on your computer.', 'Load this file; Flycast reads .gdi, .cdi, .cue and .chd dumps of your own discs.', 'A BIOS dumped from your own Dreamcast improves compatibility but is optional.'],
      guide: 'guide.html', guideLabel: 'Read more in the guide'
    }
  };

  /* Player-routable cartridge/disc extensions beyond the single-file
     converter's profiles (mirrors the Player's core map). */
  var PLAY_EXTS = {
    nes: 'nes', sfc: 'snes', smc: 'snes', gb: 'gb', gbc: 'gb', gba: 'gba',
    md: 'segaMD', gen: 'segaMD', smd: 'segaMD', sms: 'segaMS', gg: 'segaGG',
    '32x': 'sega32x', n64: 'n64', z64: 'n64', v64: 'n64', nds: 'nds',
    pce: 'pce', vb: 'vb', a26: 'atari2600', a78: 'atari7800', lnx: 'lynx',
    ngp: 'ngp', ngc: 'ngp', ws: 'ws', wsc: 'ws', col: 'coleco',
    /* Completeness wave 2026-10-15: cores that already exist in the
       EmulatorJS family (docs4devs cores list) but routed nowhere.
       a5200 = Atari 5200, jaguar = Atari Jaguar, c64 = Commodore 64
       (VICE), amiga = Commodore Amiga (PUAE, own Kickstart in the
       full player), segaSG = SG-1000 (served by SMS Plus GX; see
       EJS_ALIASES below). The
       rest are format variants of systems already handled: Famicom
       Disk System and UNIF boards on the NES core, SNES copier
       formats, raw Lynx, SuperGrafx, DSi, .agb, .ngpc, .vboy. */
    a52: 'a5200', jag: 'jaguar', j64: 'jaguar',
    d64: 'c64', t64: 'c64', prg: 'c64', crt: 'c64', tap: 'c64',
    adf: 'amiga', sg: 'segaSG',
    fds: 'nes', unf: 'nes', unif: 'nes', fig: 'snes', swc: 'snes', vboy: 'vb',
    lyx: 'lynx', agb: 'gba', sgx: 'pce', ngpc: 'ngp', dsi: 'nds'
  };

  /* System name -> the core file the EmulatorJS CDN actually serves.
     One entry today, each fact proven in the completeness proof pass
     (2026-10-15): the router, labels and coverage call the system
     'segaSG', but no core file by that name exists on the CDN (the
     loader 404s it, a dead screen). The Genesis Plus GX core file is
     not the answer either: in Genesis mode it reads 68000 vectors
     from the cartridge's first bytes, and SG-1000 carts start with
     Z80 code, so real games hang it. The Master System core file
     ('segaMS', SMS Plus GX) is the honest host: the SMS hardware
     itself was backwards compatible with SG-1000 cartridges, and the
     SG-1000 fixture's program runs on it end to end (its backdrop
     colour fills the screen, capture in the landing record). The
     boot paths (stage.js, player.js) translate through this map, so
     the system name a visitor sees stays SG-1000 while the engine
     loads the core that actually plays it. */
  var EJS_ALIASES = { segaSG: 'segaMS' };
  function ejsCoreFor(core) { return EJS_ALIASES[core] || core; }

  /* Content-first detection. Input: {name, size, head} where head is
     a Uint8Array of the file's first bytes (2MB serves every check
     here), plus optional zipEntries when head is a ZIP.
     Returns one of:
       {kind:'play', core, system, via}
       {kind:'decline', key, ...DECLINES[key]}
       {kind:'dos', via}
       {kind:'zip', via}
       {kind:'disc-picker', candidates:[cores], via}  (.iso/.bin we
         cannot identify: the UI asks, with psx pre-selected)
       {kind:'unknown'} */
  function detect(input) {
    var name = String(input.name || '');
    var ext = extOf(name);
    var head = input.head || new Uint8Array(0);

    /* --- container + disc magics, content before extension --- */
    /* A Vita .vpk IS a ZIP archive; the name is the only honest tell,
       so it is read before the ZIP signature below. */
    if (ext === 'vpk') {
      var dv = DECLINES.vita; return { kind: 'decline', key: 'vita', system: dv.system, tone: dv.tone, headline: dv.headline, body: dv.body, steps: dv.steps, guide: dv.guide, guideLabel: dv.guideLabel, via: 'Vita package extension (.vpk)' };
    }
    if (head.length >= 4 && head[0] === 0x50 && head[1] === 0x4B && head[2] === 0x03 && head[3] === 0x04) {
      return { kind: 'zip', via: 'ZIP signature' };
    }
    if (hasStr(head, 0, 'MComprHD')) {
      return { kind: 'play', core: 'psx', system: 'ps1', via: 'CHD container signature', ambiguous: true,
        note: 'CHD holds one disc and the header does not name its system. PlayStation is pre-selected; if this is a Sega CD or 3DO disc, pick that system in the full player before it boots.' };
    }
    /* Nintendo 3DS images carry an NCSD (or NCCH) signature at 0x100. */
    if (head.length >= 0x104 && (hasStr(head, 0x100, 'NCSD') || hasStr(head, 0x100, 'NCCH'))) {
      var d0 = DECLINES.n3ds; return { kind: 'decline', key: 'n3ds', system: d0.system, tone: d0.tone, headline: d0.headline, body: d0.body, steps: d0.steps, guide: d0.guide, guideLabel: d0.guideLabel, via: '3DS NCSD signature in the header' };
    }
    if (hasStr(head, 0, 'CISO')) {
      var d = DECLINES.psp; return { kind: 'decline', key: 'psp', system: d.system, tone: d.tone, headline: d.headline, body: d.body, steps: d.steps, guide: d.guide, guideLabel: d.guideLabel, via: 'CSO container signature' };
    }
    if (head.length >= 4 && head[0] === 0x00 && head[1] === 0x50 && head[2] === 0x42 && head[3] === 0x50) {
      var d2 = DECLINES.psp; return { kind: 'decline', key: 'psp', system: d2.system, tone: d2.tone, headline: d2.headline, body: d2.body, steps: d2.steps, guide: d2.guide, guideLabel: d2.guideLabel, via: 'PBP package signature' };
    }
    if (hasStr(head, 0, 'SEGADISCSYSTEM')) {
      return { kind: 'play', core: 'segaCD', system: 'segacd', via: 'Sega CD disc signature' };
    }
    if (hasStr(head, 0, 'SEGA SEGASATURN')) {
      var d3 = DECLINES.saturn; return { kind: 'decline', key: 'saturn', system: d3.system, tone: d3.tone, headline: d3.headline, body: d3.body, steps: d3.steps, guide: d3.guide, guideLabel: d3.guideLabel, via: 'Saturn disc signature' };
    }
    if (hasStr(head, 0, 'SEGA SEGAKATANA')) {
      var d4 = DECLINES.dreamcast; return { kind: 'decline', key: 'dreamcast', system: d4.system, tone: d4.tone, headline: d4.headline, body: d4.body, steps: d4.steps, guide: d4.guide, guideLabel: d4.guideLabel, via: 'Dreamcast disc signature' };
    }
    if (head.length >= 0x20 && u32be(head, 0x1C) === 0xC2339F3D) {
      var d5 = DECLINES.gamecube; return { kind: 'decline', key: 'gamecube', system: d5.system, tone: d5.tone, headline: d5.headline, body: d5.body, steps: d5.steps, guide: d5.guide, guideLabel: d5.guideLabel, via: 'GameCube disc magic' };
    }
    if (head.length >= 0x1C && u32be(head, 0x18) === 0x5D1C9EA3) {
      var d6 = DECLINES.wii; return { kind: 'decline', key: 'wii', system: d6.system, tone: d6.tone, headline: d6.headline, body: d6.body, steps: d6.steps, guide: d6.guide, guideLabel: d6.guideLabel, via: 'Wii disc magic' };
    }

    /* --- ISO9660 sniffing: the disc names its own system --- */
    var iso = isoInfo(head);
    if (iso) {
      var entries = isoRootEntries(head) || [];
      var names = entries.map(function (e) { return e.name.toUpperCase(); });
      function declineFor(key, via) {
        var dd = DECLINES[key];
        return { kind: 'decline', key: key, system: dd.system, tone: dd.tone, headline: dd.headline, body: dd.body, steps: dd.steps, guide: dd.guide, guideLabel: dd.guideLabel, via: via };
      }
      if (names.indexOf('PS3_GAME') !== -1) return declineFor('ps3', 'ISO root holds a PS3_GAME folder');
      if (names.indexOf('PSP_GAME') !== -1 || names.indexOf('UMD_VIDEO') !== -1) return declineFor('psp', 'ISO root holds a PSP_GAME folder');
      var cnf = isoReadRootFile(head, 'SYSTEM.CNF');
      if (cnf) {
        var text = strAt(cnf, 0, Math.min(cnf.length, 512));
        if (/BOOT2\s*=/.test(text)) return declineFor('ps2', 'SYSTEM.CNF boots with BOOT2 (PlayStation 2)');
        if (/BOOT\s*=/.test(text)) return { kind: 'play', core: 'psx', system: 'ps1', via: 'SYSTEM.CNF boots with BOOT (PlayStation)' };
      }
      if (names.some(function (n) { return n.indexOf('SLUS') === 0 || n.indexOf('SCUS') === 0 || n.indexOf('SLES') === 0 || n.indexOf('SCES') === 0; })) {
        return { kind: 'disc-picker', candidates: ['psx', 'ps2'], via: 'ISO carries a PlayStation-style disc code but no readable SYSTEM.CNF' };
      }
      return { kind: 'disc-picker', candidates: ['psx', 'segaCD', '3do'], via: 'ISO9660 disc the header does not identify further' };
    }

    /* --- .bin content routes: the generic extension, read honestly ---
       A small .bin carrying a TMR SEGA header (0x1FF0, 0x3FF0 or
       0x7FF0) is a Master System or Game Gear cartridge dump; the
       header cannot split the two, so Master System is pre-selected
       with the ambiguity stated. A small .bin carrying the SEGA
       string at 0x100 is a Genesis cartridge dump (the disc systems
       with SEGA headers were all caught by signature above). */
    if (ext === 'bin' && input.size && input.size <= 2 * 1024 * 1024 &&
        (hasStr(head, 0x7FF0, 'TMR SEGA') || hasStr(head, 0x3FF0, 'TMR SEGA') || hasStr(head, 0x1FF0, 'TMR SEGA'))) {
      return { kind: 'play', core: 'segaMS', system: 'sms', via: 'TMR SEGA cartridge header in a .bin dump', ambiguous: true,
        note: 'This .bin carries a Master System family header. Master System is pre-selected; if this is a Game Gear game, open it in the full player and pick Game Gear there.' };
    }
    if (ext === 'bin' && input.size && input.size <= 8 * 1024 * 1024 && hasStr(head, 0x100, 'SEGA')) {
      return { kind: 'play', core: 'segaMD', system: 'md', via: 'Genesis cartridge header in a .bin dump' };
    }

    /* --- extension routing (fallback + fast path) --- */
    if (ext === 'fds') {
      return { kind: 'play', core: 'nes', system: 'fds', via: 'Famicom Disk System extension', ambiguous: true,
        note: 'Disk System games need the disk BIOS (disksys.rom) dumped from your own Famicom Disk System. Attach it with the BIOS picker in the full player; without it this disc will not boot.' };
    }
    if (PLAY_EXTS[ext]) return { kind: 'play', core: PLAY_EXTS[ext], system: ext, via: 'file extension' };
    if (ext === 'm3u') return { kind: 'play', core: 'psx', system: 'ps1', via: 'M3U playlist' };
    if (ext === 'cue') return { kind: 'play', core: 'psx', system: 'ps1', via: 'cue sheet (PlayStation pre-selected)', ambiguous: true, note: 'A cue sheet does not name its system. PlayStation is pre-selected; Sega CD cue sheets should be switched with the system picker before booting.' };
    if (ext === 'exe' || ext === 'com' || ext === 'bat') return { kind: 'dos', via: 'DOS program extension' };
    if (ext === 'jsdos') return { kind: 'dos', via: 'js-dos bundle' };
    var DECLINE_EXTS = { nsp: 'switch', xci: 'switch', nca: 'switch', nro: 'switch', xiso: 'xbox', xex: 'xbox360', wbfs: 'wii', rvz: 'gamecube', gcm: 'gamecube', pbp: 'psp', cso: 'psp', cdi: 'dreamcast', gdi: 'dreamcast', '3ds': 'n3ds', cci: 'n3ds', cia: 'n3ds', wud: 'wiiu', wux: 'wiiu', rpx: 'wiiu', vpk: 'vita' };
    if (DECLINE_EXTS[ext]) {
      var key = DECLINE_EXTS[ext], dd2 = DECLINES[key];
      return { kind: 'decline', key: key, system: dd2.system, tone: dd2.tone, headline: dd2.headline, body: dd2.body, steps: dd2.steps, guide: dd2.guide, guideLabel: dd2.guideLabel, via: '.' + ext + ' file extension' };
    }
    if (ext === 'iso' || ext === 'img') {
      return { kind: 'disc-picker', candidates: ['psx', 'segaCD', '3do'], via: 'unidentified disc image extension' };
    }
    if (ext === 'bin') {
      return { kind: 'disc-picker', candidates: ['psx', 'segaCD', '3do'], via: 'raw disc track extension (needs its .cue for CD audio)' };
    }
    if (ext === 'chd') {
      return { kind: 'play', core: 'psx', system: 'ps1', via: 'CHD extension', ambiguous: true, note: 'CHD does not name its system in the extension. PlayStation is pre-selected; pick Sega CD above if that is what this is.' };
    }
    return { kind: 'unknown', via: 'no signature or known extension' };
  }

  /* Folder intake (DOS corner / decline sets): names only. A folder
     holding PS3_GAME is a PS3 dump; a folder holding executables
     and data files is a DOS game until proven otherwise. */
  function detectFolder(names) {
    var upper = names.map(function (n) { return n.toUpperCase(); });
    if (upper.some(function (n) { return n.indexOf('PS3_GAME') !== -1; })) {
      var d = DECLINES.ps3;
      return { kind: 'decline', key: 'ps3', system: d.system, tone: d.tone, headline: d.headline, body: d.body, steps: d.steps, guide: d.guide, guideLabel: d.guideLabel, via: 'folder holds a PS3_GAME directory' };
    }
    if (upper.some(function (n) { return /\.(NSP|XCI)$/.test(n); })) {
      var d2 = DECLINES.switch;
      return { kind: 'decline', key: 'switch', system: d2.system, tone: d2.tone, headline: d2.headline, body: d2.body, steps: d2.steps, guide: d2.guide, guideLabel: d2.guideLabel, via: 'folder holds Switch package files' };
    }
    if (chooseDosExecutable(names)) return { kind: 'dos', via: 'folder holds DOS program files' };
    return { kind: 'unknown', via: 'folder contents not recognised' };
  }

  /* ---------------- M3U (dossier 3.5) ---------------- */

  function buildM3U(discFileNames) {
    return '#EXTM3U\n' + discFileNames.join('\n') + (discFileNames.length ? '\n' : '');
  }
  function discSortKey(name) {
    var m = /(?:disc|disk|cd)\s*[-_ ]?(\d+)/i.exec(name);
    return m ? parseInt(m[1], 10) : 99;
  }

  /* ---------------- DOS bundle planning ---------------- */

  function chooseDosExecutable(names) {
    var cands = names.filter(function (n) { return /\.(exe|com|bat)$/i.test(n); });
    if (!cands.length) return null;
    function depth(n) { return n.split('/').length; }
    var preferred = ['start', 'go', 'play', 'run', 'setup', 'install'];
    cands.sort(function (a, b) {
      var da = depth(a), db = depth(b);
      if (da !== db) return da - db;
      var ba = a.split('/').pop().replace(/\.(exe|com|bat)$/i, '').toLowerCase();
      var bb = b.split('/').pop().replace(/\.(exe|com|bat)$/i, '').toLowerCase();
      var pa = preferred.indexOf(ba), pb = preferred.indexOf(bb);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      if (/\.bat$/i.test(a) !== /\.bat$/i.test(b)) return /\.bat$/i.test(a) ? -1 : 1;
      return a.localeCompare(b);
    });
    return cands[0];
  }

  function dosboxConf(execPath) {
    var parts = String(execPath).replace(/\\/g, '/').split('/');
    var file = parts.pop();
    var dir = parts.join('/');
    var lines = [
      '# PortPlay DOS bundle. Built in your browser from',
      '# your own files; nothing was uploaded. Edit freely, this is',
      '# a standard dosbox.conf.',
      '[sdl]',
      'fullscreen=false',
      'output=surface',
      '',
      '[cpu]',
      'core=auto',
      'cycles=auto',
      '',
      '[mixer]',
      'nosound=false',
      '',
      '[autoexec]',
      'mount C .',
      'C:'
    ];
    if (dir) lines.push('cd ' + dir.replace(/\//g, '\\'));
    lines.push(file);
    return lines.join('\n') + '\n';
  }

  return {
    VERSION: '4.0',
    fnv1a: fnv1a,
    sha256Hex: sha256Hex,
    contentIdFor: contentIdFor,
    sampledBytes: sampledBytes,
    crc32: crc32,
    zipStore: zipStore,
    zipList: zipList,
    zipExtract: zipExtract,
    isoInfo: isoInfo,
    isoRootEntries: isoRootEntries,
    isoReadRootFile: isoReadRootFile,
    detect: detect,
    detectFolder: detectFolder,
    DECLINES: DECLINES,
    EJS_ALIASES: EJS_ALIASES,
    ejsCoreFor: ejsCoreFor,
    buildM3U: buildM3U,
    discSortKey: discSortKey,
    chooseDosExecutable: chooseDosExecutable,
    dosboxConf: dosboxConf,
    extOf: extOf,
    strAt: strAt
  };
}));
