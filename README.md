# PortPlay

**Drop a game you own. Play it here.**

PortPlay is a client-side game converter and player. A visitor brings a game
file they own; PortPlay identifies it by its contents, plays it in the
browser, and (for cartridge systems) builds a portable single-file HTML copy
they keep. There is no library, no catalog, no accounts, and no uploads:
files are read on the visitor's device and never leave it.

This repository was Button Mash until 2026-10-15. The library, catalog,
collections, and every outbound game link were removed on the user's order;
the site is the converter and nothing else. The directory and repo keep the
`button-mash` name; the site's identity is PortPlay, isolated in
`assets/js/config.js` plus page titles, so a future rename is a small,
named change (see the landing record in `~/workspace/fleet-ops/wave-engine/`).

## The five pages

- `index.html` — **the Stage**: drop a file, it plays on the spot; a
  portable copy builds alongside. Coverage lists are generated from the
  converter's own code by `scripts/build.py` (`data/v1/coverage.json`), so
  the page can only claim what the code routes.
- `player.html` — **the Console**: the full player (EmulatorJS) with named
  save slots, per-system control remapping, cheats, display options, your
  own BIOS for PlayStation / Sega CD, and an on-device shelf of your games.
- `dos.html` — **the DOS room**: a DOS game (ZIP or folder) is wrapped into
  a `.jsdos` bundle in the browser and booted under DOSBox via js-dos.
- `guide.html` — **the Guide**: for the systems no browser can convert
  (PS2, GameCube, Wii, PS3, Xbox, 360, Switch, 3DS, Wii U, Vita) and the
  ones on the bench (PSP, Saturn, Dreamcast): the working native path
  for each, and how to dump your own games.
- `404.html` — says so, briefly.

## How it works

- `assets/js/converter4-core.js` — content-first router: reads the file's
  own bytes (signatures, ISO contents, headers) and routes to play, convert,
  DOS, a disc picker, or an honest decline with a guide link.
- `assets/js/converter-core.js` — the single-file converter: validation
  with honesty rules, deflate (in a Web Worker, `assets/js/stage.js`), and
  the portable HTML builder (`assets/vendor/template-game.html`).
- `assets/js/player.js` + `assets/js/library.js` — the console and the
  on-device shelf (content-hash identity, so renames never orphan saves).
- Play engines are EmulatorJS cores loaded from the EmulatorJS CDN at play
  time; the DOS engine is js-dos. PortPlay hosts no games, sells no games,
  and links to no game downloads, BIOS, or firmware. Ever.

## Build and test

```sh
python3 scripts/build.py            # validates + regenerates data/v1/coverage.json, sitemap, llms.txt
node scripts/test_converter12.js    # the standing converter contract suite
node scripts/test_portplay.js       # per-class end-to-end proof (convert/play/decline/DOS/zip/coverage)
python3 scripts/make_fixtures.py    # regenerates the homebrew test fixtures (deterministic)
```

Deploy is a static Vercel build (`python3 scripts/build.py`, Standard build
machine) with one serverless function, `api/health.js`. The working repo is
never deployed directly; the `-live` snapshot repo is updated only on the
user's explicit push order (see `GO_LIVE.md` / `LIVE_CHECKLIST.md`).
