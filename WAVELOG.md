# Button Mash — WAVELOG

Running record of build waves. Newest first.

## Wave 38 — 2026-10-13 — HEADLINE (stated before building): The Action Deep Dive — the third-largest genre gets its dive, dives go 4-of-8 to 5-of-8

**Headline**: rotation 17 takes the next line on the wave-33
completeness audit's dive debt, ordered by catalog size as
waves 36–37 ordered it: puzzle (48) and retro (44) have their
dives; action — 41 of 213 games — is the largest remaining
undived genre (multiplayer 31, idle 15, horror 6 still wait).
Wave 38 builds `genres/action.html`, fifteen curated games in
five families (arena shooters, .io arenas, one-button endless
runners, physics chaos, Flash-era run-and-gun), every card
pinned to its catalog record — title, play URL, and controls
line verbatim, and every "why it fits" blurb grounded only in
the game's catalog description (the wave-36 0hh1 precedent:
any draft line adding a rule, year, maker, or feature the
record does not state is cut before shipping). The site grows
48 → 49 pages and every page-count pin moves with it. Because
Versus counts a genre dive as written coverage, the dive also
lands in the comparison layer: all 41 action games gain a
coverage entry, and every pinned pairing whose truth changes
gets its suites updated to assert the new truth explicitly,
never loosened. **Tickets**: no open Button Mash tickets at
rotation open. **Seed discipline**: the wave adds no
chance-bearing surface — a curated dive deals nothing — so no
new seed is needed and no `Math.random` call is added
anywhere. **Exclusion Ledger integrity**: untouched and
re-verified — WF41 (213 audited = 113 in + 100 out, reasons
verbatim, accounting derived). Taxonomy untouched:
TAXONOMY_BRIEF.md stays **UNDECIDED**, parked for a human
ruling (213 / horror 6 / cozy 16); census untouched.

**What shipped**

- `genres/action.html` — the Action Deep Dive on the proven
  two-template dive pattern: fifteen of the catalog's 41
  action games in five families (start here: the arena
  shooters — Krunker, Shell Shockers, Venge.io; .io arenas:
  grow or get eaten — Diep.io, Starblast.io, arras.io;
  one button, endless road — Canabalt, Slope, Run 3;
  physics chaos — QWOP, Happy Wheels, Bonk.io; Flash-era
  run-and-gun — Fancy Pants Adventure: World 1, Alien
  Hominid (Flash), Dad 'n Me). Every card pinned verbatim
  to its `data/games.json` record (title, play URL,
  controls line); every blurb grounded only in the game's
  catalog description. Lede + closing callout name the
  full shelf honestly: 41 action games, 15 curated here,
  the other 26 in the directory. Born placed: full
  placement block in source — `wire_placement` reports
  49 pages stamped, 0 updated — and bm-vt stamped (not in
  the {player, converter, kids, parents} skip set).
- Registration per pattern: AGENT.md centerpiece lines +
  workflow 13; `build_site.py` PAGES + llms line (sitemap
  + llms.txt regenerated); a fifth card in games.html's
  Genre deep dives section; `scripts/test_action38.js`
  (10 checks, ALL PASS).
- Versus: `versus-core.js` GENRE_DIVES gains
  `action: 'genres/action.html'` — the registry names
  exactly the five dives on disk; all 41 action games
  carry dive coverage. The one pinned pairing whose truth
  changed: **Venge.io vs kaaarot** — footprint alone fired
  before (1 shelf to 0, no coverage either side); now the
  coverage verdict fires too. WF37, WF43, WF44,
  `test_versus33`, `test_retro37`, and `test_puzzle36`
  assert the new registry truth explicitly; Zork I vs
  2048 is unchanged (coverage tied 2–2, footprint only).
- Page-count pins 48 → 49 everywhere they live: WF38/WF39
  (49), WF41 VT detail (45 stamped of 49), LIVE_CHECKLIST
  canonical (49) + VT counts (45 of 49); the legal gate's
  count is derived (its repo-wide walk reports 50 HTML
  files — the 49 site pages plus the vendor template the
  WF page walk excludes — 0 piracy links).

**Verification (after)**

- `scripts/build.py`: BUILD OK — 213 games, 24
  collections, 10 emulators, 24 guides; placement wiring
  49 stamped (0 updated); exclusion ledger 100 verdicts
  stamped. `check_legal.py`: LEGAL GATE OK (0 piracy
  links). `check_links.py`: 49 pages, 0 broken.
- WF battery (`check_api_workflows.js`): **349/349 ALL
  PASS** (WF1–WF44; +8 over wave 37's 341 — the WF44
  block). `test_action38.js`: ALL PASS (10).
- Sequential solo battery (detached, one suite at a
  time): every named suite green — versus (VERSUS33 ALL
  PASS), ledger (ALL PASS), the curator family, retro37,
  puzzle36, and **test_identity16 ALL PASS (41)** — run
  in-battery under the rotation-16 sequential discipline,
  real verdict, no contention note. `tests/api.test.sh`:
  pass=40 fail=0. One transient: `test_curatornight21`'s
  timed ceremony-beat check failed once inside the
  battery under fleet load and passed clean on an
  immediate solo re-run (ALL PASS) — a surface wave 38
  does not touch; reported as observed, not hidden.
- Captures in `~/workspace/progress-archive/button-mash/
  rotation-017/`: dive hero desktop, Physics chaos family
  desktop, .io arenas family at 390px, the changed Versus
  pairing's verdict strip (both lines visible), and
  games.html's five-card dives section — zero pageerrors,
  all inspected.
- Untouched, re-verified: Exclusion Ledger integrity
  (213 = 113 + 100, reasons verbatim, WF41 green);
  TAXONOMY_BRIEF.md UNDECIDED/PARKED; census untouched;
  the 52 orphan games stay parked (no new shelf — the
  Passport's pinned 24-collection count holds). No
  `Math.random` added; no chance-bearing surface.

## Wave 37 — 2026-10-13 — HEADLINE (stated before building): The Retro Deep Dive — the largest remaining genre gets its dive, dives go 3-of-8 to 4-of-8

**Headline**: rotation 16 takes the next line on the wave-33
completeness audit's dive debt, ordered by catalog size as
wave 36 ordered it: puzzle (48) was largest and got its dive
in wave 36; retro — 44 of 213 games — is the largest
remaining undived genre (action 41, multiplayer 31, idle 15,
horror 6 still wait). Wave 37 builds `genres/retro.html`,
fifteen curated games in five families, every card pinned to
its catalog record. The site grows 47 → 48 pages and every
page-count pin moves with it. Because Versus counts a genre
dive as written coverage, the dive also lands in the
comparison layer: all 44 retro games gain a coverage entry,
and the one pinned pairing whose truth changed (Zork I vs
2048) now ties on coverage 2–2 — each game carries its own
genre's dive plus a Kids listing — so only the footprint
verdict fires, with WF37 and `test_versus33` updated to the
new record-derived expectation, asserted explicitly rather
than loosened. The wave changes the truth and the pins say
so. **Tickets**: no open Button Mash tickets at rotation
open (the ticket book verified empty fleet-side; QA-006
stays CLOSED; the new page carries exactly one `<h1>`,
guarded by WF43 + `test_retro37`). **Seed discipline**: the
wave adds no chance-bearing surface — a curated dive deals
nothing — so no new seed is needed and no `Math.random` call
is added anywhere (the one `Math.random` string in
versus-core.js remains a comment about the wave-34
conversion). **Exclusion Ledger integrity**: untouched and
re-verified — WF41 green on the final tree (213 audited =
113 in + 100 out, reasons verbatim, accounting derived).
Taxonomy untouched: TAXONOMY_BRIEF.md stays **UNDECIDED**,
parked for a human ruling (213 / horror 6 / cozy 16); census
untouched (117/117 verified).

**What shipped**

- **FLAGSHIP — the Retro Deep Dive** (`genres/retro.html`,
  built on the three existing dives' exact template — head
  block, cabinet header, feature-card families, callout,
  footer): fifteen of the catalog's 44 retro games in five
  families — Start here: the archive doors (Internet Arcade,
  Console Living Room, MS-DOS Library), The DOS canon (DOOM
  1993, The Oregon Trail, Zork I), Golden-age arcade (Space
  Invaders, Missile Command, Robotron: 2084), Empires and
  city halls (SimCity 1989, Civilization, Railroad Tycoon),
  Jump, point, click (Commander Keen 3, Prince of Persia,
  The Secret of Monkey Island). Every card links the
  record's own play URL and prints the record's own controls
  line; every "why it fits" blurb is grounded in the game's
  catalog description (no years, makers or features the
  record does not state). The lede and closing callout name
  the full shelf honestly: 44 retro games, 15 curated here,
  the other 29 in the directory. Registration: AGENT.md
  workflow 12 + centerpiece lines, `build_site.py` PAGES +
  llms line (sitemap + llms.txt regenerated), a fourth card
  in games.html's Genre deep dives section, WF43,
  `test_retro37.js`.
- **Versus coverage, widened by the record.** `GENRE_DIVES`
  in `versus-core.js` gains `retro: 'genres/retro.html'` —
  the registry again names exactly the dives that exist on
  disk (WF37 + WF43 + test_versus33 all pin the four-key
  set; test_puzzle36's registry line updated to match). The
  one consequence in the pinned expectations: Zork I vs
  2048, which since wave 36 earned footprint + coverage
  (2048's puzzle dive against Zork's none), now ties on
  coverage — Zork carries the retro dive, 2048 the puzzle
  dive, both carry a Kids listing — so the strip fires
  footprint alone. Both suites' checks were updated to
  assert the tied 2–2 coverage and the single verdict
  explicitly. The bare tail shrinks honestly with it:
  ClassicReload and the PICO-8 BBS are retro records, so
  they leave the no-coverage tail; four games (kaaarot,
  bloxd, moomoo, zombs) remain bare, and the thin-state
  check still passes on exactly those four.
- **The 48th page, fully placed.** The new page carries the
  complete placement block in source (absolute OG + Twitter
  image, canonical on the recorded host, theme-color,
  favicons, OG dimensions) and the `bm-vt` view-transition
  stamp — `wire_placement` reported 48 pages stamped, 0
  updated, so the generator agrees the page was born placed.
  WF38/WF39 page-count pins move 47 → 48; the WF41 VT label
  moves 43 → 44 stamped (the skip set is unchanged: player,
  converter, kids, parents stay instant); LIVE_CHECKLIST's
  canonical/VT counts updated to match. The legal gate
  counts 49 pages including the vendor template, 0 piracy
  links.
- **Commons adoptions (align-on-touch)**: the fleet's
  genre-dive pattern as this site practices it (curated
  subset, record-verbatim facts, honest full-shelf count) —
  applied unchanged to a fourth genre; the wave-36 pattern
  of pinning a page's every factual line to its source
  records (WF43 derives featured ids, URLs and controls
  from `data/games.json`).

**Validation (wave 37, final runs):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains),
  24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK
  (49 pages incl. the vendor template, 213 game URLs, 0
  piracy links)**; placement wiring 48 pages stamped, 0
  updated (idempotent — the new page was born placed); ledger
  stamps 100 verdicts. The build's timestamp-only `data/v1`
  regeneration churn was reverted — this wave is pages +
  wiring + assets + docs.
- `scripts/check_links.py`: **LINK CHECK OK — 48 pages, 2053
  local links, 157 external links, 0 broken** (local count
  up from 2014: the new page's links + games.html's fourth
  dive card).
- `node scripts/check_api_workflows.js`: **341/341 pass
  (WF1–WF43)** — new WF43 (7 checks: one-h1 + self-counting
  kicker, featured-card record integrity, derived full-shelf
  count, the four-dive registry, directory/sitemap/llms
  wiring, VT stamp, taxonomy pin); WF37's registry + verdict
  expectations updated to the wave's new record truth; WF41
  (ledger + VT split) green at 44 stamped.
- New `test_retro37`: **ALL PASS (10 checks)** — 15 distinct
  featured ids, all real retro records, URL + controls +
  title verbatim per card, derived shelf counts, one h1 + VT
  stamp in source, Versus profile coverage for Zork I, the
  pinned pairing's tied coverage, and headless: 15 cards
  rendered under exactly one h1, 390px zero overflow, zero
  pageerrors. (First attempt died at a LifecycleWatcher
  disposal under load with all static checks already green;
  the solo re-run on the same tree is the record — see the
  load note below.)
- Named suites: the full battery ran detached; its first
  pass collided with this wave's own screenshot browsers
  (two Chromium workloads at once on a box at loadavg ~9–12)
  and produced **zero assertion failures tree-wide** — every
  non-zero exit was a browser-harness error (TargetCloseError,
  navigation/selector timeouts, one launch failure). The
  affected fifteen suites were re-run as a second detached
  battery, strictly sequential with no concurrent browser
  work — the stuck→improved countermeasure — and **all 15
  ran green**: `test_puzzle36` ALL PASS; `test_versus33`
  ALL PASS (20); `test_emulatorversus34` ALL PASS;
  `test_ledger35` ALL PASS; `test_tournamentnight32` ALL
  PASS; `test_passport31` ALL PASS; `test_player21` ALL
  PASSED; `test_curatornight21` ALL PASS; `test_wave17` ALL
  PASS; `test_wave19` ALL PASS; `test_trophy18` ALL PASSED;
  `test_party_planner11` ALL PASS; `test_tournament10` ALL
  PASS; `test_wow1` **WOW1 ALL CHECKS PASS**; smoke exit 0.
  First-pass suites that never faltered: `test_curator24`–
  `test_curator32` ALL PASS (census closed, untouched),
  `test_lineups23` ALL PASS; `test_converter12` 66/66;
  `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL
  PASS; `test_bracket` 82/82; `test_bracket_double` 105/105;
  `test_party11` 36/36; `tests/api.test.sh` **40/40**.
- **Load honesty, stated plainly**: `test_identity16` is
  reported on this wave's evidence, not its reputation: in
  the sequential battery it ran **ALL PASS (41 PASS lines,
  RESULT: ALL PASS, exit 0)** — the first clean pass in
  several waves, credited to the sequential run discipline
  (no competing Chromium) rather than to any change in the
  suite or the site; it is recorded as a sequential-run
  verdict, and its documented stall signature under parallel
  load stands in the earlier entries.
- **Regression sweep (grep)**: exactly-one-`<h1>`: 47 pages
  static + game.html (data-titled, pre-existing pattern);
  the new page carries 1 in source and renders 1
  (test_retro37); og:image absolute **48/48** pages and
  canonical absolute **48/48** (WF38/WF39 at the new count);
  VT stamp **44/48**, skip set exactly {player, converter,
  kids, parents}; CRLF audit 0 files; `node --check` clean
  on all new/edited JS; AI-slop denylist grep clean on the
  wave's prose; no TODOs.
- Screenshots inspected (zero pageerrors): `genres/retro.html`
  hero desktop (kicker "15 GAMES", h1, the 44-of-213 lede) +
  golden-age section desktop + 390px mobile (no overflow,
  header wraps clean); `versus.html?a=zork1&b=2048` verdict
  strip (both dive coverage chips up, footprint the only
  verdict, common ground naming the shared Kids pass);
  games.html Genre deep dives section with all four cards.
  Archived to
  `~/workspace/progress-archive/button-mash/rotation-016/`.
  One transport note: this sandbox's Chromium refuses local
  HTTP (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`, the
  wave-35 documented limit), so the shots were taken over
  file:// with element-clipped framing — stated plainly
  rather than dressed as an HTTP run.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download
links. The dive links only the games' own official play pages,
already in the catalog (the retro shelf's Archive items are
the Internet Archive's own preserved, playable copies).

**Parked**: the taxonomy recommendation remains **PARKED for
a human ruling** — untouched this wave, as ordered. The
audit's remaining recorded debts stay on the list with their
reasons: 52 orphan games (a new shelf moves the Passport's
pinned 24-collection count; curation is human-grade work),
three more genre dives (action 41, multiplayer 31, idle 15,
horror 6 — each flagship-scale writing), and structured
year/maker fields (a curator-grade re-verification project,
not a schema edit).

**Self-assessment**: the dive debt is now half paid, in the
audit's own size order, and the pattern is fully load-bearing:
the page is the easy half; the honest half is the blast radius
— a registry four suites pin, a pinned pairing whose correct
answer flipped from "2048 is better covered" to "coverage is
tied" because the site now genuinely covers Zork too, and a
bare-tail definition that shrank by two games because the
record changed underneath it. Each was updated to assert the
new truth explicitly. The wave's operational lesson is its
own stuck→improved receipt: the first battery's failures were
self-inflicted browser contention, and the sequential re-run
not only cleared all fifteen suites but produced the first
clean identity16 pass in several waves — running one browser
at a time is now this repo's battery discipline, recorded
here so the next wave inherits it.

## Wave 36 — 2026-10-13 — HEADLINE (stated before building): The Puzzle Deep Dive — the largest genre gets its dive, dives go 2-of-8 to 3-of-8

**Headline**: the WAVELOG named no wave-36 shape, so the wave
takes the biggest remaining debt on the wave-33 completeness
audit's own list: "Genre deep dives exist for 2 of 8 genres
(roguelike, cozy); puzzle — the largest genre at 48 — action,
multiplayer, retro, idle, and horror have none: each dive is
flagship-scale curated writing, queued as future waves." Puzzle
is the catalog's largest genre (48 of 213 games) and had no
dive. Wave 36 builds it: `genres/puzzle.html`, fifteen curated
games in five families, every card pinned to its catalog
record. The site grows 46 → 47 pages — its first new page
since wave 33 — and every page-count pin moves with it,
derived or updated on the record. Because Versus counts a
genre dive as written coverage, the dive also lands in the
comparison layer: all 48 puzzle games gain a coverage entry,
and the one pinned pairing whose truth changed (Zork I vs
2048) now fires footprint + coverage, with WF37, WF42 and
`test_versus33` updated to the new record-derived expectation
— the wave changes the truth and the pins say so, rather than
the pins quietly absorbing it. **Tickets**: the fleet book was
verified at rotation open — no open Button Mash tickets
(QA-006 stays CLOSED; the new page carries exactly one `<h1>`,
guarded by WF42 + `test_puzzle36`). **Seed discipline**: the
wave adds no chance-bearing surface — a curated dive deals
nothing — so no new seed is needed and no `Math.random` is
added anywhere. **Exclusion Ledger integrity**: untouched and
re-verified — WF41 green on the final tree (213 audited = 113
in + 100 out, reasons verbatim, accounting derived).
Taxonomy untouched: TAXONOMY_BRIEF.md stays **UNDECIDED**,
parked for a human ruling as it has been for 8+ rotations
(213 / horror 6 / cozy 16); census untouched (117/117
verified).

**What shipped**

- **FLAGSHIP — the Puzzle Deep Dive** (`genres/puzzle.html`,
  built on the two existing dives' exact template — head block,
  cabinet header, feature-card families, callout, footer):
  fifteen of the catalog's 48 puzzle games in five families —
  Start here (2048, Wordle, Simon Tatham's Puzzles), Falling
  blocks played seriously (TETR.IO, Jstris, Tetris Official),
  Word games that fight back (Connections, Absurdle, Semantle,
  The Password Game), Combine and create (Little Alchemy 2,
  Infinite Craft), Pure logic grids (Sudoku, 0hh1, Dare To
  Doku). Every card links the record's own play URL and prints
  the record's own controls line; every "why it fits" blurb is
  grounded in the game's catalog description (no years, makers
  or features the record does not state — the one blurb draft
  that added a rule the description does not name, 0hh1's
  row/column uniqueness, was cut before shipping). The lede
  and closing callout name the full shelf honestly: 48 puzzle
  games, 15 curated here, the other 33 in the directory.
  Registration: AGENT.md workflow 11 + centerpiece lines,
  `build_site.py` PAGES + llms line (sitemap + llms.txt
  regenerated), a third card in games.html's Genre deep dives
  section, WF42, `test_puzzle36.js`.
- **Versus coverage, widened by the record.** `GENRE_DIVES` in
  `versus-core.js` gains `puzzle: 'genres/puzzle.html'` — the
  registry again names exactly the dives that exist on disk
  (WF37 + WF42 + test_versus33 all pin the three-key set). The
  one consequence in the pinned expectations: Zork I vs 2048
  used to earn exactly one verdict (footprint); 2048 now also
  carries dive coverage Zork lacks, so the pair earns two —
  footprint, then coverage naming the puzzle dive. Both
  suites' checks were updated to assert the new pair of
  verdicts explicitly, not loosened.
- **The 47th page, fully placed.** The new page carries the
  complete placement block in source (absolute OG + Twitter
  image, canonical on the recorded host, theme-color,
  favicons, OG dimensions) and the `bm-vt` view-transition
  stamp — `wire_placement` reported 47 pages stamped, 0
  updated, so the generator agrees the page was born placed.
  WF38/WF39 page-count pins move 46 → 47; the WF41 VT label
  moves 42 → 43 stamped (the skip set is unchanged: player,
  converter, kids, parents stay instant); LIVE_CHECKLIST's
  canonical/VT counts updated to match. The legal gate counts
  48 pages including the vendor template, 0 piracy links.
- **Commons adoptions (align-on-touch)**: the dive template
  itself is the fleet's genre-dive pattern as this site
  practices it (curated subset, record-verbatim facts, honest
  full-shelf count) — applied unchanged to a third genre; the
  wave-35 pattern of pinning a page's every factual line to
  its source records (WF42 derives featured ids, URLs and
  controls from `data/games.json`).

**Validation (wave 36, final runs):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains),
  24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK
  (48 pages incl. the vendor template, 213 game URLs, 0
  piracy links)**; placement wiring 47 pages stamped, 0
  updated (idempotent — the new page was born placed); ledger
  stamps 100 verdicts. The build's timestamp-only `data/v1`
  regeneration churn was reverted — this wave is pages +
  wiring + assets + docs.
- `scripts/check_links.py`: **LINK CHECK OK — 47 pages, 2014
  local links, 141 external links, 0 broken** (local count up
  from 1976: the new page's links + games.html's third dive
  card).
- `node scripts/check_api_workflows.js`: **334/334 pass
  (WF1–WF42)** — new WF42 (7 checks: one-h1 + self-counting
  kicker, featured-card record integrity, derived full-shelf
  count, the three-dive registry, directory/sitemap/llms
  wiring, VT stamp, taxonomy pin); WF37's registry + verdict
  expectations updated to the wave's new record truth; WF41
  (ledger + VT split) green at 43 stamped.
- New `test_puzzle36`: **ALL PASS (8 checks)** — 15 distinct
  featured ids, all real puzzle records, URL + controls +
  title verbatim per card, derived shelf counts, one h1 +
  VT stamp in source, Versus profile coverage for 2048, and
  headless: 15 cards rendered under exactly one h1, 390px
  zero overflow, zero pageerrors.
- Named suites re-run, all green: `test_versus33` **ALL PASS
  (28)**; `test_ledger35` ALL PASS; `test_emulatorversus34`
  ALL PASS; `test_curator24`–`test_curator32` ALL PASS (census
  closed, untouched); `test_tournamentnight32` ALL PASS;
  `test_passport31` ALL PASS; `test_lineups23` ALL PASS;
  `test_converter12` 66/66; `test_player21` ALL PASSED;
  `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL
  PASS; `test_curatornight21` ALL PASS; `test_wave17` ALL
  PASS; `test_wave19` ALL PASS; `test_party_planner11` ALL
  PASS; `test_tournament10` ALL PASS; `test_bracket` 82/82;
  `test_bracket_double` 105/105; `test_party11` 36/36;
  `test_wow1` **WOW1 ALL CHECKS PASS**; `tests/api.test.sh`
  **40/40**; `~/workspace/smoke/test.js` exit 0.
  `test_trophy18` note, stated plainly: the parallel battery
  run reported 1 failure while three browser workloads ran at
  once on a loaded box; the solo re-run on the same tree ran
  **ALL TROPHY CHECKS PASSED** (exit 0) — reported as a
  load-contention flake with the solo verdict as the record,
  the same honesty pattern as the wow1/identity solo verdicts.
- **Load honesty, stated plainly**: the box ran loadavg
  ~11–13 through the rotation. `test_identity16` is reported
  **NOT-RUN / load-blocked**: two attempts, **zero assertion
  failures** in both — the battery attempt reached the
  documented stall signature (timeout stack at
  test_identity16.js:274, the waitCards site of waves 30/31/34/
  35), the solo attempt timed out earlier at a waitForSelector
  (:125) after 11 PASS lines. It is not claimed as passed, and
  the wave did not chase it further, per the standing rule.
  One operational note: the first battery run's exec session
  was reaped at a tool-dispatch timeout mid-suite; the
  remainder was relaunched as a detached setsid process with a
  PID file (verified alive before reporting) and completed —
  the stuck→improved pattern, applied to the test run itself.
- **Regression sweep (grep)**: exactly-one-`<h1>`: the new
  page carries 1 in source and renders 1 (test_puzzle36);
  og:image absolute **47/47** pages and canonical absolute
  **47/47** (WF38/WF39 at the new count); VT stamp **43/47**,
  skip set exactly {player, converter, kids, parents}; CRLF
  audit 0 files; `node --check` clean on all new/edited JS;
  AI-slop denylist grep clean on the wave's prose; no TODOs.
- Screenshots inspected (zero pageerrors): `genres/puzzle.html`
  hero desktop (kicker "15 GAMES", h1, the 48-of-213 lede) +
  falling-blocks section desktop + 390px mobile (no overflow,
  header wraps clean); `versus.html?a=2048&b=zork1` desktop;
  games.html Genre deep dives section with all three cards.
  Archived to
  `~/workspace/progress-archive/button-mash/rotation-015/`.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download
links. The dive links only the games' own official play pages,
already in the catalog.

**Parked**: the taxonomy recommendation (purrgatory + Lookouts
+ Little Troubles rider, horror→cozy) remains **PARKED for a
human ruling** — untouched this wave, as ordered. The audit's
remaining recorded debts stay on the list with their reasons:
52 orphan games (a new shelf moves the Passport's pinned
24-collection count; curation is human-grade work), four more
genre dives (action 41, multiplayer 31, retro 44, idle 15,
horror 6 — each flagship-scale writing), and structured
year/maker fields (a curator-grade re-verification project,
not a schema edit).

**Self-assessment**: the audit's dive debt was ordered by
genre size and this wave paid the largest line on it. The
interesting work was not the page — the template is proven —
but the blast radius of one new page done honestly: a page
count seven pins derive from, a coverage registry three
suites pin, and one pinned Versus pairing whose correct
answer changed because the site now genuinely covers 2048
better than Zork. Each of those was updated to assert the
new truth explicitly. A dive that only added a page would
have been the small version of this wave; the version here
also makes every puzzle game more comparable than it was
yesterday.

## Wave 35 — 2026-10-13 — HEADLINE (stated before building): The Exclusion Ledger — every Kids Corner verdict, both halves, on the record

**Headline**: the next frontier the wave-33 completeness audit
named — "Kids exclusion reasons (100 games, in data/kids.json)
surface nowhere user-facing and kid-safe.json exposes only the
curated subset — publishing per-game exclusion reasons on a
parents' surface needs a copy/sensitivity pass of its own" —
lands as that pass, on the parents' surface the audit pointed
at. Every one of the 213 catalog games already carries a Kids
Corner verdict (113 in, 100 out); until now only the "in" half
was public. The parent guide gains a generator-stamped
**Exclusion Ledger**: all 100 kept-out games, each with the
audit's own recorded reason, word for word, searchable from
the page. The wave also repairs the stale accounting both
family pages still carry — "70 of our 114 games did not make
the cut" predates the grown catalog; the true split is 113 of
213 in, 100 out — and pins the numbers to the data so they
cannot drift silently again. No new page: the 46-page surface
and its pins hold. **View Transitions verdict (this wave's
second duty): ADOPTED, scoped** — cross-document transitions
graduate from the guides (where `guides.css` has carried them
since wave 13) to the cabinet's browsing pages, wired at the
generator level in `wire_placement` under the same two gates
the guides use (`prefers-reduced-motion: no-preference` and
the site's own FX switch). Four pages stay instant on
purpose: the Player and the Converter (tool surfaces that boot
an engine / handle files — a snapshot crossfade over a live
canvas earns nothing) and Kids Corner + the parent guide
(family pages whose standing rule is motion-off by default).
**Seed discipline**: the wave adds no chance-bearing surface —
the ledger is a complete record, not a deal — so no new seed
is needed and no `Math.random` is added anywhere.
Taxonomy untouched: TAXONOMY_BRIEF.md stays **UNDECIDED**
(213 / horror 6 / cozy 16); census untouched (117/117 verified).

**What shipped**

- **FLAGSHIP — the Exclusion Ledger** (`parents.html`
  `#not-in-the-corner` + generator wiring in
  `scripts/build.py` `wire_exclusions`, idempotent — the
  stamped block is replaced whole on every build — +
  `assets/js/ledger-filter.js`): the parent guide now carries
  the audit's full "out" half. Between `bm-ledger` markers the
  build stamps the accounting line derived from the records
  (213 games audited · 113 in Kids corner · 100 kept out) and
  all 100 excluded games in title order — each title linked to
  its game file, each reason copied **verbatim** from
  `data/kids.json`. No reason is paraphrased, softened, or
  sorted into a bar the audit did not record, and WF41
  compares every stamped reason against the record so a drift
  fails the suite. The framing copy is the audit's demanded
  copy/sensitivity pass: the ledger sits on the parents' page
  (a child browsing the safe shelf does not need a catalogue
  of what was kept away from them), exclusion is stated not to
  be a quality judgment, and parents are told how to dispute
  a verdict. `data/v1/kid-safe.json` is unchanged — it still
  exposes only the curated subset; the ledger is a human
  surface, not an endpoint, and the function count stays 5.
  The lookup box only filters rows already on the page (no
  fetch, works read-only without JS) and its no-match state
  says the honest thing: a catalog game with no row here
  passed the audit. Registration: AGENT.md workflow 10 +
  centerpiece bullet, build_site page line, WF41,
  `test_ledger35.js`.
