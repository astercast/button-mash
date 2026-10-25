/* PortPlay site config.
   The product name lives here for every JS-rendered string, and in
   each page's <title> and header wordmark. A rename touches this
   file plus those title layers, nothing else.
   The engine version also lives here, in ONE place (PP5): the
   stage, the player and the portable-file template all read the
   pinned version below. The mutable "stable" channel is never
   used, so a file built today keeps working.

   Player fix 2026-10-24: the pinned EmulatorJS 4.2.3 engine is
   VENDORED into this repo (assets/emulatorjs/data/, see
   assets/emulatorjs/VENDORED.md) and served from this site.
   engineCdn (the name is kept from the CDN era; every consumer
   treats it as "the engine data path") is that LOCAL path,
   relative to the site root — every page that boots the engine
   lives at the root. It used to point at the EmulatorJS CDN's
   pinned 4.2.3 data path, which was the live
   "network error" at play time: the engine, its stylesheet,
   every core and every core report were fetched from the CDN
   when a game started, so any CDN failure or block killed play.
   Nothing at play time leaves this site now. Upgrading the
   engine is a deliberate act: re-vendor the new version's data
   into assets/emulatorjs/data/, change engineVersion here, the
   matching version in assets/vendor/template-game.html (build.py
   fails while the two disagree), and run the fixture tests. */
window.PORTPLAY = {
  name: "PortPlay",
  tagline: "Drop a game you own. Play it here.",
  engineVersion: "4.2.3",
  engineCdn: "assets/emulatorjs/data/"
};
