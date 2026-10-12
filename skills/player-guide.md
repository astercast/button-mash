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
6. **Player 2.1 tools** (below the console on `player.html`, all client-side):
   - **Save slots:** named slots per game in the engine's own IndexedDB store (`EmulatorJS-states`/`states`). Engine slot key is `<base>.state` (base = game name with the engine's invalid-char strip); named slots are `<base>.bm-slot-<n>.state`. **Save** copies the engine slot into a named slot; **Restore** copies it back over the engine key so the engine's Load State picks it up; **Rename** is inline (Enter commits, Esc cancels); **Export** downloads the bytes; **Delete** removes the slot. Labels live in `bm-slots-<gameID>`. Import still writes a `.state` file into the engine slot under the current game's name. **Auto-save:** optional 1/5/15-minute timer (`bm-autosave-<gameID>`) copies the engine slot into `<base>.bm-autosave.state` when it changed — only while the tab stays open, only in *Keep in Browser* mode (in-game menu → Settings → Save States). Everything is browser-local; honest copy: saves never leave the machine. The panels work for the most recent game (`bm-last-game`) even before a fresh boot. Share a state file with a friend — they'll need their own copy of the same game file. Files are tied to the emulator build; cross-version loads may fail.
   - **Per-system control remapping:** one Player 1 map per system in localStorage (`bm-remap-<core>` = `{player0: {id: {value, value2}}}`), shown with the engine's per-core button labels (verified against the 4.2.3 stable build) and default maps. Press-a-key / press-a-pad-button capture; **Esc cancels both**; reset-to-defaults clears the system's map. Saved maps are written into the engine's own settings payload (`ejs-<gameId>-<core>-<gameName>-settings`, `controlSettings['0']`) at boot, so they apply on next boot — and override Player 1 changes made in the engine's own Control Settings (say so). First boot with a system map auto-migrates legacy per-game custom mappings (Player 2.0) into it. The remapper itself is fully keyboard-operable (native buttons, focus kept on the capture button). Analog-stick axes still need the engine's own Control Settings.
   - **Cheats:** enter name + code per game; stored per game in localStorage (`bm-cheats-<gameID>`), injected as the documented `window.EJS_cheats = [[name, code], ...]` before boot so they land in the engine's cheat manager — toggle them there with the cheat icon. Code formats (Game Genie/GameShark/Action Replay) are applied by each core's own cheat engine; per-core behavior is NOT verified — don't claim a core "supports" a format. Engine-verified facts only: the `EJS_cheats` array option and the `EJS_cheatPath` dynamic JSON (per-core `{core}.json` files, matched by game title).
   - **Display options** (per system, `bm-display-<core>` = `{crt, intScale, aspect}`): CRT scanline/vignette overlay (toolbar toggle, persisted; legacy global `bm-crt` is adopted once per system), integer-scale toggle (snaps the engine canvas to whole-pixel multiples of its intrinsic size, `pixelated` rendering), aspect ratio 4:3 / 16:9 / fill (engine default) / original 1:1 (CSS reframing of the canvas — the emulated resolution never changes), fullscreen with honest `aria-pressed` state, `fullscreenchange` sync, and an `f` shortcut from the console shell. **Quick-settings dialog** (toolbar ⚙ while playing, or the Display card) holds the display controls + auto-save for the current system and applies live. Reduced motion: CRT flicker is gated behind `prefers-reduced-motion: no-preference`, and player chrome kills animations/transitions under `prefers-reduced-motion: reduce`.
   - **Netplay:** do NOT promise it. Honest state: the engine advertises WebRTC room-code netplay, its own docs flag it "being worked on", and Button Mash has not verified it end-to-end on the stable build — not enabled, not tested. The netplay notes section on player.html says exactly this.
7. **Troubleshooting:** black screen on PSX/Sega CD → missing BIOS. Wrong system booted → use the manual override. Engine won't load → check connection to the EmulatorJS CDN.

### Converter (`converter.html`)

1. GBA files only (`.gba`), max 32MB — the largest real GBA cart.
2. Warn above 16MB: base64 adds ~33% overhead, so exports get heavy; suggest Player mode for big files.
3. The export is one `.html`: ROM embedded as base64 + player stub. The EmulatorJS engine loads from its public CDN on first run, then caches.
4. Remind them: only convert files they own. Sharing a converted commercial game is distribution.

## API references

- `data/v1/emulators.json` (core/software facts)

## Pitfalls

- Never suggest where to download ROMs or BIOS files. The answer is always: dump your own, play homebrew.
- Don't promise offline play for converted games on first run — the engine needs the CDN once.
- The Converter is GBA-only; other systems belong in the Player.
