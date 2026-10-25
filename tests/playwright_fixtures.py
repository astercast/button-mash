#!/usr/bin/env python3
"""PP14/H fixture gate (Rotation 141): real user flows in a real browser.

Boots homebrew fixtures through the stage's own drop flow (file input ->
byte detection -> frame boot), checks the game canvas is not solid
black, builds a Light portable file and an Offline edition and checks
both downloads, and proves the PP13 BIOS gate stops a Lynx game before
any boot. Homebrew fixtures only; no commercial ROMs, ever.

Run:  python3 tests/playwright_fixtures.py [--full]
Default set is the representative gate; --full boots every fixture
that routes to play on the stage. Engine comes from the pinned CDN,
so the gate needs network. Exit 0 only when every flow passes.

Mirror mode (Rotation 142): where the sandbox's Chromium egress
tunnel to the CDN is broken (ERR_TUNNEL_CONNECTION_FAILED from
Chromium while curl through the same proxy returns 200), set
BM_CDN_MIRROR=<dir> to serve the pinned engine from a local mirror
of the same origin. Mirror bytes are fetched by curl from
cdn.emulatorjs.org and pinned by sha256 in <dir>/manifest.json; a
locked run re-verifies every hash before the browser starts and
refuses to run on any mismatch or unrecorded file. A CDN request
with no mirror file aborts and is reported as MIRROR-MISS, so the
flow fails honestly rather than silently passing. BM_CDN_RECORD=1
lets a run fetch missing files via curl and extend the mirror;
a record run builds the mirror, it is never the verdict.
"""
import functools
import hashlib
import http.server
import json
import os
import subprocess
import urllib.parse
import pathlib
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIX = ROOT / "tests" / "homebrew-test-roms"
PORT = int(os.environ.get("BM_GATE_PORT", "8931"))

GATE = ["fixture-nes.nes", "rkanoid-latest-demo.gba", "fixture-gb.gb",
        "fixture-snes.sfc", "fixture-genesis.md", "fixture-sms.sms",
        "fixture-pce.pce", "fixture-atari2600.a26"]
# Rotation 142, per-fixture fixes from the first mirror-mode --full run:
# - fixture-gba.gba left the boot list: its synthetic body is LCG noise
#   with no executable code, and the mGBA core traps starting it
#   ("Failed to start game: table index is out of bounds", firsthand).
#   GBA boot coverage is the real homebrew control (rkanoid, in GATE);
#   the synthetic still serves the detection suites, its actual job.
# - fixture-coleco.col / fixture-amiga.adf moved to BIOS_GATE: both
#   systems are BIOS-required in the site's own table, so the stage
#   correctly refuses to boot without a user-supplied BIOS — the gate
#   asserts that designed behavior instead of demanding a boot.
FULL_EXTRA = ["fixture-gg.gg", "fixture-sg1000.sg",
              "fixture-32x.32x", "fixture-atari7800.a78", "fixture-atari5200.a52",
              "fixture-ws.ws", "fixture-ngp.ngp", "fixture-vb.vb",
              "fixture-c64.prg",
              "fixture-jaguar.j64"]
# BIOS-required systems (converter4-core BIOS_REQUIRED): the flow for
# each is the PP13 assertion — the stage names the BIOS file and does
# not boot. The gate never supplies BIOS files.
BIOS_GATE = [("fixture-lynx.lnx", "Lynx", "lynxboot.img"),
             ("fixture-coleco.col", "Coleco", "colecovision.rom"),
             ("fixture-amiga.adf", "Amiga", "kick"),
             # Rotation 142: fixture-fds.fds moved here from the boot
             # list on firsthand evidence — without disksys.rom the
             # pinned engine's FDS boot crashes the renderer (the noise
             # fixture AND a hand-built structured disk both crashed;
             # every cartridge boot passed). The site now keys FDS as
             # BIOS-required by system, so the designed behavior is
             # the PP13 ask, asserted like the others.
             ("fixture-fds.fds", "FDS", "disksys.rom")]


CDN_PREFIX = "https://cdn.emulatorjs.org/4.2.3/data/"
MIRROR_DIR = os.environ.get("BM_CDN_MIRROR")
MIRROR_RECORD = os.environ.get("BM_CDN_RECORD") == "1"
MIRROR_MISSES = []
_MIRROR_MANIFEST = {}
_CT = {".js": "application/javascript", ".css": "text/css",
       ".json": "application/json", ".wasm": "application/wasm",
       ".zip": "application/zip", ".data": "application/octet-stream"}


