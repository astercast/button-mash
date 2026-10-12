# Button Mash — agent guide

How any agent (or script) uses Button Mash programmatically. Everything below is static JSON on a static host — no auth, no keys, no rate limits.

## Base URL

`api/v1/` relative to the site root (e.g. `https://<host>/button-mash/api/v1/`). Works from `fetch`, `curl`, or any JSON client.

## Start here

**`GET api/v1/index.json`** — self-describing manifest: description, legal note, endpoint catalog, usage. Every endpoint (except schemas) uses an envelope: `name`, `version`, `generated_at`, `endpoint`, `description`, `count`, plus the payload array under the endpoint's name.

## Endpoints

| Endpoint | What you get |
|---|---|
| `GET api/v1/games.json` | 114 game records. Each: `id`, `title`, `url` (curl-verified live 2026-10-11 — never invented), `genre` (`puzzle`/`action`/`roguelike`/`idle`/`multiplayer`/`retro`/`horror`/`cozy`), `controls`, `description` (original, CC0), optional `tags` (`party` + sub-tags like `drawing`/`arena`/`shooter`/`board`/`trivia`/`coop`/`word` power the party planner). Schema: `api/v1/schema/games.schema.json` |
| `GET api/v1/collections.json` | 11 hand-built collections: `id`, `title`, `tagline`, `description`, `game_ids[]` (all IDs exist in `games.json`) |
| `GET api/v1/emulators.json` | 10 emulator software picks: `id`, `name`, `systems[]`, `url`, `license`, `platforms[]`, `notes`, `bios_required`. Software only — no ROMs/BIOS. |
| `GET api/v1/guides.json` | 8 guide summaries: `id`, `slug` (`guides/<slug>.html` page), `title`, `difficulty`, `time_minutes`, `summary`, `section_count`. Full texts: `data/guides.json` or `llms-full.txt`. Schema: `api/v1/schema/guides.schema.json` |

All schemas are **JSON Schema draft 2020-12**. Data is validated at build time (`python3 scripts/build.py`).

## How to use the directory programmatically

There are no query params — payloads are complete snapshots. **Fetch once, filter client-side.**

- Genres: `puzzle`, `action`, `roguelike`, `idle`, `multiplayer`, `retro`, `horror`, `cozy`.
- Link users straight to `url` to play, or to `games.html` for the browsable directory (search, genre filters, favorites, random game, game of the day).
- Legal lane (standing, non-negotiable): every `url` was verified live at build time. Emulation guides cover tools only — users supply ROMs they dumped from games they own. Never fabricate a ROM/BIOS download link.

## The centerpieces (for user questions)

