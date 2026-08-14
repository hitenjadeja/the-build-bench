import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'data/harnesses.v1.json')
const researchDirectory = path.join(root, 'work/harness-research')
const discoveryDirectory = path.join(root, 'work/discovery')
const offline = process.argv.includes('--offline') || process.env.DISCOVERY_OFFLINE === '1'
const runDate = new Date().toISOString().slice(0, 10)
const published = JSON.parse(await readFile(dataPath, 'utf8'))

await Promise.all([
  mkdir(researchDirectory, { recursive: true }),
  mkdir(discoveryDirectory, { recursive: true }),
])

const laneNames = ['official-sources', 'github-and-curated', 'ecosystem-sources', 'broad-verification']
const laneState = new Map(laneNames.map((name) => [name, { complete: true, notes: [] }]))

for (const lane of laneNames) {
  await writeFile(
    path.join(researchDirectory, `${lane}.md`),
    `# ${lane}\n\nStatus: PARTIAL\nRun date: ${runDate}\nMode: ${offline ? 'offline dry run' : 'network dry run'}\n\n` +
      '| name | company | capability | canonical URL | repository URL | evidence URL | notes |\n' +
      '| --- | --- | --- | --- | --- | --- | --- |\n',
  )
}

function escapeCell(value = '') {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
}

async function recordEvidence(lane, candidate) {
  const row = [
    candidate.name,
    candidate.company,
    candidate.capability,
    candidate.canonicalUrl,
    candidate.repositoryUrl,
    candidate.evidenceUrl,
    candidate.notes,
  ]
    .map(escapeCell)
    .join(' | ')
  await appendFile(path.join(researchDirectory, `${lane}.md`), `| ${row} |\n`)
}

function markPartial(lane, note) {
  const state = laneState.get(lane)
  state.complete = false
  state.notes.push(note)
}

async function fetchJson(url, lane) {
  if (offline) {
    markPartial(lane, 'Network skipped by --offline.')
    return null
  }

  const headers = {
    Accept: 'application/vnd.github+json, application/json',
    'User-Agent': 'world-of-harnesses-discovery',
  }
  if (process.env.GITHUB_TOKEN && url.includes('api.github.com')) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    headers['X-GitHub-Api-Version'] = '2022-11-28'
  }

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return await response.json()
  } catch (error) {
    markPartial(lane, `${url}: ${error.message}`)
    return null
  }
}

