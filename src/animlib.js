// Loads public/anims.json (baked Mixamo clips) and turns it into
// THREE.AnimationClips that play directly on the hero rig's Mixamo-named
// bones. Hips XZ is stripped from the clips and kept aside as root motion.
import * as THREE from 'three';

export const ANIM = {
  ready: false,
  fps: 30,
  unitHeight: 29,
  bones: [],
  skeleton: {},
  clips: {},      // key -> THREE.AnimationClip
  rootXZ: {},     // key -> Float32Array [frames*2] (units)
  impacts: {},    // key -> [seconds]
  duration: {},   // key -> seconds
};

function decodeQuat(b64, count) {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(buf, 0, count);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) out[i] = i16[i] / 32767;
  return out;
}

export async function loadAnimLib(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('anims.json failed to load: ' + res.status);
  const data = await res.json();
  ANIM.fps = data.fps;
  ANIM.unitHeight = data.unitHeight;
  ANIM.bones = data.bones;
  ANIM.skeleton = data.skeleton;
  const nb = data.bones.length;

  for (const [key, c] of Object.entries(data.clips)) {
    const frames = c.frames;
    const times = new Float32Array(frames);
    for (let f = 0; f < frames; f++) times[f] = f / data.fps;
    const all = decodeQuat(c.quat, frames * nb * 4);
    const tracks = [];
    for (let bi = 0; bi < nb; bi++) {
      const vals = new Float32Array(frames * 4);
      for (let f = 0; f < frames; f++) {
        const src = (f * nb + bi) * 4;
        vals[f * 4] = all[src]; vals[f * 4 + 1] = all[src + 1]; vals[f * 4 + 2] = all[src + 2]; vals[f * 4 + 3] = all[src + 3];
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(data.bones[bi] + '.quaternion', times, vals));
    }
    // hips: keep Y (bob / crouch / fall), zero XZ (root motion handled separately)
    const hp = new Float32Array(frames * 3);
    for (let f = 0; f < frames; f++) { hp[f * 3] = 0; hp[f * 3 + 1] = c.rootY[f]; hp[f * 3 + 2] = 0; }
    tracks.push(new THREE.VectorKeyframeTrack('mixamorigHips.position', times, hp));

    ANIM.clips[key] = new THREE.AnimationClip(key, c.duration, tracks);
    ANIM.rootXZ[key] = Float32Array.from(c.rootXZ);
    ANIM.impacts[key] = c.impacts || [];
    ANIM.duration[key] = c.duration;
  }
  ANIM.ready = true;
  return ANIM;
}

export const hasClip = (key) => !!ANIM.clips[key];
