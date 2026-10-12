#!/usr/bin/env python3
"""Build Button Mash: validate data, generate pages, api/v1, sitemap, llms.txt.

Usage: python3 scripts/build.py
Prints BUILD OK with counts, or exits non-zero listing validation errors.
"""
import json
import re
import sys
from html import escape
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
GAMES_DIR = ROOT / "games"
GUIDES_DIR = ROOT / "guides"
API = ROOT / "api" / "v1"
SCHEMA_DIR = API / "schema"

# --- Link audit: every game URL must use one of these known-good domains.
# A fake/invented domain fails the build. Search/browse links are limited to itch.io.
ALLOWED_DOMAINS = {
    "play2048.co", "hextris.io", "0hh1.com", "orteil.dashnet.org",
    "ellisonleao.github.io", "wwwtyro.github.io", "adarkroom.doublespeakgames.com",
    "candybox2.github.io", "particle-clicker.web.cern.ch",
    "mattmakesgames.itch.io", "itch.io",
    "agar.io", "slither.io", "diep.io", "surviv.io", "mope.io", "splix.io",
    "bonk.io", "skribbl.io", "krunker.io", "zombsroyale.io", "tetr.io",
    "wings.io", "wilds.io", "starve.io", "gats.io", "defly.io", "kartwars.io",
    "powerline.io", "wormax.io", "vertix.io",
    "www.kingdomofloathing.com", "www.fallenlondon.com", "littlealchemy2.com",
    "quickdraw.withgoogle.com", "www.thewikigame.com", "www.runescape.com",
    "www.neopets.com", "www.totaljerkface.com", "www.decisionproblem.com",
    "classic.minecraft.net", "www.seterra.com", "hexgl.bkcore.com",
    "www.geo-fs.com", "archive.org",
    # guide reference links used in guide bodies
    "github.com", "retroarch.com", "openttd.org", "pdroms.de",
    "nesdev.com", "gbdev.io", "retroachievements.org",
}

GAME_FIELDS = {"id", "title", "url", "genre", "players", "description"}
GUIDE_FIELDS = {"id", "slug", "title", "summary", "difficulty", "time_minutes", "sections"}

errors = []


def fail(msg):
    errors.append(msg)


def check_url(url, where):
    try:
        p = urlparse(url)
    except Exception:
        fail(f"{where}: unparseable URL {url!r}")
        return
    if p.scheme not in ("http", "https"):
        fail(f"{where}: bad scheme in URL {url!r}")
        return
    host = (p.hostname or "").lower()
    if host not in ALLOWED_DOMAINS:
        fail(f"{where}: domain not allowlisted (possible invented link): {url!r}")


def load_games():
    games = json.loads((DATA / "games.json").read_text())
    seen = set()
    for i, g in enumerate(games):
        where = f"games.json[{i}]"
        if set(g.keys()) != GAME_FIELDS:
            fail(f"{where}: fields {sorted(g.keys())} != {sorted(GAME_FIELDS)}")
        gid = g.get("id", "")
        if not re.fullmatch(r"[a-z0-9-]+", gid or ""):
            fail(f"{where}: bad id {gid!r}")
        if gid in seen:
            fail(f"{where}: duplicate id {gid!r}")
        seen.add(gid)
        if g.get("players") not in ("single", "multiplayer", "both"):
            fail(f"{where}: bad players {g.get('players')!r}")
        for f in ("title", "genre", "description"):
            if not (g.get(f) or "").strip():
                fail(f"{where}: empty {f}")
        check_url(g.get("url", ""), f"{where} ({gid})")
    return games


