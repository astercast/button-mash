/* Button Mash Converter — turns the user's OWN GBA file into a self-contained
   playable browser game (.html). Everything runs client-side; the file never
   leaves the machine. The exported game embeds the ROM as base64 and boots
   straight into EmulatorJS (engine loads from the public EmulatorJS CDN). */
(function () {
  'use strict';

  var WARN_BYTES = 16 * 1024 * 1024;  /* warn above 16MB: suggest player mode */
  var MAX_BYTES = 32 * 1024 * 1024;   /* 32MB = largest possible GBA cart */

  var state = { file: null, buffer: null, template: null };

  function $(id) { return document.getElementById(id); }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function showProgress(pct, label) {
    var wrap = $('conv-progress');
    wrap.classList.add('active');
    $('conv-fill').style.width = pct + '%';
    $('conv-label').textContent = label;
  }

  /* Chunked ArrayBuffer -> base64 so the UI stays alive on big ROMs. */
  function bufferToBase64(buffer, onProgress) {
    return new Promise(function (resolve) {
      var bytes = new Uint8Array(buffer);
      var CHUNK = 0x8000;          /* String.fromCharCode.apply limit */
      var SLICE = CHUNK * 64;      /* ~512KB of binary per btoa call */
      var parts = [];
      var offset = 0;
      function step() {
        var end = Math.min(offset + SLICE, bytes.length);
        var binary = '';
        for (var i = offset; i < end; i += CHUNK) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, end)));
        }
        parts.push(btoa(binary));
        offset = end;
        onProgress(offset / bytes.length);
        if (offset < bytes.length) setTimeout(step, 0);
        else resolve(parts.join(''));
      }
      step();
    });
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function loadTemplate() {
    if (state.template) return state.template;
    var res = await fetch('assets/vendor/template-game.html', { cache: 'no-store' });
    if (!res.ok) throw new Error('Template missing (HTTP ' + res.status + ')');
    state.template = await res.text();
    return state.template;
  }

  function handleFile(file) {
    var info = $('rom-info');
    var warn = $('size-warn');
    var goBtn = $('convert-btn');
    info.hidden = true; warn.hidden = true; goBtn.disabled = true;
    state.file = null; state.buffer = null;

    if (!file) return;
    if (!/\.gba$/i.test(file.name)) {
      info.hidden = false;
      info.innerHTML = '<strong>Not a GBA file.</strong> This converter handles Game Boy Advance (.gba) files only. ' +
        'For other systems, use the <a href="player.html">Player</a> instead.';
      return;
    }
    if (file.size > MAX_BYTES) {
      info.hidden = false;
      info.innerHTML = '<strong>Too large:</strong> ' + escHtml(file.name) + ' is ' + fmtBytes(file.size) +
        ', bigger than any real GBA cartridge (32MB). Play it in <a href="player.html">Player mode</a> instead — no embedding needed.';
      return;
    }
    state.file = file;
    info.hidden = false;
    info.innerHTML = '<strong>Loaded:</strong> ' + escHtml(file.name) + ' — ' + fmtBytes(file.size) +
      '. Ready to convert. Nothing has left your machine.';
    if (file.size > WARN_BYTES) {
      warn.hidden = false;
      warn.innerHTML = '<strong>Heads up:</strong> this ROM is ' + fmtBytes(file.size) + '. The exported game will be ~' +
        fmtBytes(Math.ceil(file.size * 4 / 3)) + ' (base64 overhead). Big exports can be slow to build and heavy to share — ' +
        'for files this size, <a href="player.html">Player mode</a> is usually the better experience.';
    }
    goBtn.disabled = false;
  }

  async function convert() {
    if (!state.file) return;
    var goBtn = $('convert-btn');
    goBtn.disabled = true;
    try {
      showProgress(2, 'Reading file…');
      state.buffer = await state.file.arrayBuffer();

      showProgress(6, 'Loading game template…');
      var template = await loadTemplate();

      showProgress(10, 'Encoding ROM (this can take a while for big files)…');
      var b64 = await bufferToBase64(state.buffer, function (p) {
        showProgress(10 + Math.round(p * 75), 'Encoding ROM… ' + Math.round(p * 100) + '%');
      });

      showProgress(88, 'Assembling your game…');
      var name = state.file.name.replace(/\.gba$/i, '');
      var gameId = 'bm-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + state.file.size.toString(36);
      var html = template
        .split('__BM_GAME_NAME__').join(escHtml(name))
        .split('__BM_GAME_ID__').join(gameId)
        .split('__BM_BUILD_DATE__').join(new Date().toISOString().slice(0, 10))
        .split('__BM_ROM_SIZE__').join(fmtBytes(state.file.size))
        .split('__BM_ROM_B64__').join(b64);

      showProgress(96, 'Preparing download…');
      var blob = new Blob([html], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);

      showProgress(100, 'Done! Your game downloaded as ' + name + '.html — double-click it to play.');
      $('conv-result').hidden = false;
      $('conv-result').innerHTML = '<strong>Your browser game is ready.</strong> ' + escHtml(name) + '.html contains your ROM and boots straight into the game. ' +
        'Host it anywhere static, or just double-click it. The emulator engine loads from the public EmulatorJS CDN on first run (then it\'s cached).';
    } catch (e) {
      showProgress(0, '');
      $('conv-progress').classList.remove('active');
      $('rom-info').hidden = false;
      $('rom-info').innerHTML = '<strong>Conversion failed:</strong> ' + escHtml(e.message);
    } finally {
      goBtn.disabled = false;
    }
  }

  function bindDrop(zone, input) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('dragging'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('dragging'); });
    });
    zone.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
    zone.addEventListener('click', function (e) {
      if (e.target === input) return;
      input.click();
    });
    input.addEventListener('change', function () { handleFile(input.files[0]); input.value = ''; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindDrop($('conv-drop'), $('conv-file'));
    $('convert-btn').addEventListener('click', convert);
  });
})();
