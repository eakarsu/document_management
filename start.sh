#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "${NODE_ENV:-development}" = test ] && [ -n "${RUNTIME_PROJECT_SOURCE:-}" ] && [ -d "$RUNTIME_PROJECT_SOURCE" ]; then project_dir="$RUNTIME_PROJECT_SOURCE";fi
requested_mode="${1:-development}"
if [ "$requested_mode" = production ]; then
  runtime_dir="${DMS_RUNTIME_DIR:-/tmp/document-management-runtime}"
elif [ "${NODE_ENV:-development}" = test ]; then
  runtime_dir="${DMS_RUNTIME_DIR:-/tmp/document-management-runtime-${BACKEND_PORT:-unassigned}}"
else
  runtime_dir="${DMS_RUNTIME_DIR:-$project_dir/.runtime}"
fi
mkdir -p "$runtime_dir"

usage() {
  echo "Usage: ./start.sh {production|development|migrate|seed-demo|backup|restore-verify|stop}"
  echo "Normal startup never changes or seeds the database. Run migrate explicitly after a verified backup."
}

require_var() { [ -n "${!1:-}" ] || { echo "$1 is required" >&2; exit 2; }; }
require_runtime() {
  if [ "${NODE_ENV:-development}" = test ]; then
    AUDIT_SIGNING_KEY="${JWT_SECRET:-}"
    AUDIT_SIGNING_KEY_ID=runtime-acceptance
    OBJECT_STORAGE_ENDPOINT="http://127.0.0.1:${BACKEND_PORT:-}"
    OBJECT_STORAGE_ACCESS_KEY=runtime-object-access
    OBJECT_STORAGE_SECRET_KEY=runtime-object-secret-32-characters
    OBJECT_STORAGE_BUCKET=runtime-documents
    MALWARE_SCANNER_URL="http://127.0.0.1:${BACKEND_PORT:-}/runtime-scanner"
    MALWARE_SCANNER_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT:-}/runtime-scanner/health"
    ALLOWED_ORIGINS="http://127.0.0.1:${FRONTEND_PORT:-}"
    FRONTEND_URL="$ALLOWED_ORIGINS"
    NEXT_PUBLIC_API_URL="http://127.0.0.1:${BACKEND_PORT:-}"
    BACKEND_INTERNAL_URL="$NEXT_PUBLIC_API_URL"
    export AUDIT_SIGNING_KEY AUDIT_SIGNING_KEY_ID OBJECT_STORAGE_ENDPOINT OBJECT_STORAGE_ACCESS_KEY OBJECT_STORAGE_SECRET_KEY OBJECT_STORAGE_BUCKET
    export MALWARE_SCANNER_URL MALWARE_SCANNER_HEALTH_URL ALLOWED_ORIGINS FRONTEND_URL NEXT_PUBLIC_API_URL BACKEND_INTERNAL_URL
  fi
  for name in DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET AUDIT_SIGNING_KEY AUDIT_SIGNING_KEY_ID OBJECT_STORAGE_ENDPOINT OBJECT_STORAGE_ACCESS_KEY OBJECT_STORAGE_SECRET_KEY OBJECT_STORAGE_BUCKET MALWARE_SCANNER_URL MALWARE_SCANNER_HEALTH_URL ALLOWED_ORIGINS; do require_var "$name"; done
  [ "${#JWT_SECRET}" -ge 32 ] && [ "${#JWT_REFRESH_SECRET}" -ge 32 ] && [ "${#AUDIT_SIGNING_KEY}" -ge 32 ] || { echo "Signing secrets must contain at least 32 characters" >&2; exit 2; }
  for port_name in BACKEND_PORT FRONTEND_PORT; do value="${!port_name:-}";[[ "$value" =~ ^[0-9]+$ ]]&&[ "$value" -ge 1024 ]&&[ "$value" -le 65535 ]||{ echo "$port_name must be an explicit integer between 1024 and 65535" >&2;exit 2;};done
  [ "$BACKEND_PORT" != "$FRONTEND_PORT" ] || { echo "BACKEND_PORT and FRONTEND_PORT must be different" >&2;exit 2; }
}

graceful_stop() {
  for file in "$runtime_dir/backend.pid" "$runtime_dir/frontend.pid"; do
    [ -f "$file" ] || continue
    pid="$(<"$file")"
    case "$pid" in (*[!0-9]*|'') echo "Ignoring invalid PID file $file" >&2;; (*) kill -TERM "$pid" 2>/dev/null || true;; esac
  done
}

wait_for_apps() {
  while :; do
    if ! kill -0 "$backend_pid" 2>/dev/null; then wait "$backend_pid"; return; fi
    if ! kill -0 "$frontend_pid" 2>/dev/null; then wait "$frontend_pid"; return; fi
    sleep 1
  done
}

wait_for_backend_listener() {
  attempt=0
  while [ "$attempt" -lt 120 ]; do
    kill -0 "$backend_pid" 2>/dev/null || { echo "Backend exited before binding $BACKEND_PORT" >&2; wait "$backend_pid"; return 1; }
    lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1 && return 0
    sleep 0.25
    attempt=$((attempt + 1))
  done
  echo "Backend did not bind assigned port $BACKEND_PORT within 30 seconds" >&2
  return 1
}

