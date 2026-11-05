// Asset-catalog render harness.
//
// Served by Vite's dev server and driven by scripts/build-catalog.mjs. It
// imports the game's own asset code, stages each asset alone in a studio
// scene lit like the game, renders it from fixed views, and measures it
// (bounds, triangles, materials, dominant colours). Every picture in the
// catalog is therefore exactly what the game draws.
import { reseed } from './seed.js';
import * as THREE from 'three';
import '../../src/font.css';
import { CONFIG } from '../../src/config.js';
import { POWERS } from '../../src/powers.js';
import { ARCHETYPES } from '../../src/archetypes.js';
import { World, box, cylinder, blob } from '../../src/world.js';
import { Character } from '../../src/entities.js';
import { loadAnimLib, ANIM } from '../../src/animlib.js';
import { makePillMesh, makePotionMesh, makeTokenParts, PILL_COLORS, POTION_COLORS } from '../../src/collectibles.js';
import { FX } from '../../src/fx.js';
import { BamText } from '../../src/bam.js';
import { powerIcon } from '../../src/icons.js';

const V3 = THREE.Vector3;
const rad = THREE.MathUtils.degToRad;
const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');
const r2 = (v) => Math.round(v * 100) / 100;
const noop = () => {};
const FX_BG = 0x1d2431;   // effects are additive, so they get an opaque night backdrop

// ---------------------------------------------------------------------------
// studio
// ---------------------------------------------------------------------------

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;   // same grade as the game
renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const SUN_DIR = new V3(60, 110, 40).normalize();       // the game's sun direction

function makeStage() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xd6e9ff, 0x5d7a4d, 0.95));   // the game's sky/ground light
  const sun = new THREE.DirectionalLight(0xfff2d5, 1.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  // soft key from the camera so dark suits still read in a reference image (not in the game)
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  scene.add(fill, fill.target);
  // invisible floor that only shows the contact shadow, so PNGs stay transparent
  const catcher = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );
  catcher.receiveShadow = true;
  catcher.userData.studio = true;
  scene.add(catcher);
  return { scene, sun, fill, catcher };
}

function isVisible(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

// World-space bounds of the visible meshes (skinned meshes in their current pose).
function boundsOf(objs) {
  const b = new THREE.Box3(), tmp = new THREE.Box3(), v = new V3();
  for (const root of objs) {
    // updateMatrixWorld (not updateWorldMatrix) so skinned meshes also refresh
    // bindMatrixInverse; a stale one would apply the body's scale twice
    root.updateWorldMatrix(true, false);
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh || !isVisible(o) || o.userData.noBounds) return;
      if (o.isSkinnedMesh) {
        const pos = o.geometry.attributes.position;
        tmp.makeEmpty();
        for (let i = 0; i < pos.count; i += 2) { o.getVertexPosition(i, v); tmp.expandByPoint(v.applyMatrix4(o.matrixWorld)); }
      } else {
        o.geometry.computeBoundingBox();   // cloth rewrites its vertices every frame
        tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      }
      b.union(tmp);
    });
  }
  return b;
}

function subjectOf(objs, extra = {}) {
  const box3 = boundsOf(objs);
  const sphere = box3.getBoundingSphere(new THREE.Sphere());
  return { box: box3, center: sphere.center, radius: Math.max(0.3, sphere.radius), groundY: 0, ...extra };
}

function subjectAt(center, size) {
  const c = new V3(...center), s = new V3(...size).multiplyScalar(0.5);
  const box3 = new THREE.Box3(c.clone().sub(s), c.clone().add(s));
  return { box: box3, center: c, radius: s.length(), groundY: 0 };
}

function viewDir(az, el) {
  const a = rad(az), e = rad(el);
  return new V3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
}

// Closest camera distance at which every corner of the box fits the frame.
function fitDist(subj, az, el, fov, aspect, margin = 0.88) {
  const cam = new THREE.Object3D();
  cam.position.copy(subj.center).add(viewDir(az, el));
  if (el >= 89) cam.up.set(0, 0, -1);
  cam.lookAt(subj.center);
  // Object3D.lookAt points +z at the target; cameras look down -z, so flip
  cam.rotateY(Math.PI);
  cam.updateMatrixWorld();
  const rot = new THREE.Matrix4().extractRotation(cam.matrixWorld).invert();
  const tv = Math.tan(rad(fov) / 2) * margin, th = tv * aspect;
  const { min, max } = subj.box, v = new V3();
  let need = 0;
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
    v.set(x, y, z).sub(subj.center).applyMatrix4(rot);
    need = Math.max(need, v.z + Math.abs(v.x) / th, v.z + Math.abs(v.y) / tv);
  }
  return need;
}

function shoot(stage, subj, v) {
  const w = v.w || 640, h = v.h || 640, fov = v.fov || 24;
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.05, 20000);
  if (v.camera) {
    cam.position.set(...v.camera.pos);
    cam.lookAt(new V3(...v.camera.target));
  } else {
    const dist = v.dist ?? fitDist(subj, v.az, v.el, fov, w / h, v.margin);
    cam.position.copy(subj.center).addScaledVector(viewDir(v.az, v.el), dist);
    if (v.el >= 89) cam.up.set(0, 0, -1);
    cam.lookAt(subj.center);
  }
  cam.updateProjectionMatrix();

  const r = subj.radius;
  stage.fill.position.copy(cam.position).add(new V3(0, r * 0.5, 0));
  stage.fill.target.position.copy(subj.center);
  stage.fill.visible = v.fill !== false;
  stage.sun.position.copy(subj.center).addScaledVector(SUN_DIR, r * 3 + 20);
  stage.sun.target.position.copy(subj.center);
  const sc = stage.sun.shadow.camera, s = r * 1.3 + 1;
  Object.assign(sc, { left: -s, right: s, top: s, bottom: -s, near: 0.5, far: r * 6 + 60 });
  sc.updateProjectionMatrix();
  stage.catcher.visible = v.catcher !== false;
  stage.catcher.position.set(subj.center.x, subj.groundY ?? 0, subj.center.z);
  stage.catcher.scale.setScalar(r * 12 + 10);

  renderer.setClearColor(v.bg ?? 0x000000, v.bg != null ? 1 : 0);
  renderer.setSize(w, h, false);
  renderer.render(stage.scene, cam);
  return { key: v.key, label: v.label, w, h, data: canvas.toDataURL('image/png') };
}

// ---------------------------------------------------------------------------
// measurement
// ---------------------------------------------------------------------------

function matLabel(m) {
  const bits = [];
  if (m.vertexColors) bits.push('vertex colours');
  if (m.map) bits.push('texture');
  if (m.emissive && m.emissive.getHex() && m.emissiveIntensity > 0) bits.push('emissive');
  if (m.transparent && m.opacity < 1) bits.push(`${Math.round(m.opacity * 100)}% opacity`);
  if (m.blending === THREE.AdditiveBlending) bits.push('additive');
  return m.type.replace(/Material$/, '') + (bits.length ? ` (${bits.join(', ')})` : '');
}

function statsOf(objs) {
  let tris = 0, verts = 0;
  const mats = new Set();
  for (const root of objs) root.traverse((o) => {
    if (!isVisible(o) || !(o.isMesh || o.isPoints || o.isSprite)) return;
    if (o.isMesh) {
      const g = o.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      verts += g.attributes.position.count;
    }
    for (const m of [].concat(o.material)) if (m && !m.isShadowMaterial) mats.add(matLabel(m));
  });
  return { tris: Math.round(tris), verts, materials: [...mats] };
}

// Area-weighted dominant colours of the visible, untextured surfaces (sRGB).
function dominantColors(objs, n = 6) {
  const bins = new Map();
  const a = new V3(), b = new V3(), c = new V3(), col = new THREE.Color();
  const add = (h, w) => {
    const R = (h >> 16) & 255, G = (h >> 8) & 255, B = h & 255;
    const k = ((R >> 4) << 8) | ((G >> 4) << 4) | (B >> 4);
    const e = bins.get(k) || { w: 0, r: 0, g: 0, b: 0 };
    e.w += w; e.r += R * w; e.g += G * w; e.b += B * w;
    bins.set(k, e);
  };
  for (const root of objs) root.traverse((o) => {
    if (!o.isMesh || !isVisible(o)) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || m.map || m.isShadowMaterial || m.isShaderMaterial) return;
    const g = o.geometry, pos = g.attributes.position, vc = m.vertexColors ? g.attributes.color : null, idx = g.index;
    const triCount = (idx ? idx.count : pos.count) / 3;
    const step = Math.max(1, Math.floor(triCount / 5000));
    for (let t = 0; t < triCount; t += step) {
      const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(o.matrixWorld);
      b.fromBufferAttribute(pos, i1).applyMatrix4(o.matrixWorld).sub(a);
      c.fromBufferAttribute(pos, i2).applyMatrix4(o.matrixWorld).sub(a);
      const area = b.cross(c).length() * 0.5 * step;
      if (vc) col.fromBufferAttribute(vc, i0); else col.copy(m.color);
      add(col.getHex(), area);
    }
  });
  const sorted = [...bins.values()].sort((p, q) => q.w - p.w);
  const total = sorted.reduce((s, e) => s + e.w, 0) || 1;
  const picks = [];
  for (const e of sorted) {
    const rgb = [e.r / e.w, e.g / e.w, e.b / e.w];
    const near = picks.find((p) => Math.hypot(p.rgb[0] - rgb[0], p.rgb[1] - rgb[1], p.rgb[2] - rgb[2]) < 42);
    if (near) { near.w += e.w; continue; }
    picks.push({ rgb, w: e.w });
    if (picks.length >= n * 2) break;
  }
  return picks.sort((p, q) => q.w - p.w).slice(0, n).map((p) => ({
    hex: hex((Math.round(p.rgb[0]) << 16) | (Math.round(p.rgb[1]) << 8) | Math.round(p.rgb[2])),
    share: r2(p.w / total),
  }));
}

function disposeObjs(objs) {
  for (const root of objs) root.traverse((o) => {
    if (o.geometry && !o.userData.shared && o.geometry !== world?.groundGeo) o.geometry.dispose?.();
  });
}

