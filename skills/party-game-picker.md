---
name: party-game-picker
description: Pick the right multiplayer browser game for a group, a headcount, and a timebox.
---

# Party game picker

## Use when

"Game night, 6 of us, what do we play in the browser?" — any group size, any timebox, zero installs.

## Inputs

- Headcount
- Time available
- Vibe (competitive, cooperative, creative, chaotic)
- Skill mix (gamers vs. non-gamers)

## Procedure

1. Read `api/v1/games.json`, filter `genre` to `multiplayer`.
2. Match the vibe:
   - Creative / mixed skill → drawing party games: skribbl.io (draw & guess), gartic-phone (telephone drawing), drawasaurus.
   - Competitive gamers → `action` arenas: krunker.io, shell-shockers, smashkarts; battle royale: zombsroyale.io; worm arenas: slither.io, wormate.io.
   - Cooperative / strategic → colonist.io, board-game-arena, town-of-salem (social deduction).
   - Quick chaos, any headcount → agar.io, diep.io, bonk.io (drop-in, no lobbies).
3. Check the timebox: private-room games (skribbl.io, bonk.io) need 5 minutes of setup; .io arenas start instantly.
4. Deliver: one main pick with room-setup notes (private room? link sharing?), plus one backup if the lobby is full.

## Worked example

6 friends, 1 hour, mixed skill, chaotic → **bonk.io** (private room, share the link, bumper arenas) → backup **skribbl.io** (private room, draw & guess, zero skill floor).

## API references

- `api/v1/games.json`

## Pitfalls

- Picking a game with no private rooms for a group that wants to play together — check lobby/room support.
- Recommending high-skill-floor shooters to non-gamers — read the skill mix.
- Never invent a game URL. Only recommend what's in `api/v1/games.json`.