def _sha256(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def mirror_setup():
    """Load the mirror manifest; on a locked run verify every byte."""
    global _MIRROR_MANIFEST
    mdir = pathlib.Path(MIRROR_DIR)
    mdir.mkdir(parents=True, exist_ok=True)
    mpath = mdir / "manifest.json"
    _MIRROR_MANIFEST = json.loads(mpath.read_text()) if mpath.exists() else {}
    if not MIRROR_RECORD:
        for rel, want in _MIRROR_MANIFEST.items():
            f = mdir / rel
            if not f.exists() or _sha256(f) != want:
                raise SystemExit(f"MIRROR VERIFY FAILED: {rel} missing or hash mismatch — refusing to run")
        print(f"MIRROR locked: {len(_MIRROR_MANIFEST)} files hash-verified under {mdir}", flush=True)
    else:
        print(f"MIRROR record mode: {len(_MIRROR_MANIFEST)} files already mirrored under {mdir}", flush=True)


def _mirror_save_manifest():
    (pathlib.Path(MIRROR_DIR) / "manifest.json").write_text(
        json.dumps(_MIRROR_MANIFEST, indent=1, sort_keys=True))


def mirror_route(route):
    url = route.request.url
    rel = url[len(CDN_PREFIX):].split("?")[0]
    target = pathlib.Path(MIRROR_DIR) / rel
    if rel in _MIRROR_MANIFEST and target.exists():
        route.fulfill(body=target.read_bytes(),
                      content_type=_CT.get(target.suffix, "application/octet-stream"))
        return
    if MIRROR_RECORD:
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp = target.with_suffix(target.suffix + ".part")
        got = subprocess.run(["curl", "-sfL", "--max-time", "180", "-o", str(tmp), url])
        if got.returncode == 0 and tmp.exists() and tmp.stat().st_size > 0:
            tmp.replace(target)
            _MIRROR_MANIFEST[rel] = _sha256(target)
            _mirror_save_manifest()
            print(f"MIRROR recorded {rel} ({target.stat().st_size} bytes, sha256 {_MIRROR_MANIFEST[rel][:12]})", flush=True)
            route.fulfill(body=target.read_bytes(),
                          content_type=_CT.get(target.suffix, "application/octet-stream"))
            return
    MIRROR_MISSES.append(rel)
    print(f"MIRROR-MISS {rel}", flush=True)
    route.abort()


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


class _HeadersHandler(http.server.SimpleHTTPRequestHandler):
    """Serves the repo with the isolation headers vercel.json carries
    on the player paths (COOP same-origin + COEP credentialless on the
    pages, CORP cross-origin + ACAO * on the engine payload), so the
    gate can prove crossOriginIsolated under the repo's own header
    arrangement — the condition the PSP threads path needs. The plain
    gate server sends no such headers, exactly like a preview without
    them; this second server is the deploy checklist, locally."""

    def end_headers(self):
        p = self.path.split("?")[0]
        if p in ("/", "/index.html", "/player.html", "/play-frame.html"):
            self.send_header("Cross-Origin-Opener-Policy", "same-origin")
            self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        if p.startswith("/assets/emulatorjs/"):
            self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
            self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, *args):
        pass


def serve_with_headers(port):
    handler = functools.partial(_HeadersHandler, directory=str(ROOT))
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def boot_player_fixture(page, name, timeout_s=45):
    """The full player's real flow (evening consult test spec): file
    input -> content detection -> play-frame boot. Returns
    (title, canvas signal) once the console reports NOW PLAYING."""
    import time
    page.goto(f"http://127.0.0.1:{PORT}/player.html")
    page.set_input_files("#rom-file", str(FIX / name))
    page.wait_for_selector("#ejs-stage iframe", timeout=15000)
    end = time.time() + timeout_s
    title, sig = "", -1
    while time.time() < end:
        try:
            title = page.inner_text("#console-title")
        except Exception:
            title = ""
        if title.startswith("NOW PLAYING"):
            try:
                sig = canvas_signal(page.frames[-1])
            except Exception:
                sig = -1
            if sig > 5000:
                break
        page.wait_for_timeout(1500)
    return title, sig


def canvas_signal(frame):
    """The extraction's own check: a black frame encodes very small."""
    return frame.evaluate("""() => {
      const c = document.querySelector('canvas');
      if (!c) return -1;
      try { return c.toDataURL().length; } catch (e) { return -2; }
    }""")


