# Harness research workflow

Discovery is evidence gathering, not publication. Human review is the gate between proposed records and the public directory.

## Source lanes

Run the lanes in this order:

1. `official-sources`: official product pages, documentation, release notes, repositories, and license files.
2. `github-and-curated`: GitHub repository/topic searches and maintained curated sources.
3. `ecosystem-sources`: relevant package registries, editor ecosystems, and agent-tooling sources.
4. `broad-verification`: a final cross-source sweep over the compiled candidates.

Each lane is bounded. After every one or two searches or source checks, append evidence immediately to `work/harness-research/<lane>.md`; do not hold notes only in memory. Finish each file with `Status: COMPLETE` or `Status: PARTIAL` and record why a partial lane stopped.

Candidate evidence tables use exactly these fields:

| name | company | capability | canonical URL | repository URL | evidence URL | notes |
| --- | --- | --- | --- | --- | --- | --- |

## Compilation rules

1. Compile candidates from all lanes and carry partial-lane warnings into the report.
2. Deduplicate by repository identity first, canonical URL second, then normalized name plus company.
3. Flag fuzzy matches for a reviewer; never merge them automatically.
4. Write proposed records to `work/discovery/proposed-harnesses.v1.json` and a concise evidence summary to `work/discovery/evidence-report.md`.
5. Validate the currently published dataset. Discovery must never modify it.
6. Create or update the weekly review pull request.

Before a reviewer promotes any proposal into `data/harnesses.v1.json`, they must confirm the factual description, organisation, canonical URLs, repository identity, license, source evidence, dates, and logo permission or use the neutral monogram fallback. Scheduled output is never published without this review.
