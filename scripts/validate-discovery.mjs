import { readFile } from 'node:fs/promises'

const [sources, candidates, skill] = await Promise.all([
  readFile('data/discovery-sources.json', 'utf8').then(JSON.parse),
  readFile('data/discovery-candidates.json', 'utf8').then(JSON.parse),
  readFile('.agents/skills/discover-harnesses/SKILL.md', 'utf8'),
])
const failures = []
const queries = [sources.coreQueries, sources.communityQueries, sources.githubQueries].flat()
const ids = new Set()

for (const query of queries) {
  if (!query.id || !query.query) failures.push('Every discovery query needs an id and query')
  if (ids.has(query.id)) failures.push(`Duplicate discovery query id: ${query.id}`)
  ids.add(query.id)
}

if (sources.coreQueries.length < 5) failures.push('Need at least five launch-language queries')
if (sources.communityQueries.length < 3) failures.push('Need at least three community-signal queries')
if (sources.githubQueries.length < 3) failures.push('Need at least three GitHub queries')
if (sources.vendorDomains.length < 15) failures.push('Vendor watchlist is too narrow')
if (!sources.vendorDomains.some((vendor) => vendor.domain === 'spotify.com')) {
  failures.push('Spotify regression watch is missing')
}
if (!sources.communityQueries.some((query) => query.query.includes('reddit.com'))) {
  failures.push('Reddit launch-signal lane is missing')
}
if (!Array.isArray(candidates)) failures.push('discovery-candidates.json must be an array')

for (const [index, candidate] of candidates.entries()) {
  for (const field of ['name', 'url', 'discoveredAt', 'signalUrl', 'reason']) {
    if (typeof candidate[field] !== 'string' || !candidate[field].trim()) {
      failures.push(`Candidate ${index} has invalid ${field}`)
    }
  }
  if (!candidate.url?.startsWith('https://')) {
    failures.push(`Candidate ${index} URL must use HTTPS`)
  }
}

for (const required of [
  'npm run discover:plan',
  'npm run discover:harnesses',
  'data/discovery-candidates.json',
  'primary source',
  'community',
  'vendor',
]) {
  if (!skill.toLowerCase().includes(required.toLowerCase())) {
    failures.push(`Discovery skill is missing: ${required}`)
  }
}

if (failures.length > 0) {
  console.error(`Discovery validation failed (${failures.length}):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Discovery valid: ${queries.length} queries, ${sources.vendorDomains.length} vendor domains, ` +
    `${candidates.length} deferred candidates.`,
)
