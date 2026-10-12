#!/usr/bin/env python3
"""Regenerate llms.txt, llms-full.txt, and sitemap.xml from data/*.json.

Run after editing data/:
    python3 scripts/build_site.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

PAGES = [
    ("index.html", "Home — the universal in-browser game console"),
    ("games.html", "Game directory: 114 curated free browser games, search + genre filters"),
    ("player.html", "The Player: bring-your-own-file EmulatorJS console (20+ systems)"),
    ("converter.html", "ROM-to-browser-game converter (GBA/GB/GBC/NES file in, self-contained .html out)"),
    ("party-planner.html", "Party planner: timed game-night rotation plans across party-tagged games"),
    ("collections.html", "Hand-built game collections"),
    ("emulation.html", "Emulation hub: guides, explainers, legal sources"),
    ("monster-taming.html", "Monster-taming corner: original-IP creature games + GBA tech"),
    ("play-legal.html", "Play it legal: the site's one clear legal page"),
    ("genres/roguelike.html", "Genre deep dive: roguelikes — die, learn, die better"),
    ("genres/cozy.html", "Genre deep dive: cozy games — gentle games for grey weather"),
    ("api/v1/", "JSON API index"),
    ("API.md", "API documentation"),
]

GUIDES = [
    ("guides/emulatorjs-self-hosting.html", "EmulatorJS self-hosting guide"),
    ("guides/retroarch-setup.html", "RetroArch setup guide"),
    ("guides/gba-to-wasm-recompiler.html", "GBA-to-WASM recompiler guide (hands-on)"),
    ("guides/gba-wasm.html", "How GBA becomes WebAssembly (tech explainer)"),
    ("guides/how-emulation-works.html", "How emulation works (explainer)"),
    ("guides/best-emulator-per-system.html", "Best emulator per system (reference)"),
    ("guides/rip-your-own-cartridges.html", "Rip your own cartridges guide"),
    ("guides/homebrew-and-public-domain.html", "Homebrew & public-domain sources"),
]


def load(name):
    return json.loads((DATA / name).read_text())


def build_llms():
    games = load("games.json")["games"]
    collections = load("collections.json")["collections"]
    emulators = load("emulators.json")["emulators"]
    guides = load("guides.json")

    lines = ["# Button Mash", ""]
    lines.append(
        "The universal in-browser game console. Three centerpieces: (1) the Player — "
        "a bring-your-own-file EmulatorJS console for 20+ classic systems (the site hosts zero ROMs; "
        "the user's file never leaves their machine); (2) the Converter — drop in a GBA, GB/GBC or NES file you own, "
        "get back a single self-contained playable .html browser game (client-side only, all three cores BIOS-free); "
        "(3) the Party Planner — headcount + time + vibe in, timed game-night rotation plan out. "
        "Plus a curated directory of 114 free, legal browser games (every link verified live 2026-10-11), "
        "hand-built collections, genre deep dives, and legal-lane emulation guides. "
        "No ROM piracy links, no cracked-game sites, no commercial ROM downloads — ever."
    )
    lines.append("")
    lines.append("## Play")
    lines.append("- player.html — the bring-your-own-file Player (EmulatorJS, 20+ systems, save states, fullscreen; Player 2.0: save-state export/import, keyboard+gamepad remap UI, cheat-code entry, CRT filter, honest netplay notes)")
    lines.append("- converter.html — ROM-to-browser-game converter (GBA/GB/GBC/NES in, self-contained .html out)")
    lines.append("- party-planner.html — timed game-night rotation planner across party-tagged games (print-friendly)")
    lines.append("- games.html — the 114-game directory (search, genre filters, favorites, random game, game of the day)")
    lines.append("- collections.html — 11 hand-built collections")
    lines.append("- genres/roguelike.html, genres/cozy.html — genre deep dives with start-here picks")
    lines.append("")
    lines.append("## Learn")
    lines.append("- emulation.html — emulation hub")
    lines.append("- monster-taming.html — original-IP monster-taming games + GBA-to-WASM tech")
    lines.append("- play-legal.html — the one clear legal page")
    for slug, title in GUIDES:
        lines.append(f"- {slug} — {title}")
    lines.append("")
    lines.append(f"## Games ({len(games)} total)")
    lines.append("")
    for g in games:
        lines.append(
            f"- {g['title']} [{g['genre']} · {g['controls']}] — {g['description']} Play: {g['url']}"
        )
    lines.append("")
    lines.append(f"## Collections ({len(collections)} total)")
    lines.append("")
    for c in collections:
        titles = []
        by_id = {g["id"]: g["title"] for g in games}
        for gid in c["game_ids"]:
            if gid in by_id:
                titles.append(by_id[gid])
        lines.append(f"- {c['title']}: {c['tagline']} — " + "; ".join(titles))
    lines.append("")
    lines.append(f"## Emulators ({len(emulators)} picks, software only)")
    lines.append("")
    for e in emulators:
        bios = " (needs your own dumped BIOS)" if e.get("bios_required") else ""
        lines.append(f"- {e['name']} [{', '.join(e['systems'])}]{bios} — {e['notes']} {e['url']}")
    lines.append("")
    lines.append("## API")
    lines.append("- api/v1/index.json — endpoint catalog")
    lines.append("- api/v1/games.json, collections.json, emulators.json, guides.json")
    lines.append("- skills/: game-finder, emulator-setup, player-guide, legal-sourcing, collection-curator, homebrew-hunter, party-game-picker, party-planner-runner, converter-multi-system, retro-guide, classroom-games")
    lines.append("")
    lines.append("## Legal")
    lines.append("Zero ROMs hosted. Zero piracy links. All game descriptions original (CC0).")
    (ROOT / "llms.txt").write_text("\n".join(lines) + "\n")
    print("wrote llms.txt")


def build_llms_full():
    guides = load("guides.json")
    lines = ["# Button Mash — full context", ""]
    lines.append((ROOT / "llms.txt").read_text())
    lines.append("# Guides (full text)")
    lines.append("")
    for g in guides:
        lines.append(f"## {g['title']}")
        lines.append(f"Difficulty: {g['difficulty']} · ~{g['time_minutes']} min · slug: {g['slug']}")
        lines.append("")
        lines.append(g["summary"])
        lines.append("")
        for s in g["sections"]:
            lines.append(f"### {s['heading']}")
            lines.append("")
            lines.append(s["body"])
            lines.append("")
    (ROOT / "llms-full.txt").write_text("\n".join(lines) + "\n")
    print("wrote llms-full.txt")


def build_sitemap():
    urls = [p for p, _ in PAGES] + [s for s, _ in GUIDES]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">']
    for u in urls:
        lines.append(f"  <url><loc>{u}</loc></url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n")
    print("wrote sitemap.xml")


if __name__ == "__main__":
    build_llms()
    build_llms_full()
    build_sitemap()
    print("done.")
