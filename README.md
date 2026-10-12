# Button Mash 🕹️

The universal in-browser game console — play anything in your browser, **legally**.

- **The Player** (`player.html`): bring-your-own-file EmulatorJS console for 20+ classic systems (GBA, SNES, NES, Genesis, GB/GBC, N64, PlayStation, …). File picker, drag-and-drop, URL loading, on-screen/keyboard/gamepad controls, save states, fullscreen. The site hosts zero ROMs; your file never leaves your machine.
- **The Converter** (`converter.html`): drop in a GBA file you own → download a single self-contained `.html` browser game (ROM embedded, boots straight into play). 100% client-side.
- **89 curated browser games** (`games.html`): puzzle, action, roguelike, idle, multiplayer, retro, horror, cozy. Every URL curl-verified live. Search, genre filters, favorites (localStorage), random game, game of the day.
- **10 hand-built collections** (`collections.html`), **14 emulation guides** (`emulation.html` → `guides/`), incl. 6 per-system guides (GBA, SNES, N64, PS1, Genesis, Game Boy/Color) + the system-picker quiz (`system-picker.html`), **monster-taming corner**, and **play-legal.html** — the one clear legal page.
- **Legal lane (non-negotiable)**: no ROM download links, no piracy sites, no cracked-game links, no BIOS downloads. Emulators are software; games come from your own dumps, homebrew, or legal archives.

## Structure

- `index.html` — hub: centerpieces, game of the day, genre sampler
- `player.html` / `converter.html` — the two centerpieces (`assets/js/player.js`, `assets/js/converter.js`, `assets/vendor/template-game.html`)
- `games.html` / `collections.html` — directory + collections (rendered from `data/`)
- `emulation.html`, `monster-taming.html`, `play-legal.html` — hubs and policy
- `guides/<slug>.html` — 14 guides (some with interactive checklists)
- `data/` — `games.json`, `collections.json`, `emulators.json`, `guides.json` (sources of truth)
- `api/v1/` — `index/games/collections/emulators/guides.json` + `schema/` (static JSON API)
- `assets/css/` — `tokens/base/layout/components/guides.css` (arcade design system)
- `assets/js/` — `store/directory/player/converter/checklists.js`
- `skills/` — 14 agent skills: game-finder, emulator-setup, player-guide, legal-sourcing, collection-curator, homebrew-hunter, party-game-picker, party-planner-runner, converter-multi-system, retro-guide, classroom-games, system-picker, tournament-runner, kids-corner-guide
- `pipeline/` — `watch_itch.py`, `watch_emulator_releases.py` → `review_queue.json` (human review, never auto-publishes)
- `scripts/` — `build.py` (validate + regenerate), `build_api.py`, `build_site.py`, `check_links.py`
- `llms.txt` / `llms-full.txt` — agent-readable site summaries
- `API.md`, `GO_LIVE.md`, `PIPELINE.md`, `WAVELOG.md` — docs

## Build & validate

```bash
python3 scripts/build.py        # validate + regenerate api/llms/sitemap (prints BUILD OK)
python3 scripts/check_links.py  # link check (prints LINK CHECK OK, 0 broken)
node --check assets/js/*.js     # JS syntax
python3 -m http.server          # serve locally, open index.html
```

## Deploy

GitHub-only, no Vercel (standing rule). See `GO_LIVE.md`. Pushes go through `python3 ~/workspace/skills/github/bin/gh-push.py ~/workspace/button-mash` — plain `git push` can't auth via this environment's connector.

## The legal lane

This repo will never contain: ROM download links, ROM piracy sites, cracked-game links, copyrighted game files, or BIOS downloads. The Player and Converter are bring-your-own-file tools. Every game URL in `data/games.json` was curl-verified (HTTP 200) on 2026-10-11; the build audits external link domains. An invented link fails the build.
