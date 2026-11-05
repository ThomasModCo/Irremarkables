# Irremarkables cel-shaded reskin — hand-off

Apply on top of commit b15d368: `git apply reskin.patch` (checked with `git apply --check`) and copy `public/models/` in. The sections below are in build order; the last one describes the finished state.

## What changed
- `src/toon.js` (new): cel shading for every lit mesh (MeshToonMaterial, 3-band ramp) and an inverted-hull ink outline with smoothed normals and a width that grows with distance. Tonemapping is set to None and the lights are retuned. `#original` or `?toon=0` turns it off.
- `src/authored.js` (new): loads models from `public/models/*.json` (glTF embedded in .json, so check-dist passes). Heroes are re-bound to the game's own Mixamo skeleton by bone name. Joint offsets come from the model and rest rotations from anims.json, so all 39 clips work unchanged. A hue-keyed recolour shader keeps per-bot suit variation, the 6 skin tones and the car paint colours. `#original` or `?models=0` turns it off.
- `src/rig.js`: `buildRig` hands off to the authored rig when the archetype has a model.
- `src/world.js`: the car liftable and car disguise use the authored car. X-ray also fades the toon copies of building materials.
- `src/main.js`: loads the models at boot. `#stats` or `?stats=1` shows fps, draw calls and triangles.

## Pipeline (pipeline/)
1. Concept turnaround sheet (front / left / back, strict T-pose, no cape), then isolated views, then Tripo H3.1 multiview-to-3D (~14k faces).
2. `python3.11 skin_hero.py hero.glb public/anims.json out/` (Blender as a module: `pip install bpy==4.2.0` on Python 3.11). Orients and scales the mesh to Mixamo units, fits the arm and leg joints, applies bone-heat weights (4 per vertex), then exports glTF plus joints.json.
3. `python3 pack_model.py out/hero.gltf public/models/hero-<id>.json --kind hero --joints out/joints.json --meta '{...suitHue, skinHue...}'`
4. Props: `python3.11 prep_prop.py prop.glb out/ <length_m>`, then `pack_model.py --kind prop`.

## Update: bungalow
- `public/models/house-bungalow.json`: house plus attached garage in one mesh. `world.js` places it for house kind 0, stretches it to each lot's rolled size, and keeps the original colliders, driveway and front path.
- The recolour now has two keys: the wall colour comes from `housePalette` and the roof from `roofPalette`. All keying happens in sRGB, which fixed too-dark repaints on the car and the skin.
- Props: `prep_prop.py in.glb out/ <size_m> [--long x|z] [--flip] [--rot n]`, then `preview.py out/prop.gltf front.png` (renders 4 sides to check which way it faces).

## Update: strict-CSP hosting
`authored.js` no longer lets GLTFLoader fetch `data:` URIs, which `connect-src 'self'` blocks; the models fell back to the procedural versions without any visible error. Buffers are decoded with `atob` into an in-memory GLB, and the texture goes through an `<img>`. A failed load is now logged as a console **error** rather than a warning. Test locally with `pipeline`-free `node csp_server.cjs dist 4181`, which serves `dist/` with an artifact-like CSP.

## Update: hero facing and face shading
- Flight was re-skinned with `--flip` because the facing check in `skin_hero.py` (toes vs torso) guessed wrong. Always check a new hero with a front/back close-up, and pass `--flip` if the face points backwards.
- Hero materials use a lighter 2-band ramp (`HERO_BANDS`) and normals smoothed at load (`smoothShadingNormals`, 6 passes). The geometry is unchanged; this only gives clean light shapes on lumpy AI meshes.
- Hero outlines are pushed back in clip space so they show only at the silhouette and don't leak into eye sockets.
- Skin re-tint is **off** (opt-in with `meta.skinRecolor`). Hue-keying can't separate skin from AI textures cleanly; per-bot skin variety needs a painted mask texture.
- Lighting: blue-violet hemisphere fill (tinted shadows), warmer and stronger sun, deeper sky, and a hard rim light on authored heroes and the car.

