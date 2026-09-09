# Methodology and attribution

## Catalog composition

The Build Bench dataset combines three reviewed source lanes:

1. **161 adapted records** from [Ryan Alberts' best-of-Agent-Harnesses](https://github.com/RyanAlberts/best-of-Agent-Harnesses), captured from its live JSON catalog on 2026-08-09.
2. **34 independent primary-source records** researched for World of Harnesses using official repositories, vendor documentation, product pages, and engineering posts on 2026-08-14.
3. **One existing Build Bench record**, Grok Build, retained after the union was deduplicated.

The initial 2026-08-14 version 1.1 integration contained 196 unique records. Later reviewed discoveries and the transfer of Tau and AI-DLC Workflows from the legacy catalog extend that baseline; the current count is recorded in `data/harnesses.v1.json`. Deduplication precedence is canonical repository identity, canonical product URL, then normalized name plus organization. Exact matches are merged; fuzzy matches are reported for review and are never merged automatically.

## Important inclusions

- **Swamp** is represented as an open-source, agent-facing operational workflow layer. Its AGPL-3.0-or-later license with an additional permission is preserved rather than simplified to a generic open-source label.
- **Honk** is represented as Spotify's publicly documented internal harness. It has no public repository and is explicitly marked `internal` and `Not publicly licensed`.
- **DeepSeek Harness** is represented from DeepSeek's official repository as an MIT-licensed, open-source project.

## License and changes

The upstream catalog data and adapted descriptions are copyright Ryan Alberts and contributors and are licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

For The Build Bench, the source records were transformed into a versioned JSON Schema, descriptions were converted to compact plain text, repository owners were normalized into display organizations, category and tag data were mapped into capabilities and languages, and duplicate records were merged with the site's existing primary-source records. The combined catalog data and descriptions are distributed under the same CC BY-SA 4.0 license. Application source code is separate from the catalog content.

Vendor and project names identify their respective products and do not imply endorsement. Availability describes public distribution, not project quality. `unclear` means the captured evidence did not establish unambiguous distribution terms; it does not mean a project has no license.
