# Security and privacy incident response

1. Declare severity and assign incident commander, security, privacy/records, operations, and communications owners. Preserve timestamps and signed audit evidence.
2. Contain: disable affected sessions/identities and delegations, revoke credentials, block suspicious organizations/object keys, stop AI egress when the processing boundary is in doubt, and place legal holds before any deletion.
3. Investigate tenant scope using access, signed-workflow, IdP, object-version, malware-scan, AI-provenance, and deletion-job records. Never export unrelated tenant content.
4. Eradicate and recover with rotated secrets, patched images, restored isolated data if needed, checksum/audit-chain verification, and controlled traffic restoration.
5. Privacy/legal owners determine notification and records obligations. Communications require counsel approval; do not put sensitive document content in tickets or chat.
6. Within five business days, record root cause, affected identities/organizations/objects, timeline, control failures, recovery evidence, notifications, and owned corrective actions.

Credential material formerly committed in `PRODUCTION_CREDENTIALS.txt`, `open_router_key.txt`, and database exports must be treated as exposed. Rotate every referenced password/API key, invalidate sessions, review provider access logs, remove the blobs from Git history with a reviewed `git filter-repo` procedure, force collaborators to re-clone, and rescan all refs and backup copies. Worktree deletion alone is not remediation.

