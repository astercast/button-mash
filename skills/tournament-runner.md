---
name: tournament-runner
description: Run a single-elimination game-night tournament — seeding, byes, best-of-N, one party game per round.
---

# Tournament runner

## Use when

"Run a tournament for our game night" — 2–16 players, competitive bracket, someone needs to keep score and advance winners. The page does all of it: `tournament.html`.

## What the tool does

- **Players**: one name per line (2–16). Entry order = seed order (first name = top seed); a shuffle button randomizes seeds.
- **Seeding**: standard single-elimination seeding (1v16, 8v9, …). Odd player counts give first-round byes to the top seeds — shown honestly as BYE, auto-advanced, never scored.
- **Per round**: pick one party game from the catalog (real, verified game ids — the dropdown lists party-tagged games from `api/v1/games.json`) and a best-of-N (1, 3, 5, 7).
- **Advancing**: click "Advance <name>" (best-of-1) or tap + to log game wins (best-of-N, winner auto-advances at the majority). "Clear winner" unwinds a match and everything downstream that depended on it.
- **Persistence**: the bracket saves to the browser's localStorage — refresh-safe mid-tournament.
- **Outputs**: "Print bracket" (clean print layout), "Copy my bracket" (shareable text: rounds, matchups, games, winners).
- **Party planner handoff**: a finished party plan has a "Turn this plan into a tournament" button that pre-fills players and games via `tournament.html?players=N&games=id1,id2`.

## Procedure

1. Get the player list and game prefs (which party game per round? best-of per round?).
2. Confirm the plan fits: competitive 1v1-style games work best (bonk.io, tetr.io, krunker.io, smashkarts); drawing/party games (skribbl.io, gartic-phone) work as judged rounds — say so honestly.
3. Send the user to `tournament.html` with names pre-entered, or build the handoff link yourself: `tournament.html?players=6&games=bonk,skribbl,tetrio` — use only real ids from `api/v1/games.json`, never invent one.
4. Rules to state up front: best-of per round, what happens on a bye, and that the champion banner is the official result.

## Worked example

8 friends, 90 minutes, competitive → `tournament.html?players=8&games=bonk,tetrio,skribbl`: quarterfinals best-of-1 on bonk.io, semifinals best-of-3 on TETR.IO, final best-of-3 on skribbl.io. Byes: none (8 is a power of 2).

## API references

- `api/v1/games.json` (party-tagged games for round assignment)

## Pitfalls

- Picking a game with no head-to-head mode for a bracket round — check the game's description for versus/multiplayer support first.
- Inventing a game id for the `games=` param — only use ids from the catalog.
- Odd player counts are fine; don't force-drop someone to reach a power of 2. Byes are the honest answer.
