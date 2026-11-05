// Cel-shading pass for the reskin.
//
// Every lit mesh in the scene is moved onto a MeshToonMaterial (hard light
// bands from a tiny gradient ramp) and gets an inverted-hull ink outline.
// The pass runs over the scene graph each frame but only touches objects it
// has not seen yet, so streamed-in chunks, spawned heroes and props pick up
// the look automatically. Tweak the look in TOON below.
import * as THREE from 'three';

// ?toon=0 or #original in the URL shows the original look for side-by-side comparison
export const TOON_ON = typeof location === 'undefined' || !/[?&]toon=0\b|original/.test(location.search + location.hash);

export const TOON = {
  // light bands: [shadow, mid, lit] brightness; NearestFilter keeps them hard
  bands: [0.22, 0.62, 1.0],
  outline: true,
  inkColor: 0x14121c,
  // outline width in metres at close range, grows a little with distance so
  // far buildings keep a readable edge
  inkHero: 0.022,
  inkHeroPx: 3.0,   // characters: constant on-screen ink (CSS px)
  inkWorldPx: 1.2,  // everything else: never thinner than this
  inkWorld: 0.05,
  inkFarGain: 0.012, // extra width per metre of view distance (clamped)
  inkFarMax: 2.6,    // max multiplier from distance
};

let ramp = null;
const ramps = new Map();
// characters get a lighter, two-step ramp: faces read badly with deep shadow
export const HERO_BANDS = [0.62, 1.0];
export function gradientMap(bands = null) {
  if (bands) {
    const k = bands.join(',');
    if (!ramps.has(k)) ramps.set(k, makeRamp(bands));
    return ramps.get(k);
  }
  if (ramp) return ramp;
  ramp = makeRamp(TOON.bands);
  return ramp;
}
function makeRamp(bands) {
  const n = bands.length;
  const data = new Uint8Array(n * 4);
  bands.forEach((b, i) => {
    const v = Math.round(b * 255);
    data.set([v, v, v, 255], i * 4);
  });
  const t = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

const converted = new Map(); // old material -> toon material (keeps sharing)

function toToon(m) {
  if (!m) return m;
  if (Array.isArray(m)) return m.map(toToon);
  if (m.isMeshToonMaterial) return m;
  if (!(m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial)) return m;
  let t = converted.get(m);
  if (t) return t;
  t = new THREE.MeshToonMaterial({
    color: m.color,
    map: m.map,
    vertexColors: m.vertexColors,
    emissive: m.emissive,
    emissiveMap: m.emissiveMap,
    emissiveIntensity: m.emissiveIntensity,
    transparent: m.transparent,
    opacity: m.opacity,
    side: m.side,
    fog: m.fog,
    depthWrite: m.depthWrite,
    alphaTest: m.alphaTest,
    gradientMap: gradientMap(),
  });
  t.name = m.name;
  if (m.flatShading) t.flatShading = true; // not a ctor option on toon, but the shader honours it
  t.userData = { ...m.userData, toonFrom: m.type };
  converted.set(m, t);
  // keep later colour/opacity tweaks by game code working (tints, fades)
  t.color = m.color;
  if (m.emissive) t.emissive = m.emissive;
  Object.defineProperty(m, '__toon', { value: t });
  return t;
}

// ---------------------------------------------------------------------------
// outline: back faces pushed out along a *smoothed* normal so hard-edged
// boxes (houses, towers) don't crack open at the corners
// ---------------------------------------------------------------------------
function smoothNormals(geo) {
  if (geo.attributes.outlineNormal) return geo.attributes.outlineNormal;
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const out = new Float32Array(pos.count * 3);
  if (!nrm) {
    geo.setAttribute('outlineNormal', new THREE.BufferAttribute(out, 3));
    return geo.attributes.outlineNormal;
  }
  const key = (i) => `${Math.round(pos.getX(i) * 1e3)},${Math.round(pos.getY(i) * 1e3)},${Math.round(pos.getZ(i) * 1e3)}`;
  const acc = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    let a = acc.get(k);
    if (!a) acc.set(k, (a = [0, 0, 0]));
    a[0] += nrm.getX(i); a[1] += nrm.getY(i); a[2] += nrm.getZ(i);
  }
  // the vector's length caps the hull offset (object units) at a fraction of
  // the mesh's own size, so anything scaling in from ~0 (pickups popping in,
  // effects) can't blow its ink up into a giant black blob
  if (!geo.boundingSphere) geo.computeBoundingSphere();
  const cap = Math.max(1e-4, geo.boundingSphere.radius * 0.15);
  for (let i = 0; i < pos.count; i++) {
    const a = acc.get(key(i));
    const l = (Math.hypot(a[0], a[1], a[2]) || 1) / cap;
    out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l;
  }
  geo.setAttribute('outlineNormal', new THREE.BufferAttribute(out, 3));
  return geo.attributes.outlineNormal;
}

