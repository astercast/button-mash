---
name: tournament-runner
description: Run a single- or double-elimination game-night tournament — seeding, byes, best-of-N, game voting, match history, share links.
---

# Tournament runner

## Use when

"Run a tournament for our game night" — 2–16 players, competitive bracket, someone needs to keep score and advance winners. The page does all of it: `tournament.html`.

## What the tool does

- **Players**: one name per line (2–16).
- **Format**: single elimination (lose once, you're out) or double elimination (one loss drops you to the losers bracket; winners champ vs losers champ in the grand final, with a bracket reset — one more final — if the losers champ wins the first one). The two formats save separately in the browser.
- **Seeding**: entry order = seed order (first name = top seed). A seeding list with ↑ ↓ buttons reorders seeds (keyboard-operable), plus a randomize button. No skill ratings exist on this site — seeds are manual or random, never rating-based. Standard bracket seeding (1v16, 8v9, …). Odd player counts give first-round byes to the top seeds — shown honestly as BYE, auto-advanced, never scored. In double elim, first-round byes contribute no loser to the losers bracket.
- **Per round**: pick one game from the full catalog (party-tagged games listed first; real, verified game ids) and a best-of-N (1, 3, 5, 7). Double elim also sets best-of per losers round and for the grand final.
- **Game voting (optional, per round)**: give players game picks in the seeding list, then open "Vote on the game" on any round — one vote per player (voting again moves the vote), ties go to the earliest-picked game, "Lock in" sets the round's game.
- **Advancing**: click "Advance <name>" (best-of-1) or tap + to log game wins (best-of-N, winner auto-advances at the majority). "Clear winner" unwinds a match and everything downstream that depended on it (in double elim, clearing a winners match also wipes the losers-bracket and grand-final results it fed).
- **Match history + undo**: every result is logged newest-first; "Undo last result" restores the previous step (works for the browser session only).
- **Persistence**: the bracket saves to the browser's localStorage — refresh-safe mid-tournament.
- **Outputs**: "Print bracket" (clean print layout), "Copy my bracket" (shareable text: rounds, matchups, games, winners, recent results), "Copy share link" (a `#b=…` URL that loads the exact bracket state in another browser — validated on import, tampered links are rejected with an error).
- **Party planner handoff**: a finished party plan has a "Turn this plan into a tournament" button that pre-fills players and games via `tournament.html?players=N&games=id1,id2` (`&format=double` also works).

## Procedure

1. Get the player list, the format, and game prefs (which game per round? best-of per round?).
2. Confirm the plan fits: competitive 1v1-style games work best (bonk.io, tetr.io, krunker.io, smashkarts); drawing/party games (skribbl.io, gartic-phone) work as judged rounds — say so honestly.
3. Send the user to `tournament.html` with names pre-entered, or build the handoff link yourself: `tournament.html?players=6&games=bonk,skribbl,tetrio` — use only real ids from `data/v1/games.json`, never invent one.
4. Rules to state up front: format, best-of per round, what happens on a bye, how the double-elim grand final + reset works, and that the champion banner is the official result.

## Worked example

8 friends, 90 minutes, double elim → `tournament.html?players=8&format=double&games=bonk,tetrio,skribbl`: quarterfinals best-of-1 on bonk.io, semifinals best-of-3 on TETR.IO, final best-of-3 on skribbl.io. Byes: none (8 is a power of 2). Losers bracket runs alongside; grand final needs a reset only if the losers champ wins the first final.

## API references

- `data/v1/games.json` (full catalog for round assignment and game picks; party tag marks the party-first group)

## Pitfalls

- Picking a game with no head-to-head mode for a bracket round — check the game's description for versus/multiplayer support first.
- Inventing a game id for the `games=` param — only use ids from the catalog.
- Odd player counts are fine; don't force-drop someone to reach a power of 2. Byes are the honest answer.
- Undo only covers the current browser session — a reloaded page can't undo pre-reload results (the results themselves persist; only the undo stack is session-only).
- Share links carry the bracket state in the URL — fine for group chats, but anyone with the link sees the player names.
