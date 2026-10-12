---
name: kids-corner-guide
description: Recommend kid-safe browser games from the Kids corner audit (ages 5–12) — age bands, parent notes, and the honesty policy.
---

# Kids corner guide

## Use when

A parent, teacher, or caregiver asks for safe browser games for kids — or asks what's fine for a specific age, whether a game has chat, or how the curation works.

## The source of truth

- `api/v1/kid-safe.json` — the 113 games that passed the audit. Recommend ONLY from this file, never from the full catalog.
- `kids.html` — the kids corner page. `parents.html` — the full parent guide (curation method, honesty policy, screen-time tips, the save-state "one more level" trick).

## What "kid-safe" means here

Every record has `kid_safe: true`, meaning it passed all four bars:
1. No open chat with strangers.
2. No unmoderated multiplayer chat or user-generated content.
3. No gambling mechanics.
4. No graphic or horror content.

Every record also carries `no_chat: true`, an `age_band` (`5-7`, `8-10`, `11-12`), a `parent_note` (why it's fine + what to watch), a `verify_live` flag, and an `audit_basis`.

## Procedure

1. Ask (or infer) the age band. Default to the youngest plausible band when unsure.
2. Filter `api/v1/kid-safe.json` to that `age_band`. Younger bands are safe for older kids too — but not the reverse.
3. Read the `parent_note` before recommending. Surface the "what to watch" part verbatim — e.g. ad-heavy host sites (Slope, Moto X3M), the public-dataset note (Quick, Draw!), the account prompt (Melvor Idle).
4. If `verify_live` is true, say so: "We couldn't fully verify this one end-to-end — play the first 10 minutes together."
5. Deliver: 1–3 picks with title, age band, one-line why (from `parent_note`), and the play URL from the record.

## Age-band cheat sheet

- **5–7** — one-button toys and sandboxes: Townscaper, Sandspiel, Song Maker, Koalas to the Max, Asteroid Launcher, Clumsy Bird, Quick, Draw!, The Deep Sea.
- **8–10** — puzzles and gentle games: 2048, Wordle, Little Alchemy 2, Sudoku, Seterra, Globle, Worldle, 0hh1, Celeste Classic, Minecraft Classic, Line Rider, Slow Roads, Nested, goodbye doggy (verify_live), Cookie Clicker, Candy Box 2, Trimps, Swarm Sim, Slope, Moto X3M (ad warnings), Astray, HexGL, QWOP is NOT here — it's 11–12, Canabalt (verify_live), Space Elevator, Draw Logos From Memory, Type Help (verify_live).
- **11–12** — harder puzzles and slow strategy: Connections, Framed, The Password Game, Dragonsweeper, A Dark Room, Universal Paperclips, Kittens Game, Antimatter Dimensions, Melvor Idle (verify_live).

## The honesty policy (never soften)

- The flags are **assessments, not guarantees**. Say that when asked "is it definitely safe?"
- Games that failed are excluded, never softened. If someone asks for a non-listed game (e.g. a chat .io game), answer: it's not in Kids corner and why — don't recommend it as "probably fine."
- When in doubt, exclude — and when you can't verify something, say so instead of guessing.

## API references

- `api/v1/kid-safe.json`
- `api/v1/schema/kid-safe.schema.json` (draft-07)

## Pitfalls

- Recommending from the full `games.json` when the ask is kid-safety — the full catalog is 213 games; only 113 are kid-safe.
- Dropping the "what to watch" part of a parent note — that's the most useful sentence for the parent.
- Treating age bands as guarantees — they are difficulty/theme guidance, not endorsements.
- Never invent a game URL. Only recommend what's in `api/v1/kid-safe.json`.
