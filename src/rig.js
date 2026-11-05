// Procedural skinned hero rig built on the Mixamo skeleton (from the baked
// animation library), so mocap clips drive it directly. The lofted body,
// muscle profiles, sculpted head, hair, gear and emblems are all generated
// around the bind (T-)pose in Mixamo units; the SkinnedMesh is scaled to the
// archetype's height by the Character.
import * as THREE from 'three';
import { SUITS } from './archetypes.js';
import { ANIM } from './animlib.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const gauss = (x, w) => Math.exp(-(x * x) / (2 * w * w));
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const smoothstep = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

// Mixamo bone aliases
export const MX = {
  hips: 'mixamorigHips', spine: 'mixamorigSpine', spine1: 'mixamorigSpine1', spine2: 'mixamorigSpine2',
  neck: 'mixamorigNeck', head: 'mixamorigHead', headTop: 'mixamorigHeadTop_End',
  L: { shoulder: 'mixamorigLeftShoulder', arm: 'mixamorigLeftArm', foreArm: 'mixamorigLeftForeArm', hand: 'mixamorigLeftHand',
    upLeg: 'mixamorigLeftUpLeg', leg: 'mixamorigLeftLeg', foot: 'mixamorigLeftFoot', toe: 'mixamorigLeftToeBase', toeEnd: 'mixamorigLeftToe_End' },
  R: { shoulder: 'mixamorigRightShoulder', arm: 'mixamorigRightArm', foreArm: 'mixamorigRightForeArm', hand: 'mixamorigRightHand',
    upLeg: 'mixamorigRightUpLeg', leg: 'mixamorigRightLeg', foot: 'mixamorigRightFoot', toe: 'mixamorigRightToeBase', toeEnd: 'mixamorigRightToe_End' },
};

// ---------------------------------------------------------------------------
// geometry accumulator with skin attributes
// ---------------------------------------------------------------------------
class Builder {
  constructor(boneIndex) {
    this.BI = boneIndex;
    this.pos = []; this.col = []; this.si = []; this.sw = []; this.idx = [];
    this.n = 0;
  }
  vertex(p, color, weights) {
    this.pos.push(p.x, p.y, p.z);
    this.col.push(color.r, color.g, color.b);
    const w = weights.slice(0, 4);
    while (w.length < 4) w.push([0, 0]);
    let sum = 0;
    for (const [, wt] of w) sum += wt;
    for (const [bn, wt] of w) { this.si.push(this.BI[bn] ?? 0); this.sw.push(sum > 0 ? wt / sum : 0); }
    return this.n++;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }

  tube({ from, to, rings, segs, radius, bump, color, weights, frame, closeStart = false, closeEnd = false }) {
    const axis = to.clone().sub(from);
    const start = this.n;
    const centers = [];
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1);
      const c = from.clone().addScaledVector(axis, t);
      centers.push(c);
      const { rx, rz } = radius(t);
      for (let j = 0; j < segs; j++) {
        const th = (j / segs) * TAU;
        const b = bump ? bump(t, th) : 0;
        const k = 1 + b / ((rx + rz) * 0.5);
        const p = c.clone()
          .addScaledVector(frame.u, rx * Math.cos(th) * k)
          .addScaledVector(frame.v, rz * Math.sin(th) * k);
        this.vertex(p, color(t, th), weights(t));
      }
    }
    for (let i = 0; i < rings - 1; i++) {
      for (let j = 0; j < segs; j++) {
        const a = start + i * segs + j;
        const b = start + i * segs + (j + 1) % segs;
        const c = start + (i + 1) * segs + (j + 1) % segs;
        const d = start + (i + 1) * segs + j;
        this.quad(a, b, c, d);
      }
    }
    if (closeStart) {
      const cv = this.vertex(centers[0], color(0, 0), weights(0));
      for (let j = 0; j < segs; j++) this.tri(cv, start + (j + 1) % segs, start + j);
    }
    if (closeEnd) {
      const base = start + (rings - 1) * segs;
      const cv = this.vertex(centers[rings - 1], color(1, 0), weights(1));
      for (let j = 0; j < segs; j++) this.tri(cv, base + j, base + (j + 1) % segs);
    }
  }

  sphere({ center, radii, wSeg = 14, hSeg = 10, color, weights, displace, filter }) {
    const start = this.n;
    const grid = [];
    for (let iy = 0; iy <= hSeg; iy++) {
      const v = iy / hSeg;
      const phi = v * Math.PI;
      const row = [];
      for (let ix = 0; ix <= wSeg; ix++) {
        const u = ix / wSeg;
        const th = u * TAU;
        const n = new THREE.Vector3(-Math.cos(th) * Math.sin(phi), Math.cos(phi), Math.sin(th) * Math.sin(phi));
        let r = 1;
        if (displace) r += displace(n);
        const p = new THREE.Vector3(n.x * radii.x * r, n.y * radii.y * r, n.z * radii.z * r).add(center);
        const keep = !filter || filter(n);
        row.push(keep ? this.vertex(p, typeof color === 'function' ? color(n) : color, weights) : -1);
      }
      grid.push(row);
    }
    for (let iy = 0; iy < hSeg; iy++) {
      for (let ix = 0; ix < wSeg; ix++) {
        const a = grid[iy][ix], b = grid[iy][ix + 1], c = grid[iy + 1][ix + 1], d = grid[iy + 1][ix];
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;
        if (iy !== 0) this.tri(a, b, d);
        if (iy !== hSeg - 1) this.tri(b, c, d);
      }
    }
    return start;
  }

  box({ center, size, color, weights, rot = null }) {
    const g = new THREE.BoxGeometry(size.x, size.y, size.z).toNonIndexed();
    if (rot) g.applyQuaternion(rot);
    g.translate(center.x, center.y, center.z);
    const p = g.attributes.position;
    const start = this.n;
    for (let i = 0; i < p.count; i++) this.vertex(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)), color, weights);
    for (let i = 0; i < p.count; i += 3) this.tri(start + i, start + i + 1, start + i + 2);
  }

  cone({ center, radius, height, color, weights, rot = null, segs = 7 }) {
    const g = new THREE.ConeGeometry(radius, height, segs).toNonIndexed();
    if (rot) g.applyQuaternion(rot);
    g.translate(center.x, center.y, center.z);
    const p = g.attributes.position;
    const start = this.n;
    for (let i = 0; i < p.count; i++) this.vertex(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)), color, weights);
    for (let i = 0; i < p.count; i += 3) this.tri(start + i, start + i + 1, start + i + 2);
  }

  build() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    geo.setIndex(this.idx);
    geo.computeVertexNormals();
    return geo;
  }
}

