/* slip.js: after a file is read, show what was found, like the label on the media itself.
   Everything is computed from the bytes on the device. Nothing is uploaded, nothing is
   looked up, and the game is never named — the slip carries the file's own name only.
   Adapted from the design consult's 2026-10-24 slip draft to this site's plain-script
   shape: the CRC32 is the REAL checksum of the dropped bytes, streamed in chunks
   (Converter4Core.crc32Stream when present, the same table algorithm here otherwise),
   and a "No" links to the exact Guide section the router itself points at. */
(function () {
  'use strict';

  var T = null;
  function table() {
    if (T) return T;
    T = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      T[n] = c >>> 0;
    }
    return T;
  }
  function crc32(u8) {
    var t = table(), c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = t[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
  }
  /* Stream a Blob's CRC32 without holding it whole in memory. */
  async function crc32Blob(blob) {
    if (window.Converter4Core && window.Converter4Core.crc32Stream) {
      return (await window.Converter4Core.crc32Stream(blob)).toString(16).padStart(8, '0');
    }
    var t = table(), c = 0xFFFFFFFF, CH = 4 * 1024 * 1024;
    for (var off = 0; off < blob.size; off += CH) {
      var u8 = new Uint8Array(await blob.slice(off, off + CH).arrayBuffer());
      for (var i = 0; i < u8.length; i++) c = t[(c ^ u8[i]) & 255] ^ (c >>> 8);
    }
    return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
  }

  var SHAPES = {  /* one drawn silhouette per kind of media; plain shapes, no logos */
    cart: '<path d="M14 6h52v50l-6 6H20l-6-6z M24 14h32v22H24z M30 62v8h20v-8" fill="none" stroke="currentColor" stroke-width="2.4"/>',
    disc: '<circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="40" cy="40" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/>',
    floppy: '<path d="M10 10h50l10 10v50H10z M22 10v18h30V10 M22 70V46h36v24" fill="none" stroke="currentColor" stroke-width="2.4"/>'
  };
  var KIND = { disc: /playstation|saturn|sega cd|disc|iso|cue|chd/i, floppy: /dos|zip|jsdos/i };
  function esc(s) { return String(s).replace(/[<>&"]/g, ''); }

  /* opts: { system, size (bytes), crc (hex string), name, plays, guideHref, note } */
  function slip(el, o) {
    if (!el) return;
    var kind = KIND.disc.test(o.system) ? 'disc' : KIND.floppy.test(o.system) ? 'floppy' : 'cart';
    var mb = o.size / 1048576, size = mb >= 1 ? mb.toFixed(1) + ' MB' : Math.max(1, Math.round(o.size / 1024)) + ' KB';
    function row(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
    var plays = o.plays ? 'Yes'
      : '<a href="' + esc(o.guideHref || 'guide.html') + '">No, see the Guide</a>';
    el.innerHTML = '<svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true">' + SHAPES[kind] + '</svg><dl>' +
      row('Found', esc(o.system)) + row('Size', size) + row('Checksum', esc(o.crc || '…')) +
      row('File', esc(o.name)) + row('Plays here', plays) + (o.note ? row('Note', esc(o.note)) : '') + '</dl>';
    el.hidden = false;
  }

  /* Compute the slip for a dropped File/Blob, then draw it. The checksum
     row updates in place when the streamed CRC lands. */
  async function slipForFile(el, file, o) {
    if (!el || !file) return;
    o = o || {};
    slip(el, { system: o.system || 'Game file', size: file.size, crc: 'reading…',
               name: file.name || 'dropped file', plays: !!o.plays,
               guideHref: o.guideHref, note: o.note });
    try {
      var crc = await crc32Blob(file);
      slip(el, { system: o.system || 'Game file', size: file.size, crc: crc,
                 name: file.name || 'dropped file', plays: !!o.plays,
                 guideHref: o.guideHref, note: o.note });
    } catch (e) { /* the slip stands without a checksum rather than failing the drop */ }
  }

  window.PortPlaySlip = { crc32: crc32, crc32Blob: crc32Blob, slip: slip, slipForFile: slipForFile };
})();
