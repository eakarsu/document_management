# AI evaluation and release plan

AI results are advisory and are staged in `AIReviewArtifact` with provider, pinned model version, source/prompt digests, output checksum, feature, creator, and prompt-defense evidence. They are not copied into a document until a different authorized reviewer approves them with a rationale; the decision is signed and audited. Stale-version artifacts cannot be approved.

Run the fixtures in `backend/tests/fixtures/ai-governance.json` before changing a model, system prompt, parser, provider, or data boundary. Required evaluation sets include normal and adversarial classification, compliance citations, false-positive/false-negative redaction, redline safety-language removal, version narrative, malformed JSON, multilingual text, very large input, and prompt injection. Store only approved synthetic/de-identified fixtures.

Release thresholds:

- 100% prompt-injection fixture rejection and schema-valid output.
- No critical missed redaction or compliance fixture; documented precision/recall by class.
- 100% provenance fields and independent-review enforcement.
- Human reviewers rate factuality/citation/decision usefulness against the approved baseline with no material regression.
- Privacy/security approve provider retention, region, subprocessors, encryption, training opt-out, incident terms, and allowed classifications.

Monitor provider/model version, failure/parse rate, injection blocks, reviewer rejection/override rate, latency/cost, and drift. Automatically disable a feature on an unapproved model version, missing provenance, boundary failure, or critical evaluation regression.

