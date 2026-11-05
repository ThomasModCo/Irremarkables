import * as THREE from 'three';
import { CONFIG } from './config.js';
import { rand, RUNTIME } from './utils.js';
import { archetypeFor, instancePalette } from './archetypes.js';
import { buildRig, MX } from './rig.js';
import { Animator } from './anim.js';
import { Cape } from './cloth.js';
import { ANIM } from './animlib.js';

const CAPE_SPECS = {
  short: { rows: 6, len: 0.42 },
  medium: { rows: 9, len: 0.7 },
  long: { rows: 12, len: 1.0 },
};

// the idle clips stand ~93% of the T-pose height; scale so an idle hero is ~1.85 m
const STAND_FRACTION = 0.93;

const NEMESIS_PALETTE = () => ({
  primary: new THREE.Color(0x1a0a10), secondary: new THREE.Color(0x0d0507), accent: new THREE.Color(0xff2038),
  glow: new THREE.Color(0xff2038), skin: new THREE.Color(0x3a2028), hair: new THREE.Color(0x120608), hairStreak: new THREE.Color(0xff2038),
});

function makeLabelSprite(text, color = '#cfe0ff') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.font = '700 30px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.85)';
  g.shadowBlur = 8;
  g.fillStyle = color;
  g.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(3.4, 0.85, 1);
  return spr;
}

// The world every character stands on. Injected once by the game so each
// character can find the surface under its own feet without a per-call-site hookup.
let WORLD = null;
export function setCharacterWorld(w) { WORLD = w; }

