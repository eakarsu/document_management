# Audit Apply Notes — document_management

Source: `_AUDIT/reports/batch_09.md` § document_management

## Original audit recommendations

The audit recorded **0 AI endpoints** for this project, but the codebase actually has:

- `/api/ai-workflow` (AI workflow router)
- `/api/ai-document-generator` (template-driven AI doc generation)
- `/api/feedback-processor` (OpenRouter feedback processing)
- `/api/opr-workflow-feedback` (Stage 3 & 7 feedback)
- `/api/compliance` (AI compliance checker — scores docs vs rule book)
- `/api/redline` (AI redline diff with summary)

So several of the audit's "Missing AI Features" already exist:

| Audit gap | Reality in repo |
|-|-|
| Document classification | Not present (still gap) |
| OCR | Not present (still gap) |
| Contract analysis | Partial — feedback processor + compliance |
| Compliance risk scoring | Present (`/api/compliance`) |
| Auto-redaction | Not present (still gap) |

### Audit custom feature ideas
- Automated document classification and tagging
- Compliance risk detection in contracts
- Version change summarization (what changed?)
- Redaction suggestion based on sensitivity rules
- Workflow bottleneck prediction
- Integration with e-signature providers
- Bulk OCR/ingestion from scanned documents
- Predictive retention deletion (flag docs approaching expiration)

## Implemented this pass

**None.**

Reason: this codebase is TypeScript with a controller / middleware / DI-style layout (`controllers/ai-document/GeneratorController`, custom `validateDocumentGenerationRequest` middleware, Express + helmet + winston). Adding a new endpoint mechanically requires creating at least a controller class and a validator, and wiring through `setupRoutes.ts`. That is more invasive than the apply pass mandate ("≤3 SAFE MECHANICAL", match style, no SDK additions) supports without a deeper read of the controller patterns. The apply pass is logged as backlog-only.

## Backlog (not implemented)

### Mechanical (next pass when time allows)
- `/api/classification` — classify a document by type using existing OpenRouter wiring used by `feedbackProcessor.ts`. Would mirror the redline / compliance routers (controller + DTO + middleware).
- `/api/redact-suggestions` — auto-redaction draft (sensitive fields highlighting). Same pattern as compliance scorer.
- `/api/version-summary` — version-change summary using existing `redlineDiff` infra.

### Needs schema/data model work
- Bulk OCR ingestion — needs a job queue and OCR backend choice.
- E-signature integration — needs vendor selection (DocuSign? HelloSign?).

### Needs product decision
- Predictive retention deletion thresholds.
- Workflow bottleneck prediction — needs SLA breach definition.

## Categorisation

- MECHANICAL but skipped this pass to avoid mismatching the controller-based TS pattern: classification, redaction suggestion, version-change summary.
- NEEDS-SCHEMA: bulk OCR ingestion, e-sig integration.
- NEEDS-PRODUCT-DECISION: retention auto-deletion, bottleneck-alert thresholds.

## Apply pass 4 (mechanical backlog)

Implemented the three mechanical AI items previously deferred in pass 2:

| # | Endpoint | Backend file | Frontend page |
|---|----------|--------------|----------------|
| 1 | `GET/POST /api/classification/:documentId`, `POST /api/classification/preview` | `backend/src/routes/classification.ts` (new) | `frontend/src/app/documents/classification/page.tsx` (new) |
| 2 | `GET/POST /api/redact-suggestions/:documentId`, `POST /api/redact-suggestions/preview` | `backend/src/routes/redactSuggestions.ts` (new) | `frontend/src/app/documents/redact-suggestions/page.tsx` (new) |
| 3 | `GET/POST /api/version-summary/:documentId` | `backend/src/routes/versionSummary.ts` (new) | `frontend/src/app/documents/version-summary/page.tsx` (new) |

All three routers mirror the existing `compliance.ts` / `redlineDiff.ts` style: OpenRouter via `axios`, `parseAIJson` for safe parsing, `aiRateLimiter` middleware, `authenticateToken` + org-scoped access check, persistence into `Document.aiResults` JSONB (no Prisma migration), and a 503 `AI_NOT_CONFIGURED` response when `OPENROUTER_API_KEY` is unset.

Wired through `backend/src/routes/setupRoutes.ts`. Frontend pages use the existing `@/lib/api` (Bearer JWT from `localStorage.accessToken`) and the same MUI Card/Stack/Chip layout as the compliance / redline pages.

### Syntax check
- `cd backend && npx tsc --noEmit` → exits 0 (whole-project clean).
- `cd frontend && npx tsc --noEmit` → no errors in the three new pages (only pre-existing `.next/types/app/pricing/page.ts` stale-stub errors that pre-date this pass).

### Smoke note
Live HTTP smoke test was skipped because the backend currently crashes at startup on a pre-existing, unrelated `node-bsdiff` native-module load error (in `BinaryDiffService.ts`, not code touched by this pass). Compile-level verification stands in for a runtime curl.

## Apply pass 3 (frontend)

- Verdict: **LEFT-AS-IS**.
- Stack: Next.js 14 App Router (TypeScript). Auth uses JWT from cookies/localStorage via `frontend/src/lib/api`; backend AI endpoints are reached either directly or through `app/api/**` proxy routes that forward `Authorization` to `NEXT_PUBLIC_BACKEND_URL`.
- Wired FE surfaces for backend AI:
  - `app/ai-workflow/page.tsx` → `/api/ai-workflow`
  - `app/ai-document-generator/page.tsx` → `/api/ai-document-generator`
  - `app/compliance/page.tsx` and `app/documents/compliance/page.tsx` → `/api/compliance`, `/api/compliance/rules`, `/api/compliance/check/:docId`
  - `app/documents/redline/page.tsx` → `/api/redline/:docId/:from/:to` and `/api/redline/:docId/:from/:to/summary`
  - `app/api/feedback-processor/**` and `app/api/backend-proxy/feedback-processor/**` proxy routes for `/api/feedback-processor` (per-document feedback, AI recommendation, batch process, decision, merge).
- No FE changes were needed (idempotent skip).
