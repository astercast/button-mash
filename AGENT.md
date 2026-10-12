# Button Mash — agent guide

How any agent (or script) uses Button Mash programmatically. Everything below is static JSON on a static host — no auth, no keys, no rate limits.

## Base URL

`api/v1/` relative to the site root (e.g. `https://<host>/button-mash/api/v1/`). Works from `fetch`, `curl`, or any JSON client.

## Start here

**`GET api/v1/index.json`** — self-describing manifest: description, legal note, endpoint catalog, usage. Every endpoint (except schemas) uses an envelope: `name`, `version`, `generated_at`, `endpoint`, `description`, `count`, plus the payload array under the endpoint's name.

## Endpoints

| Endpoint | What you get |
|---|---|
| `GET api/v1/games.json` | 125 game records (wave 8 added 11: Tristram, Die in the Dungeon CLASSIC, The Archives of Trevosa excluded-from-kids, Prerolled, Zombie Nest GBA, Dare To Doku, + 5 vanilla-JS wqnlll.github.io games). Each: `id`, `title`, `url` (curl-verified live 2026-10-11 — never invented), `genre` (`puzzle`/`action`/`roguelike`/`idle`/`multiplayer`/`retro`/`horror`/`cozy`), `controls`, `description` (original, CC0), optional `tags` (`party` + sub-tags like `drawing`/`arena`/`shooter`/`board`/`trivia`/`coop`/`word` power the party planner). Schema: `api/v1/schema/games.schema.json` |
| `GET api/v1/collections.json` | 13 hand-built collections (wave 8 added homebrew-radar + vanilla-js): `id`, `title`, `tagline`, `description`, `game_ids[]` (all IDs exist in `games.json`) |
| `GET api/v1/emulators.json` | 10 emulator software picks: `id`, `name`, `systems[]`, `url`, `license`, `platforms[]`, `notes`, `bios_required`. Software only — no ROMs/BIOS. |
| `GET api/v1/guides.json` | 14 guide summaries: `id`, `slug` (`guides/<slug>.html` page), `title`, `difficulty`, `time_minutes`, `summary`, `section_count`. Includes 6 per-system guides (`gba`, `snes`, `n64`, `ps1`, `genesis`, `gameboy`): best EmulatorJS core (verified against the official core list), settings that matter, performance tips, saves/cheats wired to Player 2.0, honest BIOS notes, Player deep link (`player.html?core=<core>`), and a verified homebrew starter pack. Full texts: `data/guides.json` or `llms-full.txt`. Schema: `api/v1/schema/guides.schema.json` |
| `GET api/v1/homebrew-packs.json` | Per-system homebrew starter packs: the legal on-ramps for the Player. Every URL verified live 2026-10-11 (pdroms.de system sections, itch.io system tags, gbdev.io, n64.dev, psxdev.net, psx.dev, GameBrew lists). Schema: `api/v1/schema/homebrew-packs.schema.json` |

All schemas are **JSON Schema draft 2020-12**. Data is validated at build time (`python3 scripts/build.py`).

## How to use the directory programmatically

There are no query params — payloads are complete snapshots. **Fetch once, filter client-side.**

- Genres: `puzzle`, `action`, `roguelike`, `idle`, `multiplayer`, `retro`, `horror`, `cozy`.
- Link users straight to `url` to play, or to `games.html` for the browsable directory (search, genre filters, favorites, random game, game of the day).
- Legal lane (standing, non-negotiable): every `url` was verified live at build time. Emulation guides cover tools only — users supply ROMs they dumped from games they own. Never fabricate a ROM/BIOS download link.

## The centerpieces (for user questions)

