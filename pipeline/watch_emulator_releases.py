#!/usr/bin/env python3
"""Watch emulator project releases and queue notable ones for human review.

Fetches GitHub release Atom feeds for the emulators Button Mash covers.
New releases become "pending" candidates in pipeline/review_queue.json —
a human decides whether the release notes merit a guide update or a news
mention. NEVER auto-publishes.

Usage: python3 pipeline/watch_emulator_releases.py
"""
import json
import pathlib
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent
QUEUE = ROOT / "review_queue.json"

FEEDS = {
    "EmulatorJS": "https://github.com/EmulatorJS/EmulatorJS/releases.atom",
    "RetroArch": "https://github.com/libretro/RetroArch/releases.atom",
    "mGBA": "https://github.com/mgba-emu/mgba/releases.atom",
    "DuckStation": "https://github.com/stenzek/duckstation/releases.atom",
    "PCSX2": "https://github.com/PCSX2/pcsx2/releases.atom",
    "PPSSPP": "https://github.com/hrydgard/ppsspp/releases.atom",
}

NS = {"a": "http://www.w3.org/2005/Atom"}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ButtonMash-pipeline/1.0 (+human-review-queue)"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def parse_atom(xml_bytes):
    root = ET.fromstring(xml_bytes)
    out = []
    for entry in root.findall("a:entry", NS):
        title = (entry.findtext("a:title", "", NS) or "").strip()
        link_el = entry.find("a:link", NS)
        link = link_el.get("href", "") if link_el is not None else ""
        updated = (entry.findtext("a:updated", "", NS) or "").strip()
        if title and link:
            out.append({"title": title, "url": link, "published": updated})
    return out


def load_queue():
    if QUEUE.exists():
        return json.loads(QUEUE.read_text())
    return {"generated_at": "", "candidates": []}


def main():
    queue = load_queue()
    known_urls = {c["url"] for c in queue["candidates"]}
    added = 0
    for name, feed in FEEDS.items():
        try:
            entries = parse_atom(fetch(feed))
        except Exception as e:
            print(f"feed failed (will retry next run): {name} — {e}")
            continue
        for e in entries[:3]:  # only the latest few per project
            if e["url"] in known_urls:
                continue
            queue["candidates"].append({
                "title": f"{name}: {e['title']}",
                "url": e["url"],
                "source": f"{name} GitHub releases",
                "spotted_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "status": "pending",
                "notes": "Read release notes. Update guides/emulator picks if behavior changed (cores, BIOS needs, new systems).",
            })
            known_urls.add(e["url"])
            added += 1
    queue["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    QUEUE.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + "\n")
    print(f"emulator watch done: {added} new candidates queued for human review.")


if __name__ == "__main__":
    main()
