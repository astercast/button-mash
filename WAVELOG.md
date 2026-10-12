# Button Mash — WAVELOG

Running record of build waves. Newest first.

## Wave 2 — 2026-10-11 — Player + Converter centerpieces

**What shipped:**
- **The Player** (`player.html`): universal in-browser EmulatorJS console. Bring-your-own-file flow — file picker, drag-and-drop, optional user-pasted URL (with honest CORS failure messaging), auto system detection from extension + manual core override (20 systems: `nes/snes/gb/gba/segaMD/segaMS/segaGG/sega32x/psx/n64/nds/pce/vb/atari2600/atari7800/lynx/ngp/ws/coleco/segaCD`), user-supplied BIOS picker for PSX/Sega CD, on-screen/touch controls + keyboard + gamepad, save states, fullscreen, eject/reload. Engine: EmulatorJS stable CDN (`cdn.emulatorjs.org/stable/data/`, loader + minified bundle + per-core `-wasm.data` verified reachable). Site hosts zero ROMs; file never leaves the machine.
- **The Converter** (`converter.html` + `assets/vendor/template-game.html`): drop in your own GBA file → download a single self-contained `.html` browser game (ROM embedded as base64, boots straight into mGBA core). Chunked base64 encoding with progress bar; warns above 16MB, refuses above 32MB (largest real GBA cart); honest about the engine loading from the EmulatorJS CDN on first run.
- **Game directory rebuilt (89 games)**: every URL curl-verified HTTP 200 on 2026-10-11 (4 dead: die-in-the-dungeon-classic, archives-of-trevosa, luck-be-a-landlord, sharkgame; 3 unreachable dropped). 8 genres, original one-line descriptions (CC0), controls field, `games.html` with live search, genre chips, favorites filter (localStorage), random game, result counts.
- **Game of the day** (date-seeded, deterministic) + genre sampler on `index.html`; **10 hand-built collections** (`collections.html`, `data/collections.json`).
- **New guides**: `gba-wasm.html` (original tech explainer: ARM/THUMB basic blocks → WASM, memory mapping, frame timing, differential verification; links agnt-gg/gba-pokemon-rom-to-wasm as source, no copied text), `how-emulation-works.html`, `best-emulator-per-system.html` (10 picks, all links verified). Setup guides gained interactive checklists with localStorage persistence.
- **Emulation hub** (`emulation.html`), **monster-taming corner** (`monster-taming.html`, original-IP only: Tuxemon + Showdown), **play-legal.html** (the one clear legal page).
- **Agentic layer**: `api/v1/` rebuilt with envelope format (`index/games/collections/emulators/guides.json` + schemas), `data/emulators.json` (10 picks, BIOS notes), 3 new skills (player-guide, legal-sourcing, collection-curator) + game-finder updated for the new data shape — 9 skills total.
- **Live pipeline**: `pipeline/watch_itch.py` + `pipeline/watch_emulator_releases.py` → `pipeline/review_queue.json` (human review, never auto-publishes). itch.io bot-gates feeds (403, verified) — watcher degrades gracefully, documented in PIPELINE.md. First run queued 18 emulator release candidates.
- **Design**: new arcade system (`tokens/base/layout/components/guides.css`): dark cabinet, neon pink/cyan/lime/amber/purple, chunky display type, scanlines, marquee, reduced-motion support. Old per-game pages + old CSS removed.

**Validation (wave 2):**
- `scripts/build.py`: BUILD OK — 89 games (82 domains), 10 collections, 10 emulators, 8 guides
- `scripts/check_links.py`: LINK CHECK OK — 17 pages, 413 local links, 21 external links, 0 broken
- `node --check assets/js/*.js`: all 5 pass
- EmulatorJS CDN contract verified: loader.js (200), emulator.min.js (200), cores/mgba-wasm.data (200), cores/gambatte-wasm.data (200), cores/snes9x-wasm.data (200); official core short names from emulatorjs.org/docs4devs/cores
- Converter template tokens verified present; BIOS requirements documented per core (PSX/Sega CD need user-dumped BIOS; NDS optional; rest BIOS-free)

**Legal lane**: unchanged and hardened — zero ROMs hosted, zero ROM/BIOS download links, "bring your own file" everywhere, play-legal.html as policy. Converter/Player both refuse the piracy path by design (user-supplied files only).

## Wave 1 — 2026-10-11 — Foundation build

**What shipped:**
- **Game directory (47 games)**: 9 open-source HTML5 games (2048, Hextris, 0hh1, Cookie Clicker, Clumsy Bird, Astray, A Dark Room, Candy Box 2, Particle Clicker), 20 .io games (agar.io → vertix.io), 9 free-to-play browser games (Kingdom of Loathing, Fallen London, RuneScape, Neopets, Happy Wheels, Universal Paperclips, Little Alchemy 2, Quick Draw, Wiki Game), Minecraft Classic, Seterra, HexGL, GeoFS, Celeste Classic + itch.io browse on itch.io, and 3 Internet Archive playable collections (MS-DOS Games, Internet Arcade, Console Living Room). Every URL audited against a verified-domain allowlist at build time — no invented links.
- **5 guides**: EmulatorJS self-hosting, RetroArch setup, GBA-to-WASM recompiler (user-supplied ROMs only), rip-your-own-cartridges, homebrew & public-domain sources. Technical, accurate, legal framing throughout.
- **Interactive**: game browser (genre chips, players chips, live search, result count with aria-live), 🎲 random-game modal (Play/Reroll/Close, Escape to dismiss, focus management), guides index section.
- **Agentic layer**: `api/v1/games.json` + `api/v1/guides.json`, JSON schemas (`api/v1/schema/`), `llms.txt` + `llms-full.txt` (full guide texts), 5 skills (game-finder, emulator-setup, homebrew-hunter, party-game-picker, retro-guide), `API.md`.
- **Docs**: `README.md`, `GO_LIVE.md` (GitHub Pages checklist; repo still private — visibility is the user's call), `PIPELINE.md` (future waves: 100+ games, genre deep-dives, party planner tool).
- **Design**: neon-on-dark arcade theme, Chakra Petch display font, semantic HTML, skip links, ARIA states, keyboard support, `prefers-reduced-motion` handling, mobile-first responsive.

**Validation (wave 1):**
- `scripts/build.py`: BUILD OK — 47 games, 47 game pages, 5 guides, 5 guide pages, sitemap 53 urls
- `scripts/check_links.py`: LINK CHECK OK — 53 pages, 0 broken
- `node --check assets/app.js`: pass
- Link audit: all 47 game URLs + all guide-body URLs on the verified-domain allowlist; 0 invented domains

**Legal lane**: no ROM download links, no piracy sites, no cracked-game links, no copyrighted game files — verified by content review and the build-time domain audit. Guides teach tools; games come from the user's own dumps.