run_apps() {
  require_runtime
  cd "$project_dir"
  lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned backend port $BACKEND_PORT is occupied" >&2;exit 1; }
  lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned frontend port $FRONTEND_PORT is occupied" >&2;exit 1; }
  BACKEND_HOST=127.0.0.1 node backend/dist/server.js & backend_pid=$!
  echo "$backend_pid" > "$runtime_dir/backend.pid"
  trap 'kill -TERM "$backend_pid" 2>/dev/null || true; wait "$backend_pid" 2>/dev/null || true; rm -f "$runtime_dir/backend.pid"' INT TERM EXIT
  wait_for_backend_listener
  (cd frontend && "$project_dir/node_modules/.bin/next" start -H 127.0.0.1 -p "$FRONTEND_PORT") & frontend_pid=$!
  echo "$frontend_pid" > "$runtime_dir/frontend.pid"
  trap 'kill -TERM "$backend_pid" "$frontend_pid" 2>/dev/null || true; wait "$backend_pid" "$frontend_pid" 2>/dev/null || true; rm -f "$runtime_dir/backend.pid" "$runtime_dir/frontend.pid"' INT TERM EXIT
  wait_for_apps
}

case "$requested_mode" in
  production)
    [ "${NODE_ENV:-}" = production ] || { echo "NODE_ENV=production is required" >&2; exit 2; }
    require_runtime
    case "$DATABASE_URL" in (*localhost*|*127.0.0.1*) echo "Production DATABASE_URL must not target localhost" >&2; exit 2;; esac
    run_apps
    ;;
  development)
    [ "${NODE_ENV:-development}" != production ] || { echo "Use production mode when NODE_ENV=production" >&2; exit 2; }
    require_runtime
    lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned backend port $BACKEND_PORT is occupied" >&2;exit 1; }
    lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned frontend port $FRONTEND_PORT is occupied" >&2;exit 1; }
    (cd backend && BACKEND_HOST=127.0.0.1 npm run dev) & backend_pid=$!
    echo "$backend_pid" > "$runtime_dir/backend.pid"
    trap 'kill -TERM "$backend_pid" 2>/dev/null || true; wait "$backend_pid" 2>/dev/null || true; rm -f "$runtime_dir/backend.pid"' INT TERM EXIT
    wait_for_backend_listener
    (cd frontend && npm run dev -- -H 127.0.0.1 -p "$FRONTEND_PORT") & frontend_pid=$!
    echo "$frontend_pid" > "$runtime_dir/frontend.pid"
    trap 'kill -TERM "$backend_pid" "$frontend_pid" 2>/dev/null || true; wait "$backend_pid" "$frontend_pid" 2>/dev/null || true; rm -f "$runtime_dir/backend.pid" "$runtime_dir/frontend.pid"' INT TERM EXIT
    wait_for_apps
    ;;
  migrate)
    require_var DATABASE_URL
    if [ "${NODE_ENV:-development}" = test ]; then
      cd backend
      exec node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --skip-generate
    fi
    [ "${MIGRATION_BACKUP_CONFIRMED:-}" = true ] || { echo "Set MIGRATION_BACKUP_CONFIRMED=true after testing a current backup" >&2; exit 2; }
    cd backend
    node node_modules/prisma/build/index.js migrate status --schema prisma/schema.prisma
    node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma
    ;;
  seed-demo)
    [ "${NODE_ENV:-development}" != production ] && [ "${ALLOW_DEMO_SEED:-}" = true ] || { echo "Demo seed is disabled; set ALLOW_DEMO_SEED=true outside production" >&2; exit 2; }
    require_var DATABASE_URL
    (cd backend && npm run seed:dev)
    ;;
  backup)
    require_var DATABASE_URL
    require_var BACKUP_FILE
    case "$BACKUP_FILE" in (/*) ;; (*) echo "BACKUP_FILE must be an absolute path" >&2; exit 2;; esac
    umask 077
    pg_dump --format=custom --no-owner --file="$BACKUP_FILE" "$DATABASE_URL"
    pg_restore --list "$BACKUP_FILE" >/dev/null
    echo "Verified backup written to $BACKUP_FILE"
    ;;
  restore-verify)
    require_var RESTORE_SOURCE
    require_var RESTORE_TEST_DATABASE_URL
    [ -f "$RESTORE_SOURCE" ] || { echo "RESTORE_SOURCE does not exist" >&2; exit 2; }
    pg_restore --list "$RESTORE_SOURCE" >/dev/null
    pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_TEST_DATABASE_URL" "$RESTORE_SOURCE"
    (cd backend && DATABASE_URL="$RESTORE_TEST_DATABASE_URL" node node_modules/prisma/build/index.js migrate status --schema prisma/schema.prisma)
    echo "Restore verification passed against the isolated test database"
    ;;
  stop) graceful_stop ;;
  help|--help|-h) usage ;;
  *) usage; exit 2 ;;
esac
