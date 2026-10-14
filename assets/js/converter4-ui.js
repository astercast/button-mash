/* Button Mash Converter 4.0, shared DOM helpers: the decline card
   (a graceful, specific "no" is a designed output of the converter,
   dossier section 3.3) and the DOS-corner handoff (files staged in
   IndexedDB so a drop on one page can boot on another without an
   upload ever happening). */
(function () {
  'use strict';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* det: a decline detection from Converter4Core.detect(). */
  function declineCard(det, fileName) {
    var card = el('article', 'decline-card');
    card.setAttribute('role', 'note');
    card.appendChild(el('p', 'decline-kicker',
      det.tone === 'not-yet' ? 'Converter 4.0 · an honest not-yet' : 'Converter 4.0 · an honest no'));
    if (fileName) card.appendChild(el('p', 'decline-file', fileName));
    card.appendChild(el('h3', 'decline-head', det.headline));
    card.appendChild(el('p', 'decline-body', det.body));
    if (det.steps && det.steps.length) {
      var ol = el('ol', 'decline-steps');
      det.steps.forEach(function (s) { ol.appendChild(el('li', null, s)); });
      card.appendChild(ol);
    }
    var row = el('p', 'decline-links');
    var g = el('a', 'btn btn-primary btn-sm', det.guideLabel || 'Read the guide');
    g.href = det.guide || 'guides/reverse-engineering.html';
    row.appendChild(g);
    var hub = el('a', 'btn btn-ghost btn-sm', 'Guide hub');
    hub.href = 'guides/reverse-engineering.html';
    row.appendChild(hub);
    var dump = el('a', 'btn btn-ghost btn-sm', 'Dump your own games');
    dump.href = 'guides/re-dump-your-games.html';
    row.appendChild(dump);
    card.appendChild(row);
    if (det.via) card.appendChild(el('p', 'decline-via', 'How we know: ' + det.via + '. Your file was read on this device only and never uploaded.'));
    return card;
  }

  function showDecline(host, det, fileName) {
    if (!host) return null;
    host.innerHTML = '';
    var card = declineCard(det, fileName);
    host.appendChild(card);
    host.hidden = false;
    return card;
  }

  /* Stage a set of Files for the DOS corner, then navigate there.
     The blobs ride IndexedDB (BMLibrary staging), not the network. */
  function stageDosAndGo(files, execName) {
    if (!window.BMLibrary) { window.location.href = 'dos.html'; return; }
    var recs = files.map(function (f) {
      return { name: f.webkitRelativePath || f.name, blob: f };
    });
    window.BMLibrary.stageHandoff('dos-handoff', { files: recs, execName: execName || null, at: Date.now() })
      .then(function () { window.location.href = 'dos.html'; })
      .catch(function () { window.location.href = 'dos.html'; });
  }

  window.BMConv4 = { declineCard: declineCard, showDecline: showDecline, stageDosAndGo: stageDosAndGo, el: el };
})();
