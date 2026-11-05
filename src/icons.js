// Comic-book power icons: one flat shape per power in its own colour, heavy
// ink outline, a white glint — all inline SVG so they scale crisply anywhere
// and never depend on the platform's emoji font.
import { POWERS } from './powers.js';

const INK = '#141018';
const hex = (c) => '#' + c.toString(16).padStart(6, '0');

// Each glyph is drawn in a 64x64 box. `c` is the power colour, `l` a lighter tint.
const GLYPHS = {
  // swept wings + a rising body
  flight: (c, l) => `
    <path d="M6 40 C18 22 27 21 32 8 C37 21 46 22 58 40 C47 33 38 34 32 46 C26 34 17 33 6 40 Z" fill="${c}"/>
    <path d="M32 14 C34 22 38 26 44 30 C38 30 34 33 32 40 C30 33 26 30 20 30 C26 26 30 22 32 14 Z" fill="${l}"/>`,
  // lightning bolt with speed lines
  speed: (c, l) => `
    <path d="M6 22 H18 M4 32 H14 M8 42 H16" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M38 4 L18 36 H31 L27 60 L50 26 H36 Z" fill="${c}"/>
    <path d="M36 10 L26 30 H33 L31 42 L42 26 H35 Z" fill="${l}"/>`,
  // eye fading out behind a slash
  invisibility: (c, l) => `
    <path d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32 Z" fill="${c}"/>
    <circle cx="32" cy="32" r="9" fill="${INK}"/>
    <circle cx="35" cy="29" r="3" fill="#fff" stroke="none"/>
    <path d="M12 54 L52 10" stroke="${l}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M12 54 L52 10" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  // open hand lifting a block
  telekinesis: (c, l) => `
    <path d="M17 34 V30 M25 30 V22 M33 29 V20 M41 31 V24" stroke="${c}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M14 34 C14 46 20 56 32 58 C42 58 48 50 48 40 L48 32 C48 28 42 28 42 32 L41 34 L33 30 L25 32 L17 34 Z" fill="${c}"/>
    <path d="M22 10 L32 4 L42 10 L32 16 Z" fill="${l}"/>
    <path d="M22 10 V15 L32 21 L42 15 V10" fill="${c}"/>
    <path d="M32 16 V21" stroke="${INK}" stroke-width="3" fill="none"/>`,
  // flame
  pyro: (c, l) => `
    <path d="M32 4 C24 16 12 24 13 40 C14 52 22 60 32 60 C42 60 51 52 51 40 C51 30 44 26 40 16 C38 24 35 27 33 32 C28 26 30 14 32 4 Z" fill="${c}"/>
    <path d="M32 30 C28 36 22 40 23 47 C24 53 28 56 32 56 C36 56 41 53 41 47 C41 42 37 40 36 34 C34 38 33 36 32 30 Z" fill="${l}"/>`,
  // six-arm snowflake
  cryo: (c, l) => `
    <g stroke="${INK}" stroke-width="10" stroke-linecap="round" fill="none">
      <path d="M32 6 V58 M9.5 19 L54.5 45 M9.5 45 L54.5 19"/>
    </g>
    <g stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M32 6 V58 M9.5 19 L54.5 45 M9.5 45 L54.5 19"/>
      <path d="M26 12 L32 18 L38 12 M26 52 L32 46 L38 52 M12 28 L18 26 L16 20 M52 36 L46 38 L48 44 M12 36 L18 38 L16 44 M52 28 L46 26 L48 20"/>
    </g>
    <circle cx="32" cy="32" r="5" fill="${l}"/>`,
  // portal ring with a chevron blinking through it
  teleport: (c, l) => `
    <ellipse cx="32" cy="34" rx="24" ry="10" fill="${c}"/>
    <ellipse cx="32" cy="34" rx="14" ry="5" fill="${INK}" stroke="none"/>
    <path d="M22 26 L32 12 L42 26" fill="${l}"/>
    <path d="M27 36 L32 28 L37 36" fill="${l}"/>`,
  // eye with a radiating iris
  xray: (c, l) => `
    <path d="M8 12 L14 18 M56 12 L50 18 M8 52 L14 46 M56 52 L50 46" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32 Z" fill="${c}"/>
    <circle cx="32" cy="32" r="11" fill="${INK}"/>
    <circle cx="32" cy="32" r="5" fill="${l}" stroke="none"/>
    <path d="M32 21 V25 M32 39 V43 M21 32 H25 M39 32 H43" stroke="${l}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  // theatre mask, split light / shadow
  shapeshift: (c, l) => `
    <path d="M12 10 C22 6 42 6 52 10 C54 28 50 50 32 58 C14 50 10 28 12 10 Z" fill="${c}"/>
    <path d="M32 7.5 C42 7 48 8 52 10 C54 28 50 50 32 58 Z" fill="${l}"/>
    <path d="M18 24 C22 20 28 20 30 24 Z M34 24 C36 20 42 20 46 24 Z" fill="${INK}"/>
    <path d="M22 38 C27 46 37 46 42 38 C36 40 28 40 22 38 Z" fill="${INK}"/>`,
  // two heroes, one stepping out of the other
  duplication: (c, l) => `
    <circle cx="40" cy="20" r="9" fill="${l}"/>
    <path d="M24 56 C24 40 32 36 40 36 C48 36 56 40 56 56 Z" fill="${l}"/>
    <circle cx="24" cy="24" r="9" fill="${c}"/>
    <path d="M8 60 C8 44 16 40 24 40 C32 40 40 44 40 60 Z" fill="${c}"/>`,
};

function lighten(color, k = 0.45) {
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const m = (v) => Math.round(v + (255 - v) * k);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

const cache = {};

// Inline SVG for a power id. Sized by CSS (defaults to 1em square).
export function powerIcon(id, size = '1em') {
  const p = POWERS.find((x) => x.id === id);
  const draw = GLYPHS[id];
  if (!p || !draw) return '';
  const body = cache[id] || (cache[id] = draw(hex(p.color), lighten(p.color)));
  return `<svg class="picon" viewBox="0 0 64 64" width="${size}" height="${size}" aria-label="${p.name}" role="img">` +
    `<g stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${body}</g></svg>`;
}

// small ink padlock for locked (rare) powers
export const LOCK_ICON = `<svg class="picon lock" viewBox="0 0 64 64" width="1em" height="1em" role="img" aria-label="locked">` +
  `<path d="M20 30 V22 C20 14 26 9 32 9 C38 9 44 14 44 22 V30" fill="none" stroke="#e9e6ef" stroke-width="7" stroke-linecap="round"/>` +
  `<rect x="13" y="28" width="38" height="30" rx="6" fill="#e9e6ef" stroke="#141018" stroke-width="3.5"/>` +
  `<circle cx="32" cy="42" r="4.5" fill="#141018"/><path d="M32 44 V51" stroke="#141018" stroke-width="4" stroke-linecap="round"/></svg>`;
