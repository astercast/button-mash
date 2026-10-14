/* Button Mash: Play Journal UI (T-MASH-2, wave 40).
 *
 * Renders the journal page from two sources only: the real catalog
 * (data/v1/games.json, every one of the 213 games is addressable in
 * the picker and the all-games list) and the visitor's own journal
 * store (assets/js/journal-core.js, localStorage "bm.journal.v1").
 * No server, no account, no telemetry: the page writes nothing
 * anywhere except the visitor's own browser storage, and only when
 * the visitor picks a status or writes a log entry.
 */
(function () {
  'use strict';
  var J = window.BM && window.BM.Journal;
  if (!J) return;
  var store = J.createStore();
  var games = [];
  var byId = {};
  var currentId = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function todayLocal() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  var picker, statusSel, dateInput, textInput, logsList, entryNote;

  function renderShelves() {
    J.STATUSES.forEach(function (status) {
      var host = document.getElementById('shelf-' + status);
      var count = document.getElementById('shelf-' + status + '-count');
      if (!host) return;
      host.textContent = '';
      var ids = store.byStatus(status).filter(function (id) { return byId[id]; })
        .sort(function (a, b) { return byId[a].title.localeCompare(byId[b].title); });
      if (count) count.textContent = ids.length + (ids.length === 1 ? ' game' : ' games');
      if (!ids.length) {
        host.appendChild(el('p', 'journal-empty', 'Nothing on this shelf yet.'));
        return;
      }
      ids.forEach(function (id) {
        var g = byId[id];
        var card = el('article', 'feature-card');
        var h = el('h3');
        var a = el('a', null, g.title);
        a.href = g.url; a.target = '_blank'; a.rel = 'noopener';
        h.appendChild(a);
        card.appendChild(h);
        var logs = store.getLogs(id);
        card.appendChild(el('p', null, g.genre + ' · ' + logs.length + (logs.length === 1 ? ' log entry' : ' log entries')));
        var edit = el('button', 'card-link journal-open', 'Open in the journal editor ›');
        edit.type = 'button';
        edit.addEventListener('click', function () { openGame(id, true); });
        card.appendChild(edit);
        host.appendChild(card);
      });
    });
    var c = store.counts();
    var sum = document.getElementById('journal-summary');
    if (sum) sum.textContent = c.want + ' want to play · ' + c.playing + ' playing · ' +
      c.finished + ' finished · ' + c.logs + ' log ' + (c.logs === 1 ? 'entry' : 'entries') +
      ' across ' + c.logged + ' ' + (c.logged === 1 ? 'game' : 'games');
  }

  function renderAll() {
    var host = document.getElementById('journal-all');
    if (!host) return;
    host.textContent = '';
    games.forEach(function (g) {
      var item = el('button', 'journal-all-item', g.title);
      item.type = 'button';
      item.setAttribute('data-journal-game', g.id);
      var st = store.getStatus(g.id);
      if (st) item.appendChild(el('span', 'genre-tag', J.STATUS_LABELS[st]));
      item.addEventListener('click', function () { openGame(g.id, true); });
      host.appendChild(item);
    });
  }

  function renderEditor() {
    if (!currentId || !byId[currentId]) {
      if (entryNote) entryNote.textContent = 'Pick a game to shelve it and write log entries.';
      if (logsList) logsList.textContent = '';
      return;
    }
    var g = byId[currentId];
    if (picker) picker.value = currentId;
    if (statusSel) statusSel.value = store.getStatus(currentId) || '';
    if (entryNote) entryNote.textContent = g.title + ', ' + g.genre + '. ' + g.description;
    if (logsList) {
      logsList.textContent = '';
      var logs = store.getLogs(currentId);
      if (!logs.length) logsList.appendChild(el('li', 'journal-empty', 'No log entries yet, a playthrough can hold as many as you write.'));
      logs.forEach(function (log, i) {
        var li = el('li', 'journal-log');
        li.appendChild(el('strong', null, log.date));
        li.appendChild(el('span', null, ', ' + log.text));
        var del = el('button', 'journal-log-remove', 'Remove');
        del.type = 'button';
        del.setAttribute('data-log-index', String(i));
        del.addEventListener('click', function () {
          store.removeLog(currentId, i);
          renderAll(); renderShelves(); renderEditor();
        });
        li.appendChild(del);
        logsList.appendChild(li);
      });
    }
  }

  /* URL state (rotation 21): the open game rides in ?game=<id>, the
   * same deep link the game files and dive cards already use, so a
   * journal view is linkable and the back button walks selections.
   * User picks push a history entry; load and popstate never push. */
  function syncUrl(id) {
    try {
      var p = new URLSearchParams(location.search);
      if (p.get('game') === id) return;
      p.set('game', id);
      history.pushState({ bmJournalGame: id }, '', location.pathname + '?' + p.toString() + location.hash);
    } catch (e) { /* history unavailable (e.g. file://), the journal still works */ }
  }

  function openGame(id, focus, skipUrl) {
    if (!byId[id]) return;
    currentId = id;
    if (!skipUrl) syncUrl(id);
    renderEditor();
    if (focus) {
      var ed = document.getElementById('journal-editor');
      if (ed) ed.scrollIntoView({ block: 'start' });
      if (textInput) textInput.focus({ preventScroll: true });
    }
  }

  function boot() {
    picker = document.getElementById('journal-game');
    statusSel = document.getElementById('journal-status');
    dateInput = document.getElementById('journal-date');
    textInput = document.getElementById('journal-text');
    logsList = document.getElementById('journal-logs');
    entryNote = document.getElementById('journal-entry-note');
    if (dateInput) dateInput.value = todayLocal();

    fetch('data/v1/games.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (doc) {
        games = (doc.games || []).slice();
        games.forEach(function (g) { byId[g.id] = g; });
        if (picker) {
          picker.textContent = '';
          games.forEach(function (g) {
            var o = el('option', null, g.title + ' (' + g.genre + ')');
            o.value = g.id;
            picker.appendChild(o);
          });
          picker.addEventListener('change', function () { openGame(picker.value, false); });
        }
        var count = document.getElementById('journal-all-count');
        if (count) count.textContent = 'All ' + games.length + ' catalog games';
        renderAll(); renderShelves();
        var want = new URLSearchParams(location.search).get('game');
        if (want && byId[want]) openGame(want, false, true);
        else if (games.length) openGame(games[0].id, false, true);
        window.addEventListener('popstate', function () {
          var back = new URLSearchParams(location.search).get('game');
          if (back && byId[back]) openGame(back, false, true);
          else if (games.length) openGame(games[0].id, false, true);
        });
      })
      .catch(function () {
        if (entryNote) entryNote.textContent = 'The catalog could not be loaded, so the journal cannot address any games right now.';
      });

    if (statusSel) statusSel.addEventListener('change', function () {
      if (!currentId) return;
      store.setStatus(currentId, statusSel.value || null);
      renderAll(); renderShelves(); renderEditor();
    });
    var addBtn = document.getElementById('journal-add-log');
    if (addBtn) addBtn.addEventListener('click', function () {
      if (!currentId || !dateInput || !textInput) return;
      var added = store.addLog(currentId, dateInput.value, textInput.value);
      if (added) {
        textInput.value = '';
        renderAll(); renderShelves(); renderEditor();
      } else if (entryNote) {
        entryNote.textContent = 'A log entry needs a real date and some text (up to ' + J.MAX_LOG_TEXT + ' characters). Nothing was saved.';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
