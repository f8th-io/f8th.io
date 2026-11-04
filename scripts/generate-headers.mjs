// Post-build step: turns public/_headers (a template) into dist/_headers
// (final). It replaces the {{SCRIPT_HASHES}} placeholder with SHA-256 hashes
// of every inline <script> in the built HTML, so the CSP keeps working even
// when the theme script changes. (Cloudflare computes the same hash of the
// exact bytes it serves; hashes must match or the script gets blocked.)
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST = path.join(process.cwd(), "dist");

// Recursively walks dist/ looking for .html files.
async function findHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await findHtml(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

// A CSP hash of an inline script is the hash of its exact textual content,
// without the tags — as served, after Astro's HTML minification. The value in
// the policy needs the algorithm prefix ('sha256-…'); a bare base64 string is
// an invalid source and gets IGNORED, silently disabling the script.
const hashes = new Set();
for (const file of await findHtml(DIST)) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const content = match[1];
    if (content.trim().length === 0) continue;
    const digest = createHash("sha256").update(content, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
}

const template = await readFile(path.join(process.cwd(), "public/_headers"), "utf8");
const output = template.replace("{{SCRIPT_HASHES}}", [...hashes].join(" "));

if (output.includes("{{SCRIPT_HASHES}}")) {
  throw new Error("generate-headers: placeholder not replaced — template changed?");
}
await writeFile(path.join(DIST, "_headers"), output);
console.log(`✓ dist/_headers written with ${hashes.size} inline script hash(es)`);
