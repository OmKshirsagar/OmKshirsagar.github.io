#!/usr/bin/env bash
# scripts/voxel/build_all.sh — regenerate every journey voxel asset.
set -euo pipefail
MCP="/Users/okshirsagar/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/pet/voxel/magicavoxel-mcp"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MCP"
for b in build_om build_jaihind build_props build_npc; do
  echo "=== $b ==="
  .venv/bin/python "$HERE/$b.py"
done
echo "ALL VOXEL ASSETS BUILT"
