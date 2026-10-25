#!/usr/bin/env python3
"""PortPlay build + validation.

The site is five pages: index.html (the Stage), player.html (the Console),
dos.html (the DOS room), guide.html, 404.html. This script:

  1. Verifies the required files exist.
  2. Generates data/v1/coverage.json by PARSING the converter engines
     (converter-core.js PROFILES, converter4-core.js PLAY_EXTS + DECLINES),
     so the coverage rendered on the Stage is exactly the coverage the code
     routes — never a second, hand-written list that can drift.
  3. Verifies every decline's guide anchor exists in guide.html.
  4. Scans the served files for external links and fails on any host outside
     the allowlist (no invented domains, no game-download links, ever).
  5. Regenerates sitemap.xml and llms.txt.

Deterministic: same inputs, same outputs (timestamp-free).
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGES = ["index.html", "player.html", "dos.html", "guide.html", "404.html"]
REQUIRED = PAGES + [
    "assets/js/config.js",
    "assets/js/stage.js",
    "assets/js/converter-core.js",
    "assets/js/converter4-core.js",
    "assets/js/converter4-ui.js",
    "assets/js/player.js",
    "assets/js/library.js",
    "assets/js/slip.js",
    "assets/js/probe.js",
    "assets/js/pad.js",
    "assets/js/touchpad.js",
    "assets/js/dos.js",
    "sw.js",
    "assets/vendor/pako.min.js",
    "assets/vendor/template-game.html",
    "assets/emulatorjs/data/loader.js",
    "assets/emulatorjs/data/emulator.min.js",
    "assets/emulatorjs/data/emulator.min.css",
    "assets/emulatorjs/data/version.json",
    "assets/emulatorjs/MANIFEST.sha256",
    "assets/emulatorjs/LICENSE",
    "assets/emulatorjs/NOTICE.txt",
    "assets/css/tokens.css",
    "assets/css/base.css",
    "assets/css/appliance.css",
    "assets/css/header.css",
    "assets/css/console.css",
    "assets/css/guide.css",
    "favicon.svg",
    "robots.txt",
]
ALLOWED_HOSTS = {
    "button-mash-live.vercel.app",   # canonical
    "cdn.emulatorjs.org",             # portable Light files still load the pinned engine from there; engine attribution
    "v8.js-dos.com",                  # DOS engine (referenced in JS)
    "emulatorjs.org",                 # engine attribution
    "pcsx2.net", "dolphin-emu.org", "www.ppsspp.org",  # guide: native paths
    "schema.org",                     # JSON-LD @context identifier, not a link
}
# DECLINES tone map — the build FAILS if a decline key is unclassified here,
# so a new "no" can never ship without an honest tone.
DECLINE_TONES = {
    "ps2": "guide-only", "gamecube": "guide-only", "wii": "guide-only",
    "ps3": "guide-only", "xbox": "guide-only", "xbox360": "guide-only",
    "switch": "guide-only", "n3ds": "guide-only", "wiiu": "guide-only",
    "vita": "guide-only",
    "psp": "not-yet", "saturn": "not-yet", "dreamcast": "not-yet",
}
DECLINE_TONE_LABELS = {"guide-only": "Guide only", "not-yet": "On the bench"}
DECLINE_NAMES = {
    "ps2": "PlayStation 2", "gamecube": "GameCube", "wii": "Wii",
    "ps3": "PlayStation 3", "xbox": "Xbox (original)",
    "xbox360": "Xbox 360", "switch": "Nintendo Switch",
    "n3ds": "Nintendo 3DS", "wiiu": "Wii U", "vita": "PlayStation Vita",
    "psp": "PSP", "saturn": "Sega Saturn", "dreamcast": "Dreamcast",
}


def fail(msg):
    print("BUILD FAIL: " + msg)
    sys.exit(1)


def parse_profiles(src):
    """converter-core.js PROFILES (object keyed by id) ->
    [{system, core, formats[], max_mb}]."""
    m = re.search(r"var PROFILES = \{(.*?)\n  \};", src, re.S)
    if not m:
        fail("converter-core.js: PROFILES block not found")
    block = m.group(1)
    out = []
    for obj in re.finditer(r"\n    (\w+):\s*\{(.*?)\n    \}", block, re.S):
        body = obj.group(2)
        def field(name):
            fm = re.search(name + r":\s*'([^']*)'", body)
            return fm.group(1) if fm else None
        ext = re.search(r"ext:\s*/\\\.\(?([a-z0-9|]+)\)?\$/", body)
        maxm = re.search(r"max:\s*(\d+)\s*\*\s*(MB|KB)", body)
        formats = ["." + e for e in ext.group(1).split("|")] if ext else []
        out.append({
            "system": field("system"),
            "core": field("core"),
            "formats": formats,
            "max_mb": (int(maxm.group(1)) if maxm.group(2) == "MB" else int(maxm.group(1)) / 1024) if maxm else None,
        })
    if len(out) < 4:
        fail("converter-core.js: suspiciously few profiles parsed (%d)" % len(out))
    return out


def parse_play_exts(c4_src, player_src):
    """PLAY_EXTS maps extension -> core id; the human labels live in
    player.js CORE_MAP. Group formats by core label."""
    m = re.search(r"var PLAY_EXTS = \{(.*?)\n  \};", c4_src, re.S)
    if not m:
        fail("converter4-core.js: PLAY_EXTS block not found")
    labels = {}
    cm = re.search(r"var SYSTEM_LABELS = \{(.*?)\n  \};", player_src, re.S)
    if cm:
        for core, label in re.findall(r"(\w+):\s*'([^']+)'", cm.group(1)):
            labels[core] = label
    if not labels:
        fail("player.js: SYSTEM_LABELS block not parsed; coverage labels would be raw core ids")
    groups = {}
    for ext, core in re.findall(r"'?([a-z0-9]+)'?:\s*'([a-zA-Z0-9]+)'", m.group(1)):
        label = labels.get(core, core)
        groups.setdefault(label, []).append("." + ext)
    out = [{"label": k, "formats": sorted(v)} for k, v in sorted(groups.items())]
    # Disc images are routed by content sniffing (detectDisc), not extension.
    out.append({"label": "PlayStation (disc image)",
                "formats": [".iso", ".chd", ".cue + .bin"]})
    out.append({"label": "Sega CD (disc image)",
                "formats": [".iso", ".chd", ".cue + .bin"]})
    out.sort(key=lambda r: r["label"])
    return out


def parse_declines(src):
    m = re.search(r"var DECLINES = \{(.*?)\n  \};", src, re.S)
    if not m:
        fail("converter4-core.js: DECLINES block not found")
    block = "\n" + m.group(1)
    keys = re.findall(r"\n    ([a-z0-9]+):\s*\{", block)
    for key in keys:
        if key not in DECLINE_TONES:
            fail("converter4-core.js: DECLINES key %r has no tone in build.py" % key)
    out = []
    for obj in re.finditer(r"\n    ([a-z0-9]+):\s*\{(.*?)\n    \}", block, re.S):
        key, body = obj.group(1), obj.group(2)
        hm = re.search(r"headline:\s*'([^']*)'", body)
        gm = re.search(r"guide:\s*'([^']*)'", body)
        tm = re.search(r"tone:\s*'([^']*)'", body)
        if tm and tm.group(1) != DECLINE_TONES[key]:
            fail("decline %s: core tone %r disagrees with build.py map %r"
                 % (key, tm.group(1), DECLINE_TONES[key]))
        out.append({
            "key": key,
            "headline": hm.group(1) if hm else key,
            "tone": DECLINE_TONES[key],
            "guide": gm.group(1) if gm else "guide.html",
        })
    if len(out) != len(DECLINE_TONES):
        fail("declines parsed %d, tone map has %d" % (len(out), len(DECLINE_TONES)))
    return out


def main():
    for rel in REQUIRED:
        if not (ROOT / rel).exists():
            fail("missing required file: " + rel)

    core_src = (ROOT / "assets/js/converter-core.js").read_text(encoding="utf-8")
    c4_src = (ROOT / "assets/js/converter4-core.js").read_text(encoding="utf-8")
    guide_src = (ROOT / "guide.html").read_text(encoding="utf-8")

    player_src = (ROOT / "assets/js/player.js").read_text(encoding="utf-8")
    convert = parse_profiles(core_src)
    play = parse_play_exts(c4_src, player_src)
    declines = parse_declines(c4_src)

    # Every decline's guide anchor must exist in guide.html.
    guide_ids = set(re.findall(r'id="([^"]+)"', guide_src))
    for d in declines:
        anchor = d["guide"].split("#", 1)[1] if "#" in d["guide"] else None
        if anchor and anchor not in guide_ids:
            fail("decline %s points at guide anchor #%s, not in guide.html" % (d["key"], anchor))
    if "dump" not in guide_ids:
        fail("guide.html is missing the #dump anchor")

    coverage = {
        "version": "v1",
        "generated_by": "scripts/build.py from the converter engines",
        "convert": [
            {"name": c["system"], "note": " ".join(c["formats"]),
             "core": c["core"], "formats": c["formats"], "max_mb": c["max_mb"]}
            for c in convert
        ],
        "play": [
            {"name": p["label"], "note": " ".join(p["formats"]),
             "formats": p["formats"]}
            for p in play
        ],
        "guide": [
            {"name": DECLINE_NAMES[d["key"]],
             "note": DECLINE_TONE_LABELS[d["tone"]],
             "tone": d["tone"], "guide": d["guide"]}
            for d in declines
        ],
        "dos": {"name": "DOS (PC)", "note": ".zip, .jsdos, or the game's folder",
                "formats": [".zip", ".jsdos", "folder"]},
    }
    out_dir = ROOT / "data" / "v1"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "coverage.json").write_text(
        json.dumps(coverage, indent=2, sort_keys=False) + "\n", encoding="utf-8")

    # PP5 pin guard, player-fix form (2026-10-24): the engine version
    # lives in config.js alone, and the engine data path it carries
    # is the LOCAL vendored payload (assets/emulatorjs/data/), never
    # a CDN URL — the CDN path was the live "network error" at play
    # time. The vendored payload's own version.json must agree with
    # config.js, and every consumer (stage, player, portable
    # template) must agree with the pin. The mutable stable channel
    # fails the build anywhere; the one surviving CDN reference is
    # the portable template's Light edition, which carries no engine
    # and must pin the same versioned path.
    config_src = (ROOT / "assets/js/config.js").read_text(encoding="utf-8")
    mver = re.search(r'engineVersion:\s*"([^"]+)"', config_src)
    mcdn = re.search(r'engineCdn:\s*"([^"]+)"', config_src)
    if not mver or not mcdn:
        fail("config.js must carry engineVersion + engineCdn (PP5)")
    local_data = "assets/emulatorjs/data/"
    if mcdn.group(1) != local_data:
        fail("config.js engineCdn %r is not the vendored local path %r (player fix: no CDN at play time)"
             % (mcdn.group(1), local_data))
    vendored = json.loads((ROOT / "assets/emulatorjs/data/version.json").read_text(encoding="utf-8"))
    if vendored.get("version") != mver.group(1):
        fail("vendored engine version.json %r disagrees with config.js engineVersion %r"
             % (vendored.get("version"), mver.group(1)))
    # Engine pin guard (bundle reconcile, 2026-10-24; the consult's
    # build guard, adapted to this repo's vendored layout): every file
    # listed in assets/emulatorjs/MANIFEST.sha256 must exist and hash
    # to its pinned value, and no unlisted payload file may ride along
    # (scripts/vendor_engine.py regenerates the manifest deliberately).
    import hashlib
    eng_dir = ROOT / "assets/emulatorjs"
    man_path = eng_dir / "MANIFEST.sha256"
    if not man_path.exists():
        fail("assets/emulatorjs/MANIFEST.sha256 missing; run scripts/vendor_engine.py --write")
    pinned = {}
    for line in man_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        digest, rel = line.split("  ", 1)
        pinned[rel] = digest
        fp = eng_dir / rel
        if not fp.exists() or hashlib.sha256(fp.read_bytes()).hexdigest() != digest:
            fail("engine file %s is missing or differs from MANIFEST.sha256" % rel)
    for fp in sorted((eng_dir / "data").rglob("*")):
        if fp.is_file():
            rel = fp.relative_to(eng_dir).as_posix()
            if rel not in pinned:
                fail("engine payload file %s is not in MANIFEST.sha256; re-run scripts/vendor_engine.py --write" % rel)
    # Every file core the site routes to must be vendored with the one
    # build its core report selects, or play for that system falls
    # back off-site again. The routed set is parsed, not hand-listed:
    # converter-core PROFILES + converter4-core PLAY_EXTS name the
    # cartridge systems; the disc and beta routes in converter4-core
    # (detect() / THREADS_CORES) add psx, segaCD, 3do and psp, and
    # player.js's manual SYSTEM_LABELS pick adds arcade. CORE_FILES
    # also names engine-family systems this site declines or never
    # offers (mame, dos, saturn, ...) — those are NOT required and are
    # deliberately not vendored.
    c4_for_cores = (ROOT / "assets/js/converter4-core.js").read_text(encoding="utf-8")
    core_files_map = { (k1 or k2): v for k1, k2, v in re.findall(
        r"(?:'([^']+)'|(\w+)):\s*'([a-z0-9_]+)'", re.search(
            r"var CORE_FILES = \{(.*?)\n  \};", c4_for_cores, re.S).group(1)) }
    play_block = re.search(r"var PLAY_EXTS = \{(.*?)\n  \};", c4_for_cores, re.S).group(1)
    routed_systems = set(re.findall(r"core:\s*'([A-Za-z0-9]+)'", core_src))
    routed_systems |= set(re.findall(r":\s*'([A-Za-z0-9]+)'", play_block))
    routed_systems |= {"psx", "segaCD", "3do", "psp", "arcade"}
    alias = {"segaSG": "segaMS"}
    needed = set()
    for sysname in routed_systems:
        host = alias.get(sysname, sysname)
        needed.add(core_files_map.get(host, host))
    missing_vendor = []
    for fc in sorted(needed):
        # ppsspp is the one exception, proven against the pinned
        # payload itself: upstream ships NO non-threaded ppsspp
        # build (ppsspp-wasm.data and ppsspp-legacy-wasm.data are
        # 404 on the 4.2.3 CDN), the core requires threads, and the
        # site only ever boots it threaded — so its vendored set is
        # the thread build plus the assets archive it unpacks.
        if fc == "ppsspp":
            for rel in ("cores/ppsspp-thread-wasm.data", "cores/ppsspp-assets.zip",
                        "cores/reports/ppsspp.json"):
                if not (ROOT / "assets/emulatorjs/data" / rel).exists():
                    missing_vendor.append(rel)
            continue
        # One build per core (bundle reconcile): the engine requests
        # <fc>-wasm.data only when the core's report says
        # defaultWebGL2, otherwise <fc>-legacy-wasm.data — that one
        # build, plus the report, must be vendored.
        report_path = ROOT / "assets/emulatorjs/data/cores/reports" / (fc + ".json")
        if not report_path.exists():
            missing_vendor.append("reports/" + fc + ".json")
            continue
        report = json.loads(report_path.read_text(encoding="utf-8"))
        variant = "-wasm.data" if (report.get("options") or {}).get("defaultWebGL2") else "-legacy-wasm.data"
        if not (ROOT / "assets/emulatorjs/data/cores" / (fc + variant)).exists():
            missing_vendor.append(fc + variant)
    if missing_vendor:
        fail("vendored engine is missing routed core file(s): " + ", ".join(missing_vendor))
    for rel in ["assets/js/stage.js", "assets/js/player.js",
                "assets/vendor/template-game.html"]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "cdn.emulatorjs.org/stable/data/" in text:
            fail("%s still loads the mutable stable engine channel (PP5)" % rel)
        for other in re.findall(r"cdn\.emulatorjs\.org/([0-9][0-9.]*)/data/", text):
            if other != mver.group(1):
                fail("%s pins engine %s, config.js pins %s" % (rel, other, mver.group(1)))
    for rel in ["assets/js/stage.js", "assets/js/player.js"]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "cdn.emulatorjs.org" in text:
            fail("%s still references the EmulatorJS CDN; play must load the vendored engine (player fix)" % rel)
    # Evening consult guard (2026-10-24), adapted to this repo's
    # layout: the frame and the touch pad join the zero-CDN rule —
    # at play time NOTHING on the site may reference the engine CDN.
    # The one deliberate survivor is the portable template's Light
    # edition (assets/vendor/template-game.html), which carries no
    # engine and pins the same versioned CDN path as a fallback
    # behind the site's own vendored copy; the version checks above
    # keep that pin honest. "Any CDN string anywhere fails" would
    # kill that tested fallback, so the guard is scoped to the play
    # surfaces instead — stronger where play actually happens.
    for rel in ["play-frame.html", "assets/js/touchpad.js"]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "cdn.emulatorjs.org" in text:
            fail("%s references the EmulatorJS CDN; play surfaces load the vendored engine only (evening consult guard)" % rel)

    # External-link allowlist across everything served.
    served = PAGES + [
        "assets/js/config.js", "assets/js/stage.js", "assets/js/converter-core.js",
        "assets/js/converter4-core.js", "assets/js/converter4-ui.js",
        "assets/js/player.js", "assets/js/library.js", "assets/js/dos.js",
        "assets/js/slip.js", "assets/js/probe.js", "assets/js/pad.js",
        "assets/js/touchpad.js", "sw.js",
        "assets/vendor/template-game.html", "play-frame.html",
    ]
    bad = []
    for rel in served:
        text = (ROOT / rel).read_text(encoding="utf-8")
        for host in re.findall(r"https?://([a-zA-Z0-9.-]+)", text):
            if host not in ALLOWED_HOSTS:
                bad.append("%s -> %s" % (rel, host))
    if bad:
        fail("external host(s) outside the allowlist: " + "; ".join(sorted(set(bad))))

    # Internal links in the five pages resolve to real files.
    missing = []
    for rel in PAGES:
        text = (ROOT / rel).read_text(encoding="utf-8")
        for href in re.findall(r'(?:href|src)="([^"#]+)"', text):
            if href.startswith(("http", "mailto:", "data:")) or href.startswith("#"):
                continue
            target = (ROOT / href.split("?")[0])
            if not target.exists():
                missing.append("%s -> %s" % (rel, href))
    if missing:
        fail("broken internal link(s): " + "; ".join(sorted(set(missing))))

    base = "https://button-mash-live.vercel.app"
    urls = ["", "index.html", "player.html", "dos.html", "guide.html"]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sitemap.append("  <url><loc>%s/%s</loc></url>" % (base, u))
    sitemap.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")

    llms = """# PortPlay