// ---------------------------------------------------------------------------
// asset helpers
// ---------------------------------------------------------------------------

let world = null;

function geosGroup(geos, mat) {
  const g = new THREE.Group();
  for (const geo of geos) g.add(new THREE.Mesh(geo, mat));
  return g;
}
function vcGroup(build) {
  const vc = [];
  build(vc);
  return geosGroup(vc, world.vcMat);
}

const powerById = (id) => POWERS.find((p) => p.id === id);

function hero(scene, powerId, seed = 0.5) {
  const ch = new Character(scene, { name: '', power: powerById(powerId), paletteSeed: seed });
  ch.aura.visible = false;
  ch.blobShadow.visible = false;
  return ch;
}
function settle(ch, frames = 150, each) {
  for (let i = 0; i < frames; i++) { each?.(i); ch.update(1 / 60, i / 60); }
}
const heroObjs = (ch) => [ch.group, ...(ch.cape ? [ch.cape.mesh] : [])];

// A hero held in the rig's bind pose (T-pose) while the cape settles: a
// frozen character skips the animator but still simulates its cloth.
function tposed(scene, powerId) {
  const ch = hero(scene, powerId);
  ch.frozenUntil = Infinity;
  settle(ch, 150);
  ch.iceShell.visible = false;
  return ch;
}

