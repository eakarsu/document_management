# Production release gates

Source-complete does not mean externally certified. Production release requires recorded approval from:

- Security: threat model, penetration test, secret/history scan, SBOM/dependency review, audit-key custody, object encryption/versioning, scanner efficacy, and incident exercise.
- Identity/authorization: IdP integration, MFA evidence, lifecycle/deprovisioning, role/attribute/clearance/caveat mapping, delegation review, and two-tenant isolation test.
- Privacy/records/legal: data inventory, provider processing boundary, retention schedules, legal holds, export/deletion behavior, notices/agreements, and notification plan.
- Accessibility and product: WCAG 2.2 AA audit, supported-browser/assistive-technology workflow, usability acceptance for every 12-stage role, and accurate operational copy.
- Reliability/infrastructure: image/digest review, capacity/load results, SIEM/alert dashboards, quarterly restore and regional DR exercise meeting RPO/RTO, rollback, on-call, and runbook ownership.

Any failed or expired gate blocks launch. Exceptions need a named owner, risk acceptance, compensating control, expiry, and executive/security/privacy approval.

