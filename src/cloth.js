// Verlet cloth cape. Pinned along the collarbones, collides with a torso
// capsule and a "back plane" so it drapes over the shoulders and never
// swings through the body; trails with the wearer's velocity.
import * as THREE from 'three';
import { RUNTIME } from './utils.js';

const STEP = 1 / 60;
const GRAV = -9.8;

export class Cape {
  constructor(scene, { rows, cols, width, length, color }) {
    this.scene = scene;
    this.rows = rows; this.cols = cols;
    this.baseWidth = width; this.baseLength = length;
    this.n = rows * cols;
    this.pos = new Float32Array(this.n * 3);
    this.prev = new Float32Array(this.n * 3);
    this.scale = 1;
    this.acc = 0;
    this.initialized = false;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx = [];
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
    }
    geo.setIndex(idx);
    // vertex colours: slightly darker toward the hem
    const col = new Float32Array(this.n * 3);
    const c0 = new THREE.Color(color), c1 = c0.clone().multiplyScalar(0.72);
    for (let r = 0; r < rows; r++) {
      const k = r / (rows - 1);
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 3;
        col[i] = c0.r + (c1.r - c0.r) * k; col[i + 1] = c0.g + (c1.g - c0.g) * k; col[i + 2] = c0.b + (c1.b - c0.b) * k;
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = RUNTIME.shadows;
    scene.add(this.mesh);

    this.buildConstraints();
    this._v = new THREE.Vector3();
    this._w = new THREE.Vector3();
  }