function normaliseText(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function canonicalUrl(value) {
  try {
    const url = new URL(value)
    url.hash = ''
    url.hostname = url.hostname.toLowerCase()
    url.pathname = url.pathname.replace(/\/+$/, '') || '/'
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function repositoryIdentity(value) {
  try {
    const url = new URL(value)
    const [owner = '', repository = ''] = url.pathname.replace(/^\//, '').split('/')
    return url.hostname === 'github.com'
      ? `github:${owner.toLowerCase()}/${repository.replace(/\.git$/i, '').toLowerCase()}`
      : canonicalUrl(value)
  } catch {
    return ''
  }
}

function diceSimilarity(left, right) {
  if (left === right) return 1
  if (left.length < 2 || right.length < 2) return 0
  const pairs = new Map()
  for (let index = 0; index < left.length - 1; index += 1) {
    const pair = left.slice(index, index + 2)
    pairs.set(pair, (pairs.get(pair) ?? 0) + 1)
  }
  let intersection = 0
  for (let index = 0; index < right.length - 1; index += 1) {
    const pair = right.slice(index, index + 2)
    const count = pairs.get(pair) ?? 0
    if (count > 0) {
      intersection += 1
      pairs.set(pair, count - 1)
    }
  }
  return (2 * intersection) / (left.length + right.length - 2)
}

function githubRepositoryToCandidate(repository, evidenceUrl) {
  const company = repository.owner?.login ?? 'Unknown'
  const name = repository.name ?? 'Unknown'
  const homepage = repository.homepage?.startsWith('https://') ? repository.homepage : repository.html_url
  return {
    name,
    company,
    capability: 'AI coding / project harness',
    canonicalUrl: homepage,
    repositoryUrl: repository.html_url,
    evidenceUrl,
    notes: repository.description || 'GitHub discovery result; requires human factual review.',
    language: repository.language || 'Unknown',
    license: repository.license?.spdx_id || 'Unknown',
    topics: repository.topics ?? [],
  }
}

const discovered = []

for (const harness of published.harnesses) {
  await recordEvidence('official-sources', {
    name: harness.name,
    company: harness.company,
    capability: harness.capabilities.join(', '),
    canonicalUrl: harness.officialUrl,
    repositoryUrl: harness.repositoryUrl,
    evidenceUrl: harness.sourceUrls[0],
    notes: `Published ${harness.reviewStatus}; last verified ${harness.lastVerifiedDate}.`,
  })
}

if (offline) {
  markPartial('official-sources', 'URL reachability was not rechecked offline.')
} else {
  for (const harness of published.harnesses) {
    const identity = repositoryIdentity(harness.repositoryUrl)
    if (!identity.startsWith('github:')) continue
    const [owner, repository] = identity.replace('github:', '').split('/')
    const details = await fetchJson(`https://api.github.com/repos/${owner}/${repository}`, 'official-sources')
    if (details) {
      await recordEvidence('official-sources', {
        name: harness.name,
        company: harness.company,
        capability: harness.capabilities[0],
        canonicalUrl: harness.officialUrl,
        repositoryUrl: harness.repositoryUrl,
        evidenceUrl: details.html_url,
        notes: `Repository identity reachable; default branch ${details.default_branch}.`,
      })
    }
  }
}

const githubQueries = [
  'topic:ai-coding-agent archived:false',
  '"coding agent" in:name,description stars:>500 archived:false',
]

for (const query of githubQueries) {
  const endpoint = `https://api.github.com/search/repositories?sort=stars&order=desc&per_page=20&q=${encodeURIComponent(query)}`
  const response = await fetchJson(endpoint, 'github-and-curated')
  for (const repository of response?.items ?? []) {
    const candidate = githubRepositoryToCandidate(repository, endpoint)
    discovered.push(candidate)
    await recordEvidence('github-and-curated', candidate)
  }
}

const npmEndpoint = 'https://registry.npmjs.org/-/v1/search?text=ai%20coding%20agent%20cli&size=20'
const npmResponse = await fetchJson(npmEndpoint, 'ecosystem-sources')
for (const result of npmResponse?.objects ?? []) {
  const repositoryUrl = result.package.links?.repository || result.package.links?.homepage || ''
  if (!repositoryUrl.startsWith('https://')) continue
  const candidate = {
    name: result.package.name,
    company: result.package.publisher?.username || 'Unknown',
    capability: 'AI coding / project harness',
    canonicalUrl: result.package.links?.homepage?.startsWith('https://') ? result.package.links.homepage : repositoryUrl,
    repositoryUrl,
    evidenceUrl: result.package.links?.npm || npmEndpoint,
    notes: result.package.description || 'npm ecosystem result; requires human review.',
    language: 'TypeScript / JavaScript',
    license: 'Unknown',
    topics: result.package.keywords ?? [],
  }
  discovered.push(candidate)
  await recordEvidence('ecosystem-sources', candidate)
}

const publishedRepoKeys = new Set(published.harnesses.map((item) => repositoryIdentity(item.repositoryUrl)))
const publishedCanonicalKeys = new Set(published.harnesses.map((item) => canonicalUrl(item.officialUrl)))
const publishedNameCompanyKeys = new Set(
  published.harnesses.map((item) => `${normaliseText(item.name)}::${normaliseText(item.company)}`),
)
const accepted = []
const duplicateFlags = []
const fuzzyFlags = []
const seenRepoKeys = new Set()
const seenCanonicalKeys = new Set()
const seenNameCompanyKeys = new Set()

for (const candidate of discovered) {
  const repoKey = repositoryIdentity(candidate.repositoryUrl)
  const canonicalKey = canonicalUrl(candidate.canonicalUrl)
  const nameCompanyKey = `${normaliseText(candidate.name)}::${normaliseText(candidate.company)}`
  const exactReasons = []

  if (!repoKey || publishedRepoKeys.has(repoKey) || seenRepoKeys.has(repoKey)) exactReasons.push('repository identity')
  if (!canonicalKey || publishedCanonicalKeys.has(canonicalKey) || seenCanonicalKeys.has(canonicalKey)) exactReasons.push('canonical URL')
  if (publishedNameCompanyKeys.has(nameCompanyKey) || seenNameCompanyKeys.has(nameCompanyKey)) {
    exactReasons.push('normalised name + company')
  }

  if (exactReasons.length > 0) {
    duplicateFlags.push(`${candidate.name} (${candidate.company}): ${exactReasons.join(', ')}`)
    continue
  }

  for (const existing of [...published.harnesses, ...accepted]) {
    const nameScore = diceSimilarity(normaliseText(candidate.name), normaliseText(existing.name))
    const companyScore = diceSimilarity(normaliseText(candidate.company), normaliseText(existing.company))
    if (nameScore >= 0.78 && companyScore >= 0.65) {
      fuzzyFlags.push(
        `${candidate.name} (${candidate.company}) ↔ ${existing.name} (${existing.company}); ` +
          `name ${nameScore.toFixed(2)}, company ${companyScore.toFixed(2)} — FLAGGED, NOT MERGED`,
      )
    }
  }

  accepted.push(candidate)
  seenRepoKeys.add(repoKey)
  seenCanonicalKeys.add(canonicalKey)
  seenNameCompanyKeys.add(nameCompanyKey)
}

for (const candidate of accepted.slice(0, 30)) {
  await recordEvidence('broad-verification', {
    ...candidate,
    evidenceUrl: candidate.repositoryUrl,
    notes: `Compiled from discovery; exact duplicate checks passed. Human verification still required.`,
  })
}
if (offline || accepted.length === 0) markPartial('broad-verification', 'No network candidates were available for the final sweep.')

for (const [lane, state] of laneState) {
  const lanePath = path.join(researchDirectory, `${lane}.md`)
  let content = await readFile(lanePath, 'utf8')
  content = content.replace('Status: PARTIAL', `Status: ${state.complete ? 'COMPLETE' : 'PARTIAL'}`)
  if (state.notes.length > 0) content += `\n## Lane notes\n\n${state.notes.map((note) => `- ${note}`).join('\n')}\n`
  await writeFile(lanePath, content)
}

function proposedRecord(candidate, index) {
  const tags = [...new Set([...candidate.topics.slice(0, 2), 'discovered', 'needs review'])].slice(0, 4)
  while (tags.length < 2) tags.push(`candidate-${tags.length + 1}`)
  const sourceUrls = [...new Set([candidate.evidenceUrl, candidate.repositoryUrl, candidate.canonicalUrl])]
    .filter((value) => value?.startsWith('https://'))
  return {
    id: `${normaliseText(candidate.company) || 'unknown'}-${normaliseText(candidate.name) || `candidate-${index}`}`,
    name: candidate.name,
    company: candidate.company,
    description: candidate.notes.slice(0, 180),
    capabilities: ['Repository operations'],
    languages: [candidate.language],
    license: candidate.license,
    officialUrl: candidate.canonicalUrl,
    repositoryUrl: candidate.repositoryUrl,
    monogram: normaliseText(candidate.name).slice(0, 2).toUpperCase() || 'NA',
    tags,
    reviewStatus: 'needs-review',
    sourceUrls,
    discoveredDate: runDate,
    lastVerifiedDate: runDate,
  }
}

const proposal = {
  version: '1.0.0',
  generatedAt: runDate,
  harnesses: accepted.map(proposedRecord),
}

await writeFile(
  path.join(discoveryDirectory, 'proposed-harnesses.v1.json'),
  `${JSON.stringify(proposal, null, 2)}\n`,
)

const partialLanes = [...laneState.entries()].filter(([, state]) => !state.complete).map(([lane]) => lane)
const report = `# Harness discovery evidence report\n\n` +
  `Run date: ${runDate}\n\n` +
  `This is a dry research artifact. It does not modify \`data/harnesses.v1.json\`.\n\n` +
  `- Proposed candidates: ${accepted.length}\n` +
  `- Exact duplicates excluded: ${duplicateFlags.length}\n` +
  `- Fuzzy matches flagged, never merged: ${fuzzyFlags.length}\n` +
  `- Partial lanes: ${partialLanes.length ? partialLanes.join(', ') : 'none'}\n\n` +
  `## Duplicate flags\n\n${duplicateFlags.map((flag) => `- ${flag}`).join('\n') || '- None'}\n\n` +
  `## Fuzzy flags\n\n${fuzzyFlags.map((flag) => `- ${flag}`).join('\n') || '- None'}\n\n` +
  `## Human review gate\n\n` +
  `Confirm factual description, organisation, canonical product URL, repository identity, license, logo usage, and every source URL before moving any candidate into published data.\n`

await writeFile(path.join(discoveryDirectory, 'evidence-report.md'), report)

console.log(
  `Dry discovery complete: ${accepted.length} proposed, ${duplicateFlags.length} duplicates, ${fuzzyFlags.length} fuzzy flags, ${partialLanes.length} partial lanes.`,
)
