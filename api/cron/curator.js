/* GET /api/cron/curator — weekly Curator watch (spec §7.7).
   Schedule: Mondays 0 10 * * 1 UTC (Vercel Cron, production only).
   Bounded incremental refresh: fetch emulator release Atom feeds + itch
   homebrew feeds in parallel (4s each), diff against the stored watch state
   (api/v1/curator-watch.json), commit on change via the GitHub Contents API.
   Fits the 10s function budget: feeds race in parallel; the commit is skipped
   if the remaining budget is too small (next run retries — idempotent).

   COMMIT-BACK NOTE (open decision, pending user): the fine-grained PAT
   (GITHUB_REPO_TOKEN, contents:write on this repo) is not set up yet. Until
   it is, this job degrades gracefully to READ-ONLY: it still checks every
   feed and returns the fresh diff in its response envelope, but persists
   nothing (committed:false, read_only:true). No crash, no fake "committed".

   New releases are TRACKED, never auto-published: the repo's convention is
   human review (pipeline/review_queue.json) before anything enters the
   catalog — a cron never invents catalog entries (§6). itch.io bot-gates its
   feeds (HTTP 403, verified 2026-10-11); a gated feed is recorded as a
   failed source, not as "no new games".

   Response data: { checked, changed, committed, read_only, emulator_updates[],
                     homebrew_new[], files, note }
   Cache: no-store. 60s duplicate-delivery cooldown. */
"use strict";

const path = require("path");
const { ok, err } = require("../../lib/envelope");
const { assertCron, secretConfigured } = require("../../lib/cronauth");
const { fetchTimeout } = require("../../lib/fetchx");
const github = require("../../lib/github");

const SERVICE = "mash-curator";
const VERSION = "1.0.0";
const WATCH_FILE = "api/v1/curator-watch.json";
const BUDGET_MS = 9500; // hard stop before Vercel's 10s timeout
const WRITE_RESERVE_MS = 3000; // skip commit if less remains

// Same source lists as the repo's pipeline watchers (bounded, RSS/Atom only).
const EMULATOR_FEEDS = [
  ["EmulatorJS", "https://github.com/EmulatorJS/EmulatorJS/releases.atom"],
  ["RetroArch", "https://github.com/libretro/RetroArch/releases.atom"],
  ["mGBA", "https://github.com/mgba-emu/mgba/releases.atom"],
  ["DuckStation", "https://github.com/stenzek/duckstation/releases.atom"],
  ["PCSX2", "https://github.com/PCSX2/pcsx2/releases.atom"],
  ["PPSSPP", "https://github.com/hrydgard/ppsspp/releases.atom"],
];
const ITCH_FEEDS = [
  ["itch-newest-html5", "https://itch.io/games/newest/html5-free/feed"],
  ["itch-feed", "https://itch.io/feed"],
];

// Last-run per job path (duplicate-delivery protection, §4.3).
const lastRun = new Map();

// Minimal Atom/RSS entry parse: [{ title, url, published }]. Never throws.
function parseFeed(xml) {
  const out = [];
  const entryRe = /<(?:a:)?entry[\s>][\s\S]*?<\/(?:a:)?entry>|<item[\s>][\s\S]*?<\/item>/gi;
  let m;
  while ((m = entryRe.exec(xml)) !== null && out.length < 10) {
    const block = m[0];
    const title = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
    const href = (block.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || "";
    const linkTag = (block.match(/<link>([^<]+)<\/link>/i) || [])[1] || "";
    const updated =
      (block.match(/<(?:a:)?updated[^>]*>([^<]+)<\/(?:a:)?updated>/i) || [])[1] ||
      (block.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i) || [])[1] ||
      "";
    const clean = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    if (title || href || linkTag) {
      out.push({ title: clean(title), url: href || clean(linkTag), published: clean(updated) });
    }
  }
  return out;
}

