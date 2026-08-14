import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const directory = JSON.parse(await readFile(path.join(root, 'data/harnesses.v1.json'), 'utf8'))
const concurrency = Number(process.env.LINK_CHECK_CONCURRENCY ?? 10)
const timeout = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? 15_000)

function canonicalUrl(value) {
  const url = new URL(value)
  url.hash = ''
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url.toString().replace(/\/$/, '')
}

const links = new Map()

function recordLink(url, record) {
  if (!url) return
  const key = canonicalUrl(url)
  const existing = links.get(key) ?? []
  existing.push(record)
  links.set(key, existing)
}

for (const source of directory.sources ?? []) recordLink(source.url, `catalog source: ${source.name}`)
for (const harness of directory.harnesses ?? []) {
  recordLink(harness.officialUrl, `${harness.id}: officialUrl`)
  recordLink(harness.repositoryUrl, `${harness.id}: repositoryUrl`)
  for (const url of harness.sourceUrls ?? []) recordLink(url, `${harness.id}: sourceUrls`)
}

function isReachableStatus(status) {
  return (status >= 200 && status < 400) || [401, 403, 429].includes(status)
}

async function check(url) {
  const options = {
    redirect: 'follow',
    headers: { 'user-agent': 'The-Build-Bench-Link-Check/1.0' },
    signal: AbortSignal.timeout(timeout),
  }
  let response = await fetch(url, { ...options, method: 'HEAD' })
  if ([400, 405, 501].includes(response.status)) {
    response = await fetch(url, { ...options, method: 'GET', headers: { ...options.headers, range: 'bytes=0-0' } })
  }
  return response.status
}

const queue = [...links.keys()]
const failures = []
let checked = 0

async function worker() {
  while (queue.length > 0) {
    const url = queue.shift()
    try {
      const status = await check(url)
      if (!isReachableStatus(status)) failures.push({ url, status, records: links.get(url) })
    } catch (error) {
      failures.push({ url, error: error.message, records: links.get(url) })
    }
    checked += 1
    if (checked % 50 === 0) console.log(`Checked ${checked}/${links.size} unique URLs…`)
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))

if (failures.length > 0) {
  for (const failure of failures) {
    const reason = failure.status ? `HTTP ${failure.status}` : failure.error
    console.error(`BROKEN ${failure.url} (${reason}) — ${failure.records.join(', ')}`)
  }
  console.error(`Link check failed: ${failures.length}/${links.size} unique URLs were unreachable.`)
  process.exit(1)
}

console.log(`Link check passed: ${links.size} unique URLs referenced by ${directory.harnesses.length} harnesses.`)
