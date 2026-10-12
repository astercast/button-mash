---
name: homebrew-hunter
description: Find legal homebrew and public-domain ROMs for a console, from author-distributed sources only.
---

# Homebrew hunter

## Use when

Someone wants games for their emulator or recompiler project without touching piracy — "where do I get legal ROMs?"

## Inputs

- Target system (NES, Game Boy, GBA, Genesis…)
- Taste (platformer, puzzle, demo-scene weirdness…)

## Procedure

1. Start from the vetted sources in `guides/homebrew-and-public-domain.html`:
   - `pdroms.de` — archive of author-distributed homebrew across dozens of systems.
   - `nesdev.com` / `gbdev.io` — dev communities with released homebrew for NES / Game Boy.
   - itch.io (`https://itch.io/games`, search "homebrew") — devs releasing ROMs free on their own pages.
2. Filter to the target system, then to taste. Prefer games with an author page and a clear free-release statement.
3. For pure browser play with zero setup, cross-check the Button Mash game directory (`data/v1/games.json`) — the open-source HTML5 entries are homebrew-adjacent and need no emulator.
4. Report each find as: title, system, author/source page, why it fits.

## Worked example

"Legal GBA games for my EmulatorJS page" → pdroms.de GBA section → pick 2–3 with author pages → confirm each is marked free/homebrew → add to `roms/gba/` → done.

## API references

- `data/v1/guides.json`
- `data/v1/games.json`

## Pitfalls

- A "homebrew" site that also hosts commercial ROMs — leave immediately, find another source.
- ROM hacks and translations of commercial games — they need the original ROM, which the user must dump themselves; don't present them as standalone legal downloads.
- If the author page is gone and only a mirror remains, prefer a different game with a live author source.
