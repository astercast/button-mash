# GO_LIVE — Button Mash ("The Curator")

> **LIVE-READY, NOT DEPLOYED.** Do not connect Vercel until the user approves.
> Nothing here is deployed; the next step after user review is the hookup
> below, then "I'm happy" means it goes live.

## 1. What deploys

One Vercel project serving this repo: **static frontend + 5 serverless
functions** (Node, zero npm dependencies, `nodejs22.x`) **+ 1 weekly cron**.

Functions (`api/` — one file = one route):

| method | path | file | purpose |
|---|---|---|---|
| GET | `/api/health` | `api/health.js` | status, function roster, freshness, checks (§1.4) |
| GET | `/api/games` | `api/games.js` | catalog + live enrichment (`?genre= ?q= ?players= ?system= ?limit=`) |
| GET | `/api/collections` | `api/collections.js` | 22 collections, ids resolved to real titles/URLs |
| POST | `/api/game-night` | `api/game-night.js` | stateless game-night engine (group size/time/vibe → lineup) |
| GET | `/api/cron/curator` | `api/cron/curator.js` | weekly emulator/itch watch → commits `api/v1/curator-watch.json` |

Static fallbacks (served as-is, never functions): `api/v1/*.json`
(`games.json`, `collections.json`, `kid-safe.json`, `curator-watch.json`, …).
Frontend contract: every dynamic widget calls `/api/*` first with a 7s
timeout and falls back to the static file — the site never looks broken
when functions are cold or down (`assets/js/api-client.js`, spec §3).

Architecture spec: `~/workspace/server-program/ARCHITECTURE.md`
(service `mash-curator`, §7.7). This spec wins over older repo notes.

## 2. Prerequisites