def load_guides():
    guides = json.loads((DATA / "guides.json").read_text())
    seen_ids, seen_slugs = set(), set()
    for i, g in enumerate(guides):
        where = f"guides.json[{i}]"
        if set(g.keys()) != GUIDE_FIELDS:
            fail(f"{where}: fields {sorted(g.keys())} != {sorted(GUIDE_FIELDS)}")
        for key, seen in (("id", seen_ids), ("slug", seen_slugs)):
            v = g.get(key, "")
            if not re.fullmatch(r"[a-z0-9-]+", v or ""):
                fail(f"{where}: bad {key} {v!r}")
            if v in seen:
                fail(f"{where}: duplicate {key} {v!r}")
            seen.add(v)
        if not isinstance(g.get("time_minutes"), int):
            fail(f"{where}: time_minutes must be int")
        if not g.get("sections"):
            fail(f"{where}: no sections")
        for s in g["sections"]:
            if set(s.keys()) != {"heading", "body"} or not s["heading"].strip() or not s["body"].strip():
                fail(f"{where}: bad section {s.get('heading')!r}")
        # audit bare domains mentioned in guide bodies
        for m in re.findall(r"https?://([^/\s\"')]+)", json.dumps(g["sections"])):
            host = m.lower()
            if host not in ALLOWED_DOMAINS:
                fail(f"{where}: guide links non-allowlisted domain: {m}")
    return guides


BASE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Button Mash</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="{root}assets/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="{root}index.html" aria-label="Button Mash home">
      <span class="brand-mark" aria-hidden="true">🕹️</span>
      <span class="brand-text">Button <strong>Mash</strong></span>
    </a>
    <nav aria-label="Primary">
      <a href="{root}index.html">Games</a>
      <a href="{root}index.html#guides">Guides</a>
      <a href="{root}api/v1/games.json">API</a>
      <a href="{root}llms.txt">llms.txt</a>
    </nav>
  </div>
