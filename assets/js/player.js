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

  /* The drop veil (and its #veil-error paragraph) lives inside #ejs-stage, so
     never blank the whole stage — remove only the emulator screen div. */
  function clearScreen() {
    var scr = $('ejs-screen');
    if (scr) scr.remove();
  }

  function showVeil() {
    clearScreen();
    if (veil && !veil.isConnected && stage) stage.appendChild(veil);
    if (veil) veil.style.display = '';
  }

  /* Null-guarded: the error paragraph may not exist if the DOM changed. */
  function veilError(msg) {
    var err = $('veil-error');
    if (err) err.textContent = msg || '';
  }

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
    clearScreen();
    if (veil) veil.style.display = 'none';
    var screen = document.createElement('div');
    screen.id = 'ejs-screen';
    stage.appendChild(screen);

    window.EJS_player = '#ejs-screen';
    window.EJS_core = core;
    window.EJS_gameUrl = gameBlobUrl;
    window.EJS_gameName = fileName.replace(/\.[^.]+$/, '');
    window.EJS_gameID = 'bm-' + fileName.length + '-' + (fileName + core).split('').reduce(function (a, c) { return (a * 31 + c.charCodeAt(0)) >>> 0; }, 7);
    curCore = core;
    curGameName = window.EJS_gameName;
    curGameID = window.EJS_gameID;
    /* Player 2.0: preload this game's cheats into the engine's cheat manager
       (documented window.EJS_cheats = [[name, code], ...]) */
    window.EJS_cheats = getCheats().map(function (c) { return [c.name, c.code]; });
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
      showVeil();
      veilError('Could not load the emulator engine from the EmulatorJS CDN. Check your connection and try again.');
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
    /* Player 2.0: refresh the tools panels for the newly booted game */
    renderCheats();
    renderControls();
    refreshSaves();
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
      veilError('Could not detect the system for ".' + ext + '". Pick the system manually from the dropdown, then drop the file again.');
      return;
    }
    veilError('');
    if (sysSelect.value === 'auto') sysSelect.value = core;
    currentBlobUrl = URL.createObjectURL(file);
    boot(currentBlobUrl, file.name, core);
  }

  async function handleUrl() {
    var url = (urlInput.value || '').trim();
    if (!url) return;
    veilError('');
    setStatus('FETCHING FILE…', true);
    try {
      var res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var blob = await res.blob();
      var name = url.split('?')[0].split('/').pop() || 'game.rom';
      handleFile(new File([blob], name, { type: blob.type }));
    } catch (e) {
      setStatus('IDLE', false);
      veilError('Could not fetch that URL (' + e.message + '). The host must allow cross-origin downloads (CORS). If it fails, download the file yourself and drop it in instead.');
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

  /* ================= Player 2.0 =================
     All Player 2.0 features are client-side and verified against the
     EmulatorJS 4.2.3 stable engine (cdn.emulatorjs.org/stable):
     - save states: IndexedDB "EmulatorJS-states" / store "states",
       key = baseFileName + ".state", value = raw state bytes
       (the same bytes the engine itself downloads as <name>.state)
     - settings: localStorage "ejs-<gameId>-<core>-<gameName>-settings",
       payload {controlSettings, settings, cheats}
     - cheats: documented window.EJS_cheats = [[name, code], ...]
     Every DOM write below is null-guarded (wave 3.1 discipline). */

  var CRT_KEY = 'bm-crt';
  var IDB_DB = 'EmulatorJS-states';
  var IDB_STORE = 'states';
  var curCore = null, curGameName = null, curGameID = null;

  /* engine's invalid-char strip for the save-state base file name */
  function baseFileName() {
    if (!curGameName) return null;
    var b = String(curGameName).replace(/[#<$+%>!`&*'|{}\/\\?"=@:^\r\n]/gi, '').trim();
    return b || null;
  }

  /* engine keyMap (keyCode -> name), verified in 4.2.3 stable */
  var KEYMAP = {0:"",8:"backspace",9:"tab",13:"enter",16:"shift",17:"ctrl",18:"alt",19:"pause/break",20:"caps lock",27:"escape",32:"space",33:"page up",34:"page down",35:"end",36:"home",37:"left arrow",38:"up arrow",39:"right arrow",40:"down arrow",45:"insert",46:"delete",48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",65:"a",66:"b",67:"c",68:"d",69:"e",70:"f",71:"g",72:"h",73:"i",74:"j",75:"k",76:"l",77:"m",78:"n",79:"o",80:"p",81:"q",82:"r",83:"s",84:"t",85:"u",86:"v",87:"w",88:"x",89:"y",90:"z",91:"left window key",92:"right window key",93:"select key",96:"numpad 0",97:"numpad 1",98:"numpad 2",99:"numpad 3",100:"numpad 4",101:"numpad 5",102:"numpad 6",103:"numpad 7",104:"numpad 8",105:"numpad 9",106:"multiply",107:"add",109:"subtract",110:"decimal point",111:"divide",112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",121:"f10",122:"f11"};

  /* engine defaultControllers player-0 table, verified in 4.2.3 stable */
  var DEFAULT_CONTROLS = {
    0:{value:"x",value2:"BUTTON_2"},1:{value:"s",value2:"BUTTON_4"},2:{value:"v",value2:"SELECT"},3:{value:"enter",value2:"START"},
    4:{value:"up arrow",value2:"DPAD_UP"},5:{value:"down arrow",value2:"DPAD_DOWN"},6:{value:"left arrow",value2:"DPAD_LEFT"},7:{value:"right arrow",value2:"DPAD_RIGHT"},
    8:{value:"z",value2:"BUTTON_1"},9:{value:"a",value2:"BUTTON_3"},
    10:{value:"q",value2:"LEFT_TOP_SHOULDER"},11:{value:"e",value2:"RIGHT_TOP_SHOULDER"},12:{value:"tab",value2:"LEFT_BOTTOM_SHOULDER"},13:{value:"r",value2:"RIGHT_BOTTOM_SHOULDER"},
    14:{value:"",value2:"LEFT_STICK"},15:{value:"",value2:"RIGHT_STICK"},
    16:{value:"h",value2:"LEFT_STICK_X:+1"},17:{value:"f",value2:"LEFT_STICK_X:-1"},18:{value:"g",value2:"LEFT_STICK_Y:+1"},19:{value:"t",value2:"LEFT_STICK_Y:-1"},
    20:{value:"l",value2:"RIGHT_STICK_X:+1"},21:{value:"j",value2:"RIGHT_STICK_X:-1"},22:{value:"k",value2:"RIGHT_STICK_Y:+1"},23:{value:"i",value2:"RIGHT_STICK_Y:-1"},
    24:{value:"1"},25:{value:"2"},26:{value:"3"},27:{},28:{},29:{}
  };

  /* per-core button label lists, taken from the engine's own control-menu
     scheme tables (4.2.3 stable); deduped by id, first wins. */
  var BUTTON_LABELS = {
    gb:[[8,"A"],[0,"B"],[2,"SELECT"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    nes:[[8,"A"],[0,"B"],[2,"SELECT"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    snes:[[8,"A"],[0,"B"],[9,"X"],[1,"Y"],[2,"SELECT"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"],[10,"L"],[11,"R"]],
    n64:[[0,"A"],[1,"B"],[3,"START"],[4,"D-PAD UP"],[5,"D-PAD DOWN"],[6,"D-PAD LEFT"],[7,"D-PAD RIGHT"],[10,"L"],[11,"R"],[12,"Z"],[19,"STICK UP"],[18,"STICK DOWN"],[17,"STICK LEFT"],[16,"STICK RIGHT"],[23,"C-PAD UP"],[22,"C-PAD DOWN"],[21,"C-PAD LEFT"],[20,"C-PAD RIGHT"]],
    gba:[[8,"A"],[0,"B"],[10,"L"],[11,"R"],[2,"SELECT"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    nds:[[8,"A"],[0,"B"],[9,"X"],[1,"Y"],[2,"SELECT"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"],[10,"L"],[11,"R"],[14,"Microphone"]],
    vb:[[8,"A"],[0,"B"],[10,"L"],[11,"R"],[2,"SELECT"],[3,"START"],[4,"LEFT D-PAD UP"],[5,"LEFT D-PAD DOWN"],[6,"LEFT D-PAD LEFT"],[7,"LEFT D-PAD RIGHT"],[19,"RIGHT D-PAD UP"],[18,"RIGHT D-PAD DOWN"],[17,"RIGHT D-PAD LEFT"],[16,"RIGHT D-PAD RIGHT"]],
    atari2600:[[0,"FIRE"],[2,"SELECT"],[3,"RESET"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"],[10,"LEFT DIFFICULTY A"],[12,"LEFT DIFFICULTY B"],[11,"RIGHT DIFFICULTY A"],[13,"RIGHT DIFFICULTY B"],[14,"COLOR"],[15,"B/W"]],
    atari7800:[[0,"BUTTON 1"],[8,"BUTTON 2"],[2,"SELECT"],[3,"PAUSE"],[9,"RESET"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"],[10,"LEFT DIFFICULTY"],[11,"RIGHT DIFFICULTY"]],
    lynx:[[8,"A"],[0,"B"],[10,"OPTION 1"],[11,"OPTION 2"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    pce:[[8,"I"],[0,"II"],[2,"SELECT"],[3,"RUN"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    ngp:[[0,"A"],[8,"B"],[3,"OPTION"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    ws:[[8,"A"],[0,"B"],[3,"START"],[4,"X UP"],[5,"X DOWN"],[6,"X LEFT"],[7,"X RIGHT"],[13,"Y UP"],[12,"Y DOWN"],[10,"Y LEFT"],[11,"Y RIGHT"]],
    coleco:[[8,"LEFT BUTTON"],[0,"RIGHT BUTTON"],[9,"1"],[1,"2"],[11,"3"],[10,"4"],[13,"5"],[12,"6"],[15,"7"],[14,"8"],[2,"*"],[3,"#"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    segaMS:[[0,"BUTTON 1 / START"],[8,"BUTTON 2"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    segaGG:[[0,"BUTTON 1"],[8,"BUTTON 2"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    segaCD:[[1,"A"],[0,"B"],[8,"C"],[10,"X"],[9,"Y"],[11,"Z"],[3,"START"],[2,"MODE"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    sega32x:[[1,"A"],[0,"B"],[8,"C"],[10,"X"],[9,"Y"],[11,"Z"],[3,"START"],[2,"MODE"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]],
    segaSaturn:[[1,"A"],[0,"B"],[8,"C"],[9,"X"],[10,"Y"],[11,"Z"],[12,"L"],[13,"R"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"]]
  };
  var BUTTON_LABELS_DEFAULT = [[0,"B"],[1,"Y"],[2,"SELECT"],[3,"START"],[4,"UP"],[5,"DOWN"],[6,"LEFT"],[7,"RIGHT"],[8,"A"],[9,"X"],[10,"L"],[11,"R"],[12,"L2"],[13,"R2"],[14,"L3"],[15,"R3"],[19,"L STICK UP"],[18,"L STICK DOWN"],[17,"L STICK LEFT"],[16,"L STICK RIGHT"],[23,"R STICK UP"],[22,"R STICK DOWN"],[21,"R STICK LEFT"],[20,"R STICK RIGHT"]];
  var HOTKEY_LABELS = [[24,"QUICK SAVE STATE"],[25,"QUICK LOAD STATE"],[26,"CHANGE STATE SLOT"],[27,"FAST FORWARD"],[29,"SLOW MOTION"],[28,"REWIND"]];

  /* standard Gamepad API button names, for display of captured indices */
  var GPAD_NAMES = {0:"A / Cross",1:"B / Circle",2:"X / Square",3:"Y / Triangle",4:"Left bumper",5:"Right bumper",6:"Left trigger",7:"Right trigger",8:"Back / Select",9:"Start",10:"Left stick press",11:"Right stick press",12:"D-pad up",13:"D-pad down",14:"D-pad left",15:"D-pad right",16:"Home / Guide"};

  /* ---------- CRT filter ---------- */
  function crtStored() {
    try { return localStorage.getItem(CRT_KEY) === '1'; } catch (e) { return false; }
  }
  function ensureCrtOverlay() {
    var o = $('crt-overlay');
    if (!o && stage) {
      o = document.createElement('div');
      o.id = 'crt-overlay';
      o.className = 'crt-overlay';
      o.setAttribute('aria-hidden', 'true');
      o.style.display = 'none';
      stage.appendChild(o);
    }
    return o;
  }
  function applyCrt(on) {
    var o = ensureCrtOverlay();
    if (o) o.style.display = on ? '' : 'none';
    ['crt-btn', 'crt-toggle-2'].forEach(function (id) {
      var b = $(id);
      if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem(CRT_KEY, on ? '1' : '0'); } catch (e) {}
  }

  /* ---------- Save states: export / import / delete ---------- */
  function idbOpen() {
    return new Promise(function (resolve, reject) {
      try {
        if (!window.indexedDB) { reject(new Error('IndexedDB is not available in this browser')); return; }
        var req = indexedDB.open(IDB_DB, 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (db && !db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error || new Error('could not open save storage')); };
        req.onblocked = function () { reject(new Error('save storage is busy')); };
      } catch (e) { reject(e); }
    });
  }
  function savesSetStatus(msg) {
    var el = $('saves-status');
    if (el) el.textContent = msg;
  }
  function refreshSaves(afterMsg) {
    var list = $('saves-list');
    if (list) list.innerHTML = '';
    if (!curGameName) { savesSetStatus('Boot a game above to manage its save states.'); return; }
    savesSetStatus('Reading browser-kept save states…');
    idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var rq = db.transaction([IDB_STORE], 'readonly').objectStore(IDB_STORE).getAllKeys();
          rq.onsuccess = function () { resolve(rq.result || []); };
          rq.onerror = function () { reject(rq.error || new Error('read failed')); };
        } catch (e) { reject(e); }
      });
    }).then(function (keys) {
      keys = keys.filter(function (k) { return /\.state$/i.test(String(k)); });
      var list2 = $('saves-list');
      if (!list2) return;
      list2.innerHTML = '';
      var mine = baseFileName() + '.state';
      if (afterMsg) { savesSetStatus(afterMsg); }
      else if (!keys.length) {
        savesSetStatus('No browser-kept states found. (States download as files by default — switch the engine to "Keep in Browser" in the in-game menu → Settings → Save States to store them here.)');
        return;
      } else {
        savesSetStatus(keys.length + ' browser-kept state(s). "' + mine + '" belongs to the current game.');
      }
      keys.forEach(function (key) {
        var li = document.createElement('li');
        var nm = document.createElement('span'); nm.className = 'grow mono'; nm.textContent = String(key);
        if (String(key) === mine) { var tag = document.createElement('strong'); tag.textContent = ' ← this game'; nm.appendChild(tag); }
        var ex = document.createElement('button'); ex.type = 'button'; ex.className = 'btn btn-ghost btn-sm'; ex.textContent = '⤓ Export';
        ex.setAttribute('aria-label', 'Export save state ' + key);
        ex.addEventListener('click', function () { exportState(key); });
        var del = document.createElement('button'); del.type = 'button'; del.className = 'btn btn-ghost btn-sm'; del.textContent = '🗑 Delete';
        del.setAttribute('aria-label', 'Delete save state ' + key);
        del.addEventListener('click', function () { deleteState(key); });
        li.appendChild(nm); li.appendChild(ex); li.appendChild(del);
        list2.appendChild(li);
      });
    }).catch(function (e) {
      savesSetStatus('Could not read browser save storage (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function idbGet(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var rq = db.transaction([IDB_STORE], 'readonly').objectStore(IDB_STORE).get(key);
          rq.onsuccess = function () { resolve(rq.result); };
          rq.onerror = function () { reject(rq.error || new Error('read failed')); };
        } catch (e) { reject(e); }
      });
    });
  }
  function exportState(key) {
    idbGet(key).then(function (bytes) {
      if (!bytes || !bytes.byteLength) throw new Error('state is empty');
      var blob = new Blob([bytes], { type: 'application/octet-stream' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = String(key);
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      savesSetStatus('Exported "' + key + '" — share the file; a friend can import it with their own copy of the same game.');
    }).catch(function (e) {
      savesSetStatus('Export failed (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function importStateFile(file) {
    if (!file) return;
    if (!curGameName || !baseFileName()) { savesSetStatus('Boot a game first, then import.'); return; }
    var key = baseFileName() + '.state';
    savesSetStatus('Importing "' + file.name + '" as "' + key + '"…');
    file.arrayBuffer().then(function (buf) {
      if (!buf || !buf.byteLength) throw new Error('file is empty');
      return idbOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
          try {
            var rq = db.transaction([IDB_STORE], 'readwrite').objectStore(IDB_STORE).put(new Uint8Array(buf), key);
            rq.onsuccess = function () { resolve(); };
            rq.onerror = function () { reject(rq.error || new Error('write failed')); };
          } catch (e) { reject(e); }
        });
      });
    }).then(function () {
      refreshSaves('Imported as "' + key + '". Use the engine\'s Load State to resume from it.');
    }).catch(function (e) {
      savesSetStatus('Import failed (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function deleteState(key) {
    idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var rq = db.transaction([IDB_STORE], 'readwrite').objectStore(IDB_STORE).delete(key);
          rq.onsuccess = function () { resolve(); };
          rq.onerror = function () { reject(rq.error || new Error('delete failed')); };
        } catch (e) { reject(e); }
      });
    }).then(function () {
      refreshSaves('Deleted "' + key + '".');
    }).catch(function (e) {
      savesSetStatus('Delete failed (' + (e && e.message ? e.message : e) + ').');
    });
  }

  /* ---------- Controls: remap keyboard + gamepad ---------- */
  function controlsKey() {
    if (!curGameID || !curCore || !curGameName) return null;
    return 'ejs-' + curGameID + '-' + curCore + '-' + curGameName + '-settings';
  }
  function readControlsPayload() {
    var key = controlsKey();
    if (!key) return null;
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || typeof p !== 'object' || !p.controlSettings || typeof p.controlSettings !== 'object') return null;
      return p;
    } catch (e) { return null; }
  }
  function playerControls() {
    var p = readControlsPayload();
    if (p && p.controlSettings['0'] && typeof p.controlSettings['0'] === 'object') {
      return { stored: true, map: p.controlSettings['0'] };
    }
    return { stored: false, map: DEFAULT_CONTROLS };
  }
  function keyName(v) {
    if (v === undefined || v === null || v === '') return '—';
    if (typeof v === 'number') return KEYMAP[v] || ('key ' + v);
    return String(v);
  }
  function padName(v) {
    if (v === undefined || v === null || v === '') return '—';
    var s = String(v);
    if (/^\d+$/.test(s)) {
      var n = parseInt(s, 10);
      return 'Button ' + n + (GPAD_NAMES[n] ? ' (' + GPAD_NAMES[n] + ')' : '');
    }
    return s;
  }
  function schemeLabels() {
    var list = BUTTON_LABELS[curCore] || BUTTON_LABELS_DEFAULT;
    return list.concat(HOTKEY_LABELS);
  }
  function controlsSetStatus(msg) {
    var el = $('controls-status');
    if (el) el.textContent = msg;
  }
  function renderControls() {
    var tbody = $('controls-tbody');
    var status = $('controls-status');
    if (!curCore) {
      if (status) status.textContent = 'Boot a game above to see its mappings.';
      if (tbody) tbody.innerHTML = '';
      return;
    }
    var pc = playerControls();
    controlsSetStatus('Player 1 · ' + (SYSTEM_LABELS[curCore] || curCore) + ' · ' +
      (pc.stored ? 'custom mappings stored on this device' : 'engine defaults — no custom mappings stored yet') +
      '. Changes apply the next time the game boots.');
    if (!tbody) return;
    tbody.innerHTML = '';
    var seen = {};
    schemeLabels().forEach(function (pair) {
      var id = pair[0];
      if (seen[id]) return;
      seen[id] = 1;
      var entry = pc.map[id];
      if (!entry || typeof entry !== 'object') entry = {};
      var tr = document.createElement('tr');
      var td0 = document.createElement('td'); td0.textContent = pair[1];
      var td1 = document.createElement('td');
      var k = document.createElement('kbd'); k.className = 'key'; k.textContent = keyName(entry.value);
      td1.appendChild(k);
      var td2 = document.createElement('td'); td2.textContent = padName(entry.value2);
      var td3 = document.createElement('td');
      (function (btnId) {
        var bk = document.createElement('button');
        bk.type = 'button'; bk.className = 'btn btn-ghost btn-sm'; bk.textContent = 'Remap key';
        bk.setAttribute('aria-label', 'Remap keyboard key for ' + pair[1]);
        bk.addEventListener('click', function () { startKeyCapture(btnId, bk); });
        var bp = document.createElement('button');
        bp.type = 'button'; bp.className = 'btn btn-ghost btn-sm'; bp.textContent = 'Remap pad';
        bp.setAttribute('aria-label', 'Remap gamepad button for ' + pair[1]);
        bp.addEventListener('click', function () { startPadCapture(btnId, bp); });
        td3.appendChild(bk); td3.appendChild(bp);
      })(id);
      tr.appendChild(td0); tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
      tbody.appendChild(tr);
    });
  }
  function writeControl(id, field, val) {
    var key = controlsKey();
    if (!key) return;
    var payload = readControlsPayload();
    if (!payload) {
      payload = { controlSettings: { 0: {}, 1: {}, 2: {}, 3: {} }, settings: {}, cheats: [] };
      Object.keys(DEFAULT_CONTROLS).forEach(function (bid) {
        payload.controlSettings[0][bid] = { value: DEFAULT_CONTROLS[bid].value, value2: DEFAULT_CONTROLS[bid].value2 };
      });
    }
    if (!payload.controlSettings || typeof payload.controlSettings !== 'object') payload.controlSettings = {};
    ['0', '1', '2', '3'].forEach(function (p) {
      if (!payload.controlSettings[p] || typeof payload.controlSettings[p] !== 'object') payload.controlSettings[p] = {};
    });
    var entry = payload.controlSettings['0'][id];
    if (!entry || typeof entry !== 'object') { entry = {}; payload.controlSettings['0'][id] = entry; }
    entry[field] = val;
    try {
      localStorage.setItem(key, JSON.stringify(payload));
      controlsSetStatus('Saved — takes effect the next time the game boots.');
    } catch (e) {
      controlsSetStatus('Could not save the mapping (' + (e && e.message ? e.message : e) + ').');
    }
    renderControls();
  }
  var capturingKey = false;
  function startKeyCapture(id, btn) {
    if (capturingKey) return;
    capturingKey = true;
    var old = btn.textContent;
    btn.textContent = 'Press a key… (Esc cancels)';
    var h = function (e) {
      e.preventDefault(); e.stopPropagation();
      document.removeEventListener('keydown', h, true);
      capturingKey = false;
      btn.textContent = old;
      if (e.key === 'Escape') return;
      writeControl(id, 'value', e.keyCode);
    };
    document.addEventListener('keydown', h, true);
  }
  var capturingPad = false, padCancel = null;
  function startPadCapture(id, btn) {
    if (capturingPad) {
      if (padCancel) padCancel();
      return;
    }
    if (!navigator.getGamepads) { controlsSetStatus('This browser has no gamepad API.'); return; }
    capturingPad = true;
    var old = btn.textContent;
    btn.textContent = 'Press a pad button… (click to cancel)';
    var snap = function () {
      var o = {};
      var gps = [];
      try { gps = navigator.getGamepads() || []; } catch (e) {}
      for (var i = 0; i < gps.length; i++) {
        var g = gps[i];
        if (!g) continue;
        o[i] = [];
        for (var b = 0; b < g.buttons.length; b++) o[i][b] = !!g.buttons[b].pressed;
      }
      return o;
    };
    var prev = snap();
    var t0 = Date.now(), raf = 0, done = false;
    padCancel = function () {
      if (done) return;
      done = true;
      capturingPad = false; padCancel = null;
      cancelAnimationFrame(raf);
      btn.textContent = old;
      controlsSetStatus('Gamepad remap cancelled.');
    };
    var tick = function () {
      if (done) return;
      if (Date.now() - t0 > 15000) { padCancel(); return; }
      var gps = [];
      try { gps = navigator.getGamepads() || []; } catch (e) {}
      for (var i = 0; i < gps.length; i++) {
        var g = gps[i];
        if (!g) continue;
        for (var b = 0; b < g.buttons.length; b++) {
          if (g.buttons[b].pressed && !(prev[i] && prev[i][b])) {
            done = true; capturingPad = false; padCancel = null;
            cancelAnimationFrame(raf);
            btn.textContent = old;
            writeControl(id, 'value2', b);
            return;
          }
        }
      }
      prev = snap();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function resetControls() {
    var key = controlsKey();
    if (key) { try { localStorage.removeItem(key); } catch (e) {} }
    renderControls();
    controlsSetStatus('Custom mappings cleared — engine defaults apply on next boot.');
  }

  /* ---------- Cheats ---------- */
  function cheatStoreKey() { return curGameID ? 'bm-cheats-' + curGameID : null; }
  function getCheats() {
    var k = cheatStoreKey();
    if (!k) return [];
    try {
      var a = JSON.parse(localStorage.getItem(k) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function setCheats(a) {
    var k = cheatStoreKey();
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(a)); } catch (e) {}
  }
  function cheatsSetStatus(msg) {
    var el = $('cheats-status');
    if (el) el.textContent = msg;
  }
  function renderCheats() {
    var list = $('cheats-list');
    if (list) list.innerHTML = '';
    if (!curGameID) {
      cheatsSetStatus('Boot a game above to attach cheats to it.');
      return;
    }
    var cheats = getCheats();
    cheatsSetStatus(cheats.length
      ? cheats.length + ' cheat(s) for this game — loaded into the engine’s cheat manager when the game boots; toggle them with the cheat icon in the in-game menu.'
      : 'No cheats yet for this game. Add your own below.');
    if (!list) return;
    cheats.forEach(function (c, i) {
      var li = document.createElement('li');
      var nm = document.createElement('span'); nm.className = 'grow';
      var b = document.createElement('strong'); b.textContent = c.name || 'Cheat';
      nm.appendChild(b);
      nm.appendChild(document.createTextNode(' — '));
      var code = document.createElement('code'); code.className = 'mono'; code.textContent = c.code || '';
      nm.appendChild(code);
      var rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'btn btn-ghost btn-sm'; rm.textContent = 'Remove';
      rm.setAttribute('aria-label', 'Remove cheat ' + (c.name || ''));
      rm.addEventListener('click', function () {
        var a = getCheats();
        a.splice(i, 1);
        setCheats(a);
        renderCheats();
      });
      li.appendChild(nm); li.appendChild(rm);
      list.appendChild(li);
    });
  }
  function addCheat() {
    if (!curGameID) { cheatsSetStatus('Boot a game first.'); return; }
    var nameEl = $('cheat-name'), codeEl = $('cheat-code');
    var name = nameEl && nameEl.value ? nameEl.value.trim() : '';
    var code = codeEl && codeEl.value ? codeEl.value.trim().replace(/\s+/g, '') : '';
    if (!name || !code) { cheatsSetStatus('Give the cheat a name and a code first.'); return; }
    var a = getCheats();
    a.push({ name: name, code: code });
    setCheats(a);
    if (nameEl) nameEl.value = '';
    if (codeEl) codeEl.value = '';
    renderCheats();
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

    /* deep link: ?core=gba (etc.) preselects the system — used by the guides */
    try {
      var qcore = new URLSearchParams(window.location.search).get('core');
      if (qcore && SYSTEM_LABELS[qcore]) {
        sysSelect.value = qcore;
        updateBiosNote(qcore);
      }
    } catch (e) { /* ignore malformed query strings */ }

    $('browse-btn').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () { handleFile(fileInput.files[0]); fileInput.value = ''; });
    $('load-url-btn').addEventListener('click', handleUrl);
    urlInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleUrl(); });

    $('eject-btn').addEventListener('click', function () {
      teardown();
      showVeil();
      $('player-toolbar').hidden = true;
      $('sys-badge').hidden = true;
      setStatus('IDLE', false);
      sysSelect.value = 'auto';
      curCore = null; curGameName = null; curGameID = null;
      renderCheats(); renderControls(); refreshSaves();
    });

    $('fullscreen-btn').addEventListener('click', function () {
      var shell = $('console-shell');
      if (document.fullscreenElement) document.exitFullscreen();
      else if (shell.requestFullscreen) shell.requestFullscreen();
    });

    bindDrop(veil);
    setStatus('IDLE — DROP A FILE TO BEGIN', false);

    /* ---------- Player 2.0 wiring ---------- */
    ensureCrtOverlay();
    applyCrt(crtStored());
    var crtToggle = function () { applyCrt(!crtStored()); };
    var crtBtn = $('crt-btn');
    if (crtBtn) crtBtn.addEventListener('click', crtToggle);
    var crtBtn2 = $('crt-toggle-2');
    if (crtBtn2) crtBtn2.addEventListener('click', crtToggle);

    var savesRefresh = $('saves-refresh');
    if (savesRefresh) savesRefresh.addEventListener('click', function () { refreshSaves(); });
    var importInput = $('import-state-file');
    if (importInput) importInput.addEventListener('change', function () {
      importStateFile(importInput.files && importInput.files[0]);
      importInput.value = '';
    });

    var controlsReset = $('controls-reset');
    if (controlsReset) controlsReset.addEventListener('click', resetControls);

    var cheatAdd = $('cheat-add');
    if (cheatAdd) cheatAdd.addEventListener('click', addCheat);
    ['cheat-name', 'cheat-code'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') addCheat(); });
    });

    /* initial (no-game) panel state */
    renderCheats();
    renderControls();
    refreshSaves();
  });
})();
