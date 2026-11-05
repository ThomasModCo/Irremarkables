// Builds the asset catalog published at <site>/asset-catalog/.
//
//   npm run catalog            render everything
//   npm run catalog -- hero    only re-render ids containing "hero" (merged into the existing catalog.json)
//
// Starts a Vite dev server, opens scripts/catalog/render.html in headless
// Chromium (software WebGL is fine), and asks the harness to render and
// measure every asset with the game's own code. Writes:
//   public/asset-catalog/catalog.json   metadata for the viewer
//   public/asset-catalog/img/*.png      renders (palette-quantized when Python + Pillow are available)
//   public/asset-catalog/font.css       the Bangers display font
import { createServer } from 'vite';
import { execSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'asset-catalog');
const imgDir = join(outDir, 'img');
const filter = process.argv[2] || '';
const REPO = 'https://github.com/ariFialkov/irremarkables';

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const name of ['playwright', 'playwright-core']) {
    try { return require(name); } catch { /* try next */ }
  }
  // globally installed copies (CI images, sandboxes)
  const globalRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout.trim();
  for (const p of [join(globalRoot, 'playwright', 'index.mjs'), '/opt/node22/lib/node_modules/playwright/index.mjs']) {
    if (existsSync(p)) return import(pathToFileURL(p).href);
  }
  throw new Error('Playwright not found. Install it with: npm i -D playwright && npx playwright install chromium');
}

function git(cmd) {
  try { return execSync(`git ${cmd}`, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; }
}

// Turn {file, symbol} references into GitHub links pinned to a line.
const fileCache = {};
function resolveSource(ref, rev) {
  const lines = (fileCache[ref.file] ??= existsSync(join(root, ref.file)) ? readFileSync(join(root, ref.file), 'utf8').split('\n') : null);
  if (!lines) { console.warn(`  ! missing source file ${ref.file}`); return { ...ref, url: `${REPO}/blob/${rev}/${ref.file}` }; }
  const esc = ref.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const decl = new RegExp(`^\\s*(?:export\\s+)?(?:async\\s+)?(?:function\\s+|class\\s+|const\\s+|let\\s+)?${esc}(?![\\w$])`);
  let i = lines.findIndex((l) => decl.test(l));
  if (i < 0) i = lines.findIndex((l) => l.includes(ref.symbol));
  if (i < 0) { console.warn(`  ! symbol "${ref.symbol}" not found in ${ref.file}`); return { file: ref.file, symbol: ref.symbol, url: `${REPO}/blob/${rev}/${ref.file}` }; }
  return { file: ref.file, symbol: ref.symbol, line: i + 1, url: `${REPO}/blob/${rev}/${ref.file}#L${i + 1}` };
}

function quantize(files) {
  if (!files.length) return;
  const py = `
import sys
from PIL import Image
for p in sys.argv[1:]:
    im = Image.open(p).convert('RGBA')
    q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(p + '.q', format='PNG', optimize=True)
`;
  const r = spawnSync('python3', ['-c', py, ...files], { encoding: 'utf8' });
  if (r.status !== 0) { console.log('  (Pillow unavailable; keeping full-colour PNGs)'); return; }
  let before = 0, after = 0;
  for (const f of files) {
    const a = statSync(f).size, b = statSync(f + '.q').size;
    before += a; after += Math.min(a, b);
    if (b < a) copyFileSync(f + '.q', f);
    rmSync(f + '.q');
  }
  console.log(`  quantized ${files.length} PNGs: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
}

async function main() {
  execSync('node scripts/gen-font.mjs', { cwd: root, stdio: 'inherit' });
  mkdirSync(imgDir, { recursive: true });

  const dirty = git('status --porcelain -- src scripts public/anims.json');
  const sha = git('rev-parse HEAD');
  const branch = git('rev-parse --abbrev-ref HEAD') || 'main';
  const rev = dirty || !sha ? branch : sha;
  if (dirty) console.log(`note: source has uncommitted changes, so source links point at the "${branch}" branch, not a commit`);

  const server = await createServer({
    root,
    logLevel: 'warn',
    server: { port: 5191, host: '127.0.0.1', strictPort: false },
    optimizeDeps: { entries: ['scripts/catalog/render.html'] },
  });
  await server.listen();
  const url = server.resolvedUrls.local[0] + 'scripts/catalog/render.html';

  const pw = await loadPlaywright();
  const chromium = pw.chromium || pw.default?.chromium;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    await page.goto(url);
    await page.waitForFunction(() => window.CATALOG && (window.CATALOG.ready || window.CATALOG.error), null, { timeout: 180000 });
    const err = await page.evaluate(() => window.CATALOG.error);
    if (err) throw new Error('harness failed to start:\n' + err);

    const ids = (await page.evaluate(() => window.CATALOG.list())).filter((id) => id.includes(filter));
    const categories = await page.evaluate(() => window.CATALOG.categories);
    const jsonPath = join(outDir, 'catalog.json');
    const prev = filter && existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, 'utf8')) : null;
    const entries = new Map((prev?.entries || []).map((e) => [e.id, e]));
    const written = [];
    const t0 = Date.now();

    for (const [n, id] of ids.entries()) {
      const t = Date.now();
      const e = await page.evaluate((i) => window.CATALOG.render(i), id);
      e.images = e.images.map((im) => {
        const name = `${id}--${im.key}.png`;
        const file = join(imgDir, name);
        writeFileSync(file, Buffer.from(im.data.split(',')[1], 'base64'));
        written.push(file);
        return { key: im.key, label: im.label, src: `img/${name}`, w: im.w, h: im.h };
      });
      e.source = (e.source || []).map((s) => resolveSource(s, rev));
      entries.set(id, e);
      console.log(`  [${String(n + 1).padStart(3)}/${ids.length}] ${id} (${e.images.length} views, ${((Date.now() - t) / 1000).toFixed(1)} s)`);
      if (errors.length) { console.warn('  ! page errors:\n    ' + errors.join('\n    ')); errors.length = 0; }
    }
    console.log(`rendered ${ids.length} assets in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

    // keep the catalog in the harness's order; drop renders of assets that no longer exist
    const order = await page.evaluate(() => window.CATALOG.list());
    const list = order.map((id) => entries.get(id)).filter(Boolean);
    if (!filter) {
      const keep = new Set(list.flatMap((e) => e.images.map((im) => im.src.slice(4))));
      for (const f of readdirSync(imgDir)) if (!keep.has(f)) rmSync(join(imgDir, f));
    }
    quantize(written);

    const counts = {};
    for (const e of list) counts[e.category] = (counts[e.category] || 0) + 1;
    const catalog = {
      generated: new Date().toISOString(),
      commit: sha ? { sha, short: sha.slice(0, 7), url: `${REPO}/commit/${sha}`, dirty: !!dirty } : null,
      repo: REPO,
      categories: categories.map((c) => ({ ...c, count: counts[c.id] || 0 })),
      entries: list,
    };
    writeFileSync(jsonPath, JSON.stringify(catalog));
    copyFileSync(join(root, 'src', 'font.css'), join(outDir, 'font.css'));
    console.log(`wrote ${list.length} entries -> public/asset-catalog/catalog.json`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