- **The stale accounting, repaired and pinned.** Both family
  pages still told parents "70 of our 114 games did not make
  the cut" — a sentence from before the catalog grew. Both now
  carry the true split (100 of 213), and WF41 derives the
  expected sentence from the records, so the number cannot go
  stale silently again.
- **VIEW TRANSITIONS — adopted, scoped, generator-wired.**
  `wire_placement` now stamps a marked `bm-vt` block into the
  head of 42 of 46 pages: `@view-transition { navigation:
  auto }` under `@media (prefers-reduced-motion:
  no-preference)` and `html:not(.fx-off)` — the same two gates
  the guides' wave-13 rule uses — with a 180ms crossfade on the
  root snapshots, so moving between cabinet pages reads as a
  screen change while the marquee stays lit. Deliberately
  unstamped (both documents must opt in, so their navigation
  stays instant): `player.html` and `converter.html` (engine /
  file surfaces) and `kids.html` + `parents.html` (the family
  pages' motion-off rule). The guides keep their own
  `guides.css` rule alongside the stamp. WF41 pins the split.
  Progressive enhancement only: unsupported browsers navigate
  exactly as before, and there is no JS involved.
- **Seed discipline**: no new chance surface; the ledger's
  only script contains no `Math.random` and no `fetch`
  (WF41-pinned). The directory's pre-existing random button
  and game-of-the-day are untouched, as in wave 34's scope.
- **Commons adoptions (align-on-touch)**: the wave-34
  generator-wiring pattern itself (stamped block + strict WF
  pin + idempotence proof) applied to two new surfaces; the
  View Transitions technique graduates from the guides — the
  same graduation path Film took site-wide, scoped here to
  what the cabinet identity supports.
- **RULE 1762**: line endings audited — **0 CRLF files**
  tree-wide; `.gitattributes` pin + binary carve-outs intact
  and untouched.

**Validation (wave 35, final runs):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains),
  24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK
  (47 pages counted incl. the vendor template, 213 game URLs,
  0 piracy links)**; placement wiring stamps 46 pages (42
  updated on first build — exactly the VT set), ledger stamps
  100 verdicts; a second build stamps 0 pages (idempotent).
  The build's timestamp-only `data/v1` regeneration churn was
  reverted — this wave is pages + wiring + assets + docs.
- `scripts/check_links.py`: **LINK CHECK OK — 46 pages, 1976
  local links, 125 external links, 0 broken** (local count up
  from 1874: the ledger's 100 game-file links + the kids →
  ledger link).
- `node scripts/check_api_workflows.js`: **327/327 pass
  (WF1–WF41)** — new WF41 (7 checks: ledger completeness,
  verbatim reasons, derived accounting, family-page numbers,
  the VT stamp/skip split + guides rule, ledger wiring + no
  chance in the script, taxonomy pin). WF38/WF39/WF40
  tripwires all green on the final tree.
- New `test_ledger35`: **ALL PASS (12 checks)** — ledger
  completeness + verbatim tetrio reason against the records,
  rendered 100 rows with exactly one h1 on parents.html, the
  lookup narrowing (2 of 100 for "tetr") and its honest
  no-match state, curated 2048 correctly rowless, the VT block
  present on games.html and absent on parents.html, 390px
  zero overflow, zero pageerrors on parents.html. (games.html
  is asserted on uncaught pageerrors only: over file:// its
  data fetches are CORS-blocked by design — environmental
  console noise, the class older suites filter.)
- Named suites re-run, all green: `test_versus33` ALL PASS;
  `test_emulatorversus34` ALL PASS; `test_curator24`–
  `test_curator32` ALL PASS (census closed, untouched);
  `test_tournamentnight32` ALL PASS; `test_passport31` ALL
  PASS; `test_lineups23` ALL PASS; `test_converter12` 66/66;
  `test_player21` ALL PASSED; `test_gamenight_parity` PARITY
  OK; `test_gamenight22` ALL PASS; `test_curatornight21` ALL
  PASS; `test_wave17` ALL PASS; `test_wave19` ALL PASS;
  `test_trophy18` ALL PASSED; `test_party_planner11` ALL
  PASS; `test_tournament10` 26 PASS / 0 FAIL;
  `test_bracket` 82/82; `test_bracket_double` 105/105;
  `test_party11` 36/36; `test_wow1` **WOW1 ALL CHECKS PASS**
  (solo verdict); `tests/api.test.sh` **40/40**;
  `~/workspace/smoke/test.js` exit 0.
- **Regression sweep (grep)**: og:image absolute **46/46**
  pages (0 relative); canonical absolute **46/46**;
  exactly-one-`<h1>`: 45 pages static, and game.html — whose
  title is data — keeps its pre-existing pattern (this wave's
  diff to game.html is the head-only VT block; its rendered
  h1 was verified at wave 34 and re-verification over local
  HTTP is blocked in this environment by the headless
  browser's local-network access checks, stated plainly
  rather than re-claimed). View-transition stamp: **42/46**,
  skip set exactly {player, converter, kids, parents}.
- **Load honesty, stated plainly**: the box ran loadavg
  ~8–14 through the rotation. `test_identity16` reproduced
  its documented stall signature exactly in two attempts —
  28 PASS lines counted, **zero assertion failures**,
  `waitCards` timeout at the same call site as waves 30/31/34
  (test_identity16.js:60 via :274) — and is reported as
  load-blocked, not passed. Every other suite completed clean
  on this tree.
- `node --check`: clean on all new/edited JS; AI-slop
  denylist grep clean on all wave-35 prose; no TODOs in the
  wave's files.
- Screenshots inspected (zero pageerrors): `parents.html`
  ledger section desktop (accounting line, lookup box, first
  ledger rows with verbatim reasons) + 390px mobile; archived
  to `~/workspace/progress-archive/button-mash/rotation-014/`.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download
links.

**Self-assessment**: the Kids audit was always two lists; the
site only ever published the flattering one. Publishing the
other half verbatim is the same honesty move as the census
and the seeded surprise — show the record, not a summary of
it — and the wave's smallest fix may be its most telling: the
parents' page had been quoting a catalog that no longer
exists ("70 of our 114") because nothing pinned the sentence
to the data. Now the generator stamps the count and WF41
derives the sentence from the records, so the next time the
catalog grows, the pages either update or fail loudly.
View Transitions graduated the way techniques are supposed
to here: proven in the guides since wave 13, adopted where
cabinet navigation actually gains, and refused — on the
record — for the four pages where motion is either useless
(a live emulator canvas) or against the page's own rule
(the family pages).

## Wave 34 — 2026-10-13 — HEADLINE (stated before building): Emulator Side-by-Side + the Placement Pass completed

**Headline**: the post-Versus frontier the wave-33 completeness
audit named — "no emulator side-by-side (10 emulators, compared
only in guide prose): emulator records differ in shape and
deserve their own treatment of the Versus pattern" — lands as a
side-by-side section on the Emulation hub itself (no new page:
the 46-page surface and its pins hold). Any two of the 10
emulator records side by side from `data/emulators.json` only,
with a verdict strip limited to what the records support.
**Seed discipline (Seed-Reckoning pattern, named here for the
technique ledger)**: the surprise pairing is SEEDED — an FNV-1a
hash of the recorded seed string + the sorted catalog ids feeds
a mulberry32 PRNG; the seed is shown on the page and printed on
the share card, so the same seed against the same catalog deals
the same pairing every time. No unseeded `Math.random` touches
a content-bearing pick on the new surface, and Versus's own
surprise button is converted to the same seeded mechanism this
wave. **Placement Pass remainder** (rotation 12 landed the OG
card + absolute URLs; this wave completes the rest):
`robots.txt`, absolute self-referential `rel="canonical"` on
all pages, honest JSON-LD (ItemList from real game/collection/
emulator records only), `theme-color` + file favicons from the
Foundry icon proposal — all wired at the generator level in
`scripts/build.py` and pinned by new WF39/WF40 tripwires.
Taxonomy untouched: TAXONOMY_BRIEF.md stays **UNDECIDED**
(213 / horror 6 / cozy 16); census untouched (117/117 verified).

**What shipped**

- **FLAGSHIP — Emulator Side-by-Side** (`emulation.html`
  `#side-by-side` + `assets/js/emulator-versus-core.js` (UMD,
  `BM.EmulatorVersus`) + `assets/js/emulator-versus.js` +
  `assets/css/emulator-versus.css`, reusing versus.css's
  fight-card layout): any two of the 10 emulator records side by
  side — systems, platforms, license, the BIOS story, each
  project's own notes verbatim. The verdict strip reports only
  record-backed lines: a listed-system count (only when both
  lists are countable), a platform count, a one-sided BIOS need,
  a license difference reported as a difference. No scores, no
  rankings, no winner. Pairings are URL state
  (`emulation.html?ea=&eb=&seed=`; unknown ids drop with a note,
  an emulator cannot face itself) with a plain-text share card.
  Registration: AGENT.md workflow 9, build_site llms/PAGES lines,
  WF40, `test_emulatorversus34.js`.
