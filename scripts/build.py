#!/usr/bin/env python3
"""Build Button Mash: validate data, regenerate api/v1 + llms.txt + sitemap.

Usage: python3 scripts/build.py
Prints BUILD OK with counts, or exits non-zero listing validation errors.

Steps:
  1. Validate data/*.json (structural checks + schema-shaped fields).
  2. Domain audit: every game URL must be https on a sane domain; every
     external link in guide HTML must be on the allowlist (game domains +
     verified reference domains). New game domains must be curl-verified
     (HTTP 200) before being added — see WAVELOG wave 2.
  3. Regenerate api/v1 (scripts/build_api.py) and llms.txt/llms-full.txt/sitemap.xml
     (scripts/build_site.py).
"""
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# Reference domains allowed in guide bodies / emulator records (verified live 2026-10-11
# or official project homes).
REFERENCE_DOMAINS = {
    "github.com", "emulatorjs.org", "cdn.emulatorjs.org", "demo.emulatorjs.org",
    "retroarch.com", "www.retroarch.com", "mgba.io", "sameboy.github.io", "mesen.ca", "duckstation.org",
    "pcsx2.net", "ppsspp.org", "www.ppsspp.org", "www.duckstation.org", "dolphin-emu.org",
    "pdroms.de", "nesdev.com", "gbdev.io", "gamebrew.org",
    "archive.org", "tuxemon.org", "lfkdsk.github.io",
    "epilogue.co", "retrode.com", "gog.com",
    "retroachievements.org", "opengameart.org",
    "n64.dev", "psx.dev", "psxdev.net",
}

GENRES = {"puzzle", "action", "roguelike", "idle", "multiplayer", "retro", "horror", "cozy"}
ID_RE = re.compile(r"^[a-z0-9-]+$")

errors = []


def fail(msg):
    errors.append(msg)


def check(cond, msg):
    if not cond:
        fail(msg)


def load(name):
    return json.loads((DATA / name).read_text())


def main():
    games_doc = load("games.json")
    games = games_doc["games"]
    collections = load("collections.json")["collections"]
    emulators = load("emulators.json")["emulators"]
    guides = load("guides.json")

    # --- games ---
    seen = set()
    game_domains = set()
    for g in games:
        where = f"games.json:{g.get('id')}"
        check(set(g.keys()) <= {"id", "title", "url", "genre", "controls", "description", "tags"},
              f"{where}: bad fields {sorted(g.keys())}")
        check(bool(ID_RE.match(g.get("id", "") or "")), f"{where}: bad id")
        check(g.get("id") not in seen, f"{where}: duplicate id")
        seen.add(g.get("id"))
        check(g.get("genre") in GENRES, f"{where}: bad genre {g.get('genre')!r}")
        check(all(isinstance(g.get(k), str) and g[k].strip()
                  for k in ("title", "url", "controls", "description")),
              f"{where}: empty field")
        p = urlparse(g.get("url", ""))
        check(p.scheme == "https", f"{where}: URL must be https: {g.get('url')!r}")
        check(bool(p.hostname) and "." in (p.hostname or ""), f"{where}: bad host")
        game_domains.add(p.hostname or "")
        if "tags" in g:
            check(isinstance(g["tags"], list) and all(
                isinstance(t, str) and ID_RE.match(t) for t in g["tags"]),
                f"{where}: tags must be a list of slug strings")

    # --- collections reference real games ---
    cseen = set()
    for c in collections:
        where = f"collections.json:{c.get('id')}"
        check(bool(ID_RE.match(c.get("id", "") or "")), f"{where}: bad id")
        check(c.get("id") not in cseen, f"{where}: duplicate id")
        cseen.add(c.get("id"))
        check(4 <= len(c.get("game_ids", [])) <= 12, f"{where}: want 5-12 games")
        for gid in c.get("game_ids", []):
            check(gid in seen, f"{where}: unknown game_id {gid!r}")

    # --- emulators ---
    for e in emulators:
        p = urlparse(e.get("url", ""))
        check(p.scheme == "https", f"emulators.json:{e.get('id')}: URL must be https")

    # --- guides ---
    for g in guides:
        where = f"guides.json:{g.get('id')}"
        check(set(g.keys()) == {"id", "slug", "title", "summary", "difficulty", "time_minutes", "sections"},
              f"{where}: bad fields")
        check(isinstance(g.get("time_minutes"), int) and g["time_minutes"] > 0,
              f"{where}: bad time_minutes")
        for s in g.get("sections", []):
            check(set(s.keys()) == {"heading", "body"}, f"{where}: bad section fields")

    # --- external links inside guide HTML: allowlist ---
    allowed = game_domains | REFERENCE_DOMAINS
    href_re = re.compile(r'href="(https?://[^"]+)"')
    for html in sorted((ROOT / "guides").glob("*.html")):
        for m in href_re.finditer(html.read_text()):
            host = urlparse(m.group(1)).hostname or ""
            if host not in allowed:
                fail(f"{html.name}: external link to non-allowlisted domain {host!r} ({m.group(1)[:70]})")

    if errors:
        print("BUILD FAILED:")
        for e in errors:
            print(" -", e)
        sys.exit(1)

    # Legal-lane gate: no ROM/BIOS download links, no piracy domains.
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "check_legal.py")],
                       capture_output=True, text=True)
    print(r.stdout.strip())
    if r.returncode != 0:
        print(r.stderr)
        sys.exit("scripts/check_legal.py failed")

    for script in ("scripts/build_api.py", "scripts/build_site.py"):
        r = subprocess.run([sys.executable, str(ROOT / script)], capture_output=True, text=True)
        if r.returncode != 0:
            print(r.stdout, r.stderr)
            sys.exit(f"{script} failed")

    print(f"BUILD OK — {len(games)} games ({len(game_domains)} domains), "
          f"{len(collections)} collections, {len(emulators)} emulators, {len(guides)} guides")


if __name__ == "__main__":
    main()
