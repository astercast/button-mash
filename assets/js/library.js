/* Button Mash Library (Converter 4.0, Phase 0): the on-device
   library manager. Games the visitor chooses to keep are staged as
   blobs in IndexedDB ("bm-library"), keyed by their CONTENT id
   (converter4-core.js), never by file name, so a renamed dump keeps
   its identity and its saves. The manager shows what is staged,
   how much of the browser's storage budget it uses (queried live
   with navigator.storage.estimate(), never a printed guess), and
   deletes on request. Saves export/import covers the engine's own
   state store, because browser storage is evictable and "download
   your saves" is a first-class promise (dossier sections 3.2, 3.6).
   Everything is local: no upload, no server, no account. */
(function () {
  'use strict';

  var DB = 'bm-library', VER = 1;
  var C4 = window.Converter4Core;

  function idbOpen() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB is not available in this browser')); return; }
      var req = indexedDB.open(DB, VER);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('games')) db.createObjectStore('games', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('staging')) db.createObjectStore('staging', { keyPath: 'key' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('could not open the library')); };
    });
  }
  function tx(store, mode, fn) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction([store], mode);
        var s = t.objectStore(store);
        var out;
        try { out = fn(s); } catch (e) { reject(e); return; }
        t.oncomplete = function () { resolve(out && out._value !== undefined ? out._value : out); };
        t.onerror = function () { reject(t.error || new Error('library write failed')); };
      });
    });
  }
  function reqVal(req) {
    var box = {};
    req.onsuccess = function () { box._value = req.result; };
    return box;
  }

  var api = {
    stageGame: function (rec) {
      return tx('games', 'readwrite', function (s) { s.put(rec); });
    },
    listGames: function () {
      return idbOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
          var rq = db.transaction(['games'], 'readonly').objectStore('games').getAll();
          rq.onsuccess = function () { resolve(rq.result || []); };
          rq.onerror = function () { reject(rq.error); };
        });
      });
    },
    getGame: function (id) {
      return idbOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
          var rq = db.transaction(['games'], 'readonly').objectStore('games').get(id);
          rq.onsuccess = function () { resolve(rq.result || null); };
          rq.onerror = function () { reject(rq.error); };
        });
      });
    },
    deleteGame: function (id) {
      return tx('games', 'readwrite', function (s) { s.delete(id); });
    },
    stageHandoff: function (key, payload) {
      payload.key = key;
      return tx('staging', 'readwrite', function (s) { s.put(payload); });
    },
    takeHandoff: function (key) {
      var self = this;
      return idbOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
          var rq = db.transaction(['staging'], 'readonly').objectStore('staging').get(key);
          rq.onsuccess = function () { resolve(rq.result || null); };
          rq.onerror = function () { reject(rq.error); };
        });
      }).then(function (rec) {
        if (rec) return self._clearHandoff(key).then(function () { return rec; });
        return null;
      });
    },
    _clearHandoff: function (key) {
      return tx('staging', 'readwrite', function (s) { s.delete(key); });
    },
    estimate: function () {
      if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate();
      return Promise.resolve(null);
    },
    persist: function () {
      if (navigator.storage && navigator.storage.persist) return navigator.storage.persist();
      return Promise.resolve(false);
    }
  };
  window.BMLibrary = api;

  /* ---------------- saves export / import ---------------- */

  function engineStatesOpen() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open('EmulatorJS-states', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('states')) db.createObjectStore('states');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function exportSaves(status) {
    return engineStatesOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var store = db.transaction(['states'], 'readonly').objectStore('states');
        var keysReq = store.getAllKeys();
        keysReq.onsuccess = function () {
          var keys = keysReq.result || [];
          if (!keys.length) { status('No save states in this browser yet. Play something with "Keep in Browser" save mode first.'); resolve(0); return; }
          var files = [], pending = keys.length;
          keys.forEach(function (k) {
            var g = store.get(k);
            g.onsuccess = function () {
              var v = g.result;
              var bytes = v instanceof Uint8Array ? v : (v ? new Uint8Array(v) : new Uint8Array(0));
              files.push({ name: String(k), data: bytes });
              if (--pending === 0) {
                var zip = C4.zipStore(files);
                download(new Blob([zip], { type: 'application/zip' }), 'button-mash-saves.zip');
                status('Exported ' + files.length + ' save file(s). Keep the zip somewhere safe; browser storage can be cleared by the browser.');
                resolve(files.length);
              }
            };
            g.onerror = function () { reject(g.error); };
          });
        };
        keysReq.onerror = function () { reject(keysReq.error); };
      });
    });
  }
  function importSaves(file, status) {
    return file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      var entries = C4.zipList(bytes);
      return engineStatesOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
          var t = db.transaction(['states'], 'readwrite');
          var store = t.objectStore('states');
          var n = 0;
          if (entries) {
            entries.forEach(function (e) {
              if (e.name.indexOf('/') !== -1) return; /* flat store only */
              var data = C4.zipExtract(bytes, e, window.pako ? window.pako.inflateRaw : null);
              if (data) { store.put(data, e.name); n++; }
            });
          } else {
            store.put(bytes, file.name); n = 1;
          }
          t.oncomplete = function () { status('Imported ' + n + ' save file(s). They attach to the game whose name they carry.'); resolve(n); };
          t.onerror = function () { reject(t.error); };
        });
      });
    });
  }
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }

  /* ---------------- whole-shelf .portplay export / import ----------------
     One file carries the whole shelf (bundle, 2026-10-24): every staged
     game's bytes, the engine save states, and the on-device settings and
     control maps (the bm-/ejs- localStorage keys) — so a shelf moves
     between this visitor's own browsers whole. The format is a stored
     zip (C4.zipStore) with a manifest.json at its root; the .portplay
     extension is the shelf's own name for it. Nothing uploads: the file
     is built and read entirely on-device, like everything else here. */

  function shelfSettings() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (k.indexOf('bm-') === 0 || k.indexOf('ejs-') === 0)) out[k] = localStorage.getItem(k);
      }
    } catch (e) { /* settings are a bonus, never a blocker */ }
    return out;
  }
  function engineStatesAll() {
    return engineStatesOpen().then(function (db) {
      return new Promise(function (resolve) {
        try {
          var store = db.transaction(['states'], 'readonly').objectStore('states');
          var keysReq = store.getAllKeys();
          keysReq.onsuccess = function () {
            var keys = keysReq.result || [], out = [], pending = keys.length;
            if (!pending) { resolve(out); return; }
            keys.forEach(function (k) {
              var g = store.get(k);
              g.onsuccess = function () {
                var v = g.result;
                out.push({ key: String(k), data: v instanceof Uint8Array ? v : (v ? new Uint8Array(v) : new Uint8Array(0)) });
                if (--pending === 0) resolve(out);
              };
              g.onerror = function () { if (--pending === 0) resolve(out); };
            });
          };
          keysReq.onerror = function () { resolve([]); };
        } catch (e) { resolve([]); }
      });
    }).catch(function () { return []; });
  }
  function exportShelf(status) {
    return api.listGames().then(function (games) {
      return engineStatesAll().then(async function (saves) {
        var files = [], manifest = {
          format: 'portplay-shelf', version: 1, exportedAt: new Date().toISOString(),
          games: [], saves: [], settings: shelfSettings()
        };
        for (var i = 0; i < games.length; i++) {
          var g = games[i];
          var data = g.blob ? new Uint8Array(await g.blob.arrayBuffer()) : new Uint8Array(0);
          var fname = 'games/' + i + '.bin';
          files.push({ name: fname, data: data });
          manifest.games.push({ id: g.id, name: g.name, core: g.core, systemLabel: g.systemLabel,
                                size: g.size, addedAt: g.addedAt || null, file: fname });
        }
        saves.forEach(function (s, j) {
          var fname = 'saves/' + j + '.state';
          files.push({ name: fname, data: s.data });
          manifest.saves.push({ key: s.key, file: fname });
        });
        files.unshift({ name: 'manifest.json',
                        data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });
        var zip = C4.zipStore(files);
        download(new Blob([zip], { type: 'application/octet-stream' }), 'portplay-shelf.portplay');
        status('Exported the whole shelf: ' + manifest.games.length + ' game(s), ' +
               manifest.saves.length + ' save file(s), and this device\u2019s settings and maps. ' +
               'Keep the .portplay file somewhere safe; it is the only copy.');
        return manifest.games.length;
      });
    });
  }
  function importShelf(file, status) {
    return file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      var entries = C4.zipList(bytes);
      if (!entries) throw new Error('that file is not a .portplay shelf (no archive inside)');
      function entryData(name) {
        var e = entries.filter(function (x) { return x.name === name; })[0];
        return e ? C4.zipExtract(bytes, e, window.pako ? window.pako.inflateRaw : null) : null;
      }
      var manData = entryData('manifest.json');
      if (!manData) throw new Error('that archive has no shelf manifest');
      var manifest = JSON.parse(new TextDecoder().decode(manData));
      if (manifest.format !== 'portplay-shelf') throw new Error('that manifest is not a PortPlay shelf');
      var jobs = [];
      (manifest.games || []).forEach(function (g) {
        var data = entryData(g.file);
        if (!data) return;
        jobs.push(api.stageGame({ id: g.id, name: g.name, core: g.core, systemLabel: g.systemLabel,
          size: g.size, blob: new File([data], g.name, { type: 'application/octet-stream' }),
          addedAt: g.addedAt || Date.now() }));
      });
      var saveCount = 0;
      var savesJob = engineStatesOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
          var t = db.transaction(['states'], 'readwrite');
          var store = t.objectStore('states');
          (manifest.saves || []).forEach(function (s) {
            var data = entryData(s.file);
            if (data) { store.put(data, s.key); saveCount++; }
          });
          t.oncomplete = resolve;
          t.onerror = function () { reject(t.error); };
        });
      }).catch(function () { /* saves are restorable later from the same file */ });
      jobs.push(savesJob);
      return Promise.all(jobs).then(function () {
        try {
          var settings = manifest.settings || {};
          Object.keys(settings).forEach(function (k) {
            if (k.indexOf('bm-') === 0 || k.indexOf('ejs-') === 0) localStorage.setItem(k, settings[k]);
          });
        } catch (e) { /* maps/settings restore is best-effort */ }
        status('Imported the shelf: ' + (manifest.games || []).length + ' game(s) staged, ' +
               saveCount + ' save file(s) restored, settings and maps applied. Reload the player if a game was already booted.');
        document.dispatchEvent(new CustomEvent('bm:library-changed'));
        return (manifest.games || []).length;
      });
    });
  }

  /* ---------------- the manager UI (player page) ---------------- */

  function fmtBytes(n) {
    if (n === undefined || n === null) return 'unknown';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
  }
  function $(id) { return document.getElementById(id); }

  function renderLibrary() {
    var list = $('library-list');
    if (!list) return;
    var status = $('library-status');
    api.listGames().then(function (games) {
      list.innerHTML = '';
      if (!games.length) {
        if (status) status.textContent = 'Nothing staged yet. Boot a game above, then choose "Keep in library" and it waits here, on this device only.';
      } else if (status) {
        status.textContent = games.length + ' game(s) staged on this device. They never leave it.';
      }
      games.sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
      games.forEach(function (g) {
        var li = document.createElement('li');
        li.className = 'library-row';
        var info = document.createElement('span');
        info.className = 'grow';
        var nm = document.createElement('strong'); nm.textContent = g.name;
        var sub = document.createElement('span'); sub.className = 'slot-sub';
        sub.textContent = (g.systemLabel || g.core || '') + ' · ' + fmtBytes(g.size) +
          (g.addedAt ? ' · kept ' + new Date(g.addedAt).toLocaleDateString() : '') +
          ' · id ' + String(g.id).slice(0, 22) + '…';
        info.appendChild(nm); info.appendChild(document.createElement('br')); info.appendChild(sub);
        li.appendChild(info);
        var acts = document.createElement('span'); acts.className = 'slot-actions';
        var play = document.createElement('button');
        play.type = 'button'; play.className = 'btn btn-ghost btn-small'; play.textContent = '▶ Play';
        play.addEventListener('click', function () {
          document.dispatchEvent(new CustomEvent('bm:library-play', { detail: { id: g.id } }));
        });
        var del = document.createElement('button');
        del.type = 'button'; del.className = 'btn btn-ghost btn-small'; del.textContent = 'Delete';
        del.addEventListener('click', function () {
          api.deleteGame(g.id).then(renderLibrary).then(renderEstimate);
        });
        acts.appendChild(play); acts.appendChild(del);
        li.appendChild(acts);
        list.appendChild(li);
      });
    }).catch(function (e) {
      if (status) status.textContent = 'The library could not be read (' + (e && e.message ? e.message : e) + ').';
    });
    renderEstimate();
  }
  function renderEstimate() {
    var el = $('library-estimate');
    if (!el) return;
    api.estimate().then(function (est) {
      if (!est) { el.textContent = 'This browser does not report a storage estimate.'; return; }
      el.textContent = 'Browser storage on this device: ' + fmtBytes(est.usage) + ' used of about ' +
        fmtBytes(est.quota) + ' available to this site. Staged games and saves live inside that budget, and the browser can evict them, which is why the saves export below matters.';
    }).catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('library-list')) return;
    renderLibrary();
    document.addEventListener('bm:library-changed', renderLibrary);
    var keep = $('library-keep');
    if (keep) keep.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('bm:library-keep-current'));
    });
    var persistBtn = $('library-persist');
    if (persistBtn) persistBtn.addEventListener('click', function () {
      api.persist().then(function (ok) {
        var s = $('library-status');
        if (s) s.textContent = ok
          ? 'This browser agreed to keep the storage persistent. Eviction is unlikely now, and the saves export is still the belt to this pair of braces.'
          : 'The browser did not grant persistent storage (it decides by its own rules). Export your saves to be safe.';
      });
    });
    var exp = $('saves-export');
    if (exp) exp.addEventListener('click', function () {
      var s = $('library-status');
      exportSaves(function (m) { if (s) s.textContent = m; }).catch(function (e) {
        if (s) s.textContent = 'Export failed (' + (e && e.message ? e.message : e) + ').';
      });
    });
    var shelfExp = $('shelf-export');
    if (shelfExp) shelfExp.addEventListener('click', function () {
      var s = $('library-status');
      exportShelf(function (m) { if (s) s.textContent = m; }).catch(function (e) {
        if (s) s.textContent = 'Shelf export failed (' + (e && e.message ? e.message : e) + ').';
      });
    });
    var shelfImp = $('shelf-import');
    if (shelfImp) shelfImp.addEventListener('change', function () {
      var f = shelfImp.files && shelfImp.files[0];
      if (!f) return;
      var s = $('library-status');
      importShelf(f, function (m) { if (s) s.textContent = m; }).catch(function (e) {
        if (s) s.textContent = 'Shelf import failed (' + (e && e.message ? e.message : e) + ').';
      });
      shelfImp.value = '';
    });
    var imp = $('saves-import');
    if (imp) imp.addEventListener('change', function () {
      var f = imp.files && imp.files[0];
      if (!f) return;
      var s = $('library-status');
      importSaves(f, function (m) { if (s) s.textContent = m; }).catch(function (e) {
        if (s) s.textContent = 'Import failed (' + (e && e.message ? e.message : e) + ').';
      });
      imp.value = '';
    });
  });
})();
