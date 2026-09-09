# Harness research workflow

Deterministic discovery gathers evidence and proposals without changing the public directory. Promotion requires source review: verify identity, description, canonical URLs, license, dates, provenance, and duplicates. An authorized Codex sweep can perform this review and publish verified records under `AGENTS.md`; unresolved evidence and fuzzy matches require a user decision and remain deferred.

## Source lanes

Run the lanes in this order:

1. `official-sources`: official product pages, documentation, release notes, repositories, and license files.
2. `github-and-curated`: GitHub repository/topic searches and maintained curated sources.
3. `ecosystem-sources`: relevant package registries, editor ecosystems, and agent-tooling sources.
4. `broad-verification`: a final cross-source sweep over the compiled candidates.

Each lane is bounded. After every one or two searches or source checks, append evidence immediately to `work/harness-research/<lane>.md`; do not hold notes only in memory. Finish each file with `Status: COMPLETE` or `Status: PARTIAL` and record why a partial lane stopped.

Generate the bounded search plan with `npm run discover:plan -- --mode daily --days 7`, or use weekly mode and a 30-day window for the deep sweep. `npm run discover:harnesses` covers GitHub and npm plus reachability checks for already-published repositories; it does not replace the plan's web, community, upstream-catalog, or official-vendor searches.

Candidate evidence tables use exactly these fields:

| name | company | capability | canonical URL | repository URL | evidence URL | notes |
| --- | --- | --- | --- | --- | --- | --- |

## Compilation rules

1. Compile candidates from all lanes and carry partial-lane warnings into the report.
2. Deduplicate by repository identity first, canonical URL second, then normalized name plus company.
3. Flag fuzzy matches for a reviewer; never merge them automatically.
4. Write proposed records to `work/discovery/proposed-harnesses.v1.json` and a concise evidence summary to `work/discovery/evidence-report.md`.
5. Validate the currently published dataset. Discovery must never modify it.
6. Commit the refreshed evidence and proposed records directly to `main`. Do not promote proposals into the published catalog automatically and do not open a pull request.

Before a reviewer promotes any proposal into `data/harnesses.v1.json`, they must confirm the factual description, organisation, canonical URLs, repository identity, license, source evidence, dates, and logo permission or use the neutral monogram fallback. Scheduled output is never published without this review. The Monday GitHub Action is evidence-only; the authorized Codex sweep performs the broader source review and may promote verified records. Neither the script nor a successful validation alone is publication approval.

## Catalog imports

Reviewed bulk imports are separate from scheduled discovery. They require explicit human authorization, source-count checks, provenance preservation, schema transformation, the same three-stage deduplication, attribution review, validation, link checks, and a production build. The 2026-08-14 integration is documented in [`catalog-integration.md`](catalog-integration.md).