function profile(points) {
  return (t) => {
    if (t <= points[0][0]) return points[0][1];
    for (let i = 0; i < points.length - 1; i++) {
      const [t0, v0] = points[i], [t1, v1] = points[i + 1];
      if (t <= t1) return v0 + (v1 - v0) * smoothstep((t - t0) / (t1 - t0));
    }
    return points[points.length - 1][1];
  };
}

// tube frame: v = "front" (+Z projected off the axis), u = axis x v
function frameFor(axis) {
  const a = axis.clone().normalize();
  let v = new THREE.Vector3(0, 0, 1).addScaledVector(a, -a.z);
  if (v.lengthSq() < 1e-4) v = new THREE.Vector3(0, 1, 0).addScaledVector(a, -a.y);
  v.normalize();
  const u = a.clone().cross(v).normalize();
  return { u, v };
}

// ---------------------------------------------------------------------------
// rig construction
// ---------------------------------------------------------------------------
export function buildRig(arch, P, { faceless = false } = {}) {
  const b = arch.build;
  const mass = b.mass, def = b.definition;
  const H = ANIM.unitHeight;      // Mixamo units; all proportions are fractions of body height

  // ---- skeleton (bind pose) with archetype proportion tweaks ----
  const names = ANIM.bones.concat([MX.headTop, MX.L.toeEnd, MX.R.toeEnd]);
  const bones = {};
  for (const n of names) {
    const s = ANIM.skeleton[n];
    const bone = new THREE.Bone();
    bone.name = n;
    bone.position.fromArray(s.pos);
    bone.quaternion.fromArray(s.quat);
    // bind pose kept for procedural blends (the T-pose doubles as the flight "float")
    bone.userData.restQuat = bone.quaternion.clone();
    bone.userData.restPos = bone.position.clone();
    bones[n] = bone;
  }
  for (const n of names) {
    const p = ANIM.skeleton[n].parent;
    if (p && bones[p]) bones[p].add(bones[n]);
  }
  // proportion tweaks: leg length and shoulder width scale bone offsets
  for (const S of ['L', 'R']) {
    bones[MX[S].leg].position.multiplyScalar(b.legLen);
    bones[MX[S].foot].position.multiplyScalar(b.legLen);
    bones[MX[S].arm].position.multiplyScalar(b.shoulder);
  }
  const legRest = ANIM.skeleton[MX.L.leg].pos, footRest = ANIM.skeleton[MX.L.foot].pos;
  const legLenUnits = Math.hypot(...legRest) + Math.hypot(...footRest);
  const hipsYOffset = legLenUnits * (b.legLen - 1);

  bones[MX.hips].updateMatrixWorld(true);
  const W = (n) => { const v = new THREE.Vector3(); bones[n].getWorldPosition(v); return v; };
  const BI = Object.fromEntries(names.map((n, i) => [n, i]));

  const B = new Builder(BI);
  const suit = SUITS[arch.suit] || SUITS.flight;
  const suitColor = (region, t, theta, y, side) => suit({ region, t, theta, y: y / H, side }, P);
  const skin = P.skin;

  const hipsP = W(MX.hips), neckP = W(MX.neck), headP = W(MX.head), headTopP = W(MX.headTop);
  const spineP = W(MX.spine), spine1P = W(MX.spine1), spine2P = W(MX.spine2);
  const armL = W(MX.L.arm), armR = W(MX.R.arm);
  const shoulderX = Math.abs(armL.x - armR.x) / 2;
  const shoulderY = (armL.y + armR.y) / 2;

  // ---- torso: below the hips up to the neck, along the spine ----
  const torsoFrom = hipsP.clone().add(new THREE.Vector3(0, -0.07 * H, 0));
  const torsoTo = neckP.clone();
  const torsoAxis = torsoTo.clone().sub(torsoFrom);
  const F = frameFor(torsoAxis);
  const rxP = profile([
    [0, 0.088 * H * (0.9 + 0.1 * b.waist)], [0.2, 0.076 * H * b.waist], [0.5, 0.098 * H * (0.55 + 0.45 * b.shoulder)],
    [0.72, 0.112 * H * b.shoulder], [0.86, 0.128 * H * b.shoulder], [1, 0.05 * H],
  ]);
  const rzP = profile([
    [0, 0.062 * H * (0.8 + 0.2 * b.waist)], [0.2, 0.052 * H * b.waist], [0.5, 0.066 * H * (0.7 + 0.3 * mass)],
    [0.72, 0.074 * H * (0.7 + 0.3 * mass)], [0.86, 0.068 * H], [1, 0.05 * H],
  ]);
  const spineBones = [[MX.hips, torsoFrom.y], [MX.spine, spineP.y], [MX.spine1, spine1P.y], [MX.spine2, spine2P.y], [MX.neck, neckP.y]];
  const torsoWeights = (t) => {
    const y = torsoFrom.y + torsoAxis.y * t;
    for (let i = 0; i < spineBones.length - 1; i++) {
      const [na, ya] = spineBones[i], [nb, yb] = spineBones[i + 1];
      if (y <= yb) {
        const k = smoothstep((y - ya) / Math.max(1e-6, yb - ya));
        return [[na, 1 - k], [nb, k]];
      }
    }
    return [[MX.neck, 1]];
  };
  const torsoBump = (t, th) => {
    const fr = angDiff(th, Math.PI / 2), bk = angDiff(th, 3 * Math.PI / 2);
    let d = 0;
    d += 0.013 * H * def * mass * (gauss(fr - 0.4, 0.3) + gauss(fr + 0.4, 0.3)) * gauss(t - 0.7, 0.085);   // pecs
    for (const row of [0.31, 0.42, 0.53]) d += 0.0062 * H * def * (gauss(fr - 0.17, 0.13) + gauss(fr + 0.17, 0.13)) * gauss(t - row, 0.04); // abs
    d += 0.004 * H * def * (gauss(fr - 0.85, 0.2) + gauss(fr + 0.85, 0.2)) * gauss(t - 0.45, 0.12);        // obliques
    d += 0.009 * H * mass * (gauss(bk - 0.55, 0.32) + gauss(bk + 0.55, 0.32)) * gauss(t - 0.66, 0.14);      // lats
    d += 0.006 * H * mass * gauss(bk, 0.5) * gauss(t - 0.9, 0.08);                                         // traps
    d -= 0.0045 * H * gauss(bk, 0.12) * gauss(t - 0.55, 0.3);                                              // spine groove
    d -= 0.002 * H * gauss(fr, 0.06) * gauss(t - 0.7, 0.1);                                                // sternum
    return d;
  };
  B.tube({
    from: torsoFrom, to: torsoTo, rings: 18, segs: 22, frame: F,
    radius: (t) => ({ rx: rxP(t), rz: rzP(t) }),
    bump: torsoBump,
    color: (t, th) => suitColor('torso', t, th, torsoFrom.y + torsoAxis.y * t, 0),
    weights: torsoWeights, closeStart: true,
  });

  // ---- neck ----
  const headC = headP.clone().lerp(headTopP, 0.5).add(new THREE.Vector3(0, 0, 0.006 * H));
  B.tube({
    from: neckP.clone().add(new THREE.Vector3(0, -0.012 * H, 0)), to: new THREE.Vector3(headC.x, headC.y - 0.055 * H, headC.z),
    rings: 4, segs: 12, frame: F,
    radius: (t) => ({ rx: 0.031 * H * Math.sqrt(mass) * (1 + 0.15 * t), rz: 0.03 * H * Math.sqrt(mass) }),
    color: (t, th) => (faceless ? suitColor('neck', t, th, neckP.y, 0) : skin),
    weights: (t) => (t < 0.4 ? [[MX.neck, 1]] : [[MX.neck, 1 - (t - 0.4) / 0.6 * 0.6], [MX.head, (t - 0.4) / 0.6 * 0.6]]),
  });

  // ---- head ----
  const headR = new THREE.Vector3(0.066 * H, 0.078 * H, 0.071 * H);
  const headW = [[MX.head, 1]];
  const headDisplace = (n) => {
    let d = 0;
    const jaw = clamp01((-n.y - 0.15) / 0.85);
    d -= 0.16 * jaw * (Math.abs(n.x) * 0.9 + 0.15) * (n.z < 0 ? 0.6 : 1);
    d += 0.05 * gauss(n.y + 0.78, 0.15) * clamp01(n.z);
    d += 0.05 * gauss(n.y - 0.32, 0.1) * clamp01(n.z - 0.35) * (1 - 0.5 * gauss(n.x, 0.12));
    d -= 0.06 * (gauss(n.x - 0.4, 0.18) + gauss(n.x + 0.4, 0.18)) * gauss(n.y - 0.16, 0.13) * clamp01(n.z - 0.3);
    d += 0.035 * (gauss(n.x - 0.62, 0.2) + gauss(n.x + 0.62, 0.2)) * gauss(n.y + 0.08, 0.14) * clamp01(n.z);
    d -= 0.03 * (gauss(n.x - 0.8, 0.2) + gauss(n.x + 0.8, 0.2)) * gauss(n.y - 0.3, 0.2);
    d += 0.04 * clamp01(-n.z - 0.3) * clamp01(n.y + 0.2);
    return d;
  };
  B.sphere({ center: headC, radii: headR, wSeg: 20, hSeg: 14, color: faceless ? suitColor('head', 0.5, 0, headC.y, 0) : skin, weights: headW, displace: headDisplace });

  const hc = headC, hr = headR;
  if (!faceless) {
    B.box({ center: hc.clone().add(new THREE.Vector3(0, -0.004 * H, hr.z * 0.96)), size: new THREE.Vector3(0.017 * H, 0.04 * H, 0.026 * H), color: skin, weights: headW,
      rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, 0, 0)) });
    B.box({ center: hc.clone().add(new THREE.Vector3(0, -0.022 * H, hr.z * 1.02)), size: new THREE.Vector3(0.024 * H, 0.014 * H, 0.02 * H), color: skin, weights: headW });
    for (const s of [-1, 1]) {
      B.sphere({ center: hc.clone().add(new THREE.Vector3(s * hr.x * 0.98, -0.004 * H, -0.008 * H)), radii: new THREE.Vector3(0.007 * H, 0.02 * H, 0.014 * H), wSeg: 8, hSeg: 6, color: skin, weights: headW });
    }
    const brow = P.hair.clone().multiplyScalar(0.55);
    const eyeCol = new THREE.Color(0x141820);
    for (const s of [-1, 1]) {
      B.box({ center: hc.clone().add(new THREE.Vector3(s * 0.03 * H, 0.027 * H, hr.z * 0.9)), size: new THREE.Vector3(0.036 * H, 0.006 * H, 0.012 * H), color: brow, weights: headW,
        rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, s * -0.12)) });
      B.sphere({ center: hc.clone().add(new THREE.Vector3(s * 0.028 * H, 0.012 * H, hr.z * 0.86)), radii: new THREE.Vector3(0.012 * H, 0.008 * H, 0.008 * H), wSeg: 8, hSeg: 5, color: eyeCol, weights: headW });
    }
    B.box({ center: hc.clone().add(new THREE.Vector3(0, -0.046 * H, hr.z * 0.92)), size: new THREE.Vector3(0.028 * H, 0.004 * H, 0.008 * H), color: skin.clone().multiplyScalar(0.7), weights: headW });
  }
  addHair(B, arch.hair, P, hc, hr, H, headW);
  if (arch.facialHair) addFacialHair(B, arch.facialHair, P, hc, hr, H, headW);

  // ---- arms (T-pose) ----
  for (const S of ['L', 'R']) {
    const side = S === 'L' ? 1 : -1;
    const sh = W(MX[S].arm), el = W(MX[S].foreArm), wr = W(MX[S].hand);
    const handDir = wr.clone().sub(el).normalize();
    const handEnd = wr.clone().addScaledVector(handDir, 0.085 * H);
    const upperArmLen = sh.distanceTo(el), foreArmLen = el.distanceTo(wr);
    const fA = frameFor(el.clone().sub(sh)), fF = frameFor(wr.clone().sub(el)), fH = frameFor(handDir);

    B.sphere({ center: sh.clone().add(new THREE.Vector3(0, -0.006 * H, 0)), radii: new THREE.Vector3(0.034 * H * mass, 0.036 * H * mass, 0.034 * H * mass), wSeg: 12, hSeg: 8,
      color: (n) => suitColor('upperArm', 0.02, Math.atan2(n.z, n.x), sh.y, side),
      weights: [[MX[S].arm, 0.75], [MX[S].shoulder, 0.25]] });
    B.tube({
      from: sh, to: el, rings: 9, segs: 12, frame: fA,
      radius: (t) => { const base = 0.036 * H * mass * (1.1 - 0.25 * t); return { rx: base, rz: base * 1.05 }; },
      bump: (t, th) => {
        const fr = angDiff(th, Math.PI / 2), bk = angDiff(th, 3 * Math.PI / 2);
        return 0.008 * H * def * mass * gauss(fr, 0.55) * gauss(t - 0.5, 0.18) + 0.006 * H * def * mass * gauss(bk, 0.6) * gauss(t - 0.55, 0.2);
      },
      color: (t, th) => suitColor('upperArm', t, th, sh.y - upperArmLen * t, side),
      weights: (t) => t < 0.16 ? [[MX[S].arm, 1 - (0.16 - t) / 0.16 * 0.35], [MX[S].shoulder, (0.16 - t) / 0.16 * 0.35]]
        : t > 0.82 ? [[MX[S].arm, 1 - (t - 0.82) / 0.18 * 0.5], [MX[S].foreArm, (t - 0.82) / 0.18 * 0.5]]
        : [[MX[S].arm, 1]],
    });
    B.sphere({ center: el, radii: new THREE.Vector3(0.028 * H * mass, 0.03 * H * mass, 0.03 * H * mass), wSeg: 10, hSeg: 7,
      color: (n) => suitColor('foreArm', 0.02, Math.atan2(n.z, n.x), el.y, side), weights: [[MX[S].arm, 0.5], [MX[S].foreArm, 0.5]] });
    B.tube({
      from: el, to: wr, rings: 8, segs: 12, frame: fF,
      radius: (t) => { const base = 0.03 * H * Math.sqrt(mass) * (1 + 0.15 * gauss(t - 0.25, 0.2) - 0.35 * t); return { rx: base * 1.05, rz: base }; },
      color: (t, th) => suitColor('foreArm', t, th, el.y - foreArmLen * t, side),
      weights: (t) => t < 0.18 ? [[MX[S].foreArm, 1 - (0.18 - t) / 0.18 * 0.5], [MX[S].arm, (0.18 - t) / 0.18 * 0.5]]
        : t > 0.86 ? [[MX[S].foreArm, 1 - (t - 0.86) / 0.14 * 0.5], [MX[S].hand, (t - 0.86) / 0.14 * 0.5]]
        : [[MX[S].foreArm, 1]],
    });
    B.tube({
      from: wr, to: handEnd, rings: 4, segs: 10, frame: fH,
      radius: (t) => ({ rx: 0.013 * H * (1 + 0.2 * Math.sin(t * Math.PI)), rz: 0.024 * H * (1 + 0.3 * Math.sin(t * Math.PI)) }),
      color: (t, th) => suitColor('hand', t, th, wr.y, side),
      weights: (t) => t < 0.3 ? [[MX[S].hand, 0.7], [MX[S].foreArm, 0.3]] : [[MX[S].hand, 1]],
      closeEnd: true,
    });
  }

  // ---- legs ----
  for (const S of ['L', 'R']) {
    const side = S === 'L' ? 1 : -1;
    const hp = W(MX[S].upLeg), kn = W(MX[S].leg), an = W(MX[S].foot), toe = W(MX[S].toeEnd);
    const thighLen = hp.distanceTo(kn), shinLen = kn.distanceTo(an);
    const fT = frameFor(kn.clone().sub(hp)), fS = frameFor(an.clone().sub(kn));
    B.tube({
      from: hp.clone().add(new THREE.Vector3(0, 0.03 * H, 0)), to: kn, rings: 10, segs: 14, frame: fT,
      radius: (t) => { const base = 0.058 * H * Math.sqrt(mass) * (0.5 + 0.5 * b.waist) * (1.05 - 0.38 * t); return { rx: base, rz: base * 1.08 }; },
      bump: (t, th) => {
        const fr = angDiff(th, Math.PI / 2), bk = angDiff(th, 3 * Math.PI / 2);
        return 0.009 * H * def * mass * (gauss(fr - 0.3, 0.35) + gauss(fr + 0.3, 0.35)) * gauss(t - 0.55, 0.22) + 0.007 * H * def * mass * gauss(bk, 0.6) * gauss(t - 0.4, 0.22);
      },
      color: (t, th) => suitColor('thigh', t, th, hp.y - thighLen * t, side),
      weights: (t) => t < 0.15 ? [[MX[S].upLeg, 1 - (0.15 - t) / 0.15 * 0.4], [MX.hips, (0.15 - t) / 0.15 * 0.4]]
        : t > 0.84 ? [[MX[S].upLeg, 1 - (t - 0.84) / 0.16 * 0.5], [MX[S].leg, (t - 0.84) / 0.16 * 0.5]]
        : [[MX[S].upLeg, 1]],
    });
    B.sphere({ center: kn, radii: new THREE.Vector3(0.036 * H * Math.sqrt(mass), 0.04 * H, 0.038 * H), wSeg: 10, hSeg: 7,
      color: (n) => suitColor('shin', 0.02, Math.atan2(n.z, n.x), kn.y, side), weights: [[MX[S].upLeg, 0.5], [MX[S].leg, 0.5]] });
    B.tube({
      from: kn, to: an, rings: 9, segs: 12, frame: fS,
      radius: (t) => { const base = 0.037 * H * Math.sqrt(mass) * (1.05 - 0.4 * t); return { rx: base, rz: base * 1.05 }; },
      bump: (t, th) => {
        const bk = angDiff(th, 3 * Math.PI / 2);
        return 0.011 * H * def * mass * gauss(bk, 0.55) * gauss(t - 0.3, 0.16) + 0.003 * H * def * gauss(angDiff(th, Math.PI / 2), 0.25) * gauss(t - 0.5, 0.3);
      },
      color: (t, th) => suitColor('shin', t, th, kn.y - shinLen * t, side),
      weights: (t) => t < 0.16 ? [[MX[S].leg, 1 - (0.16 - t) / 0.16 * 0.5], [MX[S].upLeg, (0.16 - t) / 0.16 * 0.5]]
        : t > 0.86 ? [[MX[S].leg, 1 - (t - 0.86) / 0.14 * 0.45], [MX[S].foot, (t - 0.86) / 0.14 * 0.45]]
        : [[MX[S].leg, 1]],
    });
    // foot: heel behind the ankle, out to the toe tip
    const heel = new THREE.Vector3(an.x, toe.y + 0.012 * H, an.z - 0.035 * H);
    const toeP = new THREE.Vector3(toe.x, toe.y + 0.01 * H, toe.z + 0.01 * H);
    B.tube({
      from: heel, to: toeP, rings: 5, segs: 10, frame: frameFor(toeP.clone().sub(heel)),
      radius: (t) => ({ rx: 0.032 * H * (1 + 0.25 * Math.sin(t * Math.PI)), rz: 0.02 * H * (1.3 - 0.6 * t) }),
      color: (t, th) => suitColor('foot', t, th, an.y, side),
      weights: (t) => (t < 0.55 ? [[MX[S].foot, 1]] : [[MX[S].foot, 0.5], [MX[S].toe, 0.5]]),
      closeStart: true, closeEnd: true,
    });
  }

  // ---- chest emblem + gear ----
  addEmblem(B, arch, P, spine2P.y + 0.02 * H, rzP(0.72), H, MX.spine2);
  for (const g of arch.gear) addGear(B, g, P, hc, hr, H, headW);

  const geo = B.build();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H * 0.5, 0), H * 1.4);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.04 });
  const mesh = new THREE.SkinnedMesh(geo, mat);
  mesh.add(bones[MX.hips]);
  bones[MX.hips].updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(names.map((n) => bones[n])));

  // ---- animated / glowing attachments ----
  const extras = [];
  const headBone = bones[MX.head];
  const headLocal = headBone.worldToLocal(hc.clone());
  if (arch.hair === 'flame') extras.push(makeFlameHair(headBone, headLocal, hr, H));
  if (arch.gear.includes('xrayGoggles')) extras.push(makeGlowLenses(headBone, headLocal, hr, H, P.glow));
  if (arch.gear.includes('lightningBoots')) {
    for (const S of ['L', 'R']) extras.push(makeBootGlow(bones[MX[S].leg], W(MX[S].leg).distanceTo(W(MX[S].foot)), H, P.glow));
  }

  // cape pins along the collarbones, just behind the shoulders (Spine2-local)
  const chest = bones[MX.spine2];
  const pins = [];
  const capeCols = 7;
  for (let i = 0; i < capeCols; i++) {
    const k = i / (capeCols - 1) - 0.5;
    const wpt = new THREE.Vector3(k * shoulderX * 1.35, shoulderY + 0.012 * H, -rzP(0.86) * 0.85);
    pins.push(chest.worldToLocal(wpt));
  }

  return {
    mesh, bones, extras, pins,
    H, hipsYOffset,
    torsoRadius: rxP(0.72) * 1.05,
    capeWidth: shoulderX * 1.35 * 2,
  };
}

