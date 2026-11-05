"""Bind an AI-generated T-pose hero mesh to the game's Mixamo skeleton.

usage: python3.11 skin_hero.py <in.glb> <anims.json> <outdir> [--flip]

Steps
  1. import the GLB, join it into one mesh, find which way it faces
  2. scale/centre it to Mixamo units (sole -> head top = unitHeight)
  3. fit the skeleton joints to the mesh (arm height + length, leg spread);
     bone *rotations* stay the Mixamo rest quats, only offsets change, so
     every baked clip still drives it
  4. Blender bone-heat automatic weights, 4 influences, normalised
  5. export glTF (separate) + joints.json (joint world positions, glTF axes)
"""
import sys, json, math
import bpy, bmesh
import numpy as np
from mathutils import Vector

args = [a for a in sys.argv[sys.argv.index('--') + 1:]] if '--' in sys.argv else sys.argv[1:]
flip = '--flip' in args
args = [a for a in args if not a.startswith('--')]
src, anims_path, outdir = args[:3]

A = json.load(open(anims_path))
S = A['skeleton']
UNIT_H = A['unitHeight']


def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


# rest world transforms (glTF / three axes: Y up, character faces +Z)
WR, WP = {}, {}
def world(n):
    if n in WP:
        return
    s = S[n]
    R = qmat(s['quat']); p = np.array(s['pos'], float)
    if s['parent'] is None:
        WR[n], WP[n] = R, p
    else:
        world(s['parent'])
        WR[n] = WR[s['parent']] @ R
        WP[n] = WP[s['parent']] + WR[s['parent']] @ p
for n in S:
    world(n)

SOLE = min(WP['mixamorigLeftToe_End'][1], WP['mixamorigLeftToeBase'][1])
TOP = WP['mixamorigHeadTop_End'][1]

# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
mesh = bpy.context.view_layer.objects.active
# drop parents/empties, bake transforms
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o != mesh:
        bpy.data.objects.remove(o)

# Blender coords: X right, -Y forward (character front), Z up.
# glTF coords (game): x = bx, y = bz, z = -by
def to_gl(v):
    return np.array([v[0], v[2], -v[1]])
def to_bl(p):
    return Vector((p[0], -p[2], p[1]))

V = np.array([v.co[:] for v in mesh.data.vertices])
G = np.stack([V[:, 0], V[:, 2], -V[:, 1]], 1)  # glTF axes

# T-pose arms must lie along x; rotate 90 deg about up if they lie along z
ext0 = G.max(0) - G.min(0)
if ext0[2] > ext0[0]:
    G = np.stack([G[:, 2], G[:, 1], -G[:, 0]], 1)
    print('rotated 90 about up')
# facing: toes stick out forward. Compare foot-slab depth centre with body.
lo = G[:, 1].min(); hi = G[:, 1].max(); Hm = hi - lo
feet = G[G[:, 1] < lo + 0.04 * Hm]
body = G[(G[:, 1] > lo + 0.4 * Hm) & (G[:, 1] < lo + 0.6 * Hm)]
facing = np.sign(np.median(feet[:, 2]) - np.median(body[:, 2])) or 1
if flip:
    facing = -facing
print('mesh height', Hm, 'facing', facing)
if facing < 0:  # rotate 180 about up so the character faces +Z
    G[:, 0] *= -1; G[:, 2] *= -1

# T-pose: arms along x. If arms are along z, rotate 90 (shouldn't happen)
ext = G.max(0) - G.min(0)
print('extent', ext)

# scale + translate: sole -> SOLE, top -> TOP
s = (TOP - SOLE) / Hm
G = (G - np.array([0, lo, 0])) * s + np.array([0, SOLE, 0])
# Fit by SHOULDER height rather than head top, so tall hair / helmets /
# horns don't shrink the body: rescale about the sole until the T-pose arm
# axis sits at the skeleton's arm height.
for _ in range(2):
    cx = (G[:, 0].max() + G[:, 0].min()) / 2
    half = (G[:, 0].max() - G[:, 0].min()) / 2
    ax = np.abs(G[:, 0] - cx)
    mid = G[(ax > 0.45 * half) & (ax < 0.62 * half) & (G[:, 1] > WP['mixamorigHips'][1])]
    if len(mid) < 20:
        break
    ay = (mid[:, 1].max() + mid[:, 1].min()) / 2
    f = (WP['mixamorigLeftArm'][1] - SOLE) / (ay - SOLE)
    print('shoulder fit factor', round(f, 3))
    if abs(f - 1) < 0.01:
        break
    G[:, 1] = (G[:, 1] - SOLE) * f + SOLE
    G[:, 0] *= f; G[:, 2] *= f
