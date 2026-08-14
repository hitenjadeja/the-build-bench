import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseArguments(argv) {
  const argumentsByName = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || !value) throw new Error(`Invalid argument near ${key ?? 'end of command'}`)
    argumentsByName.set(key.slice(2), value)
  }
  return argumentsByName
}

const args = parseArguments(process.argv.slice(2))
const catalogPath = args.get('catalog')
const additionsPath = args.get('additions')
const outputPath = args.get('output') ?? path.join(root, 'data/harnesses.v1.json')

if (!catalogPath || !additionsPath) {
  console.error('Usage: npm run import:research -- --catalog <harnesses.json> --additions <additions.json> [--output <path>]')
  process.exit(1)
}

const [catalog, additions, existing] = await Promise.all([
  readFile(path.resolve(catalogPath), 'utf8').then(JSON.parse),
  readFile(path.resolve(additionsPath), 'utf8').then(JSON.parse),
  readFile(path.join(root, 'data/harnesses.v1.json'), 'utf8').then(JSON.parse),
])

if (!Array.isArray(catalog.entries)) throw new Error('Catalog must contain an entries array')
if (!Array.isArray(additions)) throw new Error('Additions must be an array')
if (catalog.entries.length !== catalog.meta?.project_count) {
  throw new Error(`Catalog count mismatch: metadata says ${catalog.meta?.project_count}, found ${catalog.entries.length}`)
}
if (additions.length !== catalog.meta?.independent_addition_count) {
  throw new Error(`Addition count mismatch: metadata says ${catalog.meta?.independent_addition_count}, found ${additions.length}`)
}

const additionIds = new Set(additions.map((entry) => entry.id.toLocaleLowerCase()))
const missingAdditions = additions.filter(
  (addition) => !catalog.entries.some((entry) => entry.id.toLocaleLowerCase() === addition.id.toLocaleLowerCase()),
)
if (missingAdditions.length > 0) {
  throw new Error(`Compiled catalog is missing additions: ${missingAdditions.map((entry) => entry.id).join(', ')}`)
}

const capabilityMap = {
  'progressive-disclosure': ['Context management', 'Tool discovery'],
  'coding-agent-products': ['Repository operations', 'Terminal automation'],
  'coding-harness-configs': ['Harness configuration', 'Agent workflows'],
  'personal-agent-runtimes': ['Agent runtime', 'Persistent execution'],
  frameworks: ['Agent framework', 'Tool orchestration'],
  'multi-agent': ['Multi-agent orchestration', 'Agent handoffs'],
  'plugins-mcp-cli': ['Agent tooling', 'MCP & extensions'],
  memory: ['Memory & state', 'Context persistence'],
  evaluation: ['Evaluation', 'Benchmarking'],
  observability: ['Observability', 'Evaluation'],
  'research-task': ['Research automation', 'Task workflows'],
  'libraries-sdks': ['Agent SDK', 'Tool orchestration'],
}

const categoryTagMap = {
  'progressive-disclosure': 'context',
  'coding-agent-products': 'coding agent',
  'coding-harness-configs': 'harness config',
  'personal-agent-runtimes': 'agent runtime',
  frameworks: 'framework',
  'multi-agent': 'multi-agent',
  'plugins-mcp-cli': 'agent tooling',
  memory: 'memory',
  evaluation: 'evaluation',
  observability: 'observability',
  'research-task': 'research',
  'libraries-sdks': 'SDK',
}

const ownerNames = {
  'aaif-goose': 'Block',
  anthropic: 'Anthropic',
  anthropics: 'Anthropic',
  aws: 'AWS',
  bytedance: 'ByteDance',
  cognition: 'Cognition',
  cursor: 'Cursor',
  'deepseek-ai': 'DeepSeek',
  docker: 'Docker',
  factory: 'Factory',
  github: 'GitHub',
  google: 'Google',
  'google-gemini': 'Google',
  huggingface: 'Hugging Face',
  ibm: 'IBM',
  jetbrains: 'JetBrains',
  microsoft: 'Microsoft',
  moonshotai: 'Moonshot AI',
  openai: 'OpenAI',
  replit: 'Replit',
  sourcegraph: 'Sourcegraph',
  spacexai: 'xAI',
  spotify: 'Spotify',
  vercel: 'Vercel',
  warp: 'Warp',
  windsurf: 'Windsurf',
}

