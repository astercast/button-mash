# GO_LIVE — Button Mash

Deployment target: **GitHub Pages from this repo**. GitHub-only, **no Vercel** — standing rule, all seven sites are GitHub-only.

> Note: the repo is currently **private**. GitHub Pages requires a public repo (or GitHub Enterprise). **Get the user's call before flipping visibility** — do not make it public unilaterally.

## Pre-launch checklist

- [ ] Visibility decision: keep private + serve some other static way, or flip to public for Pages. **User's call.**
- [ ] Run `python3 scripts/build.py` — must print `BUILD OK` with 0 validation errors.
- [ ] Run `python3 scripts/check_links.py` — must print `LINK CHECK OK`, 0 broken.
- [ ] `node --check assets/js/*.js` — all pass.
- [ ] `python3 -m http.server` → open `index.html`: game-of-day renders, genre sampler renders, counts match (89 games, 8 guides, 10 collections).
- [ ] Open `games.html`: search + genre chips + favorites filter + random game all work; result count updates.
- [ ] Open `player.html`: drop veil renders; system dropdown populated; (with a user-supplied file) core boots — needs a real browser check, cannot be verified headless.
- [ ] Open `converter.html`: drop a test .gba-sized file; template tokens replace; download triggers. (Real conversion needs a real browser.)
- [ ] Open 2 guide pages — checklists toggle and persist; more-guides links work.
- [ ] Mobile check (DevTools 390px): filters stack above cards, cards single-column, header wraps.
- [ ] Keyboard check: tab through chips (aria-pressed toggles), skip link works, modal traps focus sensibly.
- [ ] `prefers-reduced-motion`: no transitions/animations (CSS handles it; verify).
- [ ] Confirm: no secrets, no personal data, no real names anywhere in the repo.
- [ ] Confirm: no ROM/piracy/cracked-game links anywhere — `grep -riE "rom.*download|emuparadise|vimm|steamunlock" --include="*" .` returns nothing.

## Launch steps (GitHub Pages)

1. Repo Settings → Pages → Deploy from branch → `main` → `/ (root)`.
2. Wait for the Pages build; visit the `*.github.io/button-mash/` URL.
3. Verify: `index.html` loads `api/v1/games.json` via fetch — same-origin, works on Pages.
4. Record the live URL in `WAVELOG.md`.

## Rollback

Static site, single branch — rollback is `git revert` + push. No database, no migrations, nothing to unwind.

## Post-launch

- Add the live URL to `README.md` and `llms.txt` header.
- Announce in the wave report; the wave engine picks up content waves from `PIPELINE.md`.
