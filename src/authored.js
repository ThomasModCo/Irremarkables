// Authored (modelled) assets for the reskin.
//
// Models ship as `.json` files so they pass the host's file-type filter:
//   { "kind": "hero" | "prop", "joints": {...}, "meta": {...}, "gltf": <embedded glTF 2.0 JSON> }
// The glTF has its buffers and textures inlined as data URIs.
//
// Heroes are re-bound to the game's own Mixamo skeleton (built from
// anims.json) by bone *name*, so every baked clip keeps working. Only the
// joint offsets come from the model (fitted to its proportions); the rest
// rotations are the Mixamo ones the clips were baked against.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ANIM } from './animlib.js';
import { gradientMap, RIM_GLSL, HERO_BANDS } from './toon.js';

export const AUTHORED = { heroes: {}, props: {} };
if (typeof window !== 'undefined') window.__authored = AUTHORED;   // test / debug hook

// which archetypes / props have a modelled replacement
// #meshy in the URL swaps in the Meshy-built Flight hero for A/B comparison
const USE_MESHY = typeof location !== 'undefined' && /meshy/.test(location.search + location.hash);
const MANIFEST = {
  heroes: {
    flight: USE_MESHY ? 'models/hero-flight-meshy.json' : 'models/hero-flight.json',
    pyro: 'models/hero-pyro.json',
    speed: 'models/hero-speed.json', invisibility: 'models/hero-invisibility.json',
    telekinesis: 'models/hero-telekinesis.json', cryo: 'models/hero-cryo.json',
    teleport: 'models/hero-teleport.json', xray: 'models/hero-xray.json',
    shapeshift: 'models/hero-shapeshift.json', duplication: 'models/hero-duplication.json',
  },
  props: {
    car: 'models/prop-car.json', 'house-bungalow': 'models/house-bungalow.json',
    'tree-round': 'models/prop-tree-round.json', 'tree-tall': 'models/prop-tree-tall.json',
    bush: 'models/prop-bush.json', bin: 'models/prop-bin.json', bench: 'models/prop-bench.json',
    lamppost: 'models/prop-lamppost.json', hydrant: 'models/prop-hydrant.json',
    'house-two-storey': 'models/house-two-storey.json', 'house-ranch': 'models/house-ranch.json',
    'house-modern': 'models/house-modern.json', 'house-cottage': 'models/house-cottage.json',
    shed: 'models/prop-shed.json', mailbox: 'models/prop-mailbox.json', fence: 'models/prop-fence.json',
    hedge: 'models/prop-hedge.json', flowers: 'models/prop-flowers.json', fountain: 'models/prop-fountain.json',
    planter: 'models/prop-planter.json', watertower: 'models/prop-watertower.json', acunit: 'models/prop-acunit.json',
    token: 'models/col-token.json', pill: 'models/col-pill.json', potion: 'models/col-potion.json',
  },
};

// ?models=0 keeps the procedural originals (for comparison)
const ENABLED = typeof location === 'undefined' || !/[?&]models=0\b|original/.test(location.search + location.hash);

const loader = new GLTFLoader();

