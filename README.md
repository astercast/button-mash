# Button Mash 🕹️

The all-in-one browser games + emulation hub — every game playable in the browser, **legally**.

- **47 curated games**: open-source HTML5 games, .io arenas, free-to-play browser classics, itch.io picks, and Internet Archive playable collections. Filter by genre and players, search, or hit the random-game button.
- **5 emulation guides**: EmulatorJS self-hosting, RetroArch setup, GBA-to-WASM recompilation, rip-your-own-cartridges, and homebrew/public-domain sources. Tools and techniques only — you supply ROMs dumped from games you own.
- **Legal lane (non-negotiable)**: no ROM download links, no piracy sites, no cracked-game links. When in doubt, we link the guide and the tool — never the pirated content.

## Structure

- `index.html` — game browser (filters, search, random pick) + guides index
- `games/<id>.html` — one page per game (47)
- `guides/<slug>.html` — one page per guide (5)
- `data/games.json`, `data/guides.json` — source data (the build validates and generates from these)
- `api/v1/` — `games.json`, `guides.json`, `schema/` (JSON schemas)
- `assets/` — `style.css` (neon-on-dark arcade theme), `app.js` (browser UI)
- `skills/` — 5 agent skills: game-finder, emulator-setup, homebrew-hunter, party-game-picker, retro-guide
- `scripts/build.py` — validates data (including a URL allowlist audit: no invented domains) and generates pages, API, sitemap, llms.txt
- `scripts/check_links.py` — link check: 0 broken local links
- `llms.txt` / `llms-full.txt` — agent-readable site summaries
- `API.md`, `GO_LIVE.md`, `PIPELINE.md`, `WAVELOG.md` — docs

## Build & validate

```bash
python3 scripts/build.py        # validate + generate (prints BUILD OK)
python3 scripts/check_links.py  # link check (prints LINK CHECK OK)
node --check assets/app.js      # JS syntax
python3 -m http.server          # serve locally, open index.html
```

## Deploy

GitHub-only, no Vercel (standing rule). See `GO_LIVE.md`. Pushes go through `python3 ~/workspace/skills/github/bin/gh-push.py ~/workspace/button-mash` — plain `git push` can't auth via this environment's connector.

## The legal lane

This repo will never contain: ROM download links, ROM piracy sites, cracked-game links, copyrighted game files, or BIOS downloads. Guides teach tools; the user's own dumped cartridges supply the games. Every game URL in `data/games.json` is audited against an allowlist of verified domains at build time — an invented link fails the build.