export class Character {
  constructor(scene, { name = '', isPlayer = false, power = null, paletteSeed = null } = {}) {
    this.scene = scene;
    this.isPlayer = isPlayer;
    this.name = name;
    this.paletteSeed = paletteSeed ?? (isPlayer ? 0.5 : Math.random());
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.altitude = 0;
    this.groundY = 0;      // height of the surface underfoot (kerbs, slabs, porches)
    this.hoverBob = 0;     // gentle rise and fall while hovering in place
    this.prevYaw = 0;
    this.turnRate = 0;     // smoothed yaw rate, drives the airborne body roll
    this.roll = 0;
    this.pitch = 0;
    this.dive = false;     // head-first meteor drop
    this.hp = CONFIG.PLAYER_HP;
    this.maxHp = CONFIG.PLAYER_HP;
    this.alive = true;
    this.power = null;
    this.score = 0;
    this.frozenUntil = 0;
    this.scaleTarget = 1;
    this.curScale = 1;
    this.flying = false;
    this.backward = false;
    this.bank = 0;
    this.nemesis = false;
    this.phase = Math.random() * Math.PI * 2;   // per-character offset for hover bob etc.
    this.disguise = null;
    this.propMesh = null;
    this.opacity = 1;
    this.rootMoved = false;

    this.group = new THREE.Group();
    scene.add(this.group);

    this.aura = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.85, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })
    );
    this.aura.rotation.x = -Math.PI / 2;
    this.aura.position.y = 0.07;
    this.group.add(this.aura);

    this.blobShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
    );
    this.blobShadow.rotation.x = -Math.PI / 2;
    this.blobShadow.position.y = 0.04;
    this.group.add(this.blobShadow);

    this.iceShell = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 2.45, 0.95),
      new THREE.MeshLambertMaterial({ color: 0x9df2ff, transparent: true, opacity: 0.55 })
    );
    this.iceShell.position.y = 1.22;
    this.iceShell.visible = false;
    this.group.add(this.iceShell);

    if (this.name) {
      this.label = makeLabelSprite(this.name, this.isPlayer ? '#ffd166' : '#cfe0ff');
      this.group.add(this.label);
    }

    this.body = null;
    this.setPower(power || { id: 'flight', color: 0x8ecbff });
  }

  // ---------- look ----------

  buildLook(archId, paletteOverride = null) {
    this.destroyBody();
    const arch = archetypeFor(archId);
    this.arch = arch;
    const P = paletteOverride || instancePalette(arch, this.paletteSeed);
    this.palette = P;
    const rig = buildRig(arch, P, { faceless: arch.gear.includes('facelessMask') });
    this.rig = rig;
    this.body = rig.mesh;
    this.unitScale = (1.85 * arch.build.height) / (ANIM.unitHeight * STAND_FRACTION);
    this.body.scale.setScalar(this.unitScale);
    this.body.castShadow = RUNTIME.shadows;
    this.group.add(this.body);
    this.anim = new Animator(this.body, arch, { hipsYOffset: rig.hipsYOffset });
    this.extras = rig.extras;
    this.heightM = 1.85 * arch.build.height;
    if (this.label) this.label.position.y = this.heightM + 0.35;
    this.iceShell.scale.setScalar(this.heightM / 1.85);
    this.iceShell.position.y = 1.22 * this.heightM / 1.85;

    if (arch.cape) {
      const cs = CAPE_SPECS[arch.cape];
      const capeColor = P.primary.clone().lerp(P.secondary, 0.4);
      this.cape = new Cape(this.scene, { rows: cs.rows, cols: 7, width: rig.capeWidth * this.unitScale, length: cs.len * this.heightM, color: capeColor });
      this.capePins = rig.pins.map(() => new THREE.Vector3());
    }
    this.applyOpacity();
  }

  destroyBody() {
    if (this.body) {
      this.anim?.dispose();
      this.group.remove(this.body);
      this.body.skeleton?.dispose?.();
      this.body.geometry.dispose();
      this.body.material.dispose();
      this.body.traverse((o) => { if (o !== this.body && o.geometry) { o.geometry.dispose(); o.material?.dispose?.(); } });
      this.body = null;
    }
    if (this.cape) { this.cape.dispose(); this.cape = null; }
  }

  setPower(power) {
    this.power = power;
    if (power) this.aura.material.color.set(power.color);
    const lookId = this.disguise || power?.id;
    if (!this.arch || this.arch !== archetypeFor(lookId)) {
      this.buildLook(lookId, this.nemesis ? NEMESIS_PALETTE() : null);
    }
  }

  disguiseAs(powerId, seed = Math.random()) {
    this.disguise = powerId;
    const saveSeed = this.paletteSeed;
    this.paletteSeed = seed;
    this.buildLook(powerId);
    this.paletteSeed = saveSeed;
  }

  // Shapeshift into scenery: the hero body is hidden and a prop mesh sits in
  // its place until undisguise() brings the body back.
  disguiseAsProp(mesh) {
    this.undisguise();
    this.propMesh = mesh;
    mesh.rotation.y = -this.yaw;   // props are built axis-aligned; undo the group yaw
    this.group.add(mesh);
    this.body.visible = false;
    if (this.cape) this.cape.visible = false;
    this.aura.visible = false;
    if (this.label) this.label.visible = false;
  }

  undisguise() {
    if (this.propMesh) {
      this.group.remove(this.propMesh);
      this.propMesh.geometry.dispose();
      this.propMesh = null;
      if (this.body) this.body.visible = true;
      if (this.cape) this.cape.visible = true;
      this.aura.visible = true;
      if (this.label) this.label.visible = true;
    }
    if (!this.disguise) return;
    this.disguise = null;
    this.buildLook(this.power.id);
  }

  setNemesisLook() {
    this.nemesis = true;
    this.aura.material.color.set(0xff2038);
    this.aura.material.opacity = 0.95;
    this.aura.scale.setScalar(1.5);
    this.buildLook(this.power.id, NEMESIS_PALETTE());
    if (this.label) this.group.remove(this.label);
    this.label = makeLabelSprite(this.name, '#ff5470');
    this.label.position.y = this.heightM + 0.35;
    this.group.add(this.label);
  }

  setOpacity(alpha) {
    if (alpha === this.opacity) return;
    this.opacity = alpha;
    this.applyOpacity();
  }

  applyOpacity() {
    const alpha = this.opacity;
    const apply = (m) => { m.transparent = alpha < 1; m.opacity = alpha; m.needsUpdate = true; };
    if (this.body) {
      apply(this.body.material);
      this.body.traverse((o) => { if (o !== this.body && o.material) apply(o.material); });
    }
    this.cape?.setOpacity(alpha);
    this.aura.material.opacity = 0.55 * alpha;
    if (this.label) this.label.material.opacity = alpha < 1 ? alpha * 0.4 : 1;
  }

  // ---------- state ----------

  // World height of the feet — altitude above whatever surface is underfoot.
  // Combat compares these so a flyer and a pedestrian can't trade blows.
  get feetY() { return this.altitude + this.groundY; }

  get frozen() { return performance.now() / 1000 < this.frozenUntil; }
  freeze(dur) { this.frozenUntil = performance.now() / 1000 + dur; this.iceShell.visible = true; }

  get combat() { return this.arch.combat; }
  get attacking() { return this.anim.attacking; }

  // Play the archetype's next attack clip; returns timing + damage for the game.
  startAttack() {
    const c = this.arch.combat;
    const name = this.anim.nextMove();
    const info = this.anim.startAttack(name, c.speed);
    if (!info) return { move: name, duration: 0.5, hits: [0.25], damage: c.damage, range: c.range, arc: c.arc };
    return { move: name, duration: info.duration, hits: info.hits, damage: c.damage * info.hitScale, range: c.range, arc: c.arc };
  }

  cast(powerId, hold = false) { this.anim.startCast(this.arch.cast || 'spell_cast', hold); }
  stopCast() { this.anim.stopCast(); }
  hitReaction() { this.anim.hitReaction(); }
  setHeld(on) { if (on) this.anim.startHeld(); else this.anim.endHeld(); }
  landing() { this.anim.landing(); }
  emote() { this.anim.emote(); }
  die(kind) { this.anim.die(kind); this.aura.visible = false; }

  // ---------- per-frame ----------

  update(dt, time) {
    if (!this.frozen && this.iceShell.visible) this.iceShell.visible = false;
    // a single bad number here would spread into the camera, which never recovers
    if (!Number.isFinite(this.altitude)) this.altitude = 0;
    if (!Number.isFinite(this.pos.x + this.pos.z)) this.pos.set(0, 0, 0);

    // ride up onto raised kerbs and slabs instead of sinking into them
    if (WORLD) {
      const target = WORLD.groundHeightAt(this.pos.x, this.pos.z);
      const step = Math.abs(target - this.groundY);
      this.groundY = step > 1.5 ? target : this.groundY + (target - this.groundY) * Math.min(1, dt * 16);
    }

    this.curScale += (this.scaleTarget - this.curScale) * Math.min(1, dt * 5);
    this.group.scale.setScalar(this.curScale);

    const speed = Math.hypot(this.vel.x, this.vel.z);
    const flying = this.flying;   // set by the game: real flight only, not lifted / thrown / falling
    // through the first couple of metres of a take-off or the last of a landing the
    // animator floats the body in a crucifix instead of a planted ground stance
    const float = flying && this.altitude < 2.6;
    this.rootMoved = false;
    if (!this.frozen) {
      const { root } = this.anim.update(dt, { speed, backward: this.backward, flying, float, time });
      if (root.x || root.z) {
        // root motion: rig units -> metres, character-local -> world
        const s = this.unitScale * this.curScale;
        const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
        this.pos.x += (root.x * cy + root.z * sy) * s;
        this.pos.z += (-root.x * sy + root.z * cy) * s;
        this.rootMoved = true;
      }
    }
    // hovering in place: float up and down a little; fades out once moving or landed
    const bobTarget = this.flying && this.altitude > 1 && speed < 1.6 ? Math.sin(time * 2.1 + this.phase) * 0.22 : 0;
    this.hoverBob += (bobTarget - this.hoverBob) * Math.min(1, dt * 4);
    this.group.position.set(this.pos.x, this.altitude + this.groundY + this.hoverBob, this.pos.z);
    this.group.rotation.y = this.yaw;

    // airborne body language: roll into turns and dip the nose with speed — on
    // the body, so the cape and hits follow. Reverse just holds the hover pose.
    let dYaw = this.yaw - this.prevYaw;
    while (dYaw > Math.PI) dYaw -= Math.PI * 2;
    while (dYaw < -Math.PI) dYaw += Math.PI * 2;
    this.prevYaw = this.yaw;
    const yawRate = dt > 0 ? dYaw / dt : 0;
    this.turnRate += (Math.max(-6, Math.min(6, yawRate)) - this.turnRate) * Math.min(1, dt * 6);
    const airborne = flying && this.altitude > 0.8;
    const wantRoll = airborne ? -Math.max(-0.6, Math.min(0.6, this.turnRate * 0.16)) : 0;
    const wantPitch = this.dive ? -1.15 : airborne && !this.backward && speed > 1.6 ? -0.10 * Math.min(1, speed / 12) : 0;
    this.roll += (wantRoll - this.roll) * Math.min(1, dt * 5);
    this.pitch += (wantPitch - this.pitch) * Math.min(1, dt * (this.dive ? 9 : 4));
    if (this.body) this.body.rotation.set(this.pitch, 0, this.roll);

    const lift = this.altitude;
    this.blobShadow.position.y = -lift / Math.max(0.001, this.curScale) + 0.04;
    const fade = 1 / (1 + lift * 0.25);
    this.blobShadow.material.opacity = 0.3 * fade * this.opacity;
    this.blobShadow.scale.setScalar(Math.max(0.4, fade));

    this.aura.rotation.z = time * 1.5;
    const pulse = 0.9 + Math.sin(time * 5 + this.pos.x) * 0.12;
    this.aura.scale.setScalar(pulse * (this.nemesis ? 1.5 : 1));

    for (const e of this.extras) e.userData.animate?.(time);

    if (this.cape) {
      this.group.updateMatrixWorld(true);
      const chest = this.rig.bones[MX.spine2], hips = this.rig.bones[MX.hips];
      for (let i = 0; i < this.capePins.length; i++) {
        this.capePins[i].copy(this.rig.pins[i]);
        chest.localToWorld(this.capePins[i]);
      }
      const a = new THREE.Vector3(); chest.getWorldPosition(a);
      const b = new THREE.Vector3(); hips.getWorldPosition(b);
      const q = new THREE.Quaternion(); chest.getWorldQuaternion(q);
      const back = new THREE.Vector3(0, 0, -1).applyQuaternion(q).normalize();
      const mid = a.clone().add(b).multiplyScalar(0.5);
      this.cape.update(dt, this.capePins, { a, b, r: this.rig.torsoRadius * this.unitScale * this.curScale * 1.12, back, mid }, this.vel, this.curScale);
    }
  }

  dispose() {
    this.undisguise();
    this.destroyBody();
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
}
