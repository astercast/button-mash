#!/usr/bin/env python3
"""Watch itch.io fresh free web games and queue candidates for human review.

Reads RSS/Atom feeds, extracts new free browser games, and appends them to
pipeline/review_queue.json with status "pending". NEVER auto-publishes:
a human verifies the URL, writes an original description, and assigns a
genre before anything enters data/games.json.

Usage: python3 pipeline/watch_itch.py
"""
import json
import pathlib
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent
QUEUE = ROOT / "review_queue.json"

# itch.io bot-gates its browse feeds (HTTP 403 even with a browser UA, verified
# 2026-10-11). This watcher tries anyway and degrades gracefully; when feeds
# stay gated, the curator does a manual sweep of itch.io's free browser-games
# browse page (see PIPELINE.md). Feeds are hints, not contracts.
FEEDS = [
    "https://itch.io/games/newest/html5-free/feed",
    "https://itch.io/feed",
]

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def parse_feed(xml_bytes):
    items = []
    text = xml_bytes.decode("utf-8", errors="replace")
    try:
        root = ET.fromstring(xml_bytes)
        entries = root.iter("item")
        use_xml = True
    except ET.ParseError:
        use_xml = False
    if use_xml:
        for item in entries:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub = (item.findtext("pubDate") or "").strip()
            if title and link:
                items.append({"title": title, "url": link, "published": pub, "source": "itch.io feed"})
    else:
        # Tolerant fallback: itch.io's feed occasionally ships malformed XML.
        import re as _re
        for m in _re.finditer(r"<item>(.*?)</item>", text, _re.S):
            chunk = m.group(1)
            t = _re.search(r"<title>(.*?)</title>", chunk, _re.S)
            l = _re.search(r"<link>(.*?)</link>", chunk, _re.S)
            if t and l:
                title = _re.sub(r"<[^>]+>", "", t.group(1)).strip()
                link = l.group(1).strip()
                if title and link and "itch.io" in link:
                    items.append({"title": title, "url": link, "published": "", "source": "itch.io feed"})
    return items


def load_queue():
    if QUEUE.exists():
        return json.loads(QUEUE.read_text())
    return {"generated_at": "", "candidates": []}


def main():
    queue = load_queue()
    known_urls = {c["url"] for c in queue["candidates"]}
    known_urls |= {g["url"] for g in json.loads((ROOT.parent / "data" / "games.json").read_text())["games"]}
    added = 0
    for feed in FEEDS:
        try:
            items = parse_feed(fetch(feed))
        except Exception as e:
            print(f"feed failed (will retry next run): {feed} — {e}")
            continue
        for it in items:
            if it["url"] in known_urls:
                continue
            queue["candidates"].append({
                "title": it["title"],
                "url": it["url"],
                "source": it["source"],
                "spotted_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "status": "pending",
                "notes": "Verify live (HTTP 200), confirm free + browser-playable, write original description, assign genre.",
            })
            known_urls.add(it["url"])
            added += 1
    queue["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    QUEUE.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + "\n")
    print(f"itch watch done: {added} new candidates queued for human review.")


if __name__ == "__main__":
    main()
