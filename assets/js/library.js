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
