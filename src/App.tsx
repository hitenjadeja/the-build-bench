import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import rawData from '../data/harnesses.v1.json'
import type { Harness, HarnessData, ReviewStatus } from './types'

const data = rawData as HarnessData

type Filters = {
  capability: string
  language: string
  license: string
  reviewStatus: string
}

const emptyFilters: Filters = {
  capability: '',
  language: '',
  license: '',
  reviewStatus: '',
}

const reviewLabels: Record<ReviewStatus, string> = {
  'source-verified': 'Source verified',
  'community-verified': 'Community verified',
  'needs-review': 'Needs review',
}

function uniqueValues(values: string[][]) {
  return [...new Set(values.flat())].sort((a, b) => a.localeCompare(b))
}

function LogoFrame({ harness }: { harness: Harness }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className="logo-frame" aria-hidden="true">
      <span className="logo-monogram">{harness.monogram}</span>
      {harness.logo && !imageFailed ? (
        <img
          className="logo-image"
          src={harness.logo}
          alt=""
          width="72"
          height="72"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <span className="frame-bolt frame-bolt-a" />
      <span className="frame-bolt frame-bolt-b" />
    </div>
  )
}

function StatusStamp({ status }: { status: ReviewStatus }) {
  return (
    <span className={`status-stamp status-${status}`}>
      <span className="status-light" aria-hidden="true" />
      {reviewLabels[status]}
    </span>
  )
}

function HarnessCard({ harness, featured = false, index = 0 }: { harness: Harness; featured?: boolean; index?: number }) {
  const accent = ['cobalt', 'orange', 'pink', 'lime'][index % 4]

  return (
    <article className={`harness-card card-${accent}${featured ? ' is-featured' : ''}`} data-harness-card>
      <div className="card-topline">
        <span className="part-number">UNIT / {String(index + 1).padStart(2, '0')}</span>
        <StatusStamp status={harness.reviewStatus} />
      </div>

      <div className="card-identity">
        <LogoFrame harness={harness} />
        <div>
          <p className="company-name">{harness.company}</p>
          <h3>
            <a className="card-primary-link" href={harness.officialUrl} target="_blank" rel="noreferrer">
              {harness.name}
              <span className="sr-only"> — official site, opens in a new tab</span>
            </a>
          </h3>
        </div>
      </div>

      <p className="card-description">{harness.description}</p>

      <ul className="tag-list" aria-label={`${harness.name} tags`}>
        {harness.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      <div className="card-specs">
        <div>
          <span>Language</span>
          <strong>{harness.languages.join(' + ')}</strong>
        </div>
        <div>
          <span>License</span>
          <strong>{harness.license}</strong>
        </div>
      </div>

      <div className="card-actions">
        <a href={harness.repositoryUrl} target="_blank" rel="noreferrer">
          Source <span aria-hidden="true">↗</span>
          <span className="sr-only"> for {harness.name}, opens in a new tab</span>
        </a>
        <span>Checked {harness.lastVerifiedDate}</span>
      </div>
    </article>
  )
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  inputRef,
}: {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  inputRef?: React.RefObject<HTMLSelectElement | null>
}) {
  return (
    <label className="filter-control" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} ref={inputRef}>
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const firstFilterRef = useRef<HTMLSelectElement>(null)

  const capabilities = useMemo(() => uniqueValues(data.harnesses.map((item) => item.capabilities)), [])
  const languages = useMemo(() => uniqueValues(data.harnesses.map((item) => item.languages)), [])
  const licenses = useMemo(() => [...new Set(data.harnesses.map((item) => item.license))].sort(), [])
  const reviewStatuses = useMemo(
    () => [...new Set(data.harnesses.map((item) => item.reviewStatus))],
    [],
  )

  const results = useMemo(() => {
    const normalisedQuery = query.trim().toLocaleLowerCase()

    return data.harnesses.filter((harness) => {
      const searchText = [
        harness.name,
        harness.company,
        harness.description,
        harness.license,
        ...harness.capabilities,
        ...harness.languages,
        ...harness.tags,
      ]
        .join(' ')
        .toLocaleLowerCase()

      return (
        (!normalisedQuery || searchText.includes(normalisedQuery)) &&
        (!filters.capability || harness.capabilities.includes(filters.capability)) &&
        (!filters.language || harness.languages.includes(filters.language)) &&
        (!filters.license || harness.license === filters.license) &&
        (!filters.reviewStatus || harness.reviewStatus === filters.reviewStatus)
      )
    })
  }, [filters, query])

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const featured = data.harnesses.filter((harness) => ['openai-codex', 'anthropic-claude-code'].includes(harness.id))

  const closeFilters = () => {
    setFilterOpen(false)
    window.requestAnimationFrame(() => filterButtonRef.current?.focus())
  }

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isTyping = target.matches('input, textarea, select, [contenteditable="true"]')

      if (filterOpen && event.key === 'Tab') {
        const panel = document.getElementById('filter-panel')
        const focusable = [
          ...(panel?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ) ?? []),
        ]
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }

      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        searchRef.current?.focus()
      }

      if (event.key === 'Escape') {
        if (filterOpen) {
          closeFilters()
        } else if (query) {
          setQuery('')
          searchRef.current?.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [filterOpen, query])

  useEffect(() => {
    if (filterOpen) firstFilterRef.current?.focus()
  }, [filterOpen])

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const clearAll = () => {
    setQuery('')
    setFilters(emptyFilters)
    searchRef.current?.focus()
  }

  const onGalleryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>('.card-primary-link')]
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement)
    if (currentIndex < 0) return

    event.preventDefault()
    const increment = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    links[(currentIndex + increment + links.length) % links.length]?.focus()
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#directory-results">Skip to directory results</a>

      <header className="bench-header">
        <a className="wordmark" href="#top" aria-label="The Build Bench, home">
          <span className="wordmark-tool" aria-hidden="true"><i /><i /></span>
          <span>The Build Bench</span>
        </a>
        <div className="header-readout" aria-label={`Dataset version ${data.version}`}>
          <span className="readout-light" /> DATA V{data.version.split('.')[0]}
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span>PUBLIC INDEX</span> AI PROJECT HARNESSES</p>
            <h1 id="hero-title">Find the right harness.<br /><em>Build faster.</em></h1>
            <p className="hero-intro">Source-checked tools for agents that read, reason, edit, run, and ship.</p>
          </div>
          <aside className="hero-gauge" aria-label="Directory coverage">
            <span className="gauge-label">Bench load</span>
            <strong>{String(data.harnesses.length).padStart(2, '0')}</strong>
            <span>verified units</span>
            <div className="gauge-track"><i style={{ width: '72%' }} /></div>
          </aside>
        </section>

        <section className="search-bench" aria-labelledby="search-title">
          <h2 id="search-title" className="sr-only">Search the harness directory</h2>
          <label className="search-control" htmlFor="harness-search">
            <span className="search-label">Search the bench</span>
            <span className="search-input-wrap">
              <span className="search-icon" aria-hidden="true" />
              <input
                ref={searchRef}
                id="harness-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, company, capability, tag…"
                autoComplete="off"
              />
              <kbd aria-label="Keyboard shortcut: slash">/</kbd>
            </span>
          </label>

          <button
            className="mobile-filter-toggle"
            type="button"
            aria-expanded={filterOpen}
            aria-controls="filter-panel"
            onClick={() => setFilterOpen(true)}
            ref={filterButtonRef}
          >
            Filters {activeFilterCount > 0 ? <span>{activeFilterCount}</span> : null}
          </button>

          {filterOpen ? (
            <button className="filter-scrim" type="button" aria-label="Close filters" onClick={closeFilters} />
          ) : null}

          <div
            className={`filter-panel${filterOpen ? ' is-open' : ''}`}
            id="filter-panel"
            role={filterOpen ? 'dialog' : undefined}
            aria-modal={filterOpen ? 'true' : undefined}
            aria-label={filterOpen ? 'Filter harnesses' : undefined}
          >
            <div className="filter-panel-heading">
              <span>Bench filters / 04</span>
              <button type="button" onClick={closeFilters}>Close</button>
            </div>
            <div className="filter-grid">
              <FilterSelect id="filter-capability" label="Capability" value={filters.capability} options={capabilities} onChange={(value) => updateFilter('capability', value)} inputRef={firstFilterRef} />
              <FilterSelect id="filter-language" label="Language" value={filters.language} options={languages} onChange={(value) => updateFilter('language', value)} />
              <FilterSelect id="filter-license" label="License" value={filters.license} options={licenses} onChange={(value) => updateFilter('license', value)} />
              <FilterSelect id="filter-review" label="Review status" value={filters.reviewStatus} options={reviewStatuses} onChange={(value) => updateFilter('reviewStatus', value)} />
            </div>
            <button className="clear-controls" type="button" onClick={() => setFilters(emptyFilters)} disabled={activeFilterCount === 0}>
              Reset switches
            </button>
          </div>

          <div className="results-readout" aria-live="polite" aria-atomic="true">
            <span><strong>{results.length}</strong> {results.length === 1 ? 'harness' : 'harnesses'} on bench</span>
            <span>{query ? `Search: “${query}”` : 'Ready to inspect'}</span>
          </div>
        </section>

        <section className="featured-section" aria-labelledby="featured-heading">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Pinned to the front rail</p>
              <h2 id="featured-heading">Featured harnesses</h2>
            </div>
            <span className="stamped-label">SOURCE CHECKED</span>
          </div>
          <div className="featured-grid">
            {featured.map((harness, index) => <HarnessCard key={harness.id} harness={harness} featured index={index} />)}
          </div>
        </section>

        <section className="gallery-section" aria-labelledby="directory-heading" id="directory-results">
          <div className="section-heading gallery-heading">
            <div>
              <p className="section-kicker">Component gallery</p>
              <h2 id="directory-heading">All units</h2>
            </div>
            <p>Use <kbd>←</kbd> <kbd>→</kbd> between focused cards</p>
          </div>

          {results.length > 0 ? (
            <div className="harness-gallery" onKeyDown={onGalleryKeyDown}>
              {results.map((harness, index) => <HarnessCard key={harness.id} harness={harness} index={index} />)}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">∅</span>
              <h3>No matching unit</h3>
              <p>Try a broader search or return the filter switches to neutral.</p>
              <button type="button" onClick={clearAll}>Clear the bench</button>
            </div>
          )}
        </section>

        <section className="methodology" aria-labelledby="method-heading">
          <div className="method-intro">
            <p className="section-kicker">Method / provenance</p>
            <h2 id="method-heading">Measured twice.<br />Published once.</h2>
            <p>Every listed harness is checked against official product pages, documentation, and source repositories before it reaches the bench.</p>
          </div>
          <ol className="method-steps">
            <li><span>01</span><div><strong>Discover</strong><p>Bounded research lanes collect candidates without touching published data.</p></div></li>
            <li><span>02</span><div><strong>Verify</strong><p>Canonical URLs, repository identity, organisation, and license evidence are checked.</p></div></li>
            <li><span>03</span><div><strong>Review</strong><p>Fuzzy matches are flagged. A human approves every directory change in a pull request.</p></div></li>
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <span className="footer-bolt" aria-hidden="true" />
          <p><strong>The Build Bench</strong><br />A public directory in the World of Harnesses.</p>
        </div>
        <div className="codex-mark" aria-label="Built with Codex">
          <span aria-hidden="true">⌬</span>
          <span>Built with<br /><strong>Codex</strong></span>
        </div>
      </footer>
    </div>
  )
}

export default App
