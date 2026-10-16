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


def _z80_stub():
    """Minimal SMS/GG program: interrupts off, stack set, VDP mode 4
    selected (reg0 bit2), display on (reg1 bit6), backdrop pointed at
    CRAM slot 16 (reg7 = 0), and every CRAM slot painted yellow so the
    whole screen, active area and backdrop alike, shows the colour.
    Then loop forever."""
    stub = [
        0xF3,                    # DI
        0x31, 0xF0, 0xDF,        # LD SP,0xDFF0
        0xED, 0x56,              # IM 1
        0x3E, 0x04, 0xD3, 0xBF,  # reg0 = 0x04 (mode 4 select)
        0x3E, 0x80, 0xD3, 0xBF,
        0x3E, 0x40, 0xD3, 0xBF,  # reg1 = 0x40 (display on)
        0x3E, 0x81, 0xD3, 0xBF,
        0x3E, 0x00, 0xD3, 0xBF,  # reg7 = 0x00 (backdrop = CRAM 16)
        0x3E, 0x87, 0xD3, 0xBF,
        0x3E, 0x00, 0xD3, 0xBF,  # CRAM write from address 0
        0x3E, 0xC0, 0xD3, 0xBF,
    ]
    stub += [0x3E, 0x0F, 0xD3, 0xBE] * 17   # CRAM 0..16 = yellow
    stub += [0x18, 0xFE]                    # JR -2 (loop)
    return bytes(stub)


def _sega8(region_size_byte):
    b = bytearray(pattern(32 * 1024, 17))
    b[0:len(_z80_stub())] = _z80_stub()
    b[0x7FF0:0x7FF8] = b"TMR SEGA"
    cks = sum(b[0:0x7FF0]) & 0xFFFF   # 32K checksum range ends at 0x7FEF
    b[0x7FFA] = cks & 0xFF
    b[0x7FFB] = cks >> 8
    b[0x7FFF] = region_size_byte      # 0x4C = SMS 32K, 0x6C = GG intl 32K
    return bytes(b)


def sms():
    return _sega8(0x4C)


def gg():
    return _sega8(0x6C)


def pce():
    size = 256 * 1024
    b = bytearray(pattern(size, 19))
    bank = 0x2000
    stub = bytes([0x78, 0x4C, 0x00, 0xE0])   # SEI; JMP $E000 (self)
    for off in range(0, size, bank):
        b[off:off + len(stub)] = stub
        # vector table at the end of every 8K bank: IRQ2/IRQ1/TIMER/NMI
        # point into the bank, RESET enters at the bank start ($E000).
        for i, vec in enumerate([0xE010, 0xE010, 0xE010, 0xE010, 0xE000]):
            b[off + 0x1FF6 + i * 2] = vec & 0xFF
            b[off + 0x1FF6 + i * 2 + 1] = vec >> 8
    return bytes(b)


def a26():
    b = bytearray(pattern(4 * 1024, 23))
    stub = bytes([
        0x78,                    # SEI
        0xD8,                    # CLD
        0xA2, 0xFF, 0x9A,        # LDX #$FF; TXS
        0xA9, 0x1E,              # LDA #$1E (yellow)
        0x85, 0x09,              # STA COLUBK
        0x4C, 0x05, 0xF0,        # JMP $F005
    ])
    b[0:len(stub)] = stub
    for vec in (0xFFA, 0xFFC, 0xFFE):
        b[vec] = 0x00
        b[vec + 1] = 0xF0
    return bytes(b)


def a78():
    rom = bytearray(pattern(32 * 1024, 29))
    stub = bytes([
        0x78, 0xD8, 0xA2, 0xFF, 0x9A,
        0xA9, 0x84,              # LDA #$84
        0x8D, 0x20, 0x00,        # STA $0020 (MARIA background colour)
        0x4C, 0x05, 0x80,        # JMP $8005
    ])
    rom[0:len(stub)] = stub
    for vec in (0x7FFA, 0x7FFC, 0x7FFE):
        rom[vec] = 0x00
        rom[vec + 1] = 0x80
    hdr = bytearray(128)
    hdr[0] = 1                                   # header version 1
    hdr[1:17] = b"ATARI7800       "[:16]
    title = b"PORTPLAY FIXTURE"
    hdr[17:17 + len(title)] = title
    hdr[49:53] = (32 * 1024).to_bytes(4, "big")   # ROM size
    hdr[55] = 1                                  # controller 1: joystick
    note = b"ACTUAL CART DATA STARTS HERE"
    hdr[64:64 + len(note)] = note
    return bytes(hdr) + bytes(rom)


