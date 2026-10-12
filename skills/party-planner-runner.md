---
name: party-planner-runner
description: Build a timed game-night rotation plan (headcount, timebox, vibe) from the catalog's party-tagged games.
---

# Party planner runner

## Use when

"Plan game night: 6 people, 2 hours, something chaotic" — any headcount, any timebox, any vibe. Mirrors what `party-planner.html` does in the browser, for agents.

## Inputs

- Headcount (1–16)
- Time available (minutes)
- Vibe: `chaotic` / `competitive` / `cooperative` / `creative` / `chill`
- Skill mix: `gamers` / `mixed` / `casual`
- Inputs available: keyboard, mouse, touch, phone-as-controller

## Procedure

1. Read `api/v1/games.json`, filter to games whose `tags` include `party`.
2. Match the vibe to sub-tags:
   - `competitive` → `shooter`, `arena`, `racing`, `sports`
   - `cooperative` → `coop`, `board`
   - `creative` → `drawing`, `word`
   - `chaotic` → `arena`, `drawing`, `word`
   - `chill` → `trivia`, `board`, `word`
3. Apply the skill mix: `casual` drops `shooter`/`arena`/`racing`; `mixed` drops `shooter`; `gamers` keeps everything.
4. Apply input limits: shooters/racers need keyboard+mouse; drawing games need a pointer (mouse/touch/phone); `phone`-tagged hubs need phones.
5. Timebox: 20-minute slots (30 for cooperative/chill), capped at 8 slots. Rotate the starting player every slot so nobody hogs first turn.
6. Deliver: ordered slot list with times, one game per slot, setup notes (private-room games need 5 min setup; .io arenas are drop-in), and the hand-the-controller rotation order for hot-seat games.

## Worked example

6 friends, 60 minutes, chaotic, mixed skill, keyboard+mouse →
slot 1 (0–20) bonk.io — everyone-in arena, drop-in;
slot 2 (20–40) skribbl.io — hot-seat drawing, P3 starts, private room link;
slot 3 (40–60) jklm.fun — hot-seat word games, P5 starts.

## API references

- `api/v1/games.json` (`tags` field; schema: `api/v1/schema/games.schema.json`)

## Pitfalls

- Picking a game with no private rooms for a group that wants to play together — check lobby/room support in the description.
- Recommending high-skill-floor shooters to non-gamers — read the skill mix.
- Never invent a game URL. Only recommend what's in `api/v1/games.json`.
