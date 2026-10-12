#!/usr/bin/env python3
"""Link check for Button Mash: every relative href in every HTML file must resolve
to a file in the repo. External URLs are counted, not fetched.

Usage: python3 scripts/check_links.py
"""
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, urldefrag

ROOT = Path(__file__).resolve().parent.parent
HREF = re.compile(r'''(?:href|src)="([^"]+)"''')

broken = []
local_count = 0
external_count = 0
pages = sorted(ROOT.rglob("*.html"))
# skip node_modules-style noise; only repo html
pages = [p for p in pages if ".git" not in p.parts]

for page in pages:
    text = page.read_text()
    for raw in HREF.findall(text):
        url, _frag = urldefrag(raw)
        if not url:
            continue
        p = urlparse(url)
        if p.scheme in ("http", "https", "mailto"):
            external_count += 1
            continue
        if p.scheme:  # data:, javascript:, tel:, etc.
            continue
        local_count += 1
        target = (page.parent / url).resolve()
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            broken.append(f"{page.relative_to(ROOT)} -> {raw} (escapes repo)")
            continue
        if not target.exists():
            broken.append(f"{page.relative_to(ROOT)} -> {raw} (missing)")

# every game/guide page must be in the sitemap
sitemap = (ROOT / "sitemap.xml").read_text()
missing_sm = []
for page in pages:
    rel = page.relative_to(ROOT).as_posix()
    if rel == "index.html":
        continue
    if f"<loc>{rel}</loc>" not in sitemap:
        missing_sm.append(rel)

if broken or missing_sm:
    print("LINK CHECK FAILED:")
    for b in broken:
        print(" -", b)
    for m in missing_sm:
        print(" - sitemap missing:", m)
    sys.exit(1)

print(f"LINK CHECK OK — {len(pages)} pages, {local_count} local links, "
      f"{external_count} external links, 0 broken")
