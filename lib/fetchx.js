/* fetchx.js, bounded upstream fetch (spec §1.11).
   All upstream calls go through this. Default 4000ms timeout.
   Returns { ok, status, text, ms, error }. Never throws.
   Copy verbatim between the 7 server-program repos; do not fork behavior. */
"use strict";

const UA = "mash-curator/1.0.0 (Button Mash server-side fetch; RSS/Atom only)";

async function fetchTimeout(url, opts) {
  opts = opts || {};
  const timeoutMs = opts.timeoutMs || 4000;
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: Object.assign(
        { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.1" },
        opts.headers || {}
      ),
    });
    const text = await r.text();
    const ms = Date.now() - t0;
    if (!r.ok) return { ok: false, status: r.status, text: "", ms: ms, error: "http " + r.status };
    return { ok: true, status: r.status, text: text, ms: ms, error: null };
  } catch (e) {
    const ms = Date.now() - t0;
    const msg = e && e.name === "AbortError" ? "timeout after " + timeoutMs + "ms" : String((e && e.message) || e);
    return { ok: false, status: 0, text: "", ms: ms, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchTimeout, USER_AGENT: UA };
