---
name: party-planner-runner
description: Build a timed game-night rotation plan — guest list, game voting, rotation scheduler, snack-break timer, party timeline, kids-party mode, tournament handoff, share links.
---

# Party planner runner (2.0)

## Use when

"Plan game night: Alex, Sam, Riley — 2 hours, something chaotic" — a named guest list, any timebox, any vibe. Mirrors what `party-planner.html` does in the browser, for agents. Logic lives in `assets/js/party2.js` (UMD, node-testable; `scripts/test_party11.js` pins it).

## Inputs

- Guest list: 2–16 names (one per line), each ≤ 32 chars
- Time available (minutes)
- Party start time (optional `HH:MM` — gives the timeline real clock times)
- Vibe: `chaotic` / `competitive` / `cooperative` / `creative` / `chill`
- Skill mix: `gamers` / `mixed` / `casual`
- Inputs available: keyboard, mouse, touch, phone-as-controller
- Kids party toggle + youngest age band (`5-7` / `8-10` / `11-12`)
- Snack-break length (5–30 min) and tournament format (`single` / `double`)

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
5. **Kids party** (`party.opts.kids`): ignore vibe/skill — pool is the 113 kid-safe games from `api/v1/kid-safe.json`, filtered to the youngest age band and below (`Party2.kidPool`). All picks are hot-seat, hand-the-controller. The 113 games are a curated set — only 1 of the 27 party-tagged games is kid-safe, so kids parties deliberately don't require the `party` tag.
6. Timebox: 20-minute slots (30 for cooperative/chill), capped at 8 slots.
7. **Rotation** (`Party2.scheduleRotation`): hot-seat games play in groups of up to 4, offset rotating one guest per slot — over a full cycle every guest sits out the same number of times (pinned: 5 guests / 5 slots → everyone sits exactly once). Arenas: everyone plays at once.
8. **Game voting**: one vote per guest, re-voting moves the vote; ties go to the earliest-picked candidate. Voted games lead the plan (`Party2.topVoted`) and feed the tournament handoff.
9. **Timeline** (`Party2.buildTimeline`): 30-min setup → game slots (snack break inserted after the middle slot by default) → suggested 30-min tournament → 30-min free play. Wall-clock labels when a start time is set, relative `+0:00` offsets otherwise.
10. Deliver: timeline + ordered slots with rotation, vote tally, snack-break timer (start/pause/reset, `role="timer"`), and:
    - **Tournament handoff**: `tournament.html?players=N&names=A,B&games=id1,id2&format=single|double` — real guest names pre-fill the bracket, voted games become the round-game candidates. URL params mean a *fresh* tournament (no stale saved bracket restored).
    - **Share link**: same-origin `#p=` URL with the encoded party (validated import — tampered links rejected with an error).
    - **Print party pack** (print CSS hides the form/controls) and **Copy plan as text**.

## Worked example

5 guests (Ana, Ben, Cara, Dev, Eli), 60 minutes, chaotic, mixed skill, keyboard+mouse → setup (−30) → slot 1 (0–20) hot-seat game, Ana starts → slot 2 (20–40) → snack break (15 min) → slot 3 → tournament suggestion → free play. Votes: Ana + Ben for game X → X leads the rebuilt plan and the tournament's round-game candidates.

## API references

- `api/v1/games.json` (`tags` field; schema: `api/v1/schema/games.schema.json`)
- `api/v1/kid-safe.json` (`kid-safe` array: `id`, `age_band`, `parent_note`, `verify_live`)

## Pitfalls

- Picking a game with no private rooms for a group that wants to play together — check lobby/room support in the description.
- Recommending high-skill-floor shooters to non-gamers — read the skill mix.
- Kids party is hot-seat by design; don't promise simultaneous multiplayer on single-player kid-safe games.
- Never invent a game URL. Only recommend what's in `api/v1/games.json`.