- **The counting rule is the flagship's honesty work.** Three
  of the 10 records describe their reach in words, not lists —
  RetroArch's systems are "Dozens via cores," EmulatorJS's list
  ends "and more," webretro's is "Many via libretro cores."
  Those lists render verbatim and are never counted, no systems
  verdict is ever computed against them, and the common-ground
  lines say why. Platform lists are specific on all 10 records,
  so platform counts always stand.
- **SEED DISCIPLINE — the seeded surprise (Seed-Reckoning,
  adopted from the 9th-site test-bed; technique ledger).** Both
  surprise surfaces deal from a recorded seed: an FNV-1a hash of
  the seed string plus the SORTED catalog ids feeds a mulberry32
  PRNG. The seed sits in the seed box, rides in the pairing URL,
  and prints on the share card — the same seed against the same
  catalog deals the same pairing every time, and anyone can
  re-deal it and check. Versus's surprise button — this site's
  last unseeded `Math.random` content pick — is converted to
  the identical mechanism (`BMVersus.seededPair`, seed box on
  versus.html); WF40 regex-pins that no `Math.random` call
  remains in any of the four surface files. Dealt in tests:
  seed "cabinet-34" → Mesen vs mGBA; "first-coin" → Missile
  Command vs Cookie Clicker.
- **PLACEMENT PASS REMAINDER — generator-wired**
  (`scripts/build.py` `wire_placement`, idempotent: a second
  build stamps 0 pages). **Canonical**: absolute,
  self-referential, on the recorded host — 46/46 pages (root
  URL for index.html). **robots.txt**: allow-all + the
  `Sitemap:` pointer (this repo publishes sitemap.xml; its
  `<loc>` entries stay relative per the WF6/7/13/17/18/21/23
  pins — the robots pointer carries the absolute URL the spec
  requires). **JSON-LD**, stamped from the real records only
  and only where a list honestly fits: ItemList of the 213
  games (games.html), of the 24 collections (collections.html),
  of the 10 emulator picks (emulation.html), WebSite on the
  homepage — no ratings, no prices; the records carry none.
  **theme-color + favicons** (Foundry icon/theme proposal):
  `#07070f` — the `--bg` token verbatim — on all 46 pages, and
  the button mark (cabinet-black field, bezel ring `#45456e`,
  one neon-pink disc `#ff2e88`, ink highlight arc) as
  `favicon.svg` (master), `favicon.ico` (16/32/48),
  `apple-touch-icon.png` (180×180), `icon-192/512.png`, all at
  the repo root. One deviation, forced and recorded: the
  proposal's head block uses root-absolute hrefs; this repo's
  link checker and file:// browsing cannot resolve those, so
  the links are depth-relative to the same root files (the OG
  rollout's own original form). **`og:image:width/height`**
  1200/630 on all pages — the Foundry's standing minor, closed.
  Two existing checks were aligned to their intent on the way:
  build.py's guide allowlist scan and WF17 now scope to
  reference links — the head canonical is the site's own
  recorded host, not a guide reference.
- **RULE 1762**: line endings audited — **0 CRLF files**
  tree-wide; `.gitattributes` added, pinning `* text eol=lf`
  **with binary carve-outs** (`*.png`/`*.ico`/`*.woff2`/… marked
  `binary`). The carve-outs are load-bearing, and the catch is
  recorded for the fleet: a bare `* text eol=lf` made git
  normalize CRLF byte pairs inside the new PNG/ICO files on
  `git add` — the committed blobs differed from disk (verified
  by sha256) until the attributes were fixed and the files
  re-added byte-identical. A line-ending pin that silently
  rewrites binary assets is worse than no pin.
- **Commons adoptions (align-on-touch, noted per the rule)**:
  the canonical sibling of rotation 12's OG-absolutize pattern
  (same recorded host, strict-equality WF pin — WF39), the
  Foundry icon/theme proposal (values verbatim), and the
  Seed-Reckoning seed discipline from the 9th-site test-bed.

**Validation (wave 34, final runs):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 24
  collections, 10 emulators, 24 guides**; **LEGAL GATE OK (47
  pages, 213 game URLs, 0 piracy links)**; placement wiring
  stamps 46 pages on first build, 0 on rebuild (idempotent).
  The build's timestamp-only `data/v1` regeneration churn was
  reverted — this wave is pages + wiring + assets + this entry.
- `scripts/check_links.py`: **LINK CHECK OK — 46 pages, 1874
  local links, 125 external links, 0 broken** (local count up
  from 1731: the per-page canonical/favicon links resolve).
- `node scripts/check_api_workflows.js`: **320/320 pass
  (WF1–WF40)** — new WF39 (7 checks: canonical exact on 46,
  theme/favicon/og-dims block, favicon files + geometry tokens,
  robots, JSON-LD derivation + honesty, taxonomy pin) + WF40
  (6 checks: emulator profiles/counting rule, verdict
  discipline, seed reproducibility on both surfaces, the
  no-`Math.random`-call pin, page wiring, taxonomy pin).
- New `test_emulatorversus34`: **ALL PASS (18 checks)** — core
  units on the real records, seeded-deal reproducibility in the
  page (deal → core's exact pairing → seed in URL + on card),
  dropped-id note, 390px zero overflow, zero pageerrors.
- Named suites re-run, all green: `test_versus33` ALL PASS;
  `test_curator24`–`test_curator32` ALL PASS (census closed,
  untouched); `test_tournamentnight32` ALL PASS;
  `test_passport31` ALL PASS; `test_lineups23` ALL PASS;
  `test_converter12` 66/66; `test_player21` ALL PASSED;
  `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL
  PASS; `test_curatornight21` ALL PASS; `test_wave17` ALL PASS
  (emulation hub incl. the new section, zero pageerrors);
  `test_wave19` ALL PASS; `test_trophy18` ALL PASSED;
  `test_party_planner11` ALL PASS; `test_tournament10` ALL
  PASS; `test_bracket` 82/82; `test_bracket_double` 105/105;
  `test_party11` 36/36; `test_wow1` **WOW1 ALL CHECKS PASS**;
  `tests/api.test.sh` **40/40**; `~/workspace/smoke/test.js` exit 0.
- **Regression sweep (grep + rendered)**: og:image absolute
  **46/46** pages (0 relative); canonical absolute **46/46**;
  exactly-one-`<h1>`: 45 pages static, and game.html — whose
  title is data — renders exactly one (`h1Count = 1`, "Zork I")
  via game-detail.js, the pre-existing pattern, verified
  headless with zero pageerrors; emulation.html rendered
  `h1 = 1` with both side-by-side cards up.
- **Load honesty, stated plainly**: the box ran loadavg
  ~10–14 through the rotation. `test_identity16` reproduced
  its documented stall signature exactly in the battery and in
  two solo re-runs — 28 PASS lines counted, **zero assertion
  failures**, `waitCards` timeout at the same call site as
  waves 30/31 — and is reported as load-blocked, not passed.
  Every other suite completed clean on this tree.
- `node --check`: clean on all new/edited JS; AI-slop denylist
  grep clean on all wave-34 prose; no TODOs in the wave's files.
- Screenshots inspected (zero pageerrors): `emulation.html`
  side-by-side desktop (mgba vs DuckStation: cards, BIOS +
  license lines) + 390px mobile; archived to
  `~/workspace/progress-archive/button-mash/rotation-013/`.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download
links.

**Self-assessment**: wave 33's audit said the emulator records
"deserve their own treatment of the Versus pattern" because
their shape differs — the shape difference turned out to be the
interesting part: a third of the records refuse to be counted,
and a comparison tool that counted them anyway would have been
inventing precision. The seeded surprise is the wave's other
product: two surfaces that used to roll dice now show their
work, and the seed on the share card means a pairing somebody
screenshots can be re-dealt and verified by anyone, forever,
from two recorded inputs. The placement pass closes the same
way the OG fix did — wired in the generator, pinned by strict
checks, and verified by counts rather than by looking.

## Addendum — 2026-10-13 — Foundry round 6 absolute-URL catch (priority fix)

- **Before (relative, crawler-blind):** rotation 12 / Foundry
  round 2 wired `og:image` + `twitter:image` on all 46 pages
  with site-relative paths (`assets/og-card.png` at root,
  `../assets/og-card.png` one level down). Browsers resolve
  those, but major social crawlers require absolute URLs — as
  wired, shared links rendered no card.
- **After (absolute):** every page's `og:image` and
  `twitter:image` is now the single absolute URL
  `https://button-mash-live.vercel.app/assets/og-card.png`
  (46 pages × 2 tags; grep confirms 46 absolute, 0 relative).
  The local asset is unchanged (`assets/og-card.png`,
  1200×630, byte-stable).
- **Tripwire:** WF38 in `scripts/check_api_workflows.js` now
  requires that exact absolute URL on every page (strict
  equality, so any regression to a relative path fails —
  verified by a negative test: reverting one page to relative
  made WF38 fail, 306/307) and still validates the local asset
  at `assets/og-card.png` (present, 1200×630).
- **General rule for the fleet:** sites with live domains
  absolutize `og:image`/`twitter:image` in the working repo;
  sites without one carry a GO_LIVE.md deploy-time note to
  absolutize when a host is confirmed — never an invented
  domain.
- **Validation:** `node scripts/check_api_workflows.js`
  **307/307 pass (WF1–WF38, incl. updated WF38)**;
  `scripts/build.py` **BUILD OK** (213 games, LEGAL GATE OK);
  `scripts/check_links.py` **LINK CHECK OK — 46 pages, 1731
  local links, 0 broken**. The build's timestamp-only
  `data/v1` regeneration churn was reverted — this fix is
  pages + tripwire + this entry only.

## Wave 33 — 2026-10-13 — Versus, the completeness audit, and the free-tier audit

**What shipped** — three tracks: a flagship (Versus, head-to-head
game comparison on the fleet's Showdown pattern), the standing
completeness audit walked over every collection/category surface,
and the free-tier / best-pattern engineering audit written into
LIVE_CHECKLIST.md. Taxonomy untouched throughout:
TAXONOMY_BRIEF.md stays **UNDECIDED**, nothing reshelved
(213 / horror 6 / cozy 16). No claim text was touched, and the
curator suites stay green on the closed census (117 instances,
all verified, 0 unverified — no new census pass was needed).

- **FLAGSHIP — Versus** (`versus.html` + `assets/js/versus-core.js`
  + `assets/js/versus.js` + `assets/css/versus.css`): any two
  catalog games side by side, built only from real catalog
  records. Each corner shows the game's own description verbatim,
  the year its description names, genre, controls, play host,
  the collections it sits on (counted from collections.json),
  tags, its Kids corner audit status, and its written coverage
  on this site (a genre deep dive — only roguelike and cozy have
  one — and/or a Kids listing with a parent note). The catalog
  carries no structured year/maker fields, so Versus invents
  none: the year is read from the description under the Curator
  census's own rules (first explicit 4-digit year; 2048's name
  number excluded; a decade is not a year), which lands on
  exactly the census's 45 verified year claims, and maker facts
  stay where the census verified them — inside the quoted
  description. The verdict strip reports only what the two
  records support: older/newer when both years are named, a
  bigger or equal collection footprint, more written coverage,
  a one-sided Kids pass — ties reported as ties, common ground
  listed separately, and **no scores, rankings, or winner,
  ever**. Where neither record carries a year, a shelf, a tag,
  coverage, or a Kids pass (the catalog's bare tail — kaaarot,
  bloxd, moomoo, zombs, classicreload, lexaloffle-bbs and four
  more), the strip shows an honest **"no basis to compare"**
  state and the rows still render. Pairings are URL state
  (`versus.html?a=<id>&b=<id>`; unknown ids drop with a note, a
  game cannot face itself), with swap + surprise pairing and a
  plain-text share card listing only the rows and verdict lines
  produced. Registration the established way: nav on all 46
  pages, `build_site.py` page + llms lines, AGENT.md centerpiece
  + workflow 8, sitemap, WF37 (8 checks) in
  `check_api_workflows.js`, `test_versus33.js` (20 checks:
  profile/year/verdict/thin/pairing/card units on the real
  catalog, the headless dated + bare pairings, the dropped-id
  note, swap, 390px zero overflow, zero pageerrors).
- **The regression this wave caused — and fixed.** Adding the
  Versus nav item pushed the wrapped sticky header at 390px
  from 379px (wave-32 tree, measured) to 427px — half the
  viewport, sitting over the controls below it.
  `test_curatornight21` caught it: 40 PASS and zero assertion
  failures, then its mobile scenario's click on Deal landed
  under the header three runs in a row. Probes isolated it
  (JS-dispatched click deals instantly; a wave-32 worktree
  deals on the same harness click at 379px), and the fix is in
  `assets/css/layout.css`: under 40rem the header keeps its
  marquee and chase strip but scrolls with the page
  (`position: relative`) instead of sticking. curatornight21
  then ran **ALL PASS (43 checks)** solo, and every other
  mobile-sensitive suite was re-run green on the fixed tree.
  The wave's own test caught a second, smaller bug the same
  way: the dropped-id notice was set before `render()` cleared
  the alert line, so it could never be seen — the notice now
  posts after render, and the test waits on the condition
  instead of a fixed sleep that flaked once under load.
- **COMPLETENESS AUDIT — findings and verdicts.** Walked: the
  directory, the game file, collections + passport, kids +
  parents, genres, the guides hub, emulators, player/converter,
  party/game-night/tournament/tournament-night, trophy room,
  system picker, monster taming, the v1 API. *Filled this
  wave:* the missing head-to-head comparison (Versus itself —
  the one decision surface the catalog's 213 records could not
  answer side by side). *Recorded, with reasons:* **52 of 213
  games sit on no collection shelf** (Zork I, Minecraft
  Classic, Monkey Island among them) — not filled: a new shelf
  moves the 24-collection count the Passport and its suites
  pin, and shelf curation is the Curator's human-grade work,
  not a wave drive-by; Versus gives every orphan a side-by-side
  surface meanwhile. **Genre deep dives exist for 2 of 8
  genres** (roguelike, cozy); puzzle — the largest genre at 48
  — action, multiplayer, retro, idle, and horror have none:
  each dive is flagship-scale curated writing, queued as
  future waves; the Versus coverage row names the absence per
  game instead of hiding it. **Kids exclusion reasons** (100
  games, in data/kids.json) surface nowhere user-facing and
  kid-safe.json exposes only the curated subset — publishing
  per-game exclusion reasons on a parents' surface needs a
  copy/sensitivity pass of its own. **No emulator
  side-by-side** (10 emulators, compared only in guide prose):
  emulator records differ in shape (systems/platforms/license/
  BIOS) and deserve their own treatment of the Versus pattern.
  **No structured year/maker fields** in games.json: the facts
  live in census-verified prose, and structuring them is a
  curator-grade re-verification project, not a schema edit.
  *Checked and NOT gaps:* the collections page already carries
  shelf-jump navigation; the directory already has search,
  filters, random, and game-of-the-day; every game already has
  a full game file; the trophy room already tracks collection
  progress; the horror shelf's thinness (6) is the pending
  human taxonomy call, untouched by design.
- **QA-006 (QA Corps round 1) — homepage had two `<h1>`s.**
  The hero's "Your browser is the console." is the page's
  primary first-visit heading and stays the only `<h1>`; the
  cabinet marquee's "BUTTON MASH" sign (`index.html`,
  `.marquee-title`) is demoted to `<h2>` — it is the attract
  cabinet's branding inside a section that already carries its
  own `<h2>`, not the page heading. No CSS change was needed:
  `.marquee-title` in attract.css declares its own font, size,
  and margins, and base.css treats h1/h2 identically, so the
  rendering is unchanged. Homepage now has exactly one `<h1>`
  (verified by grep + the headless re-check below); the other
  pages this wave touched were swept opportunistically and
  each already has exactly one (versus, tournament-night,
  passport, collections, game-night).
- **Foundry round 2 — the OG card, wired site-wide (the
  canonical pattern, for the Commons to harvest).** The
  gate-passed card from the Asset Foundry
  (`fleet-ops/assets/button-mash/og-card.png`, 1200×630,
  typographic arcade-cabinet treatment, no generated imagery)
  is copied to **`assets/og-card.png`** — the repo's asset
  convention — byte-identical to the Foundry source. Every one
  of the site's 46 pages (root, genres/, guides/; the
  assets/vendor build template is not a page and is excluded)
  now carries the same eight-line block **immediately after
  its `<meta name="description">`**: `og:type` (website),
  `og:title`, `og:description`, `og:image`,
  `twitter:card` (**summary_large_image**), `twitter:title`,
  `twitter:description`, `twitter:image`. Two rules make it
  canonical: **(1) no invented copy** — og:title is the page's
  own `<title>` and og:description its own description meta,
  reused verbatim per page; **(2) generator-safe by pin, not
  by hope** — page heads are source in this repo (the build
  regenerates only llms/sitemap/data and cannot strip them),
  and **WF38** fails the suite if any page loses the block,
  mistypes the card value, points og:image at a file that does
  not resolve from that page's depth, or lets the asset drift
  from 1200×630. og:image is the site-relative path
  (`assets/og-card.png`, `../assets/og-card.png` one level
  down): no canonical production host is recorded for this
  site, and prefixing an invented domain would be worse than
  an honest relative path — when a host is confirmed, prefix
  it in one pass and WF38 still holds. Before this wave the
  fleet grep for og:image on this site returned **zero**; it
  now returns all 46 pages.
- **AUDIT WORKSTREAM — free-tier / best-pattern** (full text in
  LIVE_CHECKLIST.md): **5 functions of the 12 cap** (health,
  games, collections, game-night, cron/curator), all
  zero-dependency, `maxDuration: 10`, no `runtime` key.
  **Estimated invocations: ≤ ~20,000/month before edge caching**
  at a stated assumption of 10,000 page views/month with ≤2
  live probes per view; SWR collapses origin hits to the low
  thousands in practice; cron adds ~4–5. **Durations measured
  in-process:** health median 1.58ms (p95 5.33ms), games list
  0.17ms, games `?id=` 0.05ms, collections 0.24ms, game-night
  POST 0.56ms (max 12.95ms) — >30× headroom under the 10s
  ceiling even cold; the cron is the only long pole, bounded
  by its 9.5s internal hard stop by design. **First
  degradation point:** the per-instance rate limiter sheds
  first (429 + Retry-After, frontend already on static
  fallback); behind it the invocation budget at ~5× the stated
  traffic — and Hobby pauses rather than bills, with every
  page still rendering from `data/v1`. **Fix shipped:**
  `vercel.json` gained explicit SWR `Cache-Control` headers
  for `/data/v1/(.*)` (mirroring the API envelope) and
  `/assets/(.*)` — the static surfaces previously had none.
  Alignment otherwise holds: static-first, precomputed JSON,
  honest fallbacks, small handlers, health surfacing (the
  Live Wire model); frontend request dedupe is absent by
  design — the URL space is tiny and edge SWR coalesces.

