// Mixer-driven animator for the hero rig, playing the baked Mixamo clips.
//
//  base layer : idle (ninja / hero per archetype), walk & run (forward and
//               backward), flying — crossfaded by movement state
//  overrides  : attacks (per-archetype clip sets, impact times from the bake),
//               hit reactions, power casts (held or one-shot), deaths, emotes
//  root motion: hips XZ from the clip is returned each frame so the game can
//               move the character (lunging kicks, falls) with collision
import * as THREE from 'three';
import { ANIM } from './animlib.js';
import { MX } from './rig.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const FADE = 0.16;
const FLY_HIPS_DROP = 11.5;   // the flying clip hovers ~13 units up; keep it near the group origin

export class Animator {
  constructor(mesh, arch, { hipsYOffset = 0 } = {}) {
    this.mesh = mesh;
    this.arch = arch;
    this.mixer = new THREE.AnimationMixer(mesh);
    this.hips = mesh.skeleton.bones.find((b) => b.name === MX.hips);
    this.hipsYOffset = hipsYOffset;
    this.actions = {};
    this.base = null; this.baseName = null;
    this.over = null;         // { action, name, mode, end, hitsFired, rootPrev }
    this.moveIndex = 0;
    this.dead = false;
    this.rootDelta = { x: 0, z: 0 };
    this.flyK = 0;
    this.floatK = 0;      // crucifix float through take-off / touch-down
    this.mixedHipsY = undefined;
    this.bones = mesh.skeleton.bones;
  }

  action(name) {
    let a = this.actions[name];
    if (!a) {
      const clip = ANIM.clips[name];
      if (!clip) return null;
      a = this.mixer.clipAction(clip);
      this.actions[name] = a;
    }
    return a;
  }

  // ---- base layer ----
  setBase(name, timeScale = 1) {
    const a = this.action(name);
    if (!a) return;
    if (this.base !== a) {
      // crossFadeFrom only schedules weights — the new action must be played
      a.reset().setLoop(THREE.LoopRepeat, Infinity);
      a.clampWhenFinished = false;
      a.enabled = true;
      a.play();
      if (this.over) {
        // an override owns the body: park both (disabled, but with full weight so
        // the fadeIn on endOverride has something to ramp — fadeIn multiplies weight)
        a.setEffectiveWeight(1);
        a.enabled = false;
        if (this.base) this.base.enabled = false;
      } else if (this.base) {
        a.setEffectiveWeight(1);
        // hover <-> cruise blends slower so stopping in the air reads as settling
        const fade = (name === 'flying' || name === 'flying_idle') && (this.baseName === 'flying' || this.baseName === 'flying_idle') ? 0.55 : FADE * 1.6;
        a.crossFadeFrom(this.base, fade, false);
      } else {
        a.setEffectiveWeight(1);
      }
      this.base = a; this.baseName = name;
    }
    a.setEffectiveTimeScale(timeScale);
  }

  // ---- overrides (full body, one-shot) ----
  startOverride(name, { mode, timeScale = 1, end = 1, loop = false, fade = FADE } = {}) {
    const a = this.action(name);
    if (!a) return null;
    if (this.over && this.over.action !== a) this.over.action.fadeOut(fade);
    else if (this.over && this.over.action === a) { /* restart below */ }
    a.reset();
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    a.clampWhenFinished = true;
    a.enabled = true;
    a.setEffectiveTimeScale(timeScale);
    a.setEffectiveWeight(1);
    a.fadeIn(fade);
    a.play();
    if (this.base) this.base.fadeOut(fade);
    const dur = ANIM.duration[name];
    const rx = ANIM.rootXZ[name];
    this.over = { action: a, name, mode, end: end * dur, rootPrev: [rx[0], rx[1]], loop };
    return { duration: (end * dur) / timeScale, rawDuration: dur, timeScale };
  }

  endOverride(fade = FADE) {
    if (!this.over) return;
    this.over.action.fadeOut(fade);
    this.over = null;
    if (this.base) {
      // a fully faded-out action disables itself; re-arm it before fading back in
      this.base.enabled = true;
      this.base.paused = false;
      this.base.setEffectiveWeight(1);
      this.base.play();
      this.base.fadeIn(fade);
    }
  }

  // telekinesis victims flail in a looped reaction until dropped / thrown / killed
  startHeld() {
    if (this.dead || (this.over && this.over.mode === 'held')) return;
    const name = ANIM.clips.reaction_2 ? 'reaction_2' : 'reaction';
    this.startOverride(name, { mode: 'held', loop: true, timeScale: 0.7 });
  }
  endHeld() { if (this.over && this.over.mode === 'held') this.endOverride(); }

  get attacking() { return !!this.over && this.over.mode === 'attack'; }
  get busy() { return !!this.over && (this.over.mode === 'attack' || this.over.mode === 'death' || this.over.mode === 'landing'); }

  nextMove() {
    const list = this.arch.combat.moves;
    const name = list[this.moveIndex % list.length];
    this.moveIndex++;
    return name;
  }

