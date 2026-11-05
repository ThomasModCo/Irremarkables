import * as THREE from 'three';
import { rand } from './utils.js';

// ---------------------------------------------------------------------------
// Comic-book VFX: every particle is an opaque, ink-outlined flat shape with
// two-tone cel shading (no additive glow, no soft alpha). Particles shrink to
// nothing instead of fading, so they depth-sort like solid props and stay
// readable on bright and dark backgrounds alike.
//
// shapes: dot, spark (4-point star), puff (cloud blob), flame (teardrop that
// points along its screen-space motion), shard (ice diamond), streak (speed
// line along its motion)
// ---------------------------------------------------------------------------
export const SHAPE = { dot: 0, spark: 1, puff: 2, flame: 3, shard: 4, streak: 5 };
const INK = new THREE.Color(0x14121c);
const MAX_PARTICLES = 4096;

const VERT = `
attribute float psize;
attribute vec3 pcolor;
attribute vec3 pcolor2;
attribute float plife;
attribute float pshape;
attribute float prot;
attribute float pgrow;
attribute vec3 pvel;
uniform float uPointScale;
uniform vec2 uViewport;
varying vec3 vColor;
varying vec3 vColor2;
varying float vLife;
varying float vShape;
varying float vRot;
varying float vPx;
void main() {
  vColor = pcolor; vColor2 = pcolor2; vLife = plife; vShape = pshape;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 c0 = projectionMatrix * mv;
  gl_Position = c0;
  // size over life: puffs swell (pgrow > 1), everything pops in fast and
  // shrinks away over the last third instead of fading
  float k = 1.0 - plife;
  float swell = mix(1.0, pgrow, sqrt(k));
  float popIn = smoothstep(0.0, 0.08, k);
  float shrink = smoothstep(0.0, 0.35, plife);
  float px = psize * swell * popIn * shrink * (uPointScale / max(1.0, -mv.z));
  px = min(px, uViewport.y * 0.2);           // never a screen-filling blob right at the lens
  gl_PointSize = px;
  vPx = max(px, 1.0);
  // orientation: flames and streaks follow their on-screen motion
  vRot = prot;
  if (pshape > 2.5 && pshape < 3.5 || pshape > 4.5) {
    vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(position + pvel * 0.05, 1.0));
    vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * uViewport;
    // flames trail their tip behind them like a comet; streaks just align
    if (dot(d, d) > 0.25) vRot = atan(d.y, d.x) + (pshape < 3.5 ? 1.5707963 : -1.5707963);
    else if (pshape < 3.5) vRot = 0.0; // still flames lick upward
  }
}`;