# centre x on the torso, z on the hip slab
torso = G[(G[:, 1] > WP['mixamorigHips'][1]) & (G[:, 1] < WP['mixamorigSpine2'][1]) & (np.abs(G[:, 0]) < 3.5)]
G[:, 0] -= 0.5 * (np.median(torso[:, 0]) + 0.5 * (G[:, 0].max() + G[:, 0].min()))
hip = G[(np.abs(G[:, 1] - WP['mixamorigHips'][1]) < 0.6) & (np.abs(G[:, 0]) < 3.0)]
zc = (hip[:, 2].max() + hip[:, 2].min()) / 2
G[:, 2] += (WP['mixamorigHips'][2] + 0.1) - zc

# ---------------------------------------------------------------------------
# fit joints
J = {n: WP[n].copy() for n in WP}

# arm axis height + wrist from fingertip reach, per side
for side, sg in (('Left', 1), ('Right', -1)):
    tip = (G[:, 0] * sg).max()
    half_s = (G[:, 0] * sg).max()
    mid = G[(G[:, 0] * sg > 0.45 * half_s) & (G[:, 0] * sg < 0.62 * half_s) & (G[:, 1] > WP['mixamorigHips'][1])]
    ay = (mid[:, 1].max() + mid[:, 1].min()) / 2 if len(mid) else J[f'mixamorig{side}Arm'][1]
    az = (mid[:, 2].max() + mid[:, 2].min()) / 2 if len(mid) else J[f'mixamorig{side}Arm'][2]
    hand_len = 0.105 * UNIT_H
    wrist = tip - hand_len
    arm_x = J[f'mixamorig{side}Arm'][0] * sg
    # keep the Mixamo upper/fore arm ratio between shoulder joint and wrist
    up = WP[f'mixamorig{side}ForeArm'][0] * sg - WP[f'mixamorig{side}Arm'][0] * sg
    fo = WP[f'mixamorig{side}Hand'][0] * sg - WP[f'mixamorig{side}ForeArm'][0] * sg
    elbow = arm_x + (wrist - arm_x) * up / (up + fo)
    dy = ay - J[f'mixamorig{side}Arm'][1]
    for n in ('Arm', 'ForeArm', 'Hand'):
        J[f'mixamorig{side}{n}'][1] = ay
        J[f'mixamorig{side}{n}'][2] = az
    J[f'mixamorig{side}Shoulder'][1] += dy * 0.6
    J[f'mixamorig{side}ForeArm'][0] = elbow * sg
    J[f'mixamorig{side}Hand'][0] = wrist * sg
    print(side, 'arm y', ay, 'elbow', elbow, 'wrist', wrist, 'tip', tip)

# legs: knee / ankle x from the leg slabs
for side, sg in (('Left', 1), ('Right', -1)):
    for n in ('Leg', 'Foot'):
        y = J[f'mixamorig{side}{n}'][1]
        slab = G[(np.abs(G[:, 1] - y) < 0.4) & (G[:, 0] * sg > 0.15)]
        if len(slab):
            J[f'mixamorig{side}{n}'][0] = sg * (slab[:, 0] * sg).mean()
            J[f'mixamorig{side}{n}'][2] = (slab[:, 2].max() + slab[:, 2].min()) / 2 - (0.25 if n == 'Foot' else 0)
    toe = J[f'mixamorig{side}ToeBase']; foot = J[f'mixamorig{side}Foot']
    toe[0] = foot[0]; J[f'mixamorig{side}Toe_End'][0] = foot[0]
    front = G[(G[:, 1] < SOLE + 1.2) & (G[:, 0] * sg > 0.15)]
    if len(front):
        J[f'mixamorig{side}Toe_End'][2] = front[:, 2].max()
        toe[2] = foot[2] + (front[:, 2].max() - foot[2]) * 0.6

# legs: stocky / long-legged cartoon builds put the crotch somewhere other
# than Mixamo's. Find it (first height above the feet where the mesh closes
# between the legs) and move hips / knees / spine to match. The animation
# hips track is absolute, so the difference is reported as hipsYOffset.
hips_off = 0.0
xs = np.abs(G[:, 0])
crotch = None
for y in np.linspace(SOLE + 2.0, WP['mixamorigHips'][1] + 4.0, 160):
    if ((np.abs(G[:, 1] - y) < 0.12) & (xs < 0.2)).sum() > 3:
        crotch = y; break
