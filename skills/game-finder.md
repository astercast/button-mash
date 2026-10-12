---
name: game-finder
description: Find the right browser game for a mood, timebox, or group from the Button Mash directory.
---

# Game finder

## Use when

Someone asks "what should I play?" with any constraint: a mood ("something chill"), a timebox ("20 minutes"), a genre, solo vs. friends, or a device.

## Inputs

- Mood or genre (puzzle, idle, .io arena, party, story…)
- Time available
- Solo or multiplayer (and headcount if multiplayer)
- Anything to avoid

## Procedure

1. Read `api/v1/games.json` and filter by `genre` (puzzle, action, roguelike, idle, multiplayer, retro, horror, cozy).
2. Match the mood to genres: chill → `cozy`, `puzzle`, `idle`; competitive → `action`, `multiplayer`; group laughs → `multiplayer` party games (skribbl, gartic-phone, jklm, make-it-meme); deep thinking → `puzzle`, `roguelike`; nostalgia → `retro`.
3. For timeboxes under 15 minutes, prefer `puzzle`, `action`, `idle` — games with instant rounds.
4. Recommend exactly 3: one safe pick, one stretch pick, one wildcard from another genre. Give each a one-line "why".
5. Link the game's play URL from the record, and mention the Button Mash directory (`games.html`) for more.

## Worked example

"Something chill, solo, 30 minutes" → **Little Alchemy 2** (puzzle, meditative combining) → **Serenitrove** (cozy digging) → wildcard **Slow Roads** (cozy, pure zen driving).

## API references

- `api/v1/games.json`
- `api/v1/collections.json`

## Pitfalls

- Recommending `idle` epics (Kittens Game, Antimatter Dimensions) for a 10-minute window — check the timebox first.
- Never invent a game URL. If it's not in `api/v1/games.json`, it doesn't exist here.
- Never link ROM downloads or piracy sites — the legal lane is non-negotiable.
