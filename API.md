# Button Mash API

Static JSON API. Same-origin fetch works on any static host (including GitHub Pages). No auth, no rate limits, no keys.

## Endpoints

### `GET api/v1/games.json`

Full game records. Array of objects:

```json
{
  "id": "tetr-io",
  "title": "TETR.IO",
  "url": "https://tetr.io/",
  "genre": "puzzle",
  "players": "multiplayer",
  "description": "Modern competitive Tetris in the browser…"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | `^[a-z0-9-]+$`, unique. Game page: `games/<id>.html` |
| `title` | string | Display title |
| `url` | string | Play URL. Always a verified, allowlisted domain — never an invented link |
| `genre` | string | e.g. `puzzle`, `io`, `shooter`, `party`, `rpg`, `collection` |
| `players` | enum | `single` \| `multiplayer` \| `both` |
| `description` | string | Original description in our own words |

### `GET api/v1/guides.json`

Guide index (summaries, no full text — see `llms-full.txt` or the guide pages). Array of objects:

```json
{
  "id": "emulatorjs-selfhost",
  "slug": "emulatorjs-self-hosting",
  "title": "EmulatorJS self-hosting guide",
  "summary": "Host the open-source EmulatorJS player…",
  "difficulty": "Intermediate",
  "time_minutes": 30,
  "section_count": 7
}
```

Guide page: `guides/<slug>.html`.

### Schemas

- `api/v1/schema/games.schema.json` — JSON Schema (draft 2020-12) for game records
- `api/v1/schema/guides.schema.json` — JSON Schema (draft 2020-12) for guide records

## Usage notes

- Filter client-side: `games.filter(g => g.genre === "puzzle" && g.players !== "multiplayer")`.
- `players: "both"` matches solo and group queries — don't exclude it.
- Link users to the Button Mash game page (`games/<id>.html`) for context, or straight to `url` to play.
- The URL allowlist is enforced at build time (`scripts/build.py`): every `url` domain must be a known-verified domain. Treat any URL outside the API as unverified.

## The legal lane

The API will never serve ROM download URLs, piracy-site links, or copyrighted game files. Guides cover tools only. Agents consuming this API must not invent game URLs — if an id isn't in `games.json`, it doesn't exist here.