  startAttack(name, speedMul = 1) {
    const ts = 1.25 * speedMul;
    const impacts = ANIM.impacts[name] || [];
    const raw = ANIM.duration[name];
    const last = impacts.length ? impacts[impacts.length - 1] : raw * 0.5;
    const end = clamp((last + 0.38) / raw, 0.55, 0.95);
    const info = this.startOverride(name, { mode: 'attack', timeScale: ts, end });
    if (!info) return null;
    const hits = (impacts.length ? impacts : [raw * 0.5]).map((t) => t / ts);
    return { duration: info.duration, hits, hitScale: hits.length > 1 ? 0.6 : 1 };
  }

  hitReaction() {
    if (this.dead || (this.over && (this.over.mode === 'attack' || this.over.mode === 'death'))) return;
    const names = ['reaction', 'reaction_2', 'reaction_3'].filter((n) => ANIM.clips[n]);
    if (!names.length) return;
    this.startOverride(names[Math.floor(Math.random() * names.length)], { mode: 'hit', timeScale: 1.4, end: 0.55 });
  }

  startCast(name, hold = false) {
    if (this.dead) return;
    if (hold) this.startOverride(name, { mode: 'cast', loop: true, timeScale: 1 });
    else this.startOverride(name, { mode: 'cast', timeScale: 1.3, end: 0.9 });
  }
  stopCast() { if (this.over && this.over.mode === 'cast') this.endOverride(); }

  landing() { this.startOverride('superhero_landing', { mode: 'landing', timeScale: 1.2, end: 0.98 }); }
  emote() { if (!this.busy) this.startOverride('fist_pump', { mode: 'emote', timeScale: 1, end: 0.6 }); }

  die(kind = 'back') {
    const name = kind === 'forward' ? 'falling_forward_death' : kind === 'fly' ? 'flying_back_death_3' : 'falling_back_death';
    this.dead = true;
    this.startOverride(name, { mode: 'death', timeScale: 1, end: 1, fade: 0.08 });
  }

  // ctx: { speed, backward, flying, time }
  // returns { root: {x, z} } root motion in rig units (character-local, +Z forward)
  update(dt, ctx) {
    // base state
    if (!this.dead) {
      let name, ts = 1;
      if (ctx.flying) {
        // hover upright when slowing to a stop or drifting backward, stretch out prone once moving
        name = (ctx.speed < 1.6 || ctx.backward) && ANIM.clips.flying_idle ? 'flying_idle' : 'flying';
        ts = 1;
      }
      else if (ctx.speed > 3.2) { name = ctx.backward ? 'running_backward_2' : 'fast_run_4'; ts = clamp(0.6 + ctx.speed / 11, 0.7, 2.4); }
      else if (ctx.speed > 0.5) { name = ctx.backward ? 'walking_backwards' : 'walking_2'; ts = clamp(0.5 + ctx.speed / 3.2, 0.6, 1.6); }
      else { name = this.arch.idle || 'idle_4'; ts = 1; }
      if (!ANIM.clips[name]) name = 'idle_4';
      this.setBase(name, ts);
    }

    // override bookkeeping
    this.rootDelta.x = 0; this.rootDelta.z = 0;
    if (this.over) {
      const o = this.over;
      const t = o.action.time;
      // root motion
      const rx = ANIM.rootXZ[o.name];
      if (rx) {
        const fps = ANIM.fps, frames = rx.length / 2;
        const fi = clamp(t * fps, 0, frames - 1);
        const i0 = Math.floor(fi), i1 = Math.min(frames - 1, i0 + 1), k = fi - i0;
        const x = rx[i0 * 2] + (rx[i1 * 2] - rx[i0 * 2]) * k;
        const z = rx[i0 * 2 + 1] + (rx[i1 * 2 + 1] - rx[i0 * 2 + 1]) * k;
        if (o.mode !== 'cast' && o.mode !== 'hit') {
          this.rootDelta.x = x - o.rootPrev[0];
          this.rootDelta.z = z - o.rootPrev[1];
        }
        o.rootPrev[0] = x; o.rootPrev[1] = z;
      }
      if (!o.loop && t >= o.end && o.mode !== 'death') this.endOverride();
    }

    // the mixer skips writing a bone whose blended value did not change since the
    // last frame, so undo last frame's hips fix-up first or it would accumulate
    if (this.hips && this.mixedHipsY !== undefined) this.hips.position.y = this.mixedHipsY;

    this.mixer.update(dt);

    // post-fix hips: proportion offset, flying hover (smoothed, applies across
    // overrides too so mid-air attacks don't pop the body up)
    this.flyK += ((ctx.flying ? 1 : 0) - this.flyK) * Math.min(1, dt * 7);
    if (this.hips) this.mixedHipsY = this.hips.position.y;

    // take-off / touch-down: blend the whole body toward the bind pose — arms
    // out, legs together, a clean crucifix float — instead of leaving the feet
    // planted in a ground stance while the ground drops away
    this.floatK += ((ctx.float && !this.over ? 1 : 0) - this.floatK) * Math.min(1, dt * 7);
    if (this.floatK > 0.002) {
      for (const b of this.bones) {
        const r = b.userData.restQuat;
        if (r) b.quaternion.slerp(r, this.floatK);
      }
      if (this.hips) {
        const restY = this.hips.userData.restPos?.y ?? this.hips.position.y;
        this.hips.position.y += (restY - this.hips.position.y) * this.floatK;
      }
    }

    if (this.hips) this.hips.position.y += this.hipsYOffset - FLY_HIPS_DROP * this.flyK * (1 - this.floatK);
    return { root: this.rootDelta };
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mesh);
  }
}
