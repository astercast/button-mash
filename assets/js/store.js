/* Button Mash shared utilities: favorites, game-of-the-day, helpers. */
(function () {
  'use strict';

  var FAV_KEY = 'bm_favs_v1';
  var CHECK_KEY = 'bm_checks_v1';

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* Favorites */
  function getFavs() { return loadJSON(FAV_KEY, []); }
  function isFav(id) { return getFavs().indexOf(id) !== -1; }
  function toggleFav(id) {
    var favs = getFavs();
    var i = favs.indexOf(id);
    if (i === -1) favs.push(id); else favs.splice(i, 1);
    saveJSON(FAV_KEY, favs);
    document.dispatchEvent(new CustomEvent('bm:favs-changed'));
    return i === -1;
  }
  /* Union-merge a list of ids into favorites (used by trophy import).
     Only string ids are accepted; returns the ids actually added. */
  function setFavs(ids) {
    var favs = getFavs();
    var added = [];
    (ids || []).forEach(function (id) {
      if (typeof id === 'string' && id && favs.indexOf(id) === -1) {
        favs.push(id);
        added.push(id);
      }
    });
    saveJSON(FAV_KEY, favs);
    if (added.length) document.dispatchEvent(new CustomEvent('bm:favs-changed'));
    return added;
  }

  /* Checklist persistence (guide steps) */
  function getChecks(page) { return loadJSON(CHECK_KEY, {})[page] || []; }
  function toggleCheck(page, idx) {
    var all = loadJSON(CHECK_KEY, {});
    var list = all[page] || [];
    var i = list.indexOf(idx);
    if (i === -1) list.push(idx); else list.splice(i, 1);
    all[page] = list;
    saveJSON(CHECK_KEY, all);
    return i === -1;
  }

  /* Game of the day: deterministic by calendar date */
  function gameOfDay(games) {
    if (!games || !games.length) return null;
    var now = new Date();
    var dayIndex = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
    return games[dayIndex % games.length];
  }
  function randomGame(games) {
    if (!games || !games.length) return null;
    return games[Math.floor(Math.random() * games.length)];
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function gameCard(game) {
    var card = el('article', 'game-card');
    var fav = el('button', 'fav-btn');
    fav.type = 'button';
    fav.setAttribute('aria-pressed', isFav(game.id) ? 'true' : 'false');
    fav.setAttribute('aria-label', (isFav(game.id) ? 'Remove from favorites: ' : 'Add to favorites: ') + game.title);
    fav.textContent = isFav(game.id) ? '♥' : '♡';
    fav.addEventListener('click', function (ev) {
      ev.preventDefault();
      var on = toggleFav(game.id); // dispatches bm:favs-changed
      fav.setAttribute('aria-pressed', on ? 'true' : 'false');
      fav.textContent = on ? '♥' : '♡';
      fav.setAttribute('aria-label', (on ? 'Remove from favorites: ' : 'Add to favorites: ') + game.title);
    });
    card.appendChild(fav);

    var h = el('h3');
    // House rule (user order, 2026-10-14): a card's title opens the
    // game's own file on this site, never an outbound play link.
    var a = el('a', null, game.title);
    a.href = 'game.html?id=' + encodeURIComponent(game.id);
    h.appendChild(a);
    card.appendChild(h);

    card.appendChild(el('p', 'game-desc', game.description));

    var meta = el('div', 'game-meta');
    var tag = el('span', 'genre-tag genre-' + game.genre, game.genre);
    meta.appendChild(tag);
    if (game.controls) meta.appendChild(el('span', 'controls-hint', game.controls));
    // The shelved edition, numbered in the AP formula's manner
    // (rotation 22): the same BM_0N the game page's ladder and the
    // credits lists print, so a version reads the same everywhere.
    if (game.editions && game.editions.length) {
      for (var i = 0; i < game.editions.length; i++) {
        if (game.editions[i].shelved) {
          var code = 'BM_' + (i + 1 < 10 ? '0' : '') + (i + 1);
          meta.appendChild(el('span', 'edition-tag', code + ' · ' + game.editions[i].name));
          break;
        }
      }
    }
    card.appendChild(meta);
    return card;
  }

  async function loadGames() {
    var res = await fetch('data/games.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load games.json (' + res.status + ')');
    var data = await res.json();
    return data.games || [];
  }

  window.BM = {
    loadGames: loadGames,
    gameCard: gameCard,
    el: el,
    getFavs: getFavs,
    isFav: isFav,
    toggleFav: toggleFav,
    setFavs: setFavs,
    getChecks: getChecks,
    toggleCheck: toggleCheck,
    gameOfDay: gameOfDay,
    randomGame: randomGame
  };
})();
