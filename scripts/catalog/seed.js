// Deterministic Math.random for the catalog renders. Imported first so it is
// in place before any game module runs; `reseed(id)` gives every asset its
// own repeatable stream, so regenerating the catalog reproduces the images.
let state = 0x9e3779b9;

export function reseed(key) {
  let h = 2166136261;
  for (const ch of String(key)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  state = h >>> 0;
}

Math.random = function mulberry32() {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
