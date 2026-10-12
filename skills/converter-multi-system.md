---
name: converter-multi-system
description: Convert user-supplied GBA, GB/GBC, NES, SNES or Genesis files into self-contained playable .html browser games — batch conversion, compression levels, ROM validation (Converter 3.0).
---

# Converter multi-system

## Use when

"I have my own retro files and I want portable browser games out of them." The Converter (`converter.html`) embeds each ROM in a game template that boots straight into EmulatorJS. Batch-capable: drop many files, get one `.html` per file. Client-side only — files never leave the machine.

## Supported systems (verified 2026-10-11)

| System | Extensions | EmulatorJS core | Max file | Warn above | BIOS |
|---|---|---|---|---|---|
| Game Boy Advance | `.gba` | `gba` (mGBA) | 32MB | 16MB | None — mGBA ships a built-in BIOS replacement |
| Game Boy / Color | `.gb`, `.gbc` | `gb` (Gambatte) | 8MB | 2MB | None — Gambatte needs no BIOS |
| NES | `.nes` | `nes` (FCEUmm) | 4MB | 1MB | None — FCEUmm needs no BIOS |
| Super Nintendo | `.sfc`, `.smc` | `snes` (Snes9x) | 6MB | 3MB | None — Snes9x needs no BIOS |
| Sega Genesis | `.md`, `.gen` | `segaMD` (Genesis Plus GX) | 4MB | 2MB | None — Genesis Plus GX needs no BIOS for cartridges |

Why exactly these five: the export template boots EmulatorJS with `EJS_core` set per file, and all five core data files (`cores/mgba-wasm.data`, `cores/gambatte-wasm.data`, `cores/fceumm-wasm.data`, `cores/snes9x-wasm.data`, `cores/genesis_plus_gx-wasm.data`) were curl-verified HTTP 200 on the pinned EmulatorJS 4.2.3 stable CDN on 2026-10-11; the `snes`/`segaMD` short names are the same ones the Player already boots. Gambatte handles both `.gb` and `.gbc` (that is what Gambatte is: a GB/GBC emulator). Max sizes follow the largest real cartridges: 48 Mbit SNES carts (Tales of Phantasia / Star Ocean), 32 Mbit of directly addressable Genesis ROM space (bank-switched carts are exotic — those go through Player mode). No other system is claimed — `.smd` (interleaved), `.bin` (too generic), `.zip`, `.iso` and the rest are refused gracefully; point the user at `player.html` instead.

## Procedure

1. Confirm the files are the user's own: dumps of cartridges they physically own, homebrew, or public-domain releases. See `skills/legal-sourcing.md`. Never help convert ROMs the user doesn't own.
2. Point them at `converter.html`: drop files (multiple OK) or click to browse. Each file becomes a queue row: detected system, size, editable title.
3. Options: compression level (None / Fast / Balanced / Best — see trade-offs below), optional cover art (one image for the whole batch, ≤2MB, embedded in every output).
4. Convert: files process sequentially with per-file progress (bytes, throughput, ETA). One bad file never stops the batch; Cancel stops after the current file. Each finished game gets its own download (or Download all).
5. Set expectations honestly: the export contains their ROM plus a player stub; the emulator engine loads from the public EmulatorJS CDN on first run, then it's cached. Needs internet the very first time.

## Validation (what the converter checks, and what it refuses to claim)

- **Errors (block conversion):** empty file; every byte zero (failed/blank dump); NES missing the `NES\x1A` signature or declaring zero PRG banks; file larger than the real-hardware max.
- **Warnings (convert anyway):** blank cartridge header — many homebrew ROMs ship zeroed headers and boot fine in mGBA/Gambatte (verified against the real `rkanoid-latest-demo.gba` test file); GB/GBC header checksum mismatch (pure spec arithmetic, may indicate corruption); Genesis ROM missing the `SEGA` string at 0x100 (emulators don't enforce it — likely still boots).
- **Notes (neutral facts):** SNES 512-byte copier header detected — kept as-is, Snes9x skips it automatically.
- The converter never claims a file "will boot" — validation is structural, not a boot test.

## Compression, honestly

ROM bytes are deflated (pako, vendored locally — no new network dependency) then base64'd; the output page inflates on-device with `DecompressionStream('deflate')` before boot. Level only costs **build** time: decode speed is flat across levels, and the game plays identically.

- None: plain base64, fastest build, biggest file (~33% over the ROM).
- Fast (1): quick pass, noticeably smaller, barely slower.
- Balanced (6, default): much smaller, a few extra seconds.
- Best (9): smallest file, slowest build — big ROMs take a while.

Savings vary by content: code-heavy ROMs shrink ~30–50%; already-packed data shrinks less. Compressed builds need a 2023-or-newer browser for `DecompressionStream` — the same vintage the WASM emulator itself requires; older browsers get a plain-language error, not a silent failure.

## Output contents

Each `.html`: custom title + optional cover art in the title bar, the ROM (base64, optionally deflated), a **▶ Player mode** button deep-linking `player.html?core=<gba|gb|nes>` (same system pre-selected; the user re-picks their original ROM there — handy on slow connections), fullscreen toggle, honest first-run engine note. Download filename is slugified from the title.

## Template token contract (`assets/vendor/template-game.html`)

11 tokens, all must be present in the template and filled by `assets/js/converter.js` via `ConverterCore.buildHtml` — which throws if any token is missing or survives:
`__BM_GAME_NAME__`, `__BM_GAME_ID__`, `__BM_BUILD_DATE__`, `__BM_ROM_SIZE__`, `__BM_ROM_B64__`, `__BM_CORE__`, `__BM_CORE_LABEL__`, `__BM_SYSTEM__`, `__BM_HINT__`, `__BM_COMPRESSED__`, `__BM_COVER__`.

Pure logic lives in `assets/js/converter-core.js` (UMD — the test suite `scripts/test_converter12.js` runs the same code the page ships). Verify with: `node scripts/test_converter12.js` (50 pinned fixtures).

## Pitfalls

- Zipped ROMs are refused — unzip first, the converter reads raw ROM files only.
- Batches over 100MB of input get a memory heads-up: the browser holds it all while converting; smaller batches are kinder.
- The exported game is single-file but not offline on first run — say so up front.
- "Download all" may trigger the browser's multiple-download permission prompt — that's normal.
- Legal lane is non-negotiable: user-supplied files only, zero ROM download links, ever.
