---
name: discover-harnesses
description: Discover, verify, and catalog newly launched AI agent harnesses and adjacent runtime infrastructure for The Build Bench. Use for catalog refreshes, ecosystem searches, scheduled discovery sweeps, candidate triage, or when checking whether the production directory missed a product, repository, internal system, framework, orchestrator, memory layer, tool, or evaluation harness.
---

# Discover Harnesses

Run a coverage-driven search, trace candidates to primary sources, and leave an auditable result even when no entry is published.

## Run the sweep

1. From the repository root, validate and generate the plan:

   ```sh
   npm run validate:discovery
   npm run discover:plan -- --mode daily --days 7
   ```

   For the weekly deep sweep, use `--mode weekly --days 30`. Read the complete plan before searching.

2. Run `npm run discover:harnesses` for the deterministic GitHub and npm lanes. This command alone is not a complete search because it cannot discover proprietary product launches outside those ecosystems.

3. Execute every remaining plan lane with web search:

   - compare each upstream catalog for new records;
   - run all launch-language queries within the plan's recency window;
   - run all community-signal queries, using them only as leads;
   - run all GitHub queries with `gh search repos` or equivalent repository search;
   - run every vendor query selected by the daily rotation, or the full watchlist in weekly mode.

4. Search generic launch vocabulary, not just known names. Include harness, coding agent, agentic development environment, orchestrator, runtime, background agent, autonomous worker, context layer, and institutional memory.

5. Record lane coverage and candidate dispositions under `work/`. Include lanes with zero results and explicitly list blocked sources.

## Triage candidates

Deduplicate against `data/harnesses.v1.json` and `data/discovery-candidates.json` using repository identity, canonical URL, case-insensitive ID, and normalized name plus company.

- Publish only when an official repository, product page, documentation page, vendor announcement, release note, or engineering post proves that the project materially supplies a harness concern.
- Treat community posts, search snippets, newsletters, and press coverage only as discovery signals.
- Put plausible but unverified leads in `data/discovery-candidates.json` with `name`, `url`, `discoveredAt`, `signalUrl`, and the missing-evidence `reason`.
- Reject prompt-only collections, abandoned mirrors, generic AI lists, and products without an agent loop, tools, context, memory, safety, orchestration, execution, or evaluation role.

## Publish verified entries

1. Add the source-backed record to `data/harnesses.v1.json` using the repository schema and neutral monogram fallback when logo rights are unclear.
2. Run `npm test` and `npm run check:links`.
3. Commit and push to `hitenjadeja/the-build-bench` unless the user explicitly says not to.
4. Monitor the Pages workflow and verify `https://hitenjadeja.github.io/the-build-bench/` returns HTTP 200, the deployed `catalog.json` contains the record, and the live search bundle includes its name.
5. Report the search window, queries and sources checked, additions, deferred candidates, rejections, blocked sources, commit, deployment, and live verification.

Never claim mathematical completeness. A scheduled sweep proposes or publishes only primary-source-verified records and must disclose partial coverage.