// ---------------------------------------------------------------------------
// hair
// ---------------------------------------------------------------------------
function addHair(B, style, P, hc, hr, H, w) {
  const col = P.hair;
  const cap = (yMin, thick, opts = {}) => B.sphere({
    center: hc, radii: hr.clone().multiplyScalar(1 + thick), wSeg: 20, hSeg: 12, color: col, weights: w,
    filter: (n) => n.y > yMin && !(n.z > 0.42 && n.y < (opts.fringe ?? 0.5)) && !(opts.flatTop && n.y > 0.985),
    displace: opts.displace,
  });
  switch (style) {
    case 'surfer':
      cap(-0.25, 0.09, { fringe: 0.35, displace: (n) => 0.05 * Math.sin(n.x * 14 + n.y * 9) * Math.sin(n.z * 11) });
      for (const [x, z] of [[-0.85, 0.1], [0.85, 0.1], [-0.6, -0.65], [0.6, -0.65], [0, -0.95], [-0.95, -0.35], [0.95, -0.35]]) {
        B.sphere({ center: new THREE.Vector3(hc.x + x * hr.x * 1.05, hc.y - 0.035 * H, hc.z + z * hr.z * 1.05),
          radii: new THREE.Vector3(0.012 * H, 0.05 * H, 0.016 * H), wSeg: 7, hSeg: 6, color: col, weights: w });
      }
      break;
    case 'spiky':
      cap(0.02, 0.05);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        const dir = new THREE.Vector3(Math.cos(a) * 0.33, 1, Math.sin(a) * 0.28 - 0.15).normalize();
        const base = hc.clone().add(new THREE.Vector3(dir.x * hr.x, dir.y * hr.y, dir.z * hr.z));
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        B.cone({ center: base.clone().addScaledVector(dir, 0.028 * H), radius: 0.016 * H, height: 0.065 * H, color: col, weights: w, rot: q, segs: 6 });
      }
      break;
    case 'quiff': {
      cap(-0.05, 0.06, { fringe: 0.45 });
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0.35, 0.25));
      B.sphere({ center: hc.clone().add(new THREE.Vector3(0.012 * H, hr.y * 0.98, hr.z * 0.25)), radii: new THREE.Vector3(0.055 * H, 0.026 * H, 0.048 * H), wSeg: 12, hSeg: 8, color: col, weights: w,
        displace: (n) => 0.08 * Math.sin(n.x * 9) * Math.sin(n.z * 7) });
      if (P.hairStreak) {
        B.box({ center: hc.clone().add(new THREE.Vector3(0.03 * H, hr.y * 1.03, hr.z * 0.3)), size: new THREE.Vector3(0.016 * H, 0.03 * H, 0.06 * H), color: P.hairStreak, weights: w, rot: q });
      }
      break;
    }
    case 'flame':
      cap(0.1, 0.05);
      break;
    case 'mohawk': {
      const n = 9;
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1);
        const z = (0.75 - 1.5 * k) * hr.z;
        const ySurf = Math.sqrt(Math.max(0, 1 - (z / hr.z) ** 2)) * hr.y;
        const h = (0.075 + 0.03 * Math.sin(k * Math.PI)) * H;
        B.box({ center: hc.clone().add(new THREE.Vector3(0, ySurf + h / 2 - 0.006 * H, z)), size: new THREE.Vector3(0.018 * H, h, hr.z * 1.5 / n * 1.15), color: col, weights: w,
          rot: new THREE.Quaternion().setFromEuler(new THREE.Euler((k - 0.5) * 0.8, 0, 0)) });
      }
      break;
    }
    case 'buzz':
      cap(0.05, 0.02);
      break;
    case 'sidepart':
      cap(-0.02, 0.05, { fringe: 0.4, displace: (n) => (n.x > 0.15 ? 0.05 : 0) });
      B.box({ center: hc.clone().add(new THREE.Vector3(0.02 * H, hr.y * 1.04, 0)), size: new THREE.Vector3(0.004 * H, 0.004 * H, hr.z * 1.1), color: col.clone().multiplyScalar(0.55), weights: w });
      break;
    case 'crew':
      cap(0.15, 0.035, { flatTop: true });
      break;
    default:
      break;
  }
}

