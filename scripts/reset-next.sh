#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Running clean-next-manifests.js..."
node scripts/clean-next-manifests.js || true

if [ -d ".next" ]; then
  echo "Removing .next..."
  rm -rf .next
fi

echo "Starting dev server..."
# use npm or yarn depending on your project
npm run dev
