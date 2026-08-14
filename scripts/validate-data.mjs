import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = path.join(root, 'data/harnesses.v1.schema.json')
const dataPath = path.join(root, 'data/harnesses.v1.json')

const [schema, directory] = await Promise.all([
  readFile(schemaPath, 'utf8').then(JSON.parse),
  readFile(dataPath, 'utf8').then(JSON.parse),
])

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validate = ajv.compile(schema)
const errors = []
const warnings = []

if (!validate(directory)) {
  for (const issue of validate.errors ?? []) {
    errors.push(`schema ${issue.instancePath || '/'} ${issue.message}`)
  }
}

function normaliseText(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function canonicalUrl(value) {
  const url = new URL(value)
  url.hostname = url.hostname.toLowerCase()
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key)
  }
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url.toString().replace(/\/$/, '')
}

function repositoryIdentity(value) {
  const url = new URL(value)
  if (url.hostname !== 'github.com') return canonicalUrl(value)
  const [owner = '', repository = ''] = url.pathname.replace(/^\//, '').split('/')
  return `github:${owner.toLowerCase()}/${repository.replace(/\.git$/i, '').toLowerCase()}`
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
      pairs.set(pair, count - 1)
      intersection += 1
    }
  }
  return (2 * intersection) / (left.length + right.length - 2)
}

function recordUnique(map, key, id, label) {
  const existing = map.get(key)
  if (existing) errors.push(`${label} duplicate: ${existing} and ${id} resolve to ${key}`)
  else map.set(key, id)
}

const idKeys = new Map()
const repositoryKeys = new Map()
const officialKeys = new Map()
const nameCompanyKeys = new Map()
const today = new Date().toISOString().slice(0, 10)
const availabilityCounts = new Map()

for (const harness of directory.harnesses ?? []) {
  recordUnique(idKeys, harness.id, harness.id, 'stable id')

  if (harness.repositoryUrl) {
    try {
      const repositoryKey = repositoryIdentity(harness.repositoryUrl)
      recordUnique(repositoryKeys, repositoryKey, harness.id, 'repository identity')
    } catch {
      errors.push(`${harness.id} has an invalid repositoryUrl`)
    }
  }

  try {
    const officialKey = canonicalUrl(harness.officialUrl)
    recordUnique(officialKeys, officialKey, harness.id, 'canonical URL')
  } catch {
    errors.push(`${harness.id} has an invalid officialUrl`)
  }

  const nameCompanyKey = `${normaliseText(harness.name)}::${normaliseText(harness.company)}`
  recordUnique(nameCompanyKeys, nameCompanyKey, harness.id, 'normalised name and company')
  availabilityCounts.set(harness.availability, (availabilityCounts.get(harness.availability) ?? 0) + 1)

  for (const [field, value] of [
    ['officialUrl', harness.officialUrl],
    ['repositoryUrl', harness.repositoryUrl],
    ...((harness.sourceUrls ?? []).map((url) => ['sourceUrls', url])),
  ].filter(([, value]) => value)) {
    try {
      const url = new URL(value)
      if (url.protocol !== 'https:') errors.push(`${harness.id} ${field} must use https`)
      if (url.username || url.password) errors.push(`${harness.id} ${field} must not contain credentials`)
      if ([...url.searchParams.keys()].some((key) => key.toLowerCase().startsWith('utm_'))) {
        errors.push(`${harness.id} ${field} contains tracking parameters`)
      }
    } catch {
      errors.push(`${harness.id} ${field} is not a valid URL`)
    }
  }

  if (harness.lastVerifiedDate < harness.discoveredDate) {
    errors.push(`${harness.id} was verified before it was discovered`)
  }
  if (harness.lastVerifiedDate > today) {
    errors.push(`${harness.id} lastVerifiedDate is in the future`)
  }
  if (harness.availability === 'internal' && harness.repositoryUrl) {
    warnings.push(`${harness.id} is internal but publishes a repository URL; confirm the distinction`)
  }
  if (harness.availability === 'internal' && !/not publicly licensed/i.test(harness.license)) {
    errors.push(`${harness.id} is internal but its license does not state that it is not publicly licensed`)
  }
}

for (let leftIndex = 0; leftIndex < (directory.harnesses?.length ?? 0); leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < directory.harnesses.length; rightIndex += 1) {
    const left = directory.harnesses[leftIndex]
    const right = directory.harnesses[rightIndex]
    const nameScore = diceSimilarity(normaliseText(left.name), normaliseText(right.name))
    const companyScore = diceSimilarity(normaliseText(left.company), normaliseText(right.company))
    if (nameScore >= 0.78 && companyScore >= 0.7) {
      warnings.push(
        `fuzzy match only (not merged): ${left.id} ↔ ${right.id} ` +
          `(name ${nameScore.toFixed(2)}, company ${companyScore.toFixed(2)})`,
      )
    }
  }
}

for (const warning of warnings) console.warn(`WARN ${warning}`)

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`)
  console.error(`Data validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}.`)
  process.exit(1)
}

console.log(
  `Data valid: ${directory.harnesses.length} harnesses, ${repositoryKeys.size} repository identities, ` +
    `${warnings.length} review flags. Availability: ${[...availabilityCounts.entries()].map(([key, count]) => `${key}=${count}`).join(', ')}.`,
)
