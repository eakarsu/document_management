# Production runbook

## Release and migration

1. Require green `verify` and `secrets` jobs, an approved image digest, and the gates in `RELEASE_GATES.md`.
2. Confirm PostgreSQL PITR and object-store versioning/replication are healthy. Run `BACKUP_FILE=/absolute/restricted/path ./start.sh backup` and restore it into an isolated database with `RESTORE_SOURCE=... RESTORE_TEST_DATABASE_URL=... ./start.sh restore-verify`.
3. Review `prisma migrate status`, set `MIGRATION_BACKUP_CONFIRMED=true`, and run `./start.sh migrate` as a one-shot deployment job. Normal startup never migrates or seeds.
4. Deploy one canary, require `/health/ready` to report database, encrypted object storage, and malware scanner `up`, then expand. Roll back the application image on errors. Database rollback is a reviewed forward migration; restore is reserved for destructive data incidents.

Demo data is forbidden in production. `seed-demo` requires both non-production `NODE_ENV` and `ALLOW_DEMO_SEED=true`.

## Backup, recovery, and disaster recovery

- Target RPO: 15 minutes for PostgreSQL and object versions. Target RTO: 4 hours. Owners must validate provider replication meets both targets.
- Keep encrypted PostgreSQL PITR/WAL and daily custom-format dumps for the approved records schedule. Keep object versioning, immutable replication, checksums, and deletion markers in the same DR region.
- Quarterly: restore database to an isolated account, point a quarantined app at replicated objects, run migration status, verify signed-audit chains/checksums, sample document downloads, and complete a 12-stage workflow.
- Never restore over production. Declare an incident, freeze writes, select the recovery point, restore to a new environment, validate tenant counts/audit chains/object manifests, then switch traffic with two-person approval.

## Operations and alerts

Page the service owner for readiness failures, database saturation, storage/scanner errors, deletion jobs in `FAILED`/`BLOCKED_LEGAL_HOLD`, signature verification failures, repeated workflow conflicts, OIDC/JWKS failures, or abnormal cross-tenant denials. Log JSON to the approved SIEM without tokens, cookies, document bodies, prompts, passwords, or object credentials. Correlate by request, organization, document, workflow, and signed-audit IDs.

Daily review: backup freshness, deletion retries, legal holds, inactive sessions, AI artifacts awaiting review, audit-chain verification, dependency/secret scan results. Monthly review: IdP groups, delegations, clearance/caveat mappings, records schedules, service accounts, encryption keys, and restore evidence.

## Key and IdP rotation

Use the secret manager, never `.env` files in production. Rotate JWT refresh and audit signing keys with overlap: publish a new key ID, accept the prior verification key for the approved grace period, expire sessions as required, then revoke the old key. Pre-provision OIDC identities, require IdP MFA, verify issuer/audience/nonce, and disable local authentication when organization policy requires SSO.