MIX_CROTCH = WP['mixamorigLeftUpLeg'][1] - 1.0
if crotch is not None and abs(crotch - MIX_CROTCH) > 0.6:
    d = crotch - MIX_CROTCH
    hip0 = WP['mixamorigHips'][1]; neck = J['mixamorigNeck'][1]
    newhip = hip0 + d
    for n in ('mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2'):
        J[n][1] = newhip + (WP[n][1] - hip0) * (neck - newhip) / (neck - hip0)
    J['mixamorigHips'][1] = newhip
    ank = J['mixamorigLeftFoot'][1]
    ratio = (WP['mixamorigLeftLeg'][1] - WP['mixamorigLeftFoot'][1]) / (WP['mixamorigLeftUpLeg'][1] - WP['mixamorigLeftFoot'][1])
    for side in ('Left', 'Right'):
        J[f'mixamorig{side}UpLeg'][1] = WP[f'mixamorig{side}UpLeg'][1] + d
        J[f'mixamorig{side}Leg'][1] = ank + (J[f'mixamorig{side}UpLeg'][1] - ank) * ratio
    hips_off = float(d)
    print('leg fit: crotch', round(crotch, 2), 'vs', round(MIX_CROTCH, 2), 'hips offset', round(d, 2))

# write vertices back (Blender axes)
for i, v in enumerate(mesh.data.vertices):
    v.co = to_bl(G[i])
mesh.data.update()

# light cleanup that helps bone heat
bm = bmesh.new(); bm.from_mesh(mesh.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bm.to_mesh(mesh.data); bm.free()
print('verts', len(mesh.data.vertices), 'faces', len(mesh.data.polygons))

# ---------------------------------------------------------------------------
# armature
arm_data = bpy.data.armatures.new('rig')
arm = bpy.data.objects.new('rig', arm_data)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
children = {}
for n in S:
    p = S[n]['parent']
    if p:
        children.setdefault(p, []).append(n)
TAIL = {
    'mixamorigHips': 'mixamorigSpine', 'mixamorigSpine': 'mixamorigSpine1', 'mixamorigSpine1': 'mixamorigSpine2',
    'mixamorigSpine2': 'mixamorigNeck', 'mixamorigNeck': 'mixamorigHead', 'mixamorigHead': 'mixamorigHeadTop_End',
}
eb = {}
deform = A['bones']
for n in deform:
    b = arm_data.edit_bones.new(n)
    b.head = to_bl(J[n])
    if n in TAIL:
        t = J[TAIL[n]]
    elif n.endswith('Hand'):
        sg = 1 if 'Left' in n else -1
        t = J[n] + np.array([sg * 0.105 * UNIT_H, 0, 0])
    elif n.endswith('ToeBase'):
        t = J[n.replace('ToeBase', 'Toe_End')]
    else:
        kids = [c for c in children.get(n, []) if c in deform]
        t = J[kids[0]]
    if np.linalg.norm(t - J[n]) < 1e-3:
        t = J[n] + np.array([0, 0.5, 0])
    b.tail = to_bl(t)
    eb[n] = b
for n in deform:
    p = S[n]['parent']
    if p in eb:
        eb[n].parent = eb[p]
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# weights: limit 4, normalise, report empties
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
bpy.ops.object.mode_set(mode='OBJECT')
unweighted = sum(1 for v in mesh.data.vertices if not v.groups or sum(g.weight for g in v.groups) < 1e-6)
print('unweighted verts', unweighted)
# any unweighted vertex: give it the nearest bone by distance
if unweighted:
    heads = {n: to_bl(J[n]) for n in deform}
    for v in mesh.data.vertices:
        if not v.groups or sum(g.weight for g in v.groups) < 1e-6:
            n = min(deform, key=lambda k: (heads[k] - v.co).length)
            mesh.vertex_groups[n].add([v.index], 1.0, 'REPLACE')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=f'{outdir}/hero.gltf', export_format='GLTF_SEPARATE',
                          export_skins=True, export_animations=False, export_yup=True,
                          export_texcoords=True, export_normals=True, export_materials='EXPORT')
out = {k: [round(float(x), 4) for x in v] for k, v in J.items()}
out['_hipsYOffset'] = round(hips_off, 4)
json.dump(out, open(f'{outdir}/joints.json', 'w'), indent=1)
print('done')
