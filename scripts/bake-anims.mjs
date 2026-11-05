// Bakes the Mixamo FBX sources in anim-src/mixamo into public/anims.json:
//   - the shared skeleton (bind/T-pose local transforms, Mixamo bone names)
//   - every clip resampled at 30 fps: per-bone local quaternions quantized to
//     int16 (base64), plus the hips root track split into Y (kept in the
//     clip) and XZ (applied as root motion by the game)
// Finger bones and *_End leaves are dropped — the hero mesh has no fingers.
//
// Run:  npm run bake      (the FBX files never ship; only the JSON does)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'anim-src', 'mixamo');
const OUT = join(root, 'public', 'anims.json');
const FPS = 30;

const KEEP = [
  'mixamorigHips', 'mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 'mixamorigNeck', 'mixamorigHead',
  'mixamorigLeftShoulder', 'mixamorigLeftArm', 'mixamorigLeftForeArm', 'mixamorigLeftHand',
  'mixamorigRightShoulder', 'mixamorigRightArm', 'mixamorigRightForeArm', 'mixamorigRightHand',
  'mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigLeftFoot', 'mixamorigLeftToeBase',
  'mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigRightFoot', 'mixamorigRightToeBase',
];
const ENDS = ['mixamorigHeadTop_End', 'mixamorigLeftToe_End', 'mixamorigRightToe_End'];

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.fbx$/i.test(n)) out.push(p);
  }
  return out;
}
const key = (file) => basename(file).replace(/\.fbx$/i, '').replace(/-(\d+)$/, '_$1').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const loader = new FBXLoader();
function load(file) {
  const buf = readFileSync(file);
  return loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
}

const files = walk(SRC).sort();
if (!files.length) { console.error('bake: no .fbx files under anim-src/mixamo'); process.exit(1); }

// ---- skeleton from the first file (all clips share the rig) ----
const ref = load(files[0]);
const bones = {};
ref.traverse((o) => { if (o.isBone) bones[o.name] = o; });
for (const n of KEEP.concat(ENDS)) if (!bones[n]) { console.error('bake: missing bone', n); process.exit(1); }
ref.updateMatrixWorld(true);
const skeleton = {};
for (const n of KEEP.concat(ENDS)) {
  const b = bones[n];
  skeleton[n] = {
    parent: b.parent && b.parent.isBone ? b.parent.name : null,
    pos: b.position.toArray().map((v) => +v.toFixed(4)),
    quat: b.quaternion.toArray().map((v) => +v.toFixed(5)),
  };
}
const wp = (n) => { const v = new THREE.Vector3(); bones[n].getWorldPosition(v); return v; };
const unitHeight = wp('mixamorigHeadTop_End').y - Math.min(wp('mixamorigLeftToe_End').y, wp('mixamorigRightToe_End').y);

// ---- clips ----
const clips = {};
let totalFrames = 0;
for (const file of files) {
  const obj = file === files[0] ? ref : load(file);
  const b = {}; obj.traverse((o) => { if (o.isBone) b[o.name] = o; });
  const clip = obj.animations[0];
  const mixer = new THREE.AnimationMixer(obj);
  mixer.clipAction(clip).play();
  const frames = Math.max(2, Math.round(clip.duration * FPS) + 1);
  const q = new Int16Array(frames * KEEP.length * 4);
  const rootY = new Array(frames), rootXZ = new Array(frames * 2);
  const reach = new Array(frames);   // forward extension of the striking limbs, for impact detection
  const wv = new THREE.Vector3(), hv = new THREE.Vector3();
  for (let f = 0; f < frames; f++) {
    const t = Math.min(clip.duration - 1e-4, f / FPS);
    mixer.setTime(t);
    obj.updateMatrixWorld(true);
    b['mixamorigHips'].getWorldPosition(hv);
    let best = -1e9;
    for (const n of ['mixamorigLeftHand', 'mixamorigRightHand', 'mixamorigLeftToe_End', 'mixamorigRightToe_End']) {
      b[n].getWorldPosition(wv);
      best = Math.max(best, Math.hypot(wv.x - hv.x, wv.z - hv.z) + (wv.z - hv.z) * 0.5);
    }
    reach[f] = best;
    for (let i = 0; i < KEEP.length; i++) {
      const bq = b[KEEP[i]].quaternion;
      const o = (f * KEEP.length + i) * 4;
      q[o] = Math.round(bq.x * 32767); q[o + 1] = Math.round(bq.y * 32767);
      q[o + 2] = Math.round(bq.z * 32767); q[o + 3] = Math.round(bq.w * 32767);
    }
    const hp = b['mixamorigHips'].position;
    rootY[f] = +hp.y.toFixed(3);
    rootXZ[f * 2] = +hp.x.toFixed(3); rootXZ[f * 2 + 1] = +hp.z.toFixed(3);
  }
  totalFrames += frames;

  // impacts: local maxima of limb reach (at least 70% of the global peak,
  // separated by >= 0.25 s) — the frames where a strike lands
  const peak = Math.max(...reach), floor = Math.min(...reach);
  const impacts = [];
  for (let f = 2; f < frames - 2; f++) {
    if (reach[f] >= reach[f - 1] && reach[f] >= reach[f + 1] && reach[f] > reach[f - 2] && reach[f] > reach[f + 2]
      && (reach[f] - floor) >= 0.7 * (peak - floor)) {
      const t = f / FPS;
      if (!impacts.length || t - impacts[impacts.length - 1] >= 0.25) impacts.push(+t.toFixed(3));
    }
  }

  clips[key(file)] = {
    duration: +((frames - 1) / FPS).toFixed(4),
    frames,
    quat: Buffer.from(q.buffer).toString('base64'),
    rootY,
    rootXZ,
    impacts,
  };
  console.log(`bake: ${key(file).padEnd(36)} ${frames} frames  ${clip.duration.toFixed(2)}s  impacts=${impacts.join(',')}`);
}

const out = { fps: FPS, unitHeight: +unitHeight.toFixed(3), bones: KEEP, skeleton, clips };
const json = JSON.stringify(out);
writeFileSync(OUT, json);
console.log(`bake: ${files.length} clips, ${totalFrames} frames -> public/anims.json (${(json.length / 1024).toFixed(0)} kB)`);
