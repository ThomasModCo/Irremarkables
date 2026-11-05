// usage: node fxlab.cjs <url> <outprefix> [only=a,b]
// Triggers each effect from a fixed spot and freezes the frame shortly after for a screenshot.
const { chromium } = require('playwright');
const SCEN = [
  ['hit', 120, `g.__bot(2.2); g.resolvePlayerHit({damage:10,range:3,arc:-1}); g.__bot0.hp=999;`],
  ['kill', 140, `g.killBot(g.__bot(2.5), {byPlayer:true});`],
  ['pyro', 420, `g.activatePower(P('pyro')); g.player.flameUntil = performance.now()/1000 + 60;`],
  ['fireball', 260, `g.launchFireball();`],
  ['explosion', 90, `const b=g.__bot(5); g.projectiles=[{pos:b.ch.pos.clone().setY(1.4),dir:new b.ch.pos.constructor(0,0,1),speed:0,life:0,r:0}];`],
  ['cryo', 160, `g.activatePower(P('cryo'));`],
  ['shatter', 110, `const b=g.__bot(2.5); b.ch.freeze(5); g.killBot(b,{byPlayer:true,cause:'shatter'});`],
  ['teleport', 110, `g.activatePower(P('teleport'));`],
  ['invisibility', 140, `g.activatePower(P('invisibility'));`],
  ['flight', 160, `g.activatePower(P('flight'));`],
  ['speed', 300, `g.activatePower(P('speed')); g.player.ch.vel && 0;`],
  ['shapeshift', 150, `g.activatePower(P('shapeshift'));`],
  ['duplication', 160, `g.activatePower(P('duplication'));`],
  ['slam', 110, `g.killBot(g.__bot(3), {byPlayer:true, cause:'slam'});`],
  ['landing', 150, `g.superheroLanding();`],
  ['switch', 150, `g.doSwitch(P('cryo'));`],
];
(async () => {
  const [url, out, only] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 800, height: 500 } })).newPage();
  await page.addInitScript(() => { let s = 9; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__game, null, { timeout: 90000 });
  await page.evaluate(() => document.getElementById('play-btn').click());
  await page.waitForTimeout(5000);
  await page.evaluate(() => {
    const g = window.__game; document.getElementById('hud').style.display = 'none';
    const ui = document.querySelectorAll('.announce, #announce'); ui.forEach((e) => e.style.display = 'none');
    g.player.switchesLeft = 99; g.damagePlayer = () => {}; g.playerDeath = () => {};
    // park the player on open ground: find a road spot
    const p = g.player.ch.pos; g.__home = p.clone();
    g.__bot = (d) => { const b = g.bots.find((x) => x.ch.alive) ; b.ch.pos.set(p.x + Math.sin(g.player.ch.yaw) * d, 0, p.z + Math.cos(g.player.ch.yaw) * d); b.ch.altitude = 0; b.target = null; g.__bot0 = b; return b; };
    g.updateCameraPlay = function () { const c = this.player.ch, y = c.yaw; this.camera.position.set(c.pos.x - Math.sin(y) * 5 + Math.cos(y) * 2.2, 3.2 + c.altitude, c.pos.z - Math.cos(y) * 5 - Math.sin(y) * 2.2); this.camera.lookAt(c.pos.x + Math.sin(y) * 3, 1.3 + c.altitude, c.pos.z + Math.cos(y) * 3); };
  });
  for (const [name, wait, code] of SCEN) {
    if (only && !only.split(',').includes(name)) continue;
    await page.evaluate((code) => {
      const g = window.__game; const P = (id) => window.__powers.find((x) => x.id === id);
      g.timescale = 1; g.player.cds = {}; g.player.flying = false; g.player.ch.altitude = 0;
      if (g.player.ch.propMesh) g.revealDisguise();
      g.player.ch.pos.copy(g.__home); g.player.invisUntil = 0; g.player.flameUntil = 0; g.player.speedUntil = 0; g.player.ch.setOpacity(1);
      for (const c of g.clones || []) c.until = 0;
      g.__t0 = g.time;
      eval(code);
    }, code).catch((e) => console.log(name, 'ERR', e.message));
    await page.waitForFunction((w) => window.__game.time - window.__game.__t0 >= w / 1000, wait, { timeout: 60000, polling: 16 });
    await page.evaluate(() => { window.__game.timescale = 0.00001; window.__game.slowmoUntil = 1e12; });
    await page.screenshot({ path: `${out}-${name}.png`, timeout: 120000 });
    await page.evaluate(() => { window.__game.timescale = 1; window.__game.slowmoUntil = 0; });
    await page.evaluate(() => { window.__game.__t1 = window.__game.time; });
    await page.waitForFunction(() => window.__game.time - window.__game.__t1 >= 2.2, null, { timeout: 90000, polling: 100 });
  }
  console.log(errs.slice(0, 5).join('\n'));
  await browser.close();
})();