// Bind pose with the skeleton drawn on top.
function bindPose(scene, powerId, existing = null) {
  const ch = existing || tposed(scene, powerId);
  if (ch.cape) ch.cape.mesh.visible = false;
  ch.setOpacity(0.5);
  ch.group.updateMatrixWorld(true);
  const overlay = new THREE.Group();
  const helper = new THREE.SkeletonHelper(ch.body);
  helper.material.vertexColors = false;
  helper.material.color.set(0xffd166);
  helper.material.needsUpdate = true;
  helper.renderOrder = 10;
  scene.add(helper);
  const ball = new THREE.SphereGeometry(1, 10, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff3e9a, depthTest: false, transparent: true });
  const p = new V3();
  for (const bone of ch.body.skeleton.bones) {
    bone.getWorldPosition(p);
    const s = new THREE.Mesh(ball, mat);
    s.position.copy(p);
    s.scale.setScalar(0.022);
    s.renderOrder = 11;
    s.userData.noBounds = true;
    overlay.add(s);
  }
  scene.add(overlay);
  return {
    ch,
    subject: () => subjectOf([ch.body], { groundY: boundsOf([ch.body]).min.y }),
    remove() {
      scene.remove(helper, overlay); helper.dispose();
      if (existing) { ch.setOpacity(1); if (ch.cape) ch.cape.mesh.visible = true; } else ch.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// reference data that lives in local constants inside the game modules
// ---------------------------------------------------------------------------

const HOUSE_WALLS = [0xe8dcc8, 0xd9c1a8, 0xc3d5e6, 0xd7e2c1, 0xe2bfb6, 0xf0e6d0, 0xb8cfd9, 0xd9d0e8, 0xead9a8, 0xc9e2d4];
const HOUSE_ROOFS = [0x8a4b3b, 0x5b6570, 0x71504a, 0x4f6b52, 0x815f3f, 0x3f4b5c];
const DOORS = [0x7a3b2e, 0x314a6e, 0x3e5a3a, 0x6e5a31];
const SKINS = [0xf3cfa8, 0xe4b48c, 0xc98f63, 0xa96d46, 0x7d4c31, 0x5a3622];
const CAR_COLORS = [0xc23a3a, 0x3a66c2, 0xd8d8dc, 0x2e2e34, 0x3aa66a, 0xd9a51f, 0x8446b8, 0xe8e4da];
const CANOPIES = [0x4f8f3a, 0x5da245, 0x3f7a30, 0x76a83f, 0x4a9668];
const FLOWERS = [0xe45c7a, 0xf2d34e, 0xd881e8, 0xf08a4b, 0xffffff];
const CAPE_SPECS = { short: { rows: 6, len: 0.42 }, medium: { rows: 9, len: 0.7 }, long: { rows: 12, len: 1.0 } };

const HAIR = {
  surfer: 'Surfer (swept, shoulder-length)', spiky: 'Spiky', bald: 'Bald', quiff: 'Quiff', flame: 'Living flame (animated)',
  mohawk: 'Mohawk', buzz: 'Buzz cut', sidepart: 'Side part', crew: 'Crew cut',
};
const FACIAL = { goatee: 'Goatee', fullBeard: 'Full beard', stubbleGoatee: 'Stubble goatee' };
const GEAR = {
  aviatorGoggles: 'Aviator goggles', speedShades: 'Wraparound speed shades', lightningBoots: 'Lightning boots (glowing)',
  facelessMask: 'Full faceless mask', robinMask: 'Domino mask', baneMask: 'Breathing mask', bandana: 'Bandana',
  xrayGoggles: 'X-ray goggles (glowing lenses)', sunglasses: 'Sunglasses',
};
const SUIT_DESC = {
  flight: 'Chevron flight suit', speed: 'Lightning-bolt sprint suit', invisibility: 'Panelled stealth suit',
  telekinesis: 'Tabard-and-cuffs cloak suit', pyro: 'Flame-licked suit', cryo: 'Quilted, fur-trimmed trapper suit',
  teleport: 'Seamed plate suit with a glowing chest core', xray: 'Circuit-traced suit', shapeshift: 'Banded suit',
  duplication: 'Tactical vest over a bodysuit',
};
const HERO_BLURB = {
  flight: 'Athletic all-rounder in their early thirties: surfer hair, aviator goggles, royal-blue chevron flight suit and a short cape.',
  speed: 'Slim, long-legged 22-year-old sprinter: spiky black hair, wraparound shades, glowing lightning boots and a yellow-and-red bolt suit.',
  invisibility: 'Bald 52-year-old operative whose whole face is hidden behind a smooth featureless mask; panelled slate-grey suit, low muscle definition.',
  telekinesis: 'Lean 41-year-old mentalist with a dark quiff, silver streak and goatee; purple tabard-and-cuffs suit trimmed in gold, medium cape.',
  pyro: 'Defined 28-year-old with living-flame hair and a domino mask; red-and-black flame-licked suit with orange accents.',
  cryo: 'Hulking 38-year-old bruiser with a frost-white mohawk, full beard and breathing mask; quilted, fur-trimmed blue trapper suit and a long cape.',
  teleport: 'Short, stocky 27-year-old infighter with a buzz cut and bandana; teal seamed-plate suit with a glowing chest core.',
  xray: 'Tall, long-limbed 33-year-old with a shaved head, stubble goatee and glowing x-ray goggles; black suit traced with neon-green circuitry, short cape.',
  shapeshift: 'Average-build 42-year-old with neat side-parted hair in a magenta banded suit with pink accents.',
  duplication: 'Broad-shouldered 29-year-old bruiser with a crew cut and sunglasses; orange tactical vest over a dark suit.',
};
const CLIP_GROUPS = {
  idle: ['idle_4', 'ninja_idle_3'],
  locomotion: ['walking_2', 'fast_run_4', 'walking_backwards', 'running_backward_2'],
  flight: ['flying', 'flying_idle'],
  cast: ['spell_cast', 'standing_1h_magic_attack_01', 'standing_2h_magic_attack_03'],
  reaction: ['reaction', 'reaction_2', 'reaction_3'],
  death: ['falling_back_death', 'falling_forward_death', 'flying_back_death_3'],
  special: ['superhero_landing', 'fist_pump'],
};
const CLIP_GROUP_NAME = {
  idle: 'Idle', locomotion: 'Locomotion', flight: 'Flight', cast: 'Power cast', reaction: 'Hit reaction',
  death: 'Death', special: 'Special', attack: 'Attack',
};

// ---------------------------------------------------------------------------
// the catalog
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { id: 'heroes', name: 'Heroes', blurb: 'One playable archetype per superpower. Bots and the player use the same ten.' },
  { id: 'rig', name: 'Rig & cloth', blurb: 'The shared skeleton every hero is skinned to, and the simulated capes.' },
  { id: 'buildings', name: 'Buildings', blurb: 'Suburban houses and downtown towers, built per city block.' },
  { id: 'liftables', name: 'Liftable props', blurb: 'Props telekinesis can pick up and throw.' },
  { id: 'props', name: 'Street & yard props', blurb: 'Static dressing placed around lots and plazas.' },
  { id: 'environment', name: 'Environment', blurb: 'Whole blocks, ground tiles and the sky.' },
  { id: 'collectibles', name: 'Collectibles', blurb: 'Tokens, pills and potions that spawn around the player.' },
  { id: 'effects', name: 'Effects', blurb: 'Particles, rings, overlays and impact text.' },
  { id: 'icons', name: 'Power icons', blurb: 'The UI icon for each superpower (vector).' },
  { id: 'animations', name: 'Animations', blurb: 'Baked Mixamo clips shared by every hero.' },
];

const ENTRIES = [];
const BY_ID = {};
function add(e) { ENTRIES.push(e); BY_ID[e.id] = e; }

// ---- heroes ---------------------------------------------------------------
for (const p of POWERS) {
  const a = ARCHETYPES[p.id], b = a.build;
  add({
    id: `hero-${p.id}`, name: `${p.name} hero`, category: 'heroes', sub: `${a.combat.style} fighter`,
    tags: [p.id, HAIR[a.hair].toLowerCase(), ...(a.facialHair ? [FACIAL[a.facialHair].toLowerCase()] : []), ...a.gear.map((g) => GEAR[g].toLowerCase()), a.cape ? `${a.cape} cape` : 'no cape', p.rare ? 'rare power' : 'common power', a.combat.style],
    desc: HERO_BLURB[p.id],
    sizeNote: 'T-pose, including the cape; width is the arm span',
    variants: `Each spawned hero rotates the suit hue within ±${Math.round(a.hueRange * 360)}° and jitters lightness by up to 6%; skin is one of 6 tones. These renders use the base palette (the player's).`,
    notes: [
      'Skinned to the shared Mixamo skeleton (22 animated bones). Keep the mixamorig bone names so all 39 baked clips still drive the new mesh.',
      'The suit pattern is painted as vertex colours by the suit painter in archetypes.js; a textured reskin can replace it.',
      `In game the hero stands on a power-coloured aura ring (${hex(p.color)}) with a soft blob shadow.`,
      ...(a.cape ? [`The ${a.cape} cape is a separate verlet-cloth mesh pinned along the collarbones (see Rig & cloth).`] : []),
    ],
    source: [{ file: 'src/archetypes.js', symbol: p.id + ':' }, { file: 'src/rig.js', symbol: 'buildRig' }, { file: 'src/entities.js', symbol: 'buildLook' }],
    rows: [
      ['Power', `${p.name}${p.rare ? ' (rare)' : ''}`],
      ['Nominal height', `${r2(1.85 * b.height)} m`],
      ['Proportions', `height ×${b.height} · shoulders ×${b.shoulder} · mass ×${b.mass} · waist ×${b.waist} · legs ×${b.legLen} · muscle definition ×${b.definition}`],
      ['Age cue', String(a.age)],
      ['Hair', HAIR[a.hair] + (a.hairStreak ? ', silver streak' : '')],
      ['Facial hair', FACIAL[a.facialHair] || 'None'],
      ['Gear', a.gear.map((g) => GEAR[g]).join(', ') || 'None'],
      ['Cape', a.cape ? `${a.cape[0].toUpperCase()}${a.cape.slice(1)} (${CAPE_SPECS[a.cape].len} × body height)` : 'None'],
      ['Suit', SUIT_DESC[a.suit]],
      ['Idle clip', a.idle],
      ['Power-cast clip', a.cast],
      ['Fighting style', `${a.combat.style} · ${a.combat.damage} damage · ${a.combat.range} m reach · ${a.combat.speed}× swing speed`],
    ],
    lists: [{ label: 'Attack moves (cycled in order)', items: a.combat.moves, link: 'anim' }],
    swatches: [
      { label: 'Suit palette (base)', items: [['Primary', a.palette.primary], ['Secondary', a.palette.secondary], ['Accent', a.palette.accent], ['Glow', a.palette.glow]] },
      ...(a.hair === 'bald' ? [] : [{ label: 'Hair', items: [['Hair', a.hairColor], ...(a.hairStreak ? [['Streak', a.hairStreak]] : [])] }]),
      { label: 'Skin tones (one per spawned hero)', items: SKINS.map((s, i) => [`Tone ${i + 1}`, s]) },
      { label: 'Power colour (aura, icon, FX)', items: [[p.name, p.color]] },
    ],
    async build({ scene }) {
      // in-game idle for the hero shot, a separate T-posed copy for the turnaround
      const ch = hero(scene, p.id);
      settle(ch, 150);
      const tp = tposed(scene, p.id);
      const objs = heroObjs(ch), tpObjs = heroObjs(tp);
      const show = (a, b) => { for (const o of objs) o.visible = a; for (const o of tpObjs) o.visible = b; };
      show(true, false);
      const subj = subjectOf(objs);
      show(false, true);
      const tsubj = subjectOf(tpObjs, { groundY: boundsOf([tp.body]).min.y });
      show(true, false);
      const fov = 22;
      const lock = Math.max(...[0, 90, 180].map((az) => fitDist(tsubj, az, 3, fov, 1, 0.9)));
      const turn = (key, label, az) => ({ key, label, az, el: 3, fov, dist: lock, subject: tsubj, prepare: () => show(false, true) });
      let bind = null;
      return {
        objs, subject: subj, noColors: true,
        views: [
          { key: 'hero', label: 'In game (idle)', az: 32, el: 12, fov },
          turn('front', 'T-pose front', 0),
          turn('side', 'T-pose side', 90),
          turn('back', 'T-pose back', 180),
          turn('three', 'T-pose 3/4', 40),
          {
            key: 'bind', label: 'Skeleton', az: 0, el: 3, fov, dist: lock,
            prepare() { show(false, true); bind = bindPose(scene, p.id, tp); },
            subject: () => tsubj,
            after() { bind.remove(); },   // leaves the T-pose showing for the size measurement
          },
        ],
        measure: tpObjs,
        cleanup() { ch.dispose(); tp.dispose(); },
      };
    },
  });
}

// ---- rig & cloth ----------------------------------------------------------
add({
  id: 'rig-skeleton', name: 'Hero skeleton', category: 'rig', sub: 'Mixamo rig', sizeNote: 'T-pose of the Shapeshifting hero',
  tags: ['skeleton', 'bones', 'mixamo', 'rig', 'bind pose'],
  desc: 'The single skeleton every hero is skinned to: the standard Mixamo humanoid (mixamorig: names). Shown in its bind pose on the Shapeshifting hero.',
  notes: [
    'All 39 animation clips were baked against these bone names; a reskin that keeps them inherits every animation.',
    'Leg and arm bone offsets are scaled per hero (leg length, shoulder width), so one skeleton fits every build.',
    'Root motion: the hips XZ track is stripped from each clip and applied to the character, so the mesh must not rely on hip translation.',
    'Rig units are Mixamo units; each hero is scaled so its idle stance is 1.85 m × the archetype height.',
  ],
  source: [{ file: 'src/rig.js', symbol: 'buildRig' }, { file: 'scripts/bake-anims.mjs', symbol: 'KEEP' }],
  async build({ scene }) {
    const bind = bindPose(scene, 'shapeshift');
    const bones = bind.ch.body.skeleton.bones.map((bn) => bn.name);
    return {
      objs: [bind.ch.body], subject: bind.subject(), noColors: true,
      info: { lists: [{ label: `Bones (${bones.length})`, items: bones }], rows: [['Animated bones', String(ANIM.bones.length)], ['Rig unit height', `${r2(ANIM.unitHeight)} units (T-pose)`], ['Clip sample rate', `${ANIM.fps} fps`]] },
      views: [
        { key: 'hero', label: 'Bind pose, front', az: 0, el: 4, fov: 22 },
        { key: 'three', label: 'Bind pose, 3/4', az: 35, el: 14, fov: 22 },
      ],
      cleanup() { bind.remove(); },
    };
  },
});

add({
  id: 'rig-capes', name: 'Capes (short, medium, long)', category: 'rig', sub: 'Verlet cloth',
  tags: ['cape', 'cloth', 'simulation', 'flight', 'telekinesis', 'cryo', 'xray'],
  desc: 'Capes are simulated cloth grids pinned along the collarbones. They collide with a torso capsule and a back plane and trail with movement. Shown from behind on Flight (short), Telekinesis (medium) and Cryokinesis (long).',
  notes: [
    'Width comes from the hero\'s shoulders; length is a fraction of body height.',
    'Coloured from the suit: primary blended 40% toward secondary.',
    'Short capes: Flight, X-Ray Vision. Medium: Telekinesis. Long: Cryokinesis.',
  ],
  source: [{ file: 'src/cloth.js', symbol: 'class Cape' }, { file: 'src/entities.js', symbol: 'CAPE_SPECS' }],
  rows: Object.entries(CAPE_SPECS).map(([k, s]) => [`${k[0].toUpperCase()}${k.slice(1)}`, `${s.rows} rows × 7 columns · ${s.len} × body height`]),
  async build({ scene }) {
    const ids = ['flight', 'telekinesis', 'cryo'];
    const chars = ids.map((id, i) => {
      const ch = hero(scene, id);
      ch.pos.set((i - 1) * 1.7, 0, 0);
      return ch;
    });
    for (let f = 0; f < 160; f++) for (const ch of chars) ch.update(1 / 60, f / 60);
    const objs = chars.flatMap(heroObjs);
    return {
      objs, noColors: true,
      views: [{ key: 'hero', label: 'From behind', az: 180, el: 10, fov: 24 }, { key: 'side', label: '3/4 rear', az: 145, el: 12, fov: 24 }],
      measure: chars.filter((c) => c.cape).map((c) => c.cape.mesh),
      cleanup() { chars.forEach((c) => c.dispose()); },
    };
  },
});

// ---- buildings ------------------------------------------------------------
const houseCommon = {
  category: 'buildings',
  variants: '10 wall colours × 6 roof colours × 4 door colours, dimensions randomised inside the ranges below. Faces the street (+Z is the front).',
  swatches: [
    { label: 'Wall options', items: HOUSE_WALLS.map((c, i) => [`Wall ${i + 1}`, c]) },
    { label: 'Roof options', items: HOUSE_ROOFS.map((c, i) => [`Roof ${i + 1}`, c]) },
    { label: 'Door options', items: DOORS.map((c, i) => [`Door ${i + 1}`, c]) },
  ],
};
const HOUSES = [
  { kind: 0, id: 'house-bungalow', name: 'Bungalow with garage', wall: HOUSE_WALLS[0], roof: HOUSE_ROOFS[0],
    desc: 'Classic one-storey house with a hip roof, trim band, attached garage with a roll-up door, driveway, front door and trimmed window.',
    ranges: 'Body W 5.5–6.5 · D 4.6–5.4 · H 3.0–3.6 m, roof +1.7–2.3 m; garage 3 × 2.4 × 3.4 m; driveway 3 × 5.5 m',
    notes: ['Colliders: house max(W, D)/2 + 0.2 m square, H + 2 m tall; garage 3.4 × 3.8 × 2.6 m.'] },
  { kind: 1, id: 'house-two-storey', name: 'Two-storey house', wall: HOUSE_WALLS[2], roof: HOUSE_ROOFS[1],
    desc: 'Tall two-storey house with a mid-height trim band, hip roof, brick chimney, front door and four windows.',
    ranges: 'Body W 5–6 · D 4.6–5.4 · H 5.4–6.2 m, roof +1.6–2.1 m; chimney 0.6 × 1.6 × 0.6 m',
    notes: ['Collider: max(W, D)/2 + 0.2 m square, H + 2 m tall.'] },
  { kind: 2, id: 'house-ranch', name: 'L-shaped ranch', wall: HOUSE_WALLS[3], roof: HOUSE_ROOFS[3],
    desc: 'Long, low ranch house with a forward wing forming an L, flat slab roofs on both volumes.',
    ranges: 'Body W 6.5–7.5 · D 3.6–4.2 · H 3.0–3.4 m; wing W 3.2–3.8 × D 3.4 m',
    notes: ['Two colliders (body and wing), each H + 1 m tall.'] },
  { kind: 3, id: 'house-modern', name: 'Modern two-tone house', wall: HOUSE_WALLS[5], roof: HOUSE_ROOFS[5],
    desc: 'Staggered flat-roof volumes in two tones with dark roof caps, a wide glass window band and a driveway. No door or window kit beyond the band.',
    ranges: 'Body W 5–6 · D 4.4–5 · H 3.4–4 m; second volume 0.55 W × 1.35 H × 0.7 D',
    notes: ['Second-volume tone is one of #9aa4ad, #7d8891, #cbd2d8, #8a7b6d.', 'Collider: W/2 + 0.5 × D/2 + 0.4, 1.4 H + 1 m tall.'] },
  { kind: 4, id: 'house-cottage', name: 'Porch cottage', wall: HOUSE_WALLS[4], roof: HOUSE_ROOFS[4],
    desc: 'Small cottage with a steep pyramid roof and a covered front porch on two white posts.',
    ranges: 'Body W 4.8–5.6 · D 4.2–4.8 · H 2.8–3.2 m, roof +2.0–2.6 m; porch 0.9 W × 2 m deep',
    notes: ['The porch slab is a walkable platform 0.24 m high (feet ride up onto it).', 'Collider: max(W, D)/2 + 0.2 m square, H + 2 m tall.'] },
];
for (const h of HOUSES) {
  add({
    ...houseCommon, id: h.id, name: h.name, sub: 'Suburb · house', desc: h.desc, ranges: h.ranges,
    tags: ['house', 'suburb', 'building'],
    notes: [...h.notes, 'Placed on a 2 × 2 grid of lots per suburban block; 15% of lots are parks instead.'],
    source: [{ file: 'src/world.js', symbol: 'house' }, { file: 'src/world.js', symbol: 'houseFace' }],
    async build() {
      const g = vcGroup((vc) => world.house(vc, 0, 0, 0, h.wall, h.roof, h.kind, noop, noop));
      return { objs: [g], views: [{ key: 'hero', label: '3/4 front', az: 35, el: 22 }, { key: 'rear', label: '3/4 rear', az: 215, el: 22 }] };
    },
  });
}

const TOWER_COMMON = {
  category: 'buildings', tags: ['tower', 'downtown', 'skyscraper', 'glass'],
  variants: 'Tinted cool blue-grey (65%) or warm beige (35%), with a matching window texture. 20% are tall (30–48 m). Roof clutter is random: HVAC box 70%, antenna 35%, water tower 22%, billboard 20%. 50% get a street-level awning strip in red, blue, green or yellow.',
  notes: [
    'Glass walls use a tiled procedural window texture (96 px, one tile per 2.4 m) multiplied by the tint.',
    'A dark 1.4 m lobby plinth wraps the base. Collider is the footprint, full height.',
    'Downtown blocks hold one or two towers (16% of blocks are plazas instead).',
  ],
};
const TOWERS = [
  { id: 'tower-tiered', name: 'Tiered tower', sub: 'Downtown · tower', fn: 'tieredTower', warm: false,
    desc: 'Box tower in up to three setback tiers with dark ledge caps, a lobby plinth and rooftop clutter.',
    ranges: 'Footprint 7–11 × 7–11 m; height 9–26 m (tall: 30–48 m, 2–3 tiers, each tier shrinks to 68–82%)',
    make: (vc, t) => world.tieredTower(vc, t, 0, 0, 10, 9, 36, false) },
  { id: 'tower-slab', name: 'Glass slab tower', sub: 'Downtown · tower', fn: 'slabTower', warm: true,
    desc: 'Thin glass slab with 2–4 full-height concrete fins, a roof cap and lobby plinth.',
    ranges: 'Width 7–11 m; depth max(5, 0.6 × D) m; height 9–26 m (tall: 30–48 m)',
    make: (vc, t) => world.slabTower(vc, t, 0, 0, 10, 9, 24, true) },
  { id: 'tower-cylinder', name: 'Round tower', sub: 'Downtown · tower', fn: 'cylinderTower', warm: false,
    desc: 'Cylindrical glass tower that tapers slightly toward the top, with a crown ring, plinth ring and sometimes a mast.',
    ranges: 'Radius = half the footprint (only footprints over 8 m); taper to 82–95%; height 9–26 m (tall: 30–48 m)',
    make: (vc, t) => world.cylinderTower(vc, t, 0, 0, 4.6, 30, false) },
];
for (const t of TOWERS) {
  add({
    ...TOWER_COMMON, id: t.id, name: t.name, sub: t.sub, desc: t.desc, ranges: t.ranges,
    source: [{ file: 'src/world.js', symbol: t.fn }, { file: 'src/world.js', symbol: 'roofClutter' }],
    swatches: [{ label: 'Tint family', items: [['Cool (hue 0.52–0.62)', 0x7d8a96], ['Warm (hue 0.06–0.12)', 0xa08c78], ['Plinth', 0x2e343c], ['Ledges', 0x3a4048]] }],
    async build() {
      const vc = [], tw = [];
      t.make(vc, tw);
      const g = new THREE.Group();
      g.add(geosGroup(vc, world.vcMat), geosGroup(tw, t.warm ? world.towerMatWarm : world.towerMatCool));
      return { objs: [g], views: [{ key: 'hero', label: '3/4 street view', az: 35, el: 16 }, { key: 'roof', label: 'Roof', az: 35, el: 62 }] };
    },
  });
}

add({
  id: 'shed', name: 'Garden shed', category: 'buildings', sub: 'Suburb · outbuilding',
  tags: ['shed', 'suburb', 'yard'], desc: 'Small timber shed with an overhanging flat roof, dropped into 30% of back yards.',
  ranges: 'W 1.8–2.4 · H 1.8–2.2 m; depth 0.85 W', variants: 'Walls in #8a7355, #6d7a68 or #7d6a5c; roof #5b5048.',
  notes: ['Has a collider (blocks movement).'],
  source: [{ file: 'src/world.js', symbol: 'shed' }],
  async build() { return { objs: [vcGroup((vc) => world.shed(vc, 0, 0, noop))], views: [{ key: 'hero', label: '3/4', az: 35, el: 22 }] }; },
});

// ---- liftable props -------------------------------------------------------
const LIFT = (radius) => [
  `Liftable by Telekinesis: hold to seize it, it is reeled in and thrown where you aim; a thrown prop kills any hero it hits and is destroyed on impact. Grab radius ${radius} m.`,
  'Also a Shapeshifting disguise: the player turns into this prop and bots ignore it until it moves.',
];
add({
  id: 'prop-car', name: 'Parked car', category: 'liftables', sub: 'Street', tags: ['car', 'vehicle', 'telekinesis', 'disguise', 'downtown', 'suburb'],
  desc: 'Compact sedan with body, hood, glasshouse, roof, bumpers, head and tail lights and four wheels. Parked at the kerb.',
  variants: '8 body colours; parked facing either way along the street.',
  swatches: [{ label: 'Body colours', items: CAR_COLORS.map((c, i) => [`Body ${i + 1}`, c]) }],
  notes: [...LIFT(2.1), 'Spawns at the kerb of 45% of suburban and 55% of downtown blocks.'],
  source: [{ file: 'src/world.js', symbol: 'carGeos' }, { file: 'src/world.js', symbol: 'spawnCar' }],
  async build() { return { objs: [geosGroup(world.propGeos('car'), world.vcMat)], views: [{ key: 'hero', label: '3/4 front', az: 35, el: 20 }, { key: 'rear', label: '3/4 rear', az: 215, el: 20 }] }; },
});
add({
  id: 'prop-bin', name: 'Trash bin', category: 'liftables', sub: 'Street', tags: ['bin', 'trash', 'telekinesis', 'disguise'],
  desc: 'Round street bin with a dark rim lid.', variants: 'Body in green #3f6e4a, grey #555b63 or maroon #6e3f3f.',
  notes: [...LIFT(0.8), 'Spawns on 30% of suburban and 35% of downtown blocks.'],
  source: [{ file: 'src/world.js', symbol: 'propGeos' }, { file: 'src/world.js', symbol: 'spawnBin' }],
  async build() { return { objs: [geosGroup(world.propGeos('bin'), world.vcMat)], views: [{ key: 'hero', label: '3/4', az: 35, el: 22 }] }; },
});
add({
  id: 'prop-bench', name: 'Park bench', category: 'liftables', sub: 'Street', tags: ['bench', 'plaza', 'telekinesis', 'disguise', 'downtown'],
  desc: 'Wooden seat and backrest on two dark metal legs.', variants: 'Single colourway (wood #8a6642, legs #3a4048).',
  notes: [...LIFT(1.4), 'One per downtown plaza, plus 40% of downtown kerbs.'],
  source: [{ file: 'src/world.js', symbol: 'propGeos' }, { file: 'src/world.js', symbol: 'spawnBench' }],
  async build() { return { objs: [geosGroup(world.propGeos('bench'), world.vcMat)], views: [{ key: 'hero', label: '3/4 front', az: 35, el: 20 }] }; },
});

// ---- street & yard props --------------------------------------------------
const PROPS = [
  { id: 'prop-tree', name: 'Tree', sub: 'Yard & park', tags: ['tree', 'foliage', 'suburb', 'park'],
    desc: 'Tapered trunk with a three-blob canopy.', ranges: 'Scaled 0.5–1.6 by placement: ~2.6 m tall at scale 1 (trunk 2.1 m).',
    variants: '5 canopy greens; scale varies per placement (yards 0.7–1.3, parks 0.7–1.6, planters 0.5–0.9).',
    swatches: [{ label: 'Canopy greens', items: CANOPIES.map((c, i) => [`Canopy ${i + 1}`, c]) }],
    notes: ['Collider: 0.4 × scale radius, 2.5 × scale tall.', 'A smaller single-scale tree (0.8) is also a Shapeshifting disguise in the suburbs.'],
    source: [{ file: 'src/world.js', symbol: 'tree' }], make: (vc) => world.tree(vc, 0, 0, 1.2, noop) },
  { id: 'prop-lamppost', name: 'Street lamp', sub: 'Street', tags: ['lamp', 'light', 'downtown', 'disguise'],
    desc: '4.6 m pole with an arm and a lamp head (unlit by day).', variants: 'Single colourway.',
    notes: ['Downtown block corners (60% / 40% of the two corners).', 'Also a Shapeshifting disguise downtown.', 'No collider.'],
    source: [{ file: 'src/world.js', symbol: 'lamppost' }], make: (vc) => world.lamppost(vc, 0, 0) },
  { id: 'prop-mailbox', name: 'Mailbox', sub: 'Yard', tags: ['mailbox', 'suburb', 'disguise'],
    desc: 'Box on a wooden post on the front lawn, beside the walk.', variants: 'Box in red #9a3030, blue #3a66c2 or charcoal #3a3d42.',
    notes: ['On 50% of suburban lots.', 'Also a Shapeshifting disguise.', 'No collider.'],
    source: [{ file: 'src/world.js', symbol: 'buildSuburbBlock' }, { file: 'src/world.js', symbol: 'propGeos' }], make: () => world.propGeos('mailbox') },
  { id: 'prop-hydrant', name: 'Fire hydrant', sub: 'Street', tags: ['hydrant', 'disguise'],
    desc: 'Red hydrant with a cap and side nozzles.', variants: 'Single colourway (#c23a3a).',
    notes: ['Currently only appears as a Shapeshifting disguise, not as world dressing.'],
    source: [{ file: 'src/world.js', symbol: 'propGeos' }], make: () => world.propGeos('hydrant') },
  { id: 'prop-bush', name: 'Bush', sub: 'Yard', tags: ['bush', 'foliage', 'suburb', 'disguise'],
    desc: 'Three overlapping leaf blobs.', variants: '3 greens. Yards use simpler single-blob shrubs (0.35–0.6 m) in the same greens.',
    notes: ['This three-blob version is the Shapeshifting disguise; yard shrubs are single blobs.'],
    source: [{ file: 'src/world.js', symbol: 'propGeos' }], make: () => world.propGeos('bush') },
  { id: 'prop-flowers', name: 'Flower bed', sub: 'Yard & park', tags: ['flowers', 'garden', 'suburb', 'park'],
    desc: 'Raised soil bed with four flower heads.', ranges: 'Bed 1.6 × 0.12 × 1.1 m',
    variants: 'Flower heads are random from 5 colours.', swatches: [{ label: 'Flower colours', items: FLOWERS.map((c, i) => [`Flower ${i + 1}`, c]) }],
    notes: ['On 45% of lots and in every park lot.', 'No collider.'],
    source: [{ file: 'src/world.js', symbol: 'flowerPatch' }], make: (vc) => world.flowerPatch(vc, 0, 0) },
  { id: 'prop-fence', name: 'Picket fence', sub: 'Yard', tags: ['fence', 'suburb'],
    desc: 'Two 4.2 m fence boards with end posts and a gate gap for the front walk.', ranges: 'Run 9.3 m · 0.55 m boards · 0.75 m posts',
    notes: ['On 40% of lots, along the street edge.', 'Currently solid boards: individual pickets would be a good upgrade.', 'No collider.'],
    source: [{ file: 'src/world.js', symbol: 'buildSuburbBlock' }],
    make: (vc) => {
      box(vc, 4.2, 0.55, 0.09, -2.6, 0.32, 0, 0xe8e6df); box(vc, 4.2, 0.55, 0.09, 2.6, 0.32, 0, 0xe8e6df);
      box(vc, 0.12, 0.75, 0.12, -4.6, 0.4, 0, 0xd8d5cc); box(vc, 0.12, 0.75, 0.12, 4.6, 0.4, 0, 0xd8d5cc);
    } },
  { id: 'prop-hedge', name: 'Hedge row', sub: 'Yard', tags: ['hedge', 'foliage', 'suburb'],
    desc: 'A single clipped hedge block along the street edge.', ranges: '9 × 0.7 × 0.55 m', variants: 'Green #3f7a30 or #4f8f3a.',
    notes: ['On lots that did not get a fence (about 24%).', 'No collider.'],
    source: [{ file: 'src/world.js', symbol: 'buildSuburbBlock' }],
    make: (vc) => box(vc, 9, 0.7, 0.55, 0, 0.4, 0, 0x4f8f3a, { shade: 0.12 }) },
  { id: 'prop-fountain', name: 'Plaza fountain', sub: 'Plaza', tags: ['fountain', 'plaza', 'downtown', 'water'],
    desc: 'Stone basin, central column and a water bulb at the centre of a downtown plaza.', ranges: 'Basin r 1.6–1.9 × 0.5 m; overall 2 m tall',
    notes: ['The basin rim is a walkable platform 0.6 m high.', 'Water is a solid blob today: animated water is an obvious upgrade.', '16% of downtown blocks are plazas.'],
    source: [{ file: 'src/world.js', symbol: 'buildDowntownBlock' }],
    make: (vc) => { cylinder(vc, 1.6, 1.9, 0.5, 12, 0, 0.35, 0, 0x8d9299); cylinder(vc, 0.4, 0.5, 1.3, 8, 0, 1.0, 0, 0x9fb8c9); blob(vc, 0.42, 0, 1.75, 0, 0xbfe0f2); } },
  { id: 'prop-plaza-tree', name: 'Plaza tree platter', sub: 'Plaza', tags: ['tree', 'plaza', 'downtown', 'planter'],
    desc: 'Square stone platter with a small tree, three per plaza.', ranges: 'Platter 1.8 × 0.5 × 1.8 m; tree scale 0.6–0.9',
    notes: ['The platter top is a walkable platform 0.6 m high; the tree has a collider.'],
    source: [{ file: 'src/world.js', symbol: 'buildDowntownBlock' }],
    make: (vc) => { box(vc, 1.8, 0.5, 1.8, 0, 0.35, 0, 0x7e838a); world.tree(vc, 0, 0, 0.75, noop); } },
  { id: 'prop-planter', name: 'Street planter', sub: 'Street', tags: ['tree', 'planter', 'downtown'],
    desc: 'Low concrete planter with a young tree at the kerb.', ranges: 'Planter 1.4 × 0.4 × 1.4 m; tree scale 0.5–0.75',
    notes: ['On 45% of downtown blocks. The planter top is walkable (0.48 m).'],
    source: [{ file: 'src/world.js', symbol: 'buildDowntownBlock' }],
    make: (vc) => { box(vc, 1.4, 0.4, 1.4, 0, 0.28, 0, 0x7e838a); world.tree(vc, 0, 0, 0.62, noop); } },
];
for (const pr of PROPS) {
  add({
    category: 'props', variants: 'Single colourway.', ...pr,
    async build() {
      const vc = [];
      const r = pr.make(vc);
      const g = geosGroup(Array.isArray(r) ? r : vc, world.vcMat);
      return { objs: [g], views: [{ key: 'hero', label: '3/4', az: 35, el: 20 }] };
    },
  });
}

// ---- environment ----------------------------------------------------------
function chunkOf(theme, accept, key) {
  const orig = world.themeAt;
  world.themeAt = () => theme;
  try {
    for (let k = 0; k < 60; k++) {
      reseed(`${key}-${k}`);
      const c = world.buildChunk(0, 0);
      if (accept(c)) return c;
      world.scene.remove(c.group);
      disposeObjs([c.group]);
    }
  } finally { world.themeAt = orig; }
  throw new Error('no matching chunk for ' + key);
}
const BLOCK_NOTE = `Chunks are ${CONFIG.BLOCK + CONFIG.ROAD} m square (a ${CONFIG.BLOCK} m block plus half a ${CONFIG.ROAD} m road each side) and stream in around the player, ${CONFIG.CHUNK_RADIUS} chunks in every direction. Each chunk samples a drifting noise field to pick its biome, so suburbs and downtown blend.`;
const BLOCKS = [
  { id: 'block-suburb', name: 'Suburban block', theme: 'suburb', sub: 'City block',
    desc: 'A full suburban chunk: four house lots (some parks), yards, fences or hedges, mailboxes, sheds, trees, parked car and the ground tile.',
    accept: (c) => c.colliders.length >= 6 },
  { id: 'block-downtown', name: 'Downtown block', theme: 'downtown', sub: 'City block',
    desc: 'A full downtown chunk: one or two towers on a raised 0.14 m concrete slab, kerb props, lamps and the ground tile.',
    accept: (c) => c.colliders.filter((k) => k.h > 12).length >= 2 },
  { id: 'block-plaza', name: 'Downtown plaza', theme: 'downtown', sub: 'City block',
    desc: 'A downtown chunk built as an open plaza: fountain, three tree platters and a bench on the concrete slab.',
    accept: (c) => c.colliders.every((k) => k.h < 6) },
];
for (const bl of BLOCKS) {
  add({
    id: bl.id, name: bl.name, category: 'environment', sub: bl.sub, tags: ['block', 'chunk', bl.theme, 'layout'],
    desc: bl.desc, notes: [BLOCK_NOTE], variants: 'Every chunk is generated fresh; this is one seeded example.',
    source: [{ file: 'src/world.js', symbol: 'buildChunk' }, { file: 'src/world.js', symbol: bl.theme === 'suburb' ? 'buildSuburbBlock' : 'buildDowntownBlock' }],
    async build({ scene }) {
      const c = chunkOf(bl.theme, bl.accept, bl.id);
      scene.add(c.group);
      return {
        objs: [c.group],
        views: [{ key: 'hero', label: 'Aerial 3/4', az: 35, el: 40, catcher: false }, { key: 'plan', label: 'Plan view', az: 0, el: 90, fov: 30, catcher: false }],
      };
    },
  });
}
for (const theme of ['suburb', 'downtown']) {
  add({
    id: `ground-${theme}`, name: `Ground tile — ${theme === 'suburb' ? 'suburb' : 'downtown'}`, category: 'environment', sub: 'Ground texture',
    tags: ['ground', 'texture', 'road', 'sidewalk', 'crosswalk', theme],
    desc: `The ${CONFIG.BLOCK + CONFIG.ROAD} m ground tile under every ${theme} chunk: roads with lane dashes, kerbs, a sidewalk ring, crosswalks near corners and the ${theme === 'suburb' ? 'lawn' : 'paved'} interior.`,
    variants: 'One shared texture per biome (512 × 512 canvas, drawn at start-up).',
    notes: ['Mapped once per chunk with no tiling; neighbouring tiles line up at the road centre lines.'],
    source: [{ file: 'src/world.js', symbol: 'makeGroundTile' }],
    async build() {
      const m = new THREE.Mesh(world.groundGeo, world.groundMats[theme]);
      m.userData.shared = true;
      return { objs: [m], noColors: true, views: [{ key: 'hero', label: 'Top down', az: 0, el: 90, fov: 20, catcher: false, margin: 0.98 }] };
    },
  });
}
add({
  id: 'env-sky', name: 'Sky dome & clouds', category: 'environment', sub: 'Sky', tags: ['sky', 'clouds', 'fog', 'lighting', 'daytime'],
  desc: 'Permanent daytime sky: a vertex-coloured gradient dome (horizon to zenith) with ten drifting cloud sprites, distance fog and a warm sun.',
  rows: [['Dome', 'Sphere r 420 m, follows the player'], ['Clouds', '10 sprites, 34–64 m wide, 58–95 m up, drifting 0.9–2.2 m/s'],
    ['Fog', '#cfe5f8 from 60 m to 142 m'], ['Sun', '#fff2d5 at 1.7, from (60, 110, 40)'], ['Hemisphere light', 'sky #d6e9ff / ground #5d7a4d at 0.95']],
  swatches: [{ label: 'Sky gradient', items: [['Horizon', 0xe8f2fb], ['Mid sky', 0xa9d3f5], ['Zenith', 0x4f9df0], ['Fog', 0xcfe5f8]] }],
  variants: 'Single look for both biomes.', notes: ['The cloud sprite is a soft procedural blob texture (128 × 64).'],
  source: [{ file: 'src/world.js', symbol: 'buildSky' }],
  async build({ scene }) {
    scene.add(world.skyDome);
    for (const c of world.clouds) scene.add(c.spr);
    return {
      objs: [world.skyDome], noColors: true, noSize: true,
      views: [{ key: 'hero', label: 'Looking toward the horizon', w: 960, h: 540, camera: { pos: [0, 2, 0], target: [0, 26, -100] }, fov: 70, catcher: false }],
    };
  },
});

// ---- collectibles ---------------------------------------------------------
add({
  id: 'col-token', name: 'Token coin', category: 'collectibles', sub: 'Token', tags: ['token', 'coin', 'money', 'pickup'],
  desc: 'Gold coin that spins and bobs above the street. Walking through it adds a little to your round total.',
  rows: [['In world', `${CONFIG.TOKEN_COUNT} at a time`], ['Value', `${CONFIG.TOKEN_VALUE} × bet each`], ['Respawn', '5–14 s after pickup'], ['Motion', 'Spins 2.2 rad/s, bobs ±0.12 m at 0.75 m']],
  variants: 'Single look; drawn as one instanced mesh.', notes: ['Emissive gold (#ffd166, glow #aa7a1e).'],
  source: [{ file: 'src/collectibles.js', symbol: 'makeTokenParts' }],
  async build() {
    const { geo, mat } = makeTokenParts();
    const m = new THREE.Mesh(geo, mat);
    m.position.y = 0.75; m.rotation.y = 1.75;   // three-quarter on, so the rim reads
    return { objs: [m], views: [{ key: 'hero', label: 'Hovering', az: 30, el: 14 }] };
  },
});
const ITEM_FX = {
  absorb: 'For 45 s, killing a hero with a different power steals that power.',
  twopower: 'For 30 s you also hold a random second power; the power button fires both.',
  extraswitch: 'Adds one extra power switch for the round.',
  enlarge: 'Grow to 2.3× for 15 s: faster, one-hit kills, and you crush heroes you walk over.',
  fireball: 'Arms a fireball; your next attack launches it (7.5 m blast).',
  landing: 'Launches you 10 m up; steer during a short hang, then slam down like a meteor and kill everything within 8.5 m.',
};
const itemEntry = (kind, def, color) => ({
  id: `${kind}-${def.id}`, name: `${def.name} ${kind}`, category: 'collectibles', sub: kind === 'pill' ? 'Pill' : 'Potion',
  tags: [kind, def.id, 'pickup', 'powerup'],
  desc: ITEM_FX[def.id],
  rows: [['Spawn odds', `${Math.round(def.p * 100)}% of ${kind}s`], ['In world', `${kind === 'pill' ? CONFIG.PILL_COUNT : CONFIG.POTION_COUNT} ${kind}s at a time`], ['Respawn', '18–30 s after pickup'], ...(def.duration ? [['Duration', `${def.duration} s`]] : [])],
  swatches: [{ label: 'Colour', items: [[def.name, color]] }],
  variants: 'Shape is shared by every ' + kind + '; colour identifies the effect.',
  notes: [
    `Floats at 1 m, bobbing ±0.18 m and spinning, over a soft glow disc in the same colour.`,
    `The HUD buff chip still uses an emoji (${def.emblem}) as its icon: it needs a matching icon.`,
    ...(kind === 'pill' ? ['The glow disc is parented to the tilted pill, so in game it tilts and wobbles with it (visible in the render).'] : []),
  ],
  source: [{ file: 'src/collectibles.js', symbol: kind === 'pill' ? 'makePillMesh' : 'makePotionMesh' }, { file: 'src/config.js', symbol: kind === 'pill' ? 'PILLS' : 'POTIONS' }],
  async build() {
    const m = kind === 'pill' ? makePillMesh(color) : makePotionMesh(color);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = -0.85; glow.userData.noShadow = true; glow.userData.noBounds = true;
    m.add(glow);
    m.position.y = 1; m.rotation.y = 0.7;
    return { objs: [m], subject: subjectAt([0, 0.75, 0], [1.9, 1.5, 1.9]), views: [{ key: 'hero', label: 'Floating', az: 30, el: 14 }] };
  },
});
for (const d of CONFIG.PILLS) add(itemEntry('pill', d, PILL_COLORS[d.id]));
for (const d of CONFIG.POTIONS) add(itemEntry('potion', d, POTION_COLORS[d.id]));

// ---- effects ----------------------------------------------------------------
const fxView = (extra) => ({ key: 'hero', label: 'In action', bg: FX_BG, ...extra });
add({
  id: 'fx-ice', name: 'Ice block (frozen hero)', category: 'effects', sub: 'Cryokinesis', tags: ['ice', 'freeze', 'cryo', 'overlay'],
  desc: 'A translucent ice block encases a hero frozen by Cryokinesis. Frozen heroes shatter in one hit: the block bursts into shards and frost and the body vanishes.',
  rows: [['Block', '1.15 × 2.45 × 0.95 m, scaled to the hero'], ['Material', 'Lambert #9df2ff at 55% opacity'], ['Shatter burst', '44 shards #9df2ff, 26 frost puffs #ffffff, 18 chips #5fb9ff, shockwave ring']],
  swatches: [{ label: 'Ice', items: [['Block', 0x9df2ff], ['Shard', 0x5fb9ff]] }], variants: 'Single look.',
  source: [{ file: 'src/entities.js', symbol: 'iceShell' }, { file: 'src/game.js', symbol: "cause === 'shatter'" }],
  async build({ scene }) {
    const ch = hero(scene, 'speed');
    settle(ch, 90);
    ch.freeze(1e6);
    ch.update(1 / 60, 2);
    return { objs: heroObjs(ch), views: [fxView({ az: 30, el: 12, fov: 24, bg: null })], cleanup() { ch.dispose(); } };
  },
});
add({
  id: 'fx-words', name: 'Impact words', category: 'effects', sub: 'Combat feedback', tags: ['onomatopoeia', 'comic', 'text', 'pow', 'sprite', 'font'],
  desc: 'Comic onomatopoeia that pops out of every landed blow: bold Bangers text with an ink outline, tinted a random bright colour at 90% opacity, drawn in the scene just behind the impact.',
  rows: [['Font', 'Bangers, 96 px canvas texture, 12 px ink stroke'], ['Life', '1 s: elastic pop-in, hold, drift up and fade'], ['Pool', 'Up to 14 on screen'],
    ['Word sets', 'hit · kill · fire · shatter · slam · hurt · boom · squish']],
  lists: [{ label: 'Words', items: ['POW!', 'WHAM!', 'SMACK!', 'BIFF!', 'THWACK!', 'BONK!', 'WHACK!', 'BAM!', 'KAPOW!', 'CRUNCH!', 'BLAM!', 'KRAK!', 'WHAMMO!', 'KA-BLAM!', 'FWOOSH!', 'KABOOM!', 'BLAZE!', 'CRACK!', 'SHATTER!', 'KRISH!', 'SLAM!', 'CRASH!', 'WHUMP!', 'OOF!', 'OUCH!', 'UGH!', 'ARGH!', 'BOOM!', 'KRAKOOM!', 'SQUISH!', 'SPLAT!'] }],
  swatches: [{ label: 'Tint palette', items: ['#ffe45c', '#ff6b6b', '#7dffca', '#8ecbff', '#ff9de2', '#ffb347', '#c9ff5c', '#c07bff', '#ffffff'].map((h) => [h, parseInt(h.slice(1), 16)]) }],
  variants: 'Word and tint are random per hit; size scales with the hit type and camera distance.',
  source: [{ file: 'src/bam.js', symbol: 'class BamText' }, { file: 'src/game.js', symbol: 'BAM_WORDS' }],
  async build({ scene }) {
    const bt = new BamText(scene);
    const words = [['POW!', -3.4, 2.7], ['KAPOW!', 0, 2.9], ['FWOOSH!', 3.4, 2.6], ['CRACK!', -3.3, 0.9], ['SLAM!', 0.1, 1.1], ['OOF!', 3.3, 0.9]];
    for (const [w, x, y] of words) bt.spawn(x, y, 0, w, { size: 2.1 });
    for (let i = 0; i < 24; i++) bt.update(1 / 60);
    return {
      objs: [], subject: subjectAt([0, 1.9, 0], [7.5, 3.6, 0.5]), noSize: true, noColors: true,
      views: [fxView({ w: 900, h: 480, camera: { pos: [0, 1.9, 13], target: [0, 1.9, 0] }, fov: 26, catcher: false })],
      stats: { tris: 2 * words.length, verts: 4 * words.length, materials: ['Sprite (canvas text texture, 90% opacity)'] },
    };
  },
});
add({
  id: 'fx-fireball', name: 'Fireball', category: 'effects', sub: 'Potion / hunters', tags: ['fireball', 'fire', 'projectile', 'particles', 'explosion'],
  desc: 'Projectile made entirely of particles: an orange core trail with yellow sparks. Explodes on contact with a 60-particle burst, a shockwave ring and a KABOOM.',
  rows: [['Speed', '26 m/s (hunters: 22 m/s, homing)'], ['Blast', '7.5 m radius'], ['Trail per frame', '6 orange #ff7a3c (size 2.6) + 2 yellow #ffd166']],
  swatches: [{ label: 'Fire', items: [['Core', 0xff7a3c], ['Sparks', 0xffd166]] }], variants: 'Single look.',
  source: [{ file: 'src/game.js', symbol: 'launchFireball' }, { file: 'src/game.js', symbol: 'updateProjectiles' }, { file: 'src/fx.js', symbol: 'emit' }],
  async build({ scene }) {
    const fx = new FX(scene);
    const p = new V3(-7, 1.4, 0), dt = 1 / 60;
    for (let i = 0; i < 26; i++) {
      p.x += 26 * dt;
      fx.emit(p.x, p.y, p.z, { count: 6, color: 0xff7a3c, speed: 2.5, life: 0.45, size: 2.6, gravity: 2, jitter: 0.35 });
      fx.emit(p.x, p.y, p.z, { count: 2, color: 0xffd166, speed: 2, life: 0.3, size: 2 });
      fx.update(dt);
    }
    return {
      objs: [], subject: subjectAt([-2.5, 1.4, 0], [10, 3, 2]), noSize: true, noColors: true,
      views: [fxView({ w: 900, h: 420, camera: { pos: [-1.6, 2.2, 11], target: [-1.6, 1.4, 0] }, fov: 34, catcher: false })],
      stats: { materials: ['Points (custom shader, additive)'] },
      cleanup() { scene.remove(fx.points); },
    };
  },
});
add({
  id: 'fx-landing', name: 'Superhero landing impact', category: 'effects', sub: 'Potion', tags: ['shockwave', 'ring', 'landing', 'meteor', 'impact', 'particles'],
  desc: 'The Superhero Landing touchdown: gold and white shockwave rings, a burst of 60 gold particles, screen flash and shake, played over the landing pose. A gold ring also pulses on the ground below the player while they steer the drop.',
  rows: [['Rings', 'Gold #ffd166 to 9 m over 0.7 s, white to 5 m over 0.5 s'], ['Burst', '60 particles, 12 m/s'], ['Kill radius', '8.5 m']],
  swatches: [{ label: 'Impact', items: [['Gold', 0xffd166], ['White', 0xffffff]] }], variants: 'Single look.',
  source: [{ file: 'src/game.js', symbol: 'superheroLanding' }, { file: 'src/fx.js', symbol: 'ring' }],
  async build({ scene }) {
    const ch = hero(scene, 'flight');
    settle(ch, 20);
    ch.anim.startOverride('superhero_landing', { mode: 'death', timeScale: 1, end: 1, fade: 0.001 });
    for (let i = 0; i < 40; i++) ch.update(1 / 60, i / 60);
    const fx = new FX(scene);
    fx.ring(0, 0, { color: 0xffd166, maxR: 9, dur: 0.7 });
    fx.ring(0, 0, { color: 0xffffff, maxR: 5, dur: 0.5 });
    fx.emit(0, 0.6, 0, { count: 60, color: 0xffd166, speed: 12, life: 0.8, size: 2.2 });
    for (let i = 0; i < 12; i++) fx.update(1 / 60);
    return {
      objs: heroObjs(ch), subject: subjectAt([0, 1, 0], [10, 2.5, 10]), noColors: true, noSize: true,
      views: [fxView({ az: 25, el: 30, fov: 34, margin: 0.95 })],
      measure: [], stats: { tris: 160, verts: 82, materials: ['Mesh rings (Basic, additive)', 'Points (custom shader, additive)'] },
      cleanup() { ch.dispose(); },
    };
  },
});
add({
  id: 'fx-telekinesis', name: 'Telekinesis grip', category: 'effects', sub: 'Telekinesis', tags: ['telekinesis', 'aura', 'purple', 'particles', 'lift'],
  desc: 'While Telekinesis holds a target it floats in a purple haze of rising sparks, with a ring pulsing on the ground every 0.3 s. Held heroes loop a flailing hit reaction.',
  rows: [['Particles', '2 per frame, #c07bff, rising'], ['Ring', '2.2 m every 0.3 s'], ['Lift', '3 m up, then reeled in at 8 m/s and thrown at 27 m/s']],
  swatches: [{ label: 'Telekinesis', items: [['Purple', 0xc07bff]] }], variants: 'Single look; also used on lifted props (cars, bins, benches).',
  source: [{ file: 'src/game.js', symbol: 'updateTelekinesis' }],
  async build({ scene }) {
    const caster = hero(scene, 'telekinesis');
    const victim = hero(scene, 'speed');
    caster.pos.set(-1.8, 0, 0); caster.yaw = Math.PI / 2; caster.prevYaw = caster.yaw;
    victim.pos.set(1.8, 0, 0); victim.altitude = 2.2;
    settle(caster, 10); settle(victim, 10);
    caster.cast('telekinesis', true);
    victim.setHeld(true);
    const fx = new FX(scene);
    for (let i = 0; i < 60; i++) {
      caster.update(1 / 60, i / 60); victim.update(1 / 60, i / 60);
      fx.emit(1.8, 2.2 + 1.2, 0, { count: 2, color: 0xc07bff, speed: 1.6, life: 0.45, size: 1.5, gravity: 2, jitter: 0.7 });
      if (i % 18 === 0) fx.ring(1.8, 0, { color: 0xc07bff, maxR: 2.2, dur: 0.4 });
      fx.update(1 / 60);
    }
    return {
      objs: [...heroObjs(caster), ...heroObjs(victim)], noColors: true, noSize: true,
      subject: subjectAt([0, 2.1, 0], [6.4, 4.6, 2.5]),
      views: [fxView({ az: 12, el: 10, fov: 28, margin: 0.9 })],
      stats: { materials: ['Points (custom shader, additive)', 'Mesh rings (Basic, additive)'] },
      cleanup() { caster.dispose(); victim.dispose(); },
    };
  },
});
add({
  id: 'fx-flame', name: 'Flame cone', category: 'effects', sub: 'Pyrokinesis', tags: ['fire', 'flame', 'pyro', 'cone', 'particles'],
  desc: 'Pyrokinesis channels a roaring cone of orange flame with yellow cores straight ahead of the hero, incinerating anyone within 8.5 m inside the cone.',
  rows: [['Emission', '10 orange #ff7a3c (size 2.6) + 3 yellow #ffd166 per frame'], ['Reach', '8.5 m, about 45° wide']],
  swatches: [{ label: 'Flame', items: [['Flame', 0xff7a3c], ['Core', 0xffd166]] }], variants: 'Single look.',
  source: [{ file: 'src/game.js', symbol: 'flameUntil' }, { file: 'src/fx.js', symbol: 'emitDir' }],
  async build({ scene }) {
    const ch = hero(scene, 'pyro');
    ch.yaw = Math.PI / 2; ch.prevYaw = ch.yaw; ch.pos.set(-3, 0, 0);
    settle(ch, 10);
    ch.cast('pyro');
    const fx = new FX(scene), d = new V3(1, 0.05, 0);
    for (let i = 0; i < 30; i++) {
      ch.update(1 / 60, i / 60);
      fx.emitDir(-2, 1.3, 0, d, { count: 10, color: 0xff7a3c, speed: 15, life: 0.5, size: 2.6, cone: 0.22, gravity: 2 });
      fx.emitDir(-2, 1.3, 0, d, { count: 3, color: 0xffd166, speed: 13, life: 0.35, size: 2, cone: 0.18 });
      fx.update(1 / 60);
    }
    return {
      objs: heroObjs(ch), subject: subjectAt([1.5, 1.2, 0], [10, 3, 3]), noColors: true, noSize: true,
      views: [fxView({ w: 900, h: 420, camera: { pos: [1.2, 2.4, 9.5], target: [1.2, 1.2, 0] }, fov: 36, catcher: false })],
      stats: { materials: ['Points (custom shader, additive)'] },
      cleanup() { ch.dispose(); },
    };
  },
});
add({
  id: 'fx-aura', name: 'Power aura & shadow', category: 'effects', sub: 'Every hero', tags: ['aura', 'ring', 'shadow', 'power colour'],
  desc: 'Every hero stands on a slowly spinning, pulsing ring in their power\'s colour, over a soft round blob shadow. It is the main way to read a hero\'s power at a distance.',
  rows: [['Aura', 'Ring 0.55–0.85 m, 55% opacity, spins 1.5 rad/s, pulses ±12%'], ['Blob shadow', 'Disc 0.62 m, 30% black, fades with altitude']],
  swatches: [{ label: 'Power colours', items: POWERS.map((p) => [p.name, p.color]) }],
  variants: 'Colour follows the power (one of 10).',
  source: [{ file: 'src/entities.js', symbol: 'this.aura' }],
  async build({ scene }) {
    const ids = ['flight', 'pyro', 'teleport'];
    const chars = ids.map((id, i) => { const ch = hero(scene, id); ch.aura.visible = true; ch.blobShadow.visible = true; ch.pos.set((i - 1) * 1.9, 0, 0); settle(ch, 60); return ch; });
    return {
      objs: chars.flatMap(heroObjs), noColors: true, noSize: true,
      views: [fxView({ az: 20, el: 34, fov: 26, margin: 0.9, catcher: false })],
      stats: { tris: 56 + 20, verts: 58 + 22, materials: ['Mesh ring (Basic, 55% opacity)', 'Mesh disc (Basic, 30% opacity)'] },
      cleanup() { chars.forEach((c) => c.dispose()); },
    };
  },
});

// ---- power icons ------------------------------------------------------------
async function svgToPng(svg, size = 512) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const pad = size * 0.1;
  c.getContext('2d').drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
  return c.toDataURL('image/png');
}
for (const p of POWERS) {
  const svg = powerIcon(p.id, '512').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  add({
    id: `icon-${p.id}`, name: `${p.name} icon`, category: 'icons', sub: 'Power icon', tags: ['icon', 'ui', 'svg', p.id],
    desc: `UI icon for ${p.name}: a flat shape in the power colour with a heavy ink outline and a lighter glint, matching the comic style. Used in the menu power grid, the switch overlay, the HUD power button, buff chips and announcements.`,
    rows: [['Format', 'Inline SVG, 64 × 64 viewBox, ink outline 3.5 units (#141018)'], ['Power colour', hex(p.color)]],
    swatches: [{ label: 'Colours', items: [['Power', p.color], ['Ink', 0x141018]] }],
    variants: 'One per power. A lighter tint (45% toward white) is derived automatically for highlights.',
    source: [{ file: 'src/icons.js', symbol: p.id + ':' }],
    svg,
    async build() {
      return { objs: [], noSize: true, noColors: true, images: [{ key: 'hero', label: 'Icon (512 px)', w: 512, h: 512, data: await svgToPng(svg) }], stats: { materials: ['SVG'] } };
    },
  });
}

