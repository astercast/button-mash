/* Button Mash, guide TOC scroll-spy (wave 13).
   Progressive enhancement: highlights the TOC link for the section
   currently in view. No animation, no smooth scrolling, works fine
   under prefers-reduced-motion; harmless no-op without JS. */
(function () {
  "use strict";
  var toc = document.querySelector("[data-spy]");
  if (!toc || !("IntersectionObserver" in window)) return;

  var pairs = [];
  toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var sec = document.getElementById(a.getAttribute("href").slice(1));
    if (sec) pairs.push([sec, a]);
  });
  if (!pairs.length) return;

  var current = null;
  function setCurrent(link) {
    if (current === link) return;
    if (current) current.removeAttribute("aria-current");
    current = link;
    if (current) current.setAttribute("aria-current", "true");
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i][0] === entry.target) { setCurrent(pairs[i][1]); break; }
      }
    });
  }, { rootMargin: "-15% 0px -70% 0px" });

  pairs.forEach(function (pair) { obs.observe(pair[0]); });
})();
