# Button Mash — agent guide

How any agent (or script) uses Button Mash programmatically. Everything below is static JSON on a static host — no auth, no keys, no rate limits.

## Base URL

`data/v1/` relative to the site root (e.g. `https://<host>/button-mash/data/v1/`). Works from `fetch`, `curl`, or any JSON client.

## Start here

**`GET data/v1/index.json`** — self-describing manifest: description, legal note, endpoint catalog, usage. Every endpoint (except schemas) uses an envelope: `name`, `version`, `generated_at`, `endpoint`, `description`, `count`, plus the payload array under the endpoint's name.

## Endpoints

| Endpoint | What you get |
|---|---|
| `GET data/v1/games.json` | 213 game records (wave 8 added 11: Tristram, Die in the Dungeon CLASSIC, The Archives of Trevosa excluded-from-kids, Prerolled, Zombie Nest GBA, Dare To Doku, + 5 vanilla-JS wqnlll.github.io games; wave 14 added 37 (18 puzzle, 2 action, 6 roguelike, 2 idle, 4 retro, 5 cozy); wave 17 added 51 (16 MS-DOS + 15 arcade via the Internet Archive, 5 Flash-era Ruffle preservations, 9 action, 5 multiplayer, 3 idle, 3 puzzle — all 51 URLs curl-verified HTTP 200 same day). Each: `id`, `title`, `url` (curl-verified live 2026-10-11 — never invented), `genre` (`puzzle`/`action`/`roguelike`/`idle`/`multiplayer`/`retro`/`horror`/`cozy`), `controls`, `description` (original, CC0), optional `tags` (`party` + sub-tags like `drawing`/`arena`/`shooter`/`board`/`trivia`/`coop`/`word` power the party planner). Schema: `data/v1/schema/games.schema.json` |
| `GET data/v1/collections.json` | 24 hand-built collections (wave 8 added homebrew-radar + vanilla-js; wave 14 added playable-essays, open-source-web, code-playground, daily-word-games, cozy-toys, roguelike-forever; wave 17 added flash-back-machine, score-attack, tycoon-corner; makeover added curators-choice + start-here; retro-time-machine 5→9, idle-essentials 8→10, strategy-deep-cuts 7→11): `id`, `title`, `tagline`, `description`, `game_ids[]` (all IDs exist in `games.json`) |
| `GET data/v1/emulators.json` | 10 emulator software picks: `id`, `name`, `systems[]`, `url`, `license`, `platforms[]`, `notes`, `bios_required`. Software only — no ROMs/BIOS. |
| `GET data/v1/guides.json` | 24 guide summaries: `id`, `slug` (`guides/<slug>.html` page), `title`, `difficulty`, `time_minutes`, `summary`, `section_count`. Wave 25 added the 9th deep-dive guide, `cheat-codes` (Game Genie / GameShark / Konami Code, all claims verified outside the repo), closing the last wave-20 flagged guide gap. Includes 7 per-system guides (`gba`, `snes`, `nes`, `n64`, `ps1`, `genesis`, `gameboy`) — wave 24 closed the NES gap flagged in wave 20: best EmulatorJS core (verified against the official core list), settings that matter, performance tips, saves/cheats wired to Player 2.0, honest BIOS notes, Player deep link (`player.html?core=<core>`), and a verified homebrew starter pack. Wave 13 added 6 deep-dive guides (`homebrew-development`, `netplay`, `save-workflows`, `crt-shaders-display`, `accessibility-in-retro-gaming`, `preserving-your-games`); wave 17 added 2 more (`gamepad-setup`, `pico8-spotlight`, 8 sections each, all external URLs curl-verified) — 8 sections / 2,000+ words each, all external URLs curl-verified — surfaced as the **"Deep-dive guides" knowledge hub** (`emulation.html#deep-dives`, 6 cards), with a reading-craft design pass (`assets/css/guides.css` long-form typography, sticky spy TOC via `assets/js/guide-toc.js`, CSS scroll-progress bar, view transitions behind `prefers-reduced-motion: no-preference`, print stylesheet). Full texts: `data/guides.json` or `llms-full.txt`. Schema: `data/v1/schema/guides.schema.json` |
| `GET data/v1/homebrew-packs.json` | Per-system homebrew starter packs: the legal on-ramps for the Player. Every URL verified live 2026-10-11 (pdroms.de system sections, itch.io system tags, gbdev.io, n64.dev, psxdev.net, psx.dev, GameBrew lists). Schema: `data/v1/schema/homebrew-packs.schema.json` |

All schemas are **JSON Schema draft 2020-12**. Data is validated at build time (`python3 scripts/build.py`).

## How to use the directory programmatically

There are no query params — payloads are complete snapshots. **Fetch once, filter client-side.**

- Genres: `puzzle`, `action`, `roguelike`, `idle`, `multiplayer`, `retro`, `horror`, `cozy`.
- Link users straight to `url` to play, or to `games.html` for the browsable directory (search incl. tags, genre filters, tag filter tokens, favorites, random game, game of the day). Directory filters sync to the URL (`?q=&genre=&tags=a,b&favs=1`) — any filtered view is shareable; invalid params are dropped on load. Game cards carry anchored tooltips (title, tags, kid-safe, controls, domain).
- Legal lane (standing, non-negotiable): every `url` was verified live at build time. Emulation guides cover tools only — users supply ROMs they dumped from games they own. Never fabricate a ROM/BIOS download link.

## The centerpieces (for user questions)

- **Player** (`player.html`): bring-your-own-file EmulatorJS console, 20+ systems. File never leaves the user's machine. Core short names (official): `nes snes gb gba segaMD segaMS segaGG sega32x segaCD psx n64 nds pce vb atari2600 atari7800 lynx ngp ws coleco`. PSX/Sega CD need a user-dumped BIOS; the rest boot BIOS-free. **Player 2.1 tools** (all client-side): named save slots per game in the engine's IndexedDB store (`<base>.bm-slot-<n>.state`; save/restore/rename/export/import/delete; auto-save slot on a 1/5/15-min timer while the tab is open — all browser-local, "Keep in Browser" mode required), per-system keyboard+gamepad remap UI for Player 1 (`bm-remap-<core>` in localStorage, written into the engine's `ejs-<gameId>-<core>-<gameName>-settings` payload at boot; legacy per-game maps auto-migrated; verified per-core button labels from the 4.2.3 stable build; Esc cancels capture; the remapper is fully keyboard-operable), cheat-code entry per game (injected via the documented `window.EJS_cheats = [[name, code], ...]`; toggle in the engine's cheat manager — per-core code-format behavior is NOT verified, never claim it), display options per system (`bm-display-<core>`: CRT scanline/vignette filter, integer-scale toggle, 4:3/16:9/fill/original aspect, fullscreen with `f` shortcut and honest button state; `prefers-reduced-motion`-safe, plus a quick-settings dialog), and an honest netplay notes section (engine advertises WebRTC room-code netplay as "being worked on"; NOT verified on the stable build — not enabled, not promised). See `skills/player-guide.md`.
- **Converter 3.0** (`converter.html`): user's files → self-contained playable `.html` games (ROM embedded as base64, optionally deflate-compressed; engine loads from the EmulatorJS CDN on first run). **Batch conversion**: multi-file queue, sequential processing, per-file byte-level progress + ETA, cancel, error isolation (one bad file never kills the batch). Five systems: GBA (`.gba`, mGBA core, 32MB max), Game Boy/Color (`.gb`/`.gbc`, Gambatte core, 8MB max), NES (`.nes`, FCEUmm core, 4MB max), SNES (`.sfc`/`.smc`, Snes9x core, 6MB max), Genesis (`.md`/`.gen`, Genesis Plus GX core, 4MB max) — all five core CDN paths curl-verified 2026-10-11; caps follow real hardware (48 Mbit SNES carts, 32 Mbit Genesis ROM space). **All five cores are BIOS-free** — zero extra files. Honest validation: empty/all-zero/NES-without-magic refused; blank headers warn only (homebrew boots fine); GB/GBC header checksum verified; Genesis `SEGA`-string check warns only; SNES copier headers detected and kept as-is. Output upgrades: 4 compression levels (None/Fast/Balanced/Best, build-time-only cost) + one-click presets, custom title + cover art per batch, "▶ Player mode" deep link (`player.html?core=`). Non-ROM formats refused gracefully (points at the Player). Pure logic in `assets/js/converter-core.js` (UMD, tested by `scripts/test_converter12.js` — 60+ fixtures). Template token contract (11 tokens): `__BM_GAME_NAME__`, `__BM_GAME_ID__`, `__BM_BUILD_DATE__`, `__BM_ROM_SIZE__`, `__BM_ROM_B64__`, `__BM_CORE__`, `__BM_CORE_LABEL__`, `__BM_SYSTEM__`, `__BM_HINT__`, `__BM_COMPRESSED__`, `__BM_COVER__`. See `skills/converter-multi-system.md`.
- **Party Planner 2.0** (`party-planner.html`): guest list (2–16 names) + time + vibe + skill mix + inputs → timed rotation plan across party-tagged catalog games, plus: guest **game voting** (one vote each, re-vote moves, ties → earliest-picked game), **rotation scheduler** (hot-seat play groups of 4, offset-rotated so sit-outs are fair), **party timeline** (30-min setup → games → snack break → suggested tournament → free play, wall-clock times with a start time), **snack-break timer** (start/pause/reset, `role="timer"`), **kids party** toggle (restricts picks to the 113 kid-safe games, hot-seat only), **tournament handoff 2.0** (`?players=N&names=A,B&games=ids&format=`, pre-fills real names + voted games into a fresh bracket), shareable `#p=` party links (validated import), print party pack, copy-as-text. Logic in `assets/js/party2.js` (UMD; `scripts/test_party11.js`, 36 assertions); UI covered by `scripts/test_party_planner11.js` (30 headless checks). Semantic HTML, keyboard-accessible, aria-live summary/tally, reduced-motion aware. See `skills/party-planner-runner.md`.
- **Game Night** (`game-night.html`): the Curator deals your night — headcount (1-12), hours (15-240), vibe + skill mix + kids flag in; a marquee lineup out, ordered like a good set (warm-up, main events, showdown/deep-dive, cool-down) with per-game session + skill-floor curator estimates, genre variety, and timebox fit. Client-side only (nothing sent anywhere); the deal is a staggered marquee ceremony (aria-live announced, reduced-motion/FX-off skip to the full lineup). Engine: `assets/js/curator-night.js` (UMD, scoring v2.2.0 — distinct from the wave-A/B v1 quick-lineup engine, which stays untouched); UI: `assets/js/curator-night-ui.js`; styles: `assets/css/curator-night.css`. Tests: `scripts/test_curatornight21.js` + `scripts/test_gamenight22.js`. **Game Night 2.1 (wave 23) — saved lineups & the rematch**: a dealt night can be shelved under a name in the browser (localStorage key `bm.lineups.v1`, cap 12, in-memory fallback with an honest notice when storage is blocked; module `assets/js/curator-night-lineups.js`, UMD/DOM-free, records validated one by one so a corrupt entry never wipes the shelf). Saved nights are snapshots — same picks, same order, same estimates, never re-scored by later calibration. **Rematch** re-deals the saved setup with the saved picks held out of the deck: every slot fresh, same role curve, timebox intact (the main-event count follows the timebox, as on any fresh deal). Every saved night also has a **copy-as-text card** (name, setup, slots with URLs, estimates disclaimer). Tests: `scripts/test_lineups23.js`. **Wave-22 calibration**: the buckets are graded, not binary — player fit (40) grades each game's estimated seats against your group (room games hold at 40; pass-and-play decays 26→18→10→6 as the room grows; over-seated tables taper to a floor of 14), session fit (20) grades each sitting against the night's actual slot size, and 76 session + 22 seats overrides pin games the genre/tag buckets misread (Civilization ~60, Wordle ~5, Lichess seats 2, skribbl.io seats 12; wave 24 added the long-form puzzle pins and sat the golden-age cabinets down to 2). Every slot also carries an energy estimate (low-key/steady/high-octane) — the curve keeps the edges quiet and spends volume at the peak. All estimates are declared curator estimates in `plan_notes`, never measured data.
- **Tournament 2.0** (`tournament.html`): single- or double-elimination brackets for 2–16 players — standard seeding (1v16, 8v9…) with a manual seed-order UI (↑↓ buttons, keyboard-operable) + randomize (no skill ratings exist on the site, so no rating-based seeding), honest first-round byes for top seeds at odd counts, best-of-N (1/3/5/7) per round, one game per round from the full catalog (party-tagged first) with optional per-round player voting (one vote each, ties go to the earliest-picked game), click/keyboard advancement with series-score tracking, double elim = winners + losers brackets and a grand final with bracket-reset logic, match history log + undo-last-result (session only), shareable bracket links (`#b=…`, validated import), champion banner (reduced-motion safe, no flashing), localStorage persistence (single/double save separately), print layout, and "Copy my bracket" text export. Accepts the party-planner handoff: `tournament.html?players=N&names=A,B&games=id1,id2&format=single|double` (real guest names + game ids; params mean a fresh tournament). Bracket math in `assets/js/bracket.js` (single, `scripts/test_bracket.js`, 82 assertions) and `assets/js/bracket-double.js` (double, `scripts/test_bracket_double.js`, 105 assertions); UI covered by `scripts/test_tournament10.js` (24 headless checks). See `skills/tournament-runner.md`.
- **Genre deep dives** (`genres/roguelike.html`, `genres/cozy.html`): curated lists from the catalog with start-here picks and why-each-fits blurbs.
- **Trophy Room** (`trophy-room.html`): persistent play-tracking across the whole catalog. Every game card carries **Played** / **Beaten** prize-token toggles (keyboard-operable, `aria-pressed`); state lives in localStorage under `bm.trophy.v1` (in-memory fallback with an honest "memory-only mode" notice when storage is blocked). Beating a game implies playing it; un-playing clears beaten. Favorites stay in wave-16's `bm_favs_v1` — the store reads them, never duplicates, so the directory's ♥ filter and the wall agree. The room shows: a stat band (played/beaten/favorites/day-streak/prizes), 8 genre shelves with static CRT-style completion dials (SVG, reduced-motion safe) + stacked played/beaten bars, a 16-prize achievement case (real rules: first-play, first-beat, heart-5/20, player-10/50/100, beater-5/25, puzzle-breaker, genre-tourist/master, streak-3/7 via UTC day keys, shelf-clearer, marathon), per-collection progress (also painted on every `collections.html` shelf), and JSON export/import (`bm.trophy.export` schema v1 — validated atomically, corrupt imports rejected with the current wall untouched). Pure logic in `assets/js/trophy-core.js` (UMD; `scripts/test_trophy18.js` covers state, achievements, streaks, export/import, migrations).

## Example workflows

### 1. "Find a multiplayer party game"

```
1. GET data/v1/games.json
2. games.filter(g => g.genre === "multiplayer")
   → skribbl.io, gartic-phone, jklm, codenames, secret-hitler, make-it-meme…
3. Pick one with private rooms: skribbl.io → send the user to https://skribbl.io/
```

### 2. "Convert my own retro files to browser games"

```
1. Point them at converter.html — drop files (batch OK: GBA/GB/GBC/NES/SNES/Genesis),
   system auto-detected from the extension.
2. All five cores (mGBA / Gambatte / FCEUmm / Snes9x / Genesis Plus GX) are BIOS-free: no extra files needed.
3. Options: per-game title, compression level (Balanced default; Best = smallest/slowest build,
   or one-click presets), optional cover art (≤2MB, embedded in every output).
4. Validation is structural: empty/all-zero/NES-without-magic refused; blank headers warn only
   (homebrew boots fine); Genesis SEGA-string check warns only; SNES copier headers kept as-is.
   One bad file never stops the batch; Cancel stops after the current file.
5. Warn above the size threshold (16MB GBA / 2MB GB / 3MB SNES / 2MB Genesis / 1MB NES); refuse above the max.
   Big files → player.html instead. Each output also carries a ▶ Player mode deep link (?core=).
6. Legal check: only their own dump / homebrew. See skills/legal-sourcing.md.
```

### 3. "Something cozy for a rainy day"

```
1. GET data/v1/collections.json
2. collections.find(c => c.id === "rainy-day-cozy") → game_ids
3. Resolve titles via games.json, or just link collections.html.
```

### 4. "Plan our game night" (party planner 2.0)

```
1. Guest list: 2–16 names (drives rotation, voting, tournament handoff).
2. GET data/v1/games.json → filter games where tags includes "party".
3. Map vibe to sub-tags: chaotic→arena/drawing/word, competitive→shooter/arena/racing/sports,
   cooperative→coop/board, creative→drawing/word, chill→trivia/board/word.
4. Apply skill mix + input limits (shooters need keyboard+mouse).
5. Kids party? Skip vibe/skill — pool = the 113 kid-safe games (data/v1/kid-safe.json),
   youngest age band and below, all hot-seat.
6. 20-min slots (30 for chill/cooperative), capped at 8; rotation groups of 4,
   offset-rotated so sit-outs are fair; guests vote (one vote each, ties → earliest pick).
7. Timeline: 30-min setup → games (snack break mid-list) → tournament → free play;
   wall-clock times if a start time is set.
   Handoff: tournament.html?players=N&names=A,B&games=ids&format=single|double (fresh tournament).
   Share: #p= party link (validated). Print party pack / copy-as-text available.
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
1. GET data/v1/games.json → party-tagged games first for round games, but any
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
- **Kids corner** (`kids.html`): 113 kid-safe games from a four-bar audit (no open chat, no unmoderated multiplayer chat or user content, no gambling, no graphic/horror content). Age bands 5–7 / 8–10 / 11–12, 🔇 No chat badges, parent notes per game, 👀 "play together first" flags where assessment couldn't be fully verified, reduced-motion default. `data/kids.json` holds every game's verdict (113 curated + 100 excluded with reasons); API `data/v1/kid-safe.json` (draft-07 schema) exposes the curated subset. Parent guide at `parents.html`: curation method, honesty policy (assessments not guarantees — "play the first 10 minutes together"), common-sense screen-time tips (no medical claims), save-state "one more level" trick. See `skills/kids-corner-guide.md`.
- System picker (`system-picker.html`): 4-question quiz (era, device power, game taste, tinkering tolerance) → recommended system + guide link + Player deep link. Weak devices exclude N64/PS1 honestly. Logic in `assets/js/system-picker.js`; skill `skills/system-picker.md` mirrors the weights for manual scoring.
- Player deep links: `player.html?core=<shortname>` pre-selects the system (`gb gba snes segaMD n64 psx` …) — used by all seven system guides and the quiz result.
