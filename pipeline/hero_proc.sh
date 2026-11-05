#!/bin/bash
# usage: hero_proc.sh <name> <glb_url|local> [--flip]
# download -> skin to Mixamo skeleton -> front/back preview of the skinned mesh
set -e
N=$1; U=$2; shift 2
D=/home/claude/work/heroes/$N; mkdir -p $D
[ "$U" = local ] || curl -sS -m 180 -o $D/src.glb "$U"
rm -rf $D/sk; mkdir -p $D/sk
timeout 600 python3.11 /home/claude/tools/skin_hero.py $D/src.glb /home/claude/game/public/anims.json $D/sk "$@" 2>&1 | grep "facing\|fit factor\|arm y\|unweighted" | sed "s/^/$N: /"
python3.11 /home/claude/tools/preview.py $D/sk/hero.gltf $D/pv.png > /dev/null 2>&1 || true