## Update: fidelity and size
- Hero is regenerated with Tripo `geometry_quality: detailed`, `face_limit: 24000` (about 22.8k tris) and a 2048 texture. Car and house textures are 1024.
- `pack_model.py` writes **WebP** (`--fmt webp`, default) and no longer blurs (`--median 0`).
- Vertex data is compressed with KHR_mesh_quantization, which three.js reads natively:
  - props: `npx @gltf-transform/cli quantize in.gltf out.gltf --vertex-layout separate`
  - heroes: add `--pattern "{NORMAL,TEXCOORD_0,WEIGHTS_0}"` (positions stay float because our own bind pose relies on them). `authored.js` converts quantized attributes back to floats at load (`toFloatAttr`).
- Default model download is about 1.5 MB in total (hero 955 KB, house 286 KB, car 221 KB).
- `#meshy` loads the Meshy 7.1 Flight variant for A/B comparison.

## Update: cape physics (`src/cloth.js`)
- All tuning lives in the `CAPE` object at the top of the file: damping 0.92, trail 0.45, flutter 0.6, bend 0.55, 4 constraint iterations.
- The back-plane collision now applies at every height, not just alongside the torso, so the cape can't wrap over the shoulders or face.
- New swing limit: each row must stay at least `(1 - maxSwing)` of its rest distance "down the spine" from the pin line, so it can't flip over the head. This follows the body axis, so in flight the cape streams behind.

## Update: batch 2 (Pyro, props, ground, performance)
- **Pyro hero** (`hero-pyro.json`). `skin_hero.py` now fits heroes by **shoulder height** rather than head top, so tall hair, helmets and horns don't shrink the body.
- **Props:** tree-round, tree-tall, bush, bin (repainted from the bin palette), bench, lamppost (placed rotated π/2) and hydrant. Throwables and shapeshift disguises use per-instance meshes. Static dressing (trees, shrubs, lampposts) is collected in `vc.inst` and **merged into one mesh per model per chunk**, sharing one material.
- **Ground:** `makeGroundTile` repainted at 1024 px with asphalt patches, cracks, oil stains, an inked kerb, paving slabs, brushed grass and plaza pavers. Downtown slabs get a textured top plane that reuses the downtown tile.
- **Performance:** camera far plane 600 → 200 m (fog ends at 142 m; sky dome 185 m, clouds within ±150 m). Outlines are skipped beyond 80 m. In play this is about 365–480 calls and 420–500k tris, down from 541 calls and 612k tris before the batch.
- `proc_prop.sh <name> <glb_url> <size|hHEIGHT> [--long x|keep] [--flip] [--decimate r]` runs download → normalise → 4-side preview → quantize.

## Full reskin (final state)
**Content**
- **Heroes:** all 10 archetypes are authored models on the shared Mixamo rig: flight, pyro, speed, invisibility, telekinesis, cryo, teleport, xray, shapeshift and duplication.
  - Tripo multiview builds most of them. Telekinesis is a Meshy multi-image build, because Tripo's face came out blank.
  - Boot waits only for Flight. The other heroes stream in two at a time, and each character swaps from procedural to authored as its model arrives.
- **Houses:** all five suburban house kinds (bungalow, two-storey, ranch, modern, cottage) plus a shed. Each is stretched to the lot's rolled footprint, and the original colliders and platforms are kept.
- **Street and rooftop props:** car, bin, bench, hydrant, lamppost, two trees, bush, hedge, fence, flowers, mailbox, planter, fountain, AC units and water tower.
- **Collectibles:** token, pill and potion.
- **Effects and UI:**
  - Ice shell is a crystal with inked edges.
  - Particles are cel discs.
  - Shockwaves have ink rings.
  - The invisibility aura has an ink edge.
  - The cel clouds use a painted window texture.
  - Buff chips use SVG glyphs (`src/icons.js`).