def _ws(color_flag, seed):
    size = 1024 * 1024
    b = bytearray(pattern(size, seed))
    stub = bytes([0xFA, 0xEB, 0xFE])       # CLI; JMP $ (V30MZ)
    b[size - 0x10000:size - 0x10000 + len(stub)] = stub   # last 64K bank
    b[0:len(stub)] = stub
    jmp = bytes([0xEA, 0x00, 0x00, 0x00, 0xF0])  # JMP FAR F000:0000
    b[size - 16:size - 16 + len(jmp)] = jmp       # reset fetch point
    foot = size - 10
    b[foot + 0] = 0x00                     # maker
    b[foot + 1] = color_flag               # 0 = WS, 1 = WSC-capable
    b[foot + 2] = 0x01                     # game id
    b[foot + 3] = 0x00                     # version
    b[foot + 4] = 0x03                     # ROM size code (8 Mbit)
    b[foot + 5] = 0x00                     # no save RAM
    b[foot + 6] = 0x00                     # flags
    b[foot + 7] = 0x00                     # no RTC
    cks = sum(b[:size - 2]) & 0xFFFF
    b[size - 2] = cks & 0xFF
    b[size - 1] = cks >> 8
    return bytes(b)


def ws():
    return _ws(0x00, 31)


def wsc():
    return _ws(0x01, 33)


def vb():
    size = 1024 * 1024
    b = bytearray(pattern(size, 37))
    # JR to self at the reset target (offset 0), V810 encoding attempt:
    # JR disp26 = -4 -> halfwords 0xA3FF, 0xFFFC (little-endian bytes).
    b[0:4] = bytes([0xFF, 0xA3, 0xFC, 0xFF])
    entry = (0x07000000).to_bytes(4, "little")
    for slot in (0x10, 0x20, 0x30, 0x40, 0x50):
        b[size - slot:size - slot + 4] = entry   # incl. reset vector @ -0x10
    return bytes(b)


def ngp():
    size = 512 * 1024
    b = bytearray(pattern(size, 41))
    b[0:16] = b"COPYRIGHT BY SNK"
    entry = (0x200000 + 0x200).to_bytes(4, "little")
    b[0x1C:0x20] = entry                   # program start address
    return bytes(b)


def s32x():
    size = 1024 * 1024
    b = bytearray(pattern(size, 43))
    b[0:4] = (0x02000240).to_bytes(4, "big")     # SH2 master reset PC
    b[4:8] = (0x02000240).to_bytes(4, "big")     # SH2 slave reset PC
    b[8:12] = (0x06000400).to_bytes(4, "big")    # stack pointer
    b[0x100:0x110] = b"SEGA 32X        "[:16]
    b[0x200:0x202] = bytes([0x60, 0xFE])         # 68K: BRA self
    b[0x240:0x242] = bytes([0xAF, 0xFE])         # SH2: BRA self
    return bytes(b)


def c64():
    prog = bytearray()
    prog += (0x0801).to_bytes(2, "little")       # load address
    prog += bytes([0x0B, 0x08, 0x0A, 0x00, 0x9E]) + b" 2064" + bytes([0x00])
    prog += bytes([0x00, 0x00])                  # end of BASIC
    prog += bytes([0x00, 0x00])                  # pad to $0810
    prog += bytes([
        0xA9, 0x0E,              # LDA #$0E (light blue)
        0x8D, 0x20, 0xD0,        # STA $D020 border
        0x8D, 0x21, 0xD0,        # STA $D021 background
        0x4C, 0x10, 0x08,        # JMP $0810
    ])
    return bytes(prog)


def a52():
    b = bytearray(pattern(32 * 1024, 47))
    stub = bytes([
        0x78, 0xD8, 0xA2, 0xFF, 0x9A,
        0xA9, 0x84,              # LDA #$84
        0x8D, 0x1A, 0xC0,        # STA $C01A (GTIA background)
        0x4C, 0x05, 0x40,        # JMP $4005
    ])
    b[0:len(stub)] = stub
    for vec in (0x7FFA, 0x7FFC, 0x7FFE):
        b[vec] = 0x00
        b[vec + 1] = 0x40
    return bytes(b)


