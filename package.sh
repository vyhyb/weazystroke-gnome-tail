#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

gnome-extensions pack --force \
    --extra-source=styleEngine.js \
    --extra-source=trailRender.js \
    --extra-source=weazystrokeConfig.js \
    --extra-source=LICENSE \
    --extra-source=README.md \
    "$SCRIPT_DIR" \
    --out-dir="$SCRIPT_DIR"
