// usage: node sfxrender.cjs <outdir> [names]
const { chromium } = require('playwright'); const fs = require('fs'); const http = require('http'); const path = require('path');
const NAMES = ['click','coin','punch','kill','hurt','whoosh','teleport','flame','freeze','shatter','tk','slam','invis','xray','morph','dupe','pickup','potion','fireball','explosion','landing','grow','nemesis','death','worldshift','cashout'];
(async () => {
  const [out, only] = process.argv.slice(2);
  const files = { '/render.html': __dirname + '/sfx-render.html', '/audio.js': __dirname + '/../src/audio.js' };
  const srv = http.createServer((q, r) => { const f = files[q.url]; if (!f) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': q.url.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(fs.readFileSync(f)); }).listen(4190);
  const browser = await chromium.launch(); const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PE', e.message)); page.on('console', (m) => m.type() === 'error' && console.log('CE', m.text()));
  await page.goto('http://localhost:4190/render.html'); await page.waitForFunction(() => window.ready);
  fs.mkdirSync(out, { recursive: true });
  for (const n of NAMES) {
    if (only && !only.split(',').includes(n)) continue;
    const r = await page.evaluate((n) => window.renderSfx(n, 3), n);
    fs.writeFileSync(path.join(out, n + '.wav'), Buffer.from(r.wav, 'base64'));
    console.log(n.padEnd(11), 'peak', r.peak.toFixed(2), 'rms', r.rms.toFixed(3), 'len', r.len.toFixed(2) + 's');
  }
  await browser.close(); srv.close();
})();
