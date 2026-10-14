/* Button Mash, interactive guide checklists with localStorage persistence. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.BM) return;
    document.querySelectorAll('ul.checklist[data-page]').forEach(function (ul) {
      var page = ul.getAttribute('data-page');
      var done = BM.getChecks(page);
      Array.prototype.forEach.call(ul.querySelectorAll('li'), function (li, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'check-toggle';
        var isDone = done.indexOf(idx) !== -1;
        btn.setAttribute('aria-pressed', isDone ? 'true' : 'false');
        btn.setAttribute('aria-label', 'Mark step ' + (idx + 1) + ' as ' + (isDone ? 'not done' : 'done'));
        btn.textContent = isDone ? '✓' : '';
        if (isDone) li.classList.add('done');
        btn.addEventListener('click', function () {
          var nowDone = BM.toggleCheck(page, idx);
          btn.setAttribute('aria-pressed', nowDone ? 'true' : 'false');
          btn.textContent = nowDone ? '✓' : '';
          btn.setAttribute('aria-label', 'Mark step ' + (idx + 1) + ' as ' + (nowDone ? 'not done' : 'done'));
          li.classList.toggle('done', nowDone);
        });
        li.insertBefore(btn, li.firstChild);
      });
    });
  });
})();