const languageNames = {
  go: 'Go',
  python: 'Python',
  ruby: 'Ruby',
  rust: 'Rust',
  typescript: 'TypeScript',
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function normaliseText(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function slug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function canonicalUrl(value) {
  const url = new URL(value)
  url.hostname = url.hostname.toLocaleLowerCase()
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLocaleLowerCase().startsWith('utm_')) url.searchParams.delete(key)
  }
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url.toString().replace(/\/$/, '')
}

function repositoryIdentity(value) {
  if (!value) return null
  const url = new URL(value)
  if (url.hostname !== 'github.com') return canonicalUrl(value)
  const [owner = '', repository = ''] = url.pathname.replace(/^\//, '').split('/')
  return `github:${owner.toLocaleLowerCase()}/${repository.replace(/\.git$/i, '').toLocaleLowerCase()}`
}

function displayOwner(owner) {
  const mapped = ownerNames[owner.toLocaleLowerCase()]
  if (mapped) return mapped
  return owner
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.length <= 3 ? part.toLocaleUpperCase() : `${part[0].toLocaleUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function conciseDescription(value, maximum = 260) {
  const plain = value
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[`*_#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maximum) return plain
  const cutoff = plain.slice(0, maximum - 1)
  const lastSpace = cutoff.lastIndexOf(' ')
  return `${cutoff.slice(0, lastSpace > maximum * 0.75 ? lastSpace : maximum - 1)}…`
}

function monogram(name) {
  const words = name
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length >= 2) return words.slice(0, 3).map((word) => word[0]).join('').toLocaleUpperCase()
  const compact = (words[0] ?? 'H').replace(/[^A-Za-z0-9]/g, '')
  return compact.slice(0, Math.min(2, compact.length)).toLocaleUpperCase() || 'H'
}

function resolvedLicense(entry) {
  if (entry.license === 'open-source') return 'Open source (unspecified)'
  if (entry.license === 'unknown' || !entry.license) {
    if (entry.availability === 'internal') return 'Not publicly licensed'
    if (entry.availability === 'proprietary') return 'Commercial / proprietary'
    return 'Unknown'
  }
  return entry.license
}

function capabilitiesFor(entry) {
  const capabilities = [...(capabilityMap[entry.category] ?? ['Agent tooling'])]
  const tags = new Set(entry.tags ?? [])
  if (tags.has('mcp')) capabilities.push('MCP & extensions')
  if (tags.has('multi-agent') || tags.has('orchestration')) capabilities.push('Multi-agent workflows')
  if (tags.has('sandbox')) capabilities.push('Sandboxed execution')
  if (tags.has('memory')) capabilities.push('Memory & state')
  return unique(capabilities).slice(0, 4)
}

function tagsFor(entry) {
  const tags = unique([...(entry.tags ?? []), categoryTagMap[entry.category], entry.availability])
  return tags.slice(0, 4)
}

function transform(entry) {
  const repositoryUrl = entry.repository ? `https://github.com/${entry.repository}` : null
  const owner = (entry.repository ?? entry.id).split('/')[0]
  const languages = unique((entry.tags ?? []).map((tag) => languageNames[tag]))
  const sourceUrls = unique([entry.source_url, entry.url, repositoryUrl]).map(canonicalUrl)
  const provenance = entry.provenance ?? (additionIds.has(entry.id.toLocaleLowerCase())
    ? 'independent-discovery'
    : 'RyanAlberts/best-of-Agent-Harnesses')

  return {
    id: slug(entry.id),
    name: entry.name,
    company: displayOwner(owner),
    description: conciseDescription(entry.description),
    capabilities: capabilitiesFor(entry),
    languages: languages.length > 0 ? languages : ['Not specified'],
    license: resolvedLicense(entry),
    availability: entry.availability,
    officialUrl: canonicalUrl(entry.url),
    repositoryUrl: repositoryUrl ? canonicalUrl(repositoryUrl) : null,
    ...(repositoryUrl ? { logo: `https://github.com/${owner}.png?size=160` } : {}),
    monogram: monogram(entry.name),
    tags: tagsFor(entry),
    reviewStatus: entry.verification === 'primary-source-checked' ? 'source-verified' : 'community-verified',
    sourceKind: entry.source_kind,
    provenance,
    sourceUrls,
    discoveredDate: entry.verified_at,
    lastVerifiedDate: entry.verified_at,
  }
}

