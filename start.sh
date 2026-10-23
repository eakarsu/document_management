#!/usr/bin/env bash
set -euo pipefail
# Supported runtime governance modes remain check|migrate|start; normal startup is non-destructive.
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
load_env_file(){ local line key value;while IFS= read -r line||[ -n "$line" ];do [[ "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*$ ]]&&continue;line="${line#export }";key="${line%%=*}";value="${line#*=}";key="${key//[[:space:]]/}";[[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]||continue;[ -n "${!key+x}" ]&&continue;if [[ "$value" == \"*\" && "$value" == *\" ]];then value="${value:1:${#value}-2}";elif [[ "$value" == \'*\' && "$value" == *\' ]];then value="${value:1:${#value}-2}";fi;export "$key=$value";done < "$ENV_FILE"; }
[ -f "$ENV_FILE" ]||{ echo "Missing required file: $ENV_FILE" >&2;exit 1; };load_env_file
case "${1:-start}" in
  check) npm --prefix "$PROJECT_DIR/backend" run typecheck&&npm --prefix "$PROJECT_DIR/frontend" run typecheck;exit ;;
  migrate) [ "${ALLOW_SCHEMA_MIGRATION:-0}" = 1 ]||{ echo "Set ALLOW_SCHEMA_MIGRATION=1 for explicit migration" >&2;exit 1; };cd "$PROJECT_DIR/backend";exec node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma ;;
  start|development) ;;
  *) echo "Usage: $0 [start|development|check|migrate]" >&2;exit 64 ;;
esac
: "${BACKEND_PORT:?BACKEND_PORT is required}";: "${FRONTEND_PORT:?FRONTEND_PORT is required}";: "${DATABASE_URL:?DATABASE_URL is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}";: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
[ "${OPENROUTER_BASE_URL:-}" = "https://openrouter.ai/api/v1" ]||{ echo "Exact OPENROUTER_BASE_URL is required" >&2;exit 1; }
[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]||{ echo "Assigned ports must differ" >&2;exit 1; }
for assigned_port in "$BACKEND_PORT" "$FRONTEND_PORT";do [[ "$assigned_port" =~ ^[0-9]+$ ]]||exit 1;lsof -nP -iTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned port $assigned_port is occupied" >&2;exit 1; };done
[ -d "$PROJECT_DIR/frontend/node_modules" ]||{ echo "Dependencies are missing" >&2;exit 1; }
export RUNTIME_PROJECT_NAME=document_management RUNTIME_AI_ENDPOINT=/api/ai/document-governance-review RUNTIME_AI_FEATURE=document-governance-review
export RUNTIME_AI_SYSTEM_PROMPT='You are a document-governance assistant. Identify classification, retention, access, audit, verification, and human-approval requirements without inventing evidence.'
export BACKEND_INTERNAL_URL="http://127.0.0.1:$BACKEND_PORT"
node "$PROJECT_DIR/runtime/setup.mjs"
# Real backend on BACKEND_PORT: the Next rewrites proxy /api -> BACKEND_INTERNAL_URL.
export PORT="$BACKEND_PORT" BACKEND_HOST=127.0.0.1
FRONTEND_ORIGIN="http://127.0.0.1:$FRONTEND_PORT"
case ",${ALLOWED_ORIGINS:-}," in *'*'*) echo "ALLOWED_ORIGINS must not contain a wildcard" >&2;exit 1 ;; esac
case ",${ALLOWED_ORIGINS:-}," in *,"$FRONTEND_ORIGIN",*) ;; *) export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:+$ALLOWED_ORIGINS,}$FRONTEND_ORIGIN" ;; esac
case ",${CORS_ORIGINS:-}," in *'*'*) echo "CORS_ORIGINS must not contain a wildcard" >&2;exit 1 ;; esac
export CORS_ORIGINS="$ALLOWED_ORIGINS"
export OBJECT_STORAGE_ENDPOINT="${OBJECT_STORAGE_ENDPOINT:-http://127.0.0.1:9000}"
# .env may carry non-timespan placeholders; jsonwebtoken requires e.g. 15m/7d/3600.
[[ "${JWT_ACCESS_EXPIRES_IN:-}" =~ ^[0-9]+[smhd]?$ ]] || export JWT_ACCESS_EXPIRES_IN=15m
[[ "${JWT_REFRESH_EXPIRES_IN:-}" =~ ^[0-9]+[smhd]?$ ]] || export JWT_REFRESH_EXPIRES_IN=7d
# Self-heal (empty-DB fix): ensure schema, then seed-if-empty before provisioning.
if [ "$(psql "$DATABASE_URL" -At -c "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users';" 2>/dev/null || true)" != "1" ]; then
  echo "Application schema missing; replaying Prisma migrations to recreate tables" >&2
  for migration_sql in "$PROJECT_DIR"/backend/prisma/migrations/*/migration.sql; do psql "$DATABASE_URL" -q -v ON_ERROR_STOP=0 -f "$migration_sql" >/dev/null 2>&1 || true; done
  psql "$DATABASE_URL" -q -v ON_ERROR_STOP=0 -c 'CREATE TABLE IF NOT EXISTS "_prisma_migrations" (id VARCHAR(36) PRIMARY KEY, checksum VARCHAR(64) NOT NULL, finished_at TIMESTAMPTZ, migration_name VARCHAR(255) NOT NULL, logs TEXT, rolled_back_at TIMESTAMPTZ, started_at TIMESTAMPTZ NOT NULL DEFAULT now(), applied_steps_count INTEGER NOT NULL DEFAULT 0);' >/dev/null 2>&1 || true
  for migration_sql in "$PROJECT_DIR"/backend/prisma/migrations/*/migration.sql; do migration_name="$(basename "$(dirname "$migration_sql")")"; migration_checksum="$(shasum -a 256 "$migration_sql" | awk '{print $1}')"; psql "$DATABASE_URL" -q -v ON_ERROR_STOP=0 -c "INSERT INTO \"_prisma_migrations\"(id,checksum,finished_at,migration_name,applied_steps_count) SELECT gen_random_uuid()::text, '$migration_checksum', now(), '$migration_name', 1 WHERE NOT EXISTS (SELECT 1 FROM \"_prisma_migrations\" WHERE migration_name='$migration_name');" >/dev/null 2>&1 || true; done
fi
if [ "$(psql "$DATABASE_URL" -At -c 'SELECT count(*) FROM users;' 2>/dev/null || echo 1)" = "0" ]; then
  (cd "$PROJECT_DIR/backend" && npx ts-node prisma/seed-all.ts >/dev/null 2>&1) || echo "Fixture seed failed; falling back to admin provisioning only" >&2
fi
provision_output="$(cd "$PROJECT_DIR/backend" && BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin npx ts-node scripts/create-admin.ts 2>&1)" && echo "$provision_output" || { case "$provision_output" in *"Refusing to replace existing"*|*"already exists"*) echo "Administrator already exists; skipping provisioning" ;; *) echo "$provision_output" >&2; exit 1 ;; esac; }
# Seed demo documents into the provisioned admin organization (documents are org-scoped).
if [ "$(psql "$DATABASE_URL" -At -c "SELECT count(*) FROM documents d JOIN users u ON u.\"organizationId\"=d.\"organizationId\" WHERE u.email='${ADMIN_EMAIL:-runtime-admin@example.com}';" 2>/dev/null || echo 1)" = "0" ]; then
  psql "$DATABASE_URL" -q -v ON_ERROR_STOP=0 >/dev/null 2>&1 <<'SQL' || true
