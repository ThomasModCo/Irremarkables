// Generates the PWA icons (192 & 512 px PNGs) with zero image dependencies:
// raw RGBA pixels -> zlib deflate -> hand-assembled PNG chunks.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, px) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// point-in-polygon (bolt shape)
function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const r = size * 0.46;
  // lightning bolt, in unit coords (0..1), centered-ish
  const bolt = [
    [0.58, 0.12], [0.34, 0.52], [0.48, 0.52], [0.40, 0.88],
    [0.68, 0.44], [0.53, 0.44],
  ].map(([x, y]) => [x * size, y * size]);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - c, dy = y - c;
      const d = Math.hypot(dx, dy);
      if (d > r) { px[i + 3] = 0; continue; } // transparent corner

      // radial night-sky background
      const t = d / r;
      let rr = 11 + 20 * (1 - t), gg = 14 + 26 * (1 - t), bb = 20 + 60 * (1 - t);

      // subtle ring
      if (d > r * 0.93) { rr += 60; gg += 90; bb += 160; }

      if (inPoly(x, y, bolt)) { rr = 255; gg = 209; bb = 102; }
      else {
        // soft glow around the bolt
        let minD = Infinity;
        for (const [bx2, by2] of bolt) minD = Math.min(minD, Math.hypot(x - bx2, y - by2));
        if (minD < size * 0.16) {
          const g = 1 - minD / (size * 0.16);
          rr += 90 * g * g; gg += 120 * g * g; bb += 200 * g * g;
        }
      }
      px[i] = Math.min(255, rr | 0);
      px[i + 1] = Math.min(255, gg | 0);
      px[i + 2] = Math.min(255, bb | 0);
      px[i + 3] = 255;
    }
  }
  return encodePNG(size, px);
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), drawIcon(size));
  console.log(`icons: wrote icon-${size}.png`);
}
