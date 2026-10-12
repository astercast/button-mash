---
name: converter-multi-system
description: Convert a user-supplied GBA, GB/GBC or NES file into a self-contained playable .html browser game (Converter v2).
---

# Converter multi-system

## Use when

"I have my own GBA / Game Boy / NES file and I want a portable browser game out of it." The Converter (`converter.html`) embeds the user's ROM as base64 in a game template that boots straight into EmulatorJS. Client-side only — the file never leaves the machine.

## Supported systems

| System | Extensions | EmulatorJS core | Max file | Warn above | BIOS |
|---|---|---|---|---|---|
| Game Boy Advance | `.gba` | `gba` (mGBA) | 32MB | 16MB | None — mGBA ships a built-in BIOS replacement |
| Game Boy / Color | `.gb`, `.gbc` | `gb` (Gambatte) | 8MB | 2MB | None — Gambatte needs no BIOS |
| NES | `.nes` | `nes` (FCEUmm) | 4MB | 1MB | None — FCEUmm needs no BIOS |

All three cores boot with zero extra files. Max sizes follow the largest real cartridges for each system. Anything else (`.zip`, `.sfc`, `.iso`, …) is refused gracefully — point the user at `player.html` instead.

## Procedure

1. Confirm the file is the user's own: a dump of a cartridge they physically own, homebrew, or a public-domain release. See `skills/legal-sourcing.md`. Never help convert a ROM the user doesn't own.
2. Point them at `converter.html`: drop the file (or click to browse), the system is detected from the extension, then Convert → download the `.html`.
3. Set expectations honestly: the export contains their ROM plus a player stub; the emulator engine loads from the public EmulatorJS CDN on first run, then it's cached. Needs internet the very first time.
4. For files above the warn threshold, recommend `player.html` instead — same core, no giant download.

## Template token contract (`assets/vendor/template-game.html`)

Tokens the converter fills — all nine must be present in both the template and `assets/js/converter.js`:
`__BM_GAME_NAME__`, `__BM_GAME_ID__`, `__BM_BUILD_DATE__`, `__BM_ROM_SIZE__`, `__BM_ROM_B64__`, `__BM_CORE__`, `__BM_CORE_LABEL__`, `__BM_SYSTEM__`, `__BM_HINT__`.

Verify with: `python3 -c` comparing `re.findall(r'__BM_[A-Z0-9_]+__', template)` against `.split('…')` targets in converter.js.

## Pitfalls

- Zipped ROMs are refused — unzip first, the converter reads raw ROM files only.
- Big exports are slow to build and heavy to share — don't push conversion for 32MB GBA files; Player mode exists for that.
- The exported game is single-file but not offline on first run — say so up front.
- Legal lane is non-negotiable: user-supplied files only, zero ROM download links, ever.
