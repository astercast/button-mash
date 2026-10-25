#!/usr/bin/env python3
"""Vendor the pinned EmulatorJS engine into assets/emulatorjs/ (run by hand, then commit).

    python3 scripts/vendor_engine.py            # fetch what is missing, verify every file
    python3 scripts/vendor_engine.py --write    # also (re)write assets/emulatorjs/MANIFEST.sha256

Why by hand and not in the Vercel build: the deploy must not depend on a third party
being up at that minute. The files are fetched once, hashed, and committed. Every later
run only VERIFIES them against MANIFEST.sha256 and fails on any difference.
scripts/build.py runs the same manifest verification on every build.

Layout note (this repo's round-3 vendoring, kept in the 2026-10-24 bundle
reconcile): the payload lives at assets/emulatorjs/data/ (mirroring the
upstream data/ folder) with MANIFEST.sha256, LICENSE, NOTICE.txt and
VENDORED.md beside it in assets/emulatorjs/ — not at the engine/<ver>/
path the design consult's draft used — because the site build publishes
assets/ and the pages already serve the engine from that path.

Source of truth: https://cdn.emulatorjs.org/<ver>/data/  (byte-identical to the npm
packages @emulatorjs/emulatorjs and @emulatorjs/core-<name> at the same version, checked
for loader.js, extract7z.js, snes9x and mgba on 2026-10-24; emulator.min.js/.css exist
only on the CDN and release zip, not on npm).
"""
import hashlib, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

VERSION = "4.2.3"
BASE = "https://cdn.emulatorjs.org/%s/data/" % VERSION
ENG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "emulatorjs")
ROOT = os.path.join(ENG, "data")

# File core per system the Player and Stage can route (same table as CORE_FILES in converter4-core.js),
# plus fbneo (the Player's manual Arcade pick; it was missing from the first vendoring).
CORES = ["fceumm", "snes9x", "gambatte", "mgba", "genesis_plus_gx", "smsplus", "picodrive",
         "pcsx_rearmed", "mupen64plus_next", "melonds", "mednafen_pce", "beetle_vb",
         "stella2014", "prosystem", "handy", "mednafen_ngp", "mednafen_wswan", "gearcoleco",
         "a5200", "virtualjaguar", "vice_x64sc", "puae", "opera", "fbneo"]
# The engine picks <core>-wasm.data only when the core's report says defaultWebGL2:true,
# otherwise <core>-legacy-wasm.data (emulator.js: `legacy = supportsWebgl2 && webgl2Enabled ? "" : "-legacy"`,
# with webgl2Enabled defaulting to the report flag). Read from cores/reports/<core>.json on 2026-10-24:
# only these three default to WebGL2.
WEBGL2_DEFAULT = {"melonds", "mupen64plus_next", "pcsx_rearmed"}
LOCALES = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "locales.txt")).read().split() if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "locales.txt")) else ["en-US.json"]

FILES = ["loader.js", "emulator.min.js", "emulator.min.css", "version.json",
         "compression/extract7z.js", "compression/extractzip.js",
         "compression/libunrar.js", "compression/libunrar.wasm"]
FILES += ["localization/" + n for n in LOCALES]
for c in CORES:
    FILES.append("cores/reports/%s.json" % c)
    FILES.append("cores/%s-%s.data" % (c, "wasm" if c in WEBGL2_DEFAULT else "legacy-wasm"))
# PSP is the one threaded exception: upstream ships no non-threaded PPSSPP build at
# 4.2.3, the core requires threads, and the site boots it only threaded.
FILES += ["cores/reports/ppsspp.json", "cores/ppsspp-thread-wasm.data", "cores/ppsspp-assets.zip"]

def sha(b): return hashlib.sha256(b).hexdigest()

def fetch(rel):
    dst = os.path.join(ROOT, rel)
    if os.path.exists(dst):
        return rel, open(dst, "rb").read()
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    # Cloudflare in front of the CDN refuses Python's default user agent (HTTP 403).
    req = urllib.request.Request(BASE + rel, headers={"User-Agent": "portplay-vendor/1.0 (+https://button-mash-live.vercel.app)"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    open(dst, "wb").write(data)
    return rel, data

def main():
    write = "--write" in sys.argv
    with ThreadPoolExecutor(8) as ex:
        got = dict(ex.map(fetch, FILES))
    lines = ["%s  %s" % (sha(got[f]), "data/" + f) for f in sorted(got)]
    man = os.path.join(ENG, "MANIFEST.sha256")
    if write or not os.path.exists(man):
        open(man, "w").write("\n".join(lines) + "\n"); print("manifest written,", len(lines), "files"); return
    want = dict(l.split("  ", 1)[::-1] for l in open(man).read().split("\n") if l)
    bad = [f for f in got if want.get("data/" + f) != sha(got[f])] + [f for f in want if f != "data/" + f and f[5:] not in got]
    if bad: sys.exit("ENGINE VERIFY FAIL: " + ", ".join(sorted(set(bad))))
    print("engine ok:", len(got), "files, %.1f MB" % (sum(len(v) for v in got.values()) / 1e6))

if __name__ == "__main__":
    main()
