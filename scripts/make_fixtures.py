#!/usr/bin/env python3
"""Generate the PortPlay homebrew test fixtures.

Small, structurally real ROM images authored from the published header
specs of each system (no game data, no copyrighted content: deterministic
filler bytes and hand-built headers). They exist so the converter's
end-to-end path (validate -> convert -> portable file) can be proven per
system class in scripts/test_portplay.js, alongside the real homebrew
control file rkanoid-latest-demo.gba.

Run: python3 scripts/make_fixtures.py   (deterministic output)
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "tests" / "homebrew-test-roms"


def pattern(n, seed=0x41):
    """Deterministic non-trivial filler (LCG), never all-zero."""
    x = seed
    buf = bytearray()
    for _ in range(n):
        x = (x * 1103515245 + 12345) & 0x7FFFFFFF
        buf.append((x >> 8) & 0xFF)
    return buf


def gba():
    b = bytearray(pattern(256 * 1024, 3))
    # Cartridge header: entry branch + title/code fields (logo area zeroed,
    # exactly like the homebrew control file's family of headers).
    b[0:4] = bytes([0xEA, 0x00, 0x00, 0x2E])
    title = b"PORTPLAY FIX"
    b[0xA0:0xA0 + len(title)] = title
    b[0xAC:0xB0] = b"PPFX"          # game code
    b[0xB0:0xB2] = b"01"            # maker code
    b[0xB2] = 0x96                  # fixed value
    return bytes(b)


def gb():
    b = bytearray(pattern(32 * 1024, 5))
    b[0x100:0x104] = bytes([0x00, 0xC3, 0x50, 0x01])   # nop; jp 0x0150
    title = b"PORTPLAY FIXTURE"
    b[0x134:0x134 + min(len(title), 15)] = title[:15]
    b[0x143] = 0x00                  # DMG only
    b[0x147] = 0x00                  # ROM only
    b[0x148] = 0x00                  # 32 KB
    b[0x149] = 0x00                  # no RAM
    chk = 0
    for i in range(0x134, 0x14D):
        chk = (chk - b[i] - 1) & 0xFF
    b[0x14D] = chk                   # header checksum, per spec
    return bytes(b)


def nes():
    hdr = bytes([0x4E, 0x45, 0x53, 0x1A, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    return hdr + bytes(pattern(2 * 16384 + 8192, 7))


def snes():
    b = bytearray(pattern(32 * 1024, 11))
    title = b"PORTPLAY FIXTURE     "
    b[0x7FC0:0x7FC0 + 21] = title[:21]
    b[0x7FD5] = 0x20                 # LoROM, slow
    b[0x7FD6] = 0x00                 # ROM only
    b[0x7FD7] = 0x05                 # 32 KB
    b[0x7FDC:0x7FE0] = b"\x00\x00\x00\x00"
    cks = sum(b) & 0xFFFF
    comp = cks ^ 0xFFFF
    b[0x7FDC] = comp & 0xFF
    b[0x7FDD] = comp >> 8
    b[0x7FDE] = cks & 0xFF
    b[0x7FDF] = cks >> 8
    return bytes(b)


def genesis():
    b = bytearray(pattern(128 * 1024, 13))
    b[0x100:0x110] = b"SEGA MEGA DRIVE "
    b[0x110:0x120] = b"(C)PORTPLAY 2026"
    return bytes(b)


FIXTURES = {
    "fixture-gba.gba": gba,
    "fixture-gb.gb": gb,
    "fixture-nes.nes": nes,
    "fixture-snes.sfc": snes,
    "fixture-genesis.md": genesis,
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in FIXTURES.items():
        data = fn()
        (OUT / name).write_bytes(data)
        print("wrote %s (%d bytes)" % (name, len(data)))


if __name__ == "__main__":
    main()
