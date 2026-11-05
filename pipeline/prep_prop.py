"""Normalise an AI prop GLB: longest horizontal axis -> glTF Z, sit on y=0,
scale to a target length, optional 180 flip. usage:
python3.11 prep_prop.py in.glb outdir length [--flip] [--decimate ratio]"""
import sys, bpy, numpy as np
args = sys.argv[1:]
src, outdir = args[0], args[1]
by_height = args[2].startswith('h')
length = float(args[2].lstrip('h'))
flip = '--flip' in args
long_axis = args[args.index('--long') + 1] if '--long' in args else 'z'   # z | x | keep
rot = int(args[args.index('--rot') + 1]) if '--rot' in args else 0       # extra quarter turns about up
dec = float(args[args.index('--decimate') + 1]) if '--decimate' in args else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in ms: o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
if len(ms) > 1: bpy.ops.object.join()
m = bpy.context.view_layer.objects.active
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o != m: bpy.data.objects.remove(o)
V = np.array([v.co[:] for v in m.data.vertices])  # blender: x, y(depth), z(up)
ext = V.max(0) - V.min(0)
print('extent', ext)
def quarter(V):
    return np.stack([-V[:, 1], V[:, 0], V[:, 2]], 1)
if long_axis == 'z' and ext[0] > ext[1]:   # long axis on x -> blender y (= glTF z)
    V = quarter(V)
if long_axis == 'x' and ext[1] > ext[0]:   # long axis on y -> blender x
    V = quarter(V)
for _ in range(rot % 4):
    V = quarter(V)
if flip:
    V[:, 0] *= -1; V[:, 1] *= -1
c = (V.max(0) + V.min(0)) / 2
V[:, 0] -= c[0]; V[:, 1] -= c[1]; V[:, 2] -= V[:, 2].min()
s = length / ((V[:, 2].max() - V[:, 2].min()) if by_height else max(V[:, 0].max() - V[:, 0].min(), V[:, 1].max() - V[:, 1].min()))
V *= s
if '--sety' in args:   # squash/stretch height only (e.g. a fence that came out too tall)
    hy = float(args[args.index('--sety') + 1])
    V[:, 2] *= hy / (V[:, 2].max() - V[:, 2].min())
for i, v in enumerate(m.data.vertices): v.co = V[i]
m.data.update()
print('final size (w,len,h)', V.max(0) - V.min(0))
if dec:
    mod = m.modifiers.new('d', 'DECIMATE'); mod.ratio = dec
    bpy.ops.object.modifier_apply(modifier='d')
print('faces', len(m.data.polygons))
bpy.ops.export_scene.gltf(filepath=f'{outdir}/prop.gltf', export_format='GLTF_SEPARATE', export_yup=True, export_normals=True, export_texcoords=True)