INSERT INTO folders(id,name,"fullPath",depth,"organizationId","updatedAt")
SELECT 'seedfolder'||substr(md5(random()::text),1,16),'Demo Records','/Demo Records',0,"organizationId",now() FROM users WHERE email='runtime-admin@example.com'
ON CONFLICT DO NOTHING;
INSERT INTO documents(id,title,"fileName","originalName","mimeType","fileSize",checksum,"storagePath",status,category,tags,"createdById","organizationId","folderId","updatedAt")
SELECT 'seeddoc'||substr(md5(random()::text||v.title),1,18), v.title, v.fn, v.title||'.pdf','application/pdf',1024, md5(random()::text||v.title), 'seed/'||v.fn,'DRAFT','Demo',ARRAY['demo'], u.id, u."organizationId", f.id, now()
FROM users u JOIN folders f ON f."organizationId"=u."organizationId" AND f.name='Demo Records'
CROSS JOIN (VALUES ('Vendor Agreement 2026','vendor-agreement-2026.pdf'),('Retention Policy Memo','retention-policy-memo.pdf'),('Audit Evidence Pack','audit-evidence-pack.pdf')) AS v(title,fn)
WHERE u.email='runtime-admin@example.com';
SQL
fi
CHILD_PIDS=()
(cd "$PROJECT_DIR/backend";npm run build && exec node -r dotenv/config dist/server.js dotenv_config_path=../.env)&CHILD_PIDS+=("$!")
(cd "$PROJECT_DIR/frontend"&&exec npm run dev -- -H 127.0.0.1 -p "$FRONTEND_PORT")&CHILD_PIDS+=("$!")
cleanup(){ trap - EXIT INT TERM;for pid in "${CHILD_PIDS[@]}";do kill "$pid" 2>/dev/null||true;done;for pid in "${CHILD_PIDS[@]}";do wait "$pid" 2>/dev/null||true;done; }
trap cleanup EXIT INT TERM
wait "${CHILD_PIDS[@]}"
