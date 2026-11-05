// One hero archetype per superpower. Each entry defines physique, age cues,
// hair, face gear, suit design, cape length, a base palette, and the
// archetype's fighting style. Every instance varies its palette around the
// base so the lobby stays colourful while powers stay readable at a glance.
import * as THREE from 'three';

// `idle`, `cast` and `combat.moves` name baked Mixamo clips (see
// scripts/bake-anims.mjs / public/anims.json). Impact frames come from the
// bake; archetype `combat.speed` scales playback so heavy hitters swing slow.

export const ARCHETYPES = {
  flight: {
    idle: 'ninja_idle_3', cast: 'spell_cast',
    build: { height: 1.0, shoulder: 1.0, mass: 0.95, waist: 0.9, legLen: 1.02, definition: 0.9 },
    age: 32, hair: 'surfer', hairColor: 0xc9a25a, facialHair: null,
    gear: ['aviatorGoggles'], cape: 'short',
    palette: { primary: 0x2c5fd9, secondary: 0x12244f, accent: 0xf4f1e6, glow: 0x8ecbff },
    hueRange: 0.12,
    suit: 'flight',
    combat: { style: 'aerial', speed: 1.1, damage: 46, range: 2.6, arc: 0.4, moves: ['flying_kick', 'jab_cross', 'side_kick', 'roundhouse_kick_2'] },
  },
  speed: {
    idle: 'ninja_idle_3', cast: 'spell_cast',
    build: { height: 0.96, shoulder: 0.88, mass: 0.75, waist: 0.82, legLen: 1.05, definition: 0.85 },
    age: 22, hair: 'spiky', hairColor: 0x24211f, facialHair: null,
    gear: ['speedShades', 'lightningBoots'], cape: null,
    palette: { primary: 0xf2b21a, secondary: 0xb3261e, accent: 0xfff3c4, glow: 0xffe45c },
    hueRange: 0.1,
    suit: 'speed',
    combat: { style: 'flurry', speed: 1.55, damage: 30, range: 2.3, arc: 0.45, moves: ['jab_cross', 'uppercut_jab', 'elbow_uppercut_combo', 'mma_kick_2'] },
  },
  invisibility: {
    idle: 'ninja_idle_3', cast: 'spell_cast',
    build: { height: 0.99, shoulder: 0.95, mass: 0.9, waist: 1.0, legLen: 1.0, definition: 0.6 },
    age: 52, hair: 'bald', hairColor: 0x000000, facialHair: null,
    gear: ['facelessMask'], cape: null,
    palette: { primary: 0x6f7688, secondary: 0x3a3f4d, accent: 0xb9c1d1, glow: 0xbfc7de },
    hueRange: 0.15,
    suit: 'invisibility',
    combat: { style: 'precise', speed: 1.05, damage: 52, range: 2.6, arc: 0.4, moves: ['hook', 'standing_melee_kick', 'mma_kick', 'jab_cross'] },
  },
  telekinesis: {
    idle: 'idle_4', cast: 'standing_2h_magic_attack_03',
    build: { height: 1.02, shoulder: 1.0, mass: 0.95, waist: 0.92, legLen: 1.0, definition: 0.8 },
    age: 41, hair: 'quiff', hairColor: 0x2a1c14, hairStreak: 0xc9c9d6, facialHair: 'goatee',
    gear: [], cape: 'medium',
    palette: { primary: 0x7b2fbf, secondary: 0x2a1442, accent: 0xe4c46a, glow: 0xc07bff },
    hueRange: 0.1,
    suit: 'telekinesis',
    combat: { style: 'force', speed: 0.95, damage: 50, range: 3.2, arc: 0.5, moves: ['standing_melee_attack_horizontal', 'mutant_swiping', 'hook', 'standing_melee_attack_360_high'] },
  },
  pyro: {
    idle: 'ninja_idle_3', cast: 'standing_1h_magic_attack_01',
    build: { height: 0.99, shoulder: 0.98, mass: 0.92, waist: 0.88, legLen: 1.0, definition: 0.95 },
    age: 28, hair: 'flame', hairColor: 0xff7a1a, facialHair: null,
    gear: ['robinMask'], cape: null,
    palette: { primary: 0xd9381e, secondary: 0x2b1410, accent: 0xffa726, glow: 0xff7a3c },
    hueRange: 0.06,
    suit: 'pyro',
    combat: { style: 'blazing', speed: 1.15, damage: 44, range: 2.7, arc: 0.45, moves: ['roundhouse_kick', 'hook', 'mma_kick_3', 'kicking'] },
  },
  cryo: {
    idle: 'idle_4', cast: 'standing_1h_magic_attack_01',
    build: { height: 1.06, shoulder: 1.18, mass: 1.35, waist: 1.15, legLen: 0.98, definition: 0.85 },
    age: 38, hair: 'mohawk', hairColor: 0xd8ecf5, facialHair: 'fullBeard',
    gear: ['baneMask'], cape: 'long',
    palette: { primary: 0x2f6fa8, secondary: 0x16263a, accent: 0xe4f3ff, glow: 0x9df2ff },
    hueRange: 0.08,
    suit: 'cryo',
    combat: { style: 'heavy', speed: 0.7, damage: 92, range: 2.8, arc: 0.45, moves: ['standing_melee_attack_downward', 'stomp', 'standing_melee_attack_horizontal', 'standing_melee_attack_360_high'] },
  },
  teleport: {
    idle: 'ninja_idle_3', cast: 'spell_cast',
    build: { height: 0.9, shoulder: 1.08, mass: 1.15, waist: 1.1, legLen: 0.92, definition: 0.85 },
    age: 27, hair: 'buzz', hairColor: 0x2c2620, facialHair: null,
    gear: ['bandana'], cape: null,
    palette: { primary: 0x1fa588, secondary: 0x0e3d38, accent: 0xd6fff5, glow: 0x7dffca },
    hueRange: 0.12,
    suit: 'teleport',
    combat: { style: 'infighter', speed: 1.25, damage: 56, range: 2.0, arc: 0.55, moves: ['uppercut_jab', 'elbow_uppercut_combo', 'hook', 'jab_cross'] },
  },
  xray: {
    idle: 'ninja_idle_3', cast: 'spell_cast',
    build: { height: 1.1, shoulder: 0.92, mass: 0.8, waist: 0.85, legLen: 1.1, definition: 0.7 },
    age: 33, hair: 'bald', hairColor: 0x000000, facialHair: 'stubbleGoatee',
    gear: ['xrayGoggles'], cape: 'short',
    palette: { primary: 0x141a17, secondary: 0x0a0d0b, accent: 0x9dff5c, glow: 0xd0ff5c },
    hueRange: 0.05,
    suit: 'xray',
    combat: { style: 'reach', speed: 0.9, damage: 40, range: 3.6, arc: 0.35, moves: ['standing_melee_kick', 'side_kick', 'kicking', 'sword_and_shield_slash'] },
  },
  shapeshift: {
    idle: 'idle_4', cast: 'spell_cast',
    build: { height: 0.99, shoulder: 0.96, mass: 0.9, waist: 0.98, legLen: 1.0, definition: 0.65 },
    age: 42, hair: 'sidepart', hairColor: 0x4a3526, facialHair: null,
    gear: [], cape: null,
    palette: { primary: 0xd23c8f, secondary: 0x3b1230, accent: 0xffd7ef, glow: 0xff9de2 },
    hueRange: 0.15,
    suit: 'shapeshift',
    combat: { style: 'morph', speed: 1.0, damage: 50, range: 3.0, arc: 0.5, moves: ['mutant_swiping', 'standing_melee_attack_horizontal', 'roundhouse_kick_2', 'hook'] },
  },
  duplication: {
    idle: 'idle_4', cast: 'spell_cast',
    build: { height: 1.08, shoulder: 1.22, mass: 1.4, waist: 1.05, legLen: 1.02, definition: 1.0 },
    age: 29, hair: 'crew', hairColor: 0x3a2a1c, facialHair: null,
    gear: ['sunglasses'], cape: null,
    palette: { primary: 0xd4762a, secondary: 0x2c1e14, accent: 0x3b3b40, glow: 0xffb27d },
    hueRange: 0.08,
    suit: 'duplication',
    combat: { style: 'bruiser', speed: 0.75, damage: 86, range: 2.9, arc: 0.45, moves: ['drop_kick', 'standing_melee_attack_downward', 'stomp', 'standing_melee_attack_360_high'] },
  },
};

