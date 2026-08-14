export const reviewStates = ['source-verified', 'community-verified', 'needs-review'] as const

export type ReviewStatus = (typeof reviewStates)[number]

export type Harness = {
  id: string
  name: string
  company: string
  description: string
  capabilities: string[]
  languages: string[]
  license: string
  officialUrl: string
  repositoryUrl: string
  logo?: string
  monogram: string
  tags: string[]
  reviewStatus: ReviewStatus
  sourceUrls: string[]
  discoveredDate: string
  lastVerifiedDate: string
}

export type HarnessData = {
  version: string
  generatedAt: string
  harnesses: Harness[]
}