function addFacialHair(B, style, P, hc, hr, H, w) {
  const col = P.hair.clone().multiplyScalar(0.9);
  if (style === 'goatee' || style === 'stubbleGoatee') {
    const c = style === 'goatee' ? col : P.skin.clone().lerp(new THREE.Color(0x2a2420), 0.55);
    B.box({ center: hc.clone().add(new THREE.Vector3(0, -0.062 * H, hr.z * 0.82)), size: new THREE.Vector3(0.028 * H, 0.03 * H, 0.016 * H), color: c, weights: w });
    B.box({ center: hc.clone().add(new THREE.Vector3(0, -0.033 * H, hr.z * 0.95)), size: new THREE.Vector3(0.034 * H, 0.006 * H, 0.008 * H), color: c, weights: w });
  } else if (style === 'fullBeard') {
    B.sphere({
      center: hc.clone().add(new THREE.Vector3(0, -0.012 * H, 0.004 * H)), radii: new THREE.Vector3(hr.x * 1.06, hr.y * 1.02, hr.z * 1.08), wSeg: 18, hSeg: 12, color: col, weights: w,
      filter: (n) => n.y < -0.28 && n.z > -0.1 && !(n.z > 0.75 && n.y > -0.5),
      displace: (n) => 0.06 * Math.sin(n.x * 15) * Math.sin(n.y * 12) + 0.1 * clamp01(-n.y - 0.6),
    });
  }
}