const FRAG = `
uniform vec3 uInk;
varying vec3 vColor;
varying vec3 vColor2;
varying float vLife;
varying float vShape;
varying float vRot;
varying float vPx;

float sdCircle(vec2 p, float r) { return length(p) - r; }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

void main() {
  vec2 p = gl_PointCoord - 0.5;
  p.y = -p.y;                                   // +y up on screen
  float c = cos(vRot), s = sin(vRot);
  vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);   // shape space

  float d;
  int shape = int(vShape + 0.5);
  if (shape == 1) {                             // spark: 4-point star
    float a = atan(q.y, q.x);
    float r = length(q);
    float R = mix(0.17, 0.48, pow(abs(cos(2.0 * a)), 5.0));
    d = r - R;
  } else if (shape == 2) {                      // puff: lumpy cloud with a flat-ish base
    d = sdCircle(q - vec2(-0.2, -0.1), 0.19);
    d = smin(d, sdCircle(q - vec2(0.19, -0.11), 0.18), 0.08);
    d = smin(d, sdCircle(q - vec2(-0.07, 0.08), 0.23), 0.08);
    d = smin(d, sdCircle(q - vec2(0.15, 0.1), 0.16), 0.08);
    d = smin(d, sdCircle(q - vec2(0.0, -0.13), 0.2), 0.08);
  } else if (shape == 3) {                      // flame: teardrop, tip along +y
    vec2 f = q - vec2(0.0, -0.13);
    float up = max(f.y, 0.0);
    d = length(vec2(f.x * (1.0 + up * 3.2), f.y * (f.y > 0.0 ? 0.62 : 1.0))) - 0.28;
  } else if (shape == 4) {                      // shard: long diamond
    d = (abs(q.x) * 2.4 + abs(q.y)) * 0.62 - 0.29;
  } else if (shape == 5) {                      // streak: capsule along +y
    vec2 e = vec2(q.x, max(abs(q.y) - 0.34, 0.0));
    d = length(e) - 0.1;
  } else {
    d = sdCircle(q, 0.45);
  }
  if (d > 0.0) discard;

  // cel colour over life: hard steps from colour to colour2, not a blend
  float t = vLife > 0.62 ? 0.0 : (vLife > 0.3 ? 0.5 : 1.0);
  vec3 col = mix(vColor, vColor2, t);

  // thin edge line (~1 screen px) in a dark shade of the particle's own
  // colour rather than black, so effects read cel-shaded, not stickered;
  // tiny particles skip it entirely
  if (vPx > 9.0) {
    float ink = clamp(1.1 / vPx, 0.014, 0.032);
    if (d > -ink) { gl_FragColor = vec4(mix(uInk, col * 0.4, 0.6), 1.0); return; }
  }

  // two-tone shading in screen space, light from the top left
  vec2 n = p / 0.5;
  float L = dot(n, normalize(vec2(-0.55, 0.75)));
  if (shape == 2) {                             // puffs: shadow crescent + rim highlight
    if (L < -0.12) col *= 0.72;
    else if (L > 0.55 && d < -0.05) col = mix(col, vec3(1.0), 0.35);
  } else if (shape == 3) {                      // flames: hot core
    if (d < -0.13) col = mix(col, vec3(1.0, 0.97, 0.8), 0.75);
  } else if (shape == 4) {                      // shards: lit facet
    if (q.x > 0.0) col = mix(col, vec3(1.0), 0.45);
  } else if (shape == 1 || shape == 0) {        // sparks/dots: white centre
    if (d < -0.2) col = mix(col, vec3(1.0), 0.7);
    else if (L < -0.3) col *= 0.8;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// shockwave: a flat inked band on the ground that races out and thins away.
// burst mode gives the outer edge comic spikes (explosions, landings).
const RING_VERT = `
varying vec2 vUv;
void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FRAG = `
uniform vec3 uColor;
uniform vec3 uInk;
uniform float uK;
uniform float uBurst;
uniform float uScale;
varying vec2 vUv;
void main() {
  float r = length(vUv);
  float a = atan(vUv.y, vUv.x);
  float outer = 1.0;
  if (uBurst > 0.5) outer = 1.0 - 0.13 * smoothstep(0.35, 0.65, abs(fract(a * 2.5465) - 0.5) * 2.0);
  float inner = mix(0.8, 0.995, uK);
  if (r > outer || r < inner) discard;
  // ink width in ring units: ~5 cm on the ground at any radius
  float ink = clamp(0.03 / uScale, 0.006, 0.04);
  vec3 col = uColor;
  if (r > outer - ink || r < inner + ink) col = mix(uInk, uColor * 0.4, 0.6);
  else if (r < mix(inner, outer, 0.45)) col *= 0.78;   // inner shade band
  gl_FragColor = vec4(col, 1.0);
}`;

