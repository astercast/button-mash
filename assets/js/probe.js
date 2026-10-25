/* probe.js: "Will this device run it?" Reads capabilities only. Loads no game, sends nothing.
   Adapted from the design consult's 2026-10-24 probe draft to this site's plain-script
   shape, plus the one-line render into any #probe-line element on the page. The probe
   stays honest: a capability it cannot see is reported as not seen, never assumed. */
(function () {
  'use strict';

  async function probe() {
    var c = document.createElement('canvas'), gl2 = false;
    try { gl2 = !!c.getContext('webgl2'); } catch (e) { gl2 = false; }
    var wasm = typeof WebAssembly === 'object',
        threads = typeof SharedArrayBuffer === 'function' && self.crossOriginIsolated === true;
    var simd = false;
    try { simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (e) { simd = false; }
    var audio = typeof AudioWorkletNode === 'function',
        pads = (navigator.getGamepads ? Array.prototype.filter.call(navigator.getGamepads(), Boolean).length : 0);
    var quotaMB = null;
    try { var est = await navigator.storage.estimate(); quotaMB = Math.round((est.quota || 0) / 1048576); } catch (e) { quotaMB = null; }
    var touch = window.matchMedia('(pointer: coarse)').matches;
    function grade(need) {
      var caps = { gl2: gl2, wasm: wasm, threads: threads, simd: simd, audio: audio };
      return need.every(function (k) { return caps[k]; });
    }
    return { gl2: gl2, wasm: wasm, simd: simd, threads: threads, audio: audio, pads: pads, quotaMB: quotaMB, touch: touch,
      systems: { 'Cartridges (GB, GBA, NES, SNES, Genesis)': grade(['wasm', 'audio']), 'PlayStation and Saturn': grade(['wasm', 'gl2', 'audio']), 'Nintendo 64 and PSP': grade(['wasm', 'gl2', 'audio', 'threads']), 'DOS': grade(['wasm', 'audio']) } };
  }

  function line(r) {
    var parts = Object.keys(r.systems).map(function (k) {
      return k.split(' (')[0] + ': ' + (r.systems[k] ? 'yes' : 'not on this device');
    });
    var caps = 'WebGL2 ' + (r.gl2 ? 'yes' : 'no') + ' · WASM ' + (r.wasm ? 'yes' : 'no') +
      ' · threads ' + (r.threads ? 'yes' : 'no') + ' · audio worklets ' + (r.audio ? 'yes' : 'no') +
      ' · gamepads seen: ' + r.pads + (r.quotaMB != null ? ' · storage about ' + r.quotaMB + ' MB' : '');
    return { main: 'Will this device run it? ' + parts.join(' · '), caps: caps };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('probe-line');
    if (!el) return;
    probe().then(function (r) {
      var l = line(r);
      el.textContent = l.main;
      var sub = document.getElementById('probe-caps');
      if (sub) sub.textContent = l.caps;
    }).catch(function () {
      el.textContent = 'Will this device run it? This browser would not answer the probe.';
    });
  });

  window.PortPlayProbe = { probe: probe, line: line };
})();