</header>
<main class="wrap" id="main">
{body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p><strong>Button Mash</strong> — the all-in-one browser games + emulation hub. Every game here is legal to play: open-source, free-to-play, or archive collections. Emulation guides cover tools only — bring your own dumped ROMs.</p>
    <p><a href="{root}api/v1/games.json">games API</a> · <a href="{root}api/v1/guides.json">guides API</a> · <a href="{root}llms.txt">llms.txt</a> · <a href="{root}API.md">API docs</a></p>
  </div>
</footer>
</body>
</html>
"""

GAME_PAGE_BODY = """
<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">← All games</a></nav>
<article class="game-page">
  <p class="kicker">{genre_label}</p>
  <h1>{title}</h1>
  <ul class="chips" aria-label="Tags">
    <li>{genre}</li><li>{players}</li>
  </ul>
  <p class="lede">{description}</p>
  <p><a class="btn btn-play" href="{url}" target="_blank" rel="noopener">▶ Play {title} <span class="visually-hidden">(opens in a new tab)</span></a></p>
  <aside class="legal-note"><strong>Legal lane:</strong> this game is listed because it is free and legal to play in the browser — open-source, free-to-play, or an archive collection. Button Mash never links ROM downloads or piracy sites.</aside>
  {related}
</article>
"""

RELATED_TMPL = """
<section aria-labelledby="related-h"><h2 id="related-h">More {genre} games</h2>
<div class="card-grid">{cards}</div></section>
"""

CARD_TMPL = ('<article class="card"><h3><a href="../games/{id}.html">{title}</a></h3>'
             '<p class="card-meta">{genre} · {players_label}</p><p>{desc}</p></article>')

GUIDE_PAGE_BODY = """
<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html#guides">← All guides</a></nav>
<article class="guide-page">
  <p class="kicker">Guide · {difficulty}</p>
  <h1>{title}</h1>
  <p class="lede">{summary}</p>
  <ul class="chips" aria-label="Guide facts"><li>⏱ ~{time} min</li><li>{difficulty}</li></ul>
  <aside class="legal-note"><strong>Legal lane:</strong> this guide covers tools and techniques only. Supply ROMs you dumped from games you own, plus homebrew and public-domain titles. No ROM download links, no piracy sites — ever.</aside>
  {sections}
  <section aria-labelledby="more-guides"><h2 id="more-guides">More guides</h2>
  <ul class="guide-list">{others}</ul></section>
</article>
"""

SECTION_TMPL = "<section class=\"guide-section\"><h2>{h}</h2>{paras}</section>"


def md_paras(text):
    """Tiny renderer: paragraphs split on blank lines; lines starting with '- ' become lists;
    `code` spans become <code>. Fenced blocks are not used in source data."""
    parts = re.split(r"\n\s*\n", text.strip())
    out = []
    for part in parts:
        part = escape(part)
        part = re.sub(r"`([^`]+)`", r"<code>\1</code>", part)
        lines = part.split("\n")
        if all(l.startswith("- ") for l in lines):
            items = "".join(f"<li>{l[2:].strip()}</li>" for l in lines)
            out.append(f"<ul>{items}</ul>")
        else:
            out.append(f"<p>{'<br>'.join(lines)}</p>")
    return "\n".join(out)


def genre_label(g):
    return {"io": ".io arena", "browse": "itch.io picks", "collection": "archive collection"}.get(g, g)


def players_label(p):
    return {"single": "single-player", "multiplayer": "multiplayer", "both": "solo or multiplayer"}[p]


def build(games, guides):
    GAMES_DIR.mkdir(exist_ok=True)
    GUIDES_DIR.mkdir(exist_ok=True)
    # wipe stale pages
    for d in (GAMES_DIR, GUIDES_DIR):
        for f in d.glob("*.html"):
            f.unlink()

    by_genre = {}
    for g in games:
        by_genre.setdefault(g["genre"], []).append(g)

    for g in games:
        rel = [c for c in by_genre[g["genre"]] if c["id"] != g["id"]][:3]
        related = ""
        if rel:
            cards = "".join(CARD_TMPL.format(id=c["id"], title=escape(c["title"]),
                                             genre=escape(genre_label(c["genre"])),
                                             players_label=players_label(c["players"]),
                                             desc=escape(c["description"])) for c in rel)
            related = RELATED_TMPL.format(genre=escape(genre_label(g["genre"])), cards=cards)
        body = GAME_PAGE_BODY.format(
            title=escape(g["title"]), genre=escape(g["genre"]),
            genre_label=escape(genre_label(g["genre"])),
            players=escape(players_label(g["players"])),
            description=escape(g["description"]), url=escape(g["url"], quote=True),
            related=related)
        (GAMES_DIR / f"{g['id']}.html").write_text(
            BASE.format(title=escape(g["title"]), desc=escape(g["description"][:150]),
                        root="../", body=body))

    for gd in guides:
        sections = "\n".join(SECTION_TMPL.format(h=escape(s["heading"]), paras=md_paras(s["body"]))
                             for s in gd["sections"])
        others = "\n".join(
            f'<li><a href="{o["slug"]}.html">{escape(o["title"])}</a> — {escape(o["summary"])}</li>'
            for o in guides if o["id"] != gd["id"])
        body = GUIDE_PAGE_BODY.format(title=escape(gd["title"]), summary=escape(gd["summary"]),
                                      difficulty=escape(gd["difficulty"]), time=gd["time_minutes"],
                                      sections=sections, others=others)
        (GUIDES_DIR / f"{gd['slug']}.html").write_text(
            BASE.format(title=escape(gd["title"]), desc=escape(gd["summary"][:150]),
                        root="../", body=body))

    # API
    API.mkdir(parents=True, exist_ok=True)
    SCHEMA_DIR.mkdir(exist_ok=True)
    (API / "games.json").write_text(json.dumps(games, indent=2) + "\n")
    (API / "guides.json").write_text(json.dumps(
        [{k: v for k, v in g.items() if k != "sections"} | {"section_count": len(g["sections"])}
         for g in guides], indent=2) + "\n")
    game_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Button Mash game record",
        "type": "object",
        "required": ["id", "title", "url", "genre", "players", "description"],
        "properties": {
            "id": {"type": "string", "pattern": "^[a-z0-9-]+$"},
            "title": {"type": "string", "minLength": 1},
            "url": {"type": "string", "format": "uri",
                    "description": "Play URL. Must use an allowlisted, verified domain — no invented links."},
            "genre": {"type": "string", "minLength": 1},
            "players": {"type": "string", "enum": ["single", "multiplayer", "both"]},
            "description": {"type": "string", "minLength": 1,
                            "description": "Original description in our own words."},
        },
        "additionalProperties": False,
    }
    guide_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Button Mash guide record",
        "type": "object",
        "required": ["id", "slug", "title", "summary", "difficulty", "time_minutes", "sections"],
        "properties": {
            "id": {"type": "string", "pattern": "^[a-z0-9-]+$"},
            "slug": {"type": "string", "pattern": "^[a-z0-9-]+$"},
            "title": {"type": "string", "minLength": 1},
            "summary": {"type": "string", "minLength": 1},
            "difficulty": {"type": "string", "minLength": 1},
            "time_minutes": {"type": "integer", "minimum": 1},
            "sections": {"type": "array", "minItems": 1, "items": {
                "type": "object",
                "required": ["heading", "body"],
                "properties": {"heading": {"type": "string"}, "body": {"type": "string"}},
                "additionalProperties": False}},
        },
        "additionalProperties": False,
    }
    (SCHEMA_DIR / "games.schema.json").write_text(json.dumps(game_schema, indent=2) + "\n")
    (SCHEMA_DIR / "guides.schema.json").write_text(json.dumps(guide_schema, indent=2) + "\n")

    # sitemap
    urls = ["index.html"] + [f"games/{g['id']}.html" for g in games] + \
           [f"guides/{g['slug']}.html" for g in guides]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9map">']
    sm += [f"  <url><loc>{u}</loc></url>" for u in urls]
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n")

    # llms.txt
    genres = sorted({g["genre"] for g in games})
    L = []
    L.append("# Button Mash\n")
    L.append("The all-in-one browser games + emulation hub. Every game is legal to play in the "
             "browser: open-source HTML5 games, .io games, free-to-play browser games, itch.io "
             "picks, and Internet Archive playable collections. Emulation guides cover tools only "
             "(EmulatorJS, RetroArch, GBA-to-WASM recompilers, cartridge dumping) — users supply "
             "their own dumped ROMs. No ROM download links, no piracy sites, ever.\n")
    L.append(f"## Games ({len(games)} total; genres: {', '.join(genres)})\n")
    for g in games:
        L.append(f"- {g['title']} [{g['genre']} · {g['players']}] — {g['description']} Play: {g['url']}")
    L.append("\n## Guides\n")
    for gd in guides:
        L.append(f"- {gd['title']} ({gd['difficulty']}, ~{gd['time_minutes']} min) — {gd['summary']} Page: guides/{gd['slug']}.html")
    L.append("\n## API\n- api/v1/games.json — full game records\n- api/v1/guides.json — guide index (summaries)\n"
             "- api/v1/schema/games.schema.json — game JSON schema\n- api/v1/schema/guides.schema.json — guide JSON schema\n")
    L.append("## Skills\n- skills/game-finder.md\n- skills/emulator-setup.md\n- skills/homebrew-hunter.md\n"
             "- skills/party-game-picker.md\n- skills/retro-guide.md\n")
    L.append("## Docs\n- README.md — project overview\n- API.md — API documentation\n- GO_LIVE.md — deployment checklist\n- PIPELINE.md — content pipeline\n- WAVELOG.md — build history\n")
    (ROOT / "llms.txt").write_text("\n".join(L))

    # llms-full.txt = llms.txt + full guide bodies
    F = list(L)
    F.append("\n## Full guide texts\n")
    for gd in guides:
        F.append(f"\n### {gd['title']}\n{'-' * (len(gd['title']) + 4)}\n")
        for s in gd["sections"]:
            F.append(f"\n#### {s['heading']}\n\n{s['body']}\n")
    (ROOT / "llms-full.txt").write_text("\n".join(F))

    print(f"BUILD OK — {len(games)} games, {len(games)} game pages, "
          f"{len(guides)} guides, {len(guides)} guide pages, sitemap {len(urls)} urls")


def main():
    games = load_games()
    guides = load_guides()
    if errors:
        print("BUILD FAILED:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    build(games, guides)


if __name__ == "__main__":
    main()
