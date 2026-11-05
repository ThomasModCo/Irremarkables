#!/bin/bash
# usage: proc_prop.sh <name> <glb_url> <size e.g. h4.2 | 2.2> [extra prep flags...]
set -e
N=$1; U=$2; SZ=$3; shift 3
D=/home/claude/work/props/$N; [ -f $D/src.glb ] && cp $D/src.glb /home/claude/work/props/$N.src.glb; rm -rf $D; mkdir -p $D/out
if [ "$U" = local ]; then cp /home/claude/work/props/$N.src.glb $D/src.glb; else curl -sS -m 120 -o $D/src.glb "$U"; fi
python3.11 /home/claude/tools/prep_prop.py $D/src.glb $D/out $SZ "$@" 2>&1 | grep "final\|faces" || true
python3.11 /home/claude/tools/preview.py $D/out/prop.gltf $D/pv.png > /dev/null 2>&1 || true
mkdir -p $D/q
(cd /home/claude/gt && npx gltf-transform quantize $D/out/prop.gltf $D/q/prop.gltf --vertex-layout separate > /dev/null 2>&1)