**Validation (wave 33, final runs):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (47 pages, 213 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 46 pages, 1731 local links, 79 external links, 0 broken**
- `node scripts/check_api_workflows.js`: **307/307 pass (WF1–WF38)** — new WF37 (8 checks: versus core, census-matched year rule, verdict discipline, thin state, pairing validation, page wiring, taxonomy pin, legal lane) + WF38 (4 checks: OG card asset + wiring on all 46 pages, QA-006 one-h1 pin, taxonomy pin)
- **QA-006 + Foundry round 2 verification**: rendered-DOM re-sweep of the homepage — `h1Count = 1` (sole h1: the hero title), marquee is `<h2 class="marquee-title">` with computed style unchanged (Press Start 2P, 41.6px at desktop width, declared margins), zero pageerrors; og:image grep returns all 46 pages before and after a full `build.py` rebuild. `test_wow1` note: its hardcoded "22 CURATED SHELVES" expectation had gone stale against the real 24 (the page was right; the check passed only when the rotation sample landed on another callout) — the expectation now derives from data/collections.json + data/kids.json, and the suite runs **WOW1 ALL CHECKS PASS (48 PASS lines)** on the fixed tree; the same suite on a wave-32 worktree also passed, confirming no wave-33 regression in the demo loop
- New `test_versus33`: **ALL PASS (20 checks)**; curator suites `test_curator24`–`test_curator32` **ALL PASS** (census closed, untouched)
- Named suites re-run: `test_tournamentnight32` **ALL PASS**; `test_passport31` **ALL PASS**; `test_lineups23` ALL PASS; `test_converter12` 66/66; `test_player21` ALL PASSED; `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL PASS; `test_curatornight21` **ALL PASS (43 checks)** — after the header fix above; its pre-fix runs (batch + two solos) each stopped at 40 PASS with zero assertion failures on the mobile click the header covered, and the fix + probes are documented in the entry; `test_wave17` ALL PASS; `test_wave19` ALL PASS; `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `tests/api.test.sh` **40/40**
- **Load honesty, stated plainly**: the box ran loadavg ~8–12
  through the rotation (and rebooted once mid-wave, wiping
  /tmp). Both documented load-flake suites got clean solo runs:
  `test_identity16` **ALL PASS (41 PASS lines)** and
  `test_wow1` **WOW1 ALL CHECKS PASS (48 PASS lines, 0 FAIL)**
  — solo re-run verdicts, stated as such; their powerunit
  (ALL PASS) and playertail (PASS) sub-suites also passed.
  `~/workspace/smoke/test.js`: exit 0.
- `node --check`: clean on all new JS; AI-slop denylist grep clean on all wave-33 prose; no TODOs in the wave's files
- Screenshots inspected (zero pageerrors): `versus.html` desktop (sign, pickers, both record cards, verdict strip, share card) + 390px mobile pre- and post-header-fix (stacked cards, zero overflow), homepage desktop (Versus in nav, hero intact)

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: Versus is the Showdown pattern with this
catalog's honesty rules bolted on where the fleet's version
could lean on structured fields: there is no year column here,
so the wave's quiet work was proving the prose could carry the
comparison — the year rule lands on exactly the census's 45
verified claims, and everything the strip says is a count, a
date, or an audit fact. The wave's other product is a caught
regression with a receipt: the flagship's own nav line broke
a three-wave-old mobile flow, the suite caught it, probes in
two trees isolated it to 48 pixels of sticky header, and the
fix made every mobile page better, not just the failing one.
The completeness audit's honest shape is one gap filled and
five recorded — the recorded five are each a real piece of
future work with a named reason, which is what the audit is
for.

## Wave 32 — 2026-10-13 — Curator pass 7 (the census closes) and Tournament Night

**Recovery note**: this rotation's builder parked mid-build —
the full wave sat uncommitted in the working tree on top of
wave 31's `648ae56`. A recovery pass audited the diff file by
file (games.json, the new tournament-night files, the curator
suites, the workflow registration), found both duties complete
and coherent, ran the whole battery below, added this entry,
and shipped it as one commit. Nothing in the parked diff was
discarded or rewritten.

**What shipped** — two tracks: Curator pass 7, the final census
tranche (all 18 remaining unverified maker/attribution claims),
and a flagship: Tournament Night, a bracket night whose entrants
are the games themselves. Taxonomy untouched throughout:
TAXONOMY_BRIEF.md stays **UNDECIDED**, nothing reshelved
(213 / horror 6 / cozy 16).

- **Curator pass 7 — the maker tranche** (`data/games.json`,
  each checked 2026-10-12 against sources outside the repo —
  Wikipedia, MobyGames, the games' own pages, the makers' own
  sites/repos). **Seventeen stand as written** and are pinned
  verbatim in `test_curator32`: Codenames (codenames.game is
  Czech Games Edition's own), Song Maker (Google's Chrome Music
  Lab), Nested (Orteil's, on his own DashNet domain — its own
  page's fetch was blocked here, so the pin rests on the domain,
  Wikipedia, and the secondary record, stated honestly in the
  suite), Tristram (its own itch page: "MADE IN 72 HOURS FOR
  LUDUM DARE 55"), Vampire Survivors (poncle's own itch page,
  whose FAQ calls the web build "pretty much like a demo"),
  Doing Work (Pippin Barr's own project list), Run 3's maker
  claim (Player03 is Joseph Cloutier; player03.com is his author
  site), Subway Surfers (SYBO's; Poki is SYBO's official web
  partner), Stickman Hook (Madbox, credited on the linked Poki
  page), arras.io (the record's "fan-made sequel to diep.io" —
  a successor, exactly as claimed), Hole.io (Voodoo, per
  Wikipedia), Tanki Online (its own official domain;
  AlternativaPlatform per Wikipedia), Stumble Guys (Scopely's,
  on the game's own domain), Synergism (the Pseudo-Corp GitHub
  org's own Pages build of its SynergismOfficial repo), Realm
  Grinder (Divine Games per MobyGames/Steam; the linked
  Kongregate build is the developer's own upload), Simon
  Tatham's Puzzles (the JS builds on Tatham's own chiark site),
  Sort the Court (its own itch page credits Graeme Borland,
  @graebor). **One fix**, an attribution error of the Dad 'n Me
  family: **Chogue** called itself "Pippin Barr's strangest
  hybrid" — it is co-created by Pippin Barr AND Jonathan
  Lessard (the game's own repo and press kit name both); the
  entry now co-credits Lessard. **One link fix**: Run 3 linked
  player03.com's root, which the author's own overhaul turned
  into his blog — the entry now links the game itself at
  player03.com/run/3/ (a direct fetch of that path failed in
  this environment; the pin rests on the record plus the
  author's own blog, stated honestly in the suite).
- **The census is closed**: 117 claim instances, ALL verified
  (45 year + 50 maker + 22 superlative); 0 unverified; 70
  entries carry a claim, 143 carry none. `test_curator30`'s
  keyword gate is updated to the closed counts and keeps the
  census closed; `test_curator31`'s remainder note now points
  at this pass. No fetch in this pass raised a sharing/data
  approval card; the two sources that could not be fetched
  directly (Nested's own page, Run 3's /run/3/) were pinned on
  the surrounding record and named as such in the suite rather
  than retried through another route.
- **FLAGSHIP — Tournament Night** (`tournament-night.html` +
  `assets/js/tournament-night-core.js` + `assets/js/tournament-night.js`
  + `assets/css/tournament-night.css`): the games take the
  bracket. Pick a hand-built collection or a saved Game Night
  lineup (`bm.lineups.v1`, read through the lineups store, never
  a copy) and its real games seed a single-elimination bracket
  in source order — first game, top seed, honest top-seed byes —
  on the cabinet's own bracket engine (`assets/js/bracket.js`;
  the math is not reinvented). One click picks a match winner;
  picks persist client-side in `bm.tournament-night.v1`
  (in-memory fallback with an on-page notice when storage is
  blocked; a stored night validates whole — bracket players must
  equal the entrant titles exactly or the night drops, never
  half-renders). A finished night crowns its champion with the
  game's real catalog description and play URL, and the results
  card is plain text listing only matches the bracket actually
  decided. Registration the established way: nav on all pages,
  `build_site.py` page + llms lines, AGENT.md workflow 7, sitemap,
  WF35 (curator pass 7) + WF36 (Tournament Night) in
  `check_api_workflows.js`, `test_tournamentnight32.js` (27
  checks: entrants from both sources, seeding, picks, cascade,
  persistence round-trip, the card, the headless night end to
  end, 390px zero overflow, zero pageerrors).

**Validation (wave 32, final runs):**
- `scripts/build.py`: **BUILD OK — 213 games (149 domains), 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (46 pages, 213 game URLs, 0 piracy links)**
- `scripts/check_links.py`: **LINK CHECK OK — 45 pages, 1635 local links, 79 external links, 0 broken**
- `node scripts/check_api_workflows.js`: **295/295 pass (WF1–WF36)** — new WF35 (8 checks, pass 7 + closed census) + WF36 (tournament night)
- Curator suites: `test_curator24`–`test_curator32` **ALL PASS** (32 = new: tranche scope, 17 pinned verbatim, Chogue fix + Run 3 link fix pinned, census-closed checks, taxonomy pins)
- Named suites re-run: `test_tournamentnight32` **ALL PASS (27 checks)**; `test_lineups23` ALL PASS; `test_converter12` 66/66; `test_player21` ALL PASSED; `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL PASS; `test_curatornight21` ALL PASS; `test_wave17` ALL PASS; `test_wave19` ALL PASS; `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_passport31` ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `tests/api.test.sh` **40/40**
- **Load honesty, stated plainly**: the box ran loadavg ~9–10
  during this recovery. Both documented load-flake suites got
  clean solo runs this rotation: `test_identity16` **ALL PASS
  (42 PASS lines)** and `test_wow1` **WOW1 ALL CHECKS PASS (49
  PASS lines, 0 FAIL)** — solo re-run verdicts, stated as such;
  their powerunit/playertail sub-suites also passed in the
  battery. `~/workspace/smoke/test.js`: exit 0.
- `node --check`: clean on all new JS; AI-slop denylist grep clean on all wave-32 prose; no TODOs in the wave's files
- Screenshots inspected (zero pageerrors): homepage desktop + 390px mobile (hero intact, Tournament night in nav, stat band 213/113/24/24), `tournament-night.html` desktop + 390px mobile (marquee hero, nav current state, no overflow)

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: the census that wave 30 opened at 119
instances closes at 117, every one of them read against a source
outside this repo — and the tranche's only error was the shape
this catalog keeps making: a singular possessive on split work.
Chogue joins Dad 'n Me in that small, now-twice-documented
family. Tournament Night is the flagship the bracket engine was
always pointed at: Tournament 2.0 ran players through games;
this runs the games themselves, and its honesty rules are the
passport's — the card lists only what the bracket decided, the
champion's copy is the catalog's own words, and a corrupt night
is dropped whole rather than half-shown.

## Wave 31 — 2026-10-12 — Curator pass 6 (superlatives + years) and the Arcade Passport

**What shipped** — two tracks: the census remainder worked in
wave 30's own order (the seven superlatives first, then the five
years), and a flagship: the Arcade Passport, a stamp booklet for
the 24 collections. Taxonomy untouched throughout:
TAXONOMY_BRIEF.md stays **UNDECIDED**, nothing reshelved.

- **Curator pass 6 — the superlatives** (`data/games.json`, each
  checked 2026-10-12 against Wikipedia, Mojang's own statement,
  and the games' own pages). **Four stand as written** and are
  pinned verbatim in `test_curator31`: **Agar.io** "defined .io
  games" (its rise "led to the beginning of a new genre of
  browser games, dubbed '.io games'"), **Celeste Classic** "The
  original PICO-8 Celeste" (the August 2015 PICO-8 jam game,
  retroactively titled Classic), **Spelunky Classic** "The
  original free Spelunky" (Derek Yu's December 21, 2008 freeware;
  the entry links and names its HTML5 port), **Minecraft
  Classic** "the original 32 blocks" (Mojang's anniversary
  statement: "the original creative mode, complete with 32
  blocks"). **Three fixes**: **Canabalt** "started a genre" is
  the record's own named misconception — Ovenbreak reached the
  App Store two months earlier, and Canabalt is credited with
  *popularizing* the endless runner; the entry now claims that.
  **Cookie Clicker** "defined idle games" — Cow Clicker and
  Candy Box! predate it; incremental games "gained popularity in
  2013 after the success of Cookie Clicker," so it too now says
  *popularized*. **Powder Game** "The original falling-sand toy"
  is simply false — the genre's original is the 2005 Dofi-Blog
  applet; Powder Game (2007) is a later entry — so the claim is
  removed, the Angband shape.
- **Curator pass 6 — the years.** **Three stand as written**:
  **Urban Dead**'s 2005 (launched July 3, 2005), **Minecraft
  Classic**'s 2009 (the Classic phase, May–December 2009, is
  what the linked anniversary build preserves), **Dare to
  Doku**'s GBA Jam 2026 (the game's own itch page states it was
  made for the jam, and confirms its 10,000 levels and 4–10
  grids). **One fix**: **AdVenture Capitalist** "ate 2015" —
  the browser game launched on Kongregate May 30, 2014 and was
  Kongregate's most played game of 2014 (Hyper Hippo's own
  post-mortem); 2015 was the Steam/mobile expansion. In the
  Transport Tycoon shape the entry now names 2014, and the same
  sources settle its maker claim in passing (Hyper Hippo
  Productions, developer and publisher; the linked build is
  their own Kongregate upload), so it leaves the maker
  remainder too. **One closure by removal**: **Recoil Foundry**'s
  "2026 jam gem" — its own itch page names no jam and no year
  and presents an expanded, still-updated full release; no
  source settles the claim, so the framing is removed (the
  Mindustry rule).
- **The census after pass 6** (updated in `test_curator30`, gate
  intact): **117 claim instances** (two removed, not relocated),
  **99 verified (45 year + 32 maker + 22 superlative)**, **18
  unverified — all maker/attribution, across 18 entries**; 70
  entries carry a claim, 143 carry none. Every year and
  superlative claim in the catalog has now been checked against
  a source outside the repo. What remains is one tranche: the
  maker/official-status list, which needs the linked builds
  checked as much as the names.
- **The flagship — Arcade Passport** (`passport.html`,
  `assets/js/passport-core.js`, `assets/js/passport.js`,
  `assets/css/passport.css`): the 24 collections as a stamped
  booklet — cream paper, perforated edge, ink stamps rotated per
  shelf. A stamp lands only when a shelf actually scrolls into
  view on `collections.html` (IntersectionObserver, threshold
  0.25; first sighting wins and is never re-dated; stamped
  shelves wear an ink ribbon and the Collections hero chip
  carries the running count). Guide marks are the passport's
  visa pages: derived at render time from the guides' own
  checklist store (`bm_checks_v1` via `BM.getChecks`), never
  stored twice — a mark means every step of a checklist guide
  (RetroArch setup, EmulatorJS self-hosting — the only guides
  whose completion the site tracks) is ticked, and the
  registry's step counts are pinned against the real guide pages
  by `test_passport31`. State is `bm.passport.v1`, browser-local
  with the standard in-memory fallback and on-page notice. The
  page says plainly what is not counted: no play telemetry —
  playing happens on other sites, and the Trophy Room owns that
  record. Wired into the primary nav of all 44 site pages,
  `build_site.py`'s page list (llms/sitemap regenerated),
  AGENT.md, and WF34.
- **Taxonomy: still untouched, deliberately.** purrgatory,
  Lookouts and Little Troubles in Spooky Town remain pinned in
  horror (census 213 / horror 6 / cozy 16), now enforced by
  `test_curator30`, `test_curator31` and WF32–WF34.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (44 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (44 pages, 1540 local links)**
- `node scripts/check_api_workflows.js`: **280/280 pass (WF1–WF34)** — new WF33 (6 checks, pass 6) + WF34 (7 checks, the Passport); WF32's census checks updated to the post-pass-6 counts (46 year hits = 45 verified + 2048's title)
- `node scripts/test_curator30.js`: **ALL PASS** (census updated); `node scripts/test_curator31.js`: **ALL PASS** (new — tranche scope, six pinned verbatim, five fixes/closures verbatim, census-aftermath)
- `node scripts/test_passport31.js`: **ALL PASS** (new — core units with injected storage, registry pins against the real guides, headless stamp flow: scroll → stamps persist → booklet renders the same counts → checklist completion earns the visa mark → surrender clears stamps only; mobile 390px zero overflow; zero pageerrors)
- Named suites re-run: `test_lineups23` **ALL PASS**; `test_curator24`–`test_curator29` **ALL PASS**; `test_converter12` **66/66**; `test_player21` **ALL PASSED**; `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL PASS; `test_curatornight21` ALL PASS; `test_wave19` ALL PASS; `test_wave17` ALL PASS; `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `tests/api.test.sh` **40/40**; `~/workspace/smoke/test.js`: exit 0
- **Load honesty, stated plainly**: the box ran loadavg ~10–14
  all night (parallel flagship builds). `test_identity16` did
  NOT get a clean run this wave: seven attempts, every one the
  documented stall — 28/41 green where counted, zero assertion
  failures, `waitCards` timeout — and it is reported as not-run,
  not as passed. `test_wow1` is in the same state: its powerunit
  and playertail suites passed in the battery, and the main run
  produced partial all-PASS prefixes (48 PASS lines on one solo)
  before harness context/timeout errors under the same load —
  zero assertion failures observed in any attempt. Every other
  suite above completed clean on this tree, most of them twice.
- `node --check`: clean on all new/edited JS; AI-slop denylist grep clean on all new prose; no TODOs in the wave's files
- Screenshots inspected (zero pageerrors): homepage hero (3-second read intact, passport in nav, stat band 213/113/24/24), `games.html` directory hero ("213 games. Zero installs."), `collections.html` shelves mid-scroll with stamps landing, `passport.html` hero with real seeded progress (3/24 stamped, 1/2 guide marks, first-stamp date) and the booklet grid, passport at 390px mobile (zero overflow). Archived to `~/workspace/progress-archive/button-mash/rotation-010/`.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: pass 6 found the remainder healthier than
the retro shelves were — nine of twelve claims were right — but
its three errors were the familiar kinds: two verbs one notch
too strong ("started"/"defined" where the record says
"popularized"), one "original" that belonged to a 2005 applet
two years older than the game, and one year that belonged to a
game's expansion rather than its launch. The Passport's honesty
rule is the wave's other product: a progress system that only
counts what the site can see (a shelf on screen, a checklist
ticked) and says so on its own page is worth more than a bigger
number invented from telemetry the site does not have. What
remains on the Curator's list: the 18 maker/attribution claims —
the last tranche, and the one where the linked builds matter
most.

## Wave 30 — 2026-10-12 — The census: every claim in the catalog, counted

**What shipped** — wave 29 closed the Curator's named list: every
tranche waves 24–28 queued has been worked, and its self-assessment
named the only thing left — "scattered year/maker claims outside
the retro/DOS/Flash shelves, if a future pass wants to sweep the
whole catalog description by description." This wave is that
sweep, run as a census rather than a pass: it verifies nothing new
and fixes nothing, and its finding is the size and shape of the
remainder, with every unverified claim named.

- **The census** (`scripts/test_curator30.js`): all 213 game
  descriptions read claim by claim under three definitions — a
  YEAR claim is an explicit 4-digit release/era year (2048's title
  number is not a year; a setting's decade is not a release year);
  a MAKER claim names a person/studio/collective, claims official
  status for the linked build, or claims a lineage/provenance
  (host credits and character possessives do not count); a
  SUPERLATIVE claim is a checkable precedence assertion
  (first/original/pioneer/defined/started/named-the-genre), with
  subjective puffery and numeric/content counts out of scope by
  rule, and open-source/free claims out of scope because wave 26
  closed that audit. **The count: 72 of 213 entries carry at
  least one such claim — 119 claim instances in all. 88 instances
  across 43 entries stand verified by waves 24–29. 31 instances
  across 29 entries remain unverified: 5 year, 19 maker/
  attribution, 7 superlative. The other 141 entries carry no
  claim of these types at all.**
- **The remainder, by type.** *Year (5):* Urban Dead's "2005
  classic," Minecraft Classic's 2009, Dare to Doku's GBA Jam
  2026, Recoil Foundry's "2026 jam gem," AdVenture Capitalist's
  "ate 2015." *Maker/attribution (19):* the named possessives
  (Google's Song Maker, Pippin Barr's two entries, SYBO, Madbox,
  Voodoo, Scopely, Pseudo-Corp, Divine Games, Hyper Hippo,
  Graebor, Player03), the official-status claims (Codenames,
  Vampire Survivors' web demo, Tanki, Tatham's JavaScript
  builds, and the "officially on Poki/Kongregate" riders inside
  the SYBO/Madbox/Scopely/Divine Games entries), and the
  provenance claims (Nested's "Cookie Clicker creator,"
  Tristram's Ludum Dare 55, Arras.io's diep.io succession).
  *Superlative (7):* Canabalt "started a genre," Cookie Clicker
  and Agar.io each "defined" their form, and four "original"
  claims — Celeste Classic, Spelunky Classic, Powder Game, and
  Minecraft Classic's "original 32 blocks."
- **Honest edges, recorded in the test so they are not
  re-litigated:** three remainder entries are partially verified
  on other axes — Minecraft Classic's free claim and Synergism's
  and Arras.io's open-source claims were checked in wave 26;
  their year/original and maker claims were not. Angband counts
  in the verified-superlative set as a closed case: wave 24
  removed its superlative rather than verifying it. Five
  keyword hits are ruled non-claims (2048's name-number,
  Astray's "first person," PICO-8's platform possessive,
  Absurdle's "Wordle's twin" genre metaphor, Universal
  Paperclips' pronouns). The census is load-bearing, not a
  snapshot: test_curator30's gate fails any future description
  that adds a year, maker, or precedence claim anywhere in the
  catalog until a curator pass accounts for it — the remainder
  can only shrink by verification, never grow by drift.
- **Taxonomy: still untouched, deliberately.** The
  TAXONOMY_BRIEF.md call stays **UNDECIDED**; purrgatory,
  Lookouts and Little Troubles in Spooky Town remain pinned in
  horror (census 213 / horror 6 / cozy 16), now enforced by
  `test_curator30` and WF32 alongside 25–29.
- **Agentic surface**: WF32 (6 checks — the census totals, the
  three remainders standing as counted, the still-pinned
  taxonomy, legal lane) — **267/267 pass (WF1–WF32)**. New
  `scripts/test_curator30.js`: **ALL PASS (16 checks)** — the
  headline numbers, every remainder claim's marker present in
  its description, the keyword gate, the exact year-scan
  reconciliation (47 hits = 46 year claims + 2048's title).

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (44 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (43 pages, 1439 local links)**
- `node scripts/check_api_workflows.js`: **267/267 pass (WF1–WF32)**
- `node scripts/test_curator30.js`: **ALL PASS (16 checks)** (new)
- Named suites re-run: `test_identity16` **41/41 ALL PASS** (fourth attempt; attempts 1–3 reproduced the documented load stall exactly — 28/41 green, zero assertion failures, `waitCards` timeout at loadavg ~8.1–11.7 — and attempt 4 at ~11.3 ran clean, the wave-24/27/29 pattern end to end); `test_lineups23` **ALL PASS**; `test_curator24` **ALL PASS**; `test_curator25` **ALL PASS**; `test_curator26` **ALL PASS**; `test_curator27` **ALL PASS**; `test_curator28` **ALL PASS**; `test_curator29` **ALL PASS**; `test_converter12` **66/66**; `test_player21` **ALL PASSED**
- Regression: `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL PASS; `test_curatornight21` ALL PASS (solo re-run — its loaded batch run showed 1 failure, zero on re-run); `test_wave19` ALL PASS; `test_wave17` ALL PASS; `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `test_wow1` ALL PASS (solo re-run — 1 failure in the loaded batch run, zero on re-run) + powerunit ALL PASS + playertail PASS; `tests/api.test.sh` **40/40**; `~/workspace/smoke/test.js`: exit 0, zero errors (known CDN tunnel noise only)
- `node --check`: clean on the new/edited JS; AI-slop denylist grep clean on all new prose; no TODOs or dead code in the wave's files
- Screenshots inspected: homepage hero (3-second read intact — eyebrow, H1, one CTA) and `games.html` directory hero ("213 games. Zero installs."), both over file:// with zero pageerrors

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: the census reframes the Curator's work:
five passes verified the famous shelves, and what is left is
not a shelf at all — it is 29 scattered entries, most of them
modern web games whose descriptions casually name a studio or
claim an "official" build, plus a handful of precedence claims
("defined idle games," "started a genre," four "originals")
that read as flavor and are exactly the class of claim waves
24–29 kept finding wrong on the retro shelves. Nothing in the
remainder is known false; it is known *unchecked*, which is a
different and now precisely bounded problem. A future pass can
work it in tranches — the seven superlatives first (cheapest to
settle, likeliest to be wrong in the Transport Tycoon way),
then the five years, then the maker/official list, which needs
the linked builds checked as much as the names.

## Wave 29 — 2026-10-12 — Curator pass 5: the DOS/shareware shelf

**What shipped** — the Curator's fifth pass works the tranche wave
28 named next: the DOS/shareware and early-PC shelf's year/maker
claims — Zork, SimCity, Prince of Persia, Monkey Island, Lemmings,
Theme Park, the four shareware episodes, and the similar claims on
the same shelf. Its taxonomy rider is unchanged: the
TAXONOMY_BRIEF.md call stays **UNDECIDED**, and nothing was
reshelved.

- **Curator pass 5 — the DOS shelf's claims** (`data/games.json`):
  seventeen DOS-linked entries carry a year and/or maker claim
  (the three library-door entries name titles only; Transport
  Tycoon, Master of Orion and Alone in the Dark were verified in
  waves 24/27 and stay out of scope). Each was checked 2026-10-12
  against sources outside the repo (Wikipedia, MobyGames, the
  Apogee FAQ, Mechner's own site, the linked archive.org items).
  **Sixteen stand as written** and are pinned verbatim in
  `test_curator29`: **Zork I** (Infocom, published for the TRS-80
  in December 1980), **SimCity** (Will Wright's design, Maxis,
  February 1989), **The Secret of Monkey Island** (Lucasfilm
  Games, October 1990), **Lemmings** (DMA Design, February 14,
  1991 — the DOS release is 1991 too), **Theme Park** (Bullfrog,
  1994), the four shareware episodes, each linking the episode it
  names (**Wolfenstein 3D**, ep. 1 uploaded May 5, 1992; **DOOM**,
  Knee-Deep in the Dead, December 10, 1993; **Quake**, shareware
  June 22, 1996, and the linked item is the 1.06 shareware build;
  **Duke Nukem 3D**, shareware January 29, 1996, opening on
  Hollywood Holocaust — the linked item is the v1.3 shareware),
  **The Oregon Trail** and its **Deluxe** edition (MECC's DOS
  editions of 1990 and 1992 — both entries name the DOS edition
  they date, so the years attach to the right build),
  **Civilization** (September 1991), **SimCity 2000** (the 1993
  sequel), **Railroad Tycoon** (Sid Meier's, 1990),
  **Commander Keen 3** (the Vorticons finale, December 1990) and
  **Keen Dreams** (id via Softdisk, 1991 — the 1993 in its archive
  slug is the item's catalog year for the disk image, not the
  game's release, and the description dates the game). **One
  fix**, an edition error of the exact family wave 27's Transport
  Tycoon named: **Prince of Persia** called itself "Jordan
  Mechner's 1990 rotoscoped classic" — 1990 is the DOS port the
  entry links; the game itself is Mechner's 1989 Apple II
  original. The entry now names the port it links and keeps the
  original's year in parentheses, the Transport Tycoon shape.
  With this pass, every year/maker claim the Curator's list ever
  named has been checked against an outside source: the retro
  arcade shelf (pass 3), the Ruffle shelf (pass 4), the DOS shelf
  (this pass), and the waves 24–26 sweeps. No unverified tranche
  remains on the list.
- **Taxonomy: still untouched, deliberately.** The horror/cozy
  question stays a human's call — purrgatory, Lookouts and Little
  Troubles in Spooky Town remain pinned in horror (census 213 /
  horror 6 / cozy 16), now enforced by `test_curator29` and WF31
  alongside 25/26/27/28.
- **Agentic surface**: WF31 (6 checks — the Prince of Persia fix,
  the named makers, the four shareware episodes, the similar DOS
  claims, the still-pinned taxonomy, legal lane) — **261/261 pass
  (WF1–WF31)**. New `scripts/test_curator29.js`: **ALL PASS (32
  checks)** — the tranche scope, the corrected description
  verbatim, the sixteen verified descriptions pinned exactly as
  written, the edition details (shareware dates, Keen Dreams'
  slug year, the Oregon Trail DOS editions), the census pins.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (44 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (43 pages, 1439 local links)**
- `node scripts/check_api_workflows.js`: **261/261 pass (WF1–WF31)**
- `node scripts/test_curator29.js`: **ALL PASS (32 checks)** (new)
- Named suites re-run: `test_identity16` **41/41 ALL PASS** (third attempt; attempts 1–2 reproduced the documented load stall exactly — 28/41 green, zero assertion failures, `waitCards` timeout at loadavg ~9.2–11.7 — and attempt 3 at the same ~9.4 load ran clean, the wave-24 pattern end to end); `test_lineups23` **ALL PASS**; `test_curator24` **ALL PASS**; `test_curator25` **ALL PASS**; `test_curator26` **ALL PASS**; `test_curator27` **ALL PASS**; `test_curator28` **ALL PASS (16 checks)**; `test_converter12` **66/66**; `test_player21` **ALL PASSED**
- Regression: `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL PASS; `test_curatornight21` ALL PASS; `test_wave19` ALL PASS; `test_wave17` ALL PASS; `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `test_wow1` + powerunit + playertail ALL PASS; `tests/api.test.sh` **40/40**; `~/workspace/smoke/test.js`: exit 0, zero errors
- `node --check`: clean on the new/edited JS; AI-slop denylist grep clean on all new prose; no TODOs or dead code in the wave's files
- Screenshots inspected: homepage hero (3-second read intact — eyebrow, H1, one CTA, stat band 213/113/24/24) and `games.html` directory hero ("213 games. Zero installs."), both over file:// with zero pageerrors

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: pass 5's single error was the shelf's most
famous game wearing its port's year as its own — the same slip as
Transport Tycoon, on the entry a reader is likeliest to check.
Everything else on the shelf was right, including two claims that
look wrong at a glance and aren't: Keen Dreams' 1991 against its
archive slug's 1993, and Oregon Trail's 1990, which belongs to
the DOS edition the entry names rather than the 1985 Apple II
original. That closes the Curator's named list — every tranche
waves 24–28 queued has now been worked. What remains unverified
is only what no pass ever scoped: scattered year/maker claims
outside the retro/DOS/Flash shelves, if a future pass wants to
sweep the whole catalog description by description.

## Wave 28 — 2026-10-12 — Curator pass 4: the Flash-era shelf

**What shipped** — the Curator's fourth pass works the tranche wave
27 named next: the Flash-era entries' year/creator claims — the
"Flash-back machine" collection (the Ruffle shelf), nine entries,
never checked against a source outside the repo. Its taxonomy rider
is unchanged: the TAXONOMY_BRIEF.md call stays **UNDECIDED**, and
nothing was reshelved.

- **Curator pass 4 — the Flash shelf's claims** (`data/games.json`):
  five of the shelf's nine entries carry a year and/or creator
  claim; each was checked 2026-10-12 against the games' own records
  and reputable archives (Wikipedia, MobyGames, the Newgrounds
  wikis, the linked archive.org items). **Three stand as written**
  and are pinned verbatim in `test_curator28`: **Fancy Pants
  Adventure: World 1** (Brad Borne's series; World 1 released March
  14, 2006), **Achievement Unlocked** (John Cooney, December 17,
  2008, and the count is exactly 100 — completing all 100 is the
  game's whole goal), **Time Fcuk** (Edmund McMillen, released on
  Newgrounds September 16, 2009). **Two fixes**, both attribution
  errors of the family wave 27's Transport Tycoon named — an entry
  must credit what it actually links to: **Alien Hominid (Flash)**
  called itself "The Behemoth's 2002 run-and-gun" — the Behemoth
  did not make the Flash game and did not exist when it shipped;
  the prototype was programmed by Tom Fulp with art by Dan Paladin,
  released on Newgrounds in August 2002, and the company was formed
  afterwards, prompted by the prototype's success, to build the
  console version. The archive.org item the entry links is itself
  credited to Fulp and Paladin, and the entry now names them.
  **Dad 'n Me** had the right year (July 27, 2005) but a singular
  possessive — the game's own credits split the work, programming
  by Fulp and art by Paladin, the same duo; the entry now names
  both. The shelf's other four entries (Canabalt, Line Rider, Happy
  Wheels, QWOP) carry no year or creator claim in their copy, so
  the tranche is fully worked: nothing unverified remains on the
  Ruffle shelf.
- **Taxonomy: still untouched, deliberately.** The horror/cozy
  question from rotation 6 stays a human's call — purrgatory,
  Lookouts and Little Troubles in Spooky Town remain pinned in
  horror (census 213 / horror 6 / cozy 16), now enforced by
  `test_curator28` and WF30 alongside 25/26/27.
- **Agentic surface**: WF30 (6 checks — both fixes, the verified
  tranche, the claim-free remainder of the shelf, the still-pinned
  taxonomy, legal lane) — **255/255 pass (WF1–WF30)**. New
  `scripts/test_curator28.js`: **ALL PASS (16 checks)** — the
  tranche scope, both corrected descriptions verbatim, the three
  verified descriptions pinned exactly as written, the census pins.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (44 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (43 pages, 1439 local links)**
- `node scripts/check_api_workflows.js`: **255/255 pass (WF1–WF30)**
- `node scripts/test_curator28.js`: **ALL PASS (16 checks)** (new)
- Named suites re-run: `test_identity16` **41/41 ALL PASS** (first attempt; loadavg ~6.0 at launch — no stall this run); `test_lineups23` **ALL PASS**; `test_curator24` **ALL PASS**; `test_curator25` **ALL PASS**; `test_curator26` **ALL PASS**; `test_curator27` **ALL PASS (30 checks)**; `test_converter12` **66/66**; `test_player21` **ALL PASSED**
- Regression: `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL PASS; `test_curatornight21` ALL PASS; `test_wave19` ALL PASS; `test_wave17` ALL PASS; `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `test_wow1` + powerunit + playertail ALL PASS; `tests/api.test.sh` **40/40**; `~/workspace/smoke/test.js`: exit 0, zero errors
- `node --check`: clean on the new/edited JS; AI-slop denylist grep clean on all new prose; no TODOs or dead code in the wave's files
- Screenshots inspected: homepage hero (3-second read intact — eyebrow, H1, one CTA, stat band 213/113/24/24) and `games.html` directory hero ("213 games. Zero installs."), both over file:// with zero pageerrors

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: pass 4's two errors were both credits, not
dates — every year on the shelf was right. The Behemoth slip is the
instructive one: the company is so identified with the game that
the anachronism reads as common sense, and only the linked item's
own credit line gives it away. What remains on the Curator's list:
the DOS/shareware and early-PC shelf's year/maker claims (Zork's
1980, Will Wright's 1989 SimCity, Mechner's Prince of Persia, the
shareware episodes) are the next unverified tranche.

## Wave 27 — 2026-10-12 — "The brief": the taxonomy call, written for a human + Curator pass 3

**What shipped** — two tracks: the cozy/horror recommendation from
wave 25 becomes a decision brief a human can rule on in one read, and
the Curator's third pass works the next unverified tranche of catalog
metadata — the retro shelf's year/maker/superlative claims.

- **The HUMAN DECISION BRIEF** (`TAXONOMY_BRIEF.md`, repo root, the
  docs convention): one page, evidence first, recommendation last,
  **nothing decided**. Contents: the exact census effect (horror
  6 → 4, cozy 16 → 18, 213 unchanged); each game's own store-page
  framing, re-fetched 2026-10-12 — **purrgatory**'s itch page calls it
  a visual novel about "passing time in an afterlife," a "whimsical
  point-and-click world" of befriending seven characters, with no
  horror tag, framing, or warnings anywhere; **Lookouts**' page leads
  with "a romance visual novel" about two outlaws "finding refuge in
  each other," and its content warnings (alcohol, smoking, gun
  violence and death, blood, injury) are western-drama material; the
  comparable shelving (**Six Cats Under** and **goodbye, doggy** —
  ghost protagonists, afterlife settings — and gothic **Fallen
  London** all sit in cozy; horror's centre is bodily dread: *We
  Become What We Behold*, *Adventures With Anxiety*, *Dating
  Killmulator 2*); the honest case for leaving them (a thin horror
  shelf at four; a browsing aid for spooky-season hunters); and the
  recommendation — **move both to cozy**, by the wave-24 rule that
  genre follows the game's own description, not its furniture.
- **The related case, with fresh evidence**: *Little Troubles in
  Spooky Town*'s own itch page (re-fetched 2026-10-12) tags the game
  **Cozy, Cute, Ghosts, whimsical, Wholesome**, lists its genre as
  Adventure, and credits the Girly Game Jam; its stated goal is to
  "prove to everyone that you can be whatever you want to be." The
  brief puts it in front of the same ruling, so one human sentence
  can settle all three. **Taxonomy itself: untouched, again** — all
  three games stay pinned in horror (census 213 / horror 6 / cozy 16),
  now enforced by `test_curator27` and WF29 alongside 25/26.
- **Curator pass 3 — the retro shelf's claims** (`data/games.json`):
  sixteen descriptions whose years, makers, and superlatives waves
  24–26 never checked against a source outside the repo (only
  Robotron's 1982 had been). **Fourteen stand as written** and are
  pinned verbatim in `test_curator27`: Space Invaders (Taito 1978;
  first game to save a high score between sessions — the "birth of
  the high score" holds), Tempest (Atari 1981, Dave Theurer, first
  selectable starting level — Atari's SkillStep), Missile Command
  (Atari 1980, six cities, three bases), Dig Dug (Namco 1982, Pookas
  and Fygars), Joust (Williams 1982), Centipede (Atari 1981, the
  mushroom field), Defender (Williams 1981; "perhaps the most
  difficult classic game of all time" is the critical consensus the
  entry echoes), Q*bert (Gottlieb 1982, Coily), Congo Bongo (Sega
  1983, the isometric Donkey Kong answer), Galaga '88 (Namco 1987,
  triple fighter — Bandai Namco's own release notes), Bubble Bobble
  II (Taito 1994 — the linked MAME set is Bubble Symphony), the
  Class of 1981 cabinet (2000; "class of 1981" is the machine's own
  name), Master of Orion (1993; Alan Emrich coined "4X" in his
  *Computer Gaming World* preview of this game), Street Fighter
  Alpha 2 (Capcom 1996, air-blocking and custom combos). **Two
  fixes**: **1942** called itself "the granddaddy of the shmup" —
  the lineage runs through Space Invaders (1978) and Xevious (1982);
  what 1942 verifiably is is the first of Capcom's 19XX series, and
  the entry now says that. **Transport Tycoon** said "1995" with no
  edition named — the original game is November 1994; 1995 is the
  Deluxe edition, which is the build the entry links (its own title
  in the catalog is even *Transport Tycoon Deluxe*). The entry now
  names the edition it links, original year in parentheses.
- **Agentic surface**: WF29 (7 checks — the brief's completeness, the
  Spooky Town rider, the still-pinned taxonomy, both fixes, the
  verified tranche, legal lane) — **249/249 pass (WF1–WF29)**. New
  `scripts/test_curator27.js`: **ALL PASS (30 checks)** — the brief's
  required contents, the census pins, both corrected descriptions
  verbatim, and the fourteen verified descriptions pinned exactly as
  written so no future pass can quietly "improve" a true claim.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (44 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (43 pages, 1439 local links)**
- `node scripts/check_api_workflows.js`: **249/249 pass (WF1–WF29)**
- `node scripts/test_curator27.js`: **ALL PASS (30 checks)** (new)
- Named suites re-run: `test_identity16` **41/41 ALL PASS** (fourth attempt; attempts 1–3 reproduced the documented load stall exactly — 28/41 green, zero assertion failures, `waitCards` timeout at loadavg ~7.7–9.5 — and attempt 4 at loadavg ~6.5 ran clean, the wave 21–26 pattern end to end); `test_lineups23` **ALL PASS**; `test_curator24` **ALL PASS**; `test_curator25` **ALL PASS**; `test_curator26` **ALL PASS**; `test_converter12` **66/66**; `test_player21` **ALL PASSED**
- Regression: `test_gamenight_parity` PARITY OK; `test_gamenight22` ALL PASS; `test_curatornight21` ALL PASS; `tests/api.test.sh` **40/40**; `~/workspace/smoke/test.js`: exit 0, zero errors (known CDN tunnel noise only)
- `node --check`: clean on the new/edited JS; AI-slop denylist grep clean on the brief and all new prose
- Screenshots inspected: homepage hero (3-second read intact — eyebrow, H1, one CTA) and `games.html` directory hero ("213 games. Zero installs."), both over file:// with zero pageerrors (loopback navigation is LNA-blocked in this sandbox, the wave-22 finding)

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: the brief is the wave's real product — wave 25
left a recommendation sitting in a log; this wave makes it a ruling
a person can make in one read, with the strongest new evidence
(Spooky Town's own Cozy tag) found by going back to the store pages
rather than re-arguing old notes. Pass 3's lesson rhymes with wave
24's Robotron: the two errors were both *almost* true — a year that
belongs to the sequel edition, a superlative that belongs to the
genre's neighbours — which is exactly the class of error that
survives casual reading. What remains on the Curator's list: the
Flash-era entries' year/creator claims (the Ruffle shelf) are the
next unverified tranche.

## Wave 26 — 2026-10-12 — "Accuracy sweep": the blanket-claim audit

**What shipped** — wave 25's DuckStation correction (CC BY-NC-ND 4.0,
source-available since Sept 2024) quietly falsified every blanket
"emulators are open-source" line on the site. Wave 25 flagged the
emulation hub's hero; this wave fixes it, then audits the whole site
for the same class of claim.

- **The flagged hero fix** (`emulation.html`): "Emulators are software
  — legal, open-source, and fascinating" is now "Emulators are
  software — **legal, fascinating, and mostly open-source**." Mostly is
  arithmetic, not a hedge: nine of the ten catalog emulators carry
  GPL/MPL/MIT licenses; DuckStation alone is source-available.
- **The same blanket, second home** (`guides/how-emulation-works.html`):
  its legal note said "legal and open-source" — the identical claim,
  the identical fix ("legal, and mostly open-source"). A site-wide
  scan of all 41 HTML pages confirms no blanket phrasing survives.
- **The blanket-claim audit — checked, and what happened to each:**
  *Fixed (false):* the two emulator blankets above.
  *Fixed (unverifiable):* **Mindustry**'s description claimed "the web
  build is the full game" — no source outside the repo settles what
  the web build contains, so the superlative no longer ships; the
  sentence now says only what can be checked ("The web build runs
  right in your browser"). Its verified claim stays: Mindustry is
  GPL-3.0 (upstream repo / Flathub metadata).
  *Left (true, specific):* `play-legal.html`'s "EmulatorJS, RetroArch,
  mGBA — all legal, all open-source" names three emulators, and all
  three are open source (GPL-3.0 / GPL-3.0 / MPL-2.0 in
  `data/v1/emulators.json`). The Player's "powered by the open-source
  EmulatorJS engine," SameBoy (MIT) and RetroArch (GPL-3.0) in their
  guides, and the best-emulator guide's note (which claims legality
  and zero bundled games, not licenses) all stand as written.
  *Left (true, games):* every description that calls a game open
  source was re-checked — Clumsy Bird, Astray, HexGL, Swarm Sim
  (public repo `swarmsim/swarm`), Bitburner (public source repo),
  DCSS, ClassiCube, Synergism, arras.io (public source archives), and
  the HydroEngineer trio Floodlines / Hydro Operator / SkyStack (the
  dev's own itch announcement: all three "Free, and Open Source").
  The `open-source-web` shelf's six (Bitburner, Mindustry, shapez —
  GPL-3.0 per the community-edition repo — DCSS, Angband, NetHack)
  all hold. Spot-checked free claims hold too: Lichess ("completely
  free," no account needed), PlayOK (no signup), the official Tetris
  (free), Minecraft Classic (free in the browser), GeoGuessr ("free
  tier included" — a tier claim, not a blanket), Fallen London (free),
  the shareware episodes (Duke/Quake — free and legal as shareware).
  Tuxemon on the monster-taming page: open-source, free,
  community-built — stands. The PICO-8 guide's "play free in the
  browser" is scoped to BBS carts, which are free to play; stands.
  The homepage eyebrow ("free games · no installs · no accounts")
  and `games.html`'s "every game here is free-to-play on its official
  site" describe the site's own terms and the catalog's curation
  standard (each entry playable free at its verified link; paid
  tiers/demos are disclosed in the entries themselves) — left as
  written, deliberately: they are claims about this shelf, checked
  against this catalog, not about the software's licenses.
- **Taxonomy: still untouched.** The cozy/horror call remains a
  human's; purrgatory and Lookouts stay pinned in horror (census
  unchanged: 213 games, horror 6, cozy 16), enforced by
  `test_curator25`/`test_curator26` and WF27.
- **Agentic surface**: WF28 (6 checks — both blanket fixes, the
  specific claims left standing, the 9-of-10 license arithmetic, the
  Mindustry softening, legal lane) — **242/242 pass (WF1–WF28)**.
  New `scripts/test_curator26.js`: **ALL PASS (14 checks)** — the
  fixes, a site-wide no-blanket scan, the left-true pins, the census.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (44 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (43 pages, 1439 local links)**
- `node scripts/check_api_workflows.js`: **242/242 pass (WF1–WF28)**
- `node scripts/test_curator26.js`: **ALL PASS (14 checks)** (new)
- Named suites re-run: `test_identity16` **41/41 ALL PASS** (second attempt; the first reproduced the documented load stall at loadavg ~8.3, zero assertion failures, exactly as waves 21–23 recorded); `test_lineups23` **ALL PASS**; `test_curator24` **ALL PASS**; `test_curator25` **ALL PASS (19 checks)**; `test_converter12` **66/66**; `test_player21` **ALL PASSED**
- `tests/api.test.sh`: **40/40**; `~/workspace/smoke/test.js`: exit 0, zero errors (known CDN tunnel noise only)
- `node --check`: clean on the new/edited JS; AI-slop denylist grep clean on the corrected prose
- Screenshots inspected: `emulation.html` hero (corrected lede renders in the hero panel, H1 + CTAs intact, zero pageerrors) and the `how-emulation-works` legal note on mobile width (corrected wording renders, zero pageerrors)

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links.

**Self-assessment**: the interesting find was not the flagged hero —
it was that the same sentence had a second home in a guide's legal
note, where nobody had flagged it. Blanket claims replicate by
copy-paste; an audit that only fixes the flagged instance leaves the
strain alive. The Mindustry line is the wave's other lesson: a claim
can be probably-true and still not meet the bar — if no outside
source settles it, it does not ship as fact.

## Wave 25 — 2026-10-12 — "Close the flagged follow-ups": the cheat-code guide, the DuckStation verdict, a taxonomy call left for a human

**What shipped** — rotation 3's self-assessment left three honest items
on the record. This wave closes two and rules on the third without
acting on it.

- **The cheat-code guide — wave 20's last flagged gap, closed**:
  `guides/cheat-codes.html` + a `cheat-codes` record in
  `data/guides.json` (8 sections, Beginner, ~12 min), a hub card in the
  emulation deep-dives (now 9 cards), a `build_site.py` page entry, a
  sitemap entry, and the homepage stat corrected 23 → **24 guides**.
  Every claim verified against a source outside the repo before it
  shipped, the Curator standard: a cheat code is an address plus a
  value (RAM codes vs ROM patches); the Konami Code was Kazuhisa
  Hashimoto's testing aid for the 1986 NES port of *Gradius* (full
  power-up set; it shipped still in the game) and *Contra* (1988) made
  it legend with 30 lives; the Game Genie was developed by Codemasters
  and sold by Galoob in the US / Camerica in Canada from 1990 — a
  pass-through cartridge whose six-letter codes patch unconditionally
  and whose eight-letter codes add a compare byte for bank-switched
  carts; the lawsuit ended with the Ninth Circuit affirming in 1992
  (*Lewis Galoob Toys, Inc. v. Nintendo of America, Inc.*) that home
  cheat use creates no derivative work and is fair use; GameShark was
  Datel's Action Replay hardware under InterAct's US brand from 1996;
  RetroArch's built-in cheat search (since 1.7.4) finds codes by
  elimination. The Player section describes the Cheats tool exactly as
  shipped (per-game browser storage, `EJS_cheats` injected before boot,
  in-game-menu toggles, per-core honesty). Legal lane held: codes are
  numbers, never downloads; multiplayer and hardcore-achievement play
  are named as out of bounds.
- **The DuckStation license re-check — verdict: the record was stale,
  now corrected.** Wave 24 investigated a possible license change and
  its verification search failed (a tool error, not a finding), so
  `data/emulators.json` kept saying GPL-3.0. This wave's clean sources
  settle it: the upstream repo's own license-change commit
  (`stenzek/duckstation@9ca6b54`, September 2024) removes the GPLv3
  header in favor of the PolyForm Strict License 1.0.0, and the
  project then moved to **CC BY-NC-ND 4.0** — corroborated by the
  archived last-GPL fork's README (`niq1/duckstation-gpl`) and current
  setup coverage. DuckStation is source-available now, not open
  source. The catalog record is corrected (`license: "CC BY-NC-ND
  4.0"`) with the history kept in its notes ("Relicensed Sept 2024:
  GPL-3.0 until then…"). The other nine emulator licenses were
  re-checked against the same pass and stand.
- **Cozy/horror taxonomy — evidence gathered, recommendation
  recorded, nothing moved.** The two flagged games sit in horror on
  setting, not on scares. Evidence: (1) **purrgatory**'s own itch page
  presents it as a whimsical point-and-click visual novel about
  befriending seven characters in an afterlife — no horror framing
  anywhere on its store page; this catalog's own description agrees
  ("Melancholy and sweet"). (2) **Lookouts**' own itch page presents
  it as "a romance visual novel" about two outlaws "finding refuge in
  each other, and a little hope for a better life"; its content
  warnings (alcohol, smoking, gun violence, blood, injury) are
  western-drama material, and this catalog's description already
  hedges "(Spooky-tinged.)". (3) Comparable shelving in this same
  catalog: **Six Cats Under** (a ghost rescuing cats in a
  point-and-click afterlife) and **goodbye, doggy** (a ghostly dog,
  "short, tender") sit in **cozy**, as does **Fallen London** (a
  gothic narrative RPG); the horror shelf's center is dread —
  *We Become What We Behold*, *Adventures With Anxiety*, *Dating
  Killmulator 2* — and even its own *Little Troubles in Spooky Town*
  entry hedges "spooky-cozy, not spooky-scary." Wave 24's own
  reshelve principle was that genre follows the game's own
  description, not its furniture.
  **Taxonomy recommendation**: when a human rules on it, move both
  **purrgatory** and **Lookouts** to **cozy** (horror 6 → 4, cozy
  16 → 18, census checks updated in the same wave), and let the same
  ruling settle *Little Troubles in Spooky Town*. Until that call,
  both games stay exactly where they were — this wave moves nothing,
  and `test_curator25.js` pins them in horror so a silent reshelve
  can never sneak through as a side effect.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 24 guides**; **LEGAL GATE OK (44 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (43 pages, 1439 local links)**
- `node scripts/check_api_workflows.js`: **236/236 pass (WF1–WF27)** — new WF27 (5 checks: the cheat guide wired end to end, its verified facts on the page, the DuckStation correction, the taxonomy no-reshelve pin, legal lane); WF13's count moved 23 → 24
- `node scripts/test_curator25.js`: **ALL PASS (19 checks)** — guide facts as shipped, the surgical license correction (other nine untouched), taxonomy pinned in horror with census unchanged
- Named suites re-run: `test_identity16` **41/41 ALL PASS** (first attempt; loadavg ~7.5, cleared in ~85s — no stall this time); `test_lineups23` **ALL PASS**; `test_curator24` **ALL PASS** (its guide-count check moved 23 → 24); `test_converter12` **66/66**; `test_player21` **ALL PASSED**
- Regression: `test_gamenight22` ALL PASS; `test_curatornight21` ALL PASS; `test_gamenight_parity` PARITY OK; `tests/api.test.sh` **40/40**; `test_wave19` ALL PASS; `test_wave17` ALL PASS after one test-rot repair (its hub-card pin moved 8 → 9 for the new card, labeled in the check); `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_wow1` + powerunit + playertail ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36
- `~/workspace/smoke/test.js`: exit 0, zero errors (known CDN tunnel noise only)
- `node --check`: clean on every new/edited JS file; AI-slop denylist grep clean on all new prose
- Screenshots inspected: `guides/cheat-codes.html` (template, chips, legal lane, TOC all render; zero pageerrors), homepage hero (3-second read intact; stat band now 24 guides), `emulation.html` hero

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links;
the cheat guide's only external-facing claims are historical and
sourced, and its legal note states the lane on the page.

**Self-assessment**: all three rotation-3 flags are now off the
record — two closed with shipped work, one converted from a vague
unease into a written evidence file a human can rule on in one read.
The DuckStation correction is the wave's quiet lesson: "could not
verify" must never fossilize into "verified false" — the catalog said
GPL-3.0 for a wave longer than the truth did.

## Wave 24 — 2026-10-12 — "The Curator, second pass": verified metadata, calibration follow-ups, the NES guide

**What shipped** — three tracks: a fact pass over the catalog with sources
checked outside the repo, the calibration follow-ups wave 22's buckets
still owed, and the completeness gap wave 20 flagged and nobody had
closed.

- **The Curator — metadata fixes, each verified before it was touched**
  (`data/games.json`): **Robotron: 2084** was dated 1984 and credited with
  inventing the twin-stick shooter — it is a **1982** Williams game and it
  *popularized* the twin-stick (Wikipedia/arcade-museum; it was not the
  first twin-stick cabinet either). **Alone in the Dark** sent you in as
  "Carnby or Aline" — Aline Cedrac is the 2001 sequel's lead; the 1992
  original's pair is Carnby or **Emily Hartwood**. **NetHack** "named the
  genre" — the genre is named after **Rogue (1980)**; NetHack (1987)
  helped define it. **DOOM** "invented the FPS" — Wolfenstein 3D sits two
  shelves away in this same catalog dated 1992; DOOM *made the FPS a
  phenomenon*. **Angband** was "the granddaddy of roguelikes" — Rogue and
  Moria predate it; now "one of the great traditional roguelikes."
  **Little Alchemy 2** linked `littlealchemy.com`, which is the *first*
  game (its own page banners the sequel and points away) — the entry now
  links `littlealchemy2.com`, the sequel's own site. One claim was
  investigated and **not** shipped: a rumored DuckStation license change
  could not be re-verified this wave (a search failure, not a finding), so
  the record stands as-is pending a clean source.
- **Genre reshelve** (the games' own descriptions were the source):
  **Celeste Classic** (precision platformer) and **Poom** (FPS demake) sat
  in roguelike; both are now `action`. **Kaaarot** — "2-4 player party
  brawler" in its own description — sat in roguelike; now `multiplayer`.
  Census: puzzle 48 / action 41 / roguelike 12 / idle 15 / multiplayer 31
  / retro 44 / horror 6 / cozy 16 (WF14 updated to match).
- **Calibration follow-ups** (`assets/js/curator-night.js`, scoring
  **v2.1.0 → v2.2.0**; the v1 engine and its 256/256 parity gate are
  untouched, as designed): the wave-22 audit had calibrated the famous
  misreads; a second pass over every unpinned game found the quieter
  ones. **Session pins (69 → 76)**: Type Help — a long-form Her
  Story/Obra Dinn-style mystery — cost 10 minutes by the puzzle bucket;
  now 45. Trevosa (deduction archive) 30, The Evolution of Trust (a
  half-hour interactive essay) 30, CodeCombat (a coding campaign) 30,
  Simon Tatham's Puzzles (a 40+ puzzle shelf; a sitting is browsing) 20,
  and the two reshelved PICO-8 games at 20 (a Celeste Classic clear, a
  Poom run). **Seat pins (11 → 22)**: a `shooter` tag was seating the
  golden-age cabinets at 8 — an online-lobby tier — so a 12-player night
  scored Space Invaders like a room game (player fit 40). The eight
  tagged cabinets (1942, Centipede, Defender, Galaga '88, Missile
  Command, Robotron, Space Invaders, Tempest) now seat **2** — one
  machine, alternating players, which is what the hardware ever seated —
  plus Street Fighter Alpha 2 (versus) 2, Bubble Bobble II (a 2-player
  co-op cart the coop tier read as 4) 2, and **Jstris 8**: a real
  multiplayer lobby that its puzzle shelf had seating 1.
- **The NES guide — wave 20's flagged gap, closed**: the Player has
  always run NES (`.nes` is the first extension in its core map) and the
  per-system shelf had six guides with the flagship system missing.
  Now: `guides/nes.html` (FCEUmm core, the mapper story, the sprite-
  flicker switch as a preference not a fix, Game Genie via Player 2.0,
  zapper honesty, and the one real BIOS exception — Famicom Disk System
  disks need an FDS BIOS dumped from your own hardware; cartridges need
  none), a `system-guide-nes` record in `data/guides.json` (7 sections),
  an NES homebrew pack (Zophar's Domain public-domain shelf + two itch
  NES-homebrew tags, all three verified live today; `zophar.net` added
  to the build's reference-domain allowlist), a hub card on
  `emulation.html`, and the homepage stat corrected 22 → **23 guides**.
  WF5 now expects 7 packs / 7 system guides; WF13's total moved 22 → 23.
  Still flagged, honestly: the cheat-code guide (wave 20's other gap)
  remains unwritten.
- **Agentic surface**: WF26 (7 checks — the five fact fixes, the LA2
  link, the reshelve, both pin sets load-bearing, cabinets-vs-lobbies,
  the NES wiring, legal lane) — **231/231 pass (WF1–WF26)**. New
  `scripts/test_curator24.js`: **ALL PASS (19 checks)** — the facts as
  shipped, the census, the pins, player-fit consequences, the NES
  wiring, and a 120-night sweep on the recalibrated engine.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 23 guides**; **LEGAL GATE OK (43 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (42 pages, 1406 local links)**
- `node scripts/check_api_workflows.js`: **231/231 pass (WF1–WF26)**
- `node scripts/test_curator24.js`: **ALL PASS (19 checks)**; `node scripts/test_gamenight22.js`: **ALL PASS** (1,680-night sweep on the recalibrated engine); `node scripts/test_curatornight21.js`: **43/43**; `node scripts/test_lineups23.js`: **ALL PASS (41 checks)**; `node scripts/test_gamenight_parity.js`: **256/256 PARITY OK**
- `tests/api.test.sh`: **40/40 green**
- Regression: `test_player21` ALL PASSED (the Player end to end, 20 systems in SYSTEM_LABELS); `test_converter12` **66/66** (the Converter end to end); `test_wave19` ALL PASS; `test_wave17` ALL PASS; `test_trophy18` ALL PASSED; `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS; `test_wow1` + powerunit + playertail ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36
- `test_identity16`: **41/41 ALL PASS** — on the third attempt. Attempts 1–2 reproduced the documented load stall exactly (28/41 green, zero assertion failures, `waitCards` timeout at loadavg ~6.4–9.8); attempt 3 at the same load cleared in ~57s. Same tree throughout: renderer CPU, not code, exactly as waves 21–23 documented.
- `~/workspace/smoke/test.js`: exit 0, zero errors (known CDN tunnel noise only)
- `node --check`: clean on every new/edited JS file; AI-slop denylist grep clean on all new prose
- Screenshots inspected: homepage hero (3-second read intact; stat band now 23 guides), `guides/nes.html` (template, chips, legal lane, TOC all render), `emulation.html` hero, `game-night.html` hero

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; the
NES guide's only BIOS discussion is the dump-your-own FDS note, and its
starter pack links two itch tag pages and a public-domain shelf, all
verified live 2026-10-12.

**Self-assessment**: a catalog is a promise that somebody checked. This
wave's fixes were all small and all the kind a regular notices — a wrong
year on a famous cabinet, the wrong heroine in a famous mansion, a sequel
linking to its own prequel. The seat pins matter more than they look: one
tag tier was quietly telling twelve-player nights that Space Invaders
seats the room. What remains on the Curator's list: the cheat-code guide,
a DuckStation license re-check with a clean source, and a third pair of
eyes on the cozy/horror shelf border (purrgatory and Lookouts sit in
horror on spooky themes, not scares — a taxonomy call for a human, not a
bucket).

## Wave 23 — 2026-10-12 — "Game Night 2.1": saved lineups & the rematch

**What shipped** — wave 22 calibrated the buckets and left every dealt night
ephemeral: close the tab, lose the night. Game Night now has a shelf.

- **Saved lineups** (`assets/js/curator-night-lineups.js`, new UMD module,
  DOM-free, same discipline as the Trophy Room core): a dealt night can be
  shelved under a name you pick (blank name → a suggested one from the
  setup, e.g. "Fri 16 Oct — 4 players · party + chaotic"). Storage is
  browser-local only — localStorage key `bm.lineups.v1`, cap 12 nights,
  in-memory fallback with a plain on-page notice when storage is blocked.
  Nothing is sent anywhere; there is no account and no server copy. The
  page's old "nothing is stored" copy was corrected everywhere it appeared
  (page lede + meta, AGENT.md, llms.txt/llms-full.txt via build_site.py).
- **Snapshots, not re-scores**: a saved record carries the lineup exactly
  as dealt — picks, order, curator estimates, score breakdowns, the setup
  that produced it, scoring version. Later calibration waves never reach
  into the shelf. Records validate field by field on load: one corrupt or
  tampered entry is dropped, the rest of the shelf survives; unparseable
  storage reads as an empty shelf, never a crash.
- **The rematch**: load a shelved night and deal its rematch — the same
  setup re-dealt with every saved pick held out of the deck, so each slot
  comes back fresh on the same role curve (warm-up → mains → intermission
  → peak → cool-down). The main-event count follows the timebox exactly as
  on a fresh deal — at identical totals (~120 of 120 min) the probe night
  and its rematch filled the night in 8 and 7 slots respectively — and the
  rematch never overruns to force a count. Kids rematches stay inside the
  kid-safe corpus. A rematch can itself be shelved ("… — the rematch").
- **Copy-as-text card** for every saved night: name, saved date, setup
  line, every slot in order with role, estimates and URL, and the
  estimates disclaimer — paste-ready for the group chat, same format
  family as the dealt night's copy.
- **The shelf UI** (progressive disclosure, cabinet styling): the "Your
  saved nights" section stays hidden until the first night is shelved.
  Each card shows name, date, setup, total estimate and the pick order,
  with Load / Rematch / Copy card / Retire. Loading renders the snapshot
  on the ceremony stage under a SAVED NIGHT banner with its own actions
  (copy card, deal the rematch, retire, print); print still hides the
  shelf — paper gets the night, not the cabinet. A screenshot review
  caught one real bug mid-wave: the `.btn` display rule overrode the
  `hidden` attribute, so "Save this night" stayed visible after shelving;
  fixed with an explicit `[hidden]` rule in the actions row.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (42 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (41 pages, 1378 local links)**
- `node scripts/check_api_workflows.js`: **224/224 pass (WF1–WF25)** — new WF25 (7 checks: shelf module surface + storage key, page wiring + honest copy, UI actions wired, save/snapshot round-trip over the real catalog, rematch freshness + curve + card disclaimer, shelf CSS + print rule, legal lane)
- `node scripts/test_lineups23.js`: **ALL PASS (41 checks)** — shelf unit checks (save/snapshot/reload persistence, cap refusal, per-record corruption survival, unparseable storage, rematch freshness/curve/kids, card contents) + headless flow (deal → name → shelve → reload → load → rematch → retire, zero pageerrors) + mobile 390px shelf (zero overflow)
- `node scripts/test_gamenight22.js`: **ALL PASS (20 checks)** — 1,680-night grid sweep still clean; engine untouched this wave
- `node scripts/test_curatornight21.js`: **43/43 ALL PASS, zero pageerrors**
- `node scripts/test_wave19.js`: **37/37 ALL PASS, zero pageerrors**
- `node scripts/test_gamenight_parity.js`: **256/256 PARITY OK** (v1 engine untouched, as designed)
- `tests/api.test.sh`: **40/40 green**
- Regression: `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS (26/26); `test_trophy18` ALL PASSED; `test_player21` ALL PASSED; `test_wave17` ALL PASS; `test_wow1` desktop/motion/mobile/player ALL PASS + powerunit ALL PASS + playertail ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `test_converter12` 66/66
- `~/workspace/smoke/test.js`: exit 0, zero errors (known CDN tunnel noise only)
- `node --check`: clean on every new/edited JS file
- Screenshots inspected: desktop shelf after shelving "Friday With The Cousins" (card meta + pick order + honest browser-only note legible; post-save actions correctly reduced to copy/print), desktop rematch hero with the new lede, mobile 390px hero (zero overflow)

**test_identity16 — PASSES CLEAN (41/41) in a quieter window; the stall is
real, load-bound, and still there at loadavg ~10.** Two attempts, no code
changed between them, no assertion touched. Attempt 1 at loadavg ~9.6
(2 CPUs shared with parallel agents' renders) reproduced the documented
stall exactly: 28/41 checks green, zero assertion failures, then a
harness `TimeoutError` in `waitCards` at check 16.29 — the 213-card
re-render after clearing filters starved past its 15s poll window.
Attempt 2, after idling down to loadavg 5.59 (the quietest window the
box offered), ran **41/41 ALL PASS, exit 0, zero pageerrors** in ~60s.
Same tree, same suite: the variable is renderer CPU, exactly as wave 21
documented on the pristine tree. A genuinely quiet VM (loadavg near
idle) remains the standing recommendation for a load-independent read.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; the
shelf stores only catalog ids, titles and the Curator's own estimates,
all already public page data.

**Self-assessment**: the night no longer dies with the tab. The design
choices that matter: snapshots over re-scores (a saved night is a memory,
not a query), a cap that refuses out loud instead of silently dropping
the oldest night, and a rematch that holds the saved picks out of the
deck rather than shuffling until it looks different — fresh is guaranteed,
not probable. The one honest wrinkle is the fill count: a rematch can
deal one main more or fewer than the night it answers, because the
timebox — not the slot count — is the house rule. The curve, the setup
and the minutes are the night; the count is arithmetic.

## Wave 22 — 2026-10-12 — "Game Night 2.0": the buckets, calibrated + test_wave19 to green

**What shipped** — the wave-21 self-assessment asked for "a second pair of eyes
on session-estimate buckets against real playtimes." The audit found the v2.0
buckets dealing nonsense at the edges: Civilization and Space Invaders shared
a 10-minute retro bucket; Wordle cost 10 minutes; Lichess (a chess duel) and
skribbl.io (a 12-person drawing room) scored identical player fit; a solo game
pass-and-played by twelve scored exactly what it scored for two; and on a
four-hour night a five-minute clicker tied a perfect-fit main event on session
points. Scoring is now **v2.1.0** — same 100-point frame, graded fits:

- **Session buckets, calibrated per game** (`SESSION_OVERRIDES`, 69 pins in
  `assets/js/curator-night.js`): long-form retro sims/adventures (Civilization
  60, Master of Orion 60, Monkey Island 45, Oregon Trail 30), deep traditional
  roguelikes (NetHack 60, DCSS/Angband 45, a Vampire Survivors run at its real
  30-minute timer), narrative idles (A Dark Room / Universal Paperclips /
  Kittens Game 30 — pure clickers like Cookie Clicker stay 5), builders
  (shapez 45), library pages (a sitting is browsing a shelf: 15–20), and the
  five-minute dailies (Wordle, Connections, Globle, Worldle, Framed, Waffle,
  Bandle → 5; We Become What We Behold → 5, its own description says so).
- **Seats** (`estimateCapacity` + 11 pins): room games (phone/drawing/trivia
  tags) seat 12, team word/party 10, online lobbies 8, board tables 6, co-op
  4, solo 1 — with pins where tags misread the game (Lichess 2, Pokémon
  Showdown 2, Colonist 4, Board Game Arena 6, ClassiCube 8). **Player fit is
  graded**: room games hold 40 at any size; pass-and-play decays 26 → 18 →
  10 → 6 as the room grows; over-seated tables taper 6/seat to a floor of 14.
  Assembly passes now prefer picks that seat the room before settling.
- **Energy** (`estimateEnergy`: low-key / steady / high-octane): shooters,
  arenas, racers and the action/horror genres run hot; word/board/trivia and
  idle/cozy run low. The curve spends it on purpose — warm-up and cool-down
  slots must be low-floor AND not high-octane; the showdown must be
  high-octane or spicy. Slot cards and copy-as-text now show seats + energy.
- **Session fit is graded against the night's actual slot size**
  (minutes ÷ target slots): right-size pays 20, short-for-slot 13 ("expect
  instant rematches"), a blink next to a long slot 8, eats-the-night 6, and a
  sitting longer than the whole night 2.
- **Assembly fixes the calibration exposed**: the intermission breather is
  capped at ~15 min (a 30-minute narrative idle is a course, not a breather);
  the long-night fill loop now deals any main that fits the remaining time
  (a trimmed kids night refills to a full 5 slots / exactly 60 min instead of
  stranding at 3), gated so short nights keep their designed 2–3 slots, and
  fill insertion can no longer land before the warm-up.
- **Sample nights after calibration** (printed by the new suite): 12-player
  party → AirConsole warm-up, GeoGuessr + Drawasaurus mains, Antimatter
  Dimensions intermission, Make It Meme, Krunker showdown, Gartic Phone
  cool-down (seats ~12), exactly ~120; solo 240 chill → Song Maker warm-up,
  A Dark Room + A Tale of Crowns mains, Angband, Alone in the Dark deep dive,
  ~225 of 240; kids 5-player hour → 0hh1 warm-up, two quick mains, Minecraft
  Classic showdown, 2048 cool-down, exactly ~60, all kid-safe.

**test_wave19 to green (the pending suite)** — three real findings:
(1) **A live bug**: `game-detail.js`'s collections overlay mapped only the
live shape (`games[]`) — when the probe fell back to the static file
(`game_ids`), every shelf reshaped to an empty list and the overlay wiped
the correct static render ("Not on any curated shelf" for a game on four
shelves). The overlay now accepts both shapes and never re-renders an
empty result. (2) Stale counts: shelves/jump links 22 → 24 (wave 20's two
collections), and the tooltip assertion now accepts arcade.js's BASE-prefixed
href (cards render on subpages; the file:// URL is correct behavior).
(3) **Section F rebuilt**: Chromium 152's Local Network Access checks block
every loopback navigation in this sandbox (verified: fresh page, headful,
browser-initiated launch URL, CDP permission grants, feature flags — all
`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`), so the stub Curator is now an
in-page fetch stub serving the same canned envelopes; ApiClient, the badge
state machine, and both overlays execute for real, and the literal HTTP
round trip stays covered by `tests/api.test.sh` (40/40, real functions).

**Test-rot repairs in passing** (same documented class as wave 21's fixes):
`test_gamenight_parity.js` still read the catalog from `api/v1/` path
segments — dead since the wave-20 data move, invisible to the WF22 string
scan because the path was segmented; now `data/v1/`, parity back to 256/256.
`test_wave17.js` and `test_wow1.js` got the `/api/*`-probe console filter
(ERR_FILE_NOT_FOUND over file:// = the designed fallback) that the younger
suites already carried.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (42 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (41 pages, 1377 local links)**
- `node scripts/check_api_workflows.js`: **217/217 pass (WF1–WF24)** — WF23 version pin updated to 2.1.0; new WF24 (7 checks: calibration surface, overrides real + load-bearing, graded-fit behavior, ceremony surfacing, overlay shape fix, parity path, legal lane)
- `node scripts/test_gamenight22.js`: **ALL PASS (20 checks)** — every override id real + load-bearing (the suite caught 2 dead pins during development: a dating sim pinned at its own bucket value, HaxBall pinned at the tier its party tag already gives), graded-fit spot checks, and a **1,680-night grid sweep** (7 group sizes × 8 lengths × 5 vibe sets × 3 skill mixes × kids on/off) asserting timebox fit, breakdown sums, no repeats, kid-safe purity, curve edges, showdown/deep-dive rules — 1680/1680 clean
- `node scripts/test_wave19.js`: **37/37 ALL PASS, zero pageerrors** (was: incomplete/environment-blocked since wave 19)
- `node scripts/test_curatornight21.js`: **43/43 ALL PASS, zero pageerrors** (version pin → 2.1.0)
- `node scripts/test_gamenight_parity.js`: **256/256 PARITY OK** (v1 engine untouched, as designed)
- `tests/api.test.sh`: **40/40 green**
- Regression: `test_party_planner11` ALL PASS; `test_tournament10` ALL PASS (26/26); `test_trophy18` ALL PASSED; `test_player21` ALL PASSED; `test_wave17` ALL PASS (after the probe-noise filter); `test_wow1` desktop/motion/mobile/player ALL PASS + powerunit ALL PASS; `test_bracket` 82/82; `test_bracket_double` 105/105; `test_party11` 36/36; `test_converter12` 66/66
- `~/workspace/smoke/test.js`: exit 0, zero errors (known CDN tunnel noise only)
- `node --check`: clean on every new/edited JS file
- Screenshots inspected: desktop 12-player dealt night (slot meta reads "~20 min · puzzle · seats ~12 · anyone can play · low-key · 77/100"; plan notes declare the v2.1 grading), mobile 390px kids night (4 picks, exactly ~60 min, zero overflow)
- **Known environmental block**: `test_identity16` still hits its documented `waitCards` renderer stall at loadavg ~10 (parallel agents) — reproduced identically on the pristine wave-20 tree in wave 21's entry; no identity-covered code changed this wave (arcade.js/games.html untouched). Re-run on a quiet VM.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; calibration data is curator judgment over the existing verified catalog, no new external links.

**Self-assessment**: the engine now deals nights a person would actually plan — the 12-player party ends on a game that seats twelve, the solo descent gets its long dark rooms, and short nights stay short. The estimates are still estimates, and the page says so in plain words; what changed is that they're calibrated estimates with a test suite standing guard over every pin. The wave-19 suite being green closes the last documented loose end in the repo.

## Wave 21 — 2026-10-12 — "The Curator": null-guard fix + Game Night engine

**What shipped** — two tracks: (1) the player null-guard the smoke test caught,
(2) the genius mandate's flagship: a real game-night engine with a ceremony.

**The bug** — the headless smoke test (BM_BOOT_TEST, real GBA ROM upload) found a
`[pageerror] TypeError: Cannot set properties of null (setting 'textContent')` in
the engine-failure path. Root cause: `assets/js/player.js`'s `boot()` wrote
`$('sys-badge').textContent` / `.hidden` and the eject handler wrote
`$('player-toolbar').hidden` / `$('sys-badge').hidden` with no guards — the only
unguarded `$().textContent`/`hidden` writes left on the page (every other status
writer — `veilError`, `setStatus`, `slotsSetStatus`, `sys-badge2` — was already
guarded per the wave-3.1 null-guard discipline). Fixed with the same `if (el)`
pattern; `node --check` clean; a repo-wide grep confirms zero remaining
unguarded `sys-badge`/`player-toolbar` writes. Re-ran
`BM_BOOT_TEST=1 node ~/workspace/smoke/test.js`: exit 0, zero pageerrors (only
the known expected CDN tunnel noise — the sandbox can't reach
cdn.emulatorjs.org; the honest "ENGINE FAILED TO LOAD" veil renders correctly).

**Game Night — the Curator deals your night** (`game-night.html`, new flagship page):
- **The engine** (`assets/js/curator-night.js`, UMD, DOM-free, scoring **v2.0.0** —
  deliberately distinct from the wave-A/B v1 quick-lineup engine, which stays
  untouched with its 256/256 parity gate): headcount 1–12, time 15–240 min,
  vibe chips (cozy/chaotic/competitive/party/chill), skill mix, kids flag.
  Real logic: **player-count fit** (40), **session fit** (20),
  **vibe overlap** (20), **skill-mix fit** (10), **kid-safe** (10) — with two
  things v1 honestly couldn't do: per-game **session-length estimates** (~min,
  from genre shape + social tags) and **skill-floor estimates** (1 "anyone can
  play" / 2 / 3 "spicy"), both coarse curator heuristics, always shown with "~"
  and declared in every response's plan_notes. The night is **ordered like a
  good set**: WARM-UP → MAIN EVENTs → SHOWDOWN (groups) / DEEP DIVE (solo) →
  COOL-DOWN, with an IDLE "INTERMISSION" breather on long nights. House rules:
  no two neighboring slots share a genre, max 2 per genre, and the timebox is
  real — estimates must fit inside the night (short nights get repaired with
  shorter picks; long nights keep dealing mains up to 8 slots). Deterministic:
  score desc, title asc — the same night always deals the same way. Kids flag
  restricts to the 113 kid-safe games (zero horror in that corpus, verified).
- **The ceremony** (`assets/js/curator-night-ui.js` + `assets/css/curator-night.css`):
  marquee panel with chase-light bulbs, "» SHUFFLING THE DECK…" beat, then slots
  revealed one at a time like the marquee lighting up — role plates
  (warm-up amber / showdown pink / cool-down cyan), title links to each game's
  verified page, `~min · genre · floor · score/100` meta, why[] lines, and a
  "full game file" deep link per slot. An `aria-live` announcer narrates the
  reveal; reduced-motion and FX-off skip straight to the full lineup.
  "Tonight's suggestions" seeds (daily-rotated house presets) fill the form in
  one tap. Copy-as-text + print-the-night. Client-side only — the 213-game
  catalog is scored in the browser; nothing stored, nothing sent anywhere.
- **Wiring**: "Game night" in the nav + footer Play column on every full-chrome
  page (14 pages; slim-chrome 404/system-picker/guides exempt by design, same as
  Party planner), cross-links from the party-planner quick lineup ("want the
  full marquee ceremony?") and a homepage curator-note strip, `build_site.py`
  PAGES + regenerated sitemap/llms.txt, AGENT.md entry, view-source easter egg
  ("the curator's deck is stacked. don't tell the regulars.").
- **Agentic surface**: `check_api_workflows.js` WF23 (11 checks — engine
  contract, ceremony, keyframe discipline, nav/footer coverage, cross-links,
  sitemap/llms, legal lane, the player null-guard) — **210/210 pass total**.
  New `scripts/test_curatornight21.js`: **43/43** (18 engine unit checks incl.
  determinism, curve shape, timebox fit, variety, kids/solo/short/long edges;
  25 headless: ceremony beat, staggered reveal, announcer, kids restriction,
  invalid-input honesty, reduced-motion instant reveal, mobile 390px zero
  overflow, zero pageerrors throughout).

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (42 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (41 pages, 1376 local links)**
- `node scripts/check_api_workflows.js`: **210/210 pass (WF1–WF23)**
- `tests/api.test.sh`: **40/40 green**
- `node scripts/test_curatornight21.js`: **43/43, zero pageerrors** (new)
- `~/workspace/smoke/test.js` (standard): converter FULL PASS, index PASS, player engine-failure path clean; `BM_BOOT_TEST=1`: exit 0, zero pageerrors
- Regression: `test_party_planner11` ALL PASS; `test_trophy18` green after adding the collections section the same `/api/*`-probe filter the games section already had (the `file:///api/collections` failure is the designed fallback contract over file://, unrelated to this wave's two-line nav/footer edit); `test_identity16` got the same `/api/games`-probe filter for its harness (pre-existing wave-B test rot — the probe landed after that suite was written) and its remaining `waitCards` timeout is the documented loadavg-10 renderer stall, reproduced identically on the pristine wave-20 tree — environmental, not a regression
- `node --check`: clean on all new/edited JS
- Screenshots inspected: form/marquee desktop, dealt lineup (role plates, why[] lines, summary, honesty notes, copy/print), mobile 390px (stacked, zero overflow), deal-button close-up (coin-slot bezel renders correctly)
- **Bugs found & fixed in testing**: (1) the player null guard (above); (2) engine overrun on 15-min nights (~25 min dealt) — added greedy timebox repair; (3) 4-hour nights under-filled (~115/240) — long nights now keep dealing mains to 8 slots; (4) test fixture referenced a non-catalog id (`slay-the-spire`) — pinned to `breach-command`; (5) WF23 caught its own legal-lane regex false positive on the engine's "Zero ROMs, zero download links" header comment — reworded to the standard footer phrasing; (6) double "»" on slot file links (li::before + link text) — link text trimmed.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; every slot links the catalog's curl-verified game URL or the same-origin game file; estimates are declared estimates, never fake precision.

**Self-assessment**: the engine is the real thing — the curve, variety, and timebox logic produce nights that read like a human planned them (AirConsole warm-up → Agar.io main → Krunker showdown → TETR.IO cool-down is a genuinely good 4-player hour). The ceremony has the attract-mode energy the mandate asked for without tipping into motion spam, and the honesty notes are load-bearing, not decoration. Portfolio bar: the page earns it. What I'd still want: a second pair of eyes on session-estimate buckets against real playtimes, and the server-side v2 twin when the functions get their next pass.

## Wave 20 — 2026-10-12 — "Extreme Makeover": the 3-second homepage + human-made bar

**What shipped** — the user's verdict on the live sites ("a lot at once when someone
first visits") plus the raised bar ("'alright' is a failing grade — the benchmark is
the best sites on the internet"). First-visit hierarchy, ruthless pacing, and a
hard human-made rule. Nothing removed: all 213 games, all tools, all content.

- **New homepage hero** (`index.html` + `assets/css/makeover.css`): the first
  viewport is now a 3-second read — VT323 eyebrow ("» 213 free games · no installs
  · no accounts · no piracy, ever"), a huge editorial H1 ("Your browser is the
  *console*." — Space Grotesk 700 with the pixel-font neon-pink "console"),
  one honest sub-line, ONE primary coin-slot CTA ("» Browse the games"), a quiet
  "How it works ↓" link, and a stat band (213 games / 113 kid-safe / 24 shelves /
  22 guides; game count data-driven via `data-game-count` in `directory.js`).
  The arcade cabinet (wow wave 1) is demoted to the *second* beat with its own
  section head ("» The cabinet plays itself — attract mode, like the old days.
  Watch a while — or press start."). A shared `layout.css` `.hero-inner`
  marquee-panel style tried to box the hero in; `makeover.css` neutralizes it
  (typography on open space, not another cabinet panel — contrast, not repetition).
- **Attract-mode craft** (`assets/js/attract.js`): horror is excluded from the
  demo spotlight pool — attract mode is a handshake, not a jumpscare (the old
  rotation could open on a horror title). **Konami-code easter egg**: the
  cabinet notices (announcer "KONAMI ACCEPTED — 30 lives, same as ever." +
  CRT power cycle), motion-safe by construction.
- **Human signals**: a signed curator's note ("A note from the curator" — real
  opinions, "Especially the weird ones"), a view-source easter egg
  ("the high scores are all mine"), rewritten section copy
  ("Start here: the two machines"), AI-slop denylist enforced by WF22
  (no delve/unlock/game-changer/elevate/fast-paced-world/beginner-or-pro).
- **Completeness audit** (user's order): genres all healthy (p48/a39/r15/i15/
  m30/re44/h6/c16); **2 new real collections** (24 total, zero new URLs — all
  games from the verified catalog): `curators-choice` ("The Curator's shelf",
  8 games with genuine one-line opinions) and `start-here` ("New here? Start
  here", 7 onboarding games). Stale counts fixed everywhere (meta description
  162→213, ticker fallback, 404 "Browse 213 games"). Flagged for the next
  content wave (not fluffed): no dedicated NES emulation guide, no cheat-code
  guide — both real gaps, both need the 2000-word treatment.
- **CRITICAL Vercel fix**: static data moved `api/v1/` → `data/v1/` (Vercel
  never serves static files under `api/` — every frontend fetch of
  `api/v1/*.json` 404'd in production). `git mv` + every reference rewritten
  (frontend fetches, `api/*.js` requires → `../data/v1/`, `health.js` +
  `cron/curator.js` path joins, `run_local.js` static serving,
  `validate_envelope.py` schema path, `build_api.py` output dir, sitemap,
  llms.txt, footers, skills, docs). `api/` now holds ONLY the 5 function
  handlers + cron (verified). Generator fixed (`build_api.py` emits to
  `data/v1/`), so rebuilds can't reintroduce it. LIVE_CHECKLIST.md carries the
  rule verbatim.
- **Agentic surface**: WF22 (8 checks; **199/199 pass total**) — zero `api/v1`
  strings in code, `api/` purity, the 2 new collections' exact contents +
  voice, hero structure/order/CTA, curator note + eggs, AI-slop denylist,
  horror exclusion + Konami, LIVE_CHECKLIST rule.

**Validation:**
- `scripts/build.py`: **BUILD OK — 213 games, 24 collections, 10 emulators, 22 guides**; **LEGAL GATE OK (41 pages, 0 piracy links)**
- `scripts/check_links.py`: **0 broken (40 pages, 1306 local links)**
- `node scripts/check_api_workflows.js`: **199/199 pass (WF1–WF22)**
- `tests/api.test.sh`: **40/40 green**
- `~/workspace/smoke/test.js`: exit 0, zero errors (only the known file:// probe noise)
- Every `data/v1/*.json` fetch target verified present on disk; all 8 data/v1 JSON files parse
- Screenshots (all inspected): BEFORE homepage (the "wall of everything" — cabinet first, message buried), AFTER hero (3-second read), AFTER full page (hero → cabinet → machines → GOTD → curator note → shelf → craft), AFTER player.html (already at bar: "The Player. Bring your own file."), mobile 390px (zero overflow, stats 2×2)
- Honest note: `test_wave19.js` re-run still pending a quiet VM (documented in the wave-19 entry); the two real bugs it found are fixed in the tree.

**Legal lane**: unchanged — zero ROMs, zero ROM/BIOS download links; the 2 new collections reuse existing verified catalog URLs only.

**Self-assessment on the raised bar**: the homepage now earns its first 3 seconds — typography does the talking, the cabinet is the second beat, and the copy sounds like a person. The delight moments are real (Konami, curator's voice, the note). I'd put the hero in a portfolio; the deeper pages (directory, collections) are solid but not yet transcendent — that's the next makeover's work.

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
  `data/v1/games.json`, then the Curator live probe (`/api/games?id=`) overlays
  multiplayer/vibes with the honest live/cached badge (badge node preserved
  across re-renders). Sections: GAME FILE kicker, pixel title, genre/tag chips,
  description, controls, big verified play button (external, new tab), played/
  beaten toggles on the shared Trophy store, "On these shelves" cross-links
  (`collections.html#shelf-<id>`), 4 related same-genre cards, prev/next
  through the catalog, copy game-file link. Honest states: missing/unknown/
  bad id → "NO GAME ON THIS CHANNEL" + directory link; catalog failure →
  "CABINET OFFLINE".
- **`collections.html` Curator-wired**: inline script extracted to
  `assets/js/collections.js`; static-first render from `data/v1/collections.json`,
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
  5 function files; `data/v1/` only `.json`; zero basename collisions).
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

**What shipped** — the fallback contract goes live in the browser, per `~/workspace/server-program/ARCHITECTURE.md` §3 (service `mash-curator`). The site now calls `/api/*` first and falls back to the static `data/v1/` JSON with honest badges; it never looks broken when functions are cold or down.

- **`assets/js/api-client.js`** — the spec's `fetchWithFallback` reference implementation, copied verbatim (§3.2): 7s live timeout, `live` / `waking` / `cached` / `none` badge states, honest "cached · updated HH:MM" timestamps from the data's own `generated_at`, never rejects.
- **Game directory wired** (`games.html` + `assets/js/directory.js`): renders the full 213-game catalog from the static `data/v1/games.json` immediately (page never blank), then probes `GET /api/games?limit=200`. Live → fresh enrichment (`multiplayer`/`kid_safe`/`vibes`) overlaid by id, badge `live`. Miss → static stays, badge `cached · updated HH:MM`. Badge is `<span class="api-badge" role="status" tabindex="0">` — screen-reader announced, keyboard-focusable.
- **Quick game-night lineup** (`party-planner.html` + `assets/js/game-night-ui.js`): new widget — players 1–12, time 15–240 min, 5 engine vibes, kids flag → "Deal my lineup". POSTs `/api/game-night` first (7s timeout); on miss falls back to the client engine over static `data/v1/games.json` + `data/v1/kid-safe.json`. Renders lineup cards (title link, genre, slot, score/100 bar, why[]), plan_notes, and an honest meta line ("computed live by the Curator" vs "computed in your browser"). Invalid inputs rejected client-side with `role="alert"`.
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
- **`api/games.js`** — GET, filters `?genre= ?q= ?players= ?system= ?limit=` (default 50, max 200). Every game enriched with real derived fields (`multiplayer`, `kid_safe`, `vibes`, `system:"browser"`). Unknown system → honest empty list + note (corpus is browser games only); unknown genre → 400 BAD_INPUT. Fallback: `data/v1/games.json`.
- **`api/collections.js`** — GET all 22 (or `?id=` single, 404 on miss), game_ids resolved to real catalog titles/URLs.
- **`api/game-night.js`** — POST, stateless deterministic engine: `{group_size 1-12, minutes 15-240, vibe[], systems?, kids?}` → `{lineup, plan_notes, scored_from, scoring_version, scoring_weights, metadata_as_of, inputs_echo}`. Scoring: player fit 40 + session 30 + vibe 20 + kids 10, ties by title. Corpus-only (213 curl-verified browser games) — the safety property. Impossible constraints (e.g. `systems:["ps1"]`) → honest empty lineup + `no_lineup_reason` + why. kids=true restricts to the 113 kid-safe games. Compute-bucket rate limit (20/min). Client fallback parity: same weights ship in `assets/js/game-night.js` (wave B).
- **`api/cron/curator.js`** — weekly `0 10 * * 1` UTC: 6 emulator release Atom feeds + 2 itch feeds, parallel 4s fetch, diff vs `data/v1/curator-watch.json`, commit on change via GitHub Contents API (content-hash, SHA-retry). New releases are tracked for human review — never auto-published to the catalog. itch bot-gates (403) → recorded as failed source, not "no games". 60s duplicate cooldown. 10s budget guard (commit skipped if <3s remains).
- **`lib/`** — the five spec helpers (envelope, fetchx, ratelimit, cronauth, github) + `lib/game-night.js` (shared scoring). **Commit-back degrade:** the fine-grained PAT (`GITHUB_REPO_TOKEN`, contents:write) is still pending the user's decision — the cron detects the missing token and degrades to read-only (computes + returns the fresh diff, persists nothing, `degraded:true` + human note). Documented in `lib/github.js` and the cron header.
- **`vercel.json`** — buildCommand `python3 scripts/build.py` (timed 0.54s, <60s), outputDirectory `.`, nodejs22.x, cron lint (daily-or-slower), §2.2 headers, cleanUrls, trailingSlash false.
- **`data/v1/schema/envelope.json`** — §1.10 envelope schema (JSON Schema draft 2020-12).
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
- **Wiring**: `data/guides.json` +2, `build_site.py` GUIDES +2 (sitemap + llms.txt regenerated), `emulation.html` deep-dives hub 6 → 8 cards, data/v1 rebuilt by build.py.
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
- **Kids party toggle**: restricts picks to the 50 kid-safe games from `data/v1/kid-safe.json` (youngest-age-band selector 5–7/8–10/11–12, bands nest), all hot-seat hand-the-controller. Verified by data: only 1 of the 27 party-tagged games is kid-safe, so kids parties deliberately don't require the `party` tag — stated honestly in the UI and skill. Vibe + skill-mix fieldsets disable with an explanation while kids mode is on.
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
- **Agentic surface**: data/v1 rebuilt (games 125, kid-safe 50, collections 13, homebrew-packs with the jam entry); AGENT.md + API.md counts updated; `check_api_workflows.js` gained WF8 (7 checks; 47/47 pass). No new skill — no genuine gap (new games flow through the existing games/kid-safe endpoints and the kids-corner-guide skill).
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
- **API**: `data/v1/kid-safe.json` (new endpoint, manifest-registered in `data/v1/index.json`, draft-07 schema at `data/v1/schema/kid-safe.schema.json`, validated with jsonschema) — curated subset with full game records + kid flags; AGENT.md + API.md mentions.
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
- **Homebrew starter packs** (`data/homebrew-packs.json` → `data/v1/homebrew-packs.json`): 6 packs × 3–4 entries, every URL curl-verified HTTP 200 on 2026-10-11 (pdroms.de system sections, itch.io system tag pages, gbdev.io, n64.dev, psxdev.net, psx.dev, GameBrew GBA/GB lists). New schema `data/v1/schema/homebrew-packs.schema.json`.
- **New skill**: `skills/system-picker.md` (quiz triage + manual scoring weights + verified core facts). 12 skills total.
- **Updates**: `emulation.html` gained a "Not sure where to start?" quiz CTA + a 6-card "Per-system guides" section; `data/guides.json` + `data/v1/guides.json` now carry 14 guides; `scripts/build.py` gained n64.dev/psx.dev/psxdev.net reference domains; `scripts/check_links.py` now strips query strings before local-link resolution (deep links); `scripts/check_api_workflows.js` gained WF5 (packs envelope, 6 packs × 3+ URLs, 6 system-guide records, every guide's deep link, quiz scoring); AGENT.md (guides table, homebrew-packs endpoint, picker, deep links), README.md counts, llms.txt/llms-full.txt (regenerated), sitemap.xml (regenerated).

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
- **Agentic layer**: data/v1 rebuilt (envelope unchanged; games carry `tags`); AGENT.md updated (Converter v2 + Party Planner workflows, 114 count); llms.txt/llms-full.txt/sitemap regenerated; 2 new skills — `party-planner-runner`, `converter-multi-system` (11 total). `check_api_workflows.js` rewritten for the current envelope shape + wave-3 workflows.
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
- **Agentic layer**: `data/v1/` rebuilt with envelope format (`index/games/collections/emulators/guides.json` + schemas), `data/emulators.json` (10 picks, BIOS notes), 3 new skills (player-guide, legal-sourcing, collection-curator) + game-finder updated for the new data shape — 9 skills total.
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
- **Agentic layer**: `data/v1/games.json` + `data/v1/guides.json`, JSON schemas (`data/v1/schema/`), `llms.txt` + `llms-full.txt` (full guide texts), 5 skills (game-finder, emulator-setup, homebrew-hunter, party-game-picker, retro-guide), `API.md`.
- **Docs**: `README.md`, `GO_LIVE.md` (GitHub Pages checklist; repo still private — visibility is the user's call), `PIPELINE.md` (future waves: 100+ games, genre deep-dives, party planner tool).
- **Design**: neon-on-dark arcade theme, Chakra Petch display font, semantic HTML, skip links, ARIA states, keyboard support, `prefers-reduced-motion` handling, mobile-first responsive.

**Validation (wave 1):**
- `scripts/build.py`: BUILD OK — 47 games, 47 game pages, 5 guides, 5 guide pages, sitemap 53 urls
- `scripts/check_links.py`: LINK CHECK OK — 53 pages, 0 broken
- `node --check assets/app.js`: pass
- Link audit: all 47 game URLs + all guide-body URLs on the verified-domain allowlist; 0 invented domains

**Legal lane**: no ROM download links, no piracy sites, no cracked-game links, no copyrighted game files — verified by content review and the build-time domain audit. Guides teach tools; games come from the user's own dumps.
