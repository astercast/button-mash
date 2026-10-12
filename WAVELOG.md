# Button Mash — WAVELOG

Running record of build waves. Newest first.

## Wave 19 — 2026-10-12 — "Spotlight": the Curator's metadata surfaces (PAUSED MID-BUILD for the Extreme Makeover directive)

**Status: code complete, validation incomplete — paused 2026-10-12 ~01:20 PDT on the
user's STOP for the Extreme Makeover wave. Work is committed and pushed; nothing
is lost. To resume: re-run `node scripts/test_wave19.js` when the VM is quiet
(loadavg 9 during this run caused documented file:// flakes), then finish the
makeover wave's own validation.**

**What shipped (all in the working tree):**
- **`api/games.js` gains `?id=<game-id>`** — single-game lookup with the same
  enriched shape as the list route (`multiplayer`/`kid_safe`/`vibes[]`);
  wins over the other filters (validated first), 404 `NOT_FOUND` on miss,
  400 `BAD_INPUT` on a bad id shape. Enrichment factored into `enrichGame()`.
- **New `game.html` — per-game metadata file** (`assets/js/game-detail.js` +
  `assets/css/game-detail.css`): `?id=` required; static-first render from
  `api/v1/games.json`, then the Curator live probe (`/api/games?id=`) overlays
  multiplayer/vibes with the honest live/cached badge (badge node preserved
  across re-renders). Sections: GAME FILE kicker, pixel title, genre/tag chips,
  description, controls, big verified play button (external, new tab), played/
  beaten toggles on the shared Trophy store, "On these shelves" cross-links
  (`collections.html#shelf-<id>`), 4 related same-genre cards, prev/next
  through the catalog, copy game-file link. Honest states: missing/unknown/
  bad id → "NO GAME ON THIS CHANNEL" + directory link; catalog failure →
  "CABINET OFFLINE".
- **`collections.html` Curator-wired**: inline script extracted to
  `assets/js/collections.js`; static-first render from `api/v1/collections.json`,
  then `/api/collections` probe overlays resolved titles/URLs with the
  live/cached badge (new `#collections-badge` in the hero). Every shelf row
  gains a "» file" deep link to `game.html?id=`. Trophy progress strips,
  jump nav, copy-shelf-link, and `#shelf-` deep-link scroll all preserved.
- **Card tooltips → game files**: every card tooltip (arcade.js) gains a
  "» full game file" link to `game.html?id=`.
- **Docs**: API.md (`?id=`), GO_LIVE.md/API.md/LIVE_CHECKLIST.md Vercel
  runtime corrections (see below), llms.txt + sitemap via `build_site.py`
  (game.html added to PAGES).
- **Vercel deploy lessons folded in (2026-10-12, three corrections)**: final
  rule — never set `functions.*.runtime` for Node (omit entirely; Vercel
  auto-detects; both nodejs22.x and nodejs20.x fail validation), each
  explicit function path carries `{"maxDuration": 10}` (empty `{}` also
  fails), explicit paths only (never globs), and the functions map is NOT an
  allowlist — no static `.js` may live under `api/` (audit: clean — only the
  5 function files; `api/v1/` only `.json`; zero basename collisions).
  LIVE_CHECKLIST.md carries the full rule. vercel.json validated as JSON.
- **Git attribution**: repo-local `user.email`/`user.name` overrides removed;
  commits use the global `astercast <255064122+astercast@users.noreply.github.com>`.
- **Agentic surface**: `check_api_workflows.js` WF21 (9 checks) —
  `?id=` contract, game.html wiring, game-detail.js static-first + badge
  preservation, collections.js extraction + probe, tooltip deep link,
  API.md, sitemap/llms, vercel.json rule pin, legal lane.

**Validation so far:**
- `scripts/build.py`: **BUILD OK — 213 games, 22 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (41 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (40 pages, 1304 local links)**
- `node scripts/check_api_workflows.js`: **191/191 pass (WF1–WF21)**
- `tests/api.test.sh`: **40/40 green** (incl. 4 new `?id=` checks)
- `node --check`: clean on all new/edited JS
- `scripts/test_wave19.js` (new, 30 headless checks): **INCOMPLETE — environment-blocked**.
  Loadavg 8.99 on 2 CPUs during the run (parallel agents). Two real bugs were
  found and fixed in the code before the pause: (1) the detail page's trophy
  row reused the bare `trophy-row` class without `data-game`, so arcade.js's
  shared `syncTrophyRow` disabled its buttons on the first store change —
  fixed by speaking the card protocol (`data-game` + `data-trophy`); the
  headless run proved the store itself correct (`toggleBeaten` →
  `{played:true,beaten:true}`) and the click path dead, which is the
  signature of this bug. (2) The shelf panel said "Not on any curated shelf"
  when the shelf list merely failed to load — now an honest "SHELVES OFFLINE"
  state (`null` vs `[]`). Remaining: re-run the suite when quiet to confirm.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; no new
external links (all deep links are same-origin; play buttons reuse the
catalog's verified URLs).

## Wow wave 1 — 2026-10-11 — "Attract Mode": the homepage IS the cabinet

**What shipped** — the first wow-moment wave: the homepage is now a full arcade
cabinet in demo mode, and the Player page gets a full CRT treatment. Both are
enhancement layers over real data and the real EmulatorJS player; the FX toggle
stays the sensory-envelope kill switch for all of it. The Arcade identity is
extended, not redone.

- **Cabinet homepage** (`index.html` hero → `#arcade-cabinet`): marquee with
  animated chase-light bulb strips (reuses the `--bulb`/`chase-x` token system),
  pixel brand + tagline, screen bezel, neon side-art panels, control deck,
  kick plate. The sections below (game of the day, shelf sampler, craft cards)
  are untouched — `directory.js` drives them null-guarded as before.
- **Demo loop** (`assets/js/attract.js`, new): 6 spotlight slides drawn from the
  REAL 213-game catalog — deterministic daily rotation (genre round-robin with
  a seeded offset, never canned slides), each slide carrying the game's real
  title/genre/description/tags/kid-safe badge/controls and a
  "» PLAY AT {domain}" deep link to the catalog's curl-verified URL (new tab).
  High-score-style stat callouts rotate real catalog facts (213 games on the
  shelf, kid-safe count, curated-shelf count) plus the player's REAL Trophy
  Room progress (`store.counts()` / `achievements()` / `streak()`) wherever it
  exists — e.g. "YOU: 12 PLAYED · 3 BEATEN", "» 3 PRIZES ON YOUR WALL".
  Skippable: prev/next/pause transport (real buttons, `aria-pressed`), inactive
  slides `inert` + `aria-hidden`, an `aria-live` announcer, politeness pauses on
  hover/focus/hidden-tab, and an honest "» CABINET OFFLINE" state with a
  directory link if the catalog fetch fails.
- **INSERT COIN** (`#insert-coin` coin plate): plays the CRT screen-off collapse
  + white flash (transform/opacity keyframes only), then lands on the real
  `games.html`. Plain-link behavior preserved for new-tab clicks, no-JS,
  reduced-motion, and FX-off (all navigate immediately).
- **Reduced motion** → no demo at all: a static cabinet with the FULL game list
  (all 213, alphabetical, real links + genre chips + kid-safe marks), transport
  hidden, zero animation anywhere. **FX-off** → chase bulbs, coin blink, demo
  cycle, and CRT layers all die (MutationObserver stops the timers the moment
  the toggle flips); manual skips still work instantly, content fully reachable.
- **Mobile** (≤720px/≤480px): side art collapses, deck wraps, coin plate goes
  full-width, slide copy simplifies (tags hidden, description clamped), zero
  horizontal overflow at 390px.
- **CRT player** (`player.html` + `assets/css/attract.css`, new): scanline roll
  (seamless 6px loop), curved glass sheen + vignette above the engine canvas,
  phosphor glow on the console readout, CRT screen power-on at boot and
  power-off collapse on eject — all `pointer-events: none` overlays, so the
  EmulatorJS engine is never touched and the wave-3.1 null-guard discipline
  stays. Gated on the per-system CRT display pref; `html.fx-off` and
  `prefers-reduced-motion` reduce it to static scanlines or nothing.
- **Agentic surface**: `check_api_workflows.js` gained **WF20 (13 checks)** —
  cabinet markup, real-data demo, progress callouts, skippability/a11y, insert
  coin, reduced-motion, FX kill, mobile, CRT player, power hooks, animation
  discipline (all keyframe blocks scanned: transform/opacity only), honest
  offline state, legal lane. New `scripts/test_wow1.js` headless suite.

**Validation (wow wave 1):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 22 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (40 pages, 213 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 39 pages, 1261 local links, 76 external links, 0 broken**
- `node scripts/check_api_workflows.js`: **182/182 pass (WF1–WF20)**, 0 failures
- `node --check`: clean on attract.js, player.js, test_wow1.js, test_wow1_powerunit.js, check_api_workflows.js
- `node scripts/test_wow1.js` (section runs, each zero pageerrors): **desktop 38/38** — 6 real slides, determinism across reloads, skip/pause/keyboard transport, announcer, callout rotation incl. seeded trophy progress ("YOU: 1 PLAYED"), screen-off → games.html (click + keyboard), FX-off kills cycle/chase/blink (manual skip still instant), 4 contrast pairs AA (10.30/18.90/17.08/12.43:1); **motion 5/5** — full 213-game static shelf, no slides, transport hidden, coin plate works, no chase; **mobile 3/3** — 390px zero overflow, side art collapses, full-width coin plate; **player 4/4** — crt-on engages from display prefs, overlay present, crt-roll active, power-on→keyframes mapping
- `node scripts/test_wow1_powerunit.js`: **13/13** — the powerOnScreen/powerOffThen/crtMotionOK branching logic run against the real shipped functions (immediate vs 400ms-delayed paths, class add/remove, all four kill conditions)
- Screenshots inspected: cabinet slide 1, slide 2, insert-coin screen-off frame (collapse + flash visible), fx-off static cabinet, reduced-motion full shelf, mobile 390px
- Not completed (environment-blocked, see flakes): the 5 remaining player-tail checks (eject immediate path, power-off keyframe mapping, fx-off overlay kill, reduced-motion player) and `~/workspace/smoke/test.js` — the VM's renderer crashes under parallel-agent load (loadavg 7–9 on 2 CPUs; `Target closed`, `Runtime.getProperties/callFunctionOn` CDP timeouts). The code paths are covered by the power-unit tests + WF20 static checks + the identical CSS machinery verified live. Re-run when the machine is quiet.
- **Flakes investigated, not shipped as bugs**: (1) `Page.captureScreenshot` protocol timeout under load — screenshots wrapped in a never-fail helper; (2) renderer stalls/crashes under parallel-agent load — sections run independently (`desktop|motion|mobile|player`), stalled waits retry once with a fresh navigation, then report diagnostics; (3) `page.reload()` wedged repeatedly while `page.goto()` to the same URL recovered — the suite uses goto throughout; (4) `emulateMediaFeatures(reduce)` leaked to later pages in this puppeteer-core version — every page sets its media features explicitly; (5) the index FX-off test persisted `bm-fx=off` in shared localStorage and poisoned later sections — the suite resets it explicitly; (6) under heavy load, file:// subresource loads fail intermittently (`net::ERR_FAILED`) — including `player.js` itself, leaving a script-less page that still answers localStorage reads: player assertions are gated on a `window.BM21 + #crt-overlay` load sentinel (proving the script loaded AND its init ran) with a fresh-navigation retry.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; no new external links (slide PLAY links reuse the catalog's curl-verified URLs); new files carry no download phrasing (explicit WF20 check).

## Vercel Wave B — 2026-10-11 — "The Curator": frontend integration + GO_LIVE.md

**What shipped** — the fallback contract goes live in the browser, per `~/workspace/server-program/ARCHITECTURE.md` §3 (service `mash-curator`). The site now calls `/api/*` first and falls back to the static `api/v1/` JSON with honest badges; it never looks broken when functions are cold or down.

- **`assets/js/api-client.js`** — the spec's `fetchWithFallback` reference implementation, copied verbatim (§3.2): 7s live timeout, `live` / `waking` / `cached` / `none` badge states, honest "cached · updated HH:MM" timestamps from the data's own `generated_at`, never rejects.
- **Game directory wired** (`games.html` + `assets/js/directory.js`): renders the full 213-game catalog from the static `api/v1/games.json` immediately (page never blank), then probes `GET /api/games?limit=200`. Live → fresh enrichment (`multiplayer`/`kid_safe`/`vibes`) overlaid by id, badge `live`. Miss → static stays, badge `cached · updated HH:MM`. Badge is `<span class="api-badge" role="status" tabindex="0">` — screen-reader announced, keyboard-focusable.
- **Quick game-night lineup** (`party-planner.html` + `assets/js/game-night-ui.js`): new widget — players 1–12, time 15–240 min, 5 engine vibes, kids flag → "Deal my lineup". POSTs `/api/game-night` first (7s timeout); on miss falls back to the client engine over static `api/v1/games.json` + `api/v1/kid-safe.json`. Renders lineup cards (title link, genre, slot, score/100 bar, why[]), plan_notes, and an honest meta line ("computed live by the Curator" vs "computed in your browser"). Invalid inputs rejected client-side with `role="alert"`.
- **`assets/js/game-night.js`** — browser twin of `lib/game-night.js` ("same function, two homes"). **Regenerated by `scripts/build.py`** (`sync_game_night_client` step) so the two can never drift; parity-gated by `scripts/test_gamenight_parity.js` (**256/256 cases identical**, scoring v1.0.0).
- **Badge CSS** (`assets/css/components.css`): four states — live = neon-lime dot, cached = neon-amber dot, waking = subtle cyan, none = hidden; `:focus-visible` ring; zero keyframes (reduced-motion safe by construction). Contrast audited: 15.91 / 10.56 / 6.72 :1 — all pass WCAG AA.
- **`GO_LIVE.md` rewritten** to the §11 template (11 sections): live-ready banner, 5-function roster, prerequisites, exact-click hookup, env var table, Hobby limits table, cold-start behavior, cron behavior, custom domains, rollback, cost rules with **Standard build machine, never Turbo** ($38.64 invoice 1ZU1WJJS-0012).
- **`API.md`** documents the 5 live functions alongside the static files (envelope contract, rate limits, fallbacks).
- **`check_api_workflows.js` + WF19** (10 new checks, **168/168 pass**): api-client contract, badge wiring/a11y attrs, directory live-first, twin sync, panel structure, POST-first fallback, badge CSS states, GO_LIVE template, API.md docs, legal lane.
- **`test_trophy18.js`**: games.html pageerror check now tolerates the expected `/api/*` probe failure over file:// (tracked via `requestfailed`, filtered precisely) — the fallback contract's designed behavior, same "known expected noise" pattern as the smoke test's CDN note.

**Validation (Vercel Wave B):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 22 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (40 pages, 213 game URLs, 0 piracy links)**; `check_links.py`: **1259 local links, 0 broken**
- `node scripts/check_api_workflows.js`: **168/168 pass** (WF1–WF19)
- `tests/api.test.sh`: **36/36 green** (script's own harness); `node scripts/test_gamenight_parity.js`: **256/256**
- Regression: `test_party_planner11` ALL PASS, `test_trophy18` ALL PASS, `test_tournament10` 26/26, `test_bracket` 82/82
- **Headless end-to-end** (26/26 checks): live badge + 213 cards; **waking state** (2.5s cold-start sim) shows over the complete grid then live-updates; **functions-disabled** → cached badges with honest timestamps, 213 cards, lineup via client engine (2 picks, kids path all kid-safe); invalid input rejected; zero app console/page errors; mobile 390px clean (widget maxRight=370); badge Tab-reachable
- **Cold-start** (§12.4): harness cold first-hit 0.066s / warm 0.003s; infra cold-start (1–3s typical) simulated with 2.5s delay — waking UX confirmed; true infra timing re-measured on preview deploy
- **Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; engine corpus is the 213 curl-verified browser games only

**Not in this wave** (needs the user's deploy approval): preview-deploy verification (`/api/health` on `*.vercel.app`, manual cron trigger with secret, infra cold-start timing), cross-site `api-client.js` byte-diff (coordinator).

## Vercel Wave A — 2026-10-11 — "The Curator": serverless API + game-night engine

**What shipped** — the repo's first server layer, per `~/workspace/server-program/ARCHITECTURE.md` (service `mash-curator`). Five functions, zero npm dependencies, `nodejs22.x`, envelope-only responses:

- **`api/health.js`** — §1.4 health: status ok/degraded (never 5xx), function roster, per-file freshness (5 static JSONs, 7-day SLA), checks booleans. Edge-cached s-maxage=60.
- **`api/games.js`** — GET, filters `?genre= ?q= ?players= ?system= ?limit=` (default 50, max 200). Every game enriched with real derived fields (`multiplayer`, `kid_safe`, `vibes`, `system:"browser"`). Unknown system → honest empty list + note (corpus is browser games only); unknown genre → 400 BAD_INPUT. Fallback: `api/v1/games.json`.
- **`api/collections.js`** — GET all 22 (or `?id=` single, 404 on miss), game_ids resolved to real catalog titles/URLs.
- **`api/game-night.js`** — POST, stateless deterministic engine: `{group_size 1-12, minutes 15-240, vibe[], systems?, kids?}` → `{lineup, plan_notes, scored_from, scoring_version, scoring_weights, metadata_as_of, inputs_echo}`. Scoring: player fit 40 + session 30 + vibe 20 + kids 10, ties by title. Corpus-only (213 curl-verified browser games) — the safety property. Impossible constraints (e.g. `systems:["ps1"]`) → honest empty lineup + `no_lineup_reason` + why. kids=true restricts to the 113 kid-safe games. Compute-bucket rate limit (20/min). Client fallback parity: same weights ship in `assets/js/game-night.js` (wave B).
- **`api/cron/curator.js`** — weekly `0 10 * * 1` UTC: 6 emulator release Atom feeds + 2 itch feeds, parallel 4s fetch, diff vs `api/v1/curator-watch.json`, commit on change via GitHub Contents API (content-hash, SHA-retry). New releases are tracked for human review — never auto-published to the catalog. itch bot-gates (403) → recorded as failed source, not "no games". 60s duplicate cooldown. 10s budget guard (commit skipped if <3s remains).
- **`lib/`** — the five spec helpers (envelope, fetchx, ratelimit, cronauth, github) + `lib/game-night.js` (shared scoring). **Commit-back degrade:** the fine-grained PAT (`GITHUB_REPO_TOKEN`, contents:write) is still pending the user's decision — the cron detects the missing token and degrades to read-only (computes + returns the fresh diff, persists nothing, `degraded:true` + human note). Documented in `lib/github.js` and the cron header.
- **`vercel.json`** — buildCommand `python3 scripts/build.py` (timed 0.54s, <60s), outputDirectory `.`, nodejs22.x, cron lint (daily-or-slower), §2.2 headers, cleanUrls, trailingSlash false.
- **`api/v1/schema/envelope.json`** — §1.10 envelope schema (JSON Schema draft 2020-12).
- **`tests/api.test.sh` + `tests/run_local.js` + `tests/validate_envelope.py`** — 36 checks: envelope asserts, schema validation, 400 gates, 401 gates, static fallback, cron read-only degrade + duplicate cooldown, vercel.json cron lint, game-night determinism + kids + no-lineup edge cases, 50-hit smoke (no 429s, p95<2s). **36/36 green.**

**Validation (Vercel Wave A):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 22 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (40 pages, 213 game URLs, 0 piracy links)**
- `node scripts/check_api_workflows.js`: all workflows pass (exit 0)
- `tests/api.test.sh`: **36/36 green** against the local harness (real function execution)
- Cron exercised end-to-end: 8 feeds checked, honest-degraded on VM-slow network (all timed out at 4s; github.com reachable at ~8.8s via curl — production will be faster; itch 403 bot-gate confirmed), Atom parser verified against real mGBA feed
- Existing suites: `test_party11`, `test_bracket`, `test_bracket_double`, `test_converter12` pass. `test_party_planner11`, `test_tournament10`, `test_identity16`, `test_player21`, `test_trophy18`, `test_wave17` fail on the pristine tree too — missing `puppeteer-core` (environment limitation, pre-existing, not a regression)

**Legal lane**: unchanged — zero ROMs hosted, zero ROM/BIOS download links. The game-night engine's corpus is the 213 curl-verified browser games; emulator/ROM territory is unreachable by design (unsupported `systems` → honest no-lineup).

**Not in this wave** (Wave B): frontend wiring (`assets/js/api-client.js` + badges), GO_LIVE.md rewrite to the §11 template, API.md function docs, preview-deploy verification.

## Wave 18 — 2026-10-11 — "The Trophy Room": persistent play-tracking across the catalog

**What shipped** — the flagship feature wave: every game card now carries persistent state, and a new Trophy Room page is the player's wall. All real logic, all browser-local, The Arcade identity extended (achievements as prize tokens, completion rings as CRT dials, zero keyframe animation — reduced-motion safe by construction).

- **Persistent per-game state** (`assets/js/trophy-core.js`, UMD + DOM-free so node tests run the same code the browser ships): mark **played** / **beaten** on any game card via two prize-token toggle buttons (keyboard-operable, `aria-pressed`, disabled until the store is ready). State lives in localStorage under `bm.trophy.v1` (namespaced `bm.trophy.*`); when localStorage is blocked (private mode/disabled) an in-memory fallback takes over and the Trophy Room shows an honest "memory-only mode" notice. Rules with teeth: beating a game implies playing it (both flags set together); un-playing clears beaten; unknown catalog ids are sanitized out on load; corrupted stored blobs start fresh with a flag the UI surfaces.
- **Favorites sync with wave 16**: favorites stay in `bm_favs_v1` — the trophy store reads them through an injected provider, never duplicates them, so the directory's ♥ filter and the wall can never disagree. New `BM.setFavs(ids)` union-merge (for imports) in store.js.
- **Achievement engine, 16 real rules** (`first-play`, `first-beat`, `heart-5/20`, `player-10/50/100`, `beater-5/25`, `puzzle-breaker`, `genre-tourist/master`, `streak-3/7`, `shelf-clearer`, `marathon`): evaluated from the real catalog on every mutation. Streaks use seeded UTC day keys (`floor(Date.now()/86400000)`); "beat every game in a collection" is checked against the actual collection lists. Earning a prize fires a "» PRIZE WON" toast (aria-live, no motion).
- **Completion math**: per-genre played/beaten % and counts, per-collection progress (stacked amber=played / lime=beaten bars), painted on every `collections.html` shelf and in the Trophy Room.
- **The Trophy Room** (`trophy-room.html`): stat band (played/beaten/favorites/day-streak/prizes), 8 genre shelves with static SVG CRT completion dials (phosphor glow, `role="img"` labels), the 16-prize achievement case (earned = lit token + date won; unearned = dim + its rule, no mysteries), 22 collection rows with bars deep-linking to their shelves, and backup/restore: JSON export download + import textarea/file-picker, schema `bm.trophy.export` v1 with atomic validate-first-then-commit (corrupt imports rejected with the current wall untouched, unknown ids counted as dropped), and reset (favorites kept, stated). Nav item on all 39 pages (correct `../` on guides/genres), footer links, hero CTA on games.html.
- **Stale-count fix folded in**: games.html's static "162 games." hero is now data-driven from the live catalog (`#games-hero-count`, static fallback = 213); index.html's static fallbacks 162 → 213.
- **Agentic surface**: `check_api_workflows.js` gained **WF18 (18 checks; 158/158 pass total)** — UMD/API surface, schema constants, 16 achievements, cascade rules, atomic import, page structure, sitemap/llms wiring, nav coverage, card/collection/arcade/store wiring, reduced-motion CSS, legal-lane phrasing. New `scripts/test_trophy18.js`: **70/70** (41 node unit checks: transitions, cascades, completion math, all 16 rules, streak edge cases, export/import round-trips, 4 corruption classes, unknown-id sanitizing, future-version refusal, reset; 29 headless: 213 card rows, click/keyboard toggling, persistence, prize toast, fav sync, full wall render, seeded stat/prize/export assertions, import round-trip + corruption recovery in-page, 22 shelf strips with aria-labels, mobile 390px zero-overflow, reduced-motion render, zero pageerrors throughout).
- **Docs**: AGENT.md centerpieces + trophy bullet; `build_site.py` PAGES + llms.txt Play section (sitemap regenerated).

**Validation (wave 18):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 22 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (40 pages, 213 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 39 pages, 1255 local links, 76 external links, 0 broken**
- `node scripts/check_api_workflows.js`: **158/158 pass (WF1–WF18)**, 0 failures
- `node --check`: clean on trophy-core.js, trophy-room.js, arcade.js, store.js, directory.js, test_trophy18.js, check_api_workflows.js
- `node scripts/test_trophy18.js`: **70/70 pass, zero pageerrors** (new)
- Regression: test_bracket 82/82, test_bracket_double 105/105, test_party11 36/36, test_converter12 66/66, test_identity16 41/41, test_wave17 29/29, test_player21 ALL PASS, test_party_planner11 ALL PASS, test_tournament10 26/26
- `~/workspace/smoke/test.js`: zero pageerrors (only the known expected CDN tunnel noise on player.html)
- Screenshots verified: trophy room wall (stat band, 8 dials, 16-prize case with 3 earned, 22 collection rows, backup panel), games.html card token states (played amber/beaten lime pressed + prize toast), collections shelf progress strips (stacked bars + counts), mobile 390px layout
- **Bugs found & fixed in testing**: (1) `BM.toggleFav` never dispatched `bm:favs-changed` — programmatic fav changes were silent, so the Trophy Room wouldn't re-render (now dispatched in toggleFav; card handler relies on it). (2) Favorite-based achievements (heart-5/20) were never evaluated on fav changes — `bm:favs-changed` now re-runs the achievement rules with prize toast + change fan-out. (3) First headless run's click failures were the wave-16-documented smooth-scroll stale-coordinate harness flake — suite now uses instant-scroll settled in-page clicks.
- **Flake investigated, not shipped as a bug**: one test_identity16 `waitForFunction` timeout under high load (re-run 41/41 green) — same environmental renderer stall documented in wave 16.

**Legal lane**: unchanged — zero new external links (all trophy features are client-side on existing data); new files carry no ROM/BIOS download phrasing (explicit WF18 check); no user-supplied-file flows touched.

## Wave 17 — 2026-10-11 — Catalog expansion: 162 → 213 games (+51) + 3 collections + 2 deep-dive guides

**What shipped** — the second-biggest catalog expansion (wave 14's +37 was the record): 51 new legal games, every URL curl-verified HTTP 200 same day (2026-10-11), 3 new hand-built collections, and 2 new deep-dive guides. The Arcade identity untouched (new pages ship in the wave-13 guide template + wave-15/16 identity system; no new genres, so no new art-strips needed).

- **51 new games, all curl-verified** (verification harness: `verify_retry.py`, 4 attempts per URL — archive.org is flaky from this VM with transient 000/502s; every shipped URL returned a real HTTP 200):
  - **16 MS-DOS classics** (Internet Archive DOSBox): SimCity (1989), Lemmings, The Secret of Monkey Island, Duke Nukem 3D (shareware), Zork I, Sid Meier's Civilization, Alone in the Dark, Transport Tycoon Deluxe, Theme Park, Master of Orion, Railroad Tycoon, Quake (shareware), SimCity 2000, The Oregon Trail Deluxe, Commander Keen 3, Commander Keen: Keen Dreams.
  - **15 arcade classics** (Internet Archive MAME): Space Invaders, Dig Dug, Joust, Centipede, Missile Command, Defender, Q*bert, Tempest, Robotron: 2084, 1942, Galaga '88, Ms. Pac-Man/Galaga 20th Anniversary, Bubble Bobble II, Street Fighter Alpha 2, Congo Bongo.
  - **5 Flash-era preservations** (Archive Ruffle player): Fancy Pants Adventure: World 1, Alien Hominid, Dad 'n Me, Time Fcuk, Achievement Unlocked.
  - **9 official web versions**: Run 3 (player03.com), Subway Surfers + Stickman Hook (official Poki pages), arras.io (open-source diep successor), Hole.io (official), Tanki Online, mope.io, YoHoHo.io, Stumble Guys (`/play` page), ClassiCube (open-source web client).
  - **3 idle**: Synergism (open-source), Realm Grinder + AdVenture Capitalist (official Kongregate pages).
  - **2 puzzle**: Simon Tatham's Puzzles (official JS builds), Sort the Court (itch.io).
  - **1 puzzle-platformer**: counted above in Flash (Time Fcuk).
  - Genre totals now: p48/a39/r15/i15/m30/re44/h6/c16 (retro 13→44 — the archive shelves are doing their job).
- **19 candidates dropped per the 200-discipline**: the big-name Internet Arcade takedowns (Pac-Man, Galaga, Donkey Kong, Frogger, Asteroids, Contra, TMNT, Simpsons, Final Fight, SF2, Bubble Bobble all 404 — removed from the collection), Commander Keen 5 (404), X-COM (not on the Archive), gartic.io (403 bot-gated), 1v1.lol (unreachable), hextris.io (down), republia-times (404), prestige-tree + evolve-idle (moved/404), crazy-kong (unlicensed Donkey Kong bootleg — dropped on legal-lane principle even though the item exists).
- **3 new collections (22 total)**, each with real curation logic:
  - `flash-back-machine` (9) — the 2005–2012 browser golden age, preserved: the 5 Ruffle preservations + canabalt, line-rider, happy-wheels, qwop (official HTML5 rebuilds).
  - `score-attack` (12) — no endings, only high scores: 10 arcade classics + tetrio + jstris.
  - `tycoon-corner` (8) — build it, run it, optimize it: the 7 DOS management sims + shapez.
- **2 new deep-dive guides (22 total)**, 8 sections each, ~2,000 words, all external URLs curl-verified, in the wave-13 guide template (marquee h1, sticky spy TOC, reading-progress bar, coin-plate footer, arcade.js):
  1. **`guides/gamepad-setup.html`** — "Controllers in the browser": Gamepad API 60-second explainer, controller picks (Xbox/PS/Switch Pro/8BitDo), USB vs Bluetooth, testing on html5gamepad.com, gamepads in this site's Player (built-in + Player 2.1 per-system remap), which catalog games love a pad, honest troubleshooting (Steam swallowing inputs, non-standard mappings, wake-the-listing). Links: MDN Gamepad API, html5gamepad.com, W3C spec (+`developer.mozilla.org`, `html5gamepad.com`, `www.w3.org` added to build.py REFERENCE_DOMAINS).
  2. **`guides/pico8-spotlight.html`** — "PICO-8 spotlight": the fantasy console, Splore, the Lexaloffle BBS (all carts playable free in-browser), where the gems hide, the pico8-gems shelf tie-in (`collections.html#shelf-pico8-gems` deep link), making your first cart. Researched from the PICO-8 wiki + Lexaloffle BBS; links: lexaloffle.com/pico-8.php + lexaloffle.com/bbs (+`lexaloffle.com`, `www.lexaloffle.com` added to REFERENCE_DOMAINS). Fandom wiki dropped — 403 bot-gated.
- **Kids audit for all 51** (`data/kids.json`, build-time guard passes): 38 curated (8 new 5–7: qbert, pac-gal-20th, bubble-bobble-2, congo-bongo, run-3, subway-surfers, stickman-hook, hole-io; lemmings/monkey-island/oregon-trail-deluxe carry `verify_live` "play together first" flags), 13 excluded with reasons (FPS combat: duke3d/quake; horror: alone-dark/time-fcuk; cartoon violence: alien-hominid/dad-n-me/sfa2; arena combat + multiplayer: arras-io; open chat: tanki/mope-io/yohoho-io/stumble-guys/classicube). Kid-safe pool: 75 → 113; excluded: 87 → 100.
- **Wiring**: `data/guides.json` +2, `build_site.py` GUIDES +2 (sitemap + llms.txt regenerated), `emulation.html` deep-dives hub 6 → 8 cards, api/v1 rebuilt by build.py.
- **Agentic surface**: `check_api_workflows.js` — WF13 guides count 20→22, WF14 counts → 213 / p48/a39/r15/i15/m30/re44/h6/c16 / 22 collections, WF8 llms "213-game directory", WF11 "113 curated" text; new **WF17 (13 checks; 141/141 pass total)** — 51 ids present, record completeness, 22 collections + 3 new shelves' exact contents, 38+13 kids verdicts, 19 dropped candidates absent, 22 guides + template conformance + 8-section records + sitemap/llms/hub wiring, guide-link allowlist. New `scripts/test_wave17.js`: **29/29 headless checks** (22 shelves + 22 jump links + 3 new shelf anchors + flash shelf content, deep-link scroll, both guide pages' template/TOC/progress/coin-plate, 213 directory cards, 8 hub cards, zero pageerrors throughout).
- **Docs**: AGENT.md counts → 213 games / 22 guides / 113 kid-safe (113+100 verdicts); `skills/party-planner-runner.md` kids pool 75→113; `skills/kids-corner-guide.md` was stale at 44/114 (pre-wave-14) → 113/213.
- **Test maintenance (pinned fixtures, honest updates)**: `test_party11.js` 5–7 band 16→24, 11–12 band 75→113; `test_identity16.js` 162→213 cards, 75→113 kid badges, puzzle filter 45→48 ("48 of 213 games"), shelves/jump/copy 19→22.
- **Bug found & fixed in testing**: the guide generator double-wrapped chips (`<li><li>…`) leaving empty boxes in the chips row — fixed in both new guide pages, re-verified.
- **Flake investigated, not shipped as a bug**: the wave-17 deep-link scroll check failed once at a fixed 800ms sleep — debug run proved the scroll works (scrollY 8542, shelf at viewport top+113px); it's the wave-16-documented load-time smooth-scroll deferral, so the check now polls for the scrolled state.

**Validation (wave 17):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 22 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (39 pages, 213 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 38 pages, 1165 local links, 76 external links, 0 broken**
- `node scripts/check_api_workflows.js`: **141/141 pass (WF1–WF17)**, 0 failures
- `node --check`: clean on all `assets/js/*.js` + new/edited scripts
- Regression: test_bracket 82/82, test_bracket_double 105/105, test_party11 36/36, test_converter12 66/66, test_tournament10 ALL PASS, test_player21 ALL PASSED, test_party_planner11 ALL PASS
- `node scripts/test_identity16.js`: **41/41 pass, zero pageerrors** (pinned counts updated)
- `node scripts/test_wave17.js`: **29/29 pass, zero pageerrors** (new)
- `~/workspace/smoke/test.js`: zero pageerrors (only the known expected CDN tunnel noise on player.html); index hero now reads "213 free games" (data-driven)
- Screenshots verified: collections shelf row (flash-back-machine + score-attack) and gamepad guide hero (Arcade identity intact)

**Legal lane**: unchanged and extended carefully — 51/51 new links are official game pages, official portals (Poki/Kongregate), open-source project pages, or archive.org preservation items; zero ROMs hosted, zero ROM/BIOS download links; the 19 unverifiable/taken-down candidates were dropped rather than shipped on reputation; crazy-kong dropped on legal-lane principle (unlicensed bootleg).

## Wave 16 — 2026-10-11 — "The Arcade" identity wave 2: tooltips, shareable views, tag tokens, shelf anchors

**What shipped** — finished all five deferred identity items from wave 15, plus the execution-tier raises (signature motion, custom empty states, page-level consistency audit). Content, tools, data, API surfaces intact — identity only.

- **Card tooltips (anchor+Popover)**: every game card gets an info trigger (ringed "i" token in the card meta) opening a `popover="manual"` tooltip anchored with CSS `position-anchor`/`position-area: bottom` (+ `flip-block` fallback). Content: pixel title, full description, tag tokens, kid-safe line, controls readout, "play at {domain} · opens in a new tab". Keyboard: focus opens, blur/Esc closes, `aria-expanded` tracked. Graceful degradation: `html.no-anchor` → fixed-position rect math (clamped, flips above when needed); `html.no-popover` → plain toggled div. Verified live in headless Chromium 152 (`anchor-ok` path active, open/close/content all pass).
- **URL-synced filtered views**: directory state (q, genre, tags, favs) lives in `?q=&genre=&tags=a,b&favs=1`, written with `history.replaceState` on every change (no history spam), restored on load with validation against the catalog (bad genre/tag values dropped, URL normalized). New "» Copy view link" chip copies the shareable URL (clipboard + honest failure label).
- **Tag filter chips**: all 11 catalog tags as arcade prize tokens (ridged coin edge, count badges, amber press-in active state), multi-select AND semantics, sorted by count. Tags also surface as static minis in card metas for discovery.
- **Search-across-tags**: the search haystack is now title + description + tags; when the query matches tag names, a "» tag match:" strip shows the matched tags as toggle chips (one click applies the tag filter).
- **Collection anchor links**: every shelf card gets `id="shelf-<id>"` + `scroll-margin-top`; a "» Jump to a shelf:" token nav (19 links) heads the page; per-shelf "» Copy shelf link" buttons; `#shelf-*` deep links scroll on load (instant, not smooth — Chrome defers load-time smooth `scrollIntoView` by up to ~2s, verified by instrumentation).
- **Custom empty states**: directory no-results → "» NO GAMES ON THIS CHANNEL" unlit-cabinet state with "» Clear all filters" (resets state + URL); load failures (directory, collections, kids) → "» CABINET/SHELVES OFFLINE" states with retry.
- **Signature motion**: entrance choreography — hero copy cascades (`hero-in`, staggered), directory cards power on with a staggered rise (`card-in`, `--i` index, first paint only; filter changes keep view transitions). Hover physics: whisper-subtle cabinet tilt (≤5°, perspective 900px, rAF-throttled, fine-pointers only) layered over the existing hover lift. All gated on `prefers-reduced-motion: no-preference` AND `html:not(.fx-off)`; tooltips appear instantly (no motion to kill).
- **Page-level consistency audit**: `arcade.js` (FX toggle, attract mode, tooltips) now on all 36 pages — added to the 11 missing it (kids, collections, party-planner, tournament, emulation, monster-taming, play-legal, system-picker, parents, 2 genre pages); the coin-plate kick footer on all 36 (was missing on 9); new `assets/css/wave16.css` identity sheet linked everywhere. New `scripts/test_identity16.js`: 41 headless functional checks.
- **Agentic surface**: `check_api_workflows.js` gained WF16 (13 checks; **130/130 pass**). AGENT.md + llms.txt directory blurbs updated (tag filters, shareable URL views, tooltips).

**Validation (wave 16):**
- `scripts/build.py`: **BUILD OK — 162 games (136 domains), 19 collections, 10 emulators, 20 guides**; **LEGAL GATE OK (37 pages, 162 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 36 pages, 1110 local links, 71 external links, 0 broken**
- `node scripts/check_api_workflows.js`: **130/130 pass (WF1–WF16)**, 0 failures
- `node --check`: clean on all `assets/js/*.js` + new/edited scripts
- Regression: test_bracket 82/82, test_bracket_double 105/105, test_party11 36/36, test_converter12 66/66
- `node scripts/test_identity16.js`: **41/41 pass, zero pageerrors** (tooltips open/close/content, URL sync + restore + invalid rejection, tag chips, search-across-tags + matched strip, empty state + clear, shelf anchors + jump + deep link, FX toggle + kick plate on kids, index sampler tooltips)
- `~/workspace/smoke/test.js`: zero pageerrors (only the known expected CDN tunnel noise on player.html)
- Screenshots verified: tag token row + open anchored tooltip (games.html), shelf jump nav (collections.html)
- **Flakes investigated, not shipped as bugs**: (1) `scroll-behavior: smooth` + Puppeteer `page.click` can land on stale coordinates mid-scroll — harness-only, fixed with settled clicks/focus; (2) load-time smooth `scrollIntoView` deferred ~2s by Chrome — fixed in site code with instant behavior for deep links; (3) dropped view-transition update callbacks + intermittent renderer crashes under `loadavg ~11` (parallel agents' Chromes) — reproduced on unmodified wave-15 code, environmental, not a code bug; test suite now polls with `waitForFunction` instead of fixed sleeps.

**Legal lane**: unchanged — zero ROMs hosted, zero ROM/BIOS download links; no new game URLs (none needed); all features client-side on existing data.

## Wave 15 — 2026-10-11 — "The Arcade" visual identity rework (wave 1): core design system

**What shipped** — the user's top-priority directive: a massive identity overhaul at award-winning standard. Button Mash's identity is now **"The Arcade"**, executed as a full design system, not a reskin. Content, tools, data, and API surfaces untouched — visual overhaul only (plus two stale-count fact fixes).

- **Typography (self-hosted, OFL, latin-subset WOFF2 in `assets/fonts/`)**: Press Start 2P (pixel display — marquees, heroes, section plates, kickers), Space Grotesk variable wght 300–700 (chunky body), VT323 (terminal readouts, labels, badges), system mono stack kept for code. `font-display: swap`, display + body preloaded, metric fallbacks. Total font payload ~53KB. Glyph audit: replaced ★▶♥⚡→▸ in pixel/mono contexts with in-subset glyphs (» « • › ·) — verified via fontTools cmap, no tofu.
- **Marquee header treatments**: the site header is now a cabinet marquee — lit pixel brand badge, chase-light bulb strip along its bottom edge (two-layer stepped chase), nav on its own strip, "» Play" CTA.
- **Chase-light motion language**: `chase-x` keyframes (dim static bulbs + lit bulbs jumping a half-period in steps) drive header, hero marquee, console shell, guide h1s, and the kick-plate footer. Every instance gated behind `prefers-reduced-motion: no-preference` AND `html:not(.fx-off)`.
- **Coin-slot CTAs**: every `.btn-primary` is now a coin slot (dark bezel + vertical slot + neon coin-return glow); new `.coin-plate-cta` standalone insert-coin plate (404, hero-adjacent); kick-plate footer with "• GAME OVER? INSERT COIN TO CONTINUE •" coin-return plate.
- **Cabinet side-art dividers**: section heads are marquee plates with neon stripe-run dividers (`border-image` hard-stop gradients); guide sections get the same treatment; converter steps are cabinet panels with pixel step marquees; tool cards are control panels.
- **Cabinet game cards**: genre art-strip top edge (per-genre gradient via `:has()`), corner screws, bezel shadows, VT323 genre tags, hover lift + neon edge. **Kid-safe badges** (wave-14 flagged handoff): `★`→`• KID SAFE` lime badges on all 75 kid-safe cards — `arcade.js` wraps `BM.gameCard`, `directory.js` awaits `BM.kidSafeReady` before first render so first paint is complete.
- **CRT texture, toggleable**: fixed scanline + vignette layer over the whole page; the **FX switch** (header, injected by `arcade.js`, persisted in localStorage, defaults OFF for reduced-motion visitors) kills scanlines, chase, flicker, ticker, and attract mode — the wave-14 sensory-envelope toggle, shipped.
- **Attract mode**: the homepage marquee ticker is data-driven (24 rotating catalog titles, duplicated for a seamless -50% loop, static fallback if fetch fails); after 30s idle the hero shows an "ATTRACT MODE — TOUCH TO PLAY" ribbon and the ticker speeds up. Any input exits. Fully gated on reduced-motion/FX.
- **Custom details everywhere**: amber-on-black selection, cabinet-rail scrollbars, lime focus rings (forced-colors aware), "unlit cabinet screen" empty states, arcade **404.html** ("GAME OVER" + insert-coin CTA, added to sitemap/PAGES), breadcrumbs on the games directory + arcade token-trail breadcrumb styling on guides, footer kick plate.
- **Motion tokens** (wave-14 handoff): 5 durations + standard/decelerate/accelerate/snap easings in `tokens.css`; reduced-motion collapses durations and kills travel/chase/flicker while keeping opacity fades.
- **Guides template**: marquee h1 with chase bulbs + grille texture, side-art section dividers, terminal-readout fact chips, safety-plate legal notes, score-bar reading progress, print stylesheet that kills the cabinet. Cross-document view transitions restored (gated).
- **Stale-count fact fixes**: index meta description + marquee strip "89" → 162; games.html hero "89 games" → 162 (hero counts were already data-driven; these static strings weren't).
- **Design-system handoff applied from waves 12–14**: motion tokens, breadcrumbs, kid-safe badges, sensory-envelope toggle. Deferred to identity wave 2 (page-type extension): anchor+Popover card tooltips, URL-synced filtered views, tag filter chips, collection anchor links, search-across-tags.
- **Validation**: `check_api_workflows.js` gained **WF15 (12 checks; 117/117 pass total)** — vendored WOFF2 magic, @font-face wiring, motion/texture tokens, chase keyframes, coin-slot CSS, arcade.js contracts + page coverage, stale-count fixes, guide treatment, 404, reduced-motion/FX kills.

**Validation (wave 15):**
- `scripts/build.py`: **BUILD OK — 162 games (136 domains), 19 collections, 10 emulators, 20 guides**; **LEGAL GATE OK (37 pages, 162 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 36 pages, 1063 local links, 71 external links, 0 broken** (404.html added to sitemap via `build_site.py` PAGES)
- `node scripts/check_api_workflows.js`: **117/117 pass (WF1–WF15)**, 0 failures
- `node --check`: clean on all `assets/js/*.js` (incl. new `arcade.js`, edited `directory.js`)
- Regression: test_bracket 82/82, test_bracket_double 105/105, test_party11 36/36, test_converter12 66/66
- `~/workspace/smoke/test.js`: zero pageerrors (only the known expected CDN tunnel noise on player.html)
- Headless functional (puppeteer-core): games.html 162 cards + 75 kid badges + "162 of 162" + puzzle filter → 45 via view transition; FX toggle flips `html.fx-off` + aria-pressed; index ticker 48 spans populated, sampler 4 cards; player/converter/guide/404 render; **zero pageerrors/console errors**
- A11y/contrast audit: 17 key pairs computed — all pass WCAG AA (ink-faint 4.03 used decoratively only); screenshots verified (hero marquee, games hero, guide template, 404)
- Fonts: all three files OFL, `wOF2` magic verified; no external font requests (self-hosted)

**Legal lane**: unchanged — zero ROMs hosted, zero ROM/BIOS download links; fonts are OFL-licensed and self-hosted (no new external deps); all features operate on user-supplied files, client-side only.

## Wave 14 — 2026-10-11 — Games catalog expansion: 125 → 162 (+37, biggest single expansion) + web-craft applications

**What shipped:**
- **37 new legal games, every URL curl-verified HTTP 200 same day (2026-10-11)** — the biggest single catalog expansion in site history (wave 3's +25 was the previous record). 49 candidates researched (browser-gaming research report + fresh scouting); 12 dropped per the 200-discipline:
  - Dropped: freeciv-web, ztype, sinuous, sql-murder-mystery, css-diner, redactle (unreachable from here); gridland (domain now serves an unrelated leadership blog — wrong content); artist-is-present (404 both URL forms); spend-bill-gates-money, design-next-iphone (neal.fun 403 bot-gated, content unverifiable); shattered-pixel-dungeon (landing page only, no web-playable build found); spaceteam (classic game is app-only; playspaceteam.com is a different card-game product).
  - New by genre: **puzzle +18** (5 ncase playable essays: evolution-of-trust, better-ballot, parable-of-polygons, wisdom-madness-crowds, sight-and-light; shapez, floodlines, hydro-operator, skystack — the 3 open-source HydroEngineer sims from the research report; flexbox-froggy, grid-garden, codingame, codecombat, hacker-typer; absurdle, semantle, waffle, contexto, bandle), **action +2** (mindustry web build, recoil-foundry — 2026 jam gem from the research report), **roguelike +6** (dcss-webtiles, angband-live, nethack-web, spelunky-classic HTML5, vampire-survivors official web demo, chogue), **idle +2** (bitburner, stick-ranger), **retro +4** (Internet Archive DOSBox: doom-1993, oregon-trail, prince-of-persia, wolfenstein-3d), **cozy +5** (powder-game, doing-work + chogue's Pippin Barr art games, pointer-pointer, hacker-typer, hatchstead — corrected from "city builder" to snake-breeding sim after reading the actual page).
  - All descriptions original one-liners (CC0); no ROMs hosted, no ROM/BIOS download links, user-supplied-files-only lane intact.
- **6 new collections (19 total)**: playable-essays (7), open-source-web (6), code-playground (5), daily-word-games (5), cozy-toys (4), roguelike-forever (6). Existing shelves grown: retro-time-machine 5→9, idle-essentials 8→10, strategy-deep-cuts 7→11. A planned 7th (action-deep-cuts) was dropped — only 3 verified games, below the 4-game floor. WF8-pinned shelves (homebrew-radar=6, vanilla-js=5) untouched.
- **Kids audit for all 37** (`data/kids.json`, build-time guard passes): 25 curated (ncase essays, shapez, bitburner 11-12, sinuous-style abstract games, coding toys, daily puzzles, oregon-trail with an honest dysentery note, hatchstead/floodlines/hydro-operator/skystack carry `verify_live` "play the first 10 minutes together" flags), 12 excluded with reasons (combat: mindustry, dcss, angband, nethack, spelunky-classic, vampire-survivors, ztype-less recoil-foundry, prince-of-persia, doom, wolfenstein; accounts/chat: freeciv-less codingame, codecombat). Kid-safe pool: 50 → 75.
- **Web-craft design report applications** (reports landed mid-wave; read in full):
  - Applied — same-document view transitions on the games directory filter/search (report finding: Baseline since Oct 2025, ship unguarded for in-page state changes; Games genre filters named explicitly): `directory.js` `render()` now wraps the grid update in `document.startViewTransition()`, gated on `prefers-reduced-motion: no-preference`, with all three transition promises (`finished`/`ready`/`updateCallbackDone`) catch-swallowed — headless testing caught a real bug here (rapid successive filters abort in-flight transitions → unhandled AbortError pageerrors; fixed and re-verified, 2× zero-error runs).
  - Applied — `text-wrap: balance` on `.game-card h3` (report: "biggest typographic upgrade per byte", Baseline 2024).
  - Applied — killed the last hardcoded catalog counts: index.html hero/"Browse N games"/"All N games" are now data-driven from the loaded catalog (static fallback = 162, so the no-JS failure mode is the true number — the report's failure-mode rule); games.html meta description 89 → 162; build_site.py llms.txt blurbs 50 → 75 kid-safe; AGENT.md + party-planner-runner skill counts updated to 75 curated / 87 excluded.
  - Verified OK — llms.txt already passes the Lighthouse 13.3 Agentic Browsing shape (H1 header `# Button Mash`, long, link-rich).
  - Flagged for a future UI wave (not this lane): anchor-positioned + Popover tooltips on game cards; URL-state-synced filtered views (shareable `games.html?genre=puzzle` links); tag filter chips (party/kid-safe) + kid-safe badges on directory cards; anchor ids on collection cards ("copy link to this shelf"); breadcrumbs on collections/games pages; search should also match tags; sensory-envelope toggle per the TetraLogical anxiety framework; motion-token system + per-motion reduced-motion table.
- **Test maintenance (pinned fixtures, honest updates)**: `check_api_workflows.js` WF8 llms count 125→162 + new WF14 section (9 checks: 162 count, 37 ids present, record completeness, genre totals p45/a30/r15/i12/m25/re13/h6/c16, 19 collections, 6 new shelves' exact contents, all-37 kids verdicts, llms.txt new shelf titles, 12 dropped candidates absent); WF11 kids-pool bound 50→live count; `test_party11.js` 5-7 band 9→16, 11-12 band 50→75, unknown-band fallback → live count.

**Validation (wave 14):**
- `scripts/build.py`: BUILD OK — 162 games (136 domains), 19 collections, 10 emulators, 20 guides; LEGAL GATE OK (36 pages, 162 game URLs, 0 piracy links)
- `scripts/check_links.py`: LINK CHECK OK — 35 pages, 977 local links, 71 external links, 0 broken
- `node scripts/check_api_workflows.js`: 105/105 pass (WF1–WF14), 0 failures
- `node --check assets/js/directory.js`: clean
- Regression: test_bracket 82/82, test_bracket_double 105/105, test_party11 36/36, test_converter12 66/66, test_tournament10 headless PASS (zero pageerrors), test_player21 headless ALL PASSED (puppeteer suites need NODE_PATH=~/workspace/smoke/node_modules — pre-existing env quirk, not a code issue)
- `~/workspace/smoke/test.js`: zero pageerrors (only the known expected CDN tunnel noise on player.html)
- Headless games.html functional check (new): 162 cards render, "162 of 162 games", Puzzle chip → 45 cards via view transition, search filters live, zero pageerrors across repeated runs; index.html hero renders "162 free games."

**Legal lane**: unchanged and extended carefully — 37/37 new links are official game pages (ncase.me, dev GitHub Pages, dan-ball.jp, itch.io game pages, archive.org/details DOSBox items); zero ROMs hosted, zero ROM/BIOS download links; the 12 unverifiable candidates were dropped rather than shipped on reputation.

## Wave 13 — 2026-10-11 — Deep-dive guides knowledge hub (6 new guides + reading-craft design pass)

**What shipped:**
- **6 substantial new guides** (`guides/*.html`, 8 sections each, ~2,000+ words each; 14 → 20 guides):
  1. **`guides/homebrew-development.html`** — "Make games for dead consoles": the honest system ladder (GBA → GB → NES), the devkitARM/devkitPro toolchain end to end (`dkp-pacman -S gba-dev gba-examples`, env vars, template + `make`), learning the hardware via Tonc (curl-verified), RGBDS/GBDK-2020/cc65 for 8-bit, testing on mGBA + flash carts, shipping via jams/itch.io/showcases (GBA Jam 2026 entries page, MAGFest Indie Retro Homebrew Showcase finalists, Homebrew Hub — all research-verified), and the legal lane for developers (your code/art/music only).
  2. **`guides/netplay.html`** — "Play together online": RetroArch's replay/rewind-based rollback (zero added input delay, up to 16 players), the same-version/same-core/byte-identical-content rule, relay servers vs. TCP 55435 port forwarding, what plays well (8/16-bit) vs. what doesn't (PS1/N64 too heavy; link cables NOT emulated — no Pokémon trading — except TGB-Dual/SameBoy same-game GB multiplayer), Dolphin 2609's Android↔desktop netplay (Sept 2026, research-verified), and the honest state of this site's Player (EmulatorJS WebRTC netplay experimental, not enabled here).
  3. **`guides/save-workflows.html`** — "Saves that survive": the three save machines (states vs. SRAM vs. memory-card images), why states are version-tied, SRAM portability (`.srm`), card images, RetroArch save dirs + autosave interval, this site's Player model (default file-download vs. Keep-in-Browser IndexedDB + named slots + auto-save from waves 4/9), moving saves between emulators, and the 3-2-1 backup routine.
  4. **`guides/crt-shaders-display.html`** — "Make pixels look right": why games drawn for CRT blur look harsh on LCDs (dithering!), CRT anatomy (scanlines, aperture grille vs. shadow mask, phosphor bloom, curvature, NTSC artifacting), the shader ladder (zfast-crt → crt-easymode → crt-guest-advanced → crt-royale; slang/glsl/cg families), integer vs. bilinear scaling (Player's integer-scale toggle), input-lag math (16.7 ms/frame; Game Mode is the big win), run-ahead + BFI trade-offs, 59.73 vs. 60 Hz, and a practical recipe.
  5. **`guides/accessibility-in-retro-gaming.html`** — "Retro games for every player": the honest baseline (zero built-in features in 90s games), motor (remapping, turbo/autofire, one-handed layouts, Player Controls tool), vision (GBA color correction, OS filters, shader-vs-readability), hearing (retro's quiet advantage), cognitive (save states, rewind, slow-mo, cheats-as-difficulty, walkthroughs), the "it's not cheating" note, and this site's own commitments (keyboard-operable, reduced-motion, ARIA, contrast). No medical claims anywhere.
  6. **`guides/preserving-your-games.html`** — "Keep your games forever": the quiet crisis (87% of pre-2010 US games out of print per the VGHF survey — framed as standing context, not news), DMCA 2024 rulemaking context (rejected remote-sharing exemption; next cycle 2027), checksums (how to compute + store), No-Intro/DAT-o-matic naming (`[!]` = verified good dump), Redump + the 2025–2026 tool stack (redumper + MPF, OmniDrive firmware March 2026, compatible-drive realities), CHD/7z compression, ROM managers + DAT files + 1G1R, and the 3-2-1 archive with yearly re-verification.
- **Reading-craft design pass**: `assets/css/guides.css` (long-form typography: 65ch measure, 1.75 line-height, `text-wrap: pretty`/`balance`, numbered section kickers, `.key-point` callouts, print stylesheet), proper breadcrumb trails, **scroll-driven reading progress bar** (pure CSS `animation-timeline: scroll()`, `@supports`-gated), **sticky TOC on desktop** with IntersectionObserver scroll-spy (`assets/js/guide-toc.js`, sets `aria-current`), **cross-document view transitions** (gated behind `prefers-reduced-motion: no-preference`). Identity untouched: same neon-arcade system, no redesign. Deliberately skipped: scroll-triggered reveals, SPA-style transitions, drop caps.
- **`emulation.html`: new "Deep-dive guides" knowledge-hub section** (`#deep-dives`, 6 cards) between Explainers and Legal sources & homebrew. Footer untouched (no new top-level nav item — guides live under the hub).
- **Wiring:** `data/guides.json` +6 entries (build.py schema-validated); `scripts/build_site.py` GUIDES +6 (sitemap + llms.txt regenerated); `scripts/build.py` REFERENCE_DOMAINS +8 (`docs.libretro.com`, `www.coranac.com`, `hh.gbdev.io`, `datomatic.no-intro.org`, `no-intro.org`, `www.redump.org`, `redump.org`, `wiki.redump.org`) — every new external URL curl-verified HTTP 200. Research inputs from `~/workspace/research_notes/browser-gaming-20261011-2010/` (Dolphin 2609 netplay, RetroArch 1.22.2, DMCA 2024, 87%-out-of-print, redumper+MPF+OmniDrive, Tonc + devkitARM toolchain).
- **Docs**: AGENT.md guide count + knowledge-hub note (folded at merge: 20 guides).

**Validation (wave 13):**
- `scripts/build.py`: **BUILD OK — 125 games (111 domains), 13 collections, 10 emulators, 20 guides**; **LEGAL GATE OK (36 pages, 125 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 35 pages, 977 local links, 71 external links, 0 broken**
- `node scripts/check_api_workflows.js`: **all pass, incl. 8 new WF13 checks** (guide count 20, API records, page structure, sitemap, llms.txt + hub, guide-toc.js contract, cross-linking, design CSS)
- `node --check`: clean on `assets/js/guide-toc.js`, `scripts/check_api_workflows.js`
- HTML well-formedness: all 20 guide pages parse clean (tag-balance check)

**Legal lane**: unchanged and extended — zero ROMs hosted, zero ROM/BIOS download links; every new external link is a docs page, dev community, homebrew index, or verification database. Link *text* audited against the legal gate's download-phrasing rule.

## Wave 12 — 2026-10-11 — Converter 3.0: batch conversion, 5 systems, compression levels, honest validation, output upgrades, web-craft pass

**What shipped:**
- **Batch conversion** (`converter.html` + rewritten `assets/js/converter.js`): drop many files → each becomes its own playable `.html`. Sequential queue with per-file rows (system chip, size, editable title, status chip, mini progress bar), per-file byte-level progress with live throughput + ETA, global batch bar (`[file 2/5]` labels), **Cancel** (stops after the current file; cancelled ≠ failed), and **error isolation** — one bad file never kills the batch (verified: 2 converted + 1 failed in the headless run). Files dropped mid-run wait for the next run (frozen work snapshot). Queue-time content validation means corrupt files are flagged *before* Convert is ever clicked.
- **Five systems, all verified 2026-10-11**: SNES (`.sfc`/`.smc`, Snes9x core, 6MB max) and Sega Genesis (`.md`/`.gen`, Genesis Plus GX core, 4MB max) join GBA/GB/GBC/NES. Every claim re-verified today: all five `cores/*-wasm.data` files curl-return HTTP 200 on the pinned EmulatorJS 4.2.3 CDN; `snes`/`segaMD` short names match the Player's own boot list. Caps follow real hardware (48 Mbit SNES carts — Tales of Phantasia/Star Ocean; 32 Mbit directly-addressable Genesis ROM space; bank-switched carts → Player mode, stated). `.smd` (interleaved) and `.bin` (too generic) are refused rather than guessed at. **All five cores are BIOS-free.**
- **Compression levels** (vendored `pako 2.1.0`, MIT, local — zero new network deps): None / Fast(1) / Balanced(6, default) / Best(9), plus one-click presets (Smallest file / Balanced / Fastest build). Streaming deflate in 1MB chunks keeps the UI alive with real progress on big ROMs. Honest trade-off copy: levels only cost *build* time — decode speed is flat, the game plays identically; savings vary (code-heavy ROMs ~30–50%). The output page inflates on-device via `DecompressionStream('deflate')` with a plain-language error on pre-2023 browsers. Real result: the 207,516-byte test GBA → 46,499-byte download at Balanced.
- **Honest validation engine** (`assets/js/converter-core.js`, UMD — the test suite runs the same code the page ships): errors (empty file, all-zero dump, NES missing the `NES\x1A` magic or declaring zero PRG banks, over hardware max) vs warnings (blank cartridge header — homebrew boots fine, verified against the real `rkanoid-latest-demo.gba` which genuinely has a zeroed header; GB/GBC header-checksum mismatch via pure spec arithmetic; Genesis missing `SEGA` string at 0x100 — emulators don't enforce it) vs neutral notes (SNES 512-byte copier header detected, kept as-is — Snes9x skips it). The converter never claims a file "will boot."
- **Output upgrades**: custom per-game title (download filename slugified from it, batch-deduplicated), optional cover art (≤2MB, embedded in every output, shown in the title bar), **▶ Player mode** deep link (`player.html?core=` pre-selects the system; honest note that you re-pick your original ROM there), async boot with loader error handling, template token contract grows 9 → 11 (`__BM_COMPRESSED__`, `__BM_COVER__`; `buildHtml` throws if any token is missing or survives).
- **Bug found & fixed in testing**: two batch files with the same basename produced the same download name — only one file landed. New `ConverterCore.uniqueDownloadName` dedupes (`game.html`, `game-2.html`, …); caught by the headless addendum, covered by 3 new pinned fixtures.
- **Web-craft pass** (from `research_notes/web-craft-20261011-2014`, both notes): `text-wrap: balance` on headings (Baseline 2024), `text-wrap: pretty` on lede/card copy (progressive enhancement), container queries for the queue rows (component layout adapts to its container, not the viewport — the "page = media queries, components = container queries" rule), `:has()` row-state tints (Baseline 2023, no extra JS), restraint budget honored (no ambient loops in the dense queue; view transitions considered and deliberately skipped — innerHTML re-renders would fight them). Identity untouched: same arcade system, no redesign. All reduced-motion safe.
- **Research inputs checked**: `RESEARCH_LOG.md` (wave-fuel-2026 + cycle-2 batches) — the wave-fuel report is creator-economy/short-form/AI-video material for the other sites; the only gaming mention is creator-niche RPM data (belongs to creator-growth-empire). Nothing genuinely integrable into a ROM converter — forcing it in would violate the honesty rules, so nothing was integrated. Browser-gaming research independently confirms the pinned EmulatorJS 4.2.3 (no action needed).
- **Docs**: `skills/converter-multi-system.md` rewritten for 3.0 (5-system table with verification basis, validation honesty table, compression trade-offs, 11-token contract); AGENT.md converter bullet + workflow 2 → 3.0; `scripts/build_site.py` blurbs → llms.txt/llms-full.txt regenerated. No new skill — no genuine gap (converter-multi-system owns this surface).
- **Agentic surface**: `scripts/check_api_workflows.js` gained WF12 (12 checks; **88/88 pass**, was 76/76); WF2's stale 9-token/3-core checks updated to the 3.0 contract; new `scripts/test_converter12.js`: **66/66 pinned-fixture assertions** (format detection 8 ext + 4 rejections, validation incl. real rkanoid zeroed-header warning, Genesis SEGA-string + SNES copier-header fixtures, naming + download dedup, 11-token contract incl. throw paths, pako→zlib round-trips at levels 1/6/9, batch error-isolation/cancel/stats, presets in HTML). `scripts/check_links.py` now skips `assets/vendor/` templates (their `__BM_*__` hrefs resolve at output time, never in the repo).

**Validation (wave 12):**
- `scripts/build.py`: BUILD OK — 125 games (111 domains), 13 collections, 10 emulators, 14 guides; LEGAL GATE OK (30 pages, 125 game URLs, 0 piracy links)
- `node scripts/check_api_workflows.js`: 88/88 pass (WF1–WF12), 0 failures
- `scripts/check_links.py`: LINK CHECK OK — 29 pages, 826 local links, 61 external links, 0 broken
- `node scripts/test_converter12.js`: 66/66 pass; `node --check`: clean on converter.js, converter-core.js, both scripts
- Headless Chromium: batch UI renders (4 radios, presets, cover, live region); 3-file batch (good GBA + corrupt NES + good NES) → corrupt flagged at queue time, 2 converted + 1 failed, both downloads correct; **browser deflate output inflates to the exact original 207,516 ROM bytes**; Genesis/SNES end-to-end (cores, deep links, zero leftover tokens, duplicate-name dedup); zero pageerrors throughout
- `~/workspace/smoke/test.js`: converter.html FULL PASS (upload detected, convert enabled, `smoke-test.html` downloaded, no leftover tokens, zero errors); player.html + index.html unchanged (only the known expected CDN tunnel noise)
- Regression: tournament 26/26, party11 36/36, party-planner 30/30, player21 all-pass — zero pageerrors (no regressions)

**Legal lane**: unchanged and hardened — zero ROMs hosted, zero ROM/BIOS download links (pako vendored locally, no new external deps); all features operate on user-supplied files, client-side only. (Real-engine boot test still needs parent browser delegation: `BM_BOOT_TEST=1 node ~/workspace/smoke/test.js`.)

## Wave 11 — 2026-10-11 — Party Planner 2.0: guests, voting, rotation, timeline, snack timer, kids mode, handoff 2.0, share links

**What shipped:**
- **Guest list** (`party-planner.html` + `assets/js/party.js`): the w3 headcount number input is now a name textarea (2–16 names, one per line, live guest count, `<2 guests` honestly rejected). Guest names drive the rotation scheduler, game voting, and the tournament handoff.
- **Game voting**: one vote per guest (re-vote moves it), tally with an aria-live list; ties go to the earliest-picked candidate (same rule as w10's per-round voting). "Rebuild plan with voted games" puts voted games first in the slots; the tournament handoff takes the top voted picks as the round-game candidates (`Party2.tally` / `topVoted`).
- **Rotation scheduler** (`Party2.scheduleRotation`): hot-seat games play in groups of up to 4, the group offset rotating one guest per slot — over a full cycle every guest sits out the same number of times (pinned fixture: 5 guests / 5 slots → everyone sits exactly once, plays 4×). Arenas list "everyone plays at once".
- **Party timeline** (`Party2.buildTimeline`): 30-min setup → game slots → snack break (inserted after the middle slot) → suggested 30-min tournament → 30-min free play. Wall-clock labels when a party start time is set, relative `+0:00` offsets otherwise.
- **Snack-break timer**: configurable break length (5–30 min), Start/Pause/Reset, `role="timer"` face, aria announcements on start/pause/finish only (per-second updates would be chatty), no animation (reduced-motion safe).
- **Tournament handoff 2.0**: "Run a tournament for this party" → `tournament.html?players=N&names=Ana,Ben&games=id1,id2&format=single|double`. `tournament.js`'s `initFromURL` now parses validated `?names=` (2–16 names, safe chars, ≤32) and pre-fills real names instead of "Player 1..N". The w10 "fresh tournament" rule holds: no stale saved bracket is restored under handoff params.
- **Share/print/copy**: same-origin `#p=` party links (encode inputs only — guests/opts/games/votes; slots + timeline are re-derived on import, never trusted; `decodeShare` validates version, counts, name shapes, game-id shapes, and sanitizes votes; tampered links rejected with an error), print party pack (form/controls hidden, timeline + slots + votes + rotation shown), copy-plan-as-text for the group chat.
- **Kids party toggle**: restricts picks to the 50 kid-safe games from `api/v1/kid-safe.json` (youngest-age-band selector 5–7/8–10/11–12, bands nest), all hot-seat hand-the-controller. Verified by data: only 1 of the 27 party-tagged games is kid-safe, so kids parties deliberately don't require the `party` tag — stated honestly in the UI and skill. Vibe + skill-mix fieldsets disable with an explanation while kids mode is on.
- **Docs**: `skills/party-planner-runner.md` rewritten for 2.0 (verified facts only — voting rules, rotation math, kids-pool behavior, handoff params, share-link privacy note); AGENT.md Party Planner bullet → 2.0, workflow 4 rewritten, Tournament bullet's handoff params updated to `?players=N&names=A,B&games=ids&format=`; `scripts/build_site.py` party blurb → llms.txt/llms-full.txt regenerated. No new skill — no genuine gap (party-planner-runner owns this surface).
- **Agentic surface**: `scripts/check_api_workflows.js` gained WF11 (12 checks; 76/76 pass, was 64/64); new `scripts/test_party11.js`: **36/36 pinned-fixture assertions** (guest validation, voting ties + re-vote, rotation fairness, timeline phases + wall clock, share round-trip + tamper rejections, kids-pool bands, option cleaning); new `scripts/test_party_planner11.js`: **30/30 headless UI checks** — 2.0 controls, live guest count, plan build, timeline order, rotation sit-outs, voting + tally + re-vote + apply, share clipboard round-trip, kids filtering (12 candidates, all kid-safe), timer start/pause/reset, handoff URL + pre-filled names + fresh bracket, tamper rejection, zero pageerrors.

**Validation (wave 11):**
- `scripts/build.py`: BUILD OK — 125 games (111 domains), 13 collections, 10 emulators, 14 guides; LEGAL GATE OK (30 pages, 125 game URLs, 0 piracy links)
- `node scripts/check_api_workflows.js`: 76/76 pass (WF1–WF11), 0 failures
- `scripts/check_links.py`: LINK CHECK OK — 30 pages, 824 local links, 63 external links, 0 broken
- `node scripts/test_party11.js`: 36/36 pass; `node --check`: clean on party2.js, party.js, tournament.js, both new test scripts
- `node scripts/test_party_planner11.js`: 30/30 PASS, zero pageerrors
- Regression: `node scripts/test_tournament10.js`: 26/26 PASS, zero pageerrors (names= handoff is additive); `~/workspace/smoke/test.js` (standard path): zero pageerrors — only the known expected CDN tunnel noise on player.html
- Headless: kids.html + converter.html covered by smoke run — zero pageerrors (no regressions)

**Legal lane**: unchanged — zero new external links (kids games all come from the existing verified catalog); share links are same-origin `#p=` URLs. (Real-engine boot test still needs parent browser delegation: `BM_BOOT_TEST=1 node ~/workspace/smoke/test.js`.)

## Wave 10 — 2026-10-11 — Tournament 2.0: double elimination + seeding UI + game voting + history/undo + share links

**What shipped:**
- **Double elimination** (`assets/js/bracket-double.js`, new UMD pure-logic module, needs `bracket.js` loaded first): winners bracket delegated to the single-elim engine through a view object; losers bracket computed round by round (round 0 = losers of winners round 0 — first-round BYE matches contribute no loser; even rounds pair prior losers-round winners; odd rounds merge survivors with fresh winners-bracket drop-ins via the documented pairing survivor[i] vs drop-in[D-1-i], leftover pairing, trailing lone entrant gets an honest BYE); 2k−2 losers rounds for k winners rounds (2 players = zero losers rounds, grand final is a straight rematch); grand final = winners champ vs losers champ, with **bracket-reset** logic (losers champ wins the first final → one more final, winner takes the tournament). Losers results snapshot their entrant seeds so `syncLosers()` wipes anything an upstream edit invalidates — clearing a winners match cascades through losers + grand final honestly. Covered by `scripts/test_bracket_double.js`: **105/105 pinned-fixture assertions** (4-player reset run, outright-win run, 8-player merge pairings, 2-player rematch, 3-player byes, both cascade directions, reseeding, share round-trip + 13 tamper rejections, voting majority/tie-break/re-vote, guards, mergeEntrants units).
- **Seeding UI** (`tournament.html` + `assets/js/tournament.js`): format radios (single/double), a seeding list with ↑ ↓ reorder buttons (keyboard-operable native buttons; the textarea stays the single source of truth) + randomize. Honest note in the UI: no skill ratings exist on this site, so seeds are manual or random — verified by grep (no ratings data anywhere in `data/`).
- **Game integration**: round game picker now lists the **full 125-game catalog** (party-tagged group first, then everything) instead of party-only; each player takes an optional **game pick** in the seeding list; per-round **game voting** — one vote per player (re-vote moves it), ties go to the earliest-picked game, "Lock in" sets the round's game. Works on winners rounds, losers rounds, and the grand final. Party planner handoff (`?players=N&games=ids`, plus new `&format=`) verified end to end; fixed a real bug the headless suite caught — with a saved bracket in localStorage, the handoff's `?games=` was being consumed by the stale restored bracket instead of the new one. Now URL handoff params mean "fresh tournament": the old bracket isn't restored under them, and the pending games wait for Generate.
- **Match flow**: per-match score entry / winner advance (shared renderer for both formats), **match history log** (newest-first, timestamps, capped at 200, printed and included in the copy-text export), **undo last result** (in-memory snapshot stack, session-only — stated in the UI), bracket state persists in localStorage (`bm_tournament_v1` single / `bm_tournament_v2` double, format remembered), **shareable bracket links** (`#b=` base64url state, `decodeShare` validates everything — version, format, 2–16 players, result shapes, entrant snapshots, history caps — and rebuilds derived fields from scratch; tampered links rejected with an error), print layout extended to losers bracket + grand final + history.
- **Guides/docs**: `skills/tournament-runner.md` rewritten for 2.0 (verified facts only — formats, seeding, voting rules, reset, share-link privacy note, session-only undo); AGENT.md Tournament bullet + workflow 6 updated; `scripts/build_site.py` tournament blurbs → llms.txt/llms-full.txt regenerated. No new skill — no genuine gap (tournament-runner owns this surface).
- **Agentic surface**: `scripts/check_api_workflows.js` gained WF10 (9 checks; 64/64 pass, was 55/55); WF6's party-catalog check updated to the intentional new behavior (full catalog, party first). New `scripts/test_tournament10.js`: **26/26 headless checks** — seeding UI, reorder, game picks, double playthrough to champion via real UI clicks, voting lock-in, undo, share round-trip + tamper rejection in the browser UMD build, single-elim regression playthrough, reload persistence, party handoff. Smoke `test.js`: zero pageerrors (only the known expected CDN tunnel noise on player.html).

**Validation (wave 10):**
- `scripts/build.py`: BUILD OK — 125 games (111 domains), 13 collections, 10 emulators, 14 guides; LEGAL GATE OK (30 pages, 125 game URLs, 0 piracy links)
- `node scripts/check_api_workflows.js`: 64/64 pass (WF1–WF10), 0 failures
- `scripts/check_links.py`: LINK CHECK OK — 30 pages, 820 local links, 63 external links, 0 broken
- `node scripts/test_bracket.js`: 82/82 pass (single-elim untouched); `node scripts/test_bracket_double.js`: 105/105 pass
- `node --check`: clean on all five changed/added JS files
- `node scripts/test_tournament10.js`: 26/26 PASS, zero pageerrors
- Headless: kids.html + converter.html + party-planner.html re-verified — zero pageerrors (no regressions)

**Legal lane**: unchanged — zero new external links; share links are same-origin `#b=` URLs. (Real-engine boot test still needs parent browser delegation: `BM_BOOT_TEST=1 node ~/workspace/smoke/test.js`.)

## Wave 9 — 2026-10-11 — Player 2.1: save-state manager + per-system remap + display options

**What shipped:**
- **Save-state manager** (`player.html` + `assets/js/player.js`): named save slots per game in the engine's own IndexedDB store (`EmulatorJS-states`/`states`) — engine slot `<base>.state`, named slots `<base>.bm-slot-<n>.state`. Per slot: **Save** (copies the engine slot in), **Restore** (copies back over the engine key so the engine's Load State picks it up), **Rename** (inline, Enter commits / Esc cancels), **Export** (downloads the bytes), **Delete**. Slot labels in `bm-slots-<gameID>`. **Auto-save**: optional 1/5/15-min timer (`bm-autosave-<gameID>`) copies the engine slot into `<base>.bm-autosave.state` when it changed, while the tab stays open. Import still writes a `.state` file into the engine slot under the current game's name. Honest copy throughout: everything is browser-local, "Keep in Browser" mode required (in-game menu → Settings → Save States). Panels work for the most recent game (`bm-last-game`) even before a fresh boot.
- **Per-system controller remapping**: one Player 1 map per system in `bm-remap-<core>` (`{player0:{id:{value,value2}}}`), system dropdown (all 20 systems), engine-verified per-core button labels + default maps shown, press-a-key / press-a-pad-button capture, **Esc cancels both** captures, "Reset this system to defaults". Maps are written into the engine's own settings payload (`ejs-<gameId>-<core>-<gameName>-settings`, `controlSettings['0']`) at boot → apply on next boot (documented: overrides Player 1 changes made in the engine's own menu). First boot auto-migrates legacy per-game custom mappings (Player 2.0) into the per-system map. Remapper fully keyboard-operable (native buttons, `role="status"` announcements).
- **Display options** (per system, `bm-display-<core>`): CRT scanline/vignette toggle (legacy global `bm-crt` adopted once per system), integer-scale toggle (snaps the engine canvas to whole-pixel multiples of its intrinsic size, `pixelated` rendering, via MutationObserver + resize), aspect ratio 4:3 / 16:9 / fill / original 1:1 (CSS reframing — emulated resolution never changes), fullscreen with honest `aria-pressed` state, `fullscreenchange` sync, and an `f` shortcut from the console shell. **Quick-settings `<dialog>`** (toolbar ⚙ while playing, or the Display card): display controls + auto-save for the current system, applied live. Reduced motion: CRT flicker stays gated behind `prefers-reduced-motion: no-preference`; new CSS kills animations/transitions on player chrome under `prefers-reduced-motion: reduce`.
- **Guides**: `skills/player-guide.md` documents all of Player 2.1 (storage key formats, boot-time application, migration, motion safety — verified facts only). No new skill: no genuine gap (the player-guide skill owns this surface).
- **Agentic surface**: AGENT.md Player bullet → 2.1, `scripts/build_site.py` player bullet → 2.1, llms.txt/llms-full.txt regenerated; `scripts/check_api_workflows.js` gained WF9 (8 checks); new `scripts/test_player21.js` (20 headless functional checks); smoke `test.js` PART 1 gained read-only Player 2.1 UI probes. No API changes (no new endpoints).
- **Null-guard discipline (w3.1) intact**: every new DOM write null-guarded; `veilError` guard + discipline comment verified by WF9.

**Validation (wave 9):**
- `scripts/build.py`: BUILD OK — 125 games (111 domains), 13 collections, 10 emulators, 14 guides; LEGAL GATE OK (30 pages, 125 game URLs, 0 piracy links)
- `scripts/check_links.py`: LINK CHECK OK — 30 pages, 819 local links, 63 external links, 0 broken
- `node scripts/check_api_workflows.js`: all pass incl. 8 new WF9 checks (was 47/47, now 55/55), 0 failures
- `node --check`: clean on `assets/js/player.js`, `scripts/check_api_workflows.js`, `scripts/test_player21.js`, `~/workspace/smoke/test.js`
- `node scripts/test_player21.js`: **20/20 PASS** — slots render/rename/restore/new-slot, per-system remap (snes labels, key capture → `bm-remap-gba`, Esc cancel, reset), dialog opens/persists, display prefs round-trip across reload, autosave pass writes the slot, 49 native keyboard-focusable controls, zero pageerrors
- `~/workspace/smoke/test.js` (standard path): zero pageerrors on player/converter/index; all 9 Player 2.1 probes present; the upload step exercised the new boot path (remap apply + display prefs + slot render) with no errors — only the known expected CDN tunnel noise
- Headless Chromium: kids.html + converter.html re-verified — zero pageerrors (no regressions)

**Legal lane**: unchanged — zero new external links; no ROMs hosted, no ROM/BIOS download links. (Real-engine boot test still needs parent browser delegation: `BM_BOOT_TEST=1 node ~/workspace/smoke/test.js`.)

## Wave 8 — 2026-10-11 — Homebrew radar sweep + archive expansion

**What shipped:**
- **Live pipeline run**: itch.io watcher (still 403-gated, graceful — 0 candidates), emulator-release watcher (0 new candidates), review queue (0 pending — all prior candidates already reviewed/dispositioned). Fresh research filled the gap instead.
- **11 new games, all curl-verified HTTP 200 same day (2026-10-11)**, legal lane only (homebrew / open-source / original indie, zero ROMs hosted, zero download links):
  - Tristram (`bippinbits.itch.io/tristram`) — Diablo-homage auto-battler, Ludum Dare 55, browser HTML5
  - Die in the Dungeon CLASSIC (`alarts.itch.io/die-in-the-dungeon`) — dice deckbuilding roguelite, 4.7★/2,700+ ratings, browser
  - The Archives of Trevosa (`jamwitch.itch.io/trevosa`) — language + family-tree deduction mystery, browser
  - Prerolled (`red-sauce.itch.io/prerolled`) — cozy dice-shop roguelite, browser (URL extracted from the dev's itch profile page, then curl-verified)
  - Zombie Nest GBA (`enarkz.itch.io/zombie-nest-gba`) — new $1 GBA homebrew top-down zombie roguelike; page ships a free browser demo of the warehouse biome
  - Dare To Doku (`daretosquare.itch.io/dare-to-doku`) — GBA Jam 2026 star-battle logic puzzle, playable in browser
  - English Brick Breaker, Math Challenge, Tank Battle, Red Alert-style RTS, 3D Plane Battle (`wqnlll.github.io/*.html`) — 5 vanilla-JS games by one indie dev, no accounts, Chromebook-friendly (page links extracted from the hub root, each curl-verified)
  - Five hoped-for additions (serenitrove, purrgatory, type-help, funkin, dragonsweeper) turned out to already be in the catalog — deduped before writing.
- **2 new collections** (13 total): `homebrew-radar` (the 6 itch/GBA finds) and `vanilla-js` (the 5 wqnlll games). Collection size guard (5–12) forced an honest rebalance: adrenaline → 12, brain-food → 12, strategy-deep-cuts → 7, idle-essentials +prerolled → 8.
- **homebrew-packs.json**: GBA pack gained the GBA Jam 2026 entries page (`itch.io/jam/gbajam26/entries`, curl-verified) as a 4th entry.
- **Kids audit for all 11** (`data/kids.json`, build-time guard passes): 6 curated (english-brick-breaker 5–7; math-challenge, dare-to-doku, prerolled 8–10; die-in-the-dungeon, tristram 11–12 — the last four carry `verify_live` "play the first 10 minutes together" flags), 5 excluded with reasons (zombie-nest-gba, tank-battle, red-alert-rts, 3d-plane-battle = combat; trevosa = dense reading + succession/exile themes, when-in-doubt excluded). Catalog now 125 games: 50 curated + 75 excluded.
- **Fixed the flagged inconsistency**: `collections.html` header nav now has the Tournament link (and Party planner — it was missing both vs. the other pages; wave-6's "all 11 pages" sweep had missed this file). Verified in headless render.
- **`scripts/build_site.py`**: killed three hardcoded counts (114 games / 44 kids / 11 collections) — llms.txt now uses live counts from the data files.
- **Agentic surface**: api/v1 rebuilt (games 125, kid-safe 50, collections 13, homebrew-packs with the jam entry); AGENT.md + API.md counts updated; `check_api_workflows.js` gained WF8 (7 checks; 47/47 pass). No new skill — no genuine gap (new games flow through the existing games/kid-safe endpoints and the kids-corner-guide skill).
- **Boot-test artifacts for parent delegation** (task item 6 — no real-browser boot attempted): `tests/homebrew-test-roms/` holds `rkanoid-latest-demo.gba` (benoror's @rkanoid GBA demo, author's own original homebrew; size 207,516 bytes matches the GitHub API listing; sha256 `d9520404396ae3908ac159ee7d1e105a597ea9fa01f9aec2cb902949b55a78f2`; test-only, never linked on the site) + README with the delegation recipe, and `~/workspace/smoke/test.js` gained a gated PART 4 (`BM_BOOT_TEST=1`) that uploads the ROM to player.html, waits for the engine canvas, samples for a non-blank frame, and requires zero pageerrors. Two earlier candidates (mystic_q.gba, Ducker's PD arkanoid from the same repo) were REJECTED — zeroed cartridge-header regions, likely multiboot images, not known-good cartridge boots. Delegation command: `BM_BOOT_TEST=1 node ~/workspace/smoke/test.js` (set `BM_BASE=http://127.0.0.1:8000` with a static server if the engine needs http://).
- **Emulator release notes**: nothing new from the watchers — no guide/core updates needed. Stable pin stays EmulatorJS 4.2.3.

**Validation (wave 8):**
- `scripts/build.py`: BUILD OK — 125 games (111 domains), 13 collections, 10 emulators, 14 guides; LEGAL GATE OK (30 pages, 125 game URLs, 0 piracy links)
- `scripts/check_links.py`: LINK CHECK OK — 30 pages, 819 local links, 63 external links, 0 broken
- `node scripts/check_api_workflows.js`: 47/47 pass (WF1–WF8), 0 failures
- `node --check`: clean on `scripts/check_api_workflows.js`, `~/workspace/smoke/test.js`
- `~/workspace/smoke/test.js` (standard path, PART 4 gated off): zero pageerrors — only the known expected CDN tunnel noise on player.html (sandbox proxy blocks the EmulatorJS CDN; documented since wave 4)
- Headless Chromium: collections.html renders 13 collection cards incl. homebrew-radar + vanilla-js, header nav has Tournament + Party planner; games.html renders 125 cards incl. Tristram; zero pageerrors

**Legal lane**: unchanged — 11 new links are all creator itch.io pages and one author's static GitHub Pages hub; zero ROMs hosted, zero ROM/BIOS download links; the one .gba file on disk is a test artifact only, never linked anywhere.

## Wave 7 — 2026-10-11 — Kids mode (content + safety wave)

**What shipped:**
- **Kid-safe audit** (`data/kids.json`): all 114 games got an honest verdict — 44 curated, 70 excluded with reasons. Four bars, all mandatory: no open chat with strangers, no unmoderated multiplayer chat or user-generated content, no gambling mechanics, no graphic or horror content. Every curated record carries `kid_safe`, `no_chat`, `age_band` (5–7/8–10/11–12), a plain-language `parent_note` (why it's fine + what to watch), `verify_live` (true on 5 records where the assessment couldn't be fully verified end-to-end), and `audit_basis` (the concrete basis for the flag — never invented). When in doubt, excluded — never softened.
- **`kids.html`** — the kids corner: honesty banner ("assessments, not guarantees — play the first 10 minutes together"), age-band chips (All / 5–7 / 8–10 / 11–12) with aria-pressed, big friendly cards with 🔇 No chat badges, 👀 "play together first" flags, per-game "For parents" disclosures, and big high-contrast ▶ Play buttons (target=_blank, rel=noopener). Reduced motion is the default on this page (unconditional animation/transition kill, not just prefers-reduced-motion).
- **`parents.html`** — the parent guide: how the four-bar curation works, the honesty policy (snapshots not guarantees; excluded games are never defended), what "No chat" does and doesn't mean, common-sense screen-time tips (no medical claims — no doctor/pediatrician/diagnosis language anywhere), the save-state "one more level" negotiation trick, a teacher section (classroom fits + classroom-games skill pointer), and a "found a problem?" re-audit promise.
- **API**: `api/v1/kid-safe.json` (new endpoint, manifest-registered in `api/v1/index.json`, draft-07 schema at `api/v1/schema/kid-safe.schema.json`, validated with jsonschema) — curated subset with full game records + kid flags; AGENT.md + API.md mentions.
- **New skill**: `skills/kids-corner-guide.md` (age-band cheat sheet, parent-note surfacing rules, never-soften policy). 14 skills total.
- **Updates**: "Kids corner" nav link + footer links added to all 13 pages (system-picker.html has a minimal footer — nav only, consistent with its existing style), parent guide in footer Learn sections, `scripts/build_site.py` (kids.html/parents.html in sitemap + llms.txt Play section, kid-safe endpoint in API section, 14-skill list), regenerated llms.txt/llms-full.txt/sitemap.xml, README.md (14 skills), `scripts/check_api_workflows.js` WF7 (13 checks).
- **Build-pipeline guards**: `scripts/build.py` now validates `data/kids.json` (top-level shape, exact age bands, no dupes, curated ∩ excluded empty, every game gets a verdict, every curated record fully flagged with non-empty parent_note + audit_basis); `scripts/build_api.py` builds `kid-safe.json` from curated ids joined against `games.json` (full game fields, no invented data).

**Validation (wave 7):**
- `scripts/build.py`: BUILD OK — 114 games (104 domains), 11 collections, 10 emulators, 14 guides; LEGAL GATE OK (30 pages, 114 game URLs, 0 piracy links)
- `scripts/check_links.py`: LINK CHECK OK — 30 pages, 817 local links, 63 external links, 0 broken
- `node --check assets/js/kids.js`: clean
- `node scripts/check_api_workflows.js`: all 40 pass (WF1–WF7)
- `~/workspace/smoke/test.js`: zero pageerrors (only expected CDN fetch noise on player.html)
- Headless Chromium functional pass (kids.html, parents.html): 44 cards / 4 chips / 44 no-chat badges / 5 verify flags render; 5–7 filter → 8 cards all "Ages 5–7" with correct aria-pressed; zero pageerrors on both pages.

**Legal lane**: unchanged — no new external links; kids corner links are the existing verified catalog URLs only.

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
