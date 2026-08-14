# The Build Bench

A public, source-verified directory of AI project harnesses for the World of Harnesses project. The site is a static Vite + React + TypeScript build designed for GitHub Pages.

Live site: <https://hitenjadeja.github.io/the-build-bench/>

## Local use

```bash
npm install
npm run dev
```

Quality and production commands:

```bash
npm run validate:data
npm run discover:harnesses -- --offline
npm run build
npm run preview
```

`discover:harnesses` is always dry: it writes research and proposal artifacts under `work/` and never edits `data/harnesses.v1.json`.

## Data

- Published records: `data/harnesses.v1.json`
- Versioned JSON Schema: `data/harnesses.v1.schema.json`
- Review states: `source-verified`, `community-verified`, `needs-review`

Every published record needs a stable ID, factual identity and description, capabilities, implementation languages, license, canonical product and repository URLs, monogram fallback, 2–4 tags, review state, at least two source URLs, discovered date, and last verified date. An optional official logo URL may be used when its provenance and usage are appropriate.

Duplicate precedence is repository identity, canonical URL, then normalized name plus company. Exact matches fail validation. Similar names are reported as fuzzy flags and are never merged automatically.

## Research and review

The complete evidence workflow is in [docs/research-workflow.md](docs/research-workflow.md). A weekly GitHub Action runs dry discovery and validation, then creates or updates a review pull request containing evidence and proposed JSON. It does not publish candidates. The Pages workflow deploys only builds merged to `main`.
