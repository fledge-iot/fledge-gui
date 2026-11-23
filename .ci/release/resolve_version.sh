#!/usr/bin/env bash
set -euo pipefail

RELEASE_BRANCH="${RELEASE_BRANCH:-develop}"
EVENT_NAME="${GITHUB_EVENT_NAME:-}"
REF_NAME="${GITHUB_REF_NAME:-}"
OUTPUT="${GITHUB_OUTPUT:-/dev/stdout}"

base="$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -1)"
if [[ ! "${base}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "ERROR: package.json version '${base}' is not MAJOR.MINOR.PATCH" >&2
    exit 1
fi

deb_version="${base}"
image_version="${base}"
prerelease=false

if [[ "${EVENT_NAME}" == "release" ]]; then
    tag="${REF_NAME#v}"
    if [[ "${tag}" == "${base}" ]]; then
        :
    elif [[ "${tag}" =~ ^${base//./\.}-rc\.([0-9]+)$ ]]; then
        deb_version="${base}~rc.${BASH_REMATCH[1]}"
        image_version="${base}-rc.${BASH_REMATCH[1]}"
        prerelease=true
    else
        echo "ERROR: release tag '${REF_NAME}' must be v${base} or v${base}-rc.N to match package.json version '${base}'" >&2
        exit 1
    fi
    tag_sha="$(git rev-parse "${REF_NAME}^{commit}")"
    if [[ "${tag_sha}" != "${GITHUB_SHA}" ]]; then
        echo "ERROR: tag '${REF_NAME}' resolves to ${tag_sha} but workflow is running on ${GITHUB_SHA}" >&2
        exit 1
    fi
    git fetch --no-tags origin "+refs/heads/${RELEASE_BRANCH}:refs/remotes/origin/${RELEASE_BRANCH}"
    if ! git merge-base --is-ancestor "${GITHUB_SHA}" "refs/remotes/origin/${RELEASE_BRANCH}"; then
        echo "ERROR: tag '${REF_NAME}' (${GITHUB_SHA}) is not an ancestor of origin/${RELEASE_BRANCH}; only commits merged into ${RELEASE_BRANCH} may be released" >&2
        exit 1
    fi
fi

{
    echo "deb_version=${deb_version}"
    echo "image_version=${image_version}"
    echo "prerelease=${prerelease}"
} >> "${OUTPUT}"
