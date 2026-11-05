const { chromium } = require('playwright');
(async () => {
  const [url, mob, seed] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext(mob === '1' ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 720 } })).newPage();
  await page.addInitScript((seed) => { let s = +seed || 1; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }, seed || '5');
  await page.goto(url);
  await page.waitForFunction(() => window.__game, null, { timeout: 90000 });
  await page.evaluate(() => document.getElementById('play-btn').click());
  await page.waitForTimeout(6000);
  const res = [];
  for (let i = 0; i < 8; i++) {
    await page.evaluate((i) => { const g = window.__game; g.__a = i * Math.PI / 4; g.__fixed = g.__fixed || g.player.ch.group.position.clone();
      g.updateCameraPlay = function () { const p = this.__fixed; this.camera.position.set(p.x - Math.sin(this.__a) * 6, 4, p.z - Math.cos(this.__a) * 6); this.camera.lookAt(p.x, 1.5, p.z); }; }, i);
    await page.waitForTimeout(600);
    res.push(await page.evaluate(() => { const r = window.__game.renderer.info.render; return [r.calls, r.triangles]; }));
  }
  const avg = (k) => Math.round(res.reduce((a, r) => a + r[k], 0) / res.length), max = (k) => Math.max(...res.map((r) => r[k]));
  console.log(JSON.stringify({ calls_avg: avg(0), calls_max: max(0), tris_avg: avg(1), tris_max: max(1) }));
  await browser.close();
})();
