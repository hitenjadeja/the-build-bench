# The Build Bench

A public, source-verified directory of AI project harnesses for the World of Harnesses project. The site is a static Vite + React + TypeScript build designed for GitHub Pages.

Live site: <https://hitenjadeja.github.io/the-build-bench/>

## Local use

```bash
npm install
npm run dev
```

Quality, import, and production commands:

```bash
npm run validate:data
npm run check:links
npm run discover:harnesses -- --offline
npm run prepare:site
npm run build
npm run preview
```

`discover:harnesses` is always dry: it writes research and proposal artifacts under `work/` and never edits `data/harnesses.v1.json`.
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

The complete evidence workflow is in [docs/research-workflow.md](docs/research-workflow.md). A weekly GitHub Action runs dry discovery and validation, then creates or updates a review pull request containing evidence and proposed JSON. It does not publish candidates. The Pages workflow deploys only builds merged to `main`.

The catalog data and adapted descriptions include CC BY-SA 4.0 material. See [`ATTRIBUTION.md`](ATTRIBUTION.md) for the source, license, modifications, and share-alike notice.