export const archetypeFor = (powerId) => ARCHETYPES[powerId] || ARCHETYPES.flight;

// Instance palette: rotate hue within the archetype's range, jitter
// lightness a touch. `seed` in [0,1) makes it reproducible (player = fixed).
export function instancePalette(arch, seed = Math.random()) {
  const shift = (seed - 0.5) * 2 * arch.hueRange;
  const lJitter = ((seed * 7.31) % 1 - 0.5) * 0.12;
  const rot = (hex, l = 0) => {
    const c = new THREE.Color(hex);
    const hsl = {};
    c.getHSL(hsl);
    c.setHSL((hsl.h + shift + 1) % 1, hsl.s, Math.max(0.05, Math.min(0.92, hsl.l + l)));
    return c;
  };
  return {
    primary: rot(arch.palette.primary, lJitter),
    secondary: rot(arch.palette.secondary, lJitter * 0.5),
    accent: rot(arch.palette.accent, 0),
    glow: new THREE.Color(arch.palette.glow),
    skin: pickSkin(seed),
    hair: new THREE.Color(arch.hairColor),
    hairStreak: arch.hairStreak ? new THREE.Color(arch.hairStreak) : null,
  };
}

const SKINS = [0xf3cfa8, 0xe4b48c, 0xc98f63, 0xa96d46, 0x7d4c31, 0x5a3622];
function pickSkin(seed) {
  return new THREE.Color(SKINS[Math.floor(((seed * 13.7) % 1) * SKINS.length)]);
}