- **Player** (`player.html`): bring-your-own-file EmulatorJS console, 20+ systems. File never leaves the user's machine. Core short names (official): `nes snes gb gba segaMD segaMS segaGG sega32x segaCD psx n64 nds pce vb atari2600 atari7800 lynx ngp ws coleco`. PSX/Sega CD need a user-dumped BIOS; the rest boot BIOS-free. **Player 2.1 tools** (all client-side): named save slots per game in the engine's IndexedDB store (`<base>.bm-slot-<n>.state`; save/restore/rename/export/import/delete; auto-save slot on a 1/5/15-min timer while the tab is open — all browser-local, "Keep in Browser" mode required), per-system keyboard+gamepad remap UI for Player 1 (`bm-remap-<core>` in localStorage, written into the engine's `ejs-<gameId>-<core>-<gameName>-settings` payload at boot; legacy per-game maps auto-migrated; verified per-core button labels from the 4.2.3 stable build; Esc cancels capture; the remapper is fully keyboard-operable), cheat-code entry per game (injected via the documented `window.EJS_cheats = [[name, code], ...]`; toggle in the engine's cheat manager — per-core code-format behavior is NOT verified, never claim it), display options per system (`bm-display-<core>`: CRT scanline/vignette filter, integer-scale toggle, 4:3/16:9/fill/original aspect, fullscreen with `f` shortcut and honest button state; `prefers-reduced-motion`-safe, plus a quick-settings dialog), and an honest netplay notes section (engine advertises WebRTC room-code netplay as "being worked on"; NOT verified on the stable build — not enabled, not promised). See `skills/player-guide.md`.
- **Converter v2** (`converter.html`): user's file → self-contained playable `.html` (ROM embedded as base64; engine loads from the EmulatorJS CDN on first run). Three systems: GBA (`.gba`, mGBA core, 32MB max), Game Boy/Color (`.gb`/`.gbc`, Gambatte core, 8MB max), NES (`.nes`, FCEUmm core, 4MB max). **All three cores are BIOS-free** — zero extra files. Non-ROM formats refused gracefully (points at the Player). Template token contract: `__BM_GAME_NAME__`, `__BM_GAME_ID__`, `__BM_BUILD_DATE__`, `__BM_ROM_SIZE__`, `__BM_ROM_B64__`, `__BM_CORE__`, `__BM_CORE_LABEL__`, `__BM_SYSTEM__`, `__BM_HINT__`. See `skills/converter-multi-system.md`.
- **Party Planner** (`party-planner.html`): headcount + time + vibe + skill mix + inputs → timed rotation plan across party-tagged catalog games, with hand-the-controller rotation order and print-friendly output. Semantic HTML, keyboard-accessible, aria-live plan summary, reduced-motion aware. See `skills/party-planner-runner.md`.
- **Tournament 2.0** (`tournament.html`): single- or double-elimination brackets for 2–16 players — standard seeding (1v16, 8v9…) with a manual seed-order UI (↑↓ buttons, keyboard-operable) + randomize (no skill ratings exist on the site, so no rating-based seeding), honest first-round byes for top seeds at odd counts, best-of-N (1/3/5/7) per round, one game per round from the full catalog (party-tagged first) with optional per-round player voting (one vote each, ties go to the earliest-picked game), click/keyboard advancement with series-score tracking, double elim = winners + losers brackets and a grand final with bracket-reset logic, match history log + undo-last-result (session only), shareable bracket links (`#b=…`, validated import), champion banner (reduced-motion safe, no flashing), localStorage persistence (single/double save separately), print layout, and "Copy my bracket" text export. Accepts the party-planner handoff: `tournament.html?players=N&games=id1,id2` (real game ids only). Bracket math in `assets/js/bracket.js` (single, `scripts/test_bracket.js`, 82 assertions) and `assets/js/bracket-double.js` (double, `scripts/test_bracket_double.js`, 105 assertions); UI covered by `scripts/test_tournament10.js` (24 headless checks). See `skills/tournament-runner.md`.
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

### 5. "Move my save to another device" / "remap my controls" / "add a cheat" (Player 2.1)

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

### 6. "Run a tournament for game night" (tournament brackets)

```
1. GET api/v1/games.json → party-tagged games first for round games, but any
   catalog game works (the picker lists the full catalog, party first).
2. Get the player list (2–16 names), the format (single or double elim), and
   per-round prefs: game id + best-of (1/3/5/7).
3. Odd counts are fine — top seeds get honest first-round byes; never force-drop a player.
4. Double elim: one loss drops a player to the losers bracket; the grand final
   pits the winners champ vs the losers champ, with a bracket reset if the
   losers champ wins the first final.
5. Send the user to tournament.html, or build the handoff link yourself:
   tournament.html?players=8&games=bonk,tetrio,skribbl (real ids only).
   A finished party plan already links there with players + games pre-filled.
   Share a finished bracket with "Copy share link" (#b=... — validated on import).
   See skills/tournament-runner.md.
```

## Rate & freshness notes

- Static files: fetch as often as you like; nothing to rate-limit against.
- Freshness: check `generated_at` in any envelope before trusting counts.
- Breaking changes arrive as a new `v2/` path — never a silent shape change. Shared conventions: `API.md`.
- Source data lives in `data/`; regenerate with `python3 scripts/build.py` after edits.
- Skills: `skills/` — game-finder, emulator-setup, player-guide, legal-sourcing, collection-curator, homebrew-hunter, party-game-picker, party-planner-runner, converter-multi-system, retro-guide, classroom-games, system-picker, tournament-runner, kids-corner-guide.
- **Kids corner** (`kids.html`): 50 kid-safe games from a four-bar audit (no open chat, no unmoderated multiplayer chat or user content, no gambling, no graphic/horror content). Age bands 5–7 / 8–10 / 11–12, 🔇 No chat badges, parent notes per game, 👀 "play together first" flags where assessment couldn't be fully verified, reduced-motion default. `data/kids.json` holds every game's verdict (50 curated + 75 excluded with reasons); API `api/v1/kid-safe.json` (draft-07 schema) exposes the curated subset. Parent guide at `parents.html`: curation method, honesty policy (assessments not guarantees — "play the first 10 minutes together"), common-sense screen-time tips (no medical claims), save-state "one more level" trick. See `skills/kids-corner-guide.md`.
- System picker (`system-picker.html`): 4-question quiz (era, device power, game taste, tinkering tolerance) → recommended system + guide link + Player deep link. Weak devices exclude N64/PS1 honestly. Logic in `assets/js/system-picker.js`; skill `skills/system-picker.md` mirrors the weights for manual scoring.
- Player deep links: `player.html?core=<shortname>` pre-selects the system (`gb gba snes segaMD n64 psx` …) — used by all six system guides and the quiz result.
