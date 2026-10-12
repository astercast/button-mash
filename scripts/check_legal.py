#!/usr/bin/env python3
"""Legal-lane gate for Button Mash: fail if any page links to ROM/BIOS downloads
or known piracy domains. Legitimate ROM discussion (dumping your own cartridges,
homebrew archives like pdroms.de) is NOT flagged — only download-offer phrasing.

Usage: python3 scripts/check_legal.py
"""
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent

# Known piracy / ROM-download domains. Never link these.
PIRACY_DOMAINS = {
    "emuparadise.me", "www.emuparadise.me",
    "coolrom.com", "www.coolrom.com",
    "romhustler.org", "www.romhustler.org",
    "doperoms.com", "www.doperoms.com",
    "freeroms.com", "www.freeroms.com",
    "loveroms.com", "www.loveroms.com",
    "romsmania.cc", "www.romsmania.cc",
    "vimm.net", "www.vimm.net",
    "wowroms.com", "www.wowroms.com",
    "romspure.cc", "www.romspure.cc",
    "retrostic.com", "www.retrostic.com",
}

# Hosts where ROM download links are explicitly legal (public-domain/homebrew).
LEGAL_ROM_HOSTS = {"pdroms.de", "www.pdroms.de", "gamebrew.org", "www.gamebrew.org",
                   "itch.io", "github.com"}

HREF = re.compile(r'href="([^"]+)"')
LINK_TEXT = re.compile(r'<a\b[^>]*>(.*?)</a>', re.S)
TAG = re.compile(r'<[^>]+>')
DOWNLOAD_ROM = re.compile(
    r'\b(download|free)\b.{0,40}\b(roms?|bios)\b|\b(roms?|bios)\b.{0,40}\bdownload\b', re.I)

errors = []

pages = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts]
for page in pages:
    rel = page.relative_to(ROOT).as_posix()
    text = page.read_text()
    for m in HREF.finditer(text):
        url = m.group(1)
        host = (urlparse(url).hostname or "").lower()
        if host in PIRACY_DOMAINS:
            errors.append(f"{rel}: piracy-domain link {url}")
            continue
        if DOWNLOAD_ROM.search(url) and host not in LEGAL_ROM_HOSTS:
            errors.append(f"{rel}: ROM/BIOS download URL {url[:80]}")
    for m in LINK_TEXT.finditer(text):
        label = TAG.sub("", m.group(1)).strip()
        low = label.lower()
        if ("your own" in low or "you own" in low or "dump" in low):
            continue  # legitimate own-cartridge discussion
        if DOWNLOAD_ROM.search(label):
            errors.append(f"{rel}: ROM/BIOS download link text {label[:70]!r}")

# Game catalog URLs: must be play URLs, never download links.
import json  # noqa: E402
games = json.loads((ROOT / "data" / "games.json").read_text())["games"]
for g in games:
    host = (urlparse(g["url"]).hostname or "").lower()
    if host in PIRACY_DOMAINS or DOWNLOAD_ROM.search(g["url"]):
        errors.append(f"games.json:{g['id']}: suspicious URL {g['url'][:80]}")

if errors:
    print("LEGAL GATE FAILED:")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print(f"LEGAL GATE OK — {len(pages)} pages, {len(games)} game URLs, 0 piracy links")
