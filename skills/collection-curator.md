---
name: collection-curator
description: Build and maintain themed game collections from the Button Mash directory — pick games, write taglines, and keep every link verified.
---

# Collection curator

## Use when

Someone wants a themed list ("games for a long flight", "best free horror games"), or when curating/refreshing the collections on the site.

## Inputs

- Theme, mood, or occasion
- Audience (kids, party group, solo, etc.)
- Size target (5–12 games works best)

## Procedure

1. Read `api/v1/games.json` and `api/v1/collections.json` — propose only games already in the directory.
2. Pick 5–12 games that genuinely fit the theme; mix genres where the theme allows, avoid near-duplicates (not three snake games).
3. Write the collection record:
   - `id`: kebab-case, unique
   - `title`: evocative, under 40 chars
   - `tagline`: one short hook
   - `description`: 1–2 sentences, original wording
   - `game_ids`: IDs from the directory, in play order
4. For each game, sanity-check it fits: open the URL (or fetch it) — **zero dead links**. If a link died, drop the game and pick a replacement.
5. Append to `data/collections.json`, rebuild with `python3 scripts/build_api.py`, and verify the collections page renders.

## Worked example

"Cozy games for a rainy day" → serenitrove, townscaper, six-cats-under, goodbye-doggy, tale-of-crowns, slow-roads, fallen-london, purrgatory, spooky-town, little-alchemy-2. Tagline: "Gentle games for grey weather."

## API references

- `api/v1/games.json`
- `api/v1/collections.json`
- `data/collections.json` (source of truth)

## Pitfalls

- Inventing a game not in the directory — every `game_id` must exist in `api/v1/games.json`.
- Letting a collection rot: re-verify links whenever the directory is re-verified.
- Theme drift: if half the games don't fit the title, split it into two collections.
