import { readFile } from 'node:fs/promises'

const args = process.argv.slice(2)

function option(name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

const mode = option('--mode') ?? 'daily'
if (!new Set(['daily', 'weekly']).has(mode)) {
  throw new Error('--mode must be daily or weekly')
}

const [sources, catalog, candidates] = await Promise.all([
  readFile('data/discovery-sources.json', 'utf8').then(JSON.parse),
  readFile('data/harnesses.v1.json', 'utf8').then(JSON.parse),
  readFile('data/discovery-candidates.json', 'utf8').then(JSON.parse),
])

const days = Number(option('--days') ?? sources.defaultDays[mode])
if (!Number.isInteger(days) || days < 1 || days > 365) {
  throw new Error('--days must be an integer between 1 and 365')
}

const generatedAt = new Date().toISOString().slice(0, 10)
const sinceDate = new Date(`${generatedAt}T00:00:00Z`)
sinceDate.setUTCDate(sinceDate.getUTCDate() - days)
const since = sinceDate.toISOString().slice(0, 10)
const epochDay = Math.floor(Date.parse(`${generatedAt}T00:00:00Z`) / 86_400_000)

function selectedVendors() {
  if (mode === 'weekly') return sources.vendorDomains
  const size = sources.vendorRotationSize
  const start = (epochDay * size) % sources.vendorDomains.length
  return Array.from({ length: Math.min(size, sources.vendorDomains.length) }, (_, index) =>
    sources.vendorDomains[(start + index) % sources.vendorDomains.length],
  )
}

const plan = {
  generatedAt,
  mode,
  days,
  since,
  knownEntryCount: catalog.harnesses.length,
  deferredCandidateCount: candidates.length,
  upstreamCatalogs: sources.upstreamCatalogs,
  webQueries: sources.coreQueries,
  communityQueries: sources.communityQueries,
  githubQueries: sources.githubQueries.map((query) => ({
    ...query,
    query: query.query.replaceAll('{since}', since),
  })),
  vendorQueries: selectedVendors().map((vendor) => ({
    id: `vendor-${vendor.domain}`,
    vendor: vendor.name,
    query: `site:${vendor.domain} (\"coding agent\" OR \"agent harness\" OR \"agent orchestrator\" OR \"agentic development environment\")`,
  })),
}

if (args.includes('--json')) {
  console.log(JSON.stringify(plan, null, 2))
  process.exit(0)
}

const lines = [
  '# Harness discovery plan',
  '',
  `Generated: ${plan.generatedAt}`,
  `Mode: ${plan.mode}`,
  `Search window: ${plan.since} through ${plan.generatedAt} (${plan.days} days)`,
  `Known entries: ${plan.knownEntryCount}`,
  `Deferred candidates: ${plan.deferredCandidateCount}`,
  '',
  '## Upstream catalog deltas',
  '',
  ...plan.upstreamCatalogs.map((source) => `- ${source.name}: ${source.url}`),
  '',
  '## Launch-language web queries',
  '',
  ...plan.webQueries.map((query) => `- [${query.id}] ${query.query}`),
  '',
  '## Community-signal queries',
  '',
  ...plan.communityQueries.map((query) => `- [${query.id}] ${query.query}`),
  '',
  '## Recent GitHub repository queries',
  '',
  ...plan.githubQueries.map(
    (query) =>
      `- [${query.id}] gh search repos '${query.query}' --limit 50 --json fullName,url,description,createdAt,updatedAt`,
  ),
  '',
  `## Official vendor queries (${mode === 'daily' ? 'daily rotation' : 'complete watchlist'})`,
  '',
  ...plan.vendorQueries.map((query) => `- [${query.id}] ${query.query}`),
  '',
  '## Required run report',
  '',
  'Record every lane, query count, result count, verified addition, deferred candidate, rejection, blocked source, and the search window.',
]

console.log(lines.join('\n'))
