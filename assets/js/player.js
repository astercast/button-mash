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
    /* Wow wave 1: CRT power-on for the new screen (pure CSS, engine untouched).
       Gated on this system's CRT pref; fx-off / reduced-motion make it a no-op. */
    if (readDisplay(core).crt) powerOnScreen();

    window.EJS_player = '#ejs-screen';
    window.EJS_core = core;
    window.EJS_gameUrl = gameBlobUrl;
    window.EJS_gameName = fileName.replace(/\.[^.]+$/, '');
    window.EJS_gameID = 'bm-' + fileName.length + '-' + (fileName + core).split('').reduce(function (a, c) { return (a * 31 + c.charCodeAt(0)) >>> 0; }, 7);
    curCore = core;
    curGameName = window.EJS_gameName;
    curGameID = window.EJS_gameID;
    remapOverride = null;
    /* Player 2.0: preload this game's cheats into the engine's cheat manager
       (documented window.EJS_cheats = [[name, code], ...]) */
    window.EJS_cheats = getCheats().map(function (c) { return [c.name, c.code]; });
    /* Player 2.1: remember this game for the slots/remap/display panels,
       and fold the per-system control map into the engine's own settings
       (applies on next boot; first boot migrates legacy per-game maps). */
    saveLastGame();
    applySystemRemapToEngine(core);
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
      applyIntScale();
    };
    document.head.appendChild(script);
    booted = true;

    $('sys-badge').textContent = SYSTEM_LABELS[core] || core;
    $('sys-badge').hidden = false;
    var sb2 = $('sys-badge2');
    if (sb2) { sb2.textContent = SYSTEM_LABELS[core] || core; }
    $('player-toolbar').hidden = false;
    updateBiosNote(core);
    /* Player 2.1: apply this system's remembered display prefs, watch for
       the engine canvas (integer scaling), refresh the tools panels. */
    applyDisplayPrefs(core);
    watchScreen();
    renderCheats();
    renderRemap();
    renderSlots();
    scheduleAutosave();
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

  /* ================= Player 2.1 =================
     All Player 2.1 features are client-side and verified against the
     EmulatorJS 4.2.3 stable engine (cdn.emulatorjs.org/stable):
     - save slots: IndexedDB "EmulatorJS-states" / store "states" — the same
       store the engine uses. Engine slot key = "<baseFileName>.state"
       (base = game name with the engine's invalid-char strip). Named slots
       are "<baseFileName>.bm-slot-<n>.state"; the auto-save slot is
       "<baseFileName>.bm-autosave.state". Restoring = copying bytes over
       the engine's key, so the engine's own Load State picks it up.
       Slot labels live in localStorage "bm-slots-<gameID>".
     - settings: localStorage "ejs-<gameId>-<core>-<gameName>-settings",
       payload {controlSettings, settings, cheats}
     - per-system remap: localStorage "bm-remap-<core>" {player0:{id:{value,value2}}},
       written into the engine payload's controlSettings['0'] at boot
     - display prefs: localStorage "bm-display-<core>" {crt,intScale,aspect}
     - cheats: documented window.EJS_cheats = [[name, code], ...]
     - last game: localStorage "bm-last-game" {gameID,gameName,core}, so the
       panels keep working for the most recent game even before a boot
     Every DOM write below is null-guarded (wave 3.1 discipline). */

  var CRT_KEY = 'bm-crt'; /* legacy global toggle — read once as a fallback when adopting per-system prefs */
  var IDB_DB = 'EmulatorJS-states';
  var IDB_STORE = 'states';
  var LAST_GAME_KEY = 'bm-last-game';
  var curCore = null, curGameName = null, curGameID = null;

  /* engine's invalid-char strip for the save-state base file name */
  function stripInvalid(name) {
    var b = String(name || '').replace(/[#<$+%>!`&*'|{}\/\\?"=@:^\r\n]/gi, '').trim();
    return b || null;
  }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* last-booted game, so the panels work even before a fresh boot */
  function readLastGame() {
    try {
      var lg = JSON.parse(localStorage.getItem(LAST_GAME_KEY) || 'null');
      if (lg && lg.gameID && lg.gameName && lg.core) return lg;
    } catch (e) {}
    return null;
  }
  function saveLastGame() {
    if (!curGameID || !curGameName || !curCore) return;
    try { localStorage.setItem(LAST_GAME_KEY, JSON.stringify({ gameID: curGameID, gameName: curGameName, core: curCore })); } catch (e) {}
  }
  /* current game if booted, else the last-booted one */
  function gameCtx() {
    if (curGameID && curGameName && curCore) return { gameID: curGameID, gameName: curGameName, core: curCore };
    return readLastGame();
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

  /* ---------- Display options (Player 2.1, per system) ---------- */
  var ASPECT_CLASSES = ['ar-43', 'ar-169', 'ar-fill', 'ar-orig'];
  var ASPECTS = ['fill', '4:3', '16:9', 'original'];
  function displayKey(core) { return core ? 'bm-display-' + core : null; }
  /* the system whose prefs the panels edit: current game, else last game, else gba */
  function displayCore() {
    if (curCore) return curCore;
    var lg = readLastGame();
    return (lg && lg.core) || 'gba';
  }
  function readDisplay(core) {
    var d = { crt: false, intScale: false, aspect: 'fill' };
    var k = displayKey(core);
    if (!k) return d;
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { stored = null; }
    if (stored && typeof stored === 'object') {
      if (typeof stored.crt === 'boolean') d.crt = stored.crt;
      if (typeof stored.intScale === 'boolean') d.intScale = stored.intScale;
      if (ASPECTS.indexOf(stored.aspect) !== -1) d.aspect = stored.aspect;
    } else {
      /* one-time adopt: the legacy global bm-crt toggle becomes this system's setting */
      try {
        if (localStorage.getItem(CRT_KEY) === '1') { d.crt = true; saveDisplay(core, d); }
      } catch (e) {}
    }
    return d;
  }
  function saveDisplay(core, d) {
    var k = displayKey(core);
    if (!k) return;
    try {
      localStorage.setItem(k, JSON.stringify({
        crt: !!d.crt, intScale: !!d.intScale,
        aspect: ASPECTS.indexOf(d.aspect) !== -1 ? d.aspect : 'fill'
      }));
    } catch (e) {}
  }
  function aspectClass(aspect) {
    return aspect === '4:3' ? 'ar-43' : aspect === '16:9' ? 'ar-169' : aspect === 'original' ? 'ar-orig' : 'ar-fill';
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
    /* Wow wave 1: the full CRT treatment (scanline roll, glass sheen,
       phosphor glow) rides on the shell class; CSS kills it under fx-off. */
    var shell = $('console-shell');
    if (shell) shell.classList.toggle('crt-on', !!on);
    ['crt-btn', 'crt-toggle-2'].forEach(function (id) {
      var b = $(id);
      if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    ['disp-crt', 'dlg-crt'].forEach(function (id) {
      var c = $(id);
      if (c) c.checked = !!on;
    });
  }
  function applyDisplayPrefs(core) {
    var d = readDisplay(core);
    applyCrt(d.crt);
    var screen = $('ejs-screen');
    if (screen) {
      ASPECT_CLASSES.forEach(function (c) { screen.classList.remove(c); });
      screen.classList.add(aspectClass(d.aspect));
      screen.classList.toggle('int-scale', !!d.intScale);
    }
    syncDisplayUI(core);
    applyIntScale();
  }
  function syncDisplayUI(core) {
    var d = readDisplay(core);
    var label = SYSTEM_LABELS[core] || core;
    var s1 = $('display-sys'); if (s1) s1.textContent = label;
    var s2 = $('display-sys-2'); if (s2) s2.textContent = label;
    var s3 = $('settings-dialog-sys'); if (s3) s3.textContent = '· ' + label;
    [['disp-intscale', 'intScale'], ['dlg-intscale', 'intScale']].forEach(function (pair) {
      var el = $(pair[0]); if (el) el.checked = !!d[pair[1]];
    });
    var a1 = $('disp-aspect'); if (a1) a1.value = d.aspect;
    var a2 = $('dlg-aspect'); if (a2) a2.value = d.aspect;
    var cb1 = $('disp-crt'); if (cb1) cb1.checked = !!d.crt;
    var cb2 = $('dlg-crt'); if (cb2) cb2.checked = !!d.crt;
  }
  function setDisplayPatch(patch) {
    var core = displayCore();
    var d = readDisplay(core);
    Object.keys(patch).forEach(function (k) { d[k] = patch[k]; });
    saveDisplay(core, d);
    applyDisplayPrefs(core);
  }
  /* integer scale: snap the engine canvas to whole-pixel multiples of its
     intrinsic size (read from the canvas itself, so it works for every core) */
  function applyIntScale() {
    var screen = $('ejs-screen');
    if (!screen) return;
    var cv = null;
    try { cv = screen.querySelector('canvas'); } catch (e) { /* no canvas yet */ }
    if (!cv) return;
    if (!readDisplay(displayCore()).intScale) { cv.style.width = ''; cv.style.height = ''; return; }
    var iw = cv.width || 0, ih = cv.height || 0;
    if (!iw || !ih) return;
    var availW = screen.clientWidth || (stage && stage.clientWidth) || iw;
    var f = Math.max(1, Math.floor(availW / iw));
    cv.style.width = (iw * f) + 'px';
    cv.style.height = (ih * f) + 'px';
  }
  var screenObs = null;
  function watchScreen() {
    if (screenObs) { try { screenObs.disconnect(); } catch (e) {} screenObs = null; }
    var screen = $('ejs-screen');
    if (!screen || !window.MutationObserver) return;
    screenObs = new MutationObserver(function () { applyIntScale(); });
    try { screenObs.observe(screen, { childList: true, subtree: true }); } catch (e) {}
  }
  /* fullscreen polish: one toggle, honest button state */
  function toggleFullscreen() {
    var shell = $('console-shell');
    if (!shell) return;
    if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
    else if (shell.requestFullscreen) { try { shell.requestFullscreen(); } catch (e) {} }
  }
  function syncFullscreenBtn() {
    var on = !!document.fullscreenElement;
    ['fullscreen-btn', 'fs-btn-2', 'fs-btn-3'].forEach(function (id) {
      var b = $(id);
      if (b) {
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? '⛶ Exit fullscreen' : '⛶ Fullscreen';
      }
    });
  }

  /* ---------- Wow wave 1: CRT screen power on/off ----------
     Pure overlay classes on #ejs-screen — the EmulatorJS engine underneath
     is never touched. The FX toggle and prefers-reduced-motion both make
     these a no-op (CSS gates the keyframes; this helper skips the delay). */
  function crtMotionOK() {
    var rm = false;
    try { rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    return !rm && !document.documentElement.classList.contains('fx-off');
  }
  function powerOnScreen() {
    var s = $('ejs-screen');
    if (!s) return;
    s.classList.remove('screen-power-off');
    s.classList.add('screen-power-on');
    setTimeout(function () { s.classList.remove('screen-power-on'); }, 700);
  }
  /* Runs fn after the CRT power-off collapse, or immediately when the
     treatment is off / no screen is up / motion is reduced / FX is off. */
  function powerOffThen(fn) {
    var s = $('ejs-screen');
    var want = !!(s && curCore && readDisplay(curCore).crt && crtMotionOK());
    if (!want) { fn(); return; }
    s.classList.remove('screen-power-on');
    s.classList.add('screen-power-off');
    setTimeout(function () { fn(); }, 400);
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
  /* ---------- Save slots (Player 2.1) ----------
     Named slots live in the engine's own IndexedDB store, so the engine's
     Load State keeps working: restoring a slot = copying its bytes over the
     engine's "<base>.state" key. Everything is browser-local. */
  var AUTOSAVE_SUFFIX = '.bm-autosave.state';
  function slotsSetStatus(msg) {
    var el = $('slots-status');
    if (el) el.textContent = msg;
  }
  function engineSlotKey(base) { return base + '.state'; }
  function namedSlotKey(base, n) { return base + '.bm-slot-' + n + '.state'; }
  function autosaveSlotKey(base) { return base + AUTOSAVE_SUFFIX; }
  function slotMetaKey(ctx) { return ctx ? 'bm-slots-' + ctx.gameID : null; }
  function autosavePrefKey(ctx) { return ctx ? 'bm-autosave-' + ctx.gameID : null; }
  function readSlotMeta(ctx) {
    var k = slotMetaKey(ctx);
    if (!k) return {};
    try {
      var m = JSON.parse(localStorage.getItem(k) || '{}');
      return (m && typeof m === 'object') ? m : {};
    } catch (e) { return {}; }
  }
  function writeSlotMeta(ctx, m) {
    var k = slotMetaKey(ctx);
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(m)); } catch (e) {}
  }
  function fmtBytes(n) {
    if (n === undefined || n === null) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function fmtTime(t) {
    try { return new Date(t).toLocaleString(); } catch (e) { return ''; }
  }
  function idbAllKeys() {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var rq = db.transaction([IDB_STORE], 'readonly').objectStore(IDB_STORE).getAllKeys();
          rq.onsuccess = function () { resolve(rq.result || []); };
          rq.onerror = function () { reject(rq.error || new Error('read failed')); };
        } catch (e) { reject(e); }
      });
    });
  }
  function idbPut(key, bytes) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var rq = db.transaction([IDB_STORE], 'readwrite').objectStore(IDB_STORE).put(bytes, key);
          rq.onsuccess = function () { resolve(); };
          rq.onerror = function () { reject(rq.error || new Error('write failed')); };
        } catch (e) { reject(e); }
      });
    });
  }
  function idbDelete(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var rq = db.transaction([IDB_STORE], 'readwrite').objectStore(IDB_STORE).delete(key);
          rq.onsuccess = function () { resolve(); };
          rq.onerror = function () { reject(rq.error || new Error('delete failed')); };
        } catch (e) { reject(e); }
      });
    });
  }
  function asBytes(v) {
    if (!v) return null;
    if (v instanceof Uint8Array) return v;
    try { return new Uint8Array(v); } catch (e) { return null; }
  }
  function mkBtn(text, label, onClick, disabled, disabledTitle) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-ghost btn-sm';
    b.textContent = text;
    b.setAttribute('aria-label', label || text);
    if (disabled) {
      b.disabled = true;
      if (disabledTitle) b.title = disabledTitle;
    } else if (onClick) {
      b.addEventListener('click', onClick);
    }
    return b;
  }
  function slotRow(ctx, key, label, sub, isEngine, hasEngine) {
    var li = document.createElement('li');
    li.className = 'slot-row';
    var info = document.createElement('span'); info.className = 'grow';
    var nm = document.createElement('strong'); nm.className = 'slot-label'; nm.textContent = label;
    info.appendChild(nm);
    info.appendChild(document.createElement('br'));
    var meta = document.createElement('span'); meta.className = 'slot-sub';
    meta.textContent = sub + ' · ';
    var sz = document.createElement('span'); sz.className = 'mono';
    sz.setAttribute('data-size-for', key); sz.textContent = '…';
    meta.appendChild(sz);
    info.appendChild(meta);
    li.appendChild(info);
    var acts = document.createElement('span'); acts.className = 'slot-actions';
    if (!isEngine) {
      acts.appendChild(mkBtn('💾 Save', 'Copy the engine slot into "' + label + '"',
        function () { copyIntoSlot(ctx, key, label); },
        !hasEngine, 'Save in-game first (needs "Keep in Browser" mode)'));
      acts.appendChild(mkBtn('⏪ Restore', 'Copy "' + label + '" over the engine slot — the engine\'s Load State will read it',
        function () { restoreSlot(ctx, key, label); }));
      acts.appendChild(mkBtn('✏️ Rename', 'Rename the slot "' + label + '"',
        function () { renameSlot(ctx, key, label, nm); }));
    }
    acts.appendChild(mkBtn('⤓ Export', 'Download "' + label + '" as a file',
      function () { exportState(key); }));
    acts.appendChild(mkBtn('🗑 Delete', 'Delete the slot "' + label + '"',
      function () { deleteSlot(ctx, key, label); }));
    li.appendChild(acts);
    return li;
  }
  function renderSlots() {
    var list = $('slots-list');
    if (list) list.innerHTML = '';
    var nb = $('slot-new');
    if (nb) nb.disabled = true;
    var ctx = gameCtx();
    renderAutosave(ctx);
    if (!ctx) { slotsSetStatus('Boot a game above to manage its save slots.'); return; }
    var base = stripInvalid(ctx.gameName);
    if (!base) { slotsSetStatus('Could not name save slots for this game.'); return; }
    slotsSetStatus('Reading save slots…');
    var engKey = engineSlotKey(base);
    var autoKey = autosaveSlotKey(base);
    var re = new RegExp('^' + escRe(base) + '\\.bm-slot-(\\d+)\\.state$');
    idbAllKeys().then(function (keys) {
      var list2 = $('slots-list');
      if (!list2) return;
      list2.innerHTML = '';
      var meta = readSlotMeta(ctx);
      var slots = [];
      keys.forEach(function (k) {
        var m = re.exec(String(k));
        if (m) slots.push({ key: String(k), n: parseInt(m[1], 10) });
      });
      slots.sort(function (a, b) { return a.n - b.n; });
      var hasEngine = keys.indexOf(engKey) !== -1;
      var hasAuto = keys.indexOf(autoKey) !== -1;
      var total = slots.length + (hasEngine ? 1 : 0) + (hasAuto ? 1 : 0);
      if (!total) {
        slotsSetStatus('No save slots yet for "' + ctx.gameName + '". Save in-game with the engine set to "Keep in Browser" (in-game menu → Settings → Save States) and the engine slot will appear here. Everything is stored only in this browser.');
      } else {
        slotsSetStatus(total + ' slot(s) for "' + ctx.gameName + '" — all stored only in this browser.');
      }
      var frag = document.createDocumentFragment();
      if (hasEngine) {
        frag.appendChild(slotRow(ctx, engKey, 'Engine slot',
          'The slot the in-game menu reads and writes — exists only in "Keep in Browser" mode', true, true));
      }
      slots.forEach(function (s) {
        var mm = meta[s.key] || {};
        frag.appendChild(slotRow(ctx, s.key, mm.label || ('Slot ' + s.n),
          mm.updated ? 'Saved ' + fmtTime(mm.updated) : 'Named slot', false, hasEngine));
      });
      if (hasAuto) {
        var am = meta[autoKey] || {};
        frag.appendChild(slotRow(ctx, autoKey, am.label || 'Auto-save',
          am.updated ? 'Auto-saved ' + fmtTime(am.updated) : 'Written automatically on the timer below', false, hasEngine));
      }
      list2.appendChild(frag);
      Array.prototype.forEach.call(list2.querySelectorAll('[data-size-for]'), function (sp) {
        var k = sp.getAttribute('data-size-for');
        idbGet(k).then(function (b) {
          var bytes = asBytes(b);
          sp.textContent = bytes ? fmtBytes(bytes.byteLength) : 'empty';
        }).catch(function () { sp.textContent = '—'; });
      });
      var nb2 = $('slot-new');
      if (nb2) nb2.disabled = false;
    }).catch(function (e) {
      slotsSetStatus('Could not read save storage (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function copyIntoSlot(ctx, key, label) {
    var base = stripInvalid(ctx.gameName);
    if (!base) return;
    var engKey = engineSlotKey(base);
    slotsSetStatus('Saving into "' + label + '"…');
    idbGet(engKey).then(function (eng) {
      var bytes = asBytes(eng);
      if (!bytes || !bytes.byteLength) throw new Error('the engine slot is empty — save in-game first');
      return idbPut(key, bytes).then(function () {
        var meta = readSlotMeta(ctx);
        meta[key] = meta[key] || {};
        if (!meta[key].label) meta[key].label = label;
        meta[key].updated = Date.now();
        writeSlotMeta(ctx, meta);
        slotsSetStatus('Saved into "' + (meta[key].label || label) + '".');
        renderSlots();
      });
    }).catch(function (e) {
      slotsSetStatus('Save failed (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function restoreSlot(ctx, key, label) {
    var base = stripInvalid(ctx.gameName);
    if (!base) return;
    var engKey = engineSlotKey(base);
    slotsSetStatus('Restoring "' + label + '"…');
    idbGet(key).then(function (val) {
      var bytes = asBytes(val);
      if (!bytes || !bytes.byteLength) throw new Error('slot is empty');
      return idbPut(engKey, bytes);
    }).then(function () {
      slotsSetStatus('Restored "' + label + '" — use the engine\'s Load State to resume from it.');
      renderSlots();
    }).catch(function (e) {
      slotsSetStatus('Restore failed (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function renameSlot(ctx, key, label, labelEl) {
    var input = document.createElement('input');
    input.type = 'text';
    input.value = label;
    input.maxLength = 40;
    input.setAttribute('aria-label', 'New name for save slot');
    var wrap = document.createElement('span');
    wrap.className = 'slot-rename';
    function commit() {
      var v = input.value.trim().slice(0, 40) || label;
      var meta = readSlotMeta(ctx);
      meta[key] = meta[key] || {};
      meta[key].label = v;
      writeSlotMeta(ctx, meta);
      slotsSetStatus('Slot renamed to "' + v + '".');
      renderSlots();
    }
    function cancel() { renderSlots(); }
    wrap.appendChild(input);
    wrap.appendChild(mkBtn('Save', 'Save the new slot name', commit));
    wrap.appendChild(mkBtn('Cancel', 'Cancel renaming', cancel));
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    labelEl.replaceWith(wrap);
    input.focus();
    input.select();
  }
  function deleteSlot(ctx, key, label) {
    slotsSetStatus('Deleting "' + label + '"…');
    idbDelete(key).then(function () {
      var meta = readSlotMeta(ctx);
      if (meta[key]) { delete meta[key]; writeSlotMeta(ctx, meta); }
      slotsSetStatus('Deleted "' + label + '".');
      renderSlots();
    }).catch(function (e) {
      slotsSetStatus('Delete failed (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function newSlot() {
    var ctx = gameCtx();
    if (!ctx) { slotsSetStatus('Boot a game first, then add a slot.'); return; }
    var base = stripInvalid(ctx.gameName);
    if (!base) return;
    var engKey = engineSlotKey(base);
    var re = new RegExp('^' + escRe(base) + '\\.bm-slot-(\\d+)\\.state$');
    slotsSetStatus('Creating a new slot…');
    idbAllKeys().then(function (keys) {
      var max = 0;
      keys.forEach(function (k) {
        var m = re.exec(String(k));
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      var n = max + 1;
      var key = namedSlotKey(base, n);
      return idbGet(engKey).then(function (eng) {
        var bytes = asBytes(eng);
        if (!bytes || !bytes.byteLength) throw new Error('the engine slot is empty — save in-game first (needs "Keep in Browser" mode)');
        return idbPut(key, bytes).then(function () {
          var meta = readSlotMeta(ctx);
          meta[key] = { label: 'Slot ' + n, updated: Date.now() };
          writeSlotMeta(ctx, meta);
          slotsSetStatus('Created "Slot ' + n + '" from the engine slot.');
          renderSlots();
        });
      });
    }).catch(function (e) {
      slotsSetStatus('Could not create the slot (' + (e && e.message ? e.message : e) + ').');
    });
  }
  /* ---------- Auto-save ---------- */
  var autosaveTimer = 0;
  function readAutosavePref(ctx) {
    var k = autosavePrefKey(ctx);
    if (k) {
      try {
        var p = JSON.parse(localStorage.getItem(k) || 'null');
        if (p && typeof p === 'object') {
          return { enabled: !!p.enabled, minutes: [1, 5, 15].indexOf(p.minutes) !== -1 ? p.minutes : 5 };
        }
      } catch (e) {}
    }
    return { enabled: false, minutes: 5 };
  }
  function writeAutosavePref(ctx, pref) {
    var k = autosavePrefKey(ctx);
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify({ enabled: !!pref.enabled, minutes: pref.minutes })); } catch (e) {}
  }
  function renderAutosave(ctx) {
    var pref = ctx ? readAutosavePref(ctx) : { enabled: false, minutes: 5 };
    [['autosave-toggle', 'dlg-autosave'], ['autosave-mins', 'dlg-autosave-mins']].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      el.disabled = !ctx;
      if (el.type === 'checkbox') el.checked = pref.enabled;
      else el.value = String(pref.minutes);
    });
    var msg = !ctx ? 'Boot a game to set up auto-save.' :
      pref.enabled ? 'On — copies the engine slot every ' + pref.minutes + ' min while this tab stays open.' :
      'Off. Copies the engine slot on a timer; needs "Keep in Browser" mode and this tab open.';
    ['autosave-status', 'dlg-autosave-status'].forEach(function (id) {
      var el = $(id); if (el) el.textContent = msg;
    });
  }
  function setAutosavePref(patch) {
    var ctx = gameCtx();
    if (!ctx) return;
    var pref = readAutosavePref(ctx);
    Object.keys(patch).forEach(function (k) { pref[k] = patch[k]; });
    writeAutosavePref(ctx, pref);
    renderAutosave(ctx);
    scheduleAutosave();
  }
  function scheduleAutosave() {
    if (autosaveTimer) { clearInterval(autosaveTimer); autosaveTimer = 0; }
    var ctx = gameCtx();
    if (!ctx) return;
    var pref = readAutosavePref(ctx);
    if (!pref.enabled) return;
    autosaveTimer = setInterval(function () { autosavePass(); }, pref.minutes * 60000);
  }
  function autosavePass() {
    var ctx = gameCtx();
    if (!ctx) return Promise.resolve(false);
    var base = stripInvalid(ctx.gameName);
    if (!base) return Promise.resolve(false);
    var engKey = engineSlotKey(base), autoKey = autosaveSlotKey(base);
    return idbGet(engKey).then(function (eng) {
      var bytes = asBytes(eng);
      if (!bytes || !bytes.byteLength) return false;
      return idbGet(autoKey).then(function (old) {
        var oldBytes = asBytes(old);
        if (oldBytes && oldBytes.byteLength === bytes.byteLength) return false; /* unchanged */
        return idbPut(autoKey, bytes).then(function () {
          var meta = readSlotMeta(ctx);
          meta[autoKey] = meta[autoKey] || {};
          if (!meta[autoKey].label) meta[autoKey].label = 'Auto-save';
          meta[autoKey].updated = Date.now();
          writeSlotMeta(ctx, meta);
          renderSlots();
          return true;
        });
      });
    }).catch(function () { return false; });
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
    idbGet(key).then(function (val) {
      var bytes = asBytes(val);
      if (!bytes || !bytes.byteLength) throw new Error('state is empty');
      var blob = new Blob([bytes], { type: 'application/octet-stream' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = String(key);
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      slotsSetStatus('Exported "' + key + '" — share the file; a friend can import it with their own copy of the same game.');
    }).catch(function (e) {
      slotsSetStatus('Export failed (' + (e && e.message ? e.message : e) + ').');
    });
  }
  function importStateFile(file) {
    if (!file) return;
    var ctx = gameCtx();
    if (!ctx || !stripInvalid(ctx.gameName)) { slotsSetStatus('Boot a game first, then import.'); return; }
    var key = engineSlotKey(stripInvalid(ctx.gameName));
    slotsSetStatus('Importing "' + file.name + '" as "' + key + '"…');
    file.arrayBuffer().then(function (buf) {
      if (!buf || !buf.byteLength) throw new Error('file is empty');
      return idbPut(key, new Uint8Array(buf));
    }).then(function () {
      slotsSetStatus('Imported as "' + key + '". Use the engine\'s Load State to resume from it.');
      renderSlots();
    }).catch(function (e) {
      slotsSetStatus('Import failed (' + (e && e.message ? e.message : e) + ').');
    });
  }

  /* ---------- Controls: per-system remap (Player 2.1) ----------
     One map per system in localStorage "bm-remap-<core>" ({player0:{...}}).
     At boot the map is written into the engine's own settings payload
     (controlSettings['0']), so it applies on next boot. The first boot with
     a system map migrates any legacy per-game custom mappings (Player 2.0).
     The remapper is fully keyboard-operable: capture buttons are native
     <button>s, Esc cancels both key and pad capture. */
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
  function remapKey(core) { return core ? 'bm-remap-' + core : null; }
  var remapOverride = null; /* explicit choice in the remap panel's system dropdown */
  /* the system the remap panel edits: dropdown choice, else current game, else last game, else gba */
  function remapCore() {
    if (remapOverride) return remapOverride;
    if (curCore) return curCore;
    var lg = readLastGame();
    return (lg && lg.core) || 'gba';
  }
  function readSystemRemap(core) {
    var k = remapKey(core);
    if (!k) return null;
    try {
      var p = JSON.parse(localStorage.getItem(k) || 'null');
      if (p && typeof p === 'object' && p.player0 && typeof p.player0 === 'object') return p;
    } catch (e) {}
    return null;
  }
  /* engine defaults merged with the stored per-system map */
  function systemPlayerMap(core) {
    var map = {};
    Object.keys(DEFAULT_CONTROLS).forEach(function (id) {
      map[id] = { value: DEFAULT_CONTROLS[id].value, value2: DEFAULT_CONTROLS[id].value2 };
    });
    var stored = readSystemRemap(core);
    if (stored) {
      Object.keys(stored.player0).forEach(function (id) {
        var e = stored.player0[id];
        if (!e || typeof e !== 'object') return;
        if (!map[id] || typeof map[id] !== 'object') map[id] = {};
        if (e.value !== undefined) map[id].value = e.value;
        if (e.value2 !== undefined) map[id].value2 = e.value2;
      });
    }
    return map;
  }
  function saveSystemControl(core, id, field, val) {
    var k = remapKey(core);
    if (!k) return false;
    var map = systemPlayerMap(core);
    if (!map[id] || typeof map[id] !== 'object') map[id] = {};
    map[id][field] = val;
    try { localStorage.setItem(k, JSON.stringify({ player0: map })); return true; }
    catch (e) { return false; }
  }
  /* one-time migration: legacy per-game custom mappings -> per-system map */
  function migrateLegacyRemap(core, payload) {
    if (readSystemRemap(core)) return false;
    var diffs = {}, n = 0;
    var old = payload && payload.controlSettings && payload.controlSettings['0'];
    if (old && typeof old === 'object') {
      Object.keys(old).forEach(function (id) {
        var e = old[id], d = DEFAULT_CONTROLS[id], c = {};
        if (!e || typeof e !== 'object') return;
        if (d) {
          if (e.value !== d.value) c.value = e.value;
          if (e.value2 !== d.value2) c.value2 = e.value2;
        } else {
          if (e.value !== undefined) c.value = e.value;
          if (e.value2 !== undefined) c.value2 = e.value2;
        }
        if (c.value !== undefined || c.value2 !== undefined) { diffs[id] = c; n++; }
      });
    }
    if (n) {
      try { localStorage.setItem(remapKey(core), JSON.stringify({ player0: diffs })); return true; }
      catch (e) {}
    }
    return false;
  }
  /* called from boot(): the per-system map becomes the engine payload's
     player-0 table (other payload fields are preserved) */
  function applySystemRemapToEngine(core) {
    var key = controlsKey();
    if (!key) return;
    var payload = readControlsPayload() || { controlSettings: {}, settings: {}, cheats: [] };
    var migrated = migrateLegacyRemap(core, payload);
    if (!payload.controlSettings || typeof payload.controlSettings !== 'object') payload.controlSettings = {};
    payload.controlSettings['0'] = systemPlayerMap(core);
    try { localStorage.setItem(key, JSON.stringify(payload)); } catch (e) {}
    if (migrated) remapSetStatus('Your older per-game mappings were moved into the per-system map for ' + (SYSTEM_LABELS[core] || core) + '.');
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
  function schemeLabelsFor(core) {
    var list = BUTTON_LABELS[core] || BUTTON_LABELS_DEFAULT;
    return list.concat(HOTKEY_LABELS);
  }
  function remapSetStatus(msg) {
    var el = $('controls-status');
    if (el) el.textContent = msg;
  }
  function renderRemap() {
    var tbody = $('controls-tbody');
    var sel = $('remap-system');
    var core = remapCore();
    if (sel && !sel.options.length) {
      Object.keys(SYSTEM_LABELS).forEach(function (c) {
        var o = document.createElement('option');
        o.value = c; o.textContent = SYSTEM_LABELS[c];
        sel.appendChild(o);
      });
    }
    if (sel) sel.value = core;
    var map = systemPlayerMap(core);
    var stored = readSystemRemap(core);
    remapSetStatus('Player 1 · ' + (SYSTEM_LABELS[core] || core) + ' · ' +
      (stored ? 'custom per-system map stored on this device' : 'engine defaults — no custom map stored yet') +
      '. Saved maps apply the next time a ' + (SYSTEM_LABELS[core] || core) +
      ' game boots, and override Player 1 changes made in the engine\'s own menu.');
    if (!tbody) return;
    tbody.innerHTML = '';
    var seen = {};
    schemeLabelsFor(core).forEach(function (pair) {
      var id = pair[0];
      if (seen[id]) return;
      seen[id] = 1;
      var entry = map[id];
      if (!entry || typeof entry !== 'object') entry = {};
      var tr = document.createElement('tr');
      var td0 = document.createElement('td'); td0.textContent = pair[1];
      var td1 = document.createElement('td');
      var k = document.createElement('kbd'); k.className = 'key'; k.textContent = keyName(entry.value);
      td1.appendChild(k);
      var td2 = document.createElement('td'); td2.textContent = padName(entry.value2);
      var td3 = document.createElement('td');
      (function (btnId, btnLabel) {
        var bk = document.createElement('button');
        bk.type = 'button'; bk.className = 'btn btn-ghost btn-sm'; bk.textContent = 'Remap key';
        bk.setAttribute('aria-label', 'Remap keyboard key for ' + btnLabel + ' (' + (SYSTEM_LABELS[core] || core) + ')');
        bk.addEventListener('click', function () { startKeyCapture(core, btnId, bk); });
        var bp = document.createElement('button');
        bp.type = 'button'; bp.className = 'btn btn-ghost btn-sm'; bp.textContent = 'Remap pad';
        bp.setAttribute('aria-label', 'Remap gamepad button for ' + btnLabel + ' (' + (SYSTEM_LABELS[core] || core) + ')');
        bp.addEventListener('click', function () { startPadCapture(core, btnId, bp); });
        td3.appendChild(bk); td3.appendChild(bp);
      })(id, pair[1]);
      tr.appendChild(td0); tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
      tbody.appendChild(tr);
    });
  }
  function writeSystemControl(core, id, field, val) {
    if (saveSystemControl(core, id, field, val)) {
      remapSetStatus('Saved — applies the next time a ' + (SYSTEM_LABELS[core] || core) + ' game boots.');
    } else {
      remapSetStatus('Could not save the mapping.');
    }
    renderRemap();
  }
  var capturingKey = false;
  function startKeyCapture(core, id, btn) {
    if (capturingKey) return;
    capturingKey = true;
    var old = btn.textContent;
    btn.textContent = 'Press a key… (Esc cancels)';
    var h = function (e) {
      e.preventDefault(); e.stopPropagation();
      document.removeEventListener('keydown', h, true);
      capturingKey = false;
      btn.textContent = old;
      if (e.key === 'Escape') { remapSetStatus('Remap cancelled.'); return; }
      writeSystemControl(core, id, 'value', e.keyCode);
    };
    document.addEventListener('keydown', h, true);
  }
  var capturingPad = false, padCancel = null;
  function startPadCapture(core, id, btn) {
    if (capturingPad) {
      if (padCancel) padCancel();
      return;
    }
    if (!navigator.getGamepads) { remapSetStatus('This browser has no gamepad API.'); return; }
    capturingPad = true;
    var old = btn.textContent;
    btn.textContent = 'Press a pad button… (Esc or click cancels)';
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
    var escH = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(true); }
    };
    function finish(cancelled, btnIndex) {
      if (done) return;
      done = true;
      capturingPad = false; padCancel = null;
      try { cancelAnimationFrame(raf); } catch (e) {}
      document.removeEventListener('keydown', escH, true);
      btn.textContent = old;
      if (cancelled) { remapSetStatus('Gamepad remap cancelled.'); return; }
      writeSystemControl(core, id, 'value2', btnIndex);
    }
    padCancel = function () { finish(true); };
    document.addEventListener('keydown', escH, true);
    var tick = function () {
      if (done) return;
      if (Date.now() - t0 > 15000) { finish(true); return; }
      var gps = [];
      try { gps = navigator.getGamepads() || []; } catch (e) {}
      for (var i = 0; i < gps.length; i++) {
        var g = gps[i];
        if (!g) continue;
        for (var b = 0; b < g.buttons.length; b++) {
          if (g.buttons[b].pressed && !(prev[i] && prev[i][b])) {
            finish(false, b);
            return;
          }
        }
      }
      prev = snap();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function resetRemap() {
    var core = remapCore();
    var k = remapKey(core);
    if (k) { try { localStorage.removeItem(k); } catch (e) {} }
    renderRemap();
    remapSetStatus('Per-system map cleared for ' + (SYSTEM_LABELS[core] || core) + ' — engine defaults apply on next boot.');
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
      /* Wow wave 1: CRT power-off collapse before the veil returns. */
      powerOffThen(function () {
        teardown();
        showVeil();
        $('player-toolbar').hidden = true;
        $('sys-badge').hidden = true;
        setStatus('IDLE', false);
        sysSelect.value = 'auto';
        curCore = null; curGameName = null; curGameID = null;
        remapOverride = null;
        renderCheats(); renderRemap(); renderSlots(); scheduleAutosave();
      });
    });

    var fsBtn = $('fullscreen-btn');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreenBtn);
    /* "f" toggles fullscreen from the console shell (not inside text inputs) */
    var shellEl = $('console-shell');
    if (shellEl) shellEl.addEventListener('keydown', function (e) {
      if ((e.key === 'f' || e.key === 'F') && !/INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || '')) {
        e.preventDefault();
        toggleFullscreen();
      }
    });

    bindDrop(veil);
    setStatus('IDLE — DROP A FILE TO BEGIN', false);

    /* ---------- Player 2.1 wiring ---------- */
    ensureCrtOverlay();
    applyDisplayPrefs(displayCore());
    syncFullscreenBtn();
    window.addEventListener('resize', function () { applyIntScale(); });

    var toggleCrt = function () { setDisplayPatch({ crt: !readDisplay(displayCore()).crt }); };
    ['crt-btn', 'crt-toggle-2'].forEach(function (id) {
      var b = $(id);
      if (b) b.addEventListener('click', toggleCrt);
    });
    ['disp-crt', 'dlg-crt'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', function () { setDisplayPatch({ crt: el.checked }); });
    });
    ['disp-intscale', 'dlg-intscale'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', function () { setDisplayPatch({ intScale: el.checked }); });
    });
    ['disp-aspect', 'dlg-aspect'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', function () { setDisplayPatch({ aspect: el.value }); });
    });
    ['fs-btn-2', 'fs-btn-3'].forEach(function (id) {
      var b = $(id);
      if (b) b.addEventListener('click', toggleFullscreen);
    });

    /* quick-settings dialog */
    function openSettings() {
      var d = $('settings-dialog');
      if (!d) return;
      syncDisplayUI(displayCore());
      renderAutosave(gameCtx());
      if (typeof d.showModal === 'function') { try { d.showModal(); } catch (e) {} }
      else d.setAttribute('open', '');
    }
    ['settings-btn', 'settings-open-2'].forEach(function (id) {
      var b = $(id);
      if (b) b.addEventListener('click', openSettings);
    });
    var dlgRemap = $('dlg-remap-link');
    if (dlgRemap) dlgRemap.addEventListener('click', function () {
      var d = $('settings-dialog');
      if (d && typeof d.close === 'function') { try { d.close(); } catch (e) {} }
    });

    var slotNew = $('slot-new');
    if (slotNew) slotNew.addEventListener('click', newSlot);
    var slotsRefresh = $('slots-refresh');
    if (slotsRefresh) slotsRefresh.addEventListener('click', function () { renderSlots(); });
    var importInput = $('import-state-file');
    if (importInput) importInput.addEventListener('change', function () {
      importStateFile(importInput.files && importInput.files[0]);
      importInput.value = '';
    });
    ['autosave-toggle', 'dlg-autosave'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', function () { setAutosavePref({ enabled: el.checked }); });
    });
    ['autosave-mins', 'dlg-autosave-mins'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', function () { setAutosavePref({ minutes: parseInt(el.value, 10) || 5 }); });
    });

    var remapSel = $('remap-system');
    if (remapSel) remapSel.addEventListener('change', function () { remapOverride = remapSel.value; renderRemap(); });
    var remapReset = $('remap-reset');
    if (remapReset) remapReset.addEventListener('click', resetRemap);

    var cheatAdd = $('cheat-add');
    if (cheatAdd) cheatAdd.addEventListener('click', addCheat);
    ['cheat-name', 'cheat-code'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') addCheat(); });
    });

    /* initial (no-game) panel state — panels fall back to the last-booted game */
    renderCheats();
    renderRemap();
    renderSlots();
    scheduleAutosave();
  });

  /* small test handle for the headless checks (scripts/test_player21.js) */
  window.BM21 = {
    gameCtx: gameCtx,
    renderSlots: renderSlots,
    renderRemap: renderRemap,
    autosavePass: autosavePass,
    applyDisplayPrefs: applyDisplayPrefs,
    readDisplay: readDisplay,
    readSystemRemap: readSystemRemap
  };
})();
