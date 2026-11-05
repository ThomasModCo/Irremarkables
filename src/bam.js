// Comic-book onomatopoeia as 3D sprites: bright, slightly translucent words in
// the display font that pop out of the impact point, tilt, drift up and fade.
// They live in the scene (depth-tested, nudged away from the camera) so the
// bodies in front keep the action readable instead of a HUD element covering it.
import * as THREE from 'three';
import { rand, pick } from './utils.js';

const LIFE = 1.0;
const MAX_LIVE = 14;
const OPACITY = 0.9;
const COLORS = ['#ffe45c', '#ff6b6b', '#7dffca', '#8ecbff', '#ff9de2', '#ffb347', '#c9ff5c', '#c07bff', '#ffffff'];

const texCache = new Map();

function wordTexture(word) {
  let t = texCache.get(word);
  if (t) return t;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = '96px Bangers, Impact, "Arial Black", sans-serif';
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(word).width) + 48;
  c.width = Math.max(64, w);
  c.height = 128;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // white glyphs (tinted per sprite) with an ink outline for legibility on any backdrop
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#141018';
  ctx.strokeText(word, c.width / 2, c.height / 2 + 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(word, c.width / 2, c.height / 2 + 4);
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.userData.aspect = c.width / c.height;
  texCache.set(word, t);
  return t;
}

export class BamText {
  constructor(scene) {
    this.scene = scene;
    this.live = [];
    this.pool = [];
  }

  // x,y,z: world impact point. size: height of the word in metres (roughly).
  spawn(x, y, z, word, { size = 1, color = null, camPos = null } = {}) {
    if (this.live.length >= MAX_LIVE) this.kill(this.live[0]);
    let s = this.pool.pop();
    if (!s) {
      s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: true }));
      s.renderOrder = 5;
      this.scene.add(s);
    }
    const tex = wordTexture(word);
    s.material.map = tex;
    s.material.opacity = 0;
    s.material.color.set(color || pick(COLORS));
    s.material.rotation = rand(-0.28, 0.28);
    s.material.needsUpdate = true;
    // sit a touch behind the impact (away from the camera) so the bodies overlap it
    let px = x, py = y, pz = z;
    if (camPos) {
      const dx = x - camPos.x, dz = z - camPos.z;
      const d = Math.hypot(dx, dz) || 1;
      px += (dx / d) * 0.7; pz += (dz / d) * 0.7;
    }
    s.position.set(px, py, pz);
    s.visible = true;
    const h = 0.55 * size;
    s.userData = { t: 0, h, aspect: tex.userData.aspect, vy: rand(0.9, 1.4), drift: rand(-0.3, 0.3) };
    s.scale.set(0.01, 0.01, 1);
    this.live.push(s);
    return s;
  }

  kill(s) {
    const i = this.live.indexOf(s);
    if (i >= 0) this.live.splice(i, 1);
    s.visible = false;
    this.pool.push(s);
  }

  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const s = this.live[i];
      const u = s.userData;
      u.t += dt;
      const k = u.t / LIFE;
      if (k >= 1) { this.kill(s); continue; }
      // elastic pop-in, hold, then shrink slightly while fading
      let sc;
      if (k < 0.18) { const q = k / 0.18; sc = 1.25 * Math.sin(q * Math.PI * 0.5); }
      else if (k < 0.32) { sc = 1.25 - 0.25 * ((k - 0.18) / 0.14); }
      else sc = 1;
      const fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      s.material.opacity = OPACITY * Math.min(1, k / 0.08) * fade;
      s.scale.set(u.h * u.aspect * sc, u.h * sc, 1);
      s.position.y += u.vy * dt * (k > 0.3 ? 1 : 0.3);
      s.position.x += u.drift * dt;
    }
  }
}
