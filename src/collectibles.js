import * as THREE from 'three';
import { CONFIG } from './config.js';
import { rand, weightedPick } from './utils.js';
import { AUTHORED, makeAuthoredProp } from './authored.js';

export const PILL_COLORS = { absorb: 0x3ddc97, twopower: 0xc07bff, extraswitch: 0x6ea8ff };
export const POTION_COLORS = { enlarge: 0xff8c42, fireball: 0xff4040, landing: 0xffd166 };

// pickups glow a little so they read against the cel-shaded street
function glowUp(mesh, color, k) {
  mesh.material.emissive = new THREE.Color(color).multiplyScalar(k);
  return mesh;
}

export function makePillMesh(color) {
  const g = new THREE.Group();
  if (AUTHORED.props.pill) {
    g.add(glowUp(makeAuthoredProp('pill', color), color, 0.25));
    g.rotation.z = Math.PI / 5;
    return g;
  }
  const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.5 });
  const white = new THREE.MeshLambertMaterial({ color: 0xf2f4f8, emissive: 0xf2f4f8, emissiveIntensity: 0.25 });
  const half1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.3, 4, 10), mat);
  const half2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.225, 0.02, 4, 10), white);
  half2.position.y = -0.16;
  g.add(half1, half2);
  g.rotation.z = Math.PI / 5;
  return g;
}

export function makePotionMesh(color) {
  const g = new THREE.Group();
  if (AUTHORED.props.potion) {
    const m = glowUp(makeAuthoredProp('potion', color), color, 0.25);
    m.position.y = -0.45;   // model sits on its base; centre it on the bob height
    g.add(m);
    return g;
  }
  const glass = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.9 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), glass);
  body.scale.y = 1.15;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.28, 8), glass);
  neck.position.y = 0.42;
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8),
    new THREE.MeshLambertMaterial({ color: 0x8a6642 }));
  cork.position.y = 0.6;
  g.add(body, neck, cork);
  return g;
}

// the spinning coin every idle token is drawn with
export function makeTokenParts() {
  if (AUTHORED.props.token) {
    const m = makeAuthoredProp('token');
    const geo = m.geometry.clone();
    geo.computeBoundingBox();
    const c = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-c.x, -c.y, -c.z);   // spin around its own centre
    return { geo, mat: glowUp(m, 0xffc94a, 0.18).material };
  }
  const geo = new THREE.CylinderGeometry(0.34, 0.34, 0.09, 14);
  geo.rotateX(Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0xaa7a1e, emissiveIntensity: 0.6 });
  return { geo, mat };
}

export class Collectibles {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

    // ---- idle tokens (instanced coins) ----
    const { geo: coinGeo, mat: tokenMat } = makeTokenParts();
    this.tokenMat = tokenMat;
    this.tokenMesh = new THREE.InstancedMesh(coinGeo, this.tokenMat, CONFIG.TOKEN_COUNT);
    this.tokenMesh.frustumCulled = false;
    scene.add(this.tokenMesh);
    this.tokens = [];
    for (let i = 0; i < CONFIG.TOKEN_COUNT; i++) {
      this.tokens.push({ x: 0, z: 0, active: false, respawn: rand(0, 2), spin: rand(0, Math.PI * 2) });
    }

    this.items = []; // pills + potions
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3(1, 1, 1);
    this._e = new THREE.Euler();
  }

  respawnAll() {
    for (const t of this.tokens) this.placeToken(t);
    for (const it of this.items) this.scene.remove(it.mesh);
    this.items = [];
    for (let i = 0; i < CONFIG.PILL_COUNT; i++) this.spawnItem('pill');
    for (let i = 0; i < CONFIG.POTION_COUNT; i++) this.spawnItem('potion');
  }

  placeToken(t) {
    const p = this.world.randomOpenPos(this.world.focus, 8, 95);
    t.x = p.x; t.z = p.z;
    t.active = true;
  }

  spawnItem(kind) {
    const defs = kind === 'pill' ? CONFIG.PILLS : CONFIG.POTIONS;
    const def = weightedPick(defs, (d) => d.p);
    const color = kind === 'pill' ? PILL_COLORS[def.id] : POTION_COLORS[def.id];
    const mesh = kind === 'pill' ? makePillMesh(color) : makePotionMesh(color);
    const p = this.world.randomOpenPos(this.world.focus, 12, 95);
    mesh.position.set(p.x, 1, p.z);
    // soft glow disc under the item
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.85;
    mesh.add(glow);
    this.scene.add(mesh);
    this.items.push({ kind, def, mesh, x: p.x, z: p.z, active: true, bobPhase: rand(0, Math.PI * 2), respawn: 0 });
  }

  update(dt, time) {
    const f = this.world.focus;
    // tokens: spin + bob, handle respawns; far-drifted tokens hop back nearby
    for (let i = 0; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      if (t.active && Math.hypot(t.x - f.x, t.z - f.z) > CONFIG.RECYCLE_DIST) this.placeToken(t);
      if (!t.active) {
        t.respawn -= dt;
        if (t.respawn <= 0) this.placeToken(t);
        this._s.setScalar(0.001);
        this._m.compose(new THREE.Vector3(0, -10, 0), this._q, this._s);
        this.tokenMesh.setMatrixAt(i, this._m);
        continue;
      }
      t.spin += dt * 2.2;
      this._e.set(0, t.spin, 0);
      this._q.setFromEuler(this._e);
      this._s.setScalar(1);
      const y = 0.75 + Math.sin(time * 2.4 + t.spin) * 0.12;
      this._m.compose(new THREE.Vector3(t.x, y, t.z), this._q, this._s);
      this.tokenMesh.setMatrixAt(i, this._m);
    }
    this.tokenMesh.instanceMatrix.needsUpdate = true;

    // pills & potions: bob + spin, respawn as a fresh random item after a delay
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (!it.active) {
        it.respawn -= dt;
        if (it.respawn <= 0) {
          this.scene.remove(it.mesh);
          this.items.splice(i, 1);
          this.spawnItem(it.kind);
        }
        continue;
      }
      if (Math.hypot(it.x - f.x, it.z - f.z) > CONFIG.RECYCLE_DIST + 10) {
        const p = this.world.randomOpenPos(f, 15, 95);
        it.x = p.x; it.z = p.z;
        it.mesh.position.x = p.x; it.mesh.position.z = p.z;
      }
      it.mesh.rotation.y = time * 1.4 + it.bobPhase;
      it.mesh.position.y = 1 + Math.sin(time * 2 + it.bobPhase) * 0.18;
    }
  }

  // Collect tokens within radius; returns count collected.
  collectTokens(x, z, radius) {
    let n = 0;
    for (const t of this.tokens) {
      if (!t.active) continue;
      const dx = t.x - x, dz = t.z - z;
      if (dx * dx + dz * dz < radius * radius) {
        t.active = false;
        t.respawn = rand(5, 14);
        n++;
      }
    }
    return n;
  }

  // Collect the first pill/potion within radius; returns the item or null.
  collectItem(x, z, radius) {
    for (const it of this.items) {
      if (!it.active) continue;
      const dx = it.x - x, dz = it.z - z;
      if (dx * dx + dz * dz < radius * radius) {
        it.active = false;
        it.respawn = rand(18, 30);
        it.mesh.visible = false;
        return it;
      }
    }
    return null;
  }

  setXray(on) {
    for (const it of this.items) {
      it.mesh.traverse((o) => {
        if (o.material) { o.material.depthTest = !on; o.material.needsUpdate = true; }
      });
    }
  }
}