// impact starburst: a jagged comic "flash" card that pops at the hit point
function burstTexture() {
  const S = 256, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const star = (r0, r1, n, jitter) => {
    g.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      const r = (i % 2 ? r0 : r1) * (1 + (Math.sin(i * 12.9898) * 0.5) * jitter);
      g.lineTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r);
    }
    g.closePath();
  };
  g.lineJoin = 'miter';
  star(48, 116, 11, 0.25); g.fillStyle = '#5a4a3a'; g.fill();          // thin edge (darkened by the tint)
  star(45, 112, 11, 0.25); g.fillStyle = '#ffffff'; g.fill();          // tint layer (sprite colour)
  star(26, 62, 9, 0.2); g.fillStyle = '#ffffff'; g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function burstCoreTexture() {
  const S = 128, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.beginPath();
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI * 2, r = i % 2 ? 22 : 54;
    g.lineTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r);
  }
  g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class FX {
  constructor(scene, renderer = null) {
    this.scene = scene;

    // ---- particle pool ----
    this.pos = new Float32Array(MAX_PARTICLES * 3);
    this.vel = new Float32Array(MAX_PARTICLES * 3);
    this.life = new Float32Array(MAX_PARTICLES);     // remaining
    this.life0 = new Float32Array(MAX_PARTICLES);    // initial
    this.grav = new Float32Array(MAX_PARTICLES);
    this.drag = new Float32Array(MAX_PARTICLES);
    this.spin = new Float32Array(MAX_PARTICLES);
    this.cursor = 0;
    this.liveMax = 0; // highest index that may be alive (keeps the update loop short)

    const geo = new THREE.BufferGeometry();
    const A = (n, k = 1) => new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * k), k).setUsage(THREE.DynamicDrawUsage);
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.velAttr = new THREE.BufferAttribute(this.vel, 3).setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = A('psize');
    this.colorAttr = A('pcolor', 3);
    this.color2Attr = A('pcolor2', 3);
    this.lifeAttr = A('plife');
    this.shapeAttr = A('pshape');
    this.rotAttr = A('prot');
    this.growAttr = A('pgrow');
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('pvel', this.velAttr);
    geo.setAttribute('psize', this.sizeAttr);
    geo.setAttribute('pcolor', this.colorAttr);
    geo.setAttribute('pcolor2', this.color2Attr);
    geo.setAttribute('plife', this.lifeAttr);
    geo.setAttribute('pshape', this.shapeAttr);
    geo.setAttribute('prot', this.rotAttr);
    geo.setAttribute('pgrow', this.growAttr);
    geo.setDrawRange(0, 0);

    this.uniforms = {
      uPointScale: { value: 240 * (renderer ? renderer.getPixelRatio() : 1) },
      uViewport: { value: new THREE.Vector2(1280, 720) },
      uInk: { value: INK },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: false,
      depthWrite: true,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.userData.noOutline = true;
    this.points.renderOrder = 2;
    scene.add(this.points);
    this.renderer = renderer;

    // ---- ring pool ----
    this.rings = [];
    const ringGeo = new THREE.PlaneGeometry(2, 2);
    for (let i = 0; i < 14; i++) {
      const m = new THREE.ShaderMaterial({
        vertexShader: RING_VERT, fragmentShader: RING_FRAG,
        uniforms: { uColor: { value: new THREE.Color() }, uInk: { value: INK }, uK: { value: 0 }, uBurst: { value: 0 }, uScale: { value: 1 } },
        side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      const rg = new THREE.Mesh(ringGeo, m);
      rg.rotation.x = -Math.PI / 2;
      rg.visible = false;
      rg.renderOrder = 1;
      rg.userData.noOutline = true;
      scene.add(rg);
      this.rings.push({ mesh: rg, t: 0, dur: 0, maxR: 0 });
    }

    // ---- impact starbursts ----
    this.bursts = [];
    const tex = burstTexture(), core = burstCoreTexture();
    for (let i = 0; i < 10; i++) {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.5, depthWrite: false, depthTest: false }));
      const inner = new THREE.Sprite(new THREE.SpriteMaterial({ map: core, color: 0xffffff, transparent: true, alphaTest: 0.5, depthWrite: false, depthTest: false }));
      inner.renderOrder = 7; spr.renderOrder = 6;
      inner.scale.setScalar(0.55);
      spr.add(inner);
      spr.visible = false;
      scene.add(spr);
      this.bursts.push({ spr, inner, t: 0, dur: 0, size: 1 });
    }

    this.shakeAmt = 0;
    this.shakeOffset = new THREE.Vector3();
    this._c = new THREE.Color();
    this._c2 = new THREE.Color();
  }

  _spawn(x, y, z, vx, vy, vz, o) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    if (i + 1 > this.liveMax) this.liveMax = i + 1;
    const i3 = i * 3;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.life[i] = this.life0[i] = o.life * rand(0.7, 1.2);
    this.grav[i] = o.gravity;
    this.drag[i] = o.drag;
    this.spin[i] = o.spin ? rand(-o.spin, o.spin) : 0;
    this.sizeAttr.array[i] = o.size * rand(0.7, 1.3) * SIZE_K[o.shape];
    this.shapeAttr.array[i] = SHAPE[o.shape] ?? 0;
    this.rotAttr.array[i] = rand(0, Math.PI * 2);
    this.growAttr.array[i] = o.grow ?? (o.shape === 'puff' ? 1.7 : 1);
    const off = o.vary ? rand(-o.vary, o.vary) : 0;
    this._c.set(o.color);
    this.colorAttr.array[i3] = clamp01(this._c.r + off);
    this.colorAttr.array[i3 + 1] = clamp01(this._c.g + off);
    this.colorAttr.array[i3 + 2] = clamp01(this._c.b + off);
    this._c2.set(o.color2 ?? o.color);
    this.color2Attr.array[i3] = clamp01(this._c2.r + off);
    this.color2Attr.array[i3 + 1] = clamp01(this._c2.g + off);
    this.color2Attr.array[i3 + 2] = clamp01(this._c2.b + off);
    this.lifeAttr.array[i] = 1;
  }

  // Burst in all directions. `shape` picks the comic shape; `color2` is the
  // colour it steps to as it ages (flames: yellow -> red, smoke: grey -> dark).
  emit(x, y, z, opts = {}) {
    const o = { ...EMIT_DEFAULTS, ...opts };
    for (let n = 0; n < o.count; n++) {
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const sp = o.speed * rand(0.4, 1.1);
      this._spawn(
        x + rand(-o.jitter, o.jitter), y + rand(-o.jitter, o.jitter), z + rand(-o.jitter, o.jitter),
        Math.sin(phi) * Math.cos(theta) * sp * o.spread,
        Math.abs(Math.cos(phi)) * sp * 0.7 + o.up,
        Math.sin(phi) * Math.sin(theta) * sp * o.spread,
        o,
      );
    }
  }

  // Directed emission (cones of flame, streaks): velocity around dir.
  emitDir(x, y, z, dir, opts = {}) {
    const o = { ...DIR_DEFAULTS, ...opts };
    for (let n = 0; n < o.count; n++) {
      const sp = o.speed * rand(0.6, 1.15);
      this._spawn(
        x + rand(-o.jitter, o.jitter), y + rand(-o.jitter, o.jitter), z + rand(-o.jitter, o.jitter),
        (dir.x + rand(-o.cone, o.cone)) * sp, (dir.y + rand(-o.cone, o.cone)) * sp, (dir.z + rand(-o.cone, o.cone)) * sp,
        o,
      );
    }
  }

  // ground shockwave. burst: spiky outer edge for big impacts
  ring(x, z, { color = 0xffffff, maxR = 8, dur = 0.55, y = 0.12, burst = false } = {}) {
    const r = this.rings.find((rr) => !rr.mesh.visible) || this.rings.reduce((a, b) => (a.t / a.dur > b.t / b.dur ? a : b));
    r.mesh.visible = true;
    r.mesh.position.set(x, y + this.rings.indexOf(r) * 0.002, z);
    const u = r.mesh.material.uniforms;
    u.uColor.value.set(color);
    u.uBurst.value = burst ? 1 : 0;
    u.uK.value = 0;
    r.t = 0; r.dur = dur; r.maxR = maxR;
    r.mesh.scale.setScalar(0.01);
  }

  // comic impact flash at a point (hits, kills, explosions)
  burst(x, y, z, { color = 0xffe45c, size = 1.6, dur = 0.2 } = {}) {
    const b = this.bursts.find((bb) => !bb.spr.visible) || this.bursts.reduce((a, c) => (a.t / a.dur > c.t / c.dur ? a : c));
    b.spr.visible = true;
    b.spr.position.set(x, y, z);
    b.spr.material.color.set(color);
    b.spr.material.rotation = rand(0, Math.PI * 2);
    b.inner.material.rotation = rand(0, Math.PI * 2);
    b.t = 0; b.dur = dur; b.size = size;
    b.spr.scale.setScalar(0.01);
  }

  addShake(amt) { this.shakeAmt = Math.min(1.6, this.shakeAmt + amt); }

  update(dt) {
    if (this.renderer) {
      const s = this.renderer.getDrawingBufferSize(this._v2 || (this._v2 = new THREE.Vector2()));
      this.uniforms.uViewport.value.copy(s);
      this.uniforms.uPointScale.value = 240 * this.renderer.getPixelRatio();
    }
    // particles
    let top = 0;
    for (let i = 0; i < this.liveMax; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const i3 = i * 3;
      if (this.life[i] <= 0) { this.lifeAttr.array[i] = 0; this.sizeAttr.array[i] = 0; continue; }
      top = i + 1;
      const dragF = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[i3] *= dragF;
      this.vel[i3 + 1] = this.vel[i3 + 1] * dragF + this.grav[i] * dt;
      this.vel[i3 + 2] *= dragF;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      if (this.pos[i3 + 1] < 0.05) { this.pos[i3 + 1] = 0.05; this.vel[i3 + 1] *= -0.3; }
      if (this.spin[i]) this.rotAttr.array[i] += this.spin[i] * dt;
      this.lifeAttr.array[i] = this.life[i] / this.life0[i];
    }
    this.liveMax = top; // spawns past this raise it again
    const geo = this.points.geometry;
    geo.setDrawRange(0, this.liveMax);
    for (const a of [this.posAttr, this.velAttr, this.lifeAttr, this.sizeAttr, this.colorAttr, this.color2Attr, this.shapeAttr, this.rotAttr, this.growAttr]) {
      a.clearUpdateRanges?.();
      a.addUpdateRange?.(0, this.liveMax * a.itemSize);
      a.needsUpdate = true;
    }

    // rings
    for (const r of this.rings) {
      if (!r.mesh.visible) continue;
      r.t += dt;
      const k = r.t / r.dur;
      if (k >= 1) { r.mesh.visible = false; continue; }
      const e = 1 - Math.pow(1 - k, 3);
      const R = Math.max(0.01, r.maxR * e);
      r.mesh.scale.setScalar(R);
      r.mesh.material.uniforms.uK.value = k;
      r.mesh.material.uniforms.uScale.value = R;
    }

    // starbursts: pop big, hold, collapse
    for (const b of this.bursts) {
      if (!b.spr.visible) continue;
      b.t += dt;
      const k = b.t / b.dur;
      if (k >= 1) { b.spr.visible = false; continue; }
      const s = k < 0.25 ? (k / 0.25) * 1.15 : k < 0.6 ? 1.15 - (k - 0.25) * 0.4 : (1 - k) / 0.4;
      b.spr.scale.setScalar(Math.max(0.01, b.size * s));
    }

    // shake decay
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 2.6);
    const s = this.shakeAmt * this.shakeAmt * 0.55;
    this.shakeOffset.set(rand(-s, s), rand(-s, s), rand(-s, s));
  }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
