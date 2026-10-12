---
name: system-picker
description: Recommend which classic system a user should emulate — weighing nostalgia era, device power, game taste, and tinkering tolerance. Honest about hardware limits (N64/PS1 need real power); weak devices get GBA/SNES/GB instead. Points at the per-system guides and Player deep links.
---

# System picker

## Use when

Someone asks which system to emulate, is new to emulation, or has a weak device and wants to know what's realistic. Also useful as a triage step before the player-guide, homebrew-hunter, or retro-guide skills.

## Inputs

- Nostalgia era (late-80s handheld / 16-bit console wars / GBA golden age / early 3D)
- Device power (weak = old phone/Chromebook → **N64 and PS1 are off the table**; mid = decent laptop; strong = recent desktop)
- Game taste (quick handheld sessions / couch classics / 3D adventures / story epics)
- Tinkering tolerance (zero / some / lots)

## Procedure

1. **Send them to the quiz first** when they're browsing: `system-picker.html` scores the same inputs in-page and links the matching guide + Player deep link.
2. **Manual scoring (same weights as the quiz):** era gives 2 points to its systems (handheld89→gb; sixteenbit→snes+genesis; gbaage→gba, gb+1; early3d→n64+psx); taste gives 2 (quick→gb+gba; couch→snes+genesis; adventure3d→n64; storyrpg→psx, snes+1); tinkering adds 1 (zero→gb/gba/snes; some→genesis/psx; lots→n64/psx). Weak device **disqualifies** n64/psx outright — never recommend them there; say why.
3. **Answer with:** the system name, one-line why, the guide link (`guides/<slug>.html`), and the Player deep link (`player.html?core=<core>`). Name the runner-up too.
4. **Core facts (verified against the official EmulatorJS core list — never invent cores):** GBA `gba`→mGBA (BIOS-free); SNES `snes`→Snes9x (BIOS-free); N64 `n64`→Mupen64Plus-Next (BIOS-free); PS1 `psx`→PCSX-ReARMed (HLE boots, user-dumped BIOS improves accuracy — never provide/download); Genesis `segaMD`→Genesis Plus GX (BIOS-free); GB/GBC `gb`→Gambatte (BIOS-free).
5. **Honesty rules:** N64 has per-game graphical quirks even on strong machines — set that expectation. PS1 needs modest power; GBA/SNES/Genesis/GB run on anything. Never claim a system the user doesn't have a file for will "just work" — the Player loads user-supplied files only.
6. **Homebrew on-ramp:** no own dumps yet? Each system guide's starter pack lists curl-verified legal sources (pdroms.de sections, itch.io system tags, gbdev.io / n64.dev / psxdev.net / psx.dev / GameBrew lists). Full data: `api/v1/homebrew-packs.json`.
