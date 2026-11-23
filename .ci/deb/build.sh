#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${OUT_DIR:-./build-out}"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

mkdir -p "$OUT_DIR"

docker buildx build \
    --file .ci/deb/Dockerfile \
    --target artifact \
    --build-arg "PKG_VERSION=${PKG_VERSION:-}" \
    --output "type=local,dest=${OUT_DIR}" \
    .

ls -la "$OUT_DIR"