  buildConstraints() {
    const { rows, cols } = this;
    const s = this.scale;
    const dy = (this.baseLength / (rows - 1)) * s;
    const dxAt = (r) => (this.baseWidth / (cols - 1)) * (1 + 0.45 * (r / (rows - 1))) * s;  // flares toward the hem
    this.cons = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (c < cols - 1) this.cons.push([i, i + 1, dxAt(r), 1]);
        if (r < rows - 1) this.cons.push([i, i + cols, dy, 1]);
        if (r < rows - 1 && c < cols - 1) {
          const dg = Math.hypot(dxAt(r), dy);
          this.cons.push([i, i + cols + 1, dg, 0.6]);
          this.cons.push([i + 1, i + cols, dg, 0.6]);
        }
        if (r < rows - 2) this.cons.push([i, i + cols * 2, dy * 2, 0.25]);   // bend resistance
      }
    }
  }

  // pins: world-space Vector3[cols]; body: { a, b, r, back (unit, pointing behind), mid }
  update(dt, pins, body, vel, scale) {
    if (Math.abs(scale - this.scale) > 0.01) { this.scale = scale; this.buildConstraints(); }
    const { rows, cols, pos, prev } = this;

    // a teleport / blink / respawn moves the wearer instantly: re-drape
    // instead of letting the verlet points inherit an explosive velocity
    if (this.initialized) {
      const jump = Math.hypot(pins[0].x - pos[0], pins[0].y - pos[1], pins[0].z - pos[2]);
      if (jump > 1.5 * scale) this.initialized = false;
    }

    if (!this.initialized) {
      // hang straight down from the pins
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 3;
          const p = pins[c];
          pos[i] = p.x; pos[i + 1] = p.y - r * (this.baseLength / (rows - 1)) * scale; pos[i + 2] = p.z - r * 0.02;
          prev[i] = pos[i]; prev[i + 1] = pos[i + 1]; prev[i + 2] = pos[i + 2];
        }
      }
      this.initialized = true;
    }

    this.acc += Math.min(dt, 0.1);
    let steps = 0;
    while (this.acc >= STEP && steps < 3) {
      this.step(pins, body, vel, scale);
      this.acc -= STEP; steps++;
    }
    if (steps === 3) this.acc = 0;

    const attr = this.mesh.geometry.attributes.position;
    attr.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  step(pins, body, vel, scale) {
    const { rows, cols, pos, prev } = this;
    const h2 = STEP * STEP;
    // wind: the cape trails motion, plus a little flutter
    const wx = -vel.x * 0.9 + (Math.random() - 0.5) * 2.5;
    const wz = -vel.z * 0.9 + (Math.random() - 0.5) * 2.5;
    const wy = (Math.random() - 0.5) * 1.5 - Math.hypot(vel.x, vel.z) * 0.15;

    // pins
    for (let c = 0; c < cols; c++) {
      const i = c * 3, p = pins[c];
      pos[i] = p.x; pos[i + 1] = p.y; pos[i + 2] = p.z;
      prev[i] = p.x; prev[i + 1] = p.y; prev[i + 2] = p.z;
    }
    // integrate
    for (let k = cols; k < this.n; k++) {
      const i = k * 3;
      const x = pos[i], y = pos[i + 1], z = pos[i + 2];
      let vx = (x - prev[i]) * 0.97, vy = (y - prev[i + 1]) * 0.97, vz = (z - prev[i + 2]) * 0.97;
      // per-step speed cap keeps the sim stable under any impulse
      const vm = Math.sqrt(vx * vx + vy * vy + vz * vz), vmax = 0.35 * scale;
      if (vm > vmax) { const k = vmax / vm; vx *= k; vy *= k; vz *= k; }
      prev[i] = x; prev[i + 1] = y; prev[i + 2] = z;
      pos[i] = x + vx + wx * h2;
      pos[i + 1] = y + vy + (GRAV * scale + wy) * h2;
      pos[i + 2] = z + vz + wz * h2;
    }
    // constraints
    for (let it = 0; it < 3; it++) {
      for (const [a, b, rest, k] of this.cons) {
        const ia = a * 3, ib = b * 3;
        let dx = pos[ib] - pos[ia], dy = pos[ib + 1] - pos[ia + 1], dz = pos[ib + 2] - pos[ia + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = ((d - rest) / d) * 0.5 * k;
        dx *= diff; dy *= diff; dz *= diff;
        const pinA = a < cols, pinB = b < cols;
        if (!pinA) { pos[ia] += dx * (pinB ? 2 : 1); pos[ia + 1] += dy * (pinB ? 2 : 1); pos[ia + 2] += dz * (pinB ? 2 : 1); }
        if (!pinB) { pos[ib] -= dx * (pinA ? 2 : 1); pos[ib + 1] -= dy * (pinA ? 2 : 1); pos[ib + 2] -= dz * (pinA ? 2 : 1); }
      }
      this.collide(body, scale);
    }
  }

  collide(body, scale) {
    const { pos, cols } = this;
    const a = body.a, b = body.b, r = body.r;
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    const abLen2 = abx * abx + aby * aby + abz * abz || 1e-6;
    const bk = body.back;
    const yMin = Math.min(a.y, b.y) - 0.15 * scale, yMax = Math.max(a.y, b.y) + 0.12 * scale;
    for (let k = cols; k < this.n; k++) {
      const i = k * 3;
      const px = pos[i], py = pos[i + 1], pz = pos[i + 2];
      // capsule
      let t = ((px - a.x) * abx + (py - a.y) * aby + (pz - a.z) * abz) / abLen2;
      t = Math.max(0, Math.min(1, t));
      const cx = a.x + abx * t, cy = a.y + aby * t, cz = a.z + abz * t;
      let dx = px - cx, dy = py - cy, dz = pz - cz;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      if (d < r) {
        const push = (r - d) / d;
        pos[i] += dx * push; pos[i + 1] += dy * push; pos[i + 2] += dz * push;
      }
      // back plane: stay behind the torso while alongside it
      if (py > yMin && py < yMax) {
        const rel = (pos[i] - body.mid.x) * bk.x + (pos[i + 1] - body.mid.y) * bk.y + (pos[i + 2] - body.mid.z) * bk.z;
        const minD = 0.05 * scale;
        if (rel < minD) {
          pos[i] += bk.x * (minD - rel); pos[i + 1] += bk.y * (minD - rel); pos[i + 2] += bk.z * (minD - rel);
        }
      }
      // ground
      if (pos[i + 1] < 0.03) pos[i + 1] = 0.03;
    }
  }

  setOpacity(alpha) {
    const m = this.mesh.material;
    m.transparent = alpha < 1; m.opacity = alpha; m.needsUpdate = true;
  }

  set visible(v) { this.mesh.visible = v; }
  get visible() { return this.mesh.visible; }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
