"""Submit local concept images to Meshy image-to-3D (direct API) and fetch results.
usage: MESHY_KEY=... python3 meshy_img.py submit name=path:polycount ...   -> appends to meshy_jobs.txt
       MESHY_KEY=... python3 meshy_img.py fetch outroot                      -> downloads finished GLBs
"""
import sys, os, json, base64, io, time, urllib.request
from PIL import Image
KEY = os.environ['MESHY_KEY']
API = 'https://api.meshy.ai/openapi/v1/image-to-3d'
JOBS = '/home/claude/work/meshy_jobs.txt'

def req(url, data=None):
    r = urllib.request.Request(url, data=json.dumps(data).encode() if data else None,
                               headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(r, timeout=60) as f:
        return json.loads(f.read())

if sys.argv[1] == 'submit':
    for spec in sys.argv[2:]:
        name, rest = spec.split('=')
        path, poly = rest.split(':')
        im = Image.open(path).convert('RGB'); im.thumbnail((1024, 1024))
        b = io.BytesIO(); im.save(b, 'JPEG', quality=92)
        uri = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
        body = {'image_url': uri, 'ai_model': 'latest', 'should_remesh': True, 'topology': 'triangle',
                'target_polycount': int(poly), 'should_texture': True, 'enable_pbr': False, 'target_formats': ['glb']}
        try:
            r = req(API, body); tid = r['result']
            open(JOBS, 'a').write(f'{name} {tid}\n'); print(name, tid)
        except Exception as e:
            print(name, 'ERROR', e, getattr(e, 'read', lambda: b'')()[:300])
else:
    root = sys.argv[2]
    for line in open(JOBS):
        name, tid = line.split()
        out = f'{root}/{name}/src.glb'
        if os.path.exists(out):
            print(name, 'have'); continue
        d = req(f'{API}/{tid}')
        st = d.get('status'); print(name, st, d.get('progress'), (d.get('task_error') or {}).get('message', ''))
        if st == 'SUCCEEDED':
            os.makedirs(os.path.dirname(out), exist_ok=True)
            urllib.request.urlretrieve(d['model_urls']['glb'], out)
