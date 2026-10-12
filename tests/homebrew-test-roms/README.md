# Homebrew boot-test artifacts (wave 8)

Prepared for **parent-level browser delegation**: the real-browser boot test of
`player.html` with a genuine homebrew GBA file. A generic subagent cannot drive
the live browser, so this directory holds the file + the runnable scenario; the
parent delegates the actual browser run.

## Test ROM: `rkanoid-latest-demo.gba`

- **What it is:** "@rkanoid LATEST - DEMO" — an Arkanoid clone for Game Boy
  Advance by benoror (Dreamsoft). Source: the author's own repo
  `benoror/gbadev`, directory `ROMS/`.
- **License lane:** the author's own original homebrew (documented in the repo
  README: "An arkanoid-clone consisting of 5 levels, 2-player mode, scoring &
  special items"). Older builds in the same folder are explicitly marked (PD).
  This file is a **test artifact only** — never linked, hosted, or distributed
  on the site. The site stays ROM-free; the Player/Converter only ever touch
  user-supplied files.
- **Verified 2026-10-11:**
  - Downloaded from `https://raw.githubusercontent.com/benoror/gbadev/master/ROMS/%40rkanoid%20LATEST%20-%20DEMO.gba`
  - Size 207,516 bytes — matches the GitHub API listing exactly.
  - SHA-256: `d9520404396ae3908ac159ee7d1e105a597ea9fa01f9aec2cb902949b55a78f2`
  - The repo README documents this as a working demo, and the author's own
    playable showcase (`benoror.github.io/gbadev`, "versioned cartridge rack")
    boots these ROMs in a browser emulator.
  - NOTE: like many early homebrew ROMs, its cartridge header region is
    zeroed (no Nintendo logo / fixed value / checksum). mGBA boots such ROMs
    (its built-in BIOS replacement skips the logo check) — but **actual boot
    inside Button Mash's player.html is NOT verified from here**. That is the
    delegated step below.
- **NOT verified:** that this exact file boots in `player.html` under the
  pinned EmulatorJS 4.2.3 stable engine. The browser scenario asserts this.

## Scenario: `homebrew-boot-scenario.js`

Node + Puppeteer script (same stack as `~/workspace/smoke/test.js`):

1. Serves `~/workspace/button-mash` over a local static server (the player
   needs http://, not file://, for the engine worker).
2. Opens `player.html`, waits for the dropzone UI, attaches
   `rkanoid-latest-demo.gba` to the ROM file input.
3. Waits up to 60s for the engine canvas to exist and paint (samples pixels;
   asserts a non-blank frame).
4. Collects `pageerror` events throughout — **zero pageerrors required**.
5. Reports PASS/FAIL with the failure detail (veil-error path, engine
   timeout, blank canvas, pageerror text).

Run: `node tests/homebrew-test-roms/homebrew-boot-scenario.js`
(needs `puppeteer` installed and network access to the EmulatorJS CDN).