// ---- animations (added once the clip library is loaded) ---------------------
function addAnimations() {
  const groupOf = (k) => Object.entries(CLIP_GROUPS).find(([, ks]) => ks.includes(k))?.[0] || 'attack';
  const usedBy = {};
  const use = (k, s) => (usedBy[k] = usedBy[k] || []).push(s);
  for (const p of POWERS) {
    const a = ARCHETYPES[p.id];
    use(a.idle, `${p.name} hero: idle`);
    use(a.cast, `${p.name} hero: power cast`);
    a.combat.moves.forEach((m, i) => use(m, `${p.name} hero: attack ${i + 1} of ${a.combat.moves.length}`));
  }
  const FIXED = {
    walking_2: 'Every hero: walk', fast_run_4: 'Every hero: run', walking_backwards: 'Every hero: walk backward', running_backward_2: 'Every hero: run backward',
    flying: 'Flyers: cruising', flying_idle: 'Flyers: hovering, slowing down and drifting backward',
    reaction: 'Every hero: hit reaction (random of three)', reaction_2: 'Every hero: hit reaction (random of three); telekinesis victims loop it while held', reaction_3: 'Every hero: hit reaction (random of three)',
    falling_back_death: 'Every hero: death when hit from the front', falling_forward_death: 'Every hero: death when hit from behind', flying_back_death_3: 'Every hero: death by fire, ice or a telekinesis slam',
    superhero_landing: 'Superhero Landing potion: touchdown pose', fist_pump: 'Emote (currently unused; was the old nemesis-kill celebration)',
  };
  for (const [k, s] of Object.entries(FIXED)) use(k, s);
  const unit = 1.85 / (ANIM.unitHeight * 0.93);
  const title = (k) => k.replace(/_(\d+)$/, ' $1').split('_').map((w) => (w === 'mma' ? 'MMA' : /^\d/.test(w) ? w : w[0].toUpperCase() + w.slice(1))).join(' ').replace(/ (\d+)$/, ' $1');

  for (const key of Object.keys(ANIM.clips)) {
    const group = groupOf(key);
    const dur = ANIM.duration[key];
    const frames = Math.round(dur * ANIM.fps) + 1;
    const imp = ANIM.impacts[key] || [];
    const rx = ANIM.rootXZ[key];
    const travel = rx ? Math.hypot(rx[rx.length - 2] - rx[0], rx[rx.length - 1] - rx[1]) * unit : 0;
    const loops = ['idle', 'locomotion', 'flight'].includes(group);
    let fr = [0.04, 0.34, 0.64, 0.94];
    if (group === 'attack' && imp.length) {
      const f = imp[0] / dur;
      fr = [0.04, Math.max(0.1, f - 0.16), f, Math.min(0.97, f + 0.22)];
    }
    add({
      id: `anim-${key}`, name: title(key), category: 'animations', sub: CLIP_GROUP_NAME[group], tags: [key, group, 'mixamo', 'clip'],
      desc: `Baked Mixamo clip, ${CLIP_GROUP_NAME[group].toLowerCase()}. ${(usedBy[key] || ['Not referenced by any hero yet.']).join('. ')}.`,
      duration: r2(dur), frames,
      rows: [
        ['Clip key', key], ['Duration', `${r2(dur)} s (${frames} frames at ${ANIM.fps} fps)`], ['Playback', loops ? 'Looping base layer' : 'One-shot, full-body override'],
        ...(imp.length ? [['Impact frames', imp.map((t) => `${r2(t)} s`).join(', ') + ' (damage lands here)']] : []),
        ['Root travel', travel > 0.05 ? `${r2(travel)} m forward over the clip (applied as movement)` : 'In place'],
        ['Frames shown', fr.map((f) => `${r2(f * dur)} s`).join(' · ')],
      ],
      lists: [{ label: 'Used by', items: usedBy[key] || ['Nothing yet'] }],
      variants: group === 'attack' ? 'Played at 1.25 × the hero\'s swing speed; multi-hit clips deal 60% per hit.' : 'Shared by every hero.',
      notes: ['Rendered on the Super Speed hero; root motion is held in place so the four frames line up.'],
      source: [{ file: 'src/anim.js', symbol: 'class Animator' }, { file: 'scripts/bake-anims.mjs', symbol: 'impacts' }],
      async build({ scene }) {
        const az = 50, a = rad(az);
        const right = new V3(Math.cos(a), 0, -Math.sin(a));
        const yaw = a + Math.PI / 2 - 0.5;
        const sp = group === 'flight' || group === 'death' ? 2.9 : 2.2;
        const chars = fr.map((f, i) => {
          const ch = hero(scene, 'speed');
          const slot = right.clone().multiplyScalar((i - 1.5) * sp);
          ch.yaw = ch.prevYaw = yaw;
          ch.pos.copy(slot);
          if (group === 'flight') { ch.flying = true; ch.altitude = 2.8; }   // above the take-off float band
          ch.update(1 / 60, 0);
          ch.anim.startOverride(key, { mode: 'death', timeScale: 1, end: 1, fade: 0.001 });
          const target = Math.max(1 / 120, f * dur);
          let t = 0;
          while (t < target - 1e-6) { const dt = Math.min(1 / 60, target - t); ch.update(dt, t); t += dt; ch.pos.copy(slot); }
          ch.update(1e-4, t);
          return ch;
        });
        return {
          objs: chars.flatMap(heroObjs), noColors: true, noSize: true,
          // the row runs along screen-right, so frame it by its width directly (an
          // axis-aligned box around a diagonal row would push the camera far back)
          subject: subjectAt([0, group === 'flight' ? 3.3 : 1.0, 0], [2 * (1.5 * sp + 1), 2.4, 1]),
          views: [{ key: 'hero', label: 'Four frames', w: 1120, h: 420, az, el: 8, fov: 22,
            dist: (1.5 * sp + 1) / (Math.tan(rad(11)) * (1120 / 420) * 0.94) }],
          stats: {},
          cleanup() { chars.forEach((c) => c.dispose()); },
        };
      },
    });
  }
}

