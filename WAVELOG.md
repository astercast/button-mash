# Button Mash — WAVELOG

Running record of build waves. Newest first.

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