- **Player** (`player.html`): bring-your-own-file EmulatorJS console, 20+ systems. File never leaves the user's machine. Core short names (official): `nes snes gb gba segaMD segaMS segaGG sega32x segaCD psx n64 nds pce vb atari2600 atari7800 lynx ngp ws coleco`. PSX/Sega CD need a user-dumped BIOS; the rest boot BIOS-free. **Player 2.0 tools** (all client-side): save-state export/import (engine default downloads `.state` files; "Keep in Browser" mode lets the Save tool export/import/delete browser-kept states via IndexedDB `EmulatorJS-states`), keyboard+gamepad remap UI for Player 1 (reads/writes the engine's `ejs-<gameId>-<core>-<gameName>-settings` localStorage key, verified per-core button labels from the 4.2.3 stable build; applies on next boot), cheat-code entry per game (injected via the documented `window.EJS_cheats = [[name, code], ...]`; toggle in the engine's cheat manager — per-core code-format behavior is NOT verified, never claim it), CRT scanline/vignette filter (toolbar toggle, `prefers-reduced-motion`-safe), and an honest netplay notes section (engine advertises WebRTC room-code netplay as "being worked on"; NOT verified on the stable build — not enabled, not promised). See `skills/player-guide.md`.
- **Converter v2** (`converter.html`): user's file → self-contained playable `.html` (ROM embedded as base64; engine loads from the EmulatorJS CDN on first run). Three systems: GBA (`.gba`, mGBA core, 32MB max), Game Boy/Color (`.gb`/`.gbc`, Gambatte core, 8MB max), NES (`.nes`, FCEUmm core, 4MB max). **All three cores are BIOS-free** — zero extra files. Non-ROM formats refused gracefully (points at the Player). Template token contract: `__BM_GAME_NAME__`, `__BM_GAME_ID__`, `__BM_BUILD_DATE__`, `__BM_ROM_SIZE__`, `__BM_ROM_B64__`, `__BM_CORE__`, `__BM_CORE_LABEL__`, `__BM_SYSTEM__`, `__BM_HINT__`. See `skills/converter-multi-system.md`.
- **Party Planner** (`party-planner.html`): headcount + time + vibe + skill mix + inputs → timed rotation plan across party-tagged catalog games, with hand-the-controller rotation order and print-friendly output. Semantic HTML, keyboard-accessible, aria-live plan summary, reduced-motion aware. See `skills/party-planner-runner.md`.
- **Genre deep dives** (`genres/roguelike.html`, `genres/cozy.html`): curated lists from the catalog with start-here picks and why-each-fits blurbs.

## Example workflows

### 1. "Find a multiplayer party game"

```
1. GET api/v1/games.json
2. games.filter(g => g.genre === "multiplayer")
   → skribbl.io, gartic-phone, jklm, codenames, secret-hitler, make-it-meme…
3. Pick one with private rooms: skribbl.io → send the user to https://skribbl.io/
```

### 2. "Convert my own GBA/GB/NES file to a browser game"

```
1. Point them at converter.html — drop the file, system auto-detected from the extension.
2. All three cores (mGBA / Gambatte / FCEUmm) are BIOS-free: no extra files needed.
3. Warn above the size threshold (16MB GBA / 2MB GB / 1MB NES); refuse above the max.
   Big files → player.html instead.
4. Legal check: only their own dump / homebrew. See skills/legal-sourcing.md.
```

### 3. "Something cozy for a rainy day"

```
1. GET api/v1/collections.json
2. collections.find(c => c.id === "rainy-day-cozy") → game_ids
3. Resolve titles via games.json, or just link collections.html.
```

### 4. "Plan our game night" (party planner)

```
1. GET api/v1/games.json → filter games where tags includes "party".
2. Map vibe to sub-tags: chaotic→arena/drawing/word, competitive→shooter/arena/racing/sports,
   cooperative→coop/board, creative→drawing/word, chill→trivia/board/word.
3. Apply skill mix + input limits (shooters need keyboard+mouse).
4. 20-min slots (30 for chill/cooperative), rotate the starter each slot.
   See skills/party-planner-runner.md, or just send the user to party-planner.html.
```

### 5. "Move my save to another device" / "remap my controls" / "add a cheat" (Player 2.0)

```
1. Send the user to player.html — they boot their own file first.
2. Save: by default the engine downloads .state files on save — those ARE the portable
   format (send the file to the other device and use the Save tool → Import, with the
   engine in "Keep in Browser" mode; or just keep the downloaded file).
3. Controls: the Controls tool shows Player 1's keyboard + gamepad bindings with
   press-a-key / press-a-pad-button capture; changes apply on next boot.
4. Cheats: name + code per game, injected into the engine's cheat manager on boot —
   toggle there. Never claim a core "supports" a code format (unverified).
5. Netplay: NEVER promise it. Honest state only (see skills/player-guide.md).
```

## Rate & freshness notes

- Static files: fetch as often as you like; nothing to rate-limit against.
- Freshness: check `generated_at` in any envelope before trusting counts.
- Breaking changes arrive as a new `v2/` path — never a silent shape change. Shared conventions: `API.md`.
- Source data lives in `data/`; regenerate with `python3 scripts/build.py` after edits.
- Skills: `skills/` — game-finder, emulator-setup, player-guide, legal-sourcing, collection-curator, homebrew-hunter, party-game-picker, party-planner-runner, converter-multi-system, retro-guide, classroom-games.
