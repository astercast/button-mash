---
name: emulator-setup
description: Walk through a legal emulator setup with EmulatorJS or RetroArch, from install to first boot of the user's own dumped game.
---

# Emulator setup

## Use when

Someone wants to play their old cartridges on a computer, phone, or their own website — "how do I emulate X?"

## Inputs

- Target hardware (GBA, SNES, NES, N64…)
- Device (PC, phone, self-hosted site)
- Whether they own the cartridges and a dumper (if not, start at the rip-your-own guide)

## Procedure

1. Confirm the legal starting point: they need ROMs dumped from cartridges they own, or homebrew/public-domain ROMs. If they ask where to download commercial ROMs, decline and point to `guides/rip-your-own-cartridges.html` and `guides/homebrew-and-public-domain.html`.
2. Pick the tool:
   - **Own website / shareable page** → EmulatorJS self-hosting (`guides/emulatorjs-self-hosting.html`): unzip the release, add their dumps, embed the player snippet.
   - **PC / phone app** → RetroArch (`guides/retroarch-setup.html`): install, Online Updater → Core Downloader, Load Content.
3. Match the core to their hardware: GBA core for GBA dumps, SNES core for SNES dumps — the guides list the common mappings.
4. BIOS check: GBA/PS1-style cores need a self-dumped BIOS. Never download one.
5. Verify: boot their dump, check controls, set up save states.

## Worked example

"I have GBA carts and a website" → confirm they can dump the carts → EmulatorJS: release ZIP on their static host → `roms/gba/` with their dumps → embed snippet with `EJS_core = 'gba'` → self-dumped BIOS → play.

## API references

- `api/v1/guides.json`

## Pitfalls

- Any step that involves downloading a commercial ROM or BIOS — hard stop, redirect to dumping/homebrew.
- Recommending a core for hardware the user doesn't own games for — ask first.
- Skipping the checksum verify on dumps — a bad dump causes "the emulator is broken" confusion.