PortPlay is a client-side game converter and player. A visitor drops a game
file they own; PortPlay identifies it by its contents, plays it in the
browser via EmulatorJS cores, and (for cartridge systems) builds a portable
single-file HTML copy they keep. DOS games are wrapped into .jsdos bundles
in the DOS room. Systems no browser can run get a plain explanation and a
working native path in the guide. PortPlay hosts no games, sells no games,
and links to no game downloads. Files never leave the visitor's device.

Pages: index.html (converter), player.html (full player console),
dos.html (DOS room), guide.html (the systems a browser cannot convert, and
how to dump your own games). Coverage data: data/v1/coverage.json.
"""
    (ROOT / "llms.txt").write_text(llms, encoding="utf-8")

    # PP7: frame isolation is load-bearing; fail the build if it rots.
    frame = ROOT / "play-frame.html"
    if not frame.exists() or "portplay-boot" not in frame.read_text(encoding="utf-8"):
        fail("play-frame.html missing or no longer speaks the boot protocol (PP7)")
    if "play-frame.html" not in (ROOT / "assets/js/stage.js").read_text(encoding="utf-8"):
        fail("stage.js no longer boots through play-frame.html (PP7)")
    # Evening consult (2026-10-24): the full player boots through the
    # same frame — the in-page engine and its blob-URL teardown were
    # the "network error" class — and the frame carries the wake-lock
    # swallow and the touch pad mount. Fail the build if any of it
    # rots back.
    player_js = (ROOT / "assets/js/player.js").read_text(encoding="utf-8")
    if "play-frame.html" not in player_js:
        fail("player.js no longer boots through play-frame.html (evening consult: full player in the frame)")
    if "EJS_pathtodata" in player_js or "data-ejs" in player_js:
        fail("player.js configures the engine in-page again; the frame owns the engine (evening consult)")
    frame_src = frame.read_text(encoding="utf-8")
    if "NotAllowedError" not in frame_src:
        fail("play-frame.html lost the wake-lock NotAllowedError swallow (evening consult)")
    if "PortplayPad" not in frame_src or "touchpad.js" not in frame_src:
        fail("play-frame.html lost the touch pad mount (evening consult)")

    # Round 2: publish only the site, never the whole repo. vercel.json
    # sets outputDirectory to site/; assemble it here from an explicit
    # allowlist (the pages, assets/, data/, api/, favicons, robots,
    # sitemap, llms.txt) so WAVELOG.md, llms-full.txt, skills/,
    # scripts/ and the test ROMs can never reach the public site.
    site_dir = ROOT / "site"
    if site_dir.exists():
        shutil.rmtree(site_dir)
    site_dir.mkdir(parents=True)
    for rel in PAGES + ["play-frame.html", "sw.js", "favicon.ico", "favicon.svg",
                        "robots.txt", "sitemap.xml", "llms.txt"]:
        shutil.copy2(ROOT / rel, site_dir / rel)
    for rel in ["assets", "data", "api"]:
        shutil.copytree(ROOT / rel, site_dir / rel)
    for banned in ["WAVELOG.md", "llms-full.txt", "skills", "scripts", "tests"]:
        if (site_dir / banned).exists():
            fail("site/ assembly leaked " + banned)

    print("BUILD OK — PortPlay: 5 pages, %d convert profiles, %d play groups, %d guide declines"
          % (len(convert), len(play), len(declines)))


if __name__ == "__main__":
    main()