// ---------------------------------------------------------------------------
// gear (merged)
// ---------------------------------------------------------------------------
function addGear(B, kind, P, hc, hr, H, w) {
  const dark = new THREE.Color(0x14161c);
  const eyeY = hc.y + 0.012 * H;
  const strap = (y, thick, color) => B.tube({
    from: new THREE.Vector3(hc.x, y - thick / 2, hc.z), to: new THREE.Vector3(hc.x, y + thick / 2, hc.z),
    rings: 2, segs: 18, frame: { u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 0, 1) },
    radius: () => ({ rx: hr.x * 1.06, rz: hr.z * 1.06 }), color: () => color, weights: () => w,
  });
  const at = (dx, dy, dz) => new THREE.Vector3(hc.x + dx, hc.y + dy, hc.z + dz);
  switch (kind) {
    case 'aviatorGoggles': {
      strap(eyeY, 0.02 * H, new THREE.Color(0x5a4630));
      for (const s of [-1, 1]) {
        const c = at(s * 0.03 * H, 0.012 * H, hr.z * 0.98);
        B.sphere({ center: c, radii: new THREE.Vector3(0.026 * H, 0.02 * H, 0.012 * H), wSeg: 12, hSeg: 6, color: new THREE.Color(0x8a7a55), weights: w });
        B.sphere({ center: c.clone().add(new THREE.Vector3(0, 0, 0.006 * H)), radii: new THREE.Vector3(0.02 * H, 0.015 * H, 0.01 * H), wSeg: 12, hSeg: 6, color: new THREE.Color(0x2c4a6e), weights: w });
      }
      break;
    }
    case 'speedShades':
      B.box({ center: at(0, 0.012 * H, hr.z * 0.95), size: new THREE.Vector3(0.11 * H, 0.02 * H, 0.014 * H), color: new THREE.Color(0x3a0d12), weights: w });
      for (const s of [-1, 1]) B.box({ center: at(s * hr.x * 0.95, 0.012 * H, hr.z * 0.3), size: new THREE.Vector3(0.006 * H, 0.008 * H, hr.z * 1.3), color: dark, weights: w });
      break;
    case 'facelessMask':
      strap(hc.y - 0.06 * H, 0.006 * H, P.secondary);
      break;
    case 'robinMask': {
      B.box({ center: at(0, 0.012 * H, hr.z * 0.93), size: new THREE.Vector3(0.1 * H, 0.03 * H, 0.012 * H), color: dark, weights: w });
      for (const s of [-1, 1]) {
        B.box({ center: at(s * 0.058 * H, 0.026 * H, hr.z * 0.72), size: new THREE.Vector3(0.026 * H, 0.014 * H, 0.012 * H), color: dark, weights: w,
          rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s * 0.6, s * 0.5)) });
        B.sphere({ center: at(s * 0.028 * H, 0.012 * H, hr.z * 0.99), radii: new THREE.Vector3(0.011 * H, 0.006 * H, 0.004 * H), wSeg: 8, hSeg: 4, color: new THREE.Color(0xf2f2f2), weights: w });
      }
      break;
    }
    case 'baneMask': {
      const mc = new THREE.Color(0x3a3f4a);
      B.sphere({ center: at(0, -0.01 * H, 0.006 * H), radii: new THREE.Vector3(hr.x * 1.1, hr.y * 1.05, hr.z * 1.12), wSeg: 18, hSeg: 12, color: mc, weights: w,
        filter: (n) => n.y < -0.12 && n.z > 0.05 && !(n.y < -0.9) });
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          B.box({ center: at(s * (0.02 + i * 0.018) * H, -0.045 * H, hr.z * 0.95 - i * 0.008 * H), size: new THREE.Vector3(0.01 * H, 0.03 * H, 0.012 * H), color: new THREE.Color(0x8a93a3), weights: w });
        }
        B.box({ center: at(s * hr.x * 0.9, -0.03 * H, hr.z * 0.45), size: new THREE.Vector3(0.012 * H, 0.012 * H, 0.06 * H), color: mc.clone().multiplyScalar(0.7), weights: w });
      }
      break;
    }
    case 'bandana': {
      strap(eyeY, 0.032 * H, P.accent);
      B.sphere({ center: at(0, 0.012 * H, -hr.z * 1.02), radii: new THREE.Vector3(0.016 * H, 0.014 * H, 0.014 * H), wSeg: 8, hSeg: 6, color: P.accent, weights: w });
      for (const s of [-1, 1]) {
        B.box({ center: at(s * 0.018 * H, -0.033 * H, -hr.z * 1.05), size: new THREE.Vector3(0.018 * H, 0.08 * H, 0.004 * H), color: P.accent, weights: w,
          rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0, s * 0.25)) });
      }
      for (const s of [-1, 1]) B.box({ center: at(s * 0.028 * H, 0.012 * H, hr.z * 1.08), size: new THREE.Vector3(0.026 * H, 0.006 * H, 0.004 * H), color: dark, weights: w });
      break;
    }
    case 'xrayGoggles':
      strap(eyeY, 0.016 * H, dark);
      for (const s of [-1, 1]) {
        B.sphere({ center: at(s * 0.03 * H, 0.012 * H, hr.z * 0.97), radii: new THREE.Vector3(0.024 * H, 0.024 * H, 0.014 * H), wSeg: 12, hSeg: 6, color: new THREE.Color(0x2a2f2a), weights: w });
      }
      break;
    case 'sunglasses':
      B.box({ center: at(0, 0.012 * H, hr.z * 0.96), size: new THREE.Vector3(0.096 * H, 0.022 * H, 0.012 * H), color: dark, weights: w });
      for (const s of [-1, 1]) B.box({ center: at(s * hr.x * 0.96, 0.016 * H, hr.z * 0.3), size: new THREE.Vector3(0.005 * H, 0.006 * H, hr.z * 1.3), color: dark, weights: w });
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// emblems (chest bone)
// ---------------------------------------------------------------------------
function addEmblem(B, arch, P, chestY, rzChest, H, boneName) {
  const w = [[boneName, 1]];
  const z = rzChest + 0.016 * H;
  const y = chestY + 0.05 * H;
  const c = P.accent;
  const box = (dx, dy, sx, sy, rz = 0, col = c) => B.box({
    center: new THREE.Vector3(dx, y + dy, z), size: new THREE.Vector3(sx, sy, 0.008 * H), color: col, weights: w,
    rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)),
  });
  switch (arch.suit) {
    case 'flight': box(-0.03 * H, 0, 0.05 * H, 0.012 * H, 0.35); box(0.03 * H, 0, 0.05 * H, 0.012 * H, -0.35); break;
    case 'speed': box(-0.008 * H, 0.012 * H, 0.014 * H, 0.03 * H, 0.5); box(0.008 * H, -0.012 * H, 0.014 * H, 0.03 * H, 0.5); break;
    case 'telekinesis':
      B.sphere({ center: new THREE.Vector3(0, y, z), radii: new THREE.Vector3(0.026 * H, 0.018 * H, 0.005 * H), wSeg: 12, hSeg: 6, color: c, weights: w });
      B.sphere({ center: new THREE.Vector3(0, y, z + 0.004 * H), radii: new THREE.Vector3(0.009 * H, 0.009 * H, 0.004 * H), wSeg: 8, hSeg: 5, color: P.glow, weights: w });
      break;
    case 'pyro': B.cone({ center: new THREE.Vector3(0, y + 0.006 * H, z), radius: 0.02 * H, height: 0.045 * H, color: c, weights: w, segs: 6 }); break;
    case 'cryo': for (let i = 0; i < 3; i++) box(0, 0, 0.05 * H, 0.007 * H, i * Math.PI / 3); break;
    case 'teleport': B.sphere({ center: new THREE.Vector3(0, y, z), radii: new THREE.Vector3(0.024 * H, 0.024 * H, 0.005 * H), wSeg: 12, hSeg: 6, color: c, weights: w }); break;
    case 'xray': B.sphere({ center: new THREE.Vector3(0, y, z), radii: new THREE.Vector3(0.028 * H, 0.014 * H, 0.005 * H), wSeg: 12, hSeg: 6, color: c, weights: w }); break;
    case 'shapeshift': box(0, 0, 0.028 * H, 0.028 * H, Math.PI / 4); break;
    case 'duplication': box(-0.014 * H, 0, 0.012 * H, 0.04 * H); box(0.014 * H, 0, 0.012 * H, 0.04 * H); break;
    default: break;
  }
}

