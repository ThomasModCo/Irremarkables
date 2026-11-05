// Fails the build if dist/ contains anything outside the set of file
// extensions that static hosts reliably accept. Keeps uploads from being
// rejected for a stray file type.
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ALLOWED = new Set(['.html', '.js', '.css', '.json', '.png']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

let files;
try {
  files = walk(dist);
} catch {
  console.error('check-dist: dist/ not found — run the build first.');
  process.exit(1);
}

const bad = files.filter((f) => !ALLOWED.has(extname(f).toLowerCase()));
if (bad.length) {
  console.error('\ncheck-dist: build contains files with disallowed extensions:');
  for (const f of bad) console.error('  - ' + relative(root, f));
  console.error(`\nAllowed: ${[...ALLOWED].join(' ')}\n`);
  process.exit(1);
}

const byExt = {};
for (const f of files) byExt[extname(f)] = (byExt[extname(f)] || 0) + 1;
const summary = Object.entries(byExt).map(([e, n]) => `${n}${e}`).join(', ');
console.log(`check-dist: ${files.length} files OK (${summary})`);
