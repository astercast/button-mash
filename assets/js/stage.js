/* PortPlay stage: the drop-and-play moment.
   One surface does the whole job: a dropped file is identified by
   its bytes (converter4-core), boots on this screen (EmulatorJS),
   and, for the cartridge systems the single-file converter proves,
   is also built into a portable HTML file in the background
   (converter-core). Nothing uploads, ever; the only network fetch
   is the emulator engine itself, from the EmulatorJS CDN, and the
   game template, from this site. */
(function () {
  'use strict';

  var C = window.ConverterCore;
  var C4 = window.Converter4Core;
  var UI = window.BMConv4;
  var CFG = window.PORTPLAY || { name: 'PortPlay', engineCdn: 'https://cdn.emulatorjs.org/stable/data/' };

  var stage, screen, idleFace, fileInput, readoutText, readoutGame, filament, filamentFill, queueEl;
  var booted = false;
  var currentBlobUrl = null;
  var templateCache = null;

  var SYSTEM_LABELS = {
    nes: 'NES', snes: 'Super Nintendo', gb: 'Game Boy / Color', gba: 'Game Boy Advance',
    segaMD: 'Genesis / Mega Drive', segaMS: 'Master System', segaGG: 'Game Gear',
    sega32x: '32X', segaCD: 'Sega CD', psx: 'PlayStation', ps1: 'PlayStation',
    n64: 'Nintendo 64', nds: 'Nintendo DS', pce: 'TurboGrafx-16', vb: 'Virtual Boy',
    atari2600: 'Atari 2600', atari7800: 'Atari 7800', lynx: 'Atari Lynx',
    ngp: 'Neo Geo Pocket', ws: 'WonderSwan', coleco: 'ColecoVision',
    a5200: 'Atari 5200', jaguar: 'Atari Jaguar', c64: 'Commodore 64',
    amiga: 'Commodore Amiga', segaSG: 'SG-1000', '3do': '3DO'
  };
  var BOOT_NOTES = {
    psx: 'Playing with the built-in BIOS replacement. If this disc refuses to boot, the full player takes a BIOS dumped from your own console.',
    segaCD: 'Sega CD games need a BIOS dumped from your own Sega CD before they can boot. The full player takes one with its BIOS picker; without it this disc will not boot.',
    amiga: 'Amiga games need a Kickstart ROM from an Amiga you own. The full player takes one with its BIOS picker; without it this floppy will not boot.',
    '3do': '3DO games need a BIOS dumped from your own 3DO console. The full player takes one with its BIOS picker; without it this disc will not boot.',
    lynx: 'Lynx games need the boot image (lynxboot.img) dumped from your own Lynx before they can boot. The full player takes one with its BIOS picker; without it this game stays on a black screen.',
    coleco: 'ColecoVision games need the console BIOS (colecovision.rom) dumped from your own ColecoVision before they can boot. The full player takes one with its BIOS picker; without it this game sits on a NO BIOS screen.',
    c64: 'The Commodore 64 starts at its READY prompt, like the real machine. Click the screen, type RUN and press Enter for a program; for a disk, LOAD"*",8,1 first, then RUN.'
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return C ? C.escHtml(s) : String(s); }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var currentState = 'idle';
  function setState(state) {
    currentState = state;
    if (stage) stage.setAttribute('data-state', state);
  }
  function getState() { return currentState; }
  function setReadout(text, game) {
    if (readoutText) readoutText.textContent = text;
    if (readoutGame) readoutGame.textContent = game || '';
  }
  function setProgress(pct) {
    if (pct == null) { filamentFill.style.width = '0%'; filament.setAttribute('aria-valuenow', '0'); return; }
    filamentFill.style.width = Math.round(pct) + '%';
    filament.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  /* ---------- kinetic headline ---------- */
  function kinetic() {
    if (reducedMotion() || !document.querySelector('.kw')) return;
    document.querySelectorAll('.hero-title .kw').forEach(function (word, i) {
      try {
        word.animate(
          [{ fontVariationSettings: '"wght" 180' }, { fontVariationSettings: '"wght" 700' }],
          { duration: 900, delay: 120 + i * 90, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
        );
      } catch (e) { /* static weight is fine */ }
    });
  }

  /* ---------- emulator boot (mirrors the full player's boot) ---------- */
  function readSliceOf(file) {
    return function (offset, length) {
      return file.slice(offset, offset + length).arrayBuffer().then(function (b) { return new Uint8Array(b); });
    };
  }

  function teardown() {
    var scr = $('ejs-screen');
    if (scr) scr.remove();
    if (window.EJS_emulator) {
      try { if (typeof window.EJS_emulator.destroy === 'function') window.EJS_emulator.destroy(); } catch (e) {}
      window.EJS_emulator = null;
    }
    document.querySelectorAll('script[data-ejs]').forEach(function (s) { s.remove(); });
    if (currentBlobUrl) { try { URL.revokeObjectURL(currentBlobUrl); } catch (e) {} currentBlobUrl = null; }
    booted = false;
  }

  async function boot(file, core, det) {
    teardown();
    var contentId = null;
    try { contentId = await C4.contentIdFor(core, file.size, readSliceOf(file)); } catch (e) { contentId = null; }
    currentBlobUrl = URL.createObjectURL(file);
    var mount = document.createElement('div');
    mount.id = 'ejs-screen';
    screen.appendChild(mount);

    window.EJS_player = '#ejs-screen';
    window.EJS_core = C4.ejsCoreFor ? C4.ejsCoreFor(core) : core;
    window.EJS_gameUrl = currentBlobUrl;
    window.EJS_gameName = file.name.replace(/\.[^.]+$/, '');
    window.EJS_gameID = contentId || ('pp-' + file.name.length + '-' + file.size.toString(36));
    window.EJS_pathtodata = CFG.engineCdn;
    window.EJS_startOnLoaded = true;
    window.EJS_backgroundColor = '#000000';
    delete window.EJS_biosUrl;
    window.EJS_onGameStart = function () {
      setState('playing');
      setReadout('Now playing', window.EJS_gameName);
      setProgress(null);
    };
    var script = document.createElement('script');
    script.src = CFG.engineCdn + 'loader.js';
    script.setAttribute('data-ejs', '1');
    script.onerror = function () {
      setState('no');
      setReadout('The engine failed to load. Check your connection and drop the file again.');
      setProgress(null);
    };
    document.head.appendChild(script);
    booted = true;
    setState('reading');
    setReadout('Loading ' + (SYSTEM_LABELS[core] || core) + ' engine', file.name);
    if (det && det.ambiguous && det.note) addNoteCard(file.name, det.note);
    if (BOOT_NOTES[core]) {
      addNoteCard(file.name, BOOT_NOTES[core]);
    }
  }

  /* ---------- cards ---------- */
  function addCard(cls) {
    var card = document.createElement('article');
    card.className = 'q-card' + (cls ? ' ' + cls : '');
    queueEl.appendChild(card);
    return card;
  }
  function cardMain(card, name, meta) {
    var main = document.createElement('div');
    main.className = 'q-main';
    var n = document.createElement('p'); n.className = 'q-name'; n.textContent = name;
    var m = document.createElement('p'); m.className = 'q-meta'; m.textContent = meta;
    main.appendChild(n); main.appendChild(m);
    card.appendChild(main);
    return main;
  }
  function cardMsg(card, html) {
    var p = document.createElement('p');
    p.className = 'q-msg'; p.innerHTML = html;
    card.appendChild(p);
    return p;
  }
  function addNoteCard(name, text) {
    var card = addCard();
    cardMain(card, name, 'Note');
    cardMsg(card, esc(text));
    return card;
  }

  /* ---------- the portable-file build (converter-core pipeline) ---------- */
  async function loadTemplate() {
    if (templateCache) return templateCache;
    var res = await fetch('assets/vendor/template-game.html', { cache: 'no-store' });
    if (!res.ok) throw new Error('Game template failed to load (HTTP ' + res.status + ').');
    templateCache = await res.text();
    return templateCache;
  }
  /* Conversion runs in a Web Worker when the browser allows one, so a
     32 MB cartridge never stalls the stage's motion or input. The worker
     loads the same vendored pako the page uses; any failure (blocked
     workers, an old browser) falls back to the chunked main-thread path
     below, and the visitor never sees the difference. */
  function workerDeflate(bytes, level, onPct) {
    return new Promise(function (resolve, reject) {
      var pakoUrl = new URL('assets/vendor/pako.min.js', window.location.href).href;
      var src =
        "importScripts(" + JSON.stringify(pakoUrl) + ");\n" +
        "onmessage = function (e) {\n" +
        "  var d = e.data;\n" +
        "  if (typeof pako === 'undefined' || !pako.Deflate) { postMessage({ t: 'e', v: 'pako missing in worker' }); return; }\n" +
        "  var buf = new Uint8Array(d.buf);\n" +
        "  var def = new pako.Deflate({ level: d.level });\n" +
        "  var CH = 1048576, off = 0;\n" +
        "  while (off < buf.length) {\n" +
        "    var end = Math.min(off + CH, buf.length);\n" +
        "    def.push(buf.subarray(off, end), end >= buf.length);\n" +
        "    off = end;\n" +
        "    postMessage({ t: 'p', v: off / buf.length });\n" +
        "  }\n" +
        "  if (def.err) { postMessage({ t: 'e', v: 'Compression failed in worker.' }); return; }\n" +
        "  postMessage({ t: 'd', buf: def.result.buffer }, [def.result.buffer]);\n" +
        "};";
      var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      var w = new Worker(url);
      function done() { try { w.terminate(); } catch (e) {} URL.revokeObjectURL(url); }
      w.onmessage = function (e) {
        var m = e.data || {};
        if (m.t === 'p') { onPct(8 + m.v * 47); return; }
        done();
        if (m.t === 'd') resolve(new Uint8Array(m.buf));
        else reject(new Error(m.v || 'Worker compression failed.'));
      };
      w.onerror = function () { done(); reject(new Error('Worker unavailable.')); };
      w.postMessage({ buf: bytes.buffer, level: level });
    });
  }
  async function deflateBytes(bytes, level, onPct) {
    if (window.Worker) {
      try { return await workerDeflate(bytes, level, onPct); }
      catch (e) { /* fall through to the main-thread path */ }
    }
    if (!window.pako || !window.pako.Deflate) throw new Error('The compression engine failed to load. Reload and try again.');
    var def = new window.pako.Deflate({ level: level });
    var CHUNK = 1024 * 1024, offset = 0;
    while (offset < bytes.length) {
      var end = Math.min(offset + CHUNK, bytes.length);
      def.push(bytes.subarray(offset, end), end >= bytes.length);
      offset = end;
      onPct(8 + (offset / bytes.length) * 47);
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    if (def.err) throw new Error('Compression failed. Reload and try again.');
    return def.result;
  }
  async function bytesToBase64(bytes, base, span, onPct) {
    var CHUNK = 0x8000, SLICE = CHUNK * 64, parts = [], offset = 0;
    while (offset < bytes.length) {
      var end = Math.min(offset + SLICE, bytes.length);
      var binary = '';
      for (var i = offset; i < end; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, end)));
      }
      parts.push(btoa(binary));
      offset = end;
      onPct(base + (offset / bytes.length) * span);
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    return parts.join('');
  }

  /* Builds the portable file for one cartridge file. Never blocks play. */
  async function buildPortable(file, profile, card) {
    var fill = card.querySelector('.filament i');
    function pct(p) { if (fill) fill.style.width = p + '%'; setProgress(p); }
    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      var v = C.validateRom(bytes, profile.key);
      if (v.errors.length) throw new Error(v.errors[0]);
      var level = 6; /* Balanced, the level the converter recommends */
      var payload = await deflateBytes(bytes, level, pct);
      var b64 = await bytesToBase64(payload, 55, 30, pct);
      var template = await loadTemplate();
      var name = C.baseName(file.name, profile);
      var html = C.buildHtml(template, {
        name: name,
        gameId: C.makeGameId(name, file.size),
        buildDate: new Date().toISOString().slice(0, 10),
        romSize: C.fmtBytes(file.size),
        romB64: b64,
        core: profile.core,
        coreLabel: profile.engine + ' core',
        system: profile.system,
        hint: profile.hint,
        compressed: '1',
        cover: ''
      });
      var blob = new Blob([html], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      var dl = document.createElement('a');
      dl.className = 'btn btn-small';
      dl.href = url;
      dl.download = C.makeDownloadName(name);
      dl.textContent = 'Download portable file · ' + C.fmtBytes(blob.size);
      card.appendChild(dl);
      pct(100);
      var msg = card.querySelector('.q-msg');
      if (msg) msg.innerHTML = '<strong>Portable copy ready.</strong> One HTML file, the game and its player together. It opens in any modern browser, no PortPlay needed.' +
        (v.warnings.length ? ' Built with a header note from validation: ' + esc(v.warnings[0]) : '');
      setProgress(null);
    } catch (e) {
      card.classList.add('warn');
      var msg2 = card.querySelector('.q-msg');
      if (msg2) msg2.innerHTML = '<strong>The game plays above; its portable copy did not build.</strong> ' + esc(e.message || String(e));
      setProgress(null);
    }
  }

  /* ---------- routing ---------- */
  async function detectFile(file) {
    var headLen = Math.min(file.size, 2 * 1024 * 1024);
    var head = await readSliceOf(file)(0, headLen);
    return C4.detect({ name: file.name, size: file.size, head: head });
  }

  function playCard(file, det) {
    var card = addCard();
    cardMain(card, file.name, (SYSTEM_LABELS[det.core] || det.system || det.core) + ' · identified by ' + (det.via || 'content'));
    cardMsg(card, '<strong>Converted and playing above.</strong> Your file never left this device.');
    var again = document.createElement('button');
    again.className = 'btn btn-ghost btn-small';
    again.type = 'button';
    again.textContent = 'Restart this game';
    again.addEventListener('click', function () { boot(file, det.core, det); });
    card.appendChild(again);
    return card;
  }

  async function routePlay(file, det) {
    var profile = C.profileFor(file.name);
    var card = null;
    if (profile) {
      /* Cartridge: play now, portable copy builds alongside. */
      card = addCard();
      cardMain(card, file.name, profile.system + ' · ' + profile.engine + ' core');
      var msg = cardMsg(card, '<strong>Playing above.</strong> Building your portable copy…');
      msg.insertAdjacentHTML('afterend', '<div class="filament" style="flex-basis:100%"><i style="width:0%"></i></div>');
      boot(file, det.core, det);
      buildPortable(file, profile, card);
    } else {
      boot(file, det.core, det);
      playCard(file, det);
    }
  }

  function routeDecline(file, det) {
    setState('no');
    setReadout('That one cannot run in a browser', file.name);
    var card = UI.declineCard(det, file.name);
    queueEl.appendChild(card);
  }

  function routeDos(files, label) {
    var card = addCard();
    cardMain(card, label, 'DOS game');
    cardMsg(card, '<strong>A DOS game.</strong> DOS games get their own room here: your files are wrapped into a .jsdos bundle in this browser and booted under DOSBox. Nothing uploads; the bundle is built and kept on this device.');
    var go = document.createElement('button');
    go.className = 'btn btn-small'; go.type = 'button'; go.textContent = 'Take it to the DOS room';
    go.addEventListener('click', function () { UI.stageDosAndGo(files, null); });
    card.appendChild(go);
  }

  async function routeZip(file) {
    var buf = new Uint8Array(await file.arrayBuffer());
    var entries = C4.zipList(buf);
    if (!entries || !entries.length) {
      var bad = addCard('warn');
      cardMain(bad, file.name, 'ZIP archive');
      cardMsg(bad, '<strong>That ZIP could not be read as an archive.</strong> If it holds a game, unzip it and drop the files themselves.');
      return;
    }
    var names = entries.map(function (e) { return e.name; });
    var folderDet = C4.detectFolder(names);
    if (folderDet.kind === 'decline') { routeDecline(file, folderDet); return; }
    if (folderDet.kind === 'dos') { routeDos([file], file.name); return; }
    var PLAYABLE = { nes: 1, sfc: 1, smc: 1, gb: 1, gbc: 1, gba: 1, md: 1, gen: 1, smd: 1, sms: 1, gg: 1, '32x': 1, n64: 1, z64: 1, v64: 1, nds: 1, pce: 1, vb: 1, a26: 1, a78: 1, lnx: 1, ngp: 1, ngc: 1, ws: 1, wsc: 1, col: 1, cue: 1, m3u: 1, chd: 1, a52: 1, jag: 1, j64: 1, d64: 1, t64: 1, prg: 1, crt: 1, tap: 1, adf: 1, sg: 1, fds: 1, unf: 1, unif: 1, fig: 1, swc: 1, vboy: 1, lyx: 1, agb: 1, sgx: 1, ngpc: 1, dsi: 1 };
    var romEntries = entries.filter(function (e) { return PLAYABLE[C4.extOf(e.name)]; });
    if (romEntries.length === 1 && entries.length <= 3) {
      var data = C4.zipExtract(buf, romEntries[0], window.pako ? window.pako.inflateRaw : null);
      if (data) {
        var inner = new File([data], romEntries[0].name.split('/').pop(), { type: 'application/octet-stream' });
        await routeFile(inner);
        return;
      }
    }
    if (entries.some(function (e) { return /\.(cue|m3u|chd)$/i.test(e.name); })) {
      /* A zipped disc set: the engine extracts archives natively. */
      var det = { kind: 'play', core: 'psx', system: 'ps1', via: 'zipped disc set' };
      boot(file, 'psx', det);
      playCard(file, det);
      return;
    }
    var none = addCard('warn');
    cardMain(none, file.name, 'ZIP archive · ' + entries.length + ' files');
    cardMsg(none, '<strong>None of the files inside are ones PortPlay recognises.</strong> Cartridges and discs can be dropped directly; DOS games go to the DOS room.');
  }

  async function routeSet(files) {
    /* A multi-file drop: a disc set (BIN+CUE, M3U sets) or a folder of
       DOS files. Sets are assembled into a stored ZIP in this browser,
       the same way the full player does it, and booted as one file. */
    var names = files.map(function (f) { return f.webkitRelativePath || f.name; });
    var folderDet = C4.detectFolder(names);
    if (folderDet.kind === 'decline') { routeDecline(files[0], folderDet); return; }
    if (folderDet.kind === 'dos') { routeDos(files, names.length + ' files'); return; }
    var hasDisc = files.some(function (f) { return /\.(cue|m3u|chd|bin|iso)$/i.test(f.name); });
    if (!hasDisc) {
      for (var i = 0; i < files.length; i++) await routeFile(files[i]);
      return;
    }
    setState('reading');
    setReadout('Assembling your disc set on this device', '');
    var parts = [];
    for (var j = 0; j < files.length; j++) {
      parts.push({ name: names[j].split('/').pop(), data: new Uint8Array(await files[j].arrayBuffer()) });
    }
    var m3u = files.filter(function (f) { return /\.m3u$/i.test(f.name); })[0];
    var bootName = m3u ? m3u.name : (files.filter(function (f) { return /\.cue$/i.test(f.name); })[0] || files[0]).name;
    var zip = C4.zipStore(parts);
    var zipFile = new File([zip], bootName.replace(/\.[^.]+$/, '') + '.zip', { type: 'application/zip' });
    var det = { kind: 'play', core: 'psx', system: 'ps1', via: 'multi-file disc set' };
    boot(zipFile, 'psx', det);
    playCard(zipFile, det);
  }

  async function routeFile(file) {
    setState('reading');
    setReadout('Reading the file itself', file.name);
    setProgress(12);
    var det;
    try { det = await detectFile(file); } catch (e) { det = { kind: 'unknown' }; }
    setProgress(null);
    if (det.kind === 'play') { await routePlay(file, det); return; }
    if (det.kind === 'decline') { routeDecline(file, det); return; }
    if (det.kind === 'dos') { routeDos([file], file.name); setState('idle'); return; }
    if (det.kind === 'zip') { await routeZip(file); return; }
    if (det.kind === 'disc-picker') {
      setState('idle');
      var card = addCard();
      cardMain(card, file.name, 'Disc image · ' + det.via);
      cardMsg(card, '<strong>This disc does not name its system in its header.</strong> Pick the system it belongs to and it boots. Nothing about the file changes.');
      det.candidates.forEach(function (core, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-small' + (i === 0 ? '' : ' btn-ghost');
        b.textContent = 'Boot as ' + (SYSTEM_LABELS[core] || core);
        b.addEventListener('click', function () { boot(file, core, det); card.remove(); });
        card.appendChild(b);
      });
      return;
    }
    /* unknown */
    setState('no');
    setReadout('That file is not one PortPlay recognises', file.name);
    var unk = addCard('warn');
    cardMain(unk, file.name, 'Unrecognised file');
    cardMsg(unk, '<strong>Not a supported game file, and not one we recognise.</strong> PortPlay handles the systems in the coverage list below. If this is a game for a system no browser can run, the <a href="guide.html">guide</a> has the honest route.');
  }

  async function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    if (files.length === 1) { await routeFile(files[0]); return; }
    await routeSet(files);
  }

  /* ---------- coverage (generated from the converter's own code) ---------- */
  function renderCoverage() {
    fetch('data/v1/coverage.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (cov) {
      if (!cov) return;
      var groups = { convert: cov.convert, play: cov.play, guide: cov.guide };
      Object.keys(groups).forEach(function (key) {
        var host = document.querySelector('[data-cov="' + key + '"]');
        if (!host) return;
        host.innerHTML = '';
        (groups[key] || []).forEach(function (item) {
          var chip = document.createElement('span');
          chip.className = 'chip';
          chip.innerHTML = '<b>' + esc(item.name) + '</b>' + (item.note ? ' ' + esc(item.note) : '');
          host.appendChild(chip);
        });
      });
    }).catch(function () { /* static fallback below stays */ });
    /* Static fallback: rendered only if the fetch has not landed yet
       is unnecessary complexity; the JSON is same-origin and fast.
       If it fails, the groups stay labelled by their headings. */
  }

  /* ---------- wiring ---------- */
  function init() {
    stage = $('stage'); screen = $('screen'); idleFace = $('idle-face');
    fileInput = $('file-input'); readoutText = $('readout-text'); readoutGame = $('readout-game');
    filament = $('filament'); filamentFill = $('filament-fill'); queueEl = $('queue');
    if (!stage || !C || !C4) return;

    kinetic();
    renderCoverage();

    idleFace.addEventListener('click', function () { fileInput.click(); });
    idleFace.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener('change', function () {
      handleFiles(fileInput.files);
      fileInput.value = '';
    });

    ['dragenter', 'dragover'].forEach(function (ev) {
      stage.addEventListener(ev, function (e) { e.preventDefault(); setState('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      stage.addEventListener(ev, function (e) {
        e.preventDefault();
        if (ev === 'dragleave' && stage.contains(e.relatedTarget)) return;
        /* Only a drag-in-progress resets on leave/drop; a conversion in
           flight (reading) or a playable state is never clobbered. */
        if (getState() !== 'drag') return;
        setState(booted ? 'playing' : 'idle');
      });
    });
    stage.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (dt) handleFiles(dt.files);
    });
    ['dragover', 'drop'].forEach(function (ev) {
      window.addEventListener(ev, function (e) { e.preventDefault(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