function loadWatchState() {
  try {
    const full = path.join(__dirname, "..", "v1", "curator-watch.json");
    delete require.cache[require.resolve(full)];
    return { ok: true, state: require(full) };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

function repoPath() {
  return (process.env.REPO_STATIC_PREFIX || "") + WATCH_FILE;
}

module.exports = async (req, res) => {
  const t0 = Date.now();
  const requestId = "req_" + t0.toString(16).slice(-6);

  if (!assertCron(req)) {
    // Fail closed: missing/wrong secret -> 401 (§8.3). Never hint which.
    if (!secretConfigured()) console.log("[cron] curator fail stage=auth error=CRON_SECRET not configured request_id=" + requestId);
    return err(res, SERVICE, VERSION, 401, "UNAUTHORIZED",
      "This endpoint runs on a schedule with a bearer secret; direct calls are not allowed.", null);
  }

  const now = Date.now();
  if (lastRun.has("curator") && now - lastRun.get("curator") < 60000) {
    return ok(res, SERVICE, VERSION, { duplicate: true, note: "Duplicate cron delivery inside the 60s cooldown window; not re-run." }, { source: "live", cache: "none" });
  }
  lastRun.set("curator", now);
  console.log("[cron] curator start request_id=" + requestId);

  const budgetLeft = () => BUDGET_MS - (Date.now() - t0);
  const checkedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  // 1. Baseline: the committed watch state (deployment bundle == last commit).
  const baseline = loadWatchState();
  const prevFeeds = (baseline.ok && baseline.state && baseline.state.feeds) || {};
  const firstRun = !baseline.ok || Object.keys(prevFeeds).length === 0;

  // 2. Fetch all feeds in parallel, 4s each. Partial success is normal.
  const jobs = EMULATOR_FEEDS.concat(ITCH_FEEDS).map(async ([name, feedUrl]) => {
    const r = await fetchTimeout(feedUrl, { timeoutMs: 4000 });
    if (!r.ok) {
      console.log("[upstream] " + name + " fail error=" + r.error + " latency_ms=" + r.ms);
      return { name: name, url: feedUrl, ok: false, error: r.error, ms: r.ms, entries: [] };
    }
    return { name: name, url: feedUrl, ok: true, error: null, ms: r.ms, entries: parseFeed(r.text) };
  });
  const results = await Promise.allSettled(jobs);
  const feeds = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { name: EMULATOR_FEEDS.concat(ITCH_FEEDS)[i][0], ok: false, error: "internal: " + String(r.reason), ms: 0, entries: [] }
  );

  // 3. Merge: diff latest-seen release per feed vs baseline.
  const emulatorNames = new Set(EMULATOR_FEEDS.map(([n]) => n));
  const emulator_updates = [];
  const homebrew_new = [];
  const newFeeds = {};
  let anyOk = false;
  for (const f of feeds) {
    const prev = prevFeeds[f.name] || {};
    const latest = f.entries[0] || null;
    newFeeds[f.name] = {
      url: f.url,
      latest_title: latest ? latest.title : prev.latest_title || null,
      latest_url: latest ? latest.url : prev.latest_url || null,
      latest_published: latest ? latest.published : prev.latest_published || null,
      checked_at: checkedAt,
      ok: f.ok,
      error: f.ok ? null : f.error,
    };
    if (f.ok) anyOk = true;
    // A release counts as an "update" only when it differs from the last
    // stored one (never on the first baseline run — that's not "new").
    if (!firstRun && f.ok && latest && latest.url && latest.url !== prev.latest_url) {
      const item = { feed: f.name, title: latest.title, url: latest.url, published: latest.published || null };
      if (emulatorNames.has(f.name)) emulator_updates.push(item);
      else homebrew_new.push(item);
    }
  }

  const newState = {
    name: "Button Mash curator watch",
    version: "1.0.0",
    generated_at: checkedAt,
    note: "Latest-seen releases per watched feed. New releases are tracked here for human review; the catalog is never auto-edited.",
    feeds: newFeeds,
  };

  // 4. Commit on change — or degrade to read-only when the PAT is pending.
  let changed = firstRun;
  if (!firstRun) {
    const prevCanon = JSON.stringify(Object.keys(newFeeds).sort().map((k) => [k, prevFeeds[k].latest_url]));
    const nextCanon = JSON.stringify(Object.keys(newFeeds).sort().map((k) => [k, newFeeds[k].latest_url]));
    changed = prevCanon !== nextCanon;
  }
  let committed = false;
  let commitSha = null;
  let readOnly = false;
  let commitReason = null;
  const files = {};

  if (changed && github.isConfigured() && budgetLeft() > WRITE_RESERVE_MS) {
    const w = await github.writeJsonIfChanged(repoPath(), newState, "curator: refresh emulator/homebrew watch state");
    committed = w.committed;
    commitSha = w.sha;
    commitReason = w.reason;
  } else if (changed && !github.isConfigured()) {
    readOnly = true;
    commitReason = "read-only: GITHUB_REPO_TOKEN not configured (fine-grained PAT pending user decision); watch state computed but not persisted";
  } else if (changed) {
    commitReason = "budget: commit skipped, under 3s of function budget remained; next run retries (idempotent)";
  }
  files[WATCH_FILE] = { changed: changed, committed: committed, sha: commitSha, reason: commitReason };

  const sourcesOk = feeds.filter((f) => f.ok).length;
  const upstream = feeds.map((f) => ({
    source: f.name,
    ok: f.ok,
    checked_at: checkedAt,
    latency_ms: f.ok ? f.ms : undefined,
    error: f.ok ? undefined : f.error,
  }));
  const degraded = !anyOk || readOnly || sourcesOk < feeds.length;
  const note = readOnly
    ? "Commit-back is disabled until the user approves the GitHub fine-grained PAT: this run checked " + sourcesOk + "/" + feeds.length + " feeds and returned the fresh diff, but persisted nothing."
    : sourcesOk < feeds.length
      ? "Some feeds were unreachable (" + sourcesOk + "/" + feeds.length + " ok); tracked state updated for the reachable ones."
      : null;

  console.log("[cron] curator done changed=" + changed + " committed=" + (commitSha || false) +
    " read_only=" + readOnly + " sources_ok=" + sourcesOk + "/" + feeds.length + " request_id=" + requestId);

  return ok(res, SERVICE, VERSION, {
    checked: feeds.length,
    changed: changed,
    committed: committed,
    commit_sha: commitSha,
    read_only: readOnly,
    emulator_updates: emulator_updates,
    homebrew_new: homebrew_new,
    files: files,
    note: note,
  }, {
    source: "live",
    degraded: degraded,
    staleSince: degraded ? checkedAt : null,
    upstream: upstream,
    note: note,
    cache: "none",
  });
};
