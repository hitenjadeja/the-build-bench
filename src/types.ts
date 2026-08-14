export const reviewStates = ['source-verified', 'community-verified', 'needs-review'] as const

export type ReviewStatus = (typeof reviewStates)[number]

export const availabilityStates = ['open-source', 'unclear', 'proprietary', 'internal'] as const

export type Availability = (typeof availabilityStates)[number]

export type Harness = {
  id: string
  name: string
  company: string
  description: string
  capabilities: string[]
  languages: string[]
  license: string
  availability: Availability
  officialUrl: string
  repositoryUrl: string | null
  logo?: string
  monogram: string
  tags: string[]
  reviewStatus: ReviewStatus
  sourceKind: string
  provenance: 'RyanAlberts/best-of-Agent-Harnesses' | 'independent-discovery' | 'original-build-bench'
  sourceUrls: string[]
  discoveredDate: string
  lastVerifiedDate: string
}

export type HarnessData = {
  version: string
  generatedAt: string
  sources: Array<{
    name: string
    url: string
    license: string
    capturedDate: string
  }>
  harnesses: Harness[]
}
