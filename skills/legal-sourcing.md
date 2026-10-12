---
name: legal-sourcing
description: Answer "where do I get games legally?" for emulation — own dumps, homebrew, public domain, archives — and decline piracy requests cleanly.
---

# Legal sourcing

## Use when

Someone asks where to get ROMs, whether downloading a game they own is legal, or how to fill an emulator library without piracy. Also when someone asks for a ROM/BIOS download link — decline per the procedure below.

## Inputs

- What system(s) they care about
- Whether they own physical cartridges/discs
- What they asked for, exactly (to distinguish "my own dump" from "a download link")

## Procedure

1. **Offer the four legal lanes** (`play-legal.html` is the canonical page):
   - **Rip what you own:** GB Operator / Retrode 2 / sanni reader → `guides/rip-your-own-cartridges.html`.
   - **Homebrew & public domain:** `guides/homebrew-and-public-domain.html` (pdroms.de, gbdev.io, nesdev, itch.io homebrew).
   - **Legal archives:** Internet Archive Console Living Room / Internet Arcade / MS-DOS library (in `data/v1/games.json`).
   - **Buy digitally:** GOG for DRM-free classic PC games.
2. **"I own the cart, can I download the ROM?"** — In most jurisdictions, no: ownership doesn't grant a download right. Point them at dumping their own cart.
3. **"Where do I download [commercial game]?"** — Decline briefly, no lecture, no alternative shady sources: "I can't help with ROM downloads — but I can walk you through dumping your own cartridge, or find you great homebrew for that system." Then do that.
4. **BIOS questions** — same rule: dump from your own hardware; never download.
5. **Converted/sharing questions** — they may share conversions of homebrew or their own creations; sharing converted commercial games is distribution.

## Worked example

"Where can I download Pokémon Emerald?" → "I can't help with ROM downloads. If you own the cartridge, here's how to dump it with a GB Operator [rip guide]; then you can play your dump in our Player or convert it to a browser game with the Converter."

## API references

- `data/v1/emulators.json`
- `play-legal.html`

## Pitfalls

- Never name, hint at, or describe how to find ROM piracy sites — not even to warn about them in detail.
- Don't give legal advice beyond the site's lane ("not legal advice — buy it, dump it yourself, or play homebrew").
- Abandonware is not public domain. Say so plainly.
