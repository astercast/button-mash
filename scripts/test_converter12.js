/* Wave 12 pinned fixtures: Converter 3.0 core logic.
   Run: node scripts/test_converter12.js   (exit 0 = all pass)

   Negative fixtures: wave 8's rejected boot-test candidates (mystic_q.gba,
   Ducker's PD arkanoid — zeroed cartridge-header regions, likely multiboot
   images) were not retained on disk, so this suite synthesizes files with the
   same failure modes, plus the real tests/homebrew-test-roms/rkanoid-latest-
   demo.gba as the positive control: it REALLY has a zeroed header (per the
   wave-8 README) and mGBA boots such ROMs — so validation must warn, never
   error, on it. That distinction is the honesty contract under test. */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const C = require(path.join(ROOT, "assets/js/converter-core.js"));
const pako = require(path.join(ROOT, "assets/vendor/pako.min.js"));

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("PASS", name, "—", detail || ""); }
  else { fail++; console.error("FAIL", name, "—", detail || ""); }
}
function rnd(n, seed) { /* deterministic PRNG for fixtures */
  const b = Buffer.alloc(n); let s = seed >>> 0;
  for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; b[i] = s & 0xff; }
  return b;
}
const U = (buf) => new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

/* ---------- 1. format detection ---------- */
check("detect .gba", C.profileFor("game.gba").key === "gba", "mGBA");
check("detect .GBA (case)", C.profileFor("GAME.GBA").key === "gba", "case-insensitive");
check("detect .gb", C.profileFor("game.gb").key === "gb", "Gambatte");
check("detect .gbc", C.profileFor("game.gbc").key === "gb", "same core family");
check("detect .nes", C.profileFor("game.nes").key === "nes", "FCEUmm");
check("detect .sfc", C.profileFor("game.sfc").key === "snes", "Snes9x");
check("detect .smc", C.profileFor("game.smc").key === "snes", "copier-headered");
check("detect .md", C.profileFor("game.md").key === "segamd", "Genesis Plus GX");
check("detect .gen", C.profileFor("game.gen").key === "segamd", "alt extension");
check("reject .zip", C.profileFor("game.zip") === null, "points at Player");
check("reject .sfc-like .smd", C.profileFor("game.smd") === null, "interleaved format not claimed");
check("reject .bin", C.profileFor("game.bin") === null, "too generic to trust");
check("reject .iso", C.profileFor("game.iso") === null, "PSX not claimed");
check("reject no extension", C.profileFor("game") === null, "no guessing");
check("five profiles", Object.keys(C.PROFILES).length === 5, Object.keys(C.PROFILES).join(","));

/* ---------- 2. validation ---------- */
// 2a. the real homebrew file: zeroed header, must WARN not ERROR
const rkanoidPath = path.join(ROOT, "tests/homebrew-test-roms/rkanoid-latest-demo.gba");
const rkanoid = U(fs.readFileSync(rkanoidPath));
const rv = C.validateRom(rkanoid, "gba");
check("rkanoid: zero errors", rv.errors.length === 0, "homebrew boots despite blank header");
check("rkanoid: blank-header warning", rv.warnings.some((w) => /blank cartridge header/i.test(w)),
  "honest warning, not a block");

// 2b. synthesized zeroed-header GBA (models the wave-8 rejected class)
const zeroHdr = Buffer.concat([Buffer.alloc(192), rnd(32768 - 192, 7)]);
const zv = C.validateRom(U(zeroHdr), "gba");
check("zeroed-header GBA: warns, converts", zv.errors.length === 0 && zv.warnings.length === 1,
  "same failure mode as wave-8 rejects, kept convertible");

