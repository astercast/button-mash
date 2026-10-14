/* Button Mash DOS corner (Converter 4.0): drop a ZIP or a folder of
   your own DOS game, and this page wraps it into a .jsdos bundle in
   your browser (stored ZIP + a generated dosbox.conf), boots it
   under DOSBox via js-dos, and keeps the bundle on this device so
   replays need no re-drop. The bundle is also the take-away file:
   download it and it plays anywhere js-dos runs. Nothing uploads;
   the only network traffic is the js-dos engine itself, loaded from
   the js-dos CDN the same way the Player loads EmulatorJS. */
(function () {
  'use strict';

  var C4 = window.Converter4Core;
  var JSDOS_JS = 'https://v8.js-dos.com/latest/js-dos.js';
  var JSDOS_CSS = 'https://v8.js-dos.com/latest/js-dos.css';

  var workFiles = [];        /* [{name, data:Uint8Array}] */
  var bundleBlob = null;
  var bundleName = 'game.jsdos';
  var bundleId = null;
  var ci = null;
  var jsdosLoading = null;

  function $(id) { return document.getElementById(id); }
  function status(msg) { var s = $('dos-status'); if (s) s.textContent = msg; }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  /* Strip a shared root folder (folder drops carry it in every path). */
  function stripRoot(files) {
    if (!files.length) return files;
    var first = files[0].name.split('/')[0];
    if (!first) return files;
    var all = files.every(function (f) { return f.name.indexOf(first + '/') === 0; });
    if (!all) return files;
    return files.map(function (f) { return { name: f.name.slice(first.length + 1), data: f.data }; });
  }

  async function filesFromZip(file) {
    var buf = new Uint8Array(await file.arrayBuffer());
    var entries = C4.zipList(buf);
    if (!entries) throw new Error('That ZIP could not be read as an archive.');
    var out = [];
    var inflate = window.pako ? window.pako.inflateRaw : null;
    entries.forEach(function (e) {
      if (e.name.endsWith('/')) return;
      if (/^dosbox\.conf$/i.test(e.name.split('/').pop())) return; /* ours wins */
      var data = C4.zipExtract(buf, e, inflate);
      if (data) out.push({ name: e.name.replace(/\\/g, '/'), data: data });
    });
    return out;
  }

  async function acceptFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    hideDecline();
    try {
      if (files.length === 1 && /\.jsdos$/i.test(files[0].name)) {
        bundleBlob = files[0];
        bundleName = files[0].name;
        bundleId = 'bm4-dos-' + C4.fnv1a(new Uint8Array(await files[0].slice(0, 65536).arrayBuffer())) + '-' + files[0].size.toString(36);
        workFiles = [];
        status('That is already a .jsdos bundle. Press Play, or keep it in the list below.');
        $('dos-run').disabled = false;
        $('dos-export').disabled = false;
        renderExecRow([]);
        await keepBundle();
        return;
      }
      if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
        workFiles = await filesFromZip(files[0]);
        bundleName = files[0].name.replace(/\.zip$/i, '.jsdos');
      } else {
        var raw = [];
        for (var i = 0; i < files.length; i++) {
          raw.push({
            name: (files[i].webkitRelativePath || files[i].name).replace(/\\/g, '/'),
            data: new Uint8Array(await files[i].arrayBuffer())
          });
        }
        workFiles = stripRoot(raw);
        bundleName = 'my-dos-game.jsdos';
      }
      var names = workFiles.map(function (f) { return f.name; });
      var det = C4.detectFolder(names);
      if (det.kind === 'decline') {
        var host = $('dos-decline');
        if (host && window.BMConv4) window.BMConv4.showDecline(host, det, files[0] ? files[0].name : 'folder');
        status('That set belongs to a system the guide covers. The card below explains.');
        workFiles = [];
        return;
      }
      var execs = names.filter(function (n) { return /\.(exe|com|bat)$/i.test(n); });
      if (!execs.length) {
        status('No DOS program found in that set (no .exe, .com or .bat). A DOS game folder should hold the program file alongside its data files. Nothing was bundled.');
        workFiles = [];
        return;
      }
      renderExecRow(execs);
      buildBundle();
    } catch (e) {
      status('Could not read that set (' + (e && e.message ? e.message : e) + ').');
    }
  }

  function hideDecline() {
    var host = $('dos-decline');
    if (host) { host.hidden = true; host.innerHTML = ''; }
  }

  function renderExecRow(execs) {
    var row = $('dos-exec-row'), sel = $('dos-exec');
    if (!row || !sel) return;
    sel.innerHTML = '';
    execs.forEach(function (n) {
      var o = document.createElement('option');
      o.value = n; o.textContent = n;
      sel.appendChild(o);
    });
    var pick = C4 ? C4.chooseDosExecutable(execs) : execs[0];
    if (pick) sel.value = pick;
    row.hidden = !execs.length;
    sel.onchange = buildBundle;
  }

  function buildBundle() {
    if (!workFiles.length || !C4) return;
    var sel = $('dos-exec');
    var exec = sel && sel.value ? sel.value : C4.chooseDosExecutable(workFiles.map(function (f) { return f.name; }));
    if (!exec) return;
    var conf = new TextEncoder().encode(C4.dosboxConf(exec));
    var parts = [{ name: 'dosbox.conf', data: conf }].concat(workFiles);
    var zip = C4.zipStore(parts);
    bundleBlob = new Blob([zip], { type: 'application/octet-stream' });
    bundleId = 'bm4-dos-' + C4.fnv1a(zip.subarray(0, Math.min(zip.length, 131072))) + '-' + zip.length.toString(36);
    $('dos-run').disabled = false;
    $('dos-export').disabled = false;
    var total = workFiles.reduce(function (a, f) { return a + f.data.length; }, 0);
    status('Bundle built: ' + workFiles.length + ' files, ' + fmtBytes(total) + ' of game, booting ' + exec +
      '. It was assembled in this browser; nothing uploaded. Press Play, download the bundle to keep it, or both.');
    keepBundle();
  }

  function keepBundle() {
    if (!window.BMLibrary || !bundleBlob || !bundleId) return Promise.resolve();
    return window.BMLibrary.stageGame({
      id: bundleId, name: bundleName, core: 'dos', systemLabel: 'DOS',
      size: bundleBlob.size, blob: bundleBlob, addedAt: Date.now()
    }).then(renderBundles).catch(function () {});
  }

  function renderBundles() {
    var list = $('dos-bundles');
    if (!list || !window.BMLibrary) return;
    window.BMLibrary.listGames().then(function (games) {
      var dos = games.filter(function (g) { return g.core === 'dos'; });
      list.innerHTML = '';
      if (!dos.length) {
        list.innerHTML = '<li class="slot-sub">No bundles kept yet. Build one above and it waits here, on this device only.</li>';
        return;
      }
      dos.forEach(function (g) {
        var li = document.createElement('li');
        li.className = 'library-row';
        var info = document.createElement('span'); info.className = 'grow';
        var nm = document.createElement('strong'); nm.textContent = g.name;
        var sub = document.createElement('span'); sub.className = 'slot-sub';
        sub.textContent = 'DOS bundle · ' + fmtBytes(g.size) + (g.addedAt ? ' · kept ' + new Date(g.addedAt).toLocaleDateString() : '');
        info.appendChild(nm); info.appendChild(document.createElement('br')); info.appendChild(sub);
        li.appendChild(info);
        var acts = document.createElement('span'); acts.className = 'slot-actions';
        var play = document.createElement('button');
        play.type = 'button'; play.className = 'btn btn-ghost btn-sm'; play.textContent = '▶ Play';
        play.addEventListener('click', function () {
          bundleBlob = g.blob; bundleName = g.name; bundleId = g.id;
          runBundle();
        });
        var del = document.createElement('button');
        del.type = 'button'; del.className = 'btn btn-ghost btn-sm'; del.textContent = 'Delete';
        del.addEventListener('click', function () { window.BMLibrary.deleteGame(g.id).then(renderBundles); });
        acts.appendChild(play); acts.appendChild(del);
        li.appendChild(acts);
        list.appendChild(li);
      });
    }).catch(function () {});
  }

  function loadJsDos() {
    if (window.Dos) return Promise.resolve();
    if (jsdosLoading) return jsdosLoading;
    jsdosLoading = new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = JSDOS_CSS;
      document.head.appendChild(link);
      var s = document.createElement('script');
      s.src = JSDOS_JS;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('the js-dos engine failed to load from its CDN')); };
      document.head.appendChild(s);
    });
    return jsdosLoading;
  }

  async function runBundle() {
    if (!bundleBlob) { status('Build or pick a bundle first.'); return; }
    var stage = $('dos-stage');
    if (!stage) return;
    status('Loading the DOSBox engine…');
    try {
      await loadJsDos();
    } catch (e) {
      status('The DOS engine could not load (' + e.message + '). Check your connection and try again; your bundle is kept below either way.');
      return;
    }
    stage.innerHTML = '';
    var url = URL.createObjectURL(bundleBlob);
    try {
      ci = await window.Dos(stage).run(url);
      status('Running. Click the screen, then use your keyboard and mouse; DOS games were built for them. Fullscreen is the button in the player frame.');
      var persistBtn = $('dos-persist-saves');
      if (persistBtn && ci && typeof ci.persist === 'function') persistBtn.disabled = false;
    } catch (e) {
      status('DOSBox refused that bundle (' + (e && e.message ? e.message : e) + '). The usual cause is a program that is not really a DOS executable, or a game that needs its installer run first; if it installs under DOS, run the installer from the DOS prompt instead by choosing it as the start program.');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var drop = $('dos-drop'), fileInput = $('dos-file'), folderInput = $('dos-folder');
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('dragging'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('dragging'); });
    });
    drop.addEventListener('drop', function (e) {
      var fs = e.dataTransfer && e.dataTransfer.files;
      if (fs && fs.length) acceptFiles(fs);
    });
    $('dos-browse-files').addEventListener('click', function () { fileInput.click(); });
    $('dos-browse-folder').addEventListener('click', function () { folderInput.click(); });
    fileInput.addEventListener('change', function () { acceptFiles(fileInput.files); fileInput.value = ''; });
    folderInput.addEventListener('change', function () { acceptFiles(folderInput.files); folderInput.value = ''; });
    $('dos-run').addEventListener('click', runBundle);
    $('dos-export').addEventListener('click', function () {
      if (!bundleBlob) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(bundleBlob);
      a.download = bundleName;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      status('Bundle downloaded as ' + bundleName + '. It is your game plus a small config file; it plays in any js-dos player and re-opens right here.');
    });
    var persistBtn = $('dos-persist-saves');
    if (persistBtn) persistBtn.addEventListener('click', function () {
      if (!ci || typeof ci.persist !== 'function') return;
      status('Collecting the files DOS wrote…');
      ci.persist().then(function (bytes) {
        var arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([arr], { type: 'application/zip' }));
        a.download = 'dos-session-files.zip';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        status('Session files downloaded: these are the saves and settings DOS wrote during play. Keep them with the bundle; dropping both back here restores the session.');
      }).catch(function (e) {
        status('This js-dos build did not hand back session files (' + (e && e.message ? e.message : e) + '). Your in-game saves still live in the running session.');
      });
    });
    renderBundles();

    /* handoff from the Player / Converter decline routes */
    if (window.BMLibrary) {
      window.BMLibrary.takeHandoff('dos-handoff').then(function (rec) {
        if (rec && rec.files && rec.files.length) {
          var fs = rec.files.map(function (r) { return new File([r.blob], r.name, { type: 'application/octet-stream' }); });
          /* folder paths ride the name; File loses webkitRelativePath,
             so stash them where acceptFiles can see them */
          fs.forEach(function (f, i) {
            try { Object.defineProperty(f, 'webkitRelativePath', { value: rec.files[i].name }); } catch (e) {}
          });
          status('Your game arrived from the other room. Building its bundle…');
          acceptFiles(fs);
        }
      }).catch(function () {});
    }
  });
})();
