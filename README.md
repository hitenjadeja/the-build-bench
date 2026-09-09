# The Build Bench

The canonical, public, source-verified directory of AI agent harnesses. The site is a static Vite + React + TypeScript build designed for GitHub Pages.

Live site: <https://hitenjadeja.github.io/the-build-bench/>

Maintain this repository at `/Users/hiten/workspace/the-build-bench`. World of Harnesses is the frozen historical source and legacy redirect; new catalog and interface work belongs here. Search (`q`) and name sorting (`sort=name` or `sort=name-desc`) can be shared in the page URL.

## Local use

```bash
npm install
npm run dev
```

Quality, import, and production commands:

```bash
npm run validate:data
npm run validate:discovery
npm run check:links
npm run discover:plan -- --mode daily --days 7
npm run discover:harnesses -- --offline
npm run prepare:site
npm run build
npm run preview
```

`discover:harnesses` is always dry: it writes research and proposal artifacts under `work/` and never edits `data/harnesses.v1.json`.
It covers deterministic GitHub and npm discovery, but it is not the whole search. `discover:plan` generates the required launch-language, community-signal, recent-repository, upstream-catalog, and official-vendor web lanes. Invoke the repo-scoped `$discover-harnesses` skill to execute and audit that complete plan.
`prepare:site` publishes the validated catalog as `catalog.json` and generates the canonical sitemap used by the static deployment.

## Data

- Published records: `data/harnesses.v1.json`
- Versioned JSON Schema: `data/harnesses.v1.schema.json`
- Review states: `source-verified`, `community-verified`, `needs-review`
- Availability states: `open-source`, `unclear`, `proprietary`, `internal`
- Catalog attribution: [`ATTRIBUTION.md`](ATTRIBUTION.md)
- Import details: [`docs/catalog-integration.md`](docs/catalog-integration.md)

Every published record needs a stable ID, factual identity and description, capabilities, implementation-language evidence, license, availability, canonical product URL, repository URL when one is public, monogram fallback, 2–4 tags, review state, source kind, provenance, at least one primary source URL, discovered date, and last verified date. An optional official logo URL may be used when its provenance and usage are appropriate.

Duplicate precedence is repository identity, canonical URL, then normalized name plus company. Exact matches fail validation. Similar names are reported as fuzzy flags and are never merged automatically.

## Research and review

The complete evidence workflow is in [docs/research-workflow.md](docs/research-workflow.md). A weekly GitHub Action runs deterministic dry discovery and validation, then commits refreshed evidence and proposed JSON directly to `main`. A scheduled Codex sweep executes the broader web and vendor plan. Neither publishes unverified candidates. This project does not use pull requests; validated changes are pushed directly to `main` and deployed by the Pages workflow.

The catalog data and adapted descriptions include CC BY-SA 4.0 material. See [`ATTRIBUTION.md`](ATTRIBUTION.md) for the source, license, modifications, and share-alike notice.