// per-shape size trims so one `size` number reads about the same for each shape
const SIZE_K = { dot: 0.85, spark: 1.25, puff: 1.35, flame: 1.3, shard: 1.15, streak: 1.4 };
const EMIT_DEFAULTS = { count: 12, color: 0xffffff, color2: null, shape: 'dot', speed: 5, life: 0.7, size: 1.6, gravity: -6, drag: 1.5, spread: 1, up: 0, jitter: 0.2, grow: null, spin: 0, vary: 0.08 };
const DIR_DEFAULTS = { count: 10, color: 0xffffff, color2: null, shape: 'dot', speed: 10, life: 0.5, size: 1.6, gravity: 0, drag: 1, cone: 0.35, jitter: 0, grow: null, spin: 0, vary: 0 };

// darker, more saturated partner of a colour (for colour -> colour2 steps)
const _dc = new THREE.Color(), _hsl = {};
export function deep(c) {
  _dc.set(c).getHSL(_hsl);
  _dc.setHSL((_hsl.h + 0.97) % 1, Math.min(1, _hsl.s * 1.1 + 0.1), _hsl.l * 0.55);
  return _dc.getHex();
}

// shared VFX palette: two tones per material, matched to the cel ramp
export const FXC = {
  fireHot: 0xffe066, fire: 0xff9a2e, fireDeep: 0xd8321c,
  smoke: 0x8f8998, smokeDark: 0x544e5c,
  ice: 0xe6fdff, iceDeep: 0x3f9be8,
  frost: 0xffffff, frostDeep: 0xa9dcf5,
  dust: 0xe8dcc8, dustDeep: 0x9c8e7a,
  tele: 0x9dffd9, teleDeep: 0x169e7a,
  tk: 0xc07bff, tkDeep: 0x5726b0,
  sky: 0xd4ecff, skyDeep: 0x4f9de8,
  speed: 0xfff27a, speedDeep: 0xf2a400,
  pink: 0xffc6ec, pinkDeep: 0xd04f99,
  dupe: 0xffd6b5, dupeDeep: 0xe0702e,
  invis: 0xe8ebf7, invisDeep: 0x8188a8,
  gold: 0xffe27a, goldDeep: 0xe88a12,
  hurt: 0xff6b7f, hurtDeep: 0xa30f33,
  white: 0xffffff,
};
