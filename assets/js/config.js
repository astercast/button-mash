/* PortPlay site config.
   The product name lives here for every JS-rendered string, and in
   each page's <title> and header wordmark. A rename touches this
   file plus those title layers, nothing else.
   The engine version also lives here, in ONE place (PP5): the
   stage, the player and the portable-file template all read the
   pinned, versioned CDN path below. The mutable "stable" channel
   is never used, so a file built today keeps working. Upgrading
   the engine is a deliberate act: change engineVersion here, the
   matching path in assets/vendor/template-game.html (build.py
   fails while the two disagree), and run the fixture tests. */
window.PORTPLAY = {
  name: "PortPlay",
  tagline: "Drop a game you own. Play it here.",
  engineVersion: "4.2.3",
  engineCdn: "https://cdn.emulatorjs.org/4.2.3/data/"
};
