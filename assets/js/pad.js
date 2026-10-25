/* pad.js: the pad view (bundle, 2026-10-24). A drawn controller whose
   buttons light as the real pad is pressed, polled with the standard
   Gamepad API. Reads the pad only; sends nothing, stores nothing.
   Standard-mapping indices: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT,
   8 Back, 9 Start, 12-15 D-pad. Axes move the left-stick dot. */
(function () {
  'use strict';

  var BTNS = [
    { i: 12, label: '▲', x: 52, y: 44 }, { i: 13, label: '▼', x: 52, y: 76 },
    { i: 14, label: '◀', x: 36, y: 60 }, { i: 15, label: '▶', x: 68, y: 60 },
    { i: 3, label: 'Y', x: 196, y: 40 }, { i: 2, label: 'X', x: 176, y: 60 },
    { i: 1, label: 'B', x: 216, y: 60 }, { i: 0, label: 'A', x: 196, y: 80 },
    { i: 4, label: 'LB', x: 60, y: 12 }, { i: 5, label: 'RB', x: 204, y: 12 },
    { i: 8, label: '‹', x: 112, y: 62 }, { i: 9, label: '›', x: 152, y: 62 }
  ];

  function build(host) {
    var svg = '<svg viewBox="0 0 264 120" width="264" height="120" role="img" aria-label="Drawn gamepad; its buttons light when the connected pad is pressed">' +
      '<rect x="8" y="18" width="248" height="88" rx="40" fill="none" stroke="currentColor" stroke-width="2.4"/>';
    BTNS.forEach(function (b) {
      svg += '<g class="pad-btn" data-pad-btn="' + b.i + '"><circle cx="' + b.x + '" cy="' + b.y + '" r="11" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<text x="' + b.x + '" y="' + (b.y + 4) + '" text-anchor="middle" font-size="10" fill="currentColor">' + b.label + '</text></g>';
    });
    svg += '<g class="pad-stick"><circle cx="104" cy="86" r="12" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle class="pad-stick-dot" cx="104" cy="86" r="4" fill="currentColor"/></g></svg>';
    host.innerHTML = svg;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.getElementById('pad-view');
    var status = document.getElementById('pad-status');
    if (!host) return;
    build(host);
    var dots = host.querySelector('.pad-stick-dot');
    function frame() {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var pad = null;
      for (var i = 0; i < pads.length; i++) if (pads[i]) { pad = pads[i]; break; }
      if (status) status.textContent = pad
        ? 'Connected: ' + pad.id.slice(0, 60) + (pad.mapping === 'standard' ? ' (standard mapping)' : '')
        : 'No gamepad seen yet. Connect one and press any button to wake it.';
      if (pad) {
        BTNS.forEach(function (b) {
          var g = host.querySelector('[data-pad-btn="' + b.i + '"]');
          var btn = pad.buttons[b.i];
          if (g) g.classList.toggle('lit', !!(btn && btn.pressed));
        });
        if (dots && pad.axes.length >= 2) {
          dots.setAttribute('cx', 104 + Math.round(pad.axes[0] * 7));
          dots.setAttribute('cy', 86 + Math.round(pad.axes[1] * 7));
        }
      }
      requestAnimationFrame(frame);
    }
    if (navigator.getGamepads) requestAnimationFrame(frame);
    else if (status) status.textContent = 'This browser has no gamepad API.';
  });
})();
