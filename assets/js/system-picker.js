/* Button Mash system picker quiz.
   Four questions -> an honest system recommendation.
   Weak devices exclude N64/PS1 rather than pretending they can run them. */
(function () {
  'use strict';

  var SYSTEMS = {
    gb:      { name: 'Game Boy / Color', core: 'gb',     guide: 'guides/gameboy.html',  blurb: 'Cycle-accurate Gambatte core, zero BIOS, runs on literally anything. The pocket library is enormous and charming.' },
    gba:     { name: 'Game Boy Advance', core: 'gba',    guide: 'guides/gba.html',       blurb: 'The mGBA accuracy king with zero BIOS and full speed on any device. The easiest first emulation project on this site.' },
    snes:    { name: 'Super Nintendo',  core: 'snes',   guide: 'guides/snes.html',      blurb: 'Snes9x, zero BIOS, the 16-bit sweet spot. The library that invented half of modern game design.' },
    genesis: { name: 'Genesis / Mega Drive', core: 'segaMD', guide: 'guides/genesis.html', blurb: 'Genesis Plus GX, zero BIOS, the lightest console core here. Fast, punchy 16-bit action.' },
    n64:     { name: 'Nintendo 64',     core: 'n64',    guide: 'guides/n64.html',       blurb: 'Mupen64Plus-Next — magical when it works, but this is the quirkiest system on the page and it needs real hardware power.', warn: 'N64 emulation has per-game graphical quirks and needs a recent machine. Keep expectations flexible.' },
    psx:     { name: 'PlayStation',     core: 'psx',    guide: 'guides/ps1.html',       blurb: 'PCSX-ReARMed — lighter than its reputation, with the disc era\'s best RPGs and platformers.', warn: 'Boots via HLE with no BIOS, but a user-dumped BIOS gives the best accuracy. Never download one.' }
  };

  /* answer value -> per-system score deltas */
  var WEIGHTS = {
    era: {
      handheld89: { gb: 2 },
      sixteenbit: { snes: 2, genesis: 2 },
      gbaage:     { gba: 2, gb: 1 },
      early3d:    { n64: 2, psx: 2 }
    },
    device: {
      weak:   { ineligible: ['n64', 'psx'] },
      mid:    {},
      strong: {}
    },
    taste: {
      quick:      { gb: 2, gba: 2 },
      couch:      { snes: 2, genesis: 2 },
      adventure3d:{ n64: 2 },
      storyrpg:   { psx: 2, snes: 1 }
    },
    tinker: {
      zero: { gb: 1, gba: 1, snes: 1 },
      some: { genesis: 1, psx: 1 },
      lots: { n64: 1, psx: 1 }
    }
  };

  var ORDER = ['gba', 'snes', 'gb', 'genesis', 'psx', 'n64']; /* tie-break order */

  function answered(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function pick() {
    var scores = { gb: 0, gba: 0, snes: 0, genesis: 0, n64: 0, psx: 0 };
    var ineligible = {};
    var qs = ['era', 'device', 'taste', 'tinker'];
    for (var i = 0; i < qs.length; i++) {
      var v = answered(qs[i]);
      if (!v) return null;
      var w = WEIGHTS[qs[i]][v] || {};
      Object.keys(w).forEach(function (k) {
        if (k === 'ineligible') w[k].forEach(function (s) { ineligible[s] = true; });
        else scores[k] += w[k];
      });
    }
    var best = null;
    ORDER.forEach(function (s) {
      if (ineligible[s]) return;
      if (best === null || scores[s] > scores[best]) best = s;
    });
    /* runner-up: highest score among the rest (eligible only) */
    var runner = null;
    ORDER.forEach(function (s) {
      if (s === best || ineligible[s]) return;
      if (runner === null || scores[s] > scores[runner]) runner = s;
    });
    return { winner: best, runner: runner, weak: !!answered('device') && answered('device') === 'weak' };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('pq-form');
    var result = document.getElementById('pq-result');
    var resetBtn = document.getElementById('pq-reset');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = pick();
      if (!r) {
        result.hidden = false;
        document.getElementById('pq-title').textContent = 'Answer all four questions first';
        document.getElementById('pq-why').textContent = 'Every question feeds the recommendation — fill in the missing one and try again.';
        document.getElementById('pq-warn').hidden = true;
        document.getElementById('pq-runner').textContent = '';
        document.getElementById('pq-guide').href = '#';
        document.getElementById('pq-player').href = '#';
        return;
      }
      var s = SYSTEMS[r.winner];
      document.getElementById('pq-title').textContent = 'Your system: ' + s.name;
      document.getElementById('pq-why').textContent = s.blurb;
      var warn = document.getElementById('pq-warn');
      if (s.warn) { warn.textContent = s.warn; warn.hidden = false; }
      else warn.hidden = true;
      document.getElementById('pq-guide').href = s.guide;
      document.getElementById('pq-player').href = 'player.html?core=' + s.core;
      var runnerTxt = '';
      if (r.runner) runnerTxt = 'Runner-up: ' + SYSTEMS[r.runner].name + ' — also worth your time.';
      if (r.weak) runnerTxt += (runnerTxt ? ' ' : '') + 'N64 and PlayStation were excluded because your device can\'t run them well — that\'s the honest answer.';
      document.getElementById('pq-runner').textContent = runnerTxt;
      result.hidden = false;
      resetBtn.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function () {
      form.reset();
      result.hidden = true;
      resetBtn.hidden = true;
    });
  });
})();
