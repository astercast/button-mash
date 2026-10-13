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
    ("games.html", "Game directory: curated free browser games, search + genre/tag filters, shareable filtered views"),
    ("game.html", "Game file: per-game metadata page (game.html?id=<id>) — description, controls, kid-safe + multiplayer + vibe marks, curated-shelf cross-links, play-tracking, verified play link"),
    ("player.html", "The Player: bring-your-own-file EmulatorJS console (20+ systems)"),
    ("converter.html", "Converter 3.0: batch ROM-to-browser-game conversion (GBA/GB/GBC/NES/SNES/Genesis files in, one self-contained .html per file out), 4 compression levels + presets, honest ROM validation, custom titles + cover art, Player-mode deep links"),
    ("party-planner.html", "Party planner 2.0: guest list + game voting + rotation scheduler + snack-break timer + party timeline (setup->games->tournament->free play), kids-party mode from the 75 kid-safe games, tournament handoff with real names (?names=), shareable party links"),
    ("game-night.html", "Game Night: the Curator deals your night — headcount, hours, mood in; a marquee lineup out (warm-up, main events, showdown/deep-dive, cool-down) with per-game session + skill-floor curator estimates, genre variety, timebox fit, ceremony reveal; client-side from the 213-game catalog"),
    ("tournament.html", "Tournament brackets 2.0: seeded 2-16 player single or double elimination, best-of-N per round, per-round game voting from the full catalog, match history + undo, shareable bracket links, print + copy"),
    ("system-picker.html", "Which system should you emulate? — 1-minute quiz with honest device-limit recommendations"),
    ("kids.html", "Kids corner: kid-safe browser games, no chat, age bands 5–7 / 8–10 / 11–12, parent notes on every game, reduced-motion default"),
    ("parents.html", "Parent guide: how Kids corner curation works, the honesty policy, common-sense screen-time tips, the 'one more level' save-state trick"),
    ("collections.html", "Hand-built game collections"),
    ("emulation.html", "Emulation hub: guides, explainers, legal sources"),
    ("monster-taming.html", "Monster-taming corner: original-IP creature games + GBA tech"),
    ("trophy-room.html", "The Trophy Room: persistent play-tracking — games played/beaten, per-genre completion dials, 16-prize achievement case, collection progress, JSON export/import"),
    ("passport.html", "Arcade Passport: a stamp booklet for the 24 collections — a stamp lands when a shelf actually scrolls into view on the Collections page, guide marks derive from the guides' own checklist store; browser-local only, no play telemetry"),
    ("play-legal.html", "Play it legal: the site's one clear legal page"),
    ("genres/roguelike.html", "Genre deep dive: roguelikes — die, learn, die better"),
    ("genres/cozy.html", "Genre deep dive: cozy games — gentle games for grey weather"),
    ("data/v1/", "JSON API index"),
    ("API.md", "API documentation"),
    ("404.html", "Game over: arcade-styled 404 with insert-coin home CTA"),
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
    ("guides/gba.html", "Game Boy Advance emulation guide (mGBA, BIOS-free)"),
    ("guides/snes.html", "SNES emulation guide (Snes9x, BIOS-free)"),
    ("guides/nes.html", "NES emulation guide (FCEUmm, BIOS-free for cartridges)"),
    ("guides/n64.html", "Nintendo 64 emulation guide (Mupen64Plus-Next, BIOS-free)"),
    ("guides/ps1.html", "PlayStation emulation guide (PCSX-ReARMed, BIOS honesty)"),
    ("guides/genesis.html", "Genesis emulation guide (Genesis Plus GX, BIOS-free)"),
    ("guides/gameboy.html", "Game Boy / Color emulation guide (Gambatte, BIOS-free)"),
    ("guides/homebrew-development.html", "Make games for dead consoles: the homebrew development primer"),
    ("guides/netplay.html", "Play together online: the netplay guide (rollback, hosting, honest limits)"),
    ("guides/save-workflows.html", "Saves that survive: states, SRAM & backup workflows"),
    ("guides/crt-shaders-display.html", "Make pixels look right: CRT shaders & display science"),
    ("guides/accessibility-in-retro-gaming.html", "Retro games for every player: an accessibility guide"),
    ("guides/preserving-your-games.html", "Keep your games forever: the preservation guide"),
    ("guides/gamepad-setup.html", "Controllers in the browser: the gamepad setup guide"),
    ("guides/pico8-spotlight.html", "PICO-8 spotlight: the fantasy console's best corners"),
    ("guides/cheat-codes.html", "Cheat codes, decoded: Game Genie, GameShark & the Konami Code"),
]


def load(name):
    return json.loads((DATA / name).read_text())


