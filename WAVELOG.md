# Button Mash — WAVELOG

Running record of build waves. Newest first.

## Wave 6 — 2026-10-11 — Tournament brackets (interactive tools wave)

**What shipped:**
- **Bracket builder** (`tournament.html` + `assets/js/tournament.js`): 2–16 player names (one per line, entry order = seeds, duplicates auto-suffixed) → seeded single-elimination bracket. Best-of-N (1/3/5/7) selectable per round; one party game per round from the real catalog (party-tagged dropdown, 27 games + "pick" placeholder; round header shows an "Open <game> ↗" deep link). localStorage persistence (`bm_tournament_v1`, refresh-safe). Winners advance by click/keyboard: best-of-1 = "Advance" buttons, best-of-N = +/- series-score steppers with auto-advance at the majority and score correction; every decided match has "Clear winner" with full downstream cascade. Champion banner is static, aria-live announced, reduced-motion safe (zero animation/flashing).
- **Pure bracket math** (`assets/js/bracket.js`, UMD — browser + node): standard seeding (1v16/8v9…), `describeByes` gives first-round byes to top seeds at odd counts, shown honestly as BYE and auto-advanced (manual scoring of bye matches rejected). Covered by `scripts/test_bracket.js` — 82 assertions: seeding orders 2/4/8/16, odd counts 3/5/6/7/9/11/13/15 (bye counts + top-seed names), best-of-3 majority logic, decided-match guards, clearMatch cascade, round names, shuffle permutation.
- **Printable bracket**: "Print bracket" button + print CSS (white bg, no chrome/setup/buttons, per-round "Best of N · game" text lines, winners outlined).
- **"Copy my bracket"**: shareable plain-text export (champion, byes, every round: matchups, games, winners with series scores).
- **Party planner cross-link**: finished plans render "🏆 Turn this plan into a tournament" → `tournament.html?players=N&games=id1,id2…` (players + up to 8 unique plan game ids pre-filled; game selects assigned round-by-round).
- **New skill**: `skills/tournament-runner.md` (seeding/bye rules, game-pick guidance, handoff-link recipe, worked 8-player example). 13 skills total.
- **Updates**: AGENT.md (Tournament centerpiece bullet, workflow #6, skills list), README.md (13 skills), `scripts/build_site.py` (tournament.html in sitemap + llms.txt Play section), regenerated llms.txt/llms-full.txt/sitemap.xml, "Tournament" link added to header nav + footer on all 11 pages, `scripts/check_api_workflows.js` WF6 (page wiring, catalog-driven game picker, print/copy, reduced-motion, planner handoff, skill, bracket-math inline check, sitemap).
- **Bug found & fixed in testing**: `applyPendingGamesSoon(null)` crashed on `?games=` handoff URLs with no saved state (2 pageerrors) — guarded before ship.

**Validation (wave 6):**
- `scripts/build.py`: BUILD OK — 114 games (104 domains), 11 collections, 10 emulators, 14 guides; LEGAL GATE OK (28 pages, 114 game URLs, 0 piracy links)
- `scripts/check_links.py`: LINK CHECK OK — 28 pages, 716 local links, 63 external links, 0 broken
- `node --check assets/js/*.js`: clean (incl. new bracket.js, tournament.js)
- `node scripts/test_bracket.js`: 82 assertions, 0 failures
- `node scripts/check_api_workflows.js`: all pass (WF1–WF6)
- `~/workspace/smoke/test.js`: zero pageerrors (only expected CDN fetch noise on player.html)
- Headless Chromium functional pass (tournament.html, catalog stubbed): ?players=6&games=bonk,tetrio,skribbl prefill → 6 players, QF/SF/F rounds, Player 1+2 byes, 28 game options, handoff games assigned per round, best-of-3 SF scored 2–1 auto-advances, champion banner, clear-winner unwinds, copy text correct, state restores after reload, keyboard focus + Enter advances. Zero pageerrors.
- Party planner handoff verified: plan renders `tournament.html?players=6&games=agar,codenames,gartic-phone`, zero pageerrors.

**Legal lane**: unchanged — tournament adds no new external links; round-game options are the existing verified catalog entries only.

## Wave 5 — 2026-10-11 — Per-system emulation guides (deep sourced content wave)

**What shipped:**
- **6 system guides** (`guides/{gba,snes,n64,ps1,genesis,gameboy}.html`), each with: best EmulatorJS core (all core names/backend facts re-verified against the official EmulatorJS docs payload on 2026-10-11 — `gba`→mGBA, `snes`→Snes9x (alt bsnes), `n64`→Mupen64Plus-Next (alt parallel-n64), `psx`→PCSX-ReARMed (alt mednafen_psx_hw), `segaMD`→Genesis Plus GX, `gb`→Gambatte (alt mGBA); no invented cores), settings that matter, performance tips, save-state/cheat notes wired to Player 2.0 (Keep in Browser, `EJS_cheats` injection, Controls remap), honest BIOS notes (GBA/GB/SNES/Genesis/N64 BIOS-free; PS1 boots via HLE, user-dumped BIOS recommended for accuracy — never download), a **"Play it in the Player" deep link** (`player.html?core=<shortname>`), a curl-verified homebrew starter pack, and a native-desktop alternative.
- **System picker quiz** (`system-picker.html` + `assets/js/system-picker.js`): 4 questions (nostalgia era, device power, game taste, tinkering tolerance) → recommended system + guide link + Player deep link + runner-up. Weak devices honestly exclude N64/PS1; N64/PS1 results carry hardware/accuracy warnings. Native radio inputs, aria-live result, keyboard-accessible, reduced-motion safe. Functionally tested in headless Chromium (N64 on strong+early-3D; GBA when weak+early-3D with N64/PS1 excluded).
- **Player deep links**: `assets/js/player.js` now reads `?core=<shortname>` and pre-selects the system in the dropdown (unknown cores ignored). Verified in headless Chromium (`?core=segaMD` → select shows segaMD).
- **Homebrew starter packs** (`data/homebrew-packs.json` → `api/v1/homebrew-packs.json`): 6 packs × 3–4 entries, every URL curl-verified HTTP 200 on 2026-10-11 (pdroms.de system sections, itch.io system tag pages, gbdev.io, n64.dev, psxdev.net, psx.dev, GameBrew GBA/GB lists). New schema `api/v1/schema/homebrew-packs.schema.json`.
- **New skill**: `skills/system-picker.md` (quiz triage + manual scoring weights + verified core facts). 12 skills total.
- **Updates**: `emulation.html` gained a "Not sure where to start?" quiz CTA + a 6-card "Per-system guides" section; `data/guides.json` + `api/v1/guides.json` now carry 14 guides; `scripts/build.py` gained n64.dev/psx.dev/psxdev.net reference domains; `scripts/check_links.py` now strips query strings before local-link resolution (deep links); `scripts/check_api_workflows.js` gained WF5 (packs envelope, 6 packs × 3+ URLs, 6 system-guide records, every guide's deep link, quiz scoring); AGENT.md (guides table, homebrew-packs endpoint, picker, deep links), README.md counts, llms.txt/llms-full.txt (regenerated), sitemap.xml (regenerated).

**Validation (wave 5):**
- `scripts/build.py`: BUILD OK — 114 games (104 domains), 11 collections, 10 emulators, 14 guides; LEGAL GATE OK (27 pages, 0 piracy links)
- `scripts/check_links.py`: LINK CHECK OK — 27 pages, 666 local links, 63 external links, 0 broken
- `node --check assets/js/*.js`: pass (incl. new system-picker.js)
- `node scripts/check_api_workflows.js`: all pass (WF1–WF5)
- `~/workspace/smoke/test.js`: zero pageerrors (only expected file:// + CDN fetch noise)
- External URLs: 21 new homebrew/curated URLs all curl-verified HTTP 200 same day

**Legal lane**: unchanged — zero ROMs hosted, zero ROM/BIOS download links; all new links are homebrew archives, tag pages, and dev communities. BIOS notes teach dump-your-own only.

## Wave 4 — 2026-10-11 — Player 2.0 (interactive tools wave)

**What shipped:**
- **Save-state export/import** (`player.html` #player-2-tools + `assets/js/player.js`): engine-verified facts first — the 4.2.3 stable engine defaults to *downloading* `<basefile>.state` files on save (raw state bytes); with the engine in *Keep in Browser* mode states live in IndexedDB `EmulatorJS-states` / store `states`, key = baseFileName + `.state`. The Save tool lists browser-kept states (current game's tagged), exports any as a downloadable `.state` file, imports a `.state` file back under the current game's key, and deletes. Files are tied to the emulator build; cross-version loads may fail. Share-saves = send the file; friend needs their own copy of the same game file.
- **Controller remapping UI**: Player 1 keyboard + gamepad bindings read from the engine's own stored settings (`ejs-<gameId>-<core>-<gameName>-settings` in localStorage), press-a-key / press-a-pad-button capture, reset-to-defaults (deletes the key). Button label tables are the engine's per-core control-scheme lists and the keyMap/defaultControllers tables — all extracted from the 4.2.3 stable build, no invented labels. Remaps apply on next boot (documented in the UI). Analog-stick axes stay in the engine's own Control Settings — said honestly in the UI.
- **CRT filter toggle**: scanline + vignette CSS overlay on the stage, toolbar + tool-panel toggles (`aria-pressed`), persisted in `bm-crt`. Flicker animation exists only under `prefers-reduced-motion: no-preference` — static scanlines otherwise.
- **Cheat-code support**: name + code entry per game, stored in `bm-cheats-<gameID>`, injected as the documented `window.EJS_cheats = [[name, code], ...]` before boot so they land in the engine's cheat manager (toggle with the cheat icon in-game). Documented honestly: code formats are applied by each core's own cheat engine — per-core format support is NOT verified and is never claimed. Engine-verified facts: `EJS_cheats` array option, `EJS_cheatPath` dynamic per-core JSON.
- **Netplay notes** (new section on player.html): honest state only — engine advertises WebRTC room-code netplay but its own docs flag it "being worked on" (historically pre-4.0 + old cores + signaling server); NOT verified end-to-end on the stable build; not enabled, not promised in Button Mash.
- **Docs**: `skills/player-guide.md` (Player 2.0 workflows + honesty rules), `AGENT.md` (Player 2.0 centerpiece detail + new example workflow 5), `llms.txt`/`llms-full.txt` refreshed via `scripts/build_site.py`.

**Validation (wave 4):**
- `scripts/build.py`: BUILD OK — 114 games (104 domains), 11 collections, 10 emulators, 8 guides; LEGAL GATE OK (0 piracy links)
- `node --check assets/js/*.js`: all 6 pass
- `node scripts/check_api_workflows.js`: all PASS
- `scripts/check_links.py`: LINK CHECK OK — 20 pages, 516 local, 38 external, 0 broken
- `~/workspace/smoke/test.js`: zero pageerrors (only environmental note: sandbox proxy blocks the EmulatorJS CDN tunnel, so the engine can't boot here — the wave-3.1 null-guard veil path handled it cleanly)
- Puppeteer round-trip tests (new, `/tmp/verify-p2.js`, `/tmp/verify-saves.js`): 16-row GBA remap table renders with engine labels; key remap writes the exact engine settings key (`ejs-…-gba-…-settings`); reset restores defaults; cheat add/remove works; save-state import → export (byte-identical 12-byte file) → delete all succeed; eject returns panels to no-game state; CRT toggle persists. Zero pageerrors throughout.

**Legal lane**: unchanged — zero ROMs hosted, zero ROM/BIOS download links; all features operate on the user's own files and saves, client-side only.

## Wave 3 — 2026-10-11 — Converter v2, Party Planner, 100+ games

**What shipped:**
- **Converter v2** (`converter.html` + `assets/js/converter.js` + `assets/vendor/template-game.html`): GB/GBC (Gambatte core) and NES (FCEUmm core) added alongside GBA (mGBA). System auto-detected from extension (`.gba` / `.gb` / `.gbc` / `.nes`); per-system size caps follow real hardware (32MB / 8MB / 4MB) with warn thresholds; non-ROM formats refused gracefully (points at the Player). Template token contract kept and extended: `__BM_GAME_NAME__`, `__BM_GAME_ID__`, `__BM_BUILD_DATE__`, `__BM_ROM_SIZE__`, `__BM_ROM_B64__` + new `__BM_CORE__`, `__BM_CORE_LABEL__`, `__BM_SYSTEM__`, `__BM_HINT__` (9 tokens, all verified filled). **All three cores are BIOS-free** — documented per core on the page (mGBA ships a built-in BIOS replacement; Gambatte/FCEUmm need no BIOS).
- **Party Planner** (`party-planner.html` + `assets/js/party.js`): players (1–16) + time + vibe (chaotic/competitive/cooperative/creative/chill) + skill mix + inputs → timed rotation plan across party-tagged catalog games, with hand-the-controller rotation order, setup notes per game, print-friendly stylesheet, semantic HTML, keyboard-native form, aria-live plan summary, reduced-motion support.
- **Catalog → 114 games**: 25 new curl-verified (HTTP 200, 2026-10-11) legal browser games — Paper.io, Slope, Moto X3M, official Tetris, Seterra, 0hh1, Clumsy Bird, Astray, HexGL, Minecraft Classic, Lexulous, AirConsole, PlayOK, Swarm Sim, Melvor Idle, Quick Draw, Sandspiel, Song Maker, The Deep Sea, Nested, Koalas to the Max, Space Elevator, ClassicReload, PICO-8 BBS, JetPunk. Dropped per 200-discipline: hextris.io + vertix.io (unreachable), realm-grinder.com (521). New optional `tags` field on game records (validated by build.py, added to JSON schema + API.md); 27 games party-tagged with a `party` + sub-tag vocabulary (`drawing`/`arena`/`shooter`/`board`/`trivia`/`coop`/`word`/`racing`/`sports`/`phone`).
- **Collections → 11**: party-night +3 (AirConsole, Lexulous, Paper.io), rainy-day-cozy +2 (Deep Sea, Sandspiel), io-essentials +1 (Paper.io), brain-food +5 (Tetris, Seterra, 0hh1, Quick Draw, Koala Max); new `daily-rituals` collection (wordle/connections/framed/worldle/globle/0hh1/password-game/logos-memory).
- **2 genre deep dives** (`genres/roguelike.html`, `genres/cozy.html`): start-here picks + why-each-fits blurbs, linked from games.html; in sitemap.
- **Agentic layer**: api/v1 rebuilt (envelope unchanged; games carry `tags`); AGENT.md updated (Converter v2 + Party Planner workflows, 114 count); llms.txt/llms-full.txt/sitemap regenerated; 2 new skills — `party-planner-runner`, `converter-multi-system` (11 total). `check_api_workflows.js` rewritten for the current envelope shape + wave-3 workflows.
- **Legal gate**: new `scripts/check_legal.py` (no ROM/BIOS download links, no piracy domains; pdroms.de/gamebrew.org/itch.io whitelisted as legal ROM hosts) — wired into `scripts/build.py` so every build runs it.
- **Pipeline**: watchers re-ran (itch still 403-gated, graceful; 0 new emulator-release candidates); all 18 queued candidates reviewed and dispositioned (EmulatorJS 4.3.0-pre/4.2.3/4.2.2 checked against Converter v2 cores — no changes; queue now 0 pending).

**Validation (wave 3):**
- `scripts/build.py`: BUILD OK — 114 games (104 domains), 11 collections, 10 emulators, 8 guides; LEGAL GATE OK (20 pages, 114 URLs, 0 piracy links)
- `scripts/check_links.py`: LINK CHECK OK — 20 pages, 516 local links, 38 external links, 0 broken
- `node --check assets/js/*.js`: all 6 pass (incl. new party.js)
- `node scripts/check_api_workflows.js`: 17/17 PASS (envelope shape, 100+ games, 0 dupes, WF1–WF4)
- Converter token contract: 9/9 template tokens filled by converter.js (verified programmatically)
- EmulatorJS CDN contract re-verified: loader.js, emulator.min.js, cores/mgba-wasm.data, cores/gambatte-wasm.data, cores/fceumm-wasm.data — all HTTP 200; docs4devs/cores confirms fceumm = default NES core, gambatte = default GB core
- Real-browser smoke test of Player/Converter: NOT attempted (needs a real browser + a real homebrew GBA file) — flagged for parent delegation

**Legal lane**: unchanged and hardened — zero ROMs hosted, zero ROM/BIOS download links (now machine-gated), user-supplied files only everywhere; 25/25 new games curl-verified before inclusion.

**Wave 3.1 (QA follow-up, same wave)** — headless-Chromium smoke test (`~/workspace/smoke/test.js`, kept as a reusable QA script): converter.html FULL PASS (512KB GBA detected, 704KB output, all 9 tokens replaced, zero console errors); player.html had one real bug — the engine-failure path (`script.onerror`) threw `TypeError: Cannot set properties of null (setting 'textContent')` because `boot()`'s `stage.innerHTML = ''` destroyed `#veil-error` (it lives inside `#ejs-stage`) before the error text was written. Fixed in `assets/js/player.js`: never blank the whole stage (remove only `#ejs-screen` via `clearScreen()`), `showVeil()` re-attaches the veil if detached, and every `#veil-error` write goes through a null-guarded `veilError()` helper. The eject handler had the same wipe bug and now uses `showVeil()` too. Re-ran the smoke test: **zero pageerrors on player.html** (the loader.js request failure is a sandbox-proxy artifact; CDN files curl-verified 200). Legal lane unchanged; no other scope changes.

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
