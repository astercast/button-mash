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

1. Read `api/v1/games.json` and filter by `genre` and `players`:
   - `players: "multiplayer"` or `"both"` for groups; `"single"` or `"both"` for solo.
2. Match the mood to genres: chill → `puzzle`, `idle`, `story`; competitive → `io`, `shooter`, `fps`, `battle-royale`; group laughs → `party`; learning → `trivia`.
3. For timeboxes under 15 minutes, prefer `arcade`, `io`, `puzzle` — games with instant rounds.
4. Recommend exactly 3: one safe pick, one stretch pick, one wildcard from another genre. Give each a one-line "why".
5. Link the game's Button Mash page (`games/<id>.html`) and the play URL.

## Worked example

"Something chill, solo, 30 minutes" → **Little Alchemy 2** (puzzle, meditative combining) → **A Dark Room** (story unfolds slowly) → wildcard **HexGL** (racing, 3-minute bursts).

## API references

- `api/v1/games.json`

## Pitfalls

- Recommending `mmo` or `rpg` epics for a 10-minute window — check the timebox first.
- Forgetting `players: "both"` games match either filter — don't exclude them.
- Never invent a game URL. If it's not in `api/v1/games.json`, it doesn't exist here.