// ---------------------------------------------------------------------------
// driver API
// ---------------------------------------------------------------------------

const META_KEYS = ['id', 'name', 'category', 'sub', 'tags', 'desc', 'notes', 'variants', 'ranges', 'rows', 'lists', 'swatches', 'source', 'svg', 'duration', 'frames', 'sizeNote'];

async function render(id) {
  const e = BY_ID[id];
  if (!e) throw new Error('unknown asset ' + id);
  reseed(id);
  const stage = makeStage();
  const res = await e.build({ scene: stage.scene, stage });
  const objs = res.objs || [];
  for (const root of objs) if (!root.parent) stage.scene.add(root);
  for (const root of objs) root.traverse((m) => { if (m.isMesh && !m.userData.noShadow) { m.castShadow = true; m.receiveShadow = true; } });

  let images = res.images || [];
  if (!res.images) {
    const subj = res.subject || subjectOf(objs);
    for (const v of res.views) {
      if (v.prepare) await v.prepare();
      const sj = typeof v.subject === 'function' ? v.subject() : (v.subject || subj);
      images.push(shoot(stage, sj, v));
      if (v.after) v.after();
    }
  }

  const measure = res.measure || objs;
  const out = {};
  for (const k of META_KEYS) if (e[k] !== undefined) out[k] = e[k];
  if (res.info) {
    if (res.info.rows) out.rows = [...(out.rows || []), ...res.info.rows];
    if (res.info.lists) out.lists = [...(out.lists || []), ...res.info.lists];
  }
  const stats = res.stats || statsOf(measure);
  Object.assign(out, stats);
  if (!res.noSize && measure.length) {
    const b = boundsOf(measure), s = b.getSize(new V3());
    out.size = { w: r2(s.x), h: r2(s.y), d: r2(s.z) };
  }
  if (!res.noColors && measure.length) out.colors = dominantColors(measure);
  out.images = images;

  res.cleanup?.();
  disposeObjs(objs);
  renderer.renderLists.dispose();
  return out;
}

window.CATALOG = {
  ready: false,
  error: null,
  categories: CATEGORIES,
  list: () => ENTRIES.map((e) => e.id),
  render,
};

(async () => {
  try {
    await loadAnimLib('/anims.json');
    await document.fonts.load('96px Bangers');
    reseed('world');
    world = new World(new THREE.Scene());
    addAnimations();
    window.CATALOG.ready = true;
  } catch (err) {
    window.CATALOG.error = String(err && err.stack || err);
  }
})();