function inferAvailability(harness) {
  return /commercial|proprietary/i.test(harness.license) ? 'proprietary' : 'open-source'
}

function currentRecord(harness) {
  return {
    ...harness,
    availability: harness.availability ?? inferAvailability(harness),
    sourceKind: harness.sourceKind ?? 'official-source-set',
    provenance: harness.provenance ?? 'original-build-bench',
  }
}

const result = existing.harnesses.map(currentRecord)
const indexes = {
  repository: new Map(),
  official: new Map(),
  nameCompany: new Map(),
}

function indexRecord(record, index) {
  const repositoryKey = repositoryIdentity(record.repositoryUrl)
  if (repositoryKey) indexes.repository.set(repositoryKey, index)
  indexes.official.set(canonicalUrl(record.officialUrl), index)
  indexes.nameCompany.set(`${normaliseText(record.name)}::${normaliseText(record.company)}`, index)
}

result.forEach(indexRecord)

const mergeCounts = { repository: 0, official: 0, nameCompany: 0, added: 0 }

for (const entry of catalog.entries) {
  const candidate = transform(entry)
  const repositoryKey = repositoryIdentity(candidate.repositoryUrl)
  const officialKey = canonicalUrl(candidate.officialUrl)
  const nameCompanyKey = `${normaliseText(candidate.name)}::${normaliseText(candidate.company)}`
  let matchIndex
  let matchKind

  if (repositoryKey && indexes.repository.has(repositoryKey)) {
    matchIndex = indexes.repository.get(repositoryKey)
    matchKind = 'repository'
  } else if (indexes.official.has(officialKey)) {
    matchIndex = indexes.official.get(officialKey)
    matchKind = 'official'
  } else if (indexes.nameCompany.has(nameCompanyKey)) {
    matchIndex = indexes.nameCompany.get(nameCompanyKey)
    matchKind = 'nameCompany'
  }

  if (matchIndex !== undefined) {
    const established = result[matchIndex]
    result[matchIndex] = {
      ...candidate,
      ...established,
      availability: candidate.availability,
      sourceKind: candidate.sourceKind,
      provenance: candidate.provenance,
      sourceUrls: unique([...established.sourceUrls, ...candidate.sourceUrls]),
      discoveredDate: [established.discoveredDate, candidate.discoveredDate].sort()[0],
      lastVerifiedDate: [established.lastVerifiedDate, candidate.lastVerifiedDate].sort().at(-1),
    }
    mergeCounts[matchKind] += 1
    indexes.repository.clear()
    indexes.official.clear()
    indexes.nameCompany.clear()
    result.forEach(indexRecord)
  } else {
    result.push(candidate)
    indexRecord(candidate, result.length - 1)
    mergeCounts.added += 1
  }
}

const output = {
  version: '1.1.0',
  generatedAt: catalog.meta.generated_at,
  sources: [
    {
      name: 'best-of-Agent-Harnesses',
      url: 'https://github.com/RyanAlberts/best-of-Agent-Harnesses',
      license: 'CC-BY-SA-4.0',
      capturedDate: '2026-08-09',
    },
    {
      name: 'World of Harnesses primary-source pass',
      url: 'https://github.com/hitenjadeja/the-build-bench',
      license: 'CC-BY-SA-4.0',
      capturedDate: catalog.meta.generated_at,
    },
  ],
  harnesses: result,
}

await writeFile(path.resolve(outputPath), `${JSON.stringify(output, null, 2)}\n`)

console.log(`Imported ${catalog.entries.length} catalog entries and retained ${existing.harnesses.length} existing records.`)
console.log(
  `Merged ${mergeCounts.repository} by repository, ${mergeCounts.official} by canonical URL, ` +
  `${mergeCounts.nameCompany} by normalized name/company; added ${mergeCounts.added}.`,
)
console.log(`Published total: ${result.length} records.`)
