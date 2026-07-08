#!/usr/bin/env bash
# Wrapper invoked by Hermes Agent. Resolves the project root relative to this
# script's own location (not the caller's cwd), so it works no matter where
# Hermes runs it from.
#
# Usage: generate.sh <data.json> <output.pdf>

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"

DATA_JSON="${1:?Usage: generate.sh <data.json> <output.pdf>}"
OUTPUT_PDF="${2:?Usage: generate.sh <data.json> <output.pdf>}"

cd "$PROJECT_ROOT"

# Rebuild CSS only if the template or config changed since the last build
# (keeps repeated invocations fast).
if [ ! -f dist/tailwind.css ] || [ src/template.js -nt dist/tailwind.css ] || [ tailwind.config.js -nt dist/tailwind.css ]; then
  bun run build:css
fi

bun scripts/generate.js "$DATA_JSON" "$OUTPUT_PDF"