// ---------------------------------------------------------------------------
// Suit designs. ctx = { region, t, theta, y, side }
//   region : 'torso' | 'neck' | 'upperArm' | 'foreArm' | 'hand' | 'thigh' | 'shin' | 'foot' | 'head'
//   t      : 0..1 along the segment (torso: hips->neck)
//   theta  : angle around the segment; PI/2 = front, 3PI/2 = back
//   y      : rest height 0..1 (feet->head top)
//   side   : -1 left, +1 right, 0 centre
// Returns a THREE.Color.
// ---------------------------------------------------------------------------

const _c = new THREE.Color();
const front = (theta, w = 0.9) => Math.abs(Math.atan2(Math.sin(theta - Math.PI / 2), Math.cos(theta - Math.PI / 2))) < w;
const mix = (a, b, k) => _c.copy(a).lerp(b, Math.max(0, Math.min(1, k))).clone();

export const SUITS = {
  flight(ctx, P) {
    const { region, t, theta } = ctx;
    if (region === 'torso') {
      // chevron across the chest, dark flanks
      const fr = front(theta, 0.75);
      const chev = fr && Math.abs(t - (0.66 - Math.abs(Math.sin(theta - Math.PI / 2)) * 0.18)) < 0.06;
      if (chev) return P.accent;
      if (!front(theta, 1.3)) return P.secondary;
      if (t < 0.12) return P.secondary; // belt line
      return P.primary;
    }
    if (region === 'foreArm') return t > 0.35 ? P.accent : P.primary;
    if (region === 'hand') return P.accent;
    if (region === 'shin') return t > 0.55 ? P.accent : P.secondary;
    if (region === 'foot') return P.accent;
    if (region === 'thigh') return P.secondary;
    return P.primary;
  },

  speed(ctx, P) {
    const { region, t, theta } = ctx;
    if (region === 'torso') {
      // lightning bolt slashing across the chest
      const a = Math.sin(theta - Math.PI / 2);          // -1..1 across the front
      const zig = 0.55 + 0.25 * a + (a > 0 ? 0.1 : -0.1) * Math.sign(Math.sin(t * 30));
      if (front(theta, 1.1) && Math.abs(t - zig) < 0.05) return P.accent;
      return front(theta, 1.3) ? P.primary : P.secondary;
    }
    if (region === 'upperArm') return t < 0.25 ? P.secondary : P.primary;
    if (region === 'foreArm') return P.secondary;
    if (region === 'hand') return P.accent;
    if (region === 'thigh') return P.primary;
    if (region === 'shin') return t > 0.4 ? P.accent : P.secondary;   // lightning boots
    if (region === 'foot') return P.accent;
    return P.primary;
  },

  invisibility(ctx, P) {
    const { region, t, theta } = ctx;
    if (region === 'head' || region === 'neck') return P.primary;      // faceless mask blends in
    // subtle panel grid
    const grid = (Math.floor(t * 8) + Math.floor(theta / (Math.PI / 5))) % 2 === 0;
    const base = grid ? P.primary : mix(P.primary, P.secondary, 0.35);
    if (region === 'torso' && t < 0.1) return P.secondary;
    if (region === 'hand' || region === 'foot') return P.secondary;
    return base;
  },

  telekinesis(ctx, P) {
    const { region, t, theta } = ctx;
    if (region === 'torso') {
      // tabard front panel with a gold border, high collar
      if (t > 0.9) return P.accent;
      const fr = Math.abs(Math.sin(theta - Math.PI / 2));
      if (front(theta, 0.55)) return P.secondary;
      if (front(theta, 0.7)) return P.accent;
      if (t < 0.12) return P.accent;
      return P.primary;
    }
    if (region === 'foreArm') return t > 0.6 ? P.accent : P.primary;  // wide sleeves, gold cuffs
    if (region === 'hand') return P.secondary;
    if (region === 'thigh' || region === 'shin') return P.secondary;
    if (region === 'foot') return P.accent;
    return P.primary;
  },

  pyro(ctx, P) {
    const { region, t, theta } = ctx;
    const flameEdge = (u) => 0.28 + 0.14 * Math.sin(theta * 3 + u * 7) + 0.08 * Math.sin(theta * 7);
    if (region === 'torso') {
      if (t < flameEdge(t)) return P.accent;                   // flames licking up from the belt
      if (t < flameEdge(t) + 0.1) return P.primary;
      return P.secondary;
    }
    if (region === 'foreArm') return t > 0.4 + 0.1 * Math.sin(theta * 4) ? P.accent : P.primary;
    if (region === 'hand') return P.accent;
    if (region === 'thigh') return t < 0.2 ? P.accent : P.secondary;
    if (region === 'shin') return t > 0.6 ? P.primary : P.secondary;
    if (region === 'foot') return P.primary;
    return P.primary;
  },

  cryo(ctx, P) {
    const { region, t, theta } = ctx;
    if (region === 'torso') {
      if (t > 0.86) return P.accent;                         // fur collar
      if (t < 0.14) return P.secondary;                      // heavy belt
      // padded panel quilting
      const q = (Math.floor(t * 6) + Math.floor(theta / (Math.PI / 4))) % 2 === 0;
      return q ? P.primary : mix(P.primary, P.secondary, 0.25);
    }
    if (region === 'upperArm') return t < 0.3 ? P.accent : P.primary;  // fur shoulders
    if (region === 'foreArm') return t > 0.7 ? P.accent : P.primary;   // fur cuffs
    if (region === 'hand') return P.secondary;
    if (region === 'thigh') return P.secondary;
    if (region === 'shin') return t > 0.45 ? P.accent : P.secondary;   // fur-trimmed boots
    if (region === 'foot') return P.secondary;
    return P.primary;
  },

  teleport(ctx, P) {
    const { region, t, theta } = ctx;
    if (region === 'torso') {
      // radiation-shield plates with glowing seams
      const seam = Math.abs(((t * 5) % 1) - 0.5) < 0.05 || Math.abs(((theta / (Math.PI / 3)) % 1) - 0.5) < 0.05;
      if (seam) return P.accent;
      if (front(theta, 0.35) && t > 0.55 && t < 0.8) return P.glow;   // chest core
      return t < 0.12 ? P.secondary : P.primary;
    }
    if (region === 'upperArm' || region === 'thigh') return P.secondary;
    if (region === 'foreArm' || region === 'shin') return t > 0.5 ? P.primary : P.secondary;
    if (region === 'hand' || region === 'foot') return P.accent;
    return P.primary;
  },

  xray(ctx, P) {
    const { region, t, theta } = ctx;
    // matrix-style black with circuit traces
    const trace = Math.abs(((t * 9 + Math.sin(theta * 2) * 0.5) % 1) - 0.5) < 0.04 && Math.sin(theta * 5) > 0.3;
    if (trace && region !== 'head') return P.accent;
    if (region === 'torso' && t < 0.1) return P.accent;
    if (region === 'hand' || region === 'foot') return P.secondary;
    return region === 'torso' ? P.primary : P.secondary;
  },

  shapeshift(ctx, P) {
    const { region, t, theta } = ctx;
    // segmented stretch bands
    const band = Math.floor(t * 7) % 2 === 0;
    if (region === 'torso') {
      if (front(theta, 0.5) && t > 0.5) return P.accent;      // shirt-front panel
      if (front(theta, 0.12) && t > 0.35 && t < 0.9) return P.secondary;  // tie
      return band ? P.primary : mix(P.primary, P.secondary, 0.4);
    }
    if (region === 'hand' || region === 'foot') return P.secondary;
    return band ? P.primary : mix(P.primary, P.secondary, 0.4);
  },

  duplication(ctx, P) {
    const { region, t, theta } = ctx;
    if (region === 'torso') {
      // tactical vest over the suit
      if (t > 0.35 && t < 0.88 && (front(theta, 0.95) || !front(theta, 2.2))) return P.accent;
      if (t < 0.14) return P.accent;                          // utility belt
      if (t < 0.22 && Math.floor(theta / (Math.PI / 4)) % 2 === 0) return P.secondary; // pouches
      return P.primary;
    }
    if (region === 'upperArm') return t < 0.35 ? P.accent : P.primary;   // shoulder armour
    if (region === 'foreArm') return t > 0.5 ? P.secondary : P.primary;
    if (region === 'hand') return P.secondary;
    if (region === 'thigh') return P.primary;
    if (region === 'shin') return t > 0.5 ? P.secondary : P.primary;
    if (region === 'foot') return P.secondary;
    return P.primary;
  },
};
