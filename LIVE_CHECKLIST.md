# LIVE_CHECKLIST — PortPlay live track

The live site is the snapshot repo **`astercast/button-mash-live`**
(deployed at `https://button-mash-live.vercel.app`), updated only on the
user's explicit push order. The working repo stays the source of truth.

## Current live wiring (from the 2026-10-11/12 first deploy)

- Vercel project serves the snapshot repo root as a static site with
  serverless functions under `api/`.
- Build machine: **Standard, never Turbo** (Sept 2026 Turbo invoice).
- The snapshot predates the PortPlay rebuild; it still serves the old
  Button Mash library until the next ordered snapshot replaces it whole.

## Next snapshot must contain (PortPlay surface)

- Pages: `index.html`, `player.html`, `dos.html`, `guide.html`, `404.html`
  — and nothing else. No `games.html`, no `guides/`, no `genres/`.
- `assets/` (css, js, fonts, vendor, og-card.png, icons), `favicon.svg`.
- `data/v1/coverage.json` — static data at top level, never under `api/`.
- `api/health.js` only, plus `lib/envelope.js` (its one dependency).
- `vercel.json`: buildCommand `python3 scripts/build.py`, functions map =
  `api/health.js` only, `{"maxDuration": 10}`, **no `runtime` key, no
  crons**.
- `robots.txt`, `sitemap.xml`, `llms.txt` (build-regenerated).

Excluded as before: `scripts/`, `tests/`, dev docs, `.github/`.

## Verify after the snapshot push

- Remote commit exists; remote tree == snapshot tree (Trees API).
- `https://button-mash-live.vercel.app/` serves PortPlay (title check).
- `/api/health` returns the envelope with service `portplay`, status `ok`.
- Drop test in a browser: a cartridge file plays on the Stage and the
  portable-copy card appears.
