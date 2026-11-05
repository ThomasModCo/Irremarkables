// usage: node lod_pack.mjs <hero.json> [ratio=0.25] [error=0.02]
// Adds pack.lod = {index (base64 Uint16/32), count}: a simplified index buffer over
// the SAME vertices, so the far LOD costs no extra vertex data or skinning setup.
import fs from 'fs';
import { MeshoptSimplifier as S } from 'meshoptimizer';
const [f, ratio = '0.25', err = '0.02'] = process.argv.slice(2);
const pack = JSON.parse(fs.readFileSync(f, 'utf8'));
const g = pack.gltf;
const bufs = g.buffers.map((b) => Buffer.from(b.uri.split(',')[1], 'base64'));
const read = (ai) => {
  const a = g.accessors[ai], bv = g.bufferViews[a.bufferView], buf = bufs[bv.buffer];
  const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array, 5122: Int16Array }[a.componentType];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const stride = bv.byteStride || n * C.BYTES_PER_ELEMENT;
  const out = new C(a.count * n), off = (bv.byteOffset || 0) + (a.byteOffset || 0);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = buf[`read${C === Float32Array ? 'FloatLE' : C === Uint32Array ? 'UInt32LE' : C === Uint16Array ? 'UInt16LE' : C === Int16Array ? 'Int16LE' : 'UInt8'}`](off + i * stride + k * C.BYTES_PER_ELEMENT);
  return { arr: out, a };
};
await S.ready;
const prim = g.meshes.find((m) => m.primitives).primitives[0];
const pos = read(prim.attributes.POSITION);
if (pos.a.componentType !== 5126) throw new Error('positions must be float');
const idx = new Uint32Array(read(prim.indices).arr);
const target = Math.floor((idx.length / 3) * +ratio) * 3;
const [lod, e] = S.simplify(idx, pos.arr, 3, target, +err, []);
const big = pos.a.count > 65535;
const out = big ? new Uint32Array(lod) : new Uint16Array(lod);
pack.lod = { index: Buffer.from(out.buffer).toString('base64'), u32: big, count: out.length };
fs.writeFileSync(f, JSON.stringify(pack));
console.log(f.split('/').pop(), idx.length / 3, '->', lod.length / 3, 'tris, err', e.toFixed(4));
