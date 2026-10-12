#!/usr/bin/env python3
"""Build the Button Mash static JSON API (api/v1/) from data/*.json.

Regenerates every endpoint file plus the index. Run after editing data/:
    python3 scripts/build_api.py
"""
import json
import pathlib
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
API = ROOT / "api" / "v1"
VERSION = "1.0.0"

ENDPOINTS = {
    "games": "Curated browser games directory (every URL verified live — never invented).",
    "collections": "Hand-built game collections.",
    "emulators": "Emulator software picks (no ROMs, software only).",
    "guides": "Emulation guides and explainers (summaries; full text in data/guides.json).",
}

USAGE = (
    "Static JSON, no auth, no rate limits. Fetch any endpoint directly, e.g. "
    "api/v1/games.json. Filter client-side by genre/id/tags. All game descriptions "
    "are original (CC0). Game URLs were verified live on 2026-10-11."
)


def load(name):
    return json.loads((DATA / name).read_text())


def write(name, obj):
    (API / name).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")
    print("wrote", API / name)


def main():
    API.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    games = load("games.json")
    collections = load("collections.json")
    emulators = load("emulators.json")
    guides = load("guides.json")

    def envelope(key, data, blurb):
        return {
            "name": "Button Mash",
            "version": VERSION,
            "generated_at": generated_at,
            "endpoint": key,
            "description": blurb,
            "count": len(data),
            key: data,
        }

    write("games.json", envelope("games", games["games"], ENDPOINTS["games"]))
    write("collections.json", envelope("collections", collections["collections"], ENDPOINTS["collections"]))
    write("emulators.json", envelope("emulators", emulators["emulators"], ENDPOINTS["emulators"]))

    guide_summaries = [
        {
            "id": g["id"],
            "slug": g["slug"],
            "title": g["title"],
            "difficulty": g["difficulty"],
            "time_minutes": g["time_minutes"],
            "summary": g["summary"],
            "section_count": len(g["sections"]),
        }
        for g in guides
    ]
    write("guides.json", envelope("guides", guide_summaries, ENDPOINTS["guides"]))

    index = {
        "name": "Button Mash",
        "version": VERSION,
        "generated_at": generated_at,
        "description": "Universal in-browser game console: curated browser games, bring-your-own-file EmulatorJS player, GBA-to-browser-game converter, legal-lane emulation guides.",
        "legal": "Zero ROMs hosted. Zero piracy links. All game descriptions original (CC0).",
        "endpoints": {k: f"api/v1/{k}.json — {v}" for k, v in ENDPOINTS.items()},
        "usage": USAGE,
    }
    write("index.json", index)
    print("done.")


if __name__ == "__main__":
    main()
