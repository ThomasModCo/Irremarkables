#!/bin/bash
# usage: dec_pack.sh <pack.json> <ratio>  -- simplify an existing host-safe pack in place (texture untouched)
set -e
P=$1; R=$2; W=/tmp/decp; rm -rf $W; mkdir -p $W
python3 -c "
import json,sys; d=json.load(open('$P')); json.dump(d['gltf'],open('$W/in.gltf','w'))"
cd /home/claude/gt
npx gltf-transform dequantize $W/in.gltf $W/a.gltf > /dev/null
python3.11 -c "import sys; sys.argv=['x','$W/a.gltf','$W/c.gltf','$R']; exec(open('/home/claude/tools/bdec.py').read())" > /dev/null 2>&1 || true
npx gltf-transform quantize $W/c.gltf $W/d.gltf --vertex-layout separate > /dev/null
python3 - <<PY
import json,base64,os,mimetypes
W='$W'; d=json.load(open('$P')); g=json.load(open(W+'/d.gltf'))
for b in g.get('buffers',[]):
    b['uri']='data:application/octet-stream;base64,'+base64.b64encode(open(os.path.join(W,b['uri']),'rb').read()).decode()
for im in g.get('images',[]):
    u=im.get('uri')
    if u and not u.startswith('data:'):
        ext=u.rsplit('.',1)[-1].lower(); mime={'webp':'image/webp','jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png'}[ext]
        im['uri']=f'data:{mime};base64,'+base64.b64encode(open(os.path.join(W,u),'rb').read()).decode(); im.pop('mimeType',None)
d['gltf']=g; json.dump(d,open('$P','w'),separators=(',',':'))
t=sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives'])
print(os.path.basename('$P'), t,'tris', os.path.getsize('$P')//1024,'KB')
PY
