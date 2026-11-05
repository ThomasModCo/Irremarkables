import { POWERS } from './powers.js';
import './font.css';
import { loadAnimLib } from './animlib.js';
import { Game } from './game.js';
import { loadAuthored } from './authored.js';

const canvas = document.getElementById('gl');
const loading = document.getElementById('loading');

async function boot() {
  try {
    // the comic display font is drawn into canvas textures (impact words), so wait for it
    await Promise.all([
      loadAnimLib('./anims.json').then(() => loadAuthored('./')),
      document.fonts?.load('96px Bangers').catch(() => {}),
    ]);
  } catch (e) {
    loading.textContent = 'Failed to load animations: ' + e.message;
    throw e;
  }
  loading.classList.add('hidden');

  const game = new Game(canvas);
  window.__game = game; // console/testing hook
  window.__powers = POWERS;

  function resize() {
    game.resize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  resize();

  // ?stats=1 shows fps / draw calls / triangles (for phone testing)
  let stats = null, acc = 0, frames = 0;
  if (/[?&]stats=1\b|stats/.test(location.search + location.hash)) {
    stats = document.createElement('div');
    stats.style.cssText = 'position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:99;font:12px monospace;color:#fff;background:#000a;padding:3px 8px;border-radius:6px;pointer-events:none';
    document.body.appendChild(stats);
  }

  let last = performance.now();
  let faults = 0;
  function frame(t) {
    const dt = (t - last) / 1000;
    last = t;
    // never let one bad frame kill the loop: the canvas would stay black for
    // the rest of the session while the UI kept responding
    try {
      game.update(dt);
    } catch (e) {
      if (faults++ < 5) console.error('frame error', e);
    }
    if (stats) {
      acc += dt; frames++;
      if (acc > 0.5) {
        const i = game.renderer.info.render;
        stats.textContent = `${Math.round(frames / acc)} fps · ${i.calls} calls · ${(i.triangles / 1000).toFixed(0)}k tris · dpr ${game.renderer.getPixelRatio().toFixed(1)}`;
        acc = 0; frames = 0;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot();

// PWA service worker (only over https / production builds)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
