import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeAuthoredProp, hasAuthoredProp, AUTHORED } from './authored.js';
import { CONFIG } from './config.js';
import { rand, randInt, pick, RUNTIME } from './utils.js';

const PITCH = CONFIG.BLOCK + CONFIG.ROAD;   // chunk pitch (block + one road)
const RADIUS = CONFIG.CHUNK_RADIUS;
const DRESS_FAR = 80;  // m from the focus to a chunk's nearest edge

// ---------------------------------------------------------------------------
// procedural textures (drawn once, shared by every chunk)
// ---------------------------------------------------------------------------

function makeWindowTexture(warm = false) {
  // Comic-style facade tile: 4x4 windows per 4.8 m, inked mullions, glass
  // with a hard diagonal glare, a few lit / blind-drawn windows. The tower
  // tint multiplies this, so it is kept fairly neutral.
  const S = 512, n = 4, cell = S / n;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = warm ? '#5a4d43' : '#46505e';            // spandrel / frame
  g.fillRect(0, 0, S, S);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const x0 = x * cell + 10, y0 = y * cell + 12, w = cell - 20, h = cell - 26;
      const r = Math.random();
      let top, bot;
      if (r < 0.12) { top = '#ffe9a8'; bot = '#ffc96b'; }                  // lit window
      else if (r < 0.22) { top = '#c9d2dc'; bot = '#aeb9c6'; }             // blinds down
      else { const t = rand(-14, 14); top = `rgb(${200 + t},${222 + t},${240 + t})`; bot = `rgb(${130 + t},${165 + t},${205 + t})`; }
      const gr = g.createLinearGradient(0, y0, 0, y0 + h);
      gr.addColorStop(0, top); gr.addColorStop(1, bot);
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      if (r >= 0.12 && r < 0.22) { g.fillStyle = 'rgba(80,90,100,0.35)'; for (let k = 6; k < h; k += 9) g.fillRect(x0, y0 + k, w, 2); }
      if (r >= 0.22) {                                                     // comic glare streaks
        g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
        g.fillStyle = 'rgba(255,255,255,0.55)';
        const o = rand(-0.2, 0.5) * w;
        g.beginPath(); g.moveTo(x0 + o, y0 + h); g.lineTo(x0 + o + w * 0.22, y0 + h); g.lineTo(x0 + o + w * 0.72, y0); g.lineTo(x0 + o + w * 0.5, y0); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.beginPath(); g.moveTo(x0 + o + w * 0.3, y0 + h); g.lineTo(x0 + o + w * 0.36, y0 + h); g.lineTo(x0 + o + w * 0.86, y0); g.lineTo(x0 + o + w * 0.8, y0); g.fill();
        g.restore();
      }
      // ink frame + sill
      g.strokeStyle = 'rgba(18,18,28,0.9)'; g.lineWidth = 4; g.strokeRect(x0, y0, w, h);
      g.fillStyle = 'rgba(230,232,236,0.55)'; g.fillRect(x0 - 4, y0 + h + 3, w + 8, 5);
      g.fillStyle = 'rgba(18,18,28,0.6)'; g.fillRect(x0 + w / 2 - 1.5, y0, 3, h);   // mullion
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeCloudTexture() {
  // cel cloud: hard-edged puffs, a flat cool shadow band underneath and a
  // soft ink rim, so the sky matches the shaded world
  const W = 256, H = 128;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const puffs = [[60, 80, 34], [104, 62, 44], [154, 70, 40], [196, 84, 30], [128, 88, 34], [86, 92, 26]];
  const path = () => { g.beginPath(); for (const [x, y, r] of puffs) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); } };
  g.save(); path(); g.lineWidth = 6; g.strokeStyle = 'rgba(70,90,140,0.35)'; g.stroke(); g.restore();
  path(); g.fillStyle = '#ffffff'; g.fill();
  g.save(); path(); g.clip();
  g.fillStyle = '#dde6f7'; g.fillRect(0, 92, W, H);           // shadow band
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x - r * 0.25, y - r * 0.3, r * 0.45, 0, Math.PI * 2); g.fill(); }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// One ground tile per theme (road margins + sidewalk ring + interior).
function makeGroundTile(theme) {
  // Comic-style painted ground, 1024 px per 30 m chunk (~34 px/m). Anything
  // that crosses a tile edge (road grain, dashes) is either random speckle or
  // mirrored, so neighbouring tiles still meet cleanly at the road centre.
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const px = S / PITCH;
  const roadW = (CONFIG.ROAD / 2) * px;
  const walkW = 1.6 * px;
  const kerbW = 0.22 * px;
  const INK = 'rgba(22,20,30,0.85)';
  const inner = { x: roadW + walkW, y: roadW + walkW, w: S - 2 * (roadW + walkW) };

  const blob = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r, r * rand(0.5, 1), rand(0, Math.PI), 0, Math.PI * 2); g.fill(); };
  const crack = (x, y, len, w, col) => {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y);
    let a = rand(0, Math.PI * 2);
    for (let i = 0; i < 5; i++) { a += rand(-0.7, 0.7); x += Math.cos(a) * len / 5; y += Math.sin(a) * len / 5; g.lineTo(x, y); }
    g.stroke();
  };

  // ---- lot interior ----
  if (theme === 'downtown') {
    // large plaza pavers in a running bond, each slab its own tone
    g.fillStyle = '#9aa0a8'; g.fillRect(0, 0, S, S);
    const pw = 1.6 * px, ph = 0.8 * px;
    for (let r = 0, y = inner.y; y < inner.y + inner.w; r++, y += ph) {
      for (let x = inner.x - (r % 2) * pw / 2; x < inner.x + inner.w; x += pw) {
        const l = rand(-10, 10);
        g.fillStyle = `rgb(${158 + l},${163 + l},${171 + l})`;
        g.fillRect(x + 1.5, y + 1.5, pw - 3, ph - 3);
        if (Math.random() < 0.18) { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 3, y + 3, pw * 0.5, ph * 0.25); }
      }
    }
    for (let i = 0; i < 25; i++) crack(rand(inner.x + 20, inner.x + inner.w - 20), rand(inner.y + 20, inner.y + inner.w - 20), rand(14, 40), 1.4, 'rgba(40,42,50,0.45)');
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '30,30,40'},${rand(0.03, 0.08)})`; g.fillRect(rand(0, S), rand(0, S), 2, 2); }
  } else {
    // grass: base, big tonal patches, then brushed blade strokes
    g.fillStyle = '#5e9a45'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) blob(rand(0, S), rand(0, S), rand(30, 90), Math.random() < 0.5 ? 'rgba(120,180,80,0.25)' : 'rgba(55,105,45,0.25)');
    g.lineCap = 'round';
    for (let i = 0; i < 9000; i++) {
      const x = rand(0, S), y = rand(0, S), h = rand(4, 9);
      const t = Math.random();
      g.strokeStyle = t < 0.45 ? `rgba(140,200,95,${rand(0.35, 0.7)})` : t < 0.9 ? `rgba(55,110,45,${rand(0.35, 0.7)})` : 'rgba(30,70,30,0.6)';
      g.lineWidth = rand(1.2, 2.2);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rand(-2, 2), y - h * 0.6, x + rand(-3, 3), y - h); g.stroke();
    }
    // clover clumps and a few flowers
    for (let i = 0; i < 120; i++) { const x = rand(0, S), y = rand(0, S); for (let k = 0; k < 3; k++) blob(x + rand(-4, 4), y + rand(-4, 4), 3, 'rgba(70,130,55,0.8)'); }
    for (let i = 0; i < 90; i++) blob(rand(0, S), rand(0, S), 2.2, ['#ffffff', '#ffe36b', '#ff9ec7', '#c9a7ff'][randInt(0, 3)]);
  }

  // ---- sidewalk ring: paving slabs with grout ----
  const side = theme === 'downtown' ? [196, 199, 205] : [208, 202, 190];
  const slabsAlong = 18;
  const drawWalk = (x0, y0, w, h, horiz) => {
    g.fillStyle = 'rgb(120,118,115)'; g.fillRect(x0, y0, w, h);
    const n = slabsAlong, len = (horiz ? w : h) / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 2; j++) {
        const l = rand(-12, 8);
        g.fillStyle = `rgb(${side[0] + l},${side[1] + l},${side[2] + l})`;
        const a = i * len + 1.5, b = j * (horiz ? h : w) / 2 + 1.5;
        const sw = len - 3, sh = (horiz ? h : w) / 2 - 3;
        if (horiz) g.fillRect(x0 + a, y0 + b, sw, sh); else g.fillRect(x0 + b, y0 + a, sh, sw);
        if (Math.random() < 0.12) {
          const cx = horiz ? x0 + a + rand(4, sw - 4) : x0 + b + rand(4, sh - 4);
          const cy = horiz ? y0 + b + rand(4, sh - 4) : y0 + a + rand(4, sw - 4);
          crack(cx, cy, rand(8, 18), 1.2, 'rgba(60,58,55,0.55)');
        }
      }
    }
  };
  drawWalk(roadW, roadW, S - roadW * 2, walkW, true);
  drawWalk(roadW, S - roadW - walkW, S - roadW * 2, walkW, true);
  drawWalk(roadW, roadW, walkW, S - roadW * 2, false);
  drawWalk(S - roadW - walkW, roadW, walkW, S - roadW * 2, false);
  // ink line where the sidewalk meets the lot
  g.strokeStyle = 'rgba(22,20,30,0.45)'; g.lineWidth = 2.5;
  g.strokeRect(inner.x, inner.y, inner.w, inner.w);

  // ---- asphalt margins ----
  g.fillStyle = '#3a3d47';
  g.fillRect(0, 0, S, roadW); g.fillRect(0, S - roadW, S, roadW);
  g.fillRect(0, 0, roadW, S); g.fillRect(S - roadW, 0, roadW, S);
  const onRoad = () => { const a = rand(0, S), b = rand(0, roadW) + (Math.random() < 0.5 ? 0 : S - roadW); return Math.random() < 0.5 ? [a, b] : [b, a]; };
  g.save();
  g.beginPath(); g.rect(0, 0, S, roadW); g.rect(0, S - roadW, S, roadW); g.rect(0, 0, roadW, S); g.rect(S - roadW, 0, roadW, S); g.clip();
  for (let i = 0; i < 60; i++) { const [x, y] = onRoad(); blob(x, y, rand(20, 60), Math.random() < 0.5 ? 'rgba(80,84,96,0.22)' : 'rgba(25,26,32,0.22)'); }
  for (let i = 0; i < 14; i++) { const [x, y] = onRoad(); blob(x, y, rand(8, 18), 'rgba(15,15,22,0.35)'); }  // oil stains
  for (let i = 0; i < 9000; i++) { const [x, y] = onRoad(); g.fillStyle = `rgba(${Math.random() < 0.6 ? '255,255,255' : '0,0,0'},${rand(0.03, 0.09)})`; g.fillRect(x, y, rand(1, 3), rand(1, 3)); }
  for (let i = 0; i < 18; i++) { const [x, y] = onRoad(); if (x > 30 && x < S - 30 && y > 30 && y < S - 30) crack(x, y, rand(20, 60), 1.6, 'rgba(14,14,20,0.7)'); }
  g.restore();

  // ---- kerb: light curb stone with an ink edge on the road side ----
  g.fillStyle = '#d9d6cf';
  g.fillRect(roadW - kerbW, roadW - kerbW, S - 2 * (roadW - kerbW), kerbW);
  g.fillRect(roadW - kerbW, S - roadW, S - 2 * (roadW - kerbW), kerbW);
  g.fillRect(roadW - kerbW, roadW - kerbW, kerbW, S - 2 * (roadW - kerbW));
  g.fillRect(S - roadW, roadW - kerbW, kerbW, S - 2 * (roadW - kerbW));
  g.strokeStyle = INK; g.lineWidth = 3;
  g.strokeRect(roadW - kerbW, roadW - kerbW, S - 2 * (roadW - kerbW), S - 2 * (roadW - kerbW));

  // ---- road markings, slightly worn ----
  const worn = (fill, x, y, w, h) => {
    g.fillStyle = fill; g.fillRect(x, y, w, h);
    // a few soft scuffs, not a dot pattern
    for (let i = 0; i < (w * h) / 900; i++) blob(x + rand(0, w), y + rand(0, h), rand(2, 6), 'rgba(58,61,71,0.22)');
  };
  const dashL = 2.6 * px, gap = 2.6 * px, lw = 0.35 * px;
  for (let d = gap; d < S - dashL; d += dashL + gap) {
    worn('rgb(238,200,80)', d, 0, dashL, lw); worn('rgb(238,200,80)', d, S - lw, dashL, lw);
    worn('rgb(238,200,80)', 0, d, lw, dashL); worn('rgb(238,200,80)', S - lw, d, lw, dashL);
  }
  const cwLen = roadW * 0.8, stripe = 0.55 * px;
  for (let s2 = 0; s2 < 5; s2++) {
    const off = roadW + walkW + 1.2 * px + s2 * stripe * 2;
    if (off > roadW + walkW + 8 * px) break;
    worn('rgb(236,236,240)', off, roadW * 0.1, stripe, cwLen);
    worn('rgb(236,236,240)', off, S - roadW * 0.9, stripe, cwLen);
    worn('rgb(236,236,240)', roadW * 0.1, off, cwLen, stripe);
    worn('rgb(236,236,240)', S - roadW * 0.9, off, cwLen, stripe);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------------------
// geometry helpers (vertex-coloured, baked into world coordinates, merged)
// ---------------------------------------------------------------------------

const _color = new THREE.Color();
function paint(geo, hex, shade = 0) {
  if (geo.index) geo = geo.toNonIndexed();
  _color.set(hex);
  if (shade) _color.multiplyScalar(1 + rand(-shade, shade));
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = _color.r; arr[i * 3 + 1] = _color.g; arr[i * 3 + 2] = _color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

function box(list, w, h, d, x, y, z, hex, { ry = 0, shade = 0.06 } = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  list.push(paint(g, hex, shade));
}

function cone4(list, r, h, x, y, z, hex) {
  const g = new THREE.ConeGeometry(r, h, 4);
  g.rotateY(Math.PI / 4);
  g.translate(x, y, z);
  list.push(paint(g, hex, 0.05));
}

function topOf(platforms, x, z) {
  let y = 0;
  for (const p of platforms) {
    if (Math.abs(x - p.x) < p.hw && Math.abs(z - p.z) < p.hd) y = Math.max(y, p.top);
  }
  return y;
}

function blob(list, r, x, y, z, hex, detail = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  g.translate(x, y, z);
  list.push(paint(g, hex, 0.1));
}

function cylinder(list, rt, rb, h, seg, x, y, z, hex) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  g.translate(x, y, z);
  list.push(paint(g, hex, 0.05));
}

// geometry helpers, also used by the asset-catalog render harness
export { paint, box, cone4, blob, cylinder };

// smooth 2D value noise
function hash2(i, j, seed) {
  const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smooth(x - ix), fz = smooth(z - iz);
  return (
    hash2(ix, iz, seed) * (1 - fx) * (1 - fz) +
    hash2(ix + 1, iz, seed) * fx * (1 - fz) +
    hash2(ix, iz + 1, seed) * (1 - fx) * fz +
    hash2(ix + 1, iz + 1, seed) * fx * fz
  );
}

// ---------------------------------------------------------------------------

const NO_INK_PROPS = new Set(['acunit', 'flowers', 'fence', 'hedge', 'mailbox', 'planter']);

export class World {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.focus = { x: 0, z: 0 };
    this.seed = rand(0, 1000);
    this.drift = 0;
    this.xray = false;
    this.orphans = [];

    // permanent daytime atmosphere for both biomes
    scene.fog = new THREE.Fog(0xcfe5f8, 60, 142);
    this.hemi = new THREE.HemisphereLight(0xd6e9ff, 0x5d7a4d, 0.95);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d5, 1.7);
    this.sun.position.set(60, 110, 40);
    scene.add(this.sun);
    scene.add(this.sun.target);

    if (RUNTIME.shadows) {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048);
      const sc = this.sun.shadow.camera;
      sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70;
      sc.near = 20; sc.far = 260;
      this.sun.shadow.bias = -0.0006;
      this.sun.shadow.normalBias = 0.6;
    }

    // gradient sky dome + drifting clouds
    this.buildSky();

    // shared resources
    this.windowTexCool = makeWindowTexture(false);
    this.windowTexWarm = makeWindowTexture(true);
    this.groundMats = {
      suburb: new THREE.MeshLambertMaterial({ map: makeGroundTile('suburb') }),
      downtown: new THREE.MeshLambertMaterial({ map: makeGroundTile('downtown') }),
    };
    this.groundGeo = new THREE.PlaneGeometry(PITCH, PITCH);
    this.groundGeo.rotateX(-Math.PI / 2);
    this.vcMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.towerMatCool = new THREE.MeshLambertMaterial({ map: this.windowTexCool, vertexColors: true });
    this.towerMatWarm = new THREE.MeshLambertMaterial({ map: this.windowTexWarm, vertexColors: true });
    this.buildingMats = [this.vcMat, this.towerMatCool, this.towerMatWarm];

    this.update(this.focus, 0, true);
  }

  buildSky() {
    const SKY_R = 185;   // must stay inside the camera far plane (200)
    const geo = new THREE.SphereGeometry(SKY_R, 24, 14);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const zen = new THREE.Color(0x2c74e0);
    const mid = new THREE.Color(0x86bff2);
    const hor = new THREE.Color(0xe8f2fb);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.max(0, Math.min(1, pos.getY(i) / SKY_R));
      if (t < 0.25) c.lerpColors(hor, mid, t / 0.25);
      else c.lerpColors(mid, zen, (t - 0.25) / 0.75);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.skyDome = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    this.skyDome.renderOrder = -10;
    this.scene.add(this.skyDome);

    const cloudTex = makeCloudTexture();
    this.clouds = [];
    for (let i = 0; i < 10; i++) {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: cloudTex, transparent: true, opacity: rand(0.5, 0.8), depthWrite: false, fog: false,
      }));
      const s = rand(22, 40);
      spr.scale.set(s, s * 0.45, 1);
      spr.position.set(rand(-150, 150), rand(48, 80), rand(-150, 150));
      this.scene.add(spr);
      this.clouds.push({ spr, speed: rand(0.9, 2.2) });
    }
  }

  // biome field: two octaves, balanced threshold, drifting slowly so new
  // generation gradually introduces the other biome at the edges
  themeAt(cx, cz) {
    const x1 = cx * 0.14 + this.drift, z1 = cz * 0.14;
    const x2 = cx * 0.31 - this.drift * 0.6, z2 = cz * 0.31;
    const v = vnoise(x1, z1, this.seed) * 0.72 + vnoise(x2, z2, this.seed + 37) * 0.28;
    return v > 0.5 ? 'downtown' : 'suburb';
  }

  update(focus, dt = 0, buildAll = false) {
    this.focus = { x: focus.x, z: focus.z };
    this.drift += dt * 0.004;

    // sun + sky follow the action
    this.sun.position.set(focus.x + 60, 110, focus.z + 40);
    this.sun.target.position.set(focus.x, 0, focus.z);
    this.skyDome?.position.set(focus.x, 0, focus.z);
    if (this.clouds) {
      for (const c of this.clouds) {
        c.spr.position.x += c.speed * dt;
        if (c.spr.position.x - focus.x > 150) c.spr.position.x -= 300;
        if (c.spr.position.x - focus.x < -150) c.spr.position.x += 300;
        if (c.spr.position.z - focus.z > 150) c.spr.position.z -= 300;
        if (c.spr.position.z - focus.z < -150) c.spr.position.z += 300;
      }
    }

    const fcx = Math.round(focus.x / PITCH);
    const fcz = Math.round(focus.z / PITCH);

    for (const [key, chunk] of this.chunks) {
      if (Math.abs(chunk.cx - fcx) > RADIUS + 1 || Math.abs(chunk.cz - fcz) > RADIUS + 1) {
        this.disposeChunk(chunk);
        this.chunks.delete(key);
      }
    }

    // far-chunk dressing cull: small props beyond ~DRESS_FAR from the action are
    // a few fogged pixels each but cost a draw call per model per chunk
    for (const chunk of this.chunks.values()) {
      if (!chunk.dressing?.length) continue;
      const ex = Math.max(0, Math.abs(chunk.cx * PITCH - focus.x) - PITCH / 2);
      const ez = Math.max(0, Math.abs(chunk.cz * PITCH - focus.z) - PITCH / 2);
      const near = Math.hypot(ex, ez) < DRESS_FAR;
      if (chunk.dressNear !== near) {
        chunk.dressNear = near;
        for (const m of chunk.dressing) m.visible = near;
      }
    }

    let budget = buildAll ? Infinity : 4;
    for (let r = 0; r <= RADIUS && budget > 0; r++) {
      for (let cx = fcx - r; cx <= fcx + r && budget > 0; cx++) {
        for (let cz = fcz - r; cz <= fcz + r && budget > 0; cz++) {
          if (Math.max(Math.abs(cx - fcx), Math.abs(cz - fcz)) !== r) continue;
          const key = cx + ':' + cz;
          if (!this.chunks.has(key)) {
            this.chunks.set(key, this.buildChunk(cx, cz));
            budget--;
          }
        }
      }
    }

    for (let i = this.orphans.length - 1; i >= 0; i--) {
      const o = this.orphans[i];
      o.ttl -= dt;
      if (o.ttl <= 0 && !o.busy) {
        this.destroyLiftableMesh(o);
        this.orphans.splice(i, 1);
      }
    }
  }

  disposeChunk(chunk) {
    for (const l of chunk.liftables) {
      if (!l.alive) continue;
      if (l.busy) {
        l.ttl = 30;
        this.orphans.push(l);
        chunk.group.remove(l.mesh);
        this.scene.add(l.mesh);
      } else {
        this.destroyLiftableMesh(l);
      }
    }
    this.scene.remove(chunk.group);
    chunk.group.traverse((o) => {
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
      if (o.userData.authored) o.material?.dispose?.();   // per-instance paint
    });
  }

  destroyLiftableMesh(l) {
    l.alive = false;
    l.mesh.parent?.remove(l.mesh);
    l.mesh.geometry.dispose();
  }

  // ---------------- chunk construction ----------------

  buildChunk(cx, cz) {
    const theme = this.themeAt(cx, cz);
    const ox = cx * PITCH, oz = cz * PITCH;
    const group = new THREE.Group();
    const colliders = [];
    const platforms = [];
    const liftables = [];
    const vc = [];
    vc.extra = []; // separate (textured) meshes, e.g. authored houses
    vc.inst = {};  // authored static props: id -> [Matrix4], merged per chunk below
    const towersCool = [];
    const towersWarm = [];

    const ground = new THREE.Mesh(this.groundGeo, this.groundMats[theme]);
    ground.position.set(ox, 0, oz);
    ground.userData.shared = true;
    ground.receiveShadow = RUNTIME.shadows;
    group.add(ground);

    const addCollider = (x, z, hw, hd, h) => colliders.push({ x, z, hw, hd, h });
    // raised surfaces you stand on top of rather than walk into
    const addPlatform = (x, z, hw, hd, top) => platforms.push({ x, z, hw, hd, top });

    if (theme === 'suburb') this.buildSuburbBlock(ox, oz, vc, liftables, addCollider, addPlatform);
    else this.buildDowntownBlock(ox, oz, vc, towersCool, towersWarm, liftables, addCollider, addPlatform);

    const addMerged = (geos, mat) => {
      if (!geos.length) return;
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
      mesh.castShadow = RUNTIME.shadows;
      mesh.receiveShadow = RUNTIME.shadows;
      group.add(mesh);
    };
    addMerged(vc, this.vcMat);
    // authored static dressing (trees, shrubs, lamps): one merged mesh per
    // model per chunk, sharing a material, so a street of trees is one draw
    const dressing = []; // small merged props: hidden in far chunks (fogged out anyway)
    for (const [id, mats] of Object.entries(vc.inst)) {
      const a = AUTHORED.props[id];
      if (!a || !mats.length) continue;
      const geos = mats.map((m) => a.geo.clone().applyMatrix4(m));
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), this.authoredMat(id));
      mesh.name = 'auth:' + id;
      // small dressing reads fine without ink and would double its triangles
      if (NO_INK_PROPS.has(id)) mesh.userData.noOutline = true;
      geos.forEach((g) => g.dispose());
      vc.extra.push(mesh);
      dressing.push(mesh);
    }
    for (const m of vc.extra) {
      m.castShadow = RUNTIME.shadows;
      m.receiveShadow = RUNTIME.shadows;
      group.add(m);
    }
    addMerged(towersCool, this.towerMatCool);
    addMerged(towersWarm, this.towerMatWarm);
    for (const l of liftables) {
      l.mesh.castShadow = RUNTIME.shadows;
      // props rest on whatever they were placed on, not on the bare ground plane
      l.baseY = topOf(platforms, l.mesh.position.x, l.mesh.position.z);
      l.mesh.position.y = l.baseY;
      group.add(l.mesh);
    }

    this.scene.add(group);
    return { cx, cz, theme, group, colliders, platforms, liftables, dressing };
  }

  buildSuburbBlock(ox, oz, vc, liftables, addCollider, addPlatform) {
    const B = CONFIG.BLOCK;
    const housePalette = [0xe8dcc8, 0xd9c1a8, 0xc3d5e6, 0xd7e2c1, 0xe2bfb6, 0xf0e6d0, 0xb8cfd9, 0xd9d0e8, 0xead9a8, 0xc9e2d4];
    const roofPalette = [0x8a4b3b, 0x5b6570, 0x71504a, 0x4f6b52, 0x815f3f, 0x3f4b5c];
    for (let lx = 0; lx < 2; lx++) {
      for (let lz = 0; lz < 2; lz++) {
        const cxp = ox + (lx - 0.5) * (B / 2);
        const czp = oz + (lz - 0.5) * (B / 2);
        const facing = lz === 0 ? Math.PI : 0;
        if (Math.random() < 0.15) {
          // park lot
          this.tree(vc, cxp + rand(-2.5, 2.5), czp + rand(-2.5, 2.5), rand(0.9, 1.6), addCollider);
          if (Math.random() < 0.7) this.tree(vc, cxp + rand(-3, 3), czp + rand(-3, 3), rand(0.7, 1.2), addCollider);
          this.flowerPatch(vc, cxp + rand(-3, 3), czp + rand(-3, 3));
          this.shrub(vc, rand(0.5, 0.8), cxp + rand(-3, 3), czp + rand(-3, 3));
          continue;
        }
        const wall = pick(housePalette);
        const roof = pick(roofPalette);
        const kind = randInt(0, 4);
        this.house(vc, cxp, czp, facing, wall, roof, kind, addCollider, addPlatform);
        // yard dressing
        if (Math.random() < 0.7) this.tree(vc, cxp + pick([-1, 1]) * rand(3.4, 4.6), czp + rand(-3.5, 3.5), rand(0.7, 1.3), addCollider);
        if (Math.random() < 0.5) this.shrub(vc, rand(0.35, 0.6), cxp + rand(-4, 4), czp + rand(-4, 4));
        if (Math.random() < 0.45) this.flowerPatch(vc, cxp + rand(-4, 4), czp + rand(-4, 4));
        if (Math.random() < 0.3) this.shed(vc, cxp + pick([-1, 1]) * 3.8, czp - Math.sign(Math.cos(facing) || 1) * 3.6, addCollider);

        const streetZ = czp + (lz === 0 ? -1 : 1) * (B / 4 - 0.4);
        if (Math.random() < 0.4 && hasAuthoredProp('fence') && vc.inst) {
          // modelled picket fence: two 4.2 m runs with a gate gap
          this.placeAuthored(vc, 'fence', cxp - 2.6, 0, streetZ, 1, lz === 0 ? Math.PI : 0);
          this.placeAuthored(vc, 'fence', cxp + 2.6, 0, streetZ, 1, lz === 0 ? Math.PI : 0);
        } else if (Math.random() < 0.4 && hasAuthoredProp('hedge') && vc.inst) {
          for (const o of [-3, 0, 3]) this.placeAuthored(vc, 'hedge', cxp + o, 0, streetZ, rand(0.95, 1.05), lz === 0 ? Math.PI : 0);
        } else if (Math.random() < 0.4) {
          // white picket fence runs with a gate gap
          box(vc, 4.2, 0.55, 0.09, cxp - 2.6, 0.32, streetZ, 0xe8e6df);
          box(vc, 4.2, 0.55, 0.09, cxp + 2.6, 0.32, streetZ, 0xe8e6df);
          box(vc, 0.12, 0.75, 0.12, cxp - 4.6, 0.4, streetZ, 0xd8d5cc);
          box(vc, 0.12, 0.75, 0.12, cxp + 4.6, 0.4, streetZ, 0xd8d5cc);
        } else if (Math.random() < 0.4) {
          // hedge row
          box(vc, 9, 0.7, 0.55, cxp, 0.4, streetZ, pick([0x3f7a30, 0x4f8f3a]), { shade: 0.12 });
        }
        // mailbox on the lawn beside the front walk (the gap in the fence),
        // kept inside the property line so it never lands out in the road
        if (Math.random() < 0.5) {
          const mz = czp + (lz === 0 ? -1 : 1) * rand(3.2, 3.8);
          const mx = cxp + pick([-1, 1]) * rand(1.0, 1.6);
          if (!this.placeAuthored(vc, 'mailbox', mx, 0, mz, 1, lz === 0 ? Math.PI : 0)) {
            box(vc, 0.09, 1.0, 0.09, mx, 0.5, mz, 0x5a4634);
            box(vc, 0.34, 0.24, 0.5, mx, 1.1, mz, pick([0x9a3030, 0x3a66c2, 0x3a3d42]));
          }
        }
      }
    }
    if (Math.random() < 0.45) this.spawnCar(liftables, ox + rand(-B / 3, B / 3), oz + pick([-1, 1]) * (B / 2 + 1.6), 0);
    if (Math.random() < 0.3) this.spawnBin(liftables, ox + pick([-1, 1]) * (B / 2 - 1), oz + rand(-B / 3, B / 3));
  }

  // Modelled houses (reskin). Each kind keeps the procedural footprint,
  // colliders and platforms; the model is stretched to that footprint so
  // streets don't look copy-pasted, and repainted with the lot's wall/roof.
  authoredHouse(vc, x, z, facing, wall, roof, kind, front, addCollider, addPlatform) {
    const ID = ['house-bungalow', 'house-two-storey', 'house-ranch', 'house-modern', 'house-cottage'][kind];
    if (!vc.extra || !hasAuthoredProp(ID)) return false;
    const sinF = Math.sin(facing), cosF = Math.cos(facing);
    let W, D, H, cx = 0, cz = 0;
    if (kind === 0) {
      const w = rand(5.5, 6.5), d = rand(4.6, 5.4), h = rand(3.0, 3.6);
      W = w + 3; D = d * 1.05; H = h + 1.6; cx = 1.5; cz = 0.2;
      addCollider(x, z, Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.2, h + 2);
      const g = front(w / 2 + 1.5, 0.4);
      addCollider(g.x, g.z, 1.7, 1.9, 2.6);
      this.driveway(vc, g.x, g.z, facing);
      this.frontPath(vc, x, z, w, d, facing);
    } else if (kind === 1) {
      const w = rand(5, 6), d = rand(4.6, 5.4), h = rand(5.4, 6.2);
      W = w * 1.05; D = d * 1.05; H = h + 1.9;
      addCollider(x, z, Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.2, h + 2);
      this.frontPath(vc, x, z, w, d, facing);
    } else if (kind === 2) {
      const w = rand(6.5, 7.5), d = rand(3.6, 4.2), h = rand(3.0, 3.4);
      const wingW = rand(3.2, 3.8);
      W = w + 0.5; D = d + 3.4; H = h + 1.0; cz = 1.55;
      const wing = front(-w / 2 + wingW / 2, d / 2 + 1.4);
      addCollider(x, z, w / 2 + 0.4, d / 2 + 0.4, h + 1);
      addCollider(wing.x, wing.z, wingW / 2 + 0.3, 1.9, h + 1);
      this.frontPath(vc, x, z, w, d, facing);
    } else if (kind === 3) {
      const w = rand(5, 6), d = rand(4.4, 5), h = rand(3.4, 4);
      W = w * 1.2; D = d; H = h * 1.35 + 0.3; cx = w * 0.0975;
      addCollider(x, z, w / 2 + 0.5, d / 2 + 0.4, h * 1.4 + 1);
      this.driveway(vc, front(w / 2 + 1.6, 0.6).x, front(w / 2 + 1.6, 0.6).z, facing);
    } else {
      const w = rand(4.8, 5.6), d = rand(4.2, 4.8), h = rand(2.8, 3.2);
      W = w; D = d + 2.2; H = h + 2.4; cz = 1.1;
      const p = front(0, d / 2 + 1.1);
      addPlatform(p.x, p.z, w * 0.45, 1.0, 0.24);
      addCollider(x, z, Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.2, h + 2);
      this.frontPath(vc, x, z, w, d + 2.2, facing);
    }
    const mesh = makeAuthoredProp(ID, wall, roof);
    mesh.name = 'house:' + ID;
    const bb = mesh.geometry.boundingBox;
    mesh.scale.set(W / (bb.max.x - bb.min.x), H / (bb.max.y - bb.min.y), D / (bb.max.z - bb.min.z));
    mesh.rotation.y = facing;
    const c = front(cx, cz);
    mesh.position.set(c.x, 0, c.z);
    vc.extra.push(mesh);
    return true;
  }

  frontPath(vc, x, z, w, d, facing) {
    const sinF = Math.sin(facing), cosF = Math.cos(facing);
    const px = x + (w * 0.22) * cosF + (d / 2 + 2.2) * sinF;
    const pz = z - (w * 0.22) * sinF + (d / 2 + 2.2) * cosF;
    box(vc, 1.1, 0.06, 4.2, px, 0.04, pz, 0xc9c4b8, { ry: facing, shade: 0.02 });
  }

  house(vc, x, z, facing, wall, roof, kind, addCollider, addPlatform) {
    const sinF = Math.sin(facing), cosF = Math.cos(facing);
    const front = (dx, dz) => ({ x: x + dx * cosF + dz * sinF, z: z - dx * sinF + dz * cosF });
    const trim = new THREE.Color(wall).multiplyScalar(0.8).getHex();

    if (this.authoredHouse(vc, x, z, facing, wall, roof, kind, front, addCollider, addPlatform)) return;
    if (kind === 0) {
      // classic one-storey with hip roof + garage
      const w = rand(5.5, 6.5), d = rand(4.6, 5.4), h = rand(3.0, 3.6);
      box(vc, w, h, d, x, h / 2, z, wall, { ry: facing });
      box(vc, w + 0.35, 0.22, d + 0.35, x, h + 0.05, z, trim, { ry: facing });
      cone4(vc, Math.max(w, d) * 0.72, rand(1.7, 2.3), x, h + 0.15, z, roof);
      addCollider(x, z, Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.2, h + 2);
      const g = front(w / 2 + 1.5, 0.4);
      box(vc, 3, 2.4, 3.4, g.x, 1.2, g.z, wall, { ry: facing });
      box(vc, 2.4, 1.8, 0.15, g.x + sinF * 1.75, 1.0, g.z + cosF * 1.75, 0x5a636e, { ry: facing });
      box(vc, 3.2, 0.25, 3.6, g.x, 2.5, g.z, roof, { ry: facing });
      addCollider(g.x, g.z, 1.7, 1.9, 2.6);
      this.houseFace(vc, x, z, w, d, h, facing, wall);
      this.driveway(vc, g.x, g.z, facing);
    } else if (kind === 1) {
      // two-storey with chimney
      const w = rand(5, 6), d = rand(4.6, 5.4), h = rand(5.4, 6.2);
      box(vc, w, h, d, x, h / 2, z, wall, { ry: facing });
      box(vc, w + 0.3, 0.18, d + 0.3, x, h / 2 + 0.05, z, trim, { ry: facing });
      cone4(vc, Math.max(w, d) * 0.7, rand(1.6, 2.1), x, h, z, roof);
      addCollider(x, z, Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.2, h + 2);
      box(vc, 0.6, 1.6, 0.6, x + w * 0.28, h + 0.8, z + d * 0.2, 0x9a6a55);
      this.houseFace(vc, x, z, w, d, h, facing, wall, true);
    } else if (kind === 2) {
      // L-shaped ranch
      const w = rand(6.5, 7.5), d = rand(3.6, 4.2), h = rand(3.0, 3.4);
      box(vc, w, h, d, x, h / 2, z, wall, { ry: facing });
      const wingW = rand(3.2, 3.8);
      const wing = front(-w / 2 + wingW / 2, d / 2 + 1.4);
      box(vc, wingW, h, 3.4, wing.x, h / 2, wing.z, wall, { ry: facing });
      box(vc, w + 0.5, 0.3, d + 0.5, x, h + 0.1, z, roof, { ry: facing });
      box(vc, wingW + 0.5, 0.3, 3.9, wing.x, h + 0.1, wing.z, roof, { ry: facing });
      addCollider(x, z, w / 2 + 0.4, d / 2 + 0.4, h + 1);
      addCollider(wing.x, wing.z, wingW / 2 + 0.3, 1.9, h + 1);
      this.houseFace(vc, x, z, w, d, h, facing, wall);
    } else if (kind === 3) {
      // modern flat-roof two-tone (staggered volumes)
      const w = rand(5, 6), d = rand(4.4, 5), h = rand(3.4, 4);
      const wall2 = pick([0x9aa4ad, 0x7d8891, 0xcbd2d8, 0x8a7b6d]);
      box(vc, w, h, d, x, h / 2, z, wall, { ry: facing });
      const g2 = front(w * 0.42, -d * 0.1);
      box(vc, w * 0.55, h * 1.35, d * 0.7, g2.x, h * 1.35 / 2, g2.z, wall2, { ry: facing });
      box(vc, w + 0.4, 0.22, d + 0.4, x, h + 0.11, z, 0x3a4048, { ry: facing });
      box(vc, w * 0.55 + 0.4, 0.22, d * 0.7 + 0.4, g2.x, h * 1.35 + 0.11, g2.z, 0x3a4048, { ry: facing });
      // wide modern window band
      const wf = front(-w * 0.1, d / 2 + 0.08);
      box(vc, w * 0.55, 1.2, 0.12, wf.x, 1.8, wf.z, 0x9fc6df, { ry: facing, shade: 0.03 });
      addCollider(x, z, w / 2 + 0.5, d / 2 + 0.4, h * 1.4 + 1);
      this.driveway(vc, front(w / 2 + 1.6, 0.6).x, front(w / 2 + 1.6, 0.6).z, facing);
    } else {
      // cottage with a covered porch
      const w = rand(4.8, 5.6), d = rand(4.2, 4.8), h = rand(2.8, 3.2);
      box(vc, w, h, d, x, h / 2, z, wall, { ry: facing });
      cone4(vc, Math.max(w, d) * 0.78, rand(2.0, 2.6), x, h, z, roof);
      // porch: slab + posts + little roof
      const p = front(0, d / 2 + 1.1);
      box(vc, w * 0.9, 0.22, 2.0, p.x, 0.13, p.z, 0xb7a184, { ry: facing });
      addPlatform(p.x, p.z, w * 0.45, 1.0, 0.24);
      const postL = front(-w * 0.38, d / 2 + 1.9);
      const postR = front(w * 0.38, d / 2 + 1.9);
      box(vc, 0.14, 2.2, 0.14, postL.x, 1.1, postL.z, 0xe8e6df);
      box(vc, 0.14, 2.2, 0.14, postR.x, 1.1, postR.z, 0xe8e6df);
      box(vc, w * 0.95, 0.18, 2.3, p.x, 2.3, p.z, roof, { ry: facing });
      addCollider(x, z, Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.2, h + 2);
      this.houseFace(vc, x, z, w, d, h, facing, wall);
    }
  }

  houseFace(vc, x, z, w, d, h, facing, wall, twoStorey = false) {
    const sinF = Math.sin(facing), cosF = Math.cos(facing);
    const faceZ = d / 2 + 0.06;
    const place = (dx, dy, bw, bh, hex) => {
      const wx = x + dx * cosF + faceZ * sinF;
      const wz = z - dx * sinF + faceZ * cosF;
      box(vc, bw, bh, 0.12, wx, dy, wz, hex, { ry: facing, shade: 0.03 });
    };
    place(w * 0.22, 1.05, 0.95, 2.1, pick([0x7a3b2e, 0x314a6e, 0x3e5a3a, 0x6e5a31]));
    place(w * 0.22, 0.12, 1.3, 0.24, 0xb9b4a8);
    place(-w * 0.24, 1.45, 1.2, 1.1, 0xbcd3e8);
    // window trim
    place(-w * 0.24, 1.45, 1.36, 1.26, 0xf0eee8);
    place(-w * 0.24, 1.45, 1.2, 1.1, 0xbcd3e8);
    if (w > 6) place(0, 1.45, 1.0, 1.0, 0xbcd3e8);
    if (twoStorey) {
      place(-w * 0.24, 3.9, 1.1, 1.0, 0xbcd3e8);
      place(w * 0.24, 3.9, 1.1, 1.0, 0xbcd3e8);
    }
    const px = x + (w * 0.22) * cosF + (d / 2 + 2.2) * sinF;
    const pz = z - (w * 0.22) * sinF + (d / 2 + 2.2) * cosF;
    box(vc, 1.1, 0.06, 4.2, px, 0.04, pz, 0xc9c4b8, { ry: facing, shade: 0.02 });
  }

  driveway(vc, x, z, facing) {
    box(vc, 3.0, 0.05, 5.5, x, 0.035, z, 0x9b9891, { ry: facing, shade: 0.02 });
  }

  shed(vc, x, z, addCollider) {
    const w = rand(1.8, 2.4), h = rand(1.8, 2.2);
    if (this.placeAuthored(vc, 'shed', x, 0, z, w / 2.1, randInt(0, 3) * Math.PI / 2)) {
      addCollider(x, z, w / 2 + 0.1, w / 2, h + 0.5);
      return;
    }
    box(vc, w, h, w * 0.85, x, h / 2, z, pick([0x8a7355, 0x6d7a68, 0x7d6a5c]));
    box(vc, w + 0.3, 0.35, w * 0.85 + 0.3, x, h + 0.15, z, 0x5b5048);
    addCollider(x, z, w / 2 + 0.1, w / 2, h + 0.5);
  }

  flowerPatch(vc, x, z) {
    if (this.placeAuthored(vc, 'flowers', x, 0, z, rand(0.9, 1.1), randInt(0, 3) * Math.PI / 2)) return;
    box(vc, 1.6, 0.12, 1.1, x, 0.07, z, 0x6d5238, { shade: 0.08 });
    for (let i = 0; i < 4; i++) {
      blob(vc, 0.12, x + rand(-0.6, 0.6), 0.22, z + rand(-0.4, 0.4), pick([0xe45c7a, 0xf2d34e, 0xd881e8, 0xf08a4b, 0xffffff]), 0);
    }
  }

  // shared material per authored static prop (no per-instance paint)
  authoredMat(id) {
    this._authMats = this._authMats || {};
    if (!this._authMats[id]) this._authMats[id] = makeAuthoredProp(id).material;
    return this._authMats[id];
  }

  placeAuthored(vc, id, x, y, z, s = 1, ry = 0) {
    if (!vc.inst || !hasAuthoredProp(id)) return false;
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry),
      new THREE.Vector3(s, s, s),
    );
    (vc.inst[id] = vc.inst[id] || []).push(m);
    return true;
  }

  shrub(vc, r, x, z) {
    if (this.placeAuthored(vc, 'bush', x, 0, z, r / 0.55 * rand(0.9, 1.1), rand(0, Math.PI * 2))) return;
    blob(vc, r, x, r * 0.85, z, pick([0x4f8f3a, 0x5da245, 0x3f7a30]));
  }

  tree(vc, x, z, s, addCollider) {
    const kinds = ['tree-round', 'tree-tall'].filter(hasAuthoredProp);
    if (kinds.length && vc.inst) {
      this.placeAuthored(vc, pick(kinds), x, 0, z, s * rand(0.9, 1.1), rand(0, Math.PI * 2));
      addCollider?.(x, z, 0.4 * s, 0.4 * s, 2.5 * s);
      return;
    }
    cylinder(vc, 0.16 * s, 0.26 * s, 2.1 * s, 6, x, 1.05 * s, z, 0x6b4a32);
    const canopy = pick([0x4f8f3a, 0x5da245, 0x3f7a30, 0x76a83f, 0x4a9668]);
    blob(vc, 1.15 * s, x, 2.6 * s, z, canopy);
    blob(vc, 0.8 * s, x + 0.7 * s, 2.1 * s, z + 0.3 * s, canopy);
    blob(vc, 0.7 * s, x - 0.6 * s, 2.3 * s, z - 0.4 * s, canopy);
    addCollider?.(x, z, 0.4 * s, 0.4 * s, 2.5 * s);
  }

  buildDowntownBlock(ox, oz, vc, towersCool, towersWarm, liftables, addCollider, addPlatform) {
    const B = CONFIG.BLOCK;
    const plaza = Math.random() < 0.16;
    box(vc, B, 0.14, B, ox, 0.07, oz, 0xa7abb2, { shade: 0.03 });
    addPlatform(ox, oz, B / 2, B / 2, 0.14);
    // painted plaza paving on top of the raised slab: reuses the inner part
    // of the downtown ground texture (one shared plane + material)
    if (vc.extra) {
      if (!this.slabTopGeo) {
        const g = new THREE.PlaneGeometry(B, B);
        g.rotateX(-Math.PI / 2);
        const m = (CONFIG.ROAD / 2) / PITCH, uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, m + uv.getX(i) * (1 - 2 * m), m + uv.getY(i) * (1 - 2 * m));
        this.slabTopGeo = g;
      }
      const top = new THREE.Mesh(this.slabTopGeo, this.groundMats.downtown);
      top.position.set(ox, 0.142, oz);
      top.userData.shared = true;
      top.receiveShadow = RUNTIME.shadows;
      vc.extra.push(top);
    }

    if (plaza) {
      if (!this.placeAuthored(vc, 'fountain', ox, 0.14, oz, 1, rand(0, Math.PI * 2))) {
        cylinder(vc, 1.6, 1.9, 0.5, 12, ox, 0.35, oz, 0x8d9299);
        cylinder(vc, 0.4, 0.5, 1.3, 8, ox, 1.0, oz, 0x9fb8c9);
        blob(vc, 0.42, ox, 1.75, oz, 0xbfe0f2);
      }
      addPlatform(ox, oz, 1.34, 1.34, 0.6);   // square inscribed in the fountain rim
      for (let i = 0; i < 3; i++) {
        const a = rand(0, Math.PI * 2), r = rand(4, 8);
        const tx = ox + Math.cos(a) * r, tz = oz + Math.sin(a) * r;
        if (!this.placeAuthored(vc, 'planter', tx, 0.1, tz, 1.8 / 1.4, randInt(0, 3) * Math.PI / 2)) box(vc, 1.8, 0.5, 1.8, tx, 0.35, tz, 0x7e838a);
        addPlatform(tx, tz, 0.9, 0.9, 0.6);
        this.tree(vc, tx, tz, rand(0.6, 0.9), addCollider);
      }
      this.spawnBench(liftables, ox + rand(-5, 5), oz + rand(-5, 5), rand(0, Math.PI));
    } else {
      const count = randInt(1, 2);
      for (let i = 0; i < count; i++) {
        const w = rand(7, 11), d = rand(7, 11);
        const tall = Math.random() < 0.2;
        const h = tall ? rand(30, 48) : rand(9, 26);
        const tx = ox + (count === 1 ? 0 : (i === 0 ? -B / 4.2 : B / 4.2)) + rand(-1, 1);
        const tz = oz + rand(-2.5, 2.5);
        const warm = Math.random() < 0.35;
        const towers = warm ? towersWarm : towersCool;
        const style = Math.random();
        if (style < 0.18 && w > 8) this.cylinderTower(vc, towers, tx, tz, Math.min(w, d) / 2, h, warm);
        else if (style < 0.4) this.slabTower(vc, towers, tx, tz, w, d, h, warm);
        else this.tieredTower(vc, towers, tx, tz, w, d, h, warm);
        addCollider(tx, tz, w / 2, d / 2, h);
        // street-level awning strip
        if (Math.random() < 0.5) {
          const az = tz + d / 2 + 0.5;
          box(vc, w * 0.7, 0.12, 1.1, tx, 2.6, az, pick([0xc23a3a, 0x2e7dd1, 0x2f8a5a, 0xd9a51f]), { shade: 0.04 });
        }
      }
      if (Math.random() < 0.6) this.lamppost(vc, ox + B / 2 - 0.8, oz + B / 2 - 0.8);
      if (Math.random() < 0.4) this.lamppost(vc, ox - B / 2 + 0.8, oz - B / 2 + 0.8);
      if (Math.random() < 0.4) this.spawnBench(liftables, ox + pick([-1, 1]) * (B / 2 - 1.6), oz + rand(-6, 6), Math.PI / 2);
      if (Math.random() < 0.35) this.spawnBin(liftables, ox + rand(-B / 3, B / 3), oz + pick([-1, 1]) * (B / 2 - 1));
      // planter trees soften the street
      if (Math.random() < 0.45) {
        const tx = ox + pick([-1, 1]) * (B / 2 - 1.6), tz = oz + rand(-6, 6);
        if (!this.placeAuthored(vc, 'planter', tx, 0.08, tz, 1, randInt(0, 3) * Math.PI / 2)) box(vc, 1.4, 0.4, 1.4, tx, 0.28, tz, 0x7e838a);
        addPlatform(tx, tz, 0.7, 0.7, 0.48);
        this.tree(vc, tx, tz, rand(0.5, 0.75), addCollider);
      }
    }
    if (Math.random() < 0.55) this.spawnCar(liftables, ox + pick([-1, 1]) * (B / 2 + 1.6), oz + rand(-B / 3, B / 3), Math.PI / 2);
  }

  towerTint(warm, shade) {
    return new THREE.Color().setHSL(
      warm ? rand(0.06, 0.12) : rand(0.52, 0.62),
      warm ? rand(0.12, 0.3) : rand(0.05, 0.22),
      rand(0.45, 0.62) * shade
    ).getHex();
  }

  scaleTowerUV(g, w, d, h) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * Math.max(w, d) / 4.8, uv.getY(i) * h / 4.8);   // one 4x4 window tile per 4.8 m
    }
  }

  roofClutter(vc, x, z, h) {
    if (hasAuthoredProp('acunit') && vc.inst) {
      // modelled rooftop kit: 1-3 AC units and sometimes a water tower
      const n = randInt(0, 1) + (Math.random() < 0.2 ? 1 : 0); // mostly seen from below: keep it light
      for (let i = 0; i < n; i++) this.placeAuthored(vc, 'acunit', x + rand(-2, 2), h, z + rand(-2, 2), rand(0.9, 1.2), randInt(0, 3) * Math.PI / 2);
      if (Math.random() < 0.3 && hasAuthoredProp('watertower')) this.placeAuthored(vc, 'watertower', x + rand(-1.5, 1.5), h, z + rand(-1.5, 1.5), rand(0.9, 1.15), rand(0, Math.PI * 2));
      if (Math.random() < 0.35) cylinder(vc, 0.06, 0.06, rand(2, 5), 4, x, h + 1.8, z, 0x777d85);
      if (Math.random() < 0.2) box(vc, rand(2.4, 3.6), rand(1.2, 1.8), 0.15, x, h + 1.4, z, pick([0xd94a6a, 0x3aa66a, 0x3a66c2, 0xd9a51f]), { shade: 0.02 });
      return;
    }
    if (Math.random() < 0.7) box(vc, rand(1, 2), rand(0.8, 1.4), rand(1, 2), x + rand(-1, 1), h + 0.6, z + rand(-1, 1), 0x555b63);
    if (Math.random() < 0.35) cylinder(vc, 0.06, 0.06, rand(2, 5), 4, x, h + 1.8, z, 0x777d85);
    if (Math.random() < 0.22) {
      // rooftop water tower
      cylinder(vc, 0.9, 0.9, 1.6, 8, x + rand(-1.5, 1.5), h + 1.6, z + rand(-1.5, 1.5), 0x7a5c48);
    }
    if (Math.random() < 0.2) {
      // billboard
      box(vc, rand(2.4, 3.6), rand(1.2, 1.8), 0.15, x, h + 1.4, z, pick([0xd94a6a, 0x3aa66a, 0x3a66c2, 0xd9a51f]), { shade: 0.02 });
    }
  }

  tieredTower(vc, towers, x, z, w, d, h, warm) {
    const tint = this.towerTint(warm, rand(0.72, 1.15));
    const tiers = h > 26 ? randInt(2, 3) : 1;
    let curW = w, curD = d, y0 = 0;
    for (let t = 0; t < tiers; t++) {
      const th = t === tiers - 1 ? h - y0 : h * rand(0.35, 0.5);
      const g = new THREE.BoxGeometry(curW, th, curD);
      this.scaleTowerUV(g, curW, curD, th);
      g.translate(x, y0 + th / 2, z);
      towers.push(paint(g, tint, 0.02));
      box(vc, curW + 0.3, 0.3, curD + 0.3, x, y0 + th + 0.1, z, 0x3a4048);
      y0 += th;
      curW *= rand(0.68, 0.82);
      curD *= rand(0.68, 0.82);
    }
    box(vc, w + 0.4, 1.4, d + 0.4, x, 0.7, z, 0x2e343c);
    this.roofClutter(vc, x, z, h);
  }

  slabTower(vc, towers, x, z, w, d, h, warm) {
    // thin glass slab with vertical concrete fins
    const tint = this.towerTint(warm, rand(0.8, 1.15));
    const sw = w, sd = Math.max(5, d * 0.6);
    const g = new THREE.BoxGeometry(sw, h, sd);
    this.scaleTowerUV(g, sw, sd, h);
    g.translate(x, h / 2, z);
    towers.push(paint(g, tint, 0.02));
    const fins = randInt(2, 4);
    for (let f = 0; f < fins; f++) {
      const fx = x - sw / 2 + (sw / (fins + 1)) * (f + 1);
      box(vc, 0.35, h * rand(0.85, 1.02), sd + 0.5, fx, h / 2, z, 0x6d7580, { shade: 0.04 });
    }
    box(vc, sw + 0.5, 0.4, sd + 0.6, x, h + 0.2, z, 0x3a4048);
    box(vc, sw + 0.4, 1.4, sd + 0.4, x, 0.7, z, 0x2e343c);
    this.roofClutter(vc, x, z, h);
  }

  cylinderTower(vc, towers, x, z, r, h, warm) {
    const tint = this.towerTint(warm, rand(0.8, 1.15));
    const g = new THREE.CylinderGeometry(r * rand(0.82, 0.95), r, h, 14);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (Math.PI * r) / 4.8, uv.getY(i) * h / 4.8);
    g.translate(x, h / 2, z);
    towers.push(paint(g, tint, 0.02));
    cylinder(vc, r * 0.6, r * 0.75, 0.8, 12, x, h + 0.3, z, 0x3a4048);
    cylinder(vc, r + 0.25, r + 0.35, 1.4, 14, x, 0.7, z, 0x2e343c);
    if (Math.random() < 0.5) cylinder(vc, 0.06, 0.06, rand(3, 6), 4, x, h + 2.2, z, 0x777d85);
  }

  lamppost(vc, x, z) {
    if (this.placeAuthored(vc, 'lamppost', x, 0, z, 1, Math.PI / 2)) return;   // model's arm points +Z, game's +X
    cylinder(vc, 0.07, 0.1, 4.6, 6, x, 2.3, z, 0x3a4048);
    box(vc, 1.1, 0.12, 0.25, x + 0.45, 4.6, z, 0x3a4048);
    box(vc, 0.4, 0.15, 0.3, x + 0.9, 4.52, z, 0xfff2c9, { shade: 0 });
  }

  // ---- liftable props (telekinesis targets) ----

  makeLiftable(geos, x, z, type, radius) {
    const mesh = geos.authored || new THREE.Mesh(mergeGeometries(geos, false), this.vcMat);
    mesh.position.set(x, 0, z);
    return { mesh, type, radius, alive: true, busy: false, x, z };
  }

  // Geometry for a standalone prop (liftables, and the shapeshifter's disguises).
  propGeos(kind) {
    const g = [];
    if (kind === 'car') {
      const bodyColor = pick([0xc23a3a, 0x3a66c2, 0xd8d8dc, 0x2e2e34, 0x3aa66a, 0xd9a51f, 0x8446b8, 0xe8e4da]);
      const authored = makeAuthoredProp('car', bodyColor);
      if (authored) { g.authored = authored; return g; }
      this.carGeos(g, bodyColor);
    } else if (['bin', 'bench', 'hydrant', 'bush', 'lamppost'].includes(kind) && hasAuthoredProp(kind)) {
      const paint = kind === 'bin' ? pick([0x3f8a4a, 0x5a6470, 0xa34040]) : null;
      g.authored = makeAuthoredProp(kind, paint);
      return g;
    } else if (kind === 'bin') {
      cylinder(g, 0.45, 0.4, 1.0, 10, 0, 0.5, 0, pick([0x3f6e4a, 0x555b63, 0x6e3f3f]));
      cylinder(g, 0.5, 0.5, 0.1, 10, 0, 1.02, 0, 0x2e343c);
    } else if (kind === 'bench') {
      box(g, 2.2, 0.12, 0.55, 0, 0.5, 0, 0x8a6642);
      box(g, 2.2, 0.5, 0.1, 0, 0.85, -0.25, 0x8a6642);
      box(g, 0.12, 0.5, 0.5, -0.95, 0.25, 0, 0x3a4048);
      box(g, 0.12, 0.5, 0.5, 0.95, 0.25, 0, 0x3a4048);
    } else if (kind === 'mailbox') {
      box(g, 0.09, 1.0, 0.09, 0, 0.5, 0, 0x5a4634);
      box(g, 0.34, 0.24, 0.5, 0, 1.1, 0, pick([0x9a3030, 0x3a66c2, 0x3a3d42]));
    } else if (kind === 'hydrant') {
      cylinder(g, 0.16, 0.2, 0.8, 8, 0, 0.4, 0, 0xc23a3a);
      cylinder(g, 0.12, 0.12, 0.14, 8, 0, 0.87, 0, 0xc23a3a);
      box(g, 0.5, 0.12, 0.14, 0, 0.5, 0, 0xc23a3a);
    } else if (kind === 'bush') {
      const c = pick([0x3f7a30, 0x4f8f3a, 0x5da245]);
      blob(g, 0.6, 0, 0.55, 0, c);
      blob(g, 0.45, 0.4, 0.45, 0.2, c);
      blob(g, 0.4, -0.35, 0.5, -0.2, c);
    } else if (kind === 'lamppost') {
      cylinder(g, 0.07, 0.1, 4.6, 6, 0, 2.3, 0, 0x3a4048);
      box(g, 1.1, 0.12, 0.25, 0.45, 4.6, 0, 0x3a4048);
      box(g, 0.4, 0.15, 0.3, 0.9, 4.52, 0, 0xfff2c9, { shade: 0 });
    } else if (hasAuthoredProp('tree-round')) {
      const m = makeAuthoredProp('tree-round');
      m.scale.setScalar(0.8);   // disguise only sets rotation, so scale is kept
      g.authored = m;
      return g;
    } else {
      // small tree
      const s = 0.8;
      cylinder(g, 0.16 * s, 0.26 * s, 2.1 * s, 6, 0, 1.05 * s, 0, 0x6b4a32);
      const canopy = pick([0x4f8f3a, 0x5da245, 0x3f7a30]);
      blob(g, 1.15 * s, 0, 2.6 * s, 0, canopy);
      blob(g, 0.8 * s, 0.7 * s, 2.1 * s, 0.3 * s, canopy);
      blob(g, 0.7 * s, -0.6 * s, 2.3 * s, -0.4 * s, canopy);
    }
    return g;
  }

  makePropMesh(kind) {
    const geos = this.propGeos(kind);
    const mesh = geos.authored || new THREE.Mesh(mergeGeometries(geos, false), this.vcMat);
    mesh.castShadow = RUNTIME.shadows;
    return mesh;
  }

  carGeos(g, bodyColor) {
    box(g, 1.9, 0.5, 4.1, 0, 0.62, 0, bodyColor, { shade: 0.03 });
    // hood + trunk slope hint
    box(g, 1.8, 0.16, 0.9, 0, 0.92, 1.5, bodyColor, { shade: 0.03 });
    box(g, 1.7, 0.52, 2.0, 0, 1.1, -0.2, 0xbfd6e8, { shade: 0.03 });
    box(g, 1.72, 0.1, 2.1, 0, 1.38, -0.2, bodyColor, { shade: 0.03 });
    // bumpers + lights
    box(g, 1.92, 0.18, 0.22, 0, 0.42, 2.05, 0x9aa0a8);
    box(g, 1.92, 0.18, 0.22, 0, 0.42, -2.05, 0x9aa0a8);
    box(g, 0.34, 0.12, 0.08, -0.6, 0.72, 2.06, 0xfff2c9);
    box(g, 0.34, 0.12, 0.08, 0.6, 0.72, 2.06, 0xfff2c9);
    box(g, 0.34, 0.12, 0.08, -0.6, 0.72, -2.06, 0xc23a3a);
    box(g, 0.34, 0.12, 0.08, 0.6, 0.72, -2.06, 0xc23a3a);
    // wheels
    for (const [wx, wz] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) {
      const wg = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10);
      wg.rotateZ(Math.PI / 2);
      wg.translate(wx, 0.34, wz);
      g.push(paint(wg, 0x1c1e24));
    }
  }

  spawnCar(liftables, x, z, ry) {
    const l = this.makeLiftable(this.propGeos('car'), x, z, 'car', 2.1);
    l.mesh.rotation.y = ry + (Math.random() < 0.5 ? Math.PI : 0);
    liftables.push(l);
  }

  spawnBin(liftables, x, z) {
    liftables.push(this.makeLiftable(this.propGeos('bin'), x, z, 'bin', 0.8));
  }

  spawnBench(liftables, x, z, ry) {
    const l = this.makeLiftable(this.propGeos('bench'), x, z, 'bench', 1.4);
    l.mesh.rotation.y = ry;
    liftables.push(l);
  }

  liftablesNear(pos, maxR) {
    const out = [];
    const cx = Math.round(pos.x / PITCH), cz = Math.round(pos.z / PITCH);
    for (let ix = cx - 1; ix <= cx + 1; ix++) {
      for (let iz = cz - 1; iz <= cz + 1; iz++) {
        const chunk = this.chunks.get(ix + ':' + iz);
        if (!chunk) continue;
        for (const l of chunk.liftables) {
          if (!l.alive || l.busy) continue;
          const d = Math.hypot(l.mesh.position.x - pos.x, l.mesh.position.z - pos.z);
          if (d < maxR) out.push({ l, d });
        }
      }
    }
    return out;
  }

  removeLiftable(l) {
    this.destroyLiftableMesh(l);
    const i = this.orphans.indexOf(l);
    if (i >= 0) this.orphans.splice(i, 1);
  }

  // ---------------- queries ----------------

  collidersNear(x, z) {
    const out = [];
    const cx = Math.round(x / PITCH), cz = Math.round(z / PITCH);
    for (let ix = cx - 1; ix <= cx + 1; ix++) {
      for (let iz = cz - 1; iz <= cz + 1; iz++) {
        const chunk = this.chunks.get(ix + ':' + iz);
        if (chunk) out.push(...chunk.colliders);
      }
    }
    return out;
  }

  resolve(pos, radius, y = 0) {
    for (const c of this.collidersNear(pos.x, pos.z)) {
      if (y > c.h + 0.5) continue;
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const px = c.hw + radius - Math.abs(dx);
      const pz = c.hd + radius - Math.abs(dz);
      if (px > 0 && pz > 0) {
        if (px < pz) pos.x += (dx >= 0 ? 1 : -1) * px;
        else pos.z += (dz >= 0 ? 1 : -1) * pz;
      }
    }
  }

  isBlocked(x, z, r = 0.8) {
    for (const c of this.collidersNear(x, z)) {
      if (Math.abs(x - c.x) < c.hw + r && Math.abs(z - c.z) < c.hd + r) return true;
    }
    return false;
  }

  // Height of the walkable surface at (x, z): raised kerbs, block slabs,
  // porches and planters, or 0 for open ground.
  groundHeightAt(x, z) {
    let y = 0;
    const cx = Math.round(x / PITCH), cz = Math.round(z / PITCH);
    for (let ix = cx - 1; ix <= cx + 1; ix++) {
      for (let iz = cz - 1; iz <= cz + 1; iz++) {
        const chunk = this.chunks.get(ix + ':' + iz);
        if (chunk) y = Math.max(y, topOf(chunk.platforms, x, z));
      }
    }
    return y;
  }

  buildingHeightAt(x, z) {
    let h = 0;
    for (const c of this.collidersNear(x, z)) {
      if (Math.abs(x - c.x) < c.hw && Math.abs(z - c.z) < c.hd) h = Math.max(h, c.h);
    }
    return h;
  }

  randomOpenPos(center = this.focus, minR = 6, maxR = 90) {
    for (let i = 0; i < 50; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(minR, maxR);
      const x = center.x + Math.cos(a) * r;
      const z = center.z + Math.sin(a) * r;
      if (!this.isBlocked(x, z, 1.1)) return { x, z };
    }
    return { x: center.x + rand(-8, 8), z: center.z + rand(-8, 8) };
  }

  setXray(on) {
    this.xray = on;
    for (const base of this.buildingMats) {
      for (const mat of [base, base.__toon].filter(Boolean)) {
      mat.transparent = on;
      mat.opacity = on ? 0.22 : 1;
      mat.depthWrite = !on;
      mat.needsUpdate = true;
      }
    }
  }
}
