# Button Mash API

Static JSON API. Same-origin fetch works on any static host (including GitHub Pages). No auth, no rate limits, no keys.

## Conventions

- Base: `api/v1/` relative to the site root.
- Every endpoint (except the schemas) uses an envelope: `name`, `version`, `generated_at` (ISO-8601 UTC), `endpoint`, `description`, `count`, plus the payload array under the endpoint's name.
- Start at `api/v1/index.json` — the manifest with every endpoint, its description, and usage notes.
- Payloads are complete snapshots sized for client-side filtering. Empty results are `[]`, never `null`.
- Breaking changes get a new `v2/` path, never a silent shape change.

## Endpoints

### `GET api/v1/index.json`

Manifest: description, legal note, endpoint catalog, usage.

### `GET api/v1/games.json`

Curated browser games (213 records, every URL curl-verified HTTP 200 on 2026-10-11). Envelope + `games` array:

```json
{
  "id": "tetrio",
  "title": "TETR.IO",
  "url": "https://tetr.io/",
  "genre": "puzzle",
  "controls": "Keyboard (customizable)",
  "description": "Blisteringly fast modern Tetris…"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | `^[a-z0-9-]+$`, unique |
| `title` | string | Display title |
| `url` | string | Play URL — verified live, never invented |
| `genre` | enum | `puzzle` `action` `roguelike` `idle` `multiplayer` `retro` `horror` `cozy` |
| `controls` | string | How it's controlled |
| `description` | string | Original description (CC0) |
| `tags` | string[] (optional) | `party` + sub-tags (`drawing`/`arena`/`shooter`/`board`/`trivia`/`coop`/`word`/`racing`/`sports`/`phone`) — powers the party planner |

Schema: `api/v1/schema/games.schema.json`.

### `GET api/v1/collections.json`

Hand-built collections. Envelope + `collections` array: `id`, `title`, `tagline`, `description`, `game_ids[]` (all IDs exist in `games.json`).

### `GET api/v1/emulators.json`

Emulator software picks (10). Envelope + `emulators` array: `id`, `name`, `systems[]`, `url`, `license`, `platforms[]`, `notes`, `bios_required`, optional `bios_note`. Software only — no ROMs, no BIOS files.

### `GET api/v1/guides.json`

Guide index (8 summaries; full text in `data/guides.json` and `llms-full.txt`). Envelope + `guides` array: `id`, `slug` (page: `guides/<slug>.html`), `title`, `difficulty`, `time_minutes`, `summary`, `section_count`.

Schema: `api/v1/schema/guides.schema.json`.

### `GET api/v1/kid-safe.json`

Kid-safe curated subset of the catalog (50 games). Envelope + `kid-safe` array: full game record plus `kid_safe: true`, `no_chat: true`, `age_band` (`5-7` / `8-10` / `11-12`), `parent_note` (why it's fine + what to watch), `verify_live` (true when the assessment couldn't be fully verified — "play the first 10 minutes together"), and `audit_basis` (the concrete basis for the flag — never invented). Assessments are honest snapshots, not guarantees; failed games are excluded, never softened.

Schema: `api/v1/schema/kid-safe.schema.json` (draft-07).

## Server API — live functions (Vercel Wave A/B)

One Vercel project serves this repo: the static frontend above plus Node
serverless functions under `/api/*` (zero npm dependencies, `nodejs22.x`).
Every function answers in the envelope from `api/v1/schema/envelope.json`
(`ok`, `data`, `meta` with `request_id`; `error` on failure). Same-origin —
no CORS headers, no auth on public GETs. Full hookup: `GO_LIVE.md`.

### `GET /api/health`

Service status (never 5xx — a failing health check returns
`data.status: "degraded"`). Lists every function in the deployment, per-file
`data_freshness` (7-day SLA), and boolean checks (static fallback present,
secrets configured — values never leak).

### `GET /api/games`

The catalog with live-computed enrichment. Query: `?genre=` `?q=` `?players=`
`?system=` `?limit=` (default 50, max 200). Every game carries the static
fields plus `multiplayer`, `kid_safe`, `vibes[]` derived server-side.
Unknown genre → 400 `BAD_INPUT`; unknown system → honest empty list + note.
Fallback: `api/v1/games.json`.

### `GET /api/collections`

All 22 collections (or `?id=` for one; 404 `NOT_FOUND` on miss) with
`game_ids` resolved to real catalog titles/URLs. Fallback: `api/v1/collections.json`.

### `POST /api/game-night`

The Curator's game-night engine: stateless, deterministic compute.
Body: `{group_size: 1-12, minutes: 15-240, vibe: ["cozy"|"chaotic"|"competitive"|"party"|"chill"], systems?: [...], kids?: bool}`.
Response: `{lineup: [{game_id, title, url, genre, kid_safe, score, score_breakdown, why[], slot_minutes}], plan_notes[], scored_from, scoring_version, scoring_weights, metadata_as_of, inputs_echo, no_lineup_reason}`.
Scoring: player-count fit 40 + session-length fit 30 + vibe-tag overlap 20 +
kid-safe bonus 10; ties by title. The corpus is the 213-game legal browser
catalog only — impossible requests (e.g. `systems: ["ps1"]`) return an honest
empty lineup with `no_lineup_reason`, never invented games. Client fallback:
`assets/js/game-night.js` (the identical engine, browser twin of
`lib/game-night.js`, parity-gated by `scripts/test_gamenight_parity.js`)
over the static `api/v1/games.json`. Compute-bucket rate limit (20/min/IP).

### `GET /api/cron/curator`

Weekly `0 10 * * 1` UTC: checks emulator release feeds + itch homebrew feeds,
commits `api/v1/curator-watch.json` deltas on change. `CRON_SECRET` bearer
required (401 without). Without `GITHUB_REPO_TOKEN` it degrades to read-only
(computes + returns the diff, persists nothing, `degraded: true`).

## Usage notes

- Filter client-side: `games.filter(g => g.genre === "puzzle")`.
- Link users straight to `url` to play, or to `games.html` for the browsable directory.
- Rebuild after editing `data/`: `python3 scripts/build.py` (validates + regenerates everything).
- The domain audit runs at build time (`scripts/build.py`): every external link in guide HTML must be on the allowlist (verified game domains + verified reference domains). New game domains must be curl-verified (HTTP 200) before adding.

## The legal lane

The API will never serve ROM download URLs, piracy-site links, BIOS files, or copyrighted game files. Guides cover tools only. Agents consuming this API must not invent game URLs — if an id isn't in `games.json`, it doesn't exist here.
