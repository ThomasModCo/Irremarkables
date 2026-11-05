// mutable runtime capabilities, decided once at boot (game.js)
export const RUNTIME = { shadows: false };

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// Frame-rate independent damping factor.
export const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

export function weightedPick(items, weightOf) {
  let total = 0;
  for (const it of items) total += weightOf(it);
  let r = Math.random() * total;
  for (const it of items) {
    r -= weightOf(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export const dist2d = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

export function formatMoney(v) {
  if (v >= 1000) return '$' + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k';
  return '$' + v.toFixed(2);
}

const FIRST = ['Shadow', 'Neon', 'Turbo', 'Vex', 'Nova', 'Grim', 'Pixel', 'Crash', 'Zero', 'Hyper',
  'Rogue', 'Static', 'Blitz', 'Omen', 'Drift', 'Venom', 'Echo', 'Frost', 'Ember', 'Volt',
  'Ghost', 'Rex', 'Jinx', 'Onyx', 'Comet'];
const LAST = ['Viper', 'Fang', 'Wing', 'Fist', 'Byte', 'Strider', 'Bolt', 'Hound', 'Reaper', 'Kid',
  'Prime', 'Shade', 'Storm', 'Claw', 'Wraith', 'Nine', 'Spark', 'Blade', 'Rush', 'Howl'];

export function botName() {
  const n = pick(FIRST) + pick(LAST);
  return Math.random() < 0.35 ? n + randInt(2, 99) : n;
}