def build_llms():
    games = load("games.json")["games"]
    collections = load("collections.json")["collections"]
    kids = load("kids.json")["curated"]
    ngames, nkids, ncols = len(games), len(kids), len(collections)
    emulators = load("emulators.json")["emulators"]
    guides = load("guides.json")

    lines = ["# Button Mash", ""]
    lines.append(
        "The universal in-browser game console. Three centerpieces: (1) the Player — "
        "a bring-your-own-file EmulatorJS console for 20+ classic systems (the site hosts zero ROMs; "
        "the user's file never leaves their machine); (2) the Converter 3.0 — batch-convert GBA, GB/GBC, NES, SNES or Genesis files you own "
        "into self-contained playable .html browser games (client-side only, all five cores BIOS-free, honest validation, compression levels); "
        "(3) the Party Planner — headcount + time + vibe in, timed game-night rotation plan out. "
        f"Plus a curated directory of {ngames} free, legal browser games (every link verified live 2026-10-11), "
        "hand-built collections, genre deep dives, and legal-lane emulation guides. "
        "No ROM piracy links, no cracked-game sites, no commercial ROM downloads — ever."
    )
    lines.append("")
    lines.append("## Play")
    lines.append("- player.html — the bring-your-own-file Player (EmulatorJS, 20+ systems, save states, fullscreen; Player 2.1: named save slots + auto-save, per-system keyboard+gamepad remap, cheat-code entry, display options (CRT/integer-scale/aspect, per-system quick settings), honest netplay notes)")
    lines.append("- converter.html — Converter 3.0: batch ROM-to-browser-game conversion (GBA/GB/GBC/NES/SNES/Genesis files in, one self-contained .html per file out), 5 BIOS-free cores (mGBA/Gambatte/FCEUmm/Snes9x/Genesis Plus GX), 4 compression levels + presets, honest ROM validation (refuses empty/all-zero/bad-NES, warns on blank headers / missing SEGA string, keeps SNES copier headers), custom titles + cover art, ▶ Player mode deep links")
    lines.append("- party-planner.html — Party planner 2.0: guest list (2-16 names), per-guest game voting (ties go to the earliest-picked game), fair rotation scheduler (hot-seat groups of 4), party timeline with snack break + tournament slot, snack-break timer, kids-party mode from the 75 kid-safe games, tournament handoff 2.0 (?players=N&names=A,B&games=ids&format=), shareable #p= party links, print party pack + copy-as-text")
    lines.append("- game-night.html — Game Night: the Curator deals your night — headcount (1-12) + time (15-240 min) + vibe + skill mix + kids flag in, marquee lineup out (warm-up, main events, showdown/deep-dive, cool-down) with per-game session + skill-floor curator estimates, genre variety, timebox fit, and a staggered marquee ceremony reveal; client-side from the 213-game verified catalog, nothing sent; dealt nights can be saved in the browser (bm.lineups.v1) and rematched with fresh picks on the same setup")
    lines.append("- tournament.html — Tournament 2.0: single- or double-elimination brackets for game night (2-16 players, manual seeding UI + randomize, honest byes, best-of-N per round, per-round game voting from the full catalog, match history + undo, shareable bracket links, localStorage saves, print + copy-my-bracket; accepts the party planner handoff (?players=N&games=ids))")
    lines.append(f"- games.html — the {ngames}-game directory (search incl. tags, genre + tag filters, shareable URL views, favorites, random game, game of the day)")
    lines.append("- game.html?id=<game-id> — per-game metadata file: description, controls, kid-safe + multiplayer + vibe marks (live Curator enrichment with honest live/cached badge), curated-shelf cross-links, played/beaten tracking, shareable game-file links, prev/next through the catalog")
    lines.append("- trophy-room.html — The Trophy Room: persistent play-tracking (mark games played/beaten on any game card; per-genre completion dials, 16-prize achievement case, per-collection progress; JSON export/import with schema validation; all browser-local)")
    lines.append(f"- kids.html — Kids corner: {nkids} kid-safe games (no chat, no unmoderated multiplayer, no gambling, no graphic/horror content), age bands 5–7 / 8–10 / 11–12, parent notes, reduced-motion default")
    lines.append("- parents.html — parent guide: curation method, honesty policy (assessments not guarantees — play the first 10 minutes together), common-sense screen-time tips, save-state 'one more level' trick")
    lines.append(f"- collections.html — {ncols} hand-built collections")
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
    lines.append("- data/v1/index.json — endpoint catalog")
    lines.append("- data/v1/games.json, collections.json, emulators.json, guides.json, homebrew-packs.json, kid-safe.json (kid-safe: kid_safe, no_chat, age_band, parent_note, verify_live, audit_basis per record)")
    lines.append("- skills/: game-finder, emulator-setup, player-guide, legal-sourcing, collection-curator, homebrew-hunter, party-game-picker, party-planner-runner, converter-multi-system, retro-guide, classroom-games, system-picker, tournament-runner, kids-corner-guide")
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
