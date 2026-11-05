"""Move each pack's embedded texture into a real image file next to it.
usage: python3 extract_tex.py <models_dir>   (rewrites the packs in place)"""
import json, base64, os, sys, glob
d = sys.argv[1]; os.makedirs(os.path.join(d, 'tex'), exist_ok=True)
ext = {'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png'}
for f in sorted(glob.glob(os.path.join(d, '*.json'))):
    p = json.load(open(f)); n = os.path.basename(f)[:-5]
    for i, im in enumerate(p['gltf'].get('images', [])):
        u = im.get('uri', '')
        if not u.startswith('data:'): continue
        mime = u[5:u.index(';')]
        name = f'tex/{n}{"" if i == 0 else "-" + str(i)}.{ext[mime]}'
        open(os.path.join(d, name), 'wb').write(base64.b64decode(u.split(',', 1)[1]))
        im['uri'] = name
    json.dump(p, open(f, 'w'), separators=(',', ':'))
    print(n, os.path.getsize(f) // 1024, 'KB json')
