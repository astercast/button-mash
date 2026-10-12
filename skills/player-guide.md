---
name: player-guide
description: Walk a user through the Button Mash Player (bring-your-own-file EmulatorJS console) and the ROM-to-browser-game Converter — loading files, cores, BIOS, saves, and exports.
---

# Player guide

## Use when

Someone wants to play their own game files in the browser, asks how the Player works, hits a core/BIOS/save issue, or wants to turn a GBA file they own into a shareable browser game.

## Inputs

- The user's file (extension tells you the system)
- What they want: play now (Player) or make a portable game file (Converter)
- Any error message they're seeing

## Procedure

### Player (`player.html`)

1. **Load:** drag-and-drop, file picker, or direct URL. The file is read locally — never uploaded. URL loading needs the host to allow CORS; if it fails, tell them to download and drop the file.
2. **Core:** auto-detected from the extension (`.gba` → `gba`/mGBA, `.sfc`/`.smc` → `snes`, `.nes` → `nes`, `.md`/`.gen` → `segaMD`, `.gb`/`.gbc` → `gb`, `.n64`/`.z64` → `n64`, `.nds` → `nds`, `.cue`/`.bin`/`.chd` → `psx`, etc.). If detection fails, they pick the system manually from the dropdown.
3. **BIOS:** only PlayStation (`psx`) and Sega CD (`segaCD`) need one — dumped from their own hardware, attached via the BIOS picker. Everything else boots BIOS-free. Never provide or link a BIOS download.
4. **Controls:** keyboard works out of the box; full remap under the in-game menu → Controls. Gamepads supported; touch gets on-screen buttons.
5. **Saves:** save states in the in-game menu persist via browser storage. Ejecting loads a new file without losing states.
6. **Troubleshooting:** black screen on PSX/Sega CD → missing BIOS. Wrong system booted → use the manual override. Engine won't load → check connection to the EmulatorJS CDN.

### Converter (`converter.html`)

1. GBA files only (`.gba`), max 32MB — the largest real GBA cart.
2. Warn above 16MB: base64 adds ~33% overhead, so exports get heavy; suggest Player mode for big files.
3. The export is one `.html`: ROM embedded as base64 + player stub. The EmulatorJS engine loads from its public CDN on first run, then caches.
4. Remind them: only convert files they own. Sharing a converted commercial game is distribution.

## API references

- `api/v1/emulators.json` (core/software facts)

## Pitfalls

- Never suggest where to download ROMs or BIOS files. The answer is always: dump your own, play homebrew.
- Don't promise offline play for converted games on first run — the engine needs the CDN once.
- The Converter is GBA-only; other systems belong in the Player.