def boot_fixture(page, name, timeout_s=45):
    page.goto(f"http://127.0.0.1:{PORT}/index.html")
    page.set_input_files("#file-input", str(FIX / name))
    # PP14: if detection outran the gesture window, the Start button is
    # the flow; a real visitor would click it, so the gate does too.
    try:
        page.locator("#screen button", has_text="Start").click(timeout=3000)
    except Exception:
        pass
    page.wait_for_selector("#screen iframe", timeout=15000)
    frame = page.frame_locator("#screen iframe").locator("body")
    deadline = page.context.new_page  # placeholder to keep linters calm
    import time
    end = time.time() + timeout_s
    sig = -1
    while time.time() < end:
        try:
            sig = canvas_signal(page.frames[-1])
        except Exception:
            sig = -1
        if sig > 5000:
            return sig
        page.wait_for_timeout(1500)
    return sig


def main():
    full = "--full" in sys.argv
    names = GATE + (FULL_EXTRA if full else [])
    httpd = serve()
    results = []
    with sync_playwright() as pw:
        # Environment proxy: some sandboxes route egress through a
        # proxy that curl reads from the env but Chromium does not.
        # Without it the pinned CDN is unreachable from the browser
        # (ERR_TUNNEL_CONNECTION_FAILED) and every boot fails for a
        # reason that has nothing to do with the site.
        proxy = None
        raw = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or os.environ.get("ALL_PROXY")
        if raw:
            if "://" not in raw: raw = "http://" + raw
            u = urllib.parse.urlparse(raw)
            proxy = {"server": f"{u.scheme}://{u.hostname}:{u.port}", "bypass": "127.0.0.1,localhost"}
            if u.username:
                proxy["username"] = urllib.parse.unquote(u.username)
                proxy["password"] = urllib.parse.unquote(u.password or "")
        browser = pw.chromium.launch(args=["--disable-dev-shm-usage"], proxy=proxy)
        # Rotation 142 fix: ONE explicit context for the whole gate.
        # browser.new_page() makes a fresh context per page, so when
        # the boot loop started recycling pages, the recycled pages
        # silently lost the context-level mirror route and every boot
        # after the first failed against the broken tunnel. All pages
        # below come from this context and share its routes.
        context = browser.new_context()
        page = context.new_page()
        cdn_hits = None
        if MIRROR_DIR:
            mirror_setup()
            context.route(CDN_PREFIX + "**", mirror_route)
        else:
            # Bundle proof 2026-10-24: with the engine vendored and the
            # version-ping shim in the play frame, a stage boot must make
            # ZERO requests to the EmulatorJS CDN. Any attempt is aborted
            # (so the boot also proves it survives the block) and counted;
            # the count is asserted after the boot loop.
            cdn_hits = []
            def cdn_block(route):
                cdn_hits.append(route.request.url)
                route.abort()
            context.route(CDN_PREFIX + "**", cdn_block)

        for name in names:
            # One retry per fixture: the pinned CDN flakes through
            # proxies (ERR_TUNNEL_CONNECTION_FAILED seen firsthand on
            # a cold NES boot while eight other cores passed). A retry
            # distinguishes a network flake from a broken boot.
            # Rotation 142: the page is recycled after every fixture
            # and replaced if it crashed — in the first mirror-mode
            # --full run one renderer crash (at the FDS boot) failed
            # five later flows that never got a live page. A crashed
            # page must cost one retry, never the rest of the gate.
            sig, err = -1, None
            for attempt in (1, 2):
                try:
                    sig = boot_fixture(page, name)
                    err = None
                    if sig > 5000:
                        break
                except Exception as e:
                    err = e
                    # Rotation 142, second fix: a CRASHED page is not
                    # is_closed() — the first --full run's FDS boot
                    # crashed the renderer and the retry reused the
                    # dead page, failing the same fixture twice for one
                    # crash. Any exception now costs the page, not just
                    # a closed one: replace it before the retry.
                    try:
                        page.close()
                    except Exception:
                        pass
                    page = context.new_page()
            ok = sig > 5000
            detail = f"canvas signal {sig}" if err is None else f"{type(err).__name__}: {err}"
            results.append((f"boot {name}", ok, detail))
            print(("PASS " if ok else "FAIL ") + f"boot {name}" + " — " + detail, flush=True)
            try:
                page.close()
            except Exception:
                pass
            page = context.new_page()

        if cdn_hits is not None:
            results.append(("zero CDN requests during stage boots", len(cdn_hits) == 0,
                            "none" if not cdn_hits else f"{len(cdn_hits)} attempted, first: {cdn_hits[0]}"))

        # Portable Light download (NES fixture card).
        try:
            if page.is_closed():
                page = context.new_page()
            page.goto("about:blank")
            page.goto(f"http://127.0.0.1:{PORT}/index.html")
            page.set_input_files("#file-input", str(FIX / "fixture-nes.nes"))
            page.wait_for_selector("#queue a[download]", timeout=30000)
            with page.expect_download(timeout=15000) as dl_info:
                page.click("#queue a[download]")
            path = dl_info.value.path()
            text = pathlib.Path(path).read_text(errors="ignore")
            ok = "__BM_" not in text and "BM_ROM_B64" in text and "cdn.emulatorjs.org/4.2.3" in text
            results.append(("portable Light download", ok, f"{len(text)} bytes"))
        except Exception as e:
            results.append(("portable Light download", False, f"{type(e).__name__}: {e}"))

        # Offline edition download (same card, second button).
        try:
            page.wait_for_selector("#queue button", timeout=10000)
            page.click("#queue button:has-text('Offline edition')")
            page.wait_for_selector("#queue a[download][href^='blob:'] >> nth=1", timeout=60000)
            with page.expect_download(timeout=15000) as dl_info:
                page.click("#queue a[download] >> nth=1")
            path = dl_info.value.path()
            text = pathlib.Path(path).read_text(errors="ignore")
            # Bundle reconcile 2026-10-24: one build per core — fceumm's
            # report selects the legacy build, so that is the core file
            # the Offline edition must carry.
            ok = "BM_OFFLINE" in text and "fceumm-legacy-wasm.data" in text and "__BM_" not in text
            results.append(("portable Offline download", ok, f"{len(text)} bytes"))
            offline_html = text if ok else None
        except Exception as e:
            results.append(("portable Offline download", False, f"{type(e).__name__}: {e}"))
            offline_html = None

        # CDN-blocked standalone proof (bundle, 2026-10-24): the built
        # Offline file must actually PLAY with every non-local request
        # aborted — the download checks above only prove the bytes are
        # inside. The file is served from a scratch directory on its own
        # port; any request that is not that origin, a blob:, or a data:
        # URL is aborted and counted.
        if offline_html:
            try:
                import tempfile
                odir = pathlib.Path(tempfile.mkdtemp(prefix="pp-offline-"))
                (odir / "offline.html").write_text(offline_html)
                ohandler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(odir))
                ohttpd = http.server.ThreadingHTTPServer(("127.0.0.1", 8932), ohandler)
                threading.Thread(target=ohttpd.serve_forever, daemon=True).start()
                blocked = []
                octx = browser.new_context()
                def block_route(route):
                    u = route.request.url
                    if u.startswith("http://127.0.0.1:8932/") or u.startswith(("blob:", "data:", "about:")):
                        route.continue_()
                    else:
                        blocked.append(u)
                        route.abort()
                octx.route("**/*", block_route)
                opage = octx.new_page()
                opage.goto("http://127.0.0.1:8932/offline.html")
                import time as _t
                end = _t.time() + 45
                osig = -1
                while _t.time() < end:
                    try:
                        osig = canvas_signal(opage)
                    except Exception:
                        osig = -1
                    if osig > 5000:
                        break
                    opage.wait_for_timeout(1500)
                octx.close()
                ohttpd.shutdown()
                ok = osig > 5000
                results.append(("Offline edition boots standalone, network blocked", ok,
                                f"canvas signal {osig}; blocked requests: {len(blocked)}"
                                + (f" (first: {blocked[0]})" if blocked else "")))
            except Exception as e:
                results.append(("Offline edition boots standalone, network blocked", False, f"{type(e).__name__}: {e}"))

        # PP13 BIOS gate: a game for a BIOS-required system must be
        # stopped before any boot, with the BIOS file named. The gate
        # never supplies BIOS files; "asked first, no boot" is the pass.
        for fix_name, label, bios_needle in BIOS_GATE:
            try:
                if page.is_closed():
                    page = context.new_page()
                page.goto("about:blank")
                page.goto(f"http://127.0.0.1:{PORT}/index.html")
                page.set_input_files("#file-input", str(FIX / fix_name))
                page.wait_for_selector("#queue .q-card", timeout=15000)
                text = page.inner_text("#queue")
                has_iframe = page.locator("#screen iframe").count() > 0
                ok = ("BIOS" in text and bios_needle in text) and not has_iframe
                results.append((f"PP13 BIOS gate ({label})", ok, "asked first, no boot" if ok else text[:120]))
            except Exception as e:
                results.append((f"PP13 BIOS gate ({label})", False, f"{type(e).__name__}: {e}"))

        # Evening consult (2026-10-24): the full player boots through
        # the same frame as the stage. Boot the consult's two named
        # fixtures on player.html and assert the state reaches
        # "playing" (the console title), the canvas is alive, and NO
        # request fails — a failed request is a requestfailed event
        # or an HTTP 4xx/5xx response, CDN attempts included.
        for name in ("fixture-nes.nes", "rkanoid-latest-demo.gba"):
            ppage = context.new_page()
            bad_reqs = []
            ppage.on("requestfailed", lambda r: bad_reqs.append(r.url + " :: " + str(r.failure)))
            ppage.on("response", lambda r: bad_reqs.append(r.url + " :: HTTP " + str(r.status)) if r.status >= 400 else None)
            try:
                title, sig = boot_player_fixture(ppage, name)
                ok = title.startswith("NOW PLAYING") and sig > 5000 and not bad_reqs
                results.append((f"player boots {name} in the frame, no failed requests", ok,
                                f"title {title!r}, canvas signal {sig}" +
                                ("" if not bad_reqs else f", failed: {bad_reqs[:3]}")))
            except Exception as e:
                results.append((f"player boots {name} in the frame, no failed requests", False, f"{type(e).__name__}: {e}"))
            finally:
                try:
                    ppage.close()
                except Exception:
                    pass

        # Phone flow: a coarse-pointer context must get the touch pad
        # inside the frame (the consult's pad, driven here with a real
        # tap on the A button, spying on the engine's simulateInput).
        try:
            phone_ctx = browser.new_context(viewport={"width": 390, "height": 844},
                                            has_touch=True, is_mobile=True)
            ph = phone_ctx.new_page()
            title, sig = boot_player_fixture(ph, "fixture-nes.nes")
            frame = [f for f in ph.frames if "play-frame" in f.url][0]
            pad_ok = frame.evaluate("""() => !!(
              window.PP_PAD && document.querySelector('.pp-pad') &&
              document.querySelector('.pp-dpad'))""")
            frame.evaluate("""() => {
              window.__ppPresses = [];
              const gm = window.EJS_emulator.gameManager;
              const orig = gm.simulateInput.bind(gm);
              gm.simulateInput = (p, n, v) => { window.__ppPresses.push([n, v]); return orig(p, n, v); };
            }""")
            box = ph.frame_locator("#ejs-stage iframe").locator(".pp-btn", has_text="A").first.bounding_box()
            ph.touchscreen.tap(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            ph.wait_for_timeout(400)
            presses = frame.evaluate("() => window.__ppPresses")
            tap_ok = [8, 1] in presses and [8, 0] in presses
            results.append(("phone touch pad mounts in the frame and a tap reaches simulateInput",
                            bool(pad_ok and tap_ok and title.startswith("NOW PLAYING")),
                            f"pad {pad_ok}, presses {presses}"))
            phone_ctx.close()
        except Exception as e:
            results.append(("phone touch pad mounts in the frame and a tap reaches simulateInput",
                            False, f"{type(e).__name__}: {e}"))

        browser.close()

    # Deploy checklist, locally: crossOriginIsolated under the repo's
    # own headers (the arrangement vercel.json ships), in the player
    # page AND inside the play frame — the PSP threads precondition.
    hhttpd = serve_with_headers(8933)
    try:
        with sync_playwright() as pw:
            hbrowser = pw.chromium.launch(args=["--disable-dev-shm-usage"])
            hpage = hbrowser.new_page()
            hpage.goto("http://127.0.0.1:8933/player.html")
            iso_page = hpage.evaluate("() => window.crossOriginIsolated === true")
            hpage.set_input_files("#rom-file", str(FIX / "fixture-nes.nes"))
            hpage.wait_for_selector("#ejs-stage iframe", timeout=15000)
            hpage.wait_for_function(
                "() => document.querySelector('#console-title').textContent.startsWith('NOW PLAYING')",
                timeout=45000)
            hframe = [f for f in hpage.frames if "play-frame" in f.url][0]
            iso_frame = hframe.evaluate("() => window.crossOriginIsolated === true")
            results.append(("crossOriginIsolated under the repo's own headers (page + frame)",
                            bool(iso_page and iso_frame), f"page {iso_page}, frame {iso_frame}"))
            hbrowser.close()
    except Exception as e:
        results.append(("crossOriginIsolated under the repo's own headers (page + frame)",
                        False, f"{type(e).__name__}: {e}"))
    hhttpd.shutdown()
    httpd.shutdown()
    failed = 0
    for name, ok, detail in results:
        if not name.startswith("boot "):
            print(("PASS " if ok else "FAIL ") + name + " — " + str(detail), flush=True)
        failed += 0 if ok else 1
    print(f"\n{len(results) - failed} passed, {failed} failed")
    if MIRROR_MISSES:
        print("MIRROR-MISS files (no mirrored bytes; flows needing them failed honestly): "
              + ", ".join(sorted(set(MIRROR_MISSES))))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