def lnx():
    """Handy header + filler. Exists to prove the BIOS gate empirically:
    Handy cannot boot any .lnx without lynxboot.img (docs: Required)."""
    hdr = bytearray(64)
    hdr[0:4] = b"LYNX"
    hdr[4:6] = (1024).to_bytes(2, "little")      # bank0 page size
    hdr[6:8] = (0).to_bytes(2, "little")         # bank1 page size
    hdr[8:10] = (64).to_bytes(2, "little")       # bank0 blocks
    name = b"PORTPLAY FIXTURE"
    hdr[10:10 + len(name)] = name
    return bytes(hdr) + bytes(pattern(64 * 1024, 53))


def col():
    """ColecoVision ROM: 0xAA55 header magic + stub. Exists to prove the
    BIOS gate empirically (Gearcoleco: colecovision.rom Required)."""
    b = bytearray(pattern(32 * 1024, 59))
    b[0] = 0xAA
    b[1] = 0x55                                  # cartridge present magic
    stub = bytes([0xF3, 0x18, 0xFE])             # DI; JR -2 (Z80, at $802A area)
    b[0x2A:0x2A + len(stub)] = stub
    # entry pointer slot (start of code pointer lives at 0x800A in the
    # standard Coleco header); point it at the stub region offset.
    b[0x0A] = 0x2A
    b[0x0B] = 0x80
    return bytes(b)


def jaguar():
    """Atari Jaguar cartridge: raw image at a real cart size (256 KB
    stand-in; Jaguar carts ran 1 to 6 MB). No header format exists for
    .j64; the completeness claim proven here is the route."""
    return bytes(pattern(256 * 1024, 61))


def c64d64():
    """Commodore 64 disk image: a D64 is exactly 174,848 bytes (35
    tracks of 256-byte sectors in the standard layout). The size is
    the format fact this fixture proves."""
    return bytes(pattern(174848, 67))


def amigaadf():
    """Commodore Amiga floppy image: an ADF is exactly 901,120 bytes
    (80 cylinders, 2 heads, 11 sectors of 512 bytes; 880 KB)."""
    return bytes(pattern(901120, 71))


def sg1000():
    """SG-1000 cartridge: raw image at a real cart size (32 KB) with a
    real Z80 entry stub (TMS9918 VDP registers set, backdrop colour
    written, then loop). No header format exists for SG-1000 carts."""
    b = bytearray(pattern(32 * 1024, 73))
    stub = bytes([
        0xF3,                    # DI
        0x3E, 0x00, 0xD3, 0xBF,  # VDP reg0 = 0x00
        0x3E, 0x80, 0xD3, 0xBF,
        0x3E, 0xE0, 0xD3, 0xBF,  # VDP reg1 = 0xE0 (display on)
        0x3E, 0x81, 0xD3, 0xBF,
        0x3E, 0x0B, 0xD3, 0xBF,  # VDP reg7 = backdrop colour 0x0B
        0x3E, 0x87, 0xD3, 0xBF,
        0x18, 0xFE,              # JR -2 (loop)
    ])
    b[0:len(stub)] = stub
    return bytes(b)


def fds():
    """Famicom Disk System image, headered form: a 16-byte header
    starting with the FDS signature and a side count, then 65,500
    bytes per side."""
    hdr = bytearray(16)
    hdr[0:4] = b"FDS\x1a"
    hdr[4] = 1                       # one side
    return bytes(hdr) + bytes(pattern(65500, 79))


FIXTURES = {
    "fixture-gba.gba": gba,
    "fixture-gb.gb": gb,
    "fixture-nes.nes": nes,
    "fixture-snes.sfc": snes,
    "fixture-genesis.md": genesis,
    "fixture-sms.sms": sms,
    "fixture-gg.gg": gg,
    "fixture-pce.pce": pce,
    "fixture-atari2600.a26": a26,
    "fixture-atari7800.a78": a78,
    "fixture-ws.ws": ws,
    "fixture-wsc.wsc": wsc,
    "fixture-vb.vb": vb,
    "fixture-ngp.ngp": ngp,
    "fixture-32x.32x": s32x,
    "fixture-c64.prg": c64,
    "fixture-atari5200.a52": a52,
    "fixture-lynx.lnx": lnx,
    "fixture-coleco.col": col,
    "fixture-jaguar.j64": jaguar,
    "fixture-c64.d64": c64d64,
    "fixture-amiga.adf": amigaadf,
    "fixture-sg1000.sg": sg1000,
    "fixture-fds.fds": fds,
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in FIXTURES.items():
        data = fn()
        (OUT / name).write_bytes(data)
        print("wrote %s (%d bytes)" % (name, len(data)))


if __name__ == "__main__":
    main()