// Hosts with a strict Content-Security-Policy (connect-src 'self') refuse
// fetch() on data: URIs, which is how GLTFLoader reads inlined buffers and
// textures. So unpack them here instead: buffers are decoded with atob and
// re-wrapped as an in-memory GLB, textures are decoded through an <img>
// (img-src data: is allowed). No network or data: fetch is ever made.
function b64bytes(uri) {
  const bin = atob(uri.slice(uri.indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function loadImageTexture(uri) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.flipY = false; // glTF UV convention
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
      res(t);
    };
    img.onerror = rej;
    img.src = uri;
  });
}
async function parse(gltfIn, dir = '') {
  const gltf = JSON.parse(JSON.stringify(gltfIn));
  // pull the first texture out; we apply it ourselves
  // embedded (data:) or a sibling image file next to the pack (models/tex/*.webp)
  let imgUri = (gltf.images || []).map((i) => i.uri).find((u) => u);
  if (imgUri && !imgUri.startsWith('data:')) imgUri = dir + imgUri;
  delete gltf.images; delete gltf.textures; delete gltf.samplers;
  for (const m of gltf.materials || []) {
    if (m.pbrMetallicRoughness) {
      delete m.pbrMetallicRoughness.baseColorTexture;
      delete m.pbrMetallicRoughness.metallicRoughnessTexture;
    }
    delete m.normalTexture; delete m.occlusionTexture; delete m.emissiveTexture;
  }
  // single binary buffer -> GLB BIN chunk
  const bin = b64bytes(gltf.buffers[0].uri);
  const binLen = (bin.length + 3) & ~3;
  gltf.buffers = [{ byteLength: bin.length }];
  const json = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonLen = (json.length + 3) & ~3;
  const total = 12 + 8 + jsonLen + 8 + binLen;
  const buf = new ArrayBuffer(total);
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jsonLen, true); dv.setUint32(16, 0x4e4f534a, true);
  u8.fill(0x20, 20, 20 + jsonLen); u8.set(json, 20);
  const o = 20 + jsonLen;
  dv.setUint32(o, binLen, true); dv.setUint32(o + 4, 0x004e4942, true);
  u8.set(bin, o + 8);
  const [parsed, map] = await Promise.all([
    new Promise((res, rej) => loader.parse(buf, '', res, rej)),
    imgUri ? loadImageTexture(imgUri) : Promise.resolve(null),
  ]);
  parsed.userData.map = map;
  return parsed;
}

// Heroes other than the eager ones stream in after the game starts; anything
// already on screen with that look is rebuilt when its model arrives.
const heroListeners = [];
export function onAuthoredHero(cb) { heroListeners.push(cb); }

async function loadOne(group, id, path, base) {
  try {
    const r = await fetch(base + path);
    if (r.status === 404) return; // not built yet: keep the procedural version quietly
    if (!r.ok) throw new Error(r.status);
    const pack = await r.json();
    const gltf = await parse(pack.gltf, (base + path).replace(/[^/]*$/, ''));
    AUTHORED[group][id] = group === 'heroes' ? prepHero(pack, gltf) : prepProp(pack, gltf);
    if (group === 'heroes') for (const cb of heroListeners) cb(id);
  } catch (e) {
    console.error('authored asset failed, using procedural', id, e);
  }
}

export async function loadAuthored(base = './', { eagerHeroes = ['flight'] } = {}) {
  if (!ENABLED) return;
  const now = [];
  for (const [id, path] of Object.entries(MANIFEST.props)) now.push(loadOne('props', id, path, base));
  for (const id of eagerHeroes) if (MANIFEST.heroes[id]) now.push(loadOne('heroes', id, MANIFEST.heroes[id], base));
  await Promise.all(now);
  // the rest load in the background, two at a time to keep the main thread smooth
  const rest = Object.keys(MANIFEST.heroes).filter((id) => !eagerHeroes.includes(id));
  (async () => {
    for (let i = 0; i < rest.length; i += 2) {
      await Promise.all(rest.slice(i, i + 2).map((id) => loadOne('heroes', id, MANIFEST.heroes[id], base)));
    }
  })();
}

