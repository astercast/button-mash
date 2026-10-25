"""PortPlay fleet collector: the engine version watcher.

Reads the pinned EmulatorJS version from the one place it lives
(assets/js/config.js, engineVersion) and the newest version the
EmulatorJS CDN serves on its stable channel (data/version.json).
Writes engine-watch.json (pinned, latest, update_available) and a
pulse. It also checks the vendored copy in this repo still matches
the pin.

It NEVER updates the pin and never downloads the engine. Upgrading
is a deliberate human act: re-vendor, change config.js, run the
fixture tests (see assets/js/config.js). This watcher only flags.

Stdlib only, via the fleet lib.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import Pulse, get_json, now, write_if_changed  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CONFIG = os.path.join(ROOT, "assets", "js", "config.js")
VENDORED = os.path.join(ROOT, "assets", "emulatorjs", "data", "version.json")
CHANNELS = ["https://cdn.emulatorjs.org/stable/data/version.json",
            "https://cdn.emulatorjs.org/latest/data/version.json"]


def version_of(doc):
    if isinstance(doc, dict):
        v = doc.get("version") or doc.get("current")
        return str(v) if v else None
    if isinstance(doc, str):
        return doc.strip() or None
    return None


def key(v):
    return tuple(int(x) for x in re.findall(r"\d+", v or ""))


def main():
    p = Pulse(stale_after_h=50)

    pinned = None
    try:
        m = re.search(r'engineVersion\s*:\s*"([^"]+)"',
                      open(CONFIG, encoding="utf-8").read())
        pinned = m.group(1) if m else None
    except Exception:
        pinned = None
    p.source("pin", "Pinned engine version", pinned is not None,
             1 if pinned else 0,
             None if pinned else "engineVersion not found in config.js",
             "assets/js/config.js")

    vendored = None
    try:
        vendored = version_of(json.load(open(VENDORED, encoding="utf-8")))
    except Exception:
        vendored = None
    p.source("vendored", "Vendored engine copy",
             bool(vendored and pinned and vendored == pinned),
             1 if vendored else 0,
             None if vendored == pinned else
             f"vendored {vendored} != pinned {pinned}",
             "assets/emulatorjs/data/version.json")

    latest, used, err = None, None, None
    for url in CHANNELS:
        doc, err = get_json(url)
        latest = version_of(doc)
        if latest:
            used = url
            break
    update = bool(latest and pinned and key(latest) > key(pinned))
    p.source("cdn", "EmulatorJS stable channel", latest is not None,
             1 if latest else 0, err, used)
    if update:
        p.change("engine",
                 f"EmulatorJS {latest} is out; the site stays pinned "
                 f"at {pinned} until a human re-vendors", used)
    write_if_changed("engine-watch.json", {
        "format": "engine-watch/1", "checked_at": now(),
        "pinned": pinned, "latest": latest,
        "update_available": update,
        "note": "Flag only. The pinned engine never auto-updates; "
                "upgrading is re-vendor + config change + fixture "
                "tests, by a human."},
        volatile=("checked_at",))
    p.write()
    print(f"portplay: pinned {pinned}, latest {latest}, update {update}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
