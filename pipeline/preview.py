"""Render a glTF/GLB from the front (+Z glTF = -Y blender is the camera side) and 3/4.
usage: python3.11 preview.py model.(gltf|glb) out.png"""
import sys, bpy, math
from mathutils import Vector
src, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
for o in objs:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
ctr = (mn + mx) / 2; size = (mx - mn).length
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 8; sc.cycles.device = 'CPU'
sc.render.resolution_x = 900; sc.render.resolution_y = 450
w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
w.node_tree.nodes['Background'].inputs[0].default_value = (0.8, 0.8, 0.82, 1); sc.world = w
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = size * 2.1
# glTF +Z (front) == blender -Y. Camera at front-left 3/4 and from front, side by side via two renders
paths = []
for i, (ang, el) in enumerate([(0, 0.3), (90, 0.3), (180, 0.3), (270, 0.3)]):
    a = math.radians(ang)
    d = Vector((math.sin(a), -math.cos(a), el)).normalized() * size * 3
    cam.location = ctr + d
    cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler()
    p = out.replace('.png', f'_{i}.png'); sc.render.filepath = p; bpy.ops.render.render(write_still=True); paths.append(p)
