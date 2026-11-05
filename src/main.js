import './font.css';
import { loadAnimLib } from './animlib.js';
import { Game } from './game.js';

const canvas = document.getElementById('gl');
const loading = document.getElementById('loading');

async function boot() {
  try {
    // the comic display font is drawn into canvas textures (impact words), so wait for it
    await Promise.all([
      loadAnimLib('./anims.json'),
      document.fonts?.load('96px Bangers').catch(() => {}),
    ]);
  } catch (e) {
    loading.textContent = 'Failed to load animations: ' + e.message;
    throw e;
  }
  loading.classList.add('hidden');

  const game = new Game(canvas);
  window.__game = game; // console/testing hook

  function resize() {
    game.resize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  resize();

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
