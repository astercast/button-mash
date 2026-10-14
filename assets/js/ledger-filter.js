/* Button Mash: Exclusion Ledger lookup (wave 35).
   Filters the generator-stamped ledger on parents.html by game
   title. The ledger itself is static HTML stamped by
   scripts/build.py (wire_exclusions) from data/kids.json, this
   script only shows and hides rows that are already on the page,
   so the full record reads fine with JavaScript off. No data is
   fetched, nothing is scored, and no pick is ever dealt: the
   ledger is a complete record, not a chance surface. */
(function () {
  "use strict";
  var input = document.getElementById("ledger-search");
  var status = document.getElementById("ledger-status");
  if (!input) return;
  var items = Array.prototype.slice.call(
    document.querySelectorAll("[data-ledger-item]"));
  if (!items.length) return;
  var total = items.length;

  function apply() {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    items.forEach(function (li) {
      var hit = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
      li.hidden = !hit;
      if (hit) shown++;
    });
    if (!status) return;
    if (!q) status.textContent = "";
    else if (shown === 0)
      status.textContent = "No kept-out game matches “" + input.value.trim() +
        "”. If it is in the catalog and not listed here, it passed the audit, check Kids corner.";
    else
      status.textContent = shown + " of " + total + " kept-out games match.";
  }

  input.addEventListener("input", apply);
})();