- [ ] This repo pushed to GitHub (`astercast/button-mash`, private).
- [ ] Vercel account access (the user's account).
- [ ] Secrets generated locally (never committed):
  - `CRON_SECRET` — 32+ random hex chars:
    `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - `GITHUB_REPO_TOKEN` — fine-grained PAT, **contents:write on
    `astercast/button-mash` only**, no other scopes. (Still pending the
    user's decision — see §7 note: without it the cron degrades to
    read-only and static JSON updates only via the wave engine's pushes.)

## 3. Hookup steps (exact clicks)

1. **vercel.com/new** → Import Git Repository → select `astercast/button-mash`.
2. Framework Preset: **Other**.
   - Build Command: `python3 scripts/build.py` (pinned + timed: 0.54s, <60s).
   - Output Directory: `.` (repo root).
   - Install Command: `echo 'no dependencies'`.
3. Environment Variables (Production scope):
   `CRON_SECRET`, `GITHUB_REPO_TOKEN`, `GITHUB_REPO=astercast/button-mash`,
   `REPO_STATIC_PREFIX=` (empty — output is the repo root).
4. **Build machine: Standard.** Settings → Build & Deployment → Build
   Machine → **Standard**. **Never Turbo** — September 2026 Turbo CPU
   billed **$38.64** (invoice 1ZU1WJJS-0012). Turbo buys nothing on a
   static site; the build takes under a second.
5. Deploy. Open `/api/health` — assert `"status": "ok"` and the `functions`
   list matches the 5 files in §1.
6. Dashboard → Cron Jobs — assert `/api/cron/curator` is listed with
   schedule `0 10 * * 1` (Mondays, UTC). Trigger it once manually
   (Functions → ⋯ → Test) with the secret; check the `[cron]` log lines.
7. `curl` the roster and assert the envelope schema:
   `BASE=https://<project>.vercel.app ./tests/api.test.sh`
8. Disable test: block `/api/*` (or stop functions) → reload `games.html`
   and `party-planner.html` → assert the directory renders all 213 games and
   the lineup widget works, both with honest "cached · updated HH:MM" badges.

## 4. Env var table

| name | required? | where set | rotation notes |
|---|---|---|---|
| `CRON_SECRET` | yes | Vercel → Project → Settings → Environment Variables (Production) | 32+ hex chars; Vercel auto-sends it as `Authorization: Bearer` on cron invocations. Rotate by generating a new value and redeploying; cron 401s until both sides match. Never in URLs or the repo. |
| `GITHUB_REPO_TOKEN` | for cron writes | same as above | Fine-grained PAT, contents:write on `astercast/button-mash` only. Without it the cron degrades to read-only (computes the diff, persists nothing, `degraded: true`). Rotate in GitHub → Settings → Developer settings → PATs, then update the env var. |
| `GITHUB_REPO` | yes | same as above | `astercast/button-mash` — the repo the cron commits to. |
| `REPO_STATIC_PREFIX` | yes | same as above | Empty string for this repo (output is the repo root). Lets `lib/github.js` work unchanged on `site/`-output repos. |

## 5. Hobby limits table

| resource | Hobby limit | our usage |
|---|---|---|
| Bandwidth | 100 GB/mo | static + small JSON; personal-use sites ≈ MBs |
| Build minutes | 6,000/mo | seconds per deploy; daily cron redeploys ≈ negligible |
| Function invocations | 100k/mo | edge cache absorbs reads (§1.6); ~1 cron + trickle |
| Function duration | 10s default (Hobby) | all functions designed ≤10s; no `maxDuration` overrides |
| Cron jobs | daily minimum cadence, UTC, ±60min window, prod only | 1 job/site, staggered (`0 10 * * 1` Mondays for this repo) |
| Overage billing | **none — usage pauses instead of charging** | design stays far under limits; a pause is a visible signal, not a bill |

## 6. Cold-start behavior

- First hit after idle: **1–3s typical** on Hobby (function instance boots,
  reads the bundled static JSON, answers).
- The client gives the function **7 seconds** (`LIVE_TIMEOUT_MS` in
  `assets/js/api-client.js`). A cold function usually wins the race; one
  that misses it falls back cleanly — the user saw a complete page the
  whole time.
- While the live fetch is in flight the badge reads **"waking server…"**
  over the already-rendered static content; it flips to **"live"** when the
  function answers, or **"cached · updated HH:MM"** on timeout.
- If the first hit ever exceeds 10s the 7s client timeout always loses —
  investigate (that budget is the §12.4 gate; warm hits must be <1s).
- Wave B local verification (2026-10-11): harness cold first-hit 0.066s
  (fresh process, first require) / warm 0.003s. Vercel infra cold-start
  (container boot, typically 1–3s) was simulated with a 2.5s function delay:
  the "waking server…" badge showed over the complete static page, then
  live-updated to "live" when the function answered. True infra cold-start
  is re-measured on the preview deploy (§12.4).

## 7. Cron behavior

- **Schedule:** `0 10 * * 1` UTC — Mondays, 10:00–11:00 UTC window.
  Hobby minimum cadence is daily; weekly is well within it.
- **What it does:** checks 6 emulator release Atom feeds + 2 itch.io homebrew
  feeds (4s per-source timeout, parallel), diffs against
  `api/v1/curator-watch.json`, commits on change via the GitHub Contents
  API (content-hash — no change, no commit, no redeploy). New releases are
  tracked for human review, never auto-published to the catalog.
- **Idempotent:** duplicate Vercel deliveries inside 60s return
  `{duplicate: true}` without re-running; GitHub write conflicts retry once
  on SHA mismatch, then return `committed: false, reason: "conflict"`.
- **Fail-closed:** no `CRON_SECRET` configured → 401, no refresh runs.
  No `GITHUB_REPO_TOKEN` → read-only degrade (computes + returns the fresh
  diff, persists nothing, `degraded: true` + human note).
- **Alerting is logs only:** `[cron] curator start …`,
  `[cron] curator done changed=… committed=… sources_ok=…`,
  `[cron] curator fail stage=… error=…`, `[upstream] <source> fail …`.
  Every wave's checklist includes "read last 7 days of `[cron]` lines;
  every run accounted for". **A cron job that hasn't logged in 48h is
  itself the alert.**

## 8. Custom domain notes

- Add in Vercel dashboard → Domains; the `/api/*` paths move with the
  domain automatically (same-origin by design, no CORS config).
- If a domain is assigned later, sweep absolute URLs: `llms.txt` header,
  `sitemap.xml`, and the envelope `$id` in `api/v1/schema/envelope.json`.

## 9. Rollback

- `git revert` the offending commit → push → Vercel redeploys the previous
  good state. Functions are stateless; there is no data migration and no
  database to unwind.
- The static `api/v1/*.json` files are the store — reverting the commit
  reverts the data atomically with the code.
- If a bad cron commit lands, revert that commit; the next weekly run (or
  the wave engine) re-derives from the corrected files.

## 10. Cost rules

September 2026 invoice 1ZU1WJJS-0012: **$38.64** of Turbo build CPU across
the user's projects. Standing rule:

- **Build machine: Standard. Never Turbo.** Vercel dashboard → Project →
  Settings → Build & Deployment → Build Machine → **Standard**. Turbo is
  what billed $38.64; these are static sites with near-instant builds —
  Turbo buys nothing.
- `installCommand`: `echo 'no dependencies'` — zero npm packages, nothing
  to install, builds stay seconds-long.
- Static builds are the only builds. Function bundling is part of the
  static build (no separate build minutes).
- If this site approaches 80% of any Hobby limit, the wave report flags it
  and the fix is *less* work (longer edge TTL, smaller payloads) — never a
  plan upgrade without the user's explicit word.

## 11. Two-track deploy (2026-10-11 — one-time CLI deploy)

- **This repo (`astercast/button-mash`) is NEVER deployed.** It is the
  working repo: the wave engine builds here continuously. Nothing here is
  connected to Vercel, and pushing here never deploys anything.
- The deploy target is the release repo **`astercast/button-mash-live`** —
  a one-time static snapshot (frontend + `api/` functions + `lib/` +
  `data/` + adapted `vercel.json`, no build scripts, no dev notes).
- **One-time CLI deploy; no git integration; future work is GitHub-only.**
  Deploy happens once via Vercel CLI from a local `-live` clone. Never
  connect the working repo to Vercel, never enable Vercel's GitHub
  integration on either repo (it can never auto-deploy).
- After the first snapshot push, **never push to `-live` again** unless the
  user explicitly says "push"/"ship it" in chat. Before every push, verify
  the remote URL matches the intended track; when in doubt, stop and ask.