// ---------------------------------------------------------------------------
// animated / glowing attachments (parented to bones; positions are bone-local)
// ---------------------------------------------------------------------------
function makeFlameHair(headBone, hl, hr, H) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.95 });
  const mat2 = new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.9 });
  const flames = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const x = Math.cos(a) * hr.x * 0.55, z = Math.sin(a) * hr.z * 0.5 - hr.z * 0.15;
    const ySurf = Math.sqrt(Math.max(0, 1 - (x / hr.x) ** 2 - (z / hr.z) ** 2)) * hr.y;
    const h = (0.07 + 0.04 * Math.random()) * H;
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.018 * H, h, 5), i % 3 === 0 ? mat2 : mat);
    m.position.set(hl.x + x, hl.y + ySurf + h / 2 - 0.01 * H, hl.z + z);
    m.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
    m.userData.base = { rx: m.rotation.x, rz: m.rotation.z };
    g.add(m);
    flames.push(m);
  }
  headBone.add(g);
  g.userData.animate = (t) => {
    for (let i = 0; i < flames.length; i++) {
      const f = flames[i], b = f.userData.base;
      f.scale.y = 0.85 + 0.35 * Math.sin(t * 9 + i * 1.7);
      f.rotation.x = b.rx + Math.sin(t * 7 + i) * 0.15;
      f.rotation.z = b.rz + Math.cos(t * 6 + i * 2) * 0.15;
    }
  };
  return g;
}

function makeGlowLenses(headBone, hl, hr, H, glow) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: glow });
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.017 * H, 12), mat);
    m.position.set(hl.x + s * 0.03 * H, hl.y + 0.012 * H, hl.z + hr.z * 0.97 + 0.015 * H);
    g.add(m);
  }
  headBone.add(g);
  g.userData.animate = (t) => { g.scale.setScalar(1 + 0.05 * Math.sin(t * 8)); };
  return g;
}

function makeBootGlow(shinBone, shinLen, H, glow) {
  const mat = new THREE.MeshBasicMaterial({ color: glow });
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.014 * H, 0.006 * H, 0.012 * H), mat);
    // shin bone's +Y runs down the shin; the front of the shin is local +Z
    m.position.set((i - 1) * 0.008 * H, shinLen * (0.55 + i * 0.1), 0.036 * H);
    m.rotation.z = 0.5;
    g.add(m);
  }
  shinBone.add(g);
  return g;
}
