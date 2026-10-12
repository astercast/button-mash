/* Button Mash — Kids corner: age-band filters over the kid-safe catalog. */
(function () {
  'use strict';

  var BANDS = [
    { id: 'all', label: 'All ages', desc: 'every kid-safe game' },
    { id: '5-7', label: 'Ages 5–7', desc: 'one-button toys and sandboxes' },
    { id: '8-10', label: 'Ages 8–10', desc: 'puzzles and gentle games' },
    { id: '11-12', label: 'Ages 11–12', desc: 'harder puzzles and slow strategy' }
  ];

  async function initKids() {
    var grid = document.getElementById('kids-grid');
    if (!grid) return;
    var games;
    try {
      var res = await fetch('api/v1/kid-safe.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('status ' + res.status);
      games = (await res.json())['kid-safe'] || [];
    } catch (e) {
      grid.innerHTML = '<div class="empty-state"><p>Could not load the kids catalog. Check your connection and try again.</p></div>';
      return;
    }

    var chipWrap = document.getElementById('age-chips');
    var countEl = document.getElementById('kids-count');
    var state = { band: 'all' };

    function bandLabel(b) {
      return b === '5-7' ? 'Ages 5–7' : b === '8-10' ? 'Ages 8–10' : 'Ages 11–12';
    }

    function card(g) {
      var el = BM.el('article', 'kid-card');
      var top = BM.el('div', 'kid-card-top');
      top.appendChild(BM.el('span', 'kid-band', bandLabel(g.age_band)));
      top.appendChild(BM.el('span', 'nochat-badge', '🔇 No chat'));
      if (g.verify_live) top.appendChild(BM.el('span', 'verify-flag', '👀 Play together first'));
      el.appendChild(top);
      el.appendChild(BM.el('h3', null, g.title));
      el.appendChild(BM.el('p', 'kid-desc', g.description));

      var note = BM.el('details', 'kid-note');
      var sum = BM.el('summary', null, '👪 For parents: why it is fine');
      note.appendChild(sum);
      note.appendChild(BM.el('p', null, g.parent_note));
      el.appendChild(note);

      var play = BM.el('a', 'kid-play', '▶ Play ' + g.title);
      play.href = g.url;
      play.target = '_blank';
      play.rel = 'noopener noreferrer';
      play.setAttribute('aria-label', 'Play ' + g.title + ' in a new tab');
      el.appendChild(play);
      return el;
    }

    function render() {
      var list = games.filter(function (g) {
        return state.band === 'all' || g.age_band === state.band;
      });
      grid.innerHTML = '';
      if (!list.length) {
        grid.innerHTML = '<div class="empty-state"><p>No games in this age band yet.</p></div>';
      } else {
        list.forEach(function (g) { grid.appendChild(card(g)); });
      }
      if (countEl) countEl.textContent = list.length + ' kid-safe game' + (list.length === 1 ? '' : 's');
    }

    BANDS.forEach(function (b) {
      var chip = BM.el('button', 'chip chip-age' + (b.id === 'all' ? ' is-on' : ''), b.label);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', b.id === 'all' ? 'true' : 'false');
      chip.title = b.desc;
      chip.addEventListener('click', function () {
        state.band = b.id;
        chipWrap.querySelectorAll('.chip').forEach(function (c) {
          c.classList.toggle('is-on', c === chip);
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        render();
      });
      chipWrap.appendChild(chip);
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKids);
  } else {
    initKids();
  }
})();