**Performance** (`src/toon.js`, `src/world.js`, `src/authored.js`):
- **Hero LOD:** each hero pack has `lod`, a meshopt-simplified index buffer over the same vertices (about 5.7k triangles instead of about 23k; see `pipeline/lod_pack.mjs`). Beyond 18 m the hero draws with it, at no extra download or skinning cost.
- **Outline culling:** hero ink is dropped beyond 55 m and world ink beyond 80 m.
- **Small props:** small dressing (AC units, flowers, fence, hedge, mailbox, planter) has no ink hull. Merged per-chunk dressing is hidden when a chunk's nearest edge is more than 80 m from the action (`DRESS_FAR`).
- **Outline width cap:** the hull offset is capped at 15% of a mesh's own size (encoded in the length of `outlineNormal`). Objects scaling in from 0 can no longer inflate into giant black shapes.
- **Decimation:** coin 941 → 282 triangles, pill 367, potion 467, car 2.7k → 1.4k. Use `pipeline/dec_pack.sh <pack.json> <ratio>`, which runs a Blender collapse and keeps the texture unchanged.
- **Measured** with `pipeline/bench.cjs`, averaged over 8 views from a fixed spot:
  - Phone landscape (844×390): about 555 draw calls and 525k triangles; worst view about 600 calls and 575k triangles.
  - Desktop: about 500 calls and 550k triangles, including the shadow pass.
  - For comparison, the original game drew about 541 calls and 612k triangles.

**Download**
- Boot: about 6.3 MB (code 0.8 MB, animations 0.6 MB, all props, houses and collectibles, plus Flight).
- Streamed: about 9.6 MB of heroes, after the player is already in the menu.
- Everything ships as `.json`, `.js`, `.css`, `.html` or `.png`.

**Phone floor:** aim at 2019+ mid-range phones (Snapdragon 7-series / Apple A12 and up). Lower-end devices aren't a target.

**Pipeline additions**
- `meshy_img.py` reads the key from the `MESHY_KEY` environment variable. No key is stored anywhere in this package.
- `hero_proc.sh <name> <glb_url|local> [--flip]` runs skin → 4-side preview.
- `lod_pack.mjs <hero.json>` adds the LOD index (needs `npm i meshoptimizer`).
- `bench.cjs <url> <1=phone|0=desktop> [seed]` prints average and maximum draw calls and triangles.

## Textures as separate files (optional)
`authored.js` loads a pack's texture either embedded (`data:` URI, the default, which suits a host that only allows .json/.png) or as an image file next to the pack. For hosts that review media (the Claude artifact's public sharing does), run `python3 pipeline/extract_tex.py dist/models` after `vite build`. It writes `models/tex/<pack>.webp` and points each pack at it.
Also run `python3 pipeline/strip_avif.py dist/assets`. three's GLTFLoader embeds a tiny AVIF test image, and media reviewers reject the AVIF format; our packs never use AVIF.

## Comic VFX pass (`src/fx.js`)
- **Particles:** every particle is now an opaque flat shape with an ink outline and two-tone cel shading. Additive glow is gone, so effects no longer wash out to white when they overlap. Particles step through two colours as they age and shrink away at the end instead of fading.
- **Shapes:** `dot`, `spark` (4-point star), `puff` (cloud), `flame` (teardrop that trails its tip behind its on-screen motion), `shard` (ice/debris diamond) and `streak` (speed line along its motion). Set them per call: `fx.emit(x, y, z, { shape, color, color2, grow, spin, ... })`.
- **Rings:** shockwaves are inked ground bands that thin out as they expand. `burst: true` gives them a spiky comic edge (explosions, landings, cryo nova, round start, player death).
- **Starbursts:** `fx.burst(x, y, z, { color, size })` pops a comic impact flash card for hits, kills, explosions, teleport arrivals and the landing.
- **Palette and recipes:** the shared palette lives in `FXC` in `fx.js`, and `deep(color)` returns the darker second tone for power-coloured effects. The recipes are on `Game`:
  - `poof`: teleport, invisibility, shapeshift, clones.
  - `hitFx`: punches.
  - `explosionFx`: fireballs.
  - `dustRing`: take-off, landing, cryo frost.
- **Phones:** particle size now scales with the device pixel ratio, so effects are the same size on screen on high-DPI phones. Size is capped at 20% of screen height, so nothing fills the view when it bursts right in front of the camera.
- **Review tool:** `pipeline/fxlab.cjs <url> <outprefix> [names]` triggers each effect from a fixed spot and freezes the frame for screenshots. `fxgrid.py` tiles the shots into a contact sheet. `build.sh` runs the Vite build plus the artifact-safe post steps.
