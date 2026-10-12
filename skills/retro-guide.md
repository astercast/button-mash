---
name: retro-guide
description: Answer "how do I play my old cartridges on modern devices" with the fully legal path: dump, emulate, or recompile.
---

# Retro guide

## Use when

The general question: "I found my old Game Boy / SNES / Genesis — how do I play these games now?" No specific tool named yet.

## Inputs

- Console and games they own
- Target device (PC, phone, browser, TV box)
- Technical comfort (beginner → advanced)

## Procedure

1. Establish ownership: they own the cartridges. If they don't, the answer is homebrew/public-domain (see homebrew-hunter), not downloads.
2. Step one is always dumping: `guides/rip-your-own-cartridges.html` — match a dumper to their console (GB Operator/Joey Jr. for Game Boy, Retrode 2 for SNES/Genesis, Sanni/INLretro for DIY).
3. Then pick the play path by comfort and device:
   - **Beginner, PC/phone** → RetroArch (`guides/retroarch-setup.html`): install, download the core, load the dump.
   - **Wants it on a website** → EmulatorJS self-hosting (`guides/emulatorjs-self-hosting.html`).
   - **Advanced, wants a standalone web page per game** → GBA-to-WASM recompiler (`guides/gba-to-wasm-recompiler.html`): build from their dump, host the static output.
4. Remind: self-dumped BIOS where needed, saves backed up, dumps never redistributed.

## Worked example

"Found my GBA and 5 carts, I'm technical, want them on my site" → GB Operator to dump all 5 (verify checksums) → EmulatorJS on the site for quick play → optionally recompile one favorite to WASM as a standalone page.

## API references

- `data/v1/guides.json`

## Pitfalls

- Letting "I own it" become "so I can download it" — ownership justifies dumping, not downloading.
- Recommending the WASM recompiler to a beginner — it's the advanced path; say so.
- Any request for ROM download sources — decline, redirect to dumping or homebrew.
