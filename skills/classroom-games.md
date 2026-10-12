---
name: classroom-games
description: Pick free, legal, classroom-safe browser games by subject and age band for teachers and after-school programs.
---

# Classroom games

## Use when

A teacher (or after-school program lead) asks for browser games that fit a lesson, a subject, or an age band — zero installs, no accounts, free and legal.

## Inputs

- Subject (math, geography, science, art, literacy, general enrichment)
- Age band / grade level
- Time available (5-minute warmup vs. full period)
- Constraints (no chat with strangers? keyboard-only? read-heavy?)

## Procedure

1. Read `data/v1/games.json`, filter `players` to `single` (and `both` when the group activity fits).
2. Match the subject:
   - **Math / logic** → `2048` (number sense), `0hh1` (logic grids), `Universal Paperclips` (older students — exponential growth discussion).
   - **Geography** → `Seterra` (countries, flags, capitals — custom quiz mode).
   - **Art / creativity** → `Quick, Draw!` (doodling + how neural nets "see"), `Little Alchemy 2` (creative combination chains).
   - **Literacy / story** → `A Dark Room` (older students, minimalist text RPG), `Fallen London` (advanced readers, gothic fiction), `Kingdom of Loathing` (comedy writing).
   - **Science** → `Particle Clicker` (particle physics, made with CERN), `Little Alchemy 2` (elements as systems thinking).
   - **Warmup / brain-break** → `Hextris`, `TETR.IO` solo sprint, `The Wiki Game` (research racing — great for "find sources fast" lessons).
3. Apply the age band: elementary → Seterra, Little Alchemy 2, Quick, Draw!, 2048. Middle school and up → everything above plus A Dark Room, The Wiki Game, Universal Paperclips.
4. Apply the constraint filter: **avoid `multiplayer` games in classrooms** (stranger chat, unpredictable lobbies) unless you're running a supervised private room — skribbl.io private rooms are the one safe exception.
5. Deliver: 1–3 picks with their play URLs from `data/v1/games.json`, each with a one-line classroom use ("10-minute Globle warmup before the geography unit").

## Worked example

4th-grade after-school program, 30 minutes, logic + fun → **0hh1** (tiny logic puzzles, zero reading load) → backup **Little Alchemy 2** (discovery chains, kids shout out combinations).

## API references

- `data/v1/games.json`

## Pitfalls

- Recommending `multiplayer` .io arenas for a classroom — stranger-filled lobbies are not a lesson plan.
- Read-heavy games (Fallen London, Kingdom of Loathing) for young readers — match the reading level.
- Never invent a game URL. Only recommend what's in `data/v1/games.json`.
