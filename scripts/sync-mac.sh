#!/usr/bin/env bash
set -euo pipefail
ROOT="${HOME}/NiteRun/niterunservices-site"
REPO="https://github.com/chaybuilds/niterunservices-site.git"
mkdir -p "${HOME}/NiteRun"
if [[ ! -d "${ROOT}/.git" ]]; then
  echo "Cloning shared NiteRun Services source on this Mac..."
  git clone "${REPO}" "${ROOT}"
fi
cd "${ROOT}"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Local changes detected. Refusing to overwrite Mac work; commit or stash first." >&2
  exit 2
fi
git fetch origin main
git pull --ff-only origin main
npm run check
echo "Source synced safely. Live customer requests remain in protected Supabase, never Git."
