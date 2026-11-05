import * as THREE from 'three';
import { rand } from './utils.js';

const MAX_PARTICLES = 4096;

const VERT = `
attribute float psize;
attribute vec3 pcolor;
attribute float palpha;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = pcolor;
  vAlpha = palpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = psize * (240.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float a = smoothstep(0.5, 0.12, d) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;

export class FX {
  constructor(scene) {
    this.scene = scene;

    // ---- particle pool ----
    this.pos = new Float32Array(MAX_PARTICLES * 3);
    this.vel = new Float32Array(MAX_PARTICLES * 3);
    this.life = new Float32Array(MAX_PARTICLES);     // remaining
    this.life0 = new Float32Array(MAX_PARTICLES);    // initial
    this.grav = new Float32Array(MAX_PARTICLES);
    this.drag = new Float32Array(MAX_PARTICLES);
    this.cursor = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1);
    this.colorAttr = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
    this.alphaAttr = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1);
    geo.setAttribute('psize', this.sizeAttr);
    geo.setAttribute('pcolor', this.colorAttr);
    geo.setAttribute('palpha', this.alphaAttr);

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // ---- ring pool ----
    this.rings = [];
    for (let i = 0; i < 12; i++) {
      const rg = new THREE.Mesh(
        new THREE.RingGeometry(0.82, 1, 40),
        new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
      );
      rg.rotation.x = -Math.PI / 2;
      rg.visible = false;
      scene.add(rg);
      this.rings.push({ mesh: rg, t: 0, dur: 0, maxR: 0 });
    }

    this.shakeAmt = 0;
    this.shakeOffset = new THREE.Vector3();
    this._c = new THREE.Color();
  }

  emit(x, y, z, { count = 12, color = 0xffffff, speed = 5, life = 0.7, size = 1.6, gravity = -6, drag = 1.5, spread = 1, up = 0, jitter = 0.2 } = {}) {
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;
      const i3 = i * 3;
      this.pos[i3] = x + rand(-jitter, jitter);
      this.pos[i3 + 1] = y + rand(-jitter, jitter);
      this.pos[i3 + 2] = z + rand(-jitter, jitter);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const s = speed * rand(0.4, 1.1);
      this.vel[i3] = Math.sin(phi) * Math.cos(theta) * s * spread;
      this.vel[i3 + 1] = Math.abs(Math.cos(phi)) * s * 0.7 + up;
      this.vel[i3 + 2] = Math.sin(phi) * Math.sin(theta) * s * spread;
      this.life[i] = this.life0[i] = life * rand(0.6, 1.2);
      this.grav[i] = gravity;
      this.drag[i] = drag;
      this.sizeAttr.array[i] = size * rand(0.7, 1.4);
      this._c.set(color);
      const off = rand(-0.12, 0.12);
      this.colorAttr.array[i3] = Math.min(1, this._c.r + off);
      this.colorAttr.array[i3 + 1] = Math.min(1, this._c.g + off);
      this.colorAttr.array[i3 + 2] = Math.min(1, this._c.b + off);
      this.alphaAttr.array[i] = 1;
    }
  }

  // Directed emission (cones of flame, streaks): velocity around dir.
  emitDir(x, y, z, dir, { count = 10, color = 0xffffff, speed = 10, life = 0.5, size = 1.6, gravity = 0, drag = 1, cone = 0.35 } = {}) {
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;
      const i3 = i * 3;
      this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
      const s = speed * rand(0.6, 1.15);
      this.vel[i3] = (dir.x + rand(-cone, cone)) * s;
      this.vel[i3 + 1] = (dir.y + rand(-cone, cone)) * s;
      this.vel[i3 + 2] = (dir.z + rand(-cone, cone)) * s;
      this.life[i] = this.life0[i] = life * rand(0.7, 1.2);
      this.grav[i] = gravity;
      this.drag[i] = drag;
      this.sizeAttr.array[i] = size * rand(0.7, 1.4);
      this._c.set(color);
      this.colorAttr.array[i3] = this._c.r;
      this.colorAttr.array[i3 + 1] = this._c.g;
      this.colorAttr.array[i3 + 2] = this._c.b;
      this.alphaAttr.array[i] = 1;
    }
  }

  ring(x, z, { color = 0xffffff, maxR = 8, dur = 0.55, y = 0.15 } = {}) {
    const r = this.rings.find((rr) => !rr.mesh.visible) || this.rings[0];
    r.mesh.visible = true;
    r.mesh.position.set(x, y, z);
    r.mesh.material.color.set(color);
    r.mesh.material.opacity = 0.9;
    r.t = 0; r.dur = dur; r.maxR = maxR;
    r.mesh.scale.setScalar(0.01);
  }

  addShake(amt) { this.shakeAmt = Math.min(1.6, this.shakeAmt + amt); }

  update(dt) {
    // particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const i3 = i * 3;
      if (this.life[i] <= 0) { this.alphaAttr.array[i] = 0; continue; }
      const dragF = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[i3] *= dragF;
      this.vel[i3 + 1] = this.vel[i3 + 1] * dragF + this.grav[i] * dt;
      this.vel[i3 + 2] *= dragF;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      if (this.pos[i3 + 1] < 0.05) this.pos[i3 + 1] = 0.05;
      this.alphaAttr.array[i] = Math.min(1, (this.life[i] / this.life0[i]) * 1.6);
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;

    // rings
    for (const r of this.rings) {
      if (!r.mesh.visible) continue;
      r.t += dt;
      const k = r.t / r.dur;
      if (k >= 1) { r.mesh.visible = false; continue; }
      const e = 1 - Math.pow(1 - k, 3);
      r.mesh.scale.setScalar(Math.max(0.01, r.maxR * e));
      r.mesh.material.opacity = 0.9 * (1 - k);
    }

    // shake decay
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 2.6);
    const s = this.shakeAmt * this.shakeAmt * 0.55;
    this.shakeOffset.set(rand(-s, s), rand(-s, s), rand(-s, s));
  }
}
