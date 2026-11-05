#!/bin/bash
# vite build + artifact-safe post steps (separate texture files, no AVIF probe)
set -e
cd /home/claude/game && npx vite build --logLevel error
python3 /home/claude/tools/extract_tex.py dist/models > /dev/null
python3 /home/claude/tools/strip_avif.py dist/assets