const outlineMats = new Map();
// shared per-frame value: metres of world per screen pixel at 1 m distance
const SHARED = { uPxToWorld: { value: 0.0015 } };
// width: minimum world-space width (m); px: minimum on-screen width (CSS px);
// push: how far (m, view space) the hull is moved away from the camera so it
// shows only at the silhouette and never leaks into concave spots
function outlineMaterial(skinned, { width, px, push }) {
  const k = `${skinned}|${width}|${px}|${push}`;
  let m = outlineMats.get(k);
  if (m) return m;
  m = new THREE.MeshBasicMaterial({ color: TOON.inkColor, side: THREE.BackSide, fog: true });
  m.userData.isOutline = true;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uInk = { value: width };
    sh.uniforms.uInkPx = { value: px };
    sh.uniforms.uPush = { value: push };
    sh.uniforms.uFarGain = { value: TOON.inkFarGain };
    sh.uniforms.uFarMax = { value: TOON.inkFarMax };
    sh.uniforms.uPxToWorld = SHARED.uPxToWorld;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 outlineNormal;\nuniform float uInk, uInkPx, uPush, uFarGain, uFarMax, uPxToWorld;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        // undo the object's scale so a 1/28-scaled Mixamo hero and a 1:1
        // building get the same ink weight
        float sx = length(modelMatrix[0].xyz);
        float sy = length(modelMatrix[1].xyz);
        float sz = length(modelMatrix[2].xyz);
        float objScale = (sx + sy + sz) / 3.0;
        float dist = -(modelViewMatrix * vec4(position, 1.0)).z;
        float wWorld = uInk * clamp(1.0 + dist * uFarGain, 1.0, uFarMax);
        float wPx = uInkPx * uPxToWorld * dist; // constant on-screen width
        float cap = length(outlineNormal);
        transformed += (outlineNormal / max(cap, 1e-6)) * min(max(wWorld, wPx) / objScale, cap);`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        mvPosition.z -= uPush;
        gl_Position = projectionMatrix * mvPosition;`);
  };
  m.customProgramCacheKey = () => 'toon-outline-3';
  outlineMats.set(k, m);
  return m;
}

function wantsOutline(mesh, mat) {
  if (!TOON.outline) return false;
  if (mesh.userData.noOutline) return false;
  if (mesh.isInstancedMesh || mesh.isPoints || mesh.isSprite || mesh.isLine) return false;
  const m = Array.isArray(mat) ? mat[0] : mat;
  if (!m || !m.isMeshToonMaterial) return false;
  if (m.transparent && m.opacity < 0.95) return false;
  const geo = mesh.geometry;
  if (!geo || !geo.attributes.position || geo.attributes.position.count <= 4) return false; // flat ground tiles
  return true;
}

