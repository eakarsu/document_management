# Completeness Review: document_management

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source, configuration, schema, workflow plugins, startup scripts, and tests only; no dependency installation, build, database migration/reset, document processing, AI-provider call, or runtime launch was performed.

## Classification

**Complete local scope**

The application has a substantial local document-management workflow: organizations and users, document versions and permissions, review/approval stages, publishing, search, attachments, AI assistance, and many workflow/browser tests. Its local feature surface is coherent, but the repository is not safe to launch or deploy unchanged.

## Why it is not production-ready

- A credential-named artifact and database backup/user-password artifacts are present in the tree and require immediate provenance, exposure, and Git-history review.
- The data-loading launcher can run `prisma db push --force-reset`, making normal startup capable of destroying existing data.
- Document content/version data, attachments, and AI processing need a defined encrypted object-storage and retention architecture rather than mixed local/database artifacts.
- The large test collection is not paired with visible portfolio-grade CI evidence that proves a clean install, migrations, backend/frontend builds, and the supported workflow.
- Government/military-style document workflows require formal identity, classification/handling rules, immutable auditing, records schedules, and authorization review beyond ordinary application RBAC.

## Needed features

1. Remove credential/password/production artifacts from the worktree, rotate anything real, purge exposed Git history where necessary, and enforce secret/artifact scanning.
2. Replace force-reset startup with nondestructive versioned migrations, explicit opt-in demo seeding, preflight checks, backups, rollback, and tested recovery.
3. Add SSO/MFA, attribute- and role-based document access, delegation/approval controls, signed audit events, session policy, and organization isolation tests.
4. Store documents and generated artifacts in encrypted object storage with malware/type validation, version checksums, legal holds, retention, export, and deletion propagation.
5. Add provenance and mandatory reviewer gates for AI-generated/classified content, including model/version records, prompt-injection defenses, and evaluation fixtures.
6. Establish CI and a supported deployment topology covering migrations, API/UI tests, workflow-state invariants, backup restoration, observability, and disaster recovery.

## Risks or launch blockers

- Potential credentials and exported user/password data must be treated as exposed until proven otherwise.
- The force-reset path can irreversibly destroy a database and must not remain in a normal launcher.
- Sensitive document content may be sent to external AI services without an approved data-processing boundary.
- Complex approval state can produce unauthorized publication unless every transition is transactionally enforced and audit-tested.

## Evidence inspected

- `PRODUCTION_CREDENTIALS.txt`
- `start-with-data.sh:390`
- `backend/prisma/schema.prisma:201`
- `backend/src/plugins/AirForce12StagePlugin.ts:15`
- `backend/src/controllers/documents/versionController.ts:27`
- `frontend/tests/final-12-stage-workflow.spec.js`

## Recommended next action

Quarantine credentials and disable the destructive launcher first; then prove one 12-stage document workflow on a fresh database through nondestructive migrations and CI before adding document or AI features.

## Implementation progress (2026-07-19)

The source-actionable review items are implemented. Credential and password-export artifacts were removed and ignored; demo reset/verification tokens and CI signing keys are generated ephemerally; current source passes gitleaks. Startup is nondestructive and separates production, migration, opt-in demo seed, backup, restore verification, and stop operations. A versioned baseline migration, PostgreSQL-backed sessions, OIDC/MFA policy, refresh rotation/reuse revocation, tenant ABAC, clearance/caveat checks, document-and-stage-scoped delegation, serialized signed-audit chains, and a transactionally enforced 12-stage publication workflow are in place. Legacy local-disk, in-memory workflow, unauthenticated version, raw export, direct frontend-database, and ungated AI route bypasses are no longer mounted in the supported production surface.

Documents, versions, supplements, and attachments now use required versioned object storage with server-side encryption, tenant keys, magic/type/size validation, fail-closed malware scanning, checksums, legal holds, retention, export manifests, deletion jobs, retry state, tombstones, and all-version object removal. AI classification/compliance/redaction/redline/version outputs record provider/model/version/source/output provenance, defend and delimit untrusted input, remain advisory until an independent authorized reviewer decides them, reject stale/double decisions, and only approved output reaches the document. CI covers clean install, generation/migration, backend and frontend type/build, PostgreSQL integration tests, dependency audit, image build, and secret scanning; production runbooks define release, migration, restore, incident, observability, RPO/RTO, and external approval gates.

Verification completed from a clean dependency install: Prisma 6.19.3 baseline migration replayed successfully on a disposable PostgreSQL instance with no schema drift; all 13 governance/integration tests passed; backend typecheck/build passed; Next.js 15.5.20 typecheck and production build passed with 81 App Router and 15 Pages Router routes; source-only gitleaks scanned 42.22 MB with zero findings; `npm audit --audit-level=high` reported zero high or critical findings (four moderate); Compose rendering, shell syntax, and destructive-startup negative checks passed. A local container image build was not run because no Docker daemon was available, so the checked-in CI image-build gate remains the execution evidence path.

Production release is still blocked on external evidence and authority: rotate/revoke any formerly exposed credentials and perform the approved Git-history purge; complete IdP/MFA mapping and provider validation; approve the external AI processing boundary, object-store/scanner configuration, key custody, records schedules, privacy/legal posture, accessibility audit, penetration/load testing, backup restoration, regional DR exercise, monitoring/on-call ownership, and reviewed immutable image digests. These items cannot be self-certified from repository source.

## Isolated startup and login verification (2026-07-20)

The launcher now defaults to development for no-argument local execution, requires the distinct assigned backend/frontend ports, binds both to `127.0.0.1`, refuses conflicts, uses portable owned-process supervision, waits for the backend before exposing the frontend, and maps the isolated frontend proxy only to the assigned backend. Test-mode migration is limited to the disposable database. Initial administrator provisioning is acknowledgement-gated, creates a tenant with password login/MFA policy explicitly enabled for acceptance, and refuses account replacement; demo seed is not auto-discovered.

Against disposable PostgreSQL `55643`, the backend started on `6096` and frontend on `6097`; the persisted administrator completed password login, received database-backed refresh/access cookies, and passed `/api/auth/me`. The preserved attempt history documents the repaired failure modes: macOS Bash lacked `wait -n`, the frontend initially raced ahead with a legacy port-4000 proxy, and a router-wide authenticated `/api` mount initially shadowed the public login handler. The final row is `API_VERIFIED/startup_login_session_api`. Backend build, frontend production build, and all 13/13 policy/database integration tests passed on the isolated database. All three assigned ports were released afterward.