// ---------------------------------------------------------------------------
// recolour: hue-keyed tint so one texture serves every spawned instance.
// Texels near `keyHue` are hue-rotated by uShift (suit variation); texels in
// the skin range are re-toned toward the instance skin colour.
// ---------------------------------------------------------------------------
const RECOLOR_GLSL = /* glsl */`
uniform float uKeyHue, uKeyWidth, uShift, uLight, uSkinOn, uSkinHue;
uniform vec3 uSkinFrom, uSkinTo;
uniform vec3 uTarget; uniform float uTargetOn;
uniform float uKey2Hue, uKey2Width, uTarget2On, uSatLo; uniform vec3 uTarget2;
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
// all keying happens in sRGB, where the texture was measured and authored
vec3 toS(vec3 c){ return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }
vec3 toL(vec3 c){ return pow(max(c, vec3(0.0)), vec3(2.2)); }
vec3 recolor(vec3 cl){
  vec3 c = toS(cl);
  vec3 h = rgb2hsv(c);
  float dh = abs(fract(h.x - uKeyHue + 0.5) - 0.5);
  float key = (1.0 - smoothstep(uKeyWidth * 0.7, uKeyWidth, dh)) * smoothstep(uSatLo, uSatLo + 0.12, h.y);
  if (key > 0.0) {
    vec3 t;
    if (uTargetOn > 0.5) {
      // paint to an absolute colour, keeping the texel's relative shading
      vec3 th = rgb2hsv(toS(uTarget));
      float rel = h.z / max(0.05, KEY_V);
      t = hsv2rgb(vec3(th.x, th.y, clamp(th.z * rel, 0.0, 1.0)));
    } else {
      t = hsv2rgb(vec3(fract(h.x + uShift), h.y, clamp(h.z * (1.0 + uLight), 0.0, 1.0)));
    }
    c = mix(c, t, key);
  }
  if (uTarget2On > 0.5) {
    // second paint key (e.g. roof): same absolute repaint as the first
    vec3 h2 = rgb2hsv(c);
    float d2 = abs(fract(h2.x - uKey2Hue + 0.5) - 0.5);
    float k2 = (1.0 - smoothstep(uKey2Width * 0.7, uKey2Width, d2)) * smoothstep(0.18, 0.35, h2.y) * (1.0 - key);
    if (k2 > 0.0) {
      vec3 th = rgb2hsv(toS(uTarget2));
      float rel = h2.z / max(0.05, KEY2_V);
      c = mix(c, hsv2rgb(vec3(th.x, th.y, clamp(th.z * rel, 0.0, 1.0))), k2);
    }
  }
  if (uSkinOn > 0.5) {
    float sk = (1.0 - smoothstep(0.025, 0.045, abs(fract(h.x - uSkinHue + 0.5) - 0.5))) * smoothstep(0.12, 0.2, h.y) * (1.0 - smoothstep(0.62, 0.75, h.y)) * smoothstep(0.35, 0.5, h.z);
    if (sk > 0.0) c = mix(c, c / max(toS(uSkinFrom), vec3(0.05)) * toS(uSkinTo), sk);
  }
  return toL(c);
}`;

