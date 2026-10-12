# PIPELINE — Button Mash

How content enters and grows on this site. The wave engine runs continuous improvement waves; this file is the standing brief for what "more" looks like.

## The legal lane (applies to every wave, no exceptions)

- Curated legal browser games only: itch.io free web games, .io games, open-source HTML5 games, free-to-play browser games, Internet Archive playable collections.
- Emulation = guides and tools only. User-supplied ROMs (self-dumped) or homebrew/public-domain.
- **Never**: ROM download links, ROM piracy sites, SteamUnlocked/cracked-game links, copyrighted game files, BIOS downloads.
- Every new game URL must pass the build's domain allowlist audit. A URL the author can't verify → use a search/browse link on a verified domain (e.g. `https://itch.io/games`), or drop the entry. A fake link is worse than no link.

## Wave ideas (future)

1. **More games (target 120+)**: sweep itch.io's free web-game tags, new .io releases, open-source HTML5 gems. Each needs: verified URL (curl HTTP 200), genre, controls, original description. Feed the `pipeline/` review queue first.
2. **Genre deep-dives**: curated "best of" pages per genre (best .io shooters, best idle games) generated from `games.json`.
3. **Guide expansion**: per-system RetroArch core guides (GBA, SNES, N64…), netplay setup guide, controller recommendations, save-management guide, MiSTer-vs-software-emulation explainer.
4. **Homebrew spotlights**: short features on notable homebrew releases (with author permission/link), generated from a new `data/homebrew.json`.
5. **Party planner tool**: headcount + timebox + vibe → ranked game picks (interactive, like the Activity Vault planner).
6. ~~**"Tonight's pick" widget**~~ — shipped wave 2 as game-of-the-day (date-seeded, no backend) on `index.html`.
7. **Video guides**: short screen-recorded walkthroughs for the EmulatorJS/RetroArch guides (user records or approves).
8. **i18n**: Spanish-language game descriptions (user's community angle).

## Data workflow

1. Add records to `data/games.json` / `data/guides.json` / `data/collections.json` / `data/emulators.json` following the schemas in `api/v1/schema/`.
2. Run `python3 scripts/build.py` — must print `BUILD OK` (validates data, audits link domains, regenerates `api/v1`, `llms.txt`, `llms-full.txt`, `sitemap.xml`).
3. Run `python3 scripts/check_links.py` (0 broken) + `node --check assets/js/*.js`.
4. Update counts in `README.md`, hero copy if stale.
5. Log the wave in `WAVELOG.md`.
6. Push via `gh-push.py`; verify the remote commit through the GitHub API.

## Live watchers (human review queue — never auto-publishes)

`pipeline/` watches the outside world and queues candidates in `pipeline/review_queue.json` with `status: "pending"`. A human (or a wave) reviews each candidate: verify the URL live, write an original description, assign a genre — only then does it enter `data/`.

- `pipeline/watch_itch.py` — itch.io fresh free browser-game feeds → game candidates. **Known limitation (verified 2026-10-11): itch.io bot-gates its browse feeds (HTTP 403).** The watcher retries with a browser UA and degrades gracefully; when feeds stay gated, the curator does a manual sweep of itch.io's free browser-games page instead. Documented here so nobody "fixes" it by scraping aggressively.
- `pipeline/watch_emulator_releases.py` — GitHub release Atom feeds for EmulatorJS, RetroArch, mGBA, DuckStation, PCSX2, PPSSPP → release candidates. A human reads the notes and updates guides/emulator picks when behavior changes (cores, BIOS needs, new systems).
- `pipeline/review_queue.json` — the queue itself. Fields: `title`, `url`, `source`, `spotted_at`, `status` (`pending`/`accepted`/`rejected`), `notes`.

**Cadence:** run both watchers whenever a content wave starts (or weekly via cron once the user approves scheduling). Triage the queue, accept/reject each item, then run the data workflow above.
