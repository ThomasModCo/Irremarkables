"""Pack a separate glTF (gltf + bin + image) into the game's host-safe .json.

usage: python3 pack_model.py <in.gltf> <out.json> --kind hero|prop [--joints joints.json]
       [--tex 1024] [--meta '{"suitHue":0.62}']
Texture is resized, lightly flattened (median) for the cel look and inlined as JPEG.
"""
import sys, json, base64, io, os, argparse
from PIL import Image, ImageFilter
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--kind', default='prop'); ap.add_argument('--joints')
ap.add_argument('--tex', type=int, default=1024); ap.add_argument('--meta', default='{}')
ap.add_argument('--quality', type=int, default=86)
ap.add_argument('--fmt', default='webp')          # webp | jpeg
ap.add_argument('--median', type=int, default=0)   # 0 = keep texture detail
a = ap.parse_args()

base = os.path.dirname(a.src)
g = json.load(open(a.src))
for b in g.get('buffers', []):
    raw = open(os.path.join(base, b['uri']), 'rb').read()
    b['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(raw).decode()
tex_stats = {}
for im in g.get('images', []):
    if 'uri' not in im:
        continue
    img = Image.open(os.path.join(base, im['uri'])).convert('RGB')
    img = img.resize((a.tex, a.tex), Image.LANCZOS)
    if a.median:
        img = img.filter(ImageFilter.MedianFilter(a.median))
    bio = io.BytesIO()
    if a.fmt == 'webp':
        img.save(bio, 'WEBP', quality=a.quality, method=6)
        mime = 'image/webp'
    else:
        img.save(bio, 'JPEG', quality=a.quality, optimize=True)
        mime = 'image/jpeg'
    im['uri'] = f'data:{mime};base64,' + base64.b64encode(bio.getvalue()).decode()
    im.pop('mimeType', None)
    arr = np.asarray(img).astype(float) / 255
    tex_stats['img'] = arr
meta = json.loads(a.meta)
pack = {'kind': a.kind, 'meta': meta, 'gltf': g}
if a.joints:
    pack['joints'] = json.load(open(a.joints))
json.dump(pack, open(a.out, 'w'), separators=(',', ':'))
print(a.out, round(os.path.getsize(a.out) / 1024), 'KB')
