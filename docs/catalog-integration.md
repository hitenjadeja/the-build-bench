# Verified catalog integration

The version 1.1 dataset was compiled from the reviewed World of Harnesses catalog on 2026-08-14.

## Import result

- Compiled source records: 195
- Upstream CC BY-SA records: 161
- Independent primary-source additions: 34
- Existing Build Bench records reviewed: 4
- Merged by repository identity: 2
- Merged by normalized name and organization: 1
- Existing records retained outside the source catalog: 1
- Published records: 196

## Transformation rules

The importer preserves canonical product URLs, repository identities, availability, license evidence, source kind, source URLs, verification status, and provenance. Source descriptions are converted from Markdown to factual one-line plain text and capped at 260 characters. Category and tag evidence map deterministically into the site's capability, language, and tag fields; missing implementation-language evidence is displayed as `Not specified` rather than guessed.

Projects without a public repository use `repositoryUrl: null`. Their card links to the primary evidence URL and keeps `internal` or `proprietary` separate from license text.

The import command is explicit and never runs as scheduled discovery:

```bash
npm run import:research -- \
  --catalog /path/to/harnesses.json \
  --additions /path/to/additions.json
```

After import, run `npm run validate:data`, `npm run check:links`, and `npm run build` before publication.
