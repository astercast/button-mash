/* Button Mash Player — EmulatorJS "bring your own file" console.
   The site hosts zero ROMs. The user supplies their own file (or URL),
   which is read locally and handed to EmulatorJS as a blob URL. */
(function () {
  'use strict';

  var CDN = 'https://cdn.emulatorjs.org/stable/data/';

  /* extension -> EmulatorJS core short name (per official EmulatorJS docs) */
  var CORE_MAP = {
    nes: 'nes',
    sfc: 'snes', smc: 'snes',
    gb: 'gb', gbc: 'gb',
    gba: 'gba',
    md: 'segaMD', gen: 'segaMD', smd: 'segaMD',
    sms: 'segaMS',
    gg: 'segaGG',
    '32x': 'sega32x',
    cue: 'psx', bin: 'psx', iso: 'psx', img: 'psx', chd: 'psx', m3u: 'psx',
    n64: 'n64', z64: 'n64', v64: 'n64',
    nds: 'nds',
    pce: 'pce',
    vb: 'vb',
    a26: 'atari2600',
    a78: 'atari7800',
    lnx: 'lynx',
    ngp: 'ngp', ngc: 'ngp',
    ws: 'ws', wsc: 'ws',
    col: 'coleco'
  };
  var BIOS_CORES = ['psx', 'segaCD']; /* need a user-supplied BIOS to boot reliably */

  var SYSTEM_LABELS = {
    nes: 'NES', snes: 'SNES', gb: 'Game Boy / Color', gba: 'Game Boy Advance',
    segaMD: 'Genesis / Mega Drive', segaMS: 'Master System', segaGG: 'Game Gear',
    sega32x: '32X', segaCD: 'Sega CD', psx: 'PlayStation', n64: 'Nintendo 64',
    nds: 'Nintendo DS', pce: 'TurboGrafx-16', vb: 'Virtual Boy',
    atari2600: 'Atari 2600', atari7800: 'Atari 7800', lynx: 'Atari Lynx',
    ngp: 'Neo Geo Pocket', ws: 'WonderSwan', coleco: 'ColecoVision'
  };

  var stage, veil, fileInput, urlInput, sysSelect, biosInput;
  var currentBlobUrl = null;
  var booted = false;

  function $(id) { return document.getElementById(id); }

  function extOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(name || '');
    return m ? m[1].toLowerCase() : '';
  }

  function setStatus(msg, ok) {
    var led = $('console-led');
    var title = $('console-title');
    if (led) led.className = 'led' + (ok ? '' : ' idle');
    if (title) title.textContent = msg;
  }

  function teardown() {
    if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
    document.querySelectorAll('script[data-ejs]').forEach(function (s) { s.remove(); });
    if (window.EJS_emulator) {
      try { if (typeof window.EJS_emulator.destroy === 'function') window.EJS_emulator.destroy(); } catch (e) {}
      window.EJS_emulator = null;
    }
    booted = false;
  }

  function boot(gameBlobUrl, fileName, core) {
    teardown();
    veil.style.display = 'none';
    stage.innerHTML = '';
    var screen = document.createElement('div');
    screen.id = 'ejs-screen';
    stage.appendChild(screen);

    window.EJS_player = '#ejs-screen';
    window.EJS_core = core;
    window.EJS_gameUrl = gameBlobUrl;
    window.EJS_gameName = fileName.replace(/\.[^.]+$/, '');
    window.EJS_gameID = 'bm-' + fileName.length + '-' + (fileName + core).split('').reduce(function (a, c) { return (a * 31 + c.charCodeAt(0)) >>> 0; }, 7);
    window.EJS_pathtodata = CDN;
    window.EJS_startOnLoaded = true;
    window.EJS_disableAutoLang = false;
    window.EJS_backgroundColor = '#05050d';

    var biosFile = biosInput && biosInput.files && biosInput.files[0];
    if (biosFile) {
      window.EJS_biosUrl = URL.createObjectURL(biosFile);
    } else {
      delete window.EJS_biosUrl;
    }

    setStatus('LOADING ' + SYSTEM_LABELS[core] + '…', true);
    var script = document.createElement('script');
    script.src = CDN + 'loader.js';
    script.setAttribute('data-ejs', '1');
    script.onerror = function () {
      setStatus('ENGINE FAILED TO LOAD', false);
      stage.innerHTML = '';
      veil.style.display = '';
      $('veil-error').textContent = 'Could not load the emulator engine from the EmulatorJS CDN. Check your connection and try again.';
    };
    window.EJS_onGameStart = function () {
      setStatus('NOW PLAYING — ' + window.EJS_gameName.toUpperCase(), true);
    };
    document.head.appendChild(script);
    booted = true;

    $('sys-badge').textContent = SYSTEM_LABELS[core] || core;
    $('sys-badge').hidden = false;
    var sb2 = $('sys-badge2');
    if (sb2) { sb2.textContent = SYSTEM_LABELS[core] || core; }
    $('player-toolbar').hidden = false;
    updateBiosNote(core);
  }

  function updateBiosNote(core) {
    var note = $('bios-note');
    if (!note) return;
    if (BIOS_CORES.indexOf(core) !== -1) {
      note.hidden = false;
      note.innerHTML = '<strong>BIOS required:</strong> the ' + (SYSTEM_LABELS[core] || core) +
        ' core needs a BIOS file dumped from hardware you own (e.g. scph5501.bin for PlayStation). ' +
        'Attach it below, or the game will not boot. Button Mash does not provide BIOS files.';
    } else if (core === 'nds') {
      note.hidden = false;
      note.innerHTML = '<strong>BIOS optional:</strong> Nintendo DS usually boots without one; dumped BIOS files improve compatibility. Attach your own if a game misbehaves.';
    } else {
      note.hidden = true;
    }
  }

  function handleFile(file) {
    if (!file) return;
    var ext = extOf(file.name);
    var core = sysSelect.value === 'auto' ? (CORE_MAP[ext] || null) : sysSelect.value;
    if (!core) {
      $('veil-error').textContent = 'Could not detect the system for ".' + ext + '". Pick the system manually from the dropdown, then drop the file again.';
      return;
    }
    $('veil-error').textContent = '';
    if (sysSelect.value === 'auto') sysSelect.value = core;
    currentBlobUrl = URL.createObjectURL(file);
    boot(currentBlobUrl, file.name, core);
  }

  async function handleUrl() {
    var url = (urlInput.value || '').trim();
    if (!url) return;
    $('veil-error').textContent = '';
    setStatus('FETCHING FILE…', true);
    try {
      var res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var blob = await res.blob();
      var name = url.split('?')[0].split('/').pop() || 'game.rom';
      handleFile(new File([blob], name, { type: blob.type }));
    } catch (e) {
      setStatus('IDLE', false);
      $('veil-error').textContent = 'Could not fetch that URL (' + e.message + '). The host must allow cross-origin downloads (CORS). If it fails, download the file yourself and drop it in instead.';
    }
  }

  function bindDrop(zone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); veil.classList.add('dragging'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); veil.classList.remove('dragging'); });
    });
    zone.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    stage = $('ejs-stage'); veil = $('drop-veil');
    fileInput = $('rom-file'); urlInput = $('rom-url');
    sysSelect = $('system-select'); biosInput = $('bios-file');

    /* populate system dropdown */
    Object.keys(SYSTEM_LABELS).forEach(function (core) {
      var opt = document.createElement('option');
      opt.value = core; opt.textContent = SYSTEM_LABELS[core];
      sysSelect.appendChild(opt);
    });
    sysSelect.addEventListener('change', function () { updateBiosNote(sysSelect.value); });

    $('browse-btn').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () { handleFile(fileInput.files[0]); fileInput.value = ''; });
    $('load-url-btn').addEventListener('click', handleUrl);
    urlInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleUrl(); });

    $('eject-btn').addEventListener('click', function () {
      teardown();
      stage.innerHTML = '';
      veil.style.display = '';
      $('player-toolbar').hidden = true;
      $('sys-badge').hidden = true;
      setStatus('IDLE', false);
      sysSelect.value = 'auto';
    });

    $('fullscreen-btn').addEventListener('click', function () {
      var shell = $('console-shell');
      if (document.fullscreenElement) document.exitFullscreen();
      else if (shell.requestFullscreen) shell.requestFullscreen();
    });

    bindDrop(veil);
    setStatus('IDLE — DROP A FILE TO BEGIN', false);
  });
})();
