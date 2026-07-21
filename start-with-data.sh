#!/usr/bin/env bash
set -euo pipefail
echo "start-with-data.sh is disabled: automatic restore, reset, migration, and seed are unsafe." >&2
echo "Use ./start.sh restore-verify, ./start.sh migrate, and ./start.sh production as separate reviewed steps." >&2
exit 2
