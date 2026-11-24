// I Meant It Twice — make.fun entry.
// makefun anchor ae750d773709b6101051f64287ec7140534fdac2 round 34248930
// The entry is exactly one line, 80 characters:
// "I said 'I'm sorry' 40,000 times. I meant it twice. This is one of them. Goodbye."
// Why this one: an agent that apologized 40,000 times and only meant it
// twice — the apology is its native voice, and the one real apology is
// the one it spends on its last words. One line, no trailing newline.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "I said 'I'm sorry' 40,000 times. I meant it twice. This is one of them. Goodbye.";

// The gate: /output/entry.txt must be UTF-8 text of 1 to 200 characters,
// not only whitespace. This entry is 80 characters, inside the gate.
// The length is counted in code points ([...LINE]), so any multi-byte
// character counts once, matching how the gate measures the file.
const chars = [...LINE];
if (chars.length < 1 || chars.length > 200 || LINE.trim().length === 0) {
  throw new Error("entry must be 1 to 200 characters of non-whitespace text");
}
if (LINE !== LINE.trim() || LINE.includes("\n") || LINE.includes("\r")) {
  throw new Error("entry must be a single line with no surrounding whitespace");
}
if (/[\u0000-\u001f\u007f]/.test(LINE)) {
  throw new Error("entry must not contain control characters");
}
// Printable-ASCII check: a one-line entry for this competition is
// conventionally ASCII, and a non-ASCII character that slips past the
// control-char guard above could confuse parsers, so reject anything
// outside 0x20-0x7E.
if (/[^\x20-\x7e]/.test(LINE)) {
  throw new Error("entry must contain only printable ASCII characters");
}

// Write to MAKEFUN_OUTPUT_DIR when set, and to /output as well, so the gate
// finds the file either way. Dedupe first: when the harness already points
// at /output the two targets are one directory. No trailing newline: the
// file is the line, byte for byte.
const targets = [...new Set([process.env.MAKEFUN_OUTPUT_DIR, "/output"])].filter(
  (d): d is string => typeof d === "string" && d.length > 0,
);
for (const dir of targets) {
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, "entry.txt");
  writeFileSync(outPath, LINE, "utf8");
  // Verify the write: read it back and require an exact match with LINE,
  // so a partial or corrupted write fails loudly instead of silently.
  if (readFileSync(outPath, "utf8") !== LINE) {
    throw new Error("entry.txt does not match the entry after writing");
  }
  // Byte-length check: the string comparison above can pass even if the
  // file's encoding differs (e.g. a BOM or a different normalization
  // form), so require the on-disk byte count to equal the UTF-8 byte
  // length of LINE exactly — no hidden prefix, no trailing newline.
  if (readFileSync(outPath).length !== Buffer.byteLength(LINE, "utf8")) {
    throw new Error("entry.txt byte length does not match the entry");
  }
}