function recolorMaterial(map, opts) {
  const m = new THREE.MeshToonMaterial({ map, gradientMap: gradientMap(opts.bands || null) });
  const keyV = opts.keyV ?? 0.75;
  const key2V = opts.key2V ?? 0.6;
  m.userData.recolor = {
    uKeyHue: { value: opts.keyHue }, uKeyWidth: { value: opts.keyWidth ?? 0.09 },
    uShift: { value: 0 }, uLight: { value: 0 },
    uSkinOn: { value: opts.skin ? 1 : 0 }, uSkinHue: { value: opts.skinHue ?? 0.054 },
    uSkinFrom: { value: new THREE.Color(opts.skinFrom ?? 0xe8b48e) }, uSkinTo: { value: new THREE.Color(0xe8b48e) },
    uTarget: { value: new THREE.Color() }, uTargetOn: { value: 0 },
    uSatLo: { value: opts.satLo ?? 0.18 },
    uKey2Hue: { value: opts.key2Hue ?? 0 }, uKey2Width: { value: opts.key2Width ?? 0.05 },
    uTarget2: { value: new THREE.Color() }, uTarget2On: { value: 0 },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.recolor);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n#define KEY_V ' + keyV.toFixed(3) + '\n#define KEY2_V ' + key2V.toFixed(3) + '\n' + RECOLOR_GLSL)
      .replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.rgb = recolor(diffuseColor.rgb);`)
      .replace('#include <opaque_fragment>', '#define RIM_STRENGTH ' + (opts.rim ?? 0.0).toFixed(2) + '\n' + RIM_GLSL);
  };
  m.customProgramCacheKey = () => 'recolor-' + keyV.toFixed(3) + '-' + key2V.toFixed(3) + '-' + (opts.rim ?? 0);
  return m;
}

function firstTexture(gltf) {
  return gltf.userData.map || null;
}

// ---------------------------------------------------------------------------
// heroes
// ---------------------------------------------------------------------------
const HERO_LOD_DIST = 18; // m
const _lodV = new THREE.Vector3();

function prepHero(pack, gltf) {
  let src = null;
  gltf.scene.traverse((o) => { if (!src && o.isSkinnedMesh) src = o; });
  if (!src) throw new Error('no skinned mesh');
  const geo = src.geometry;
  for (const k of ['normal', 'uv', 'skinWeight']) if (geo.attributes[k]) geo.setAttribute(k, toFloatAttr(geo.attributes[k]));
  // remap glTF joint indices -> our bone order
  const names = ANIM.bones.concat(['mixamorigHeadTop_End', 'mixamorigLeftToe_End', 'mixamorigRightToe_End']);
  const ours = Object.fromEntries(names.map((n, i) => [n, i]));
  const jointNames = src.skeleton.bones.map((b) => b.name.replace(/[^A-Za-z0-9_]/g, ''));
  const si = geo.attributes.skinIndex;
  const out = new Uint16Array(si.count * 4);
  for (let i = 0; i < si.count * 4; i++) out[i] = ours[jointNames[si.array[i]]] ?? 0;
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(out, 4));
  smoothShadingNormals(geo, 6);
  geo.computeBoundingBox();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, ANIM.unitHeight * 0.3, 0), ANIM.unitHeight * 1.4);
  geo.dispose = () => {}; // shared by every instance: never free it per hero
  // far LOD: a pre-simplified index over the same vertices (no extra vertex data)
  let geoLod = null;
  if (pack.lod && geo.index) {
    const bin = atob(pack.lod.index), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const arr = pack.lod.u32 ? new Uint32Array(bytes.buffer) : new Uint16Array(bytes.buffer);
    geoLod = new THREE.BufferGeometry();
    for (const [k, v] of Object.entries(geo.attributes)) geoLod.setAttribute(k, v);
    geoLod.setIndex(new THREE.BufferAttribute(arr, 1));
    geoLod.boundingBox = geo.boundingBox; geoLod.boundingSphere = geo.boundingSphere;
    geoLod.dispose = () => {};
  }
  return { geo, geoLod, map: firstTexture(gltf), joints: pack.joints, meta: pack.meta || {}, names };
}

// AI meshes have lumpy surfaces; with hard toon bands every lump becomes a
// dark blotch. Averaging normals over neighbours a few times gives the large,
// clean light shapes cel-shaded characters need (geometry is untouched).
function smoothShadingNormals(geo, iterations) {
  const pos = geo.attributes.position, nrm = geo.attributes.normal, idx = geo.index;
  if (!nrm || !idx) return;
  const n = pos.count;
  // weld by position so seams share normals
  const key = (i) => `${Math.round(pos.getX(i) * 100)},${Math.round(pos.getY(i) * 100)},${Math.round(pos.getZ(i) * 100)}`;
  const weld = new Int32Array(n); const map = new Map(); let m = 0;
  for (let i = 0; i < n; i++) { const k = key(i); let w = map.get(k); if (w === undefined) { w = m++; map.set(k, w); } weld[i] = w; }
  const nb = Array.from({ length: m }, () => new Set());
  const a = idx.array;
  for (let t = 0; t < a.length; t += 3) {
    const x = weld[a[t]], y = weld[a[t + 1]], z = weld[a[t + 2]];
    nb[x].add(y); nb[x].add(z); nb[y].add(x); nb[y].add(z); nb[z].add(x); nb[z].add(y);
  }
  let cur = new Float32Array(m * 3);
  for (let i = 0; i < n; i++) { const w = weld[i] * 3; cur[w] += nrm.getX(i); cur[w + 1] += nrm.getY(i); cur[w + 2] += nrm.getZ(i); }
  for (let it = 0; it < iterations; it++) {
    const nx = new Float32Array(m * 3);
    for (let v = 0; v < m; v++) {
      let x = cur[v * 3], y = cur[v * 3 + 1], z = cur[v * 3 + 2];
      for (const u of nb[v]) { x += cur[u * 3]; y += cur[u * 3 + 1]; z += cur[u * 3 + 2]; }
      const l = Math.hypot(x, y, z) || 1;
      nx[v * 3] = x / l; nx[v * 3 + 1] = y / l; nx[v * 3 + 2] = z / l;
    }
    cur = nx;
  }
  for (let i = 0; i < n; i++) { const w = weld[i] * 3; nrm.setXYZ(i, cur[w], cur[w + 1], cur[w + 2]); }
  nrm.needsUpdate = true;
}

const _q = new THREE.Quaternion();
export function buildAuthoredRig(arch, P, asset) {
  const { geo, geoLod, map, joints, meta, names } = asset;
  const S = ANIM.skeleton;
  // rest world rotations straight from the Mixamo bind pose
  const restWorldQ = {};
  const rq = (n) => {
    if (restWorldQ[n]) return restWorldQ[n];
    const s = S[n];
    const q = new THREE.Quaternion().fromArray(s.quat);
    restWorldQ[n] = s.parent ? rq(s.parent).clone().multiply(q) : q;
    return restWorldQ[n];
  };
  const bones = {};
  for (const n of names) {
    const s = S[n];
    const b = new THREE.Bone();
    b.name = n;
    b.quaternion.fromArray(s.quat);
    const J = Array.isArray(joints[n]) ? new THREE.Vector3().fromArray(joints[n]) : null;
    if (J && s.parent && joints[s.parent]) {
      // local offset = inverse(parent rest world rot) * (J - Jparent)
      const d = J.clone().sub(new THREE.Vector3().fromArray(joints[s.parent]));
      _q.copy(rq(s.parent)).invert();
      b.position.copy(d.applyQuaternion(_q));
    } else if (J) {
      b.position.copy(J);
    } else {
      b.position.fromArray(s.pos);
    }
    b.userData.restQuat = b.quaternion.clone();
    b.userData.restPos = b.position.clone();
    bones[n] = b;
  }
  for (const n of names) {
    const p = S[n].parent;
    if (p && bones[p]) bones[p].add(bones[n]);
  }
  const mat = recolorMaterial(map, { keyHue: meta.suitHue ?? 0.62, keyWidth: meta.suitHueWidth ?? 0.07, keyV: meta.suitV ?? 0.75, skin: !!meta.skinRecolor, skinFrom: meta.skinFrom, skinHue: meta.skinHue, rim: 0, bands: HERO_BANDS, satLo: meta.satLo });
  // per-instance variation (same maths as instancePalette)
  const base = new THREE.Color(arch.palette.primary), hb = {}, hp = {};
  base.getHSL(hb); P.primary.getHSL(hp);
  mat.userData.recolor.uShift.value = hp.h - hb.h;
  mat.userData.recolor.uLight.value = (hp.l - hb.l) * 1.5;
  mat.userData.recolor.uSkinTo.value.copy(P.skin);

  const mesh = new THREE.SkinnedMesh(geo, mat);
  mesh.add(bones.mixamorigHips);
  bones.mixamorigHips.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(names.map((n) => bones[n])));
  mesh.userData.authored = true;
  if (geoLod) {
    // swap to the ~25% index beyond HERO_LOD_DIST (takes effect next frame;
    // shadow cameras are orthographic and ignored so passes don't fight)
    mesh.onBeforeRender = (r, s, cam) => {
      if (!cam.isPerspectiveCamera) return;
      const far = _lodV.setFromMatrixPosition(mesh.matrixWorld).distanceToSquared(cam.position) > HERO_LOD_DIST * HERO_LOD_DIST;
      const g = far ? geoLod : geo;
      if (mesh.geometry === g) return;
      const on = geo.attributes.outlineNormal || geoLod.attributes.outlineNormal;
      if (on) { geo.attributes.outlineNormal = on; geoLod.attributes.outlineNormal = on; }
      mesh.geometry = g;
      const o = mesh.userData.outline;
      if (o) o.geometry = g;
    };
  }

  // cape pins + torso size measured from the mesh (Mixamo units)
  const W = (n) => new THREE.Vector3().setFromMatrixPosition(bones[n].matrixWorld);
  const armL = W('mixamorigLeftArm'), armR = W('mixamorigRightArm');
  const shoulderX = Math.abs(armL.x - armR.x) / 2;
  const shoulderY = (armL.y + armR.y) / 2;
  const back = meta.backZ ?? -1.6;
  const torsoHalfW = meta.torsoHalfW ?? shoulderX * 0.9;
  const chest = bones.mixamorigSpine2;
  const pins = [];
  for (let i = 0; i < 7; i++) {
    const k = i / 6 - 0.5;
    pins.push(chest.worldToLocal(new THREE.Vector3(k * shoulderX * 1.35, shoulderY + 0.35, back * 0.92)));
  }
  return {
    mesh, bones, extras: [], pins,
    H: ANIM.unitHeight, hipsYOffset: joints._hipsYOffset || 0,
    torsoRadius: torsoHalfW * 1.05,
    capeWidth: shoulderX * 1.35 * 2,
  };
}

// ---------------------------------------------------------------------------
// props (static meshes, one shared geometry, per-instance paint)
// ---------------------------------------------------------------------------
// quantized (KHR_mesh_quantization) attributes are normalized ints; turn
// them back into plain floats before we bake transforms or edit them
function toFloatAttr(attr) {
  if (!attr || (attr.array instanceof Float32Array && !attr.normalized && !attr.isInterleavedBufferAttribute)) return attr;
  const n = attr.count, s = attr.itemSize, out = new Float32Array(n * s);
  const get = [attr.getX, attr.getY, attr.getZ, attr.getW];
  for (let i = 0; i < n; i++) for (let k = 0; k < s; k++) out[i * s + k] = get[k].call(attr, i);
  return new THREE.BufferAttribute(out, s);
}

function prepProp(pack, gltf) {
  const geos = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (o.isMesh) {
      const g = o.geometry.clone();
      for (const k of ['position', 'normal', 'uv']) if (g.attributes[k]) g.setAttribute(k, toFloatAttr(g.attributes[k]));
      g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      geos.push(g);
    }
  });
  const geo = geos[0];
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  geo.dispose = () => {};
  return { geo, map: firstTexture(gltf), meta: pack.meta || {} };
}

export function hasAuthoredProp(id) { return !!AUTHORED.props[id]; }

export function makeAuthoredProp(id, paint, paint2) {
  const a = AUTHORED.props[id];
  if (!a) return null;
  const M = a.meta;
  const m = recolorMaterial(a.map, { keyHue: M.keyHue ?? 0.98, keyWidth: M.keyWidth ?? 0.06, keyV: M.keyV ?? 0.75,
    key2Hue: M.key2Hue, key2Width: M.key2Width, key2V: M.key2V, satLo: M.satLo, rim: M.rim ?? 0 });
  if (paint != null) {
    m.userData.recolor.uTarget.value.set(paint);
    m.userData.recolor.uTargetOn.value = 1;
  }
  if (paint2 != null && M.key2Hue != null) {
    m.userData.recolor.uTarget2.value.set(paint2);
    m.userData.recolor.uTarget2On.value = 1;
  }
  const mesh = new THREE.Mesh(a.geo, m);
  mesh.userData.authored = true;
  mesh.name = 'prop:' + id;
  return mesh;
}
