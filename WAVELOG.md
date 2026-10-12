# Button Mash — WAVELOG

Running record of build waves. Newest first.

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
