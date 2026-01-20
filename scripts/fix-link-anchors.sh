#!/usr/bin/env bash
set -euo pipefail

# This script updates occurrences of:
#   <Link ...><a ...>CONTENT</a></Link>
# into:
#   <Link ... a-attributes...>CONTENT</Link>
# It uses Perl multi-line regex — please review .bak files produced before committing.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Repo root: $ROOT"
cd "$ROOT"

# Find target files
FILES=$(git ls-files '*.tsx' '*.ts' '*.jsx' '*.js' | grep -E '(^|/)(components|app|pages|src)/' || true)
if [ -z "$FILES" ]; then
  echo "No matching files found by git. Searching working tree..."
  FILES=$(find . -type f -name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js')
fi

echo "Processing files..."
# Use perl to perform a safe in-place replacement and keep a .bak backup for review
for f in $FILES; do
  # Only touch files that contain the pattern to avoid unnecessary backups
  if grep -qP '<Link[^>]*>\s*<a[^>]*>' "$f"; then
    cp "$f" "${f}.bak"
    perl -0777 -pe '
      # Replace <Link ...> <a ...> ... </a> </Link> with <Link ... a-attrs...> ... </Link>
      s#<Link([^>]*)>\s*<a([^>]*)>(.*?)</a>\s*</Link>#<Link$1 $2>$3</Link>#gs;
    ' "${f}.bak" > "$f"
    echo "Updated: $f (backup: ${f}.bak)"
  fi
done

echo "Done. Please review .bak files for manual adjustments where necessary."
echo "Tip: run 'git diff' and test your app. If some cases must keep the <a>, revert that file and fix manually (or use <Link legacyBehavior>)."