function addOutline(mesh) {
  const geo = mesh.geometry;
  smoothNormals(geo);
  const isHero = mesh.isSkinnedMesh || mesh.userData.hero;
  const mat = outlineMaterial(!!mesh.isSkinnedMesh, isHero
    ? { width: 0, px: TOON.inkHeroPx, push: 0.05 }
    : { width: TOON.inkWorld, px: TOON.inkWorldPx, push: 0.02 });
  let o;
  if (mesh.isSkinnedMesh) {
    o = new THREE.SkinnedMesh(geo, mat);
    o.bind(mesh.skeleton, mesh.bindMatrix);
    o.bindMode = mesh.bindMode;
  } else {
    o = new THREE.Mesh(geo, mat);
  }
  o.userData.toonDone = true;
  o.userData.isOutline = true;
  o.castShadow = false;
  o.receiveShadow = false;
  o.frustumCulled = mesh.frustumCulled;
  o.renderOrder = mesh.renderOrder;
  // follow the source's visibility (invisibility power, disguises, fades)
  o.onBeforeRender = () => {};
  mesh.add(o);
  mesh.userData.outline = o;
}

// keep outline visibility / opacity in step with the source mesh
function syncOutline(mesh) {
  const o = mesh.userData.outline;
  if (!o) return;
  const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  let vis = !!(m && (!m.transparent || m.opacity >= 0.95) && m.visible !== false);
  if (vis && _camPos && mesh.isSkinnedMesh) {
    // heroes: hull costs a full extra skinned draw; far away the 1-2 px line
    // is lost in the crowd anyway
    _c.setFromMatrixPosition(mesh.matrixWorld);
    vis = _c.distanceTo(_camPos) < INK_HERO_DIST;
  } else if (vis && _camPos) {
    const bs = mesh.geometry.boundingSphere || (mesh.geometry.computeBoundingSphere(), mesh.geometry.boundingSphere);
    _c.copy(bs.center).applyMatrix4(mesh.matrixWorld);
    vis = _c.distanceTo(_camPos) - bs.radius * mesh.matrixWorld.getMaxScaleOnAxis() < INK_MAX_DIST;
  }
  o.visible = vis;
}

const _c = new THREE.Vector3();
let _camPos = null;
const INK_HERO_DIST = 55;
const INK_MAX_DIST = 80; // beyond this the fog eats the ink anyway: skip the hull
export function toonify(root, camera, renderer) {
  if (!TOON_ON) return;
  _camPos = camera ? camera.position : null;
  if (camera && renderer) {
    const h = renderer.domElement.clientHeight || 720;
    SHARED.uPxToWorld.value = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / h;
    for (const m of outlineMats.values()) m.uniformsNeedUpdate = true;
  }
  root.traverse((obj) => {
    if (!obj.isMesh || obj.userData.isOutline) return;
    if (!obj.userData.toonDone) {
      obj.userData.toonDone = true;
      obj.material = toToon(obj.material);
      if (wantsOutline(obj, obj.material)) addOutline(obj);
    } else {
      // game code may swap materials later (fades, tints): re-convert
      const m = obj.material;
      const base = Array.isArray(m) ? m[0] : m;
      if (base && !base.isMeshToonMaterial && (base.isMeshLambertMaterial || base.isMeshStandardMaterial)) {
        obj.material = toToon(m);
      }
      syncOutline(obj);
    }
  });
}

// light rig tuned for two hard bands instead of soft Lambert falloff
export function toonLights(world, renderer) {
  if (!TOON_ON) return;
  renderer.toneMapping = THREE.NoToneMapping;
  // shadow side is lit only by the hemisphere: make it a cool blue-violet so
  // shadows read as colour, not grey; the sun stays warm
  if (world.hemi) {
    world.hemi.intensity = 1.15;
    world.hemi.color.set(0xc4d2ff);
    world.hemi.groundColor.set(0x8a7cb8);
  }
  if (world.sun) {
    world.sun.intensity = 2.0;
    world.sun.color.set(0xffeccc);
  }
}

// hard-edged rim light for characters and props (comic "kicker" light)
export const RIM_GLSL = /* glsl */`
  {
    vec3 vd = normalize(vViewPosition);
    float r = 1.0 - max(dot(normal, vd), 0.0);
    outgoingLight += vec3(1.0, 0.95, 0.85) * smoothstep(0.72, 0.76, r) * RIM_STRENGTH;
  }
  #include <opaque_fragment>`;