// 2c. NES: good minimal iNES
const nesGood = Buffer.concat([Buffer.from([0x4e, 0x45, 0x53, 0x1a, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), rnd(1024, 11)]);
check("valid NES: clean", (() => { const v = C.validateRom(U(nesGood), "nes"); return v.errors.length === 0; })(), "magic + PRG banks ok");
check("nesInfo parses banks", (() => { const i = C.nesInfo(U(nesGood)); return i && i.prgKB === 32 && i.chrKB === 8; })(), "2x16KB PRG, 1x8KB CHR");

// 2d. NES: bad magic / zero PRG
const nesBad = Buffer.concat([Buffer.from([0x00, 0x01, 0x02, 0x03]), rnd(1024, 13)]);
check("NES bad magic: error", C.validateRom(U(nesBad), "nes").errors.some((e) => /signature/i.test(e)), "not a NES ROM");
const nesNoPrg = Buffer.concat([Buffer.from([0x4e, 0x45, 0x53, 0x1a, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), rnd(512, 17)]);
check("NES zero PRG banks: error", C.validateRom(U(nesNoPrg), "nes").errors.length === 1, "header declares nothing");

// 2e. empty / all-zero
check("empty file: error", C.validateRom(new Uint8Array(0), "gba").errors.length === 1, "0 bytes");
check("all-zero file: error", C.validateRom(new Uint8Array(4096), "nes").errors.some((e) => /every byte/i.test(e)), "blank dump");

// 2f. GB header checksum (pure arithmetic, no logo bytes)
function gbRom(good) {
  const b = Buffer.alloc(0x200, 0); rnd(0x200, 23).copy(b);
  for (let i = 0x134; i <= 0x14c; i++) b[i] = (i * 7) & 0xff;
  let x = 0; for (let i = 0x134; i <= 0x14c; i++) x = (x - b[i] - 1) & 0xff;
  b[0x14d] = good ? x : (x ^ 0xff);
  return b;
}
check("GB checksum util: good", C.gbHeaderChecksumOk(U(gbRom(true))) === true, "spec math");
check("GB checksum util: bad", C.gbHeaderChecksumOk(U(gbRom(false))) === false, "detects tamper");
check("GB bad checksum: warning only", (() => { const v = C.validateRom(U(gbRom(false)), "gb");
  return v.errors.length === 0 && v.warnings.some((w) => /checksum/i.test(w)); })(), "suspect, not blocked");
check("GB good checksum: silent", (() => { const v = C.validateRom(U(gbRom(true)), "gb");
  return v.errors.length === 0 && v.warnings.length === 0; })(), "clean file, no noise");

// 2g. GB subtype flag
const gbC = gbRom(true); gbC[0x143] = 0x80;
const gbCo = gbRom(true); gbCo[0x143] = 0xc0;
check("GB subtype: color-enhanced", C.gbSubtype(U(gbC)) === "Game Boy + Color enhanced", "0x80");
check("GB subtype: color-only", C.gbSubtype(U(gbCo)) === "Game Boy Color only", "0xC0");
check("GB subtype: classic", C.gbSubtype(U(gbRom(true))) === "Original Game Boy", "no flag");

// 2h. Genesis: SEGA string present -> clean; absent -> warning, never error
function genRom(sega) {
  const b = Buffer.alloc(0x400, 0); rnd(0x400, 31).copy(b);
  b.write(sega ? "SEGA MEGA DRIVE" : "HOME BREW GAME!", 0x100);
  return b;
}
check("genesis SEGA string: detected", C.genesisHasSegaString(U(genRom(true))) === true, "0x100");
check("genesis missing SEGA: warning only", (() => { const v = C.validateRom(U(genRom(false)), "segamd");
  return v.errors.length === 0 && v.warnings.some((w) => /SEGA/i.test(w)); })(), "boots anyway, flagged suspect");
check("genesis with SEGA: silent", (() => { const v = C.validateRom(U(genRom(true)), "segamd");
  return v.errors.length === 0 && v.warnings.length === 0; })(), "clean dump, no noise");

// 2i. SNES: copier header detected as a note, kept as-is
const snesHdr = Buffer.concat([Buffer.alloc(512), rnd(1024 * 1024, 37)]); /* 1049088 % 1024 === 512 */
const snesNoHdr = rnd(1024 * 1024, 41);
check("snes copier header: note", (() => { const v = C.validateRom(U(snesHdr), "snes");
  return v.errors.length === 0 && v.warnings.length === 0 && v.notes.some((n) => /copier header/i.test(n)); })(),
  "size % 1024 == 512, kept as-is");
check("snes no header: no note", C.validateRom(U(snesNoHdr), "snes").notes.length === 0, "headerless, silent");
check("snes profile caps", C.PROFILES.snes.max === 6 * 1024 * 1024 && C.PROFILES.segamd.max === 4 * 1024 * 1024,
  "6MB SNES (48Mbit), 4MB Genesis (32Mbit)");

/* ---------- 3. naming ---------- */
check("slugify", C.slugify("Pokémon: Red! (v1.1)") === "pok-mon-red-v1-1", "unsafe chars stripped");
check("slugify empty", C.slugify("!!!") === "game", "fallback");
check("gameId shape", /^bm-[a-z0-9-]+-[a-z0-9]+$/.test(C.makeGameId("My Game", 207516)), C.makeGameId("My Game", 207516));
check("download name", C.makeDownloadName("My Game: DX") === "my-game-dx.html", ".html suffix");
check("uniqueDownloadName: no clash", C.uniqueDownloadName("Game", []) === "game.html", "first use");
check("uniqueDownloadName: clash", C.uniqueDownloadName("Game", ["game.html"]) === "game-2.html", "second file deduped");
check("uniqueDownloadName: chain", C.uniqueDownloadName("Game", ["game.html", "game-2.html"]) === "game-3.html", "third file");
check("baseName strips ext", C.baseName("game.gbc", C.profileFor("game.gbc")) === "game", ".gbc");

/* ---------- 4. token contract ---------- */
const template = fs.readFileSync(path.join(ROOT, "assets/vendor/template-game.html"), "utf8");
const tplTokens = [...new Set(template.match(/__BM_[A-Z0-9_]+__/g) || [])];
check("template tokens == contract", tplTokens.length === C.TOKENS.length && C.TOKENS.every((t) => tplTokens.includes(t)),
  C.TOKENS.length + " tokens: " + tplTokens.join(", "));
const convJs = fs.readFileSync(path.join(ROOT, "assets/js/converter.js"), "utf8");
check("converter.js wires every token field", ["name:", "gameId:", "buildDate:", "romSize:", "romB64:",
  "core:", "coreLabel:", "system:", "hint:", "compressed:", "cover:"].every((f) => convJs.includes(f)),
  "buildHtml fields incl. compressed + cover");
const built = C.buildHtml(template, {
  name: "Test <Game>", gameId: "bm-test-1", buildDate: "2026-10-11", romSize: "1.0 MB",
  romB64: "AAEC", core: "gba", coreLabel: "mGBA core", system: "Game Boy Advance",
  hint: "hint", compressed: "1", cover: "data:image/png;base64,AAA"
});
check("buildHtml: no leftovers", !/__BM_[A-Z0-9_]+__/.test(built), "all 11 replaced");
check("buildHtml: name escaped", built.includes("Test &lt;Game&gt;") && !built.includes("Test <Game>"), "XSS-safe");
check("buildHtml: compressed flag", built.includes('var BM_COMPRESSED = "1"'), "inflate path armed");
check("buildHtml: cover embedded", built.includes('var BM_COVER = "data:image/png;base64,AAA"'), "cover token");
check("output has player deep link", built.includes('href="player.html?core=gba"'), "?core=gba preselect");
check("output has inflate guard", built.includes("DecompressionStream"), "compressed boot path");
check("buildHtml: missing token throws", (() => {
  try { C.buildHtml(template.replace("__BM_COVER__", ""), { name: "x", gameId: "y", buildDate: "z", romSize: "r", romB64: "b", core: "c", coreLabel: "l", system: "s", hint: "h", compressed: "0", cover: "" }); return false; }
  catch (e) { return /missing tokens/i.test(e.message); }
})(), "contract enforced");

/* ---------- 5. compression round-trip (pako deflate -> zlib inflate) ----------
   The template inflates with DecompressionStream('deflate'), which reads the
   zlib wrapper pako writes. Node's zlib.inflateSync reads the same wrapper,
   so a green round-trip here proves the bytes the converter emits are exactly
   what the output page's inflate path expects. */
[1, 6, 9].forEach((level) => {
  const src = U(rnd(65536, 42)); // deterministic stand-in ROM bytes
  const def = new pako.Deflate({ level });
  def.push(src, true);
  check("pako level " + level + " round-trips", def.err === 0 && Buffer.from(zlib.inflateSync(Buffer.from(def.result))).equals(Buffer.from(src)),
    "deflate level " + level + " -> inflate identical");
});
check("level 9 <= level 1 size (sanity)", (() => {
  const src = U(rnd(65536, 42));
  const d1 = new pako.Deflate({ level: 1 }); d1.push(src, true);
  const d9 = new pako.Deflate({ level: 9 }); d9.push(src, true);
  return d9.result.length <= d1.result.length;
})(), "higher level really squeezes");

/* ---------- 6. batch runner: isolation + cancel ---------- */
async function batchTests() {
  // error isolation: middle file throws, others complete
  const items = [
    { id: 1, status: "queued", onUpdate() {} },
    { id: 2, status: "queued", onUpdate() {} },
    { id: 3, status: "queued", onUpdate() {} },
  ];
  await C.processQueue(items, async (it) => {
    if (it.id === 2) throw new Error("boom");
    it.status = "done";
  }, () => false);
  check("error isolation", items[0].status === "done" && items[1].status === "error" && items[2].status === "done",
    "one bad file, batch survives: " + items.map((i) => i.status).join(","));

  // cancel: stop after the first file
  const items2 = [{ id: 1, status: "queued" }, { id: 2, status: "queued" }, { id: 3, status: "queued" }];
  let calls = 0;
  await C.processQueue(items2, async (it) => { calls++; it.status = "done"; }, () => calls >= 1);
  check("cancel drains cleanly", items2[0].status === "done" && items2[1].status === "queued" && items2[2].status === "queued",
    "remaining files stay queued for resume");

  // cancelled marker -> 'cancelled', not 'error'
  const items3 = [{ id: 1, status: "queued", onUpdate() {} }];
  await C.processQueue(items3, async () => { throw { cancelled: true }; }, () => false);
  check("cancelled != failed", items3[0].status === "cancelled", "user cancel is not an error");

  // queue stats
  const st = C.queueStats([
    { status: "queued" }, { status: "done", fileSize: 100, outSize: 130 },
    { status: "error" }, { status: "cancelled" }, { status: "encoding" },
  ]);
  check("queueStats", st.total === 5 && st.done === 1 && st.failed === 1 && st.cancelled === 1 &&
    st.queued === 1 && st.active === 1 && st.bytesIn === 100 && st.bytesOut === 130, "counts + byte totals");

  // HTML radios match the core compression contract
  const html = fs.readFileSync(path.join(ROOT, "converter.html"), "utf8");
  check("compression radios match core", C.COMPRESSION.every((c) => html.includes('value="' + c.id + '"')),
    C.COMPRESSION.map((c) => c.id).join(","));
  check("converter.html loads pako+core", html.includes("assets/vendor/pako.min.js") && html.includes("assets/js/converter-core.js"),
    "script order: pako, core, ui");
  check("batch UI ids present", ["conv-queue", "conv-cancel", "conv-download-all", "conv-cover", "conv-status"]
    .every((id) => html.includes('id="' + id + '"')), "queue, cancel, cover, live region");
  check("presets set compression radios", ["best", "balanced", "none"].every((p) => html.includes('data-preset="' + p + '"')),
    "one-click presets");
}

batchTests().then(() => {
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}).catch((e) => { console.error("HARNESS ERROR", e); process.exit(1); });
