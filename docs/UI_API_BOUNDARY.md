# UI API boundary

Legacy Next route handlers were removed because they mixed direct database
access, local rendering, process spawning and ad-hoc proxy behavior inside the
UI process. `frontend/next.config.js` now sends every `/api/*` and `/graphql`
request to the governed backend before filesystem routing. Any missing UI
operation must be implemented as an authenticated, tenant-scoped backend route
with ABAC, audit, retention/storage controls and integration tests; do not add
database access to the frontend.

The backend route registry likewise excludes the legacy eight-stage and
in-memory workflow engines, direct workflow-instance mutations, local-disk
custom views/bulk upload, unauthenticated custom-field versions, raw-HTML
exporters, and AI demo/gap routers. The supported production surface is the
tenant-scoped document/object-storage API, governed 12-stage workflow,
review-gated AI routes, retention/legal-hold/deletion API, signed publication
sync, authentication, and read-only workflow catalogue. Re-enabling a legacy
router requires the same controls and tests as a new production endpoint.
