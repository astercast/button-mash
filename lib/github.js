/* github.js, cheap storage via the GitHub Contents API (spec §1.11, §5).
   The repo is the database: cron jobs commit versioned JSON here; functions
   read the same files. readJson() reads; writeJsonIfChanged() commits only
   when content changed (content-hash commits, SHA-mismatch retry).

   Env: GITHUB_REPO ("owner/name"), GITHUB_REPO_TOKEN (fine-grained PAT,
   contents:write on this repo only), REPO_STATIC_PREFIX ("site/" or "").

   IMPORTANT (open decision, 2026-10-11): the fine-grained PAT for commit-back
   is still PENDING the user's decision. Callers must treat a missing token
   as a supported read-only mode, not a crash: isConfigured() lets the cron
   degrade gracefully (compute + return fresh data, persist nothing) until the
   token exists. Never log or return the token value.

   Copy verbatim between the 7 server-program repos; do not fork behavior. */
"use strict";

const crypto = require("crypto");
const { fetchTimeout } = require("./fetchx");

const TIMEOUT_MS = 8000;

function isConfigured() {
  return (
    typeof process.env.GITHUB_REPO_TOKEN === "string" &&
    process.env.GITHUB_REPO_TOKEN.length > 0 &&
    typeof process.env.GITHUB_REPO === "string" &&
    process.env.GITHUB_REPO.length > 0
  );
}

function apiBase() {
  return "https://api.github.com/repos/" + process.env.GITHUB_REPO + "/contents/";
}

function authHeaders() {
  return {
    Authorization: "Bearer " + process.env.GITHUB_REPO_TOKEN,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Canonical bytes: sorted keys, 2-space indent, trailing newline.
function canonical(obj) {
  return JSON.stringify(sortKeys(obj), 2) + "\n";
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const out = {};
    Object.keys(v)
      .sort()
      .forEach((k) => {
        out[k] = sortKeys(v[k]);
      });
    return out;
  }
  return v;
}

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

// GET a repo path. Returns { found, sha, content (parsed JSON or null), raw }.
async function readJson(repoPath) {
  const r = await fetchTimeout(apiBase() + encodeURIComponent(repoPath).replace(/%2F/g, "/"), {
    timeoutMs: TIMEOUT_MS,
    headers: authHeaders(),
  });
  if (!r.ok) {
    if (r.status === 404) return { found: false, sha: null, content: null, raw: null };
    throw new Error("github read failed: " + (r.error || "http " + r.status));
  }
  let body;
  try {
    body = JSON.parse(r.text);
  } catch (e) {
    throw new Error("github read: invalid JSON response");
  }
  const raw = Buffer.from(body.content || "", "base64").toString("utf8");
  let content = null;
  try {
    content = JSON.parse(raw);
  } catch (e) {
    content = null; // file exists but is not JSON; caller decides
  }
  return { found: true, sha: body.sha, content: content, raw: raw };
}

// PUT the file only when canonical content differs. Idempotent.
// Returns { committed, sha, changed, reason }.
async function writeJsonIfChanged(repoPath, obj, message) {
  if (!isConfigured()) {
    return { committed: false, sha: null, changed: false, reason: "no-token" };
  }
  const desired = canonical(obj);
  const desiredHash = sha256(desired);

  let cur;
  try {
    cur = await readJson(repoPath);
  } catch (e) {
    return { committed: false, sha: null, changed: false, reason: "read-failed: " + e.message };
  }
  if (cur.found && cur.raw !== null && sha256(cur.raw) === desiredHash) {
    return { committed: false, sha: cur.sha, changed: false, reason: "unchanged" };
  }
  if (cur.found && cur.raw !== null && cur.raw === desired) {
    return { committed: false, sha: cur.sha, changed: false, reason: "unchanged" };
  }

  const put = async (sha) => {
    const payload = JSON.stringify({
      message: message,
      content: Buffer.from(desired, "utf8").toString("base64"),
      sha: sha || undefined,
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(apiBase() + encodeURIComponent(repoPath).replace(/%2F/g, "/"), {
        method: "PUT",
        signal: ctrl.signal,
        headers: Object.assign(authHeaders(), { "Content-Type": "application/json" }),
        body: payload,
      });
      const text = await r.text();
      let body = null;
      try {
        body = JSON.parse(text);
      } catch (e) { /* fallthrough */ }
      if (r.status === 409 || r.status === 422) return { conflict: true, body: body };
      if (!r.ok) return { httpError: "http " + r.status + " " + String(text).slice(0, 200) };
      return { conflict: false, sha: body && body.content ? body.content.sha : null };
    } catch (e) {
      return { httpError: String((e && e.message) || e).slice(0, 200) };
    } finally {
      clearTimeout(timer);
    }
  };

  let attempt = await put(cur.found ? cur.sha : null);
  if (attempt.conflict) {
    // SHA mismatch: re-read once, retry once, then give up honestly.
    try {
      cur = await readJson(repoPath);
    } catch (e) {
      return { committed: false, sha: null, changed: false, reason: "conflict-reread-failed" };
    }
    if (cur.found && cur.raw !== null && sha256(cur.raw) === desiredHash) {
      return { committed: false, sha: cur.sha, changed: false, reason: "unchanged-after-reread" };
    }
    attempt = await put(cur.found ? cur.sha : null);
    if (attempt.conflict) {
      return { committed: false, sha: null, changed: false, reason: "conflict" };
    }
  }
  if (attempt.httpError) {
    return { committed: false, sha: null, changed: false, reason: "write-failed: " + attempt.httpError };
  }
  return { committed: true, sha: attempt.sha, changed: true, reason: "committed" };
}

module.exports = { isConfigured, readJson, writeJsonIfChanged, canonical };
