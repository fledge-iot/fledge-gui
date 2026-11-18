#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="${1:?ERROR: missing argument DIST_DIR (built GUI directory)}"
OUT_DIR="${2:?ERROR: missing argument OUTPUT_DIR for the built .deb}"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

PKG_NAME=fledge-gui
PKG_VERSION="$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -1)"
if [[ -z "$PKG_VERSION" ]]; then
    echo "ERROR: version not found in package.json" >&2
    exit 1
fi
if [[ ! -f "${DIST_DIR}/fledge.html" ]]; then
    echo "ERROR: ${DIST_DIR}/fledge.html not found; build the GUI first" >&2
    exit 1
fi

STAGE="$(mktemp -d)"
cp -R packages/Debian/DEBIAN "${STAGE}/DEBIAN"
sed -i "s/^Version: .*/Version: ${PKG_VERSION}/" "${STAGE}/DEBIAN/control"

mkdir -p "${STAGE}/var/www/html" "${STAGE}/etc/nginx/snippets" "${STAGE}/etc/nginx/sites-available"
cp -R "${DIST_DIR}"/. "${STAGE}/var/www/html/"
install -m 0644 nginx/fledge-gui.conf "${STAGE}/etc/nginx/snippets/fledge-gui.conf"
install -m 0644 nginx/site.conf "${STAGE}/etc/nginx/sites-available/fledge-gui"
chmod 0755 "${STAGE}/DEBIAN/preinst" "${STAGE}/DEBIAN/postinst" "${STAGE}/DEBIAN/postrm"

mkdir -p "$OUT_DIR"
dpkg-deb --build --root-owner-group "$STAGE" "${OUT_DIR}/${PKG_NAME}_${PKG_VERSION}_all.deb"

ls -la "$OUT_DIR"
