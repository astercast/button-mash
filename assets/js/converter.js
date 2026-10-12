/* Button Mash Converter v3 — batch conversion UI.
   Multiple files in, multiple playable .html out. Pure logic lives in
   assets/js/converter-core.js (UMD, shared with the test suite); this file
   is the DOM layer: queue rendering, streaming deflate via vendored pako,
   byte-level progress with time estimates, cancel, and error isolation
   (one bad file never kills the batch). Everything stays client-side. */
(function () {
  'use strict';

  var C = window.ConverterCore;
  var MB = 1024 * 1024;

  var queue = [];
  var seq = 0;
  var running = false;
  var cancelFlag = false;
  var coverDataUrl = '';
  var lastUiTick = 0;
  var pendingChecks = []; /* validation promises; runBatch awaits them first */

  function $(id) { return document.getElementById(id); }

  function selectedLevel() {
    var checked = document.querySelector('input[name="conv-comp"]:checked');
    var id = checked ? checked.value : 'balanced';
    for (var i = 0; i < C.COMPRESSION.length; i++) {
      if (C.COMPRESSION[i].id === id) return C.COMPRESSION[i];
    }
    return C.COMPRESSION[2];
  }

  /* ---- status announcements: phase changes go to the live region,
     per-chunk byte counts stay visual-only (aria-hidden) to avoid chatter. */
  function announce(msg) {
    var s = $('conv-status');
    if (s) s.textContent = msg;
  }

  function showProgress(pct, label) {
    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - lastUiTick < 150 && pct < 100) return; /* throttle layout churn */
    lastUiTick = now;
    var wrap = $('conv-progress');
    if (!wrap) return;
    wrap.classList.add('active');
    var fill = $('conv-fill');
    fill.style.width = pct + '%';
    fill.parentElement.setAttribute('aria-valuenow', String(Math.round(pct)));
    var lab = $('conv-label');
    if (lab) lab.textContent = label;
  }

  function phaseLabel(item, phase, doneBytes, totalBytes, startedAt) {
    var pct = totalBytes ? Math.round(doneBytes / totalBytes * 100) : 0;
    var s = phase + ' ' + item.shortName + ' — ' + C.fmtBytes(doneBytes) + ' / ' + C.fmtBytes(totalBytes) + ' (' + pct + '%)';
    if (startedAt && doneBytes > 0) {
      var el = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt) / 1000;
      if (el > 1) {
        var rate = doneBytes / el;
        var eta = Math.max(0, Math.round((totalBytes - doneBytes) / rate));
        s += ' · ' + (rate / MB).toFixed(1) + ' MB/s · ~' + eta + 's left';
      }
    }
    return s;
  }

  /* ---- queue ---- */

  function statusChip(status) {
    var map = {
      queued: ['Queued', 'q-queued'], reading: ['Reading…', 'q-active'],
      validating: ['Checking…', 'q-active'], encoding: ['Encoding…', 'q-active'],
      assembling: ['Assembling…', 'q-active'], done: ['Done ✓', 'q-done'],
      error: ['Failed', 'q-error'], cancelled: ['Cancelled', 'q-cancelled']
    };
    var m = map[status] || [status, ''];
    return '<span class="q-chip ' + m[1] + '">' + m[0] + '</span>';
  }

  function render() {
    var list = $('conv-queue');
    if (!list) return;
    list.innerHTML = '';
    queue.forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'q-row';
      li.dataset.qid = it.id;

      var head = document.createElement('div');
      head.className = 'q-head';
      var titleInput = '';
      if (it.profile) {
        titleInput = '<label class="q-title-label">Title <input type="text" class="q-title" value="' +
          C.escHtml(it.title) + '" aria-label="Game title for ' + C.escHtml(it.file.name) + '" maxlength="80"' +
          (running ? ' disabled' : '') + '></label>';
      }
      head.innerHTML =
        '<div class="q-file"><strong>' + C.escHtml(it.file.name) + '</strong>' +
        (it.profile ? ' <span class="q-sys">' + C.escHtml(it.profile.system) + '</span>' : '') +
        '<span class="q-size">' + C.fmtBytes(it.file.size) + '</span></div>' +
        '<div class="q-actions">' + statusChip(it.status) +
        (it.status === 'done'
          ? ' <button type="button" class="btn btn-small q-dl" data-qdl="' + it.id + '">⬇ Download (' + C.fmtBytes(it.outSize) + ')</button>'
          : '') +
        ((!running && (it.status === 'queued' || it.status === 'error' || it.status === 'cancelled'))
          ? ' <button type="button" class="btn btn-small q-rm" data-qrm="' + it.id + '">Remove</button>'
          : '') +
        '</div>' + titleInput;
      li.appendChild(head);

      if (it.profile && (it.status === 'encoding' || it.status === 'reading' || it.status === 'assembling' || it.status === 'validating')) {
        var bar = document.createElement('div');
        bar.className = 'progress-bar q-bar';
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-label', 'Conversion progress for ' + it.file.name);
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
        bar.setAttribute('aria-valuenow', String(Math.round(it.pct || 0)));
        var fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = (it.pct || 0) + '%';
        bar.appendChild(fill);
        li.appendChild(bar);
      }

      if (it.message) {
        var msg = document.createElement('div');
        msg.className = 'q-msg q-msg-' + it.message.kind;
        msg.innerHTML = it.message.text; /* built from escHtml'd parts below */
        li.appendChild(msg);
      }
      if (it.warnings && it.warnings.length) {
        var w = document.createElement('div');
        w.className = 'q-msg q-msg-warn';
        w.innerHTML = '<strong>Heads up:</strong> ' + it.warnings.map(C.escHtml).join(' ');
        li.appendChild(w);
      }
      if (it.notes && it.notes.length) {
        var nn = document.createElement('div');
        nn.className = 'q-msg q-msg-info';
        nn.textContent = it.notes.join(' ');
        li.appendChild(nn);
      }
      list.appendChild(li);
    });

    list.querySelectorAll('[data-qrm]').forEach(function (b) {
      b.addEventListener('click', function () { removeItem(b.getAttribute('data-qrm')); });
    });
    list.querySelectorAll('[data-qdl]').forEach(function (b) {
      b.addEventListener('click', function () { downloadItem(findItem(b.getAttribute('data-qdl'))); });
    });
    list.querySelectorAll('.q-title').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var li = inp.closest('.q-row');
        var it = li && findItem(li.dataset.qid);
        if (it) it.title = inp.value.trim() || C.baseName(it.file.name, it.profile);
      });
    });

    /* batch summary keeps the #rom-info / #size-warn contract the smoke test reads */
    var info = $('rom-info'), warn = $('size-warn'), goBtn = $('convert-btn');
    var st = C.queueStats(queue);
    var convertibles = queue.filter(function (it) { return it.profile && it.status === 'queued'; });
    if (!queue.length) {
      info.hidden = true; warn.hidden = true;
    } else {
      info.hidden = false;
      var bits = st.total + (st.total === 1 ? ' file' : ' files') + ' queued';
      if (st.done) bits += ' · ' + st.done + ' done';
      if (st.failed) bits += ' · ' + st.failed + ' failed';
      if (st.cancelled) bits += ' · ' + st.cancelled + ' cancelled';
      var totalBytes = queue.reduce(function (a, it) { return a + (it.file ? it.file.size : 0); }, 0);
      info.innerHTML = '<strong>Batch:</strong> ' + C.escHtml(bits) + ' — ' + C.fmtBytes(totalBytes) +
        ' total input. Nothing has left your machine.';
      var big = totalBytes > 100 * MB;
      if (big || queue.some(function (it) { return it.profile && it.file.size > it.profile.warn; })) {
        warn.hidden = false;
        var wt = queue.filter(function (it) { return it.profile && it.file.size > it.profile.warn; })
          .map(function (it) { return C.escHtml(it.file.name) + ' (' + C.fmtBytes(it.file.size) + ' → ~' + C.fmtBytes(Math.ceil(it.file.size * 4 / 3)) + ' download)'; });
        warn.innerHTML = '<strong>Heads up:</strong> ' + (big ? 'this batch is over 100MB of input — your browser will hold it all in memory, so smaller batches are kinder. ' : '') +
          (wt.length ? 'Large file(s): ' + wt.join(', ') + '. Base64 adds ~33% overhead' +
            (selectedLevel().level > 0 ? ' (compression will shrink that)' : ' — pick a compression level below to shrink the download') +
            '; for the biggest files <a href="player.html">Player mode</a> is the better experience.' : '');
      } else warn.hidden = true;
    }
    goBtn.disabled = running || !convertibles.length;
    goBtn.textContent = running ? '⏳ Converting…' :
      (convertibles.length ? '⚡ Convert ' + convertibles.length + ' file' + (convertibles.length === 1 ? '' : 's') : '⚡ Convert to browser games');
    var cancelBtn = $('conv-cancel');
    if (cancelBtn) cancelBtn.hidden = !running;
    var dlAll = $('conv-download-all');
    if (dlAll) dlAll.hidden = !(st.done > 1 && !running);
  }

  function findItem(id) {
    for (var i = 0; i < queue.length; i++) if (String(queue[i].id) === String(id)) return queue[i];
    return null;
  }

  function removeItem(id) {
    var it = findItem(id);
    if (!it || running) return;
    if (it.blobUrl) { try { URL.revokeObjectURL(it.blobUrl); } catch (e) {} }
    queue = queue.filter(function (x) { return x !== it; });
    render();
  }

  /* Content validation runs at queue time (async read) so problems surface
     before Convert is ever clicked. Files that fail here never enter the run. */
  async function readAndValidate(it) {
    it.status = 'validating';
    render();
    try {
      var buf = await it.file.arrayBuffer();
      var v = C.validateRom(new Uint8Array(buf), it.profileKey);
      it.warnings = v.warnings.slice();
      it.notes = v.notes.slice();
      if (v.errors.length) {
        it.status = 'error';
        it.message = { kind: 'error', text: '<strong>Not a usable ROM:</strong> ' + C.escHtml(v.errors[0]) };
      } else {
        it.status = 'queued';
        it.message = null;
      }
    } catch (e) {
      it.status = 'error';
      it.message = { kind: 'error', text: '<strong>Could not read this file:</strong> ' + C.escHtml((e && e.message) || String(e)) };
    }
    render();
  }

  function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    var added = 0;
    files.forEach(function (file) {
      if (!file || !file.name) return;
      var profile = C.profileFor(file.name);
      var it = {
        id: ++seq, file: file, profileKey: profile ? profile.key : null, profile: profile,
        title: '', status: 'queued', pct: 0, message: null, warnings: [],
        blob: null, blobUrl: null, outSize: 0, fileSize: file.size,
        shortName: file.name.length > 28 ? file.name.slice(0, 26) + '…' : file.name,
        onUpdate: function () { render(); }
      };
      if (!profile) {
        it.status = 'error';
        it.message = { kind: 'error', text: '<strong>Not a supported ROM.</strong> This converter handles <code>.gba</code> (Game Boy Advance), <code>.gb</code>/<code>.gbc</code> (Game Boy / Color), <code>.nes</code> (NES), <code>.sfc</code>/<code>.smc</code> (Super Nintendo) and <code>.md</code>/<code>.gen</code> (Sega Genesis) files. For anything else — zipped files, other systems — use the <a href="player.html">Player</a> instead (20+ systems, straight from your own files).' };
      } else if (file.size > profile.max) {
        it.status = 'error';
        it.message = { kind: 'error', text: '<strong>Too large:</strong> ' + C.escHtml(file.name) + ' is ' + C.fmtBytes(file.size) + ', bigger than any real ' + C.escHtml(profile.system) + ' cartridge (' + C.fmtBytes(profile.max) + '). Play it in <a href="player.html">Player mode</a> instead — no embedding needed.' };
      } else {
        it.title = C.baseName(file.name, profile);
        pendingChecks.push(readAndValidate(it));
      }
      queue.push(it);
      added++;
    });
    if (added) announce(added + (added === 1 ? ' file' : ' files') + ' added — checking contents…');
    render();
  }

  /* ---- per-file conversion ---- */

  async function loadTemplate() {
    if (loadTemplate.cache) return loadTemplate.cache;
    var res = await fetch('assets/vendor/template-game.html', { cache: 'no-store' });
    if (!res.ok) throw new Error('Game template failed to load (HTTP ' + res.status + ') — the converter files may be incomplete.');
    loadTemplate.cache = await res.text();
    return loadTemplate.cache;
  }

  /* Chunked base64 with progress + cancel checks. */
  async function bytesToBase64(bytes, it, phaseBase, phaseSpan, startedAt) {
    var CHUNK = 0x8000, SLICE = CHUNK * 64;
    var parts = [], offset = 0;
    var tick = function () {
      it.pct = phaseBase + (offset / bytes.length) * phaseSpan;
      showOverall(it, phaseLabel(it, 'Encoding…', offset, bytes.length, startedAt));
      renderRow(it);
    };
    while (offset < bytes.length) {
      if (cancelFlag) throw { cancelled: true };
      var end = Math.min(offset + SLICE, bytes.length);
      var binary = '';
      for (var i = offset; i < end; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, end)));
      }
      parts.push(btoa(binary));
      offset = end;
      tick();
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    return parts.join('');
  }

  /* Streaming deflate via pako: 1MB input chunks with UI yields, so big ROMs
     show real progress, report honest throughput, and stay cancellable. */
  async function deflateBytes(bytes, level, it, startedAt) {
    if (!window.pako || !window.pako.Deflate) {
      throw new Error('The compression engine (pako) failed to load — rebuild with compression set to "None", or reload the page.');
    }
    var def = new window.pako.Deflate({ level: level });
    var CHUNK = 1 * MB, offset = 0;
    while (offset < bytes.length) {
      if (cancelFlag) throw { cancelled: true };
      var end = Math.min(offset + CHUNK, bytes.length);
      def.push(bytes.subarray(offset, end), end >= bytes.length);
      offset = end;
      it.pct = 8 + (offset / bytes.length) * 47;
      showOverall(it, phaseLabel(it, 'Compressing…', offset, bytes.length, startedAt));
      renderRow(it);
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    if (def.err) throw new Error('Compression failed (pako error ' + def.err + '). Try level "None".');
    return def.result;
  }

  /* Global bar shows whole-batch progress; the label names the active file. */
  var batchCtx = null;
  function showOverall(it, label) {
    var pct, lbl = label;
    if (batchCtx && batchCtx.total > 1) {
      pct = (batchCtx.done + (it.pct || 0) / 100) / batchCtx.total * 100;
      lbl = '[file ' + (batchCtx.done + 1) + '/' + batchCtx.total + '] ' + label;
    } else {
      pct = it.pct || 0;
    }
    showProgress(pct, lbl);
  }

  function renderRow(it) {
    var li = document.querySelector('.q-row[data-qid="' + it.id + '"]');
    if (!li) return;
    var bar = li.querySelector('.q-bar');
    if (bar) {
      bar.setAttribute('aria-valuenow', String(Math.round(it.pct || 0)));
      var fill = bar.querySelector('.progress-fill');
      if (fill) fill.style.width = (it.pct || 0) + '%';
    }
    var chip = li.querySelector('.q-chip');
    if (chip) {
      var labels = { reading: 'Reading…', validating: 'Checking…', encoding: 'Encoding…', assembling: 'Assembling…' };
      if (labels[it.status]) chip.textContent = labels[it.status];
    }
  }

  async function convertItem(it) {
    var level = selectedLevel().level;
    var startedAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    it.status = 'reading'; it.pct = 2; render();
    announce('Reading ' + it.file.name + '.');
    var buf = await it.file.arrayBuffer();
    var bytes = new Uint8Array(buf);

    it.status = 'validating'; it.pct = 6; render();
    var v = C.validateRom(bytes, it.profileKey);
    it.warnings = v.warnings.slice();
    it.notes = v.notes.slice();
    if (v.errors.length) throw new Error(v.errors[0]);

    it.status = 'encoding'; render();
    announce('Encoding ' + it.file.name + (level > 0 ? ' with compression level ' + level + '.' : '.'));
    var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    var payload = level > 0 ? await deflateBytes(bytes, level, it, t0) : bytes;
    var savedNote = level > 0 ? ' · compressed ' + C.fmtBytes(bytes.length) + ' → ' + C.fmtBytes(payload.length) : '';
    var b64 = await bytesToBase64(payload, it, level > 0 ? 55 : 8, level > 0 ? 30 : 77, t0);
    payload = null;

    it.status = 'assembling'; it.pct = 88; render();
    showOverall(it, 'Assembling ' + it.shortName + '…');
    var template = await loadTemplate();
    var name = it.title.trim() || C.baseName(it.file.name, it.profile);
    var html = C.buildHtml(template, {
      name: name,
      gameId: C.makeGameId(name, it.file.size),
      buildDate: new Date().toISOString().slice(0, 10),
      romSize: C.fmtBytes(it.file.size),
      romB64: b64,
      core: it.profile.core,
      coreLabel: it.profile.engine + ' core',
      system: it.profile.system,
      hint: it.profile.hint,
      compressed: level > 0 ? '1' : '0',
      cover: coverDataUrl
    });
    b64 = null; bytes = null;

    it.status = 'done'; it.pct = 100;
    it.blob = new Blob([html], { type: 'text/html' });
    it.outSize = it.blob.size;
    it.downloadName = C.uniqueDownloadName(name,
      queue.filter(function (o) { return o !== it && o.downloadName; }).map(function (o) { return o.downloadName; }));
    it.message = {
      kind: 'ok',
      text: '<strong>Ready.</strong> ' + C.escHtml(it.downloadName) + ' (' + C.fmtBytes(it.outSize) + ')' + C.escHtml(savedNote) +
        '. Boots into the ' + C.escHtml(it.profile.engine) + ' core.' +
        (it.warnings.length ? ' Built despite the header note above — if the game misbehaves, re-dump the cartridge.' : '')
    };
    render();
    announce(it.file.name + ' converted.');
    if (batchCtx) batchCtx.done++;
    showOverall(it, 'Done.');
    /* v2 parity: each finished game downloads itself, like the single-file
       flow always did. Batches may trigger the browser's multiple-download
       permission prompt — that is normal browser behavior, noted below. */
    downloadItem(it);
  }

  async function runBatch() {
    if (running) return;
    /* wait for any in-flight content checks so nothing converts unchecked */
    if (pendingChecks.length) {
      announce('Finishing file checks…');
      await Promise.all(pendingChecks);
      pendingChecks = [];
    }
    var work = queue.filter(function (it) { return it.status === 'queued' && it.profile; });
    if (!work.length) return;
    running = true; cancelFlag = false;
    batchCtx = { total: work.length, done: 0 };
    $('conv-result').hidden = true;
    render();
    announce('Converting ' + work.length + (work.length === 1 ? ' file.' : ' files.'));
    /* the frozen work snapshot: files dropped mid-run wait for the next run */
    await C.processQueue(work, convertItem, function () { return cancelFlag; });
    running = false;
    var st = C.queueStats(queue);
    var res = $('conv-result');
    res.hidden = false;
    if (cancelFlag && st.done === 0 && st.failed === 0) {
      res.innerHTML = '<strong>Cancelled.</strong> Nothing was converted — your files never left this machine.';
    } else {
      var totalOut = queue.reduce(function (a, it) { return a + (it.outSize || 0); }, 0);
      res.innerHTML = '<strong>Batch finished:</strong> ' + st.done + ' converted' +
        (st.failed ? ', ' + st.failed + ' failed' : '') +
        (st.cancelled ? ', ' + st.cancelled + ' cancelled' : '') +
        ' — ' + C.fmtBytes(totalOut) + ' of games ready below. ' +
        'Each download is a self-contained page: double-click to play, host anywhere static. ' +
        (st.done > 1 ? 'If your browser asked permission for multiple downloads, that was these files — allow it to get the rest. ' : '') +
        'The emulator engine loads from the public EmulatorJS CDN on first run (then it\'s cached).';
    }
    announce('Batch finished: ' + st.done + ' converted, ' + st.failed + ' failed.');
    var wrap = $('conv-progress');
    if (wrap) wrap.classList.remove('active');
    render();
  }

  function downloadItem(it) {
    if (!it || !it.blob) return;
    if (it.blobUrl) { try { URL.revokeObjectURL(it.blobUrl); } catch (e) {} }
    it.blobUrl = URL.createObjectURL(it.blob);
    var a = document.createElement('a');
    a.href = it.blobUrl;
    a.download = it.downloadName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); }, 4000);
  }

  function downloadAll() {
    var done = queue.filter(function (it) { return it.status === 'done'; });
    if (!done.length) return;
    announce('Downloading ' + done.length + ' games. Your browser may ask permission for multiple downloads — that\'s normal.');
    done.forEach(function (it, i) {
      setTimeout(function () { downloadItem(it); }, i * 600);
    });
  }

  /* ---- inputs ---- */

  function bindDrop(zone, input) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('dragging'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('dragging'); });
    });
    zone.addEventListener('drop', function (e) {
      var fs = e.dataTransfer && e.dataTransfer.files;
      if (fs && fs.length) addFiles(fs);
    });
    zone.addEventListener('click', function (e) {
      if (e.target === input) return;
      input.click();
    });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  }

  function bindCover() {
    var input = $('conv-cover');
    if (!input) return;
    var prev = $('conv-cover-prev'), msg = $('conv-cover-msg');
    input.addEventListener('change', function () {
      coverDataUrl = '';
      if (prev) { prev.hidden = true; prev.removeAttribute('src'); }
      if (msg) { msg.hidden = true; msg.textContent = ''; }
      var f = input.files && input.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) {
        if (msg) { msg.hidden = false; msg.textContent = 'That is not an image file — cover art skipped.'; }
        input.value = '';
        return;
      }
      if (f.size > 2 * MB) {
        if (msg) { msg.hidden = false; msg.textContent = 'Cover art is embedded in every game file — "' + f.name + '" is ' + C.fmtBytes(f.size) + ', over the 2MB cap. Shrink it and try again.'; }
        input.value = '';
        return;
      }
      var r = new FileReader();
      r.onload = function () {
        coverDataUrl = String(r.result || '');
        if (prev && coverDataUrl) { prev.src = coverDataUrl; prev.hidden = false; }
        announce('Cover art set — it will appear on every game in this batch.');
      };
      r.onerror = function () {
        if (msg) { msg.hidden = false; msg.textContent = 'Could not read that image — cover art skipped.'; }
      };
      r.readAsDataURL(f);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.ConverterCore) {
      var info = $('rom-info');
      if (info) { info.hidden = false; info.innerHTML = '<strong>Converter failed to start:</strong> a script file is missing. Reload the page.'; }
      return;
    }
    /* Compression needs pako; without it the level radios (except None) disable honestly. */
    if (!window.pako || !window.pako.Deflate) {
      document.querySelectorAll('input[name="conv-comp"]').forEach(function (r) {
        if (r.value !== 'none') r.disabled = true;
      });
      var none = document.querySelector('input[name="conv-comp"][value="none"]');
      if (none) none.checked = true;
      var note = $('conv-comp-note');
      if (note) note.textContent = 'Compression is unavailable (engine failed to load) — builds will use plain base64.';
    }
    bindDrop($('conv-drop'), $('conv-file'));
    bindCover();
    $('convert-btn').addEventListener('click', runBatch);
    var cancelBtn = $('conv-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function () {
      cancelFlag = true;
      announce('Cancelling after the current file…');
    });
    var dlAll = $('conv-download-all');
    if (dlAll) dlAll.addEventListener('click', downloadAll);
    document.querySelectorAll('input[name="conv-comp"]').forEach(function (r) {
      r.addEventListener('change', render);
    });
    document.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var target = document.querySelector('input[name="conv-comp"][value="' + b.getAttribute('data-preset') + '"]');
        if (target && !target.disabled) { target.checked = true; render(); announce('Compression preset: ' + target.value + '.'); }
      });
    });
    render();
  });
})();
