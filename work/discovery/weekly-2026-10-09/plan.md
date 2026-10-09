
> the-build-bench@0.1.0 discover:plan
> node scripts/plan-discovery.mjs --mode weekly --days 30

# Harness discovery plan

Generated: 2026-10-09
Mode: weekly
Search window: 2026-09-09 through 2026-10-09 (30 days)
Known entries: 386
Deferred candidates: 206

## Upstream catalog deltas

- best-of-Agent-Harnesses: https://github.com/RyanAlberts/best-of-Agent-Harnesses
- awesome-agent-harness: https://github.com/mahonzhan/awesome-agent-harness

## Launch-language web queries

- [launch-harness] "agent harness" (launched OR released OR beta OR preview OR introducing)
- [launch-coding-agent] ("coding agent" OR "software engineering agent") (launched OR released OR beta OR preview)
- [launch-development-environment] "agentic development environment" OR "AI development environment" launch
- [launch-orchestration] ("agent orchestrator" OR "cross-agent orchestrator" OR "multi-agent coding") (launch OR released OR beta)
- [launch-background-agent] ("background coding agent" OR "remote coding agent" OR "autonomous worker agent") new
- [launch-runtime] ("agent runtime" OR "agent loop" OR "agent harness SDK") developer tool launch

## Community-signal queries

- [reddit-codex-launches] site:reddit.com/r/codex (launched OR released OR announcing OR built) (agent OR harness OR orchestrator)
- [reddit-claude-launches] site:reddit.com/r/ClaudeCode ("agent harness" OR "coding agent" OR orchestrator)
- [reddit-agent-launches] site:reddit.com ("cross-agent orchestrator" OR "agentic development environment" OR "new agent harness")
- [hacker-news-launches] site:news.ycombinator.com ("coding agent" OR "agent harness" OR "agent orchestrator")
- [vendor-community-signals] (Spotify OR Stripe OR Microsoft OR Google OR Amazon OR Cloudflare) ("coding agent" OR "agent harness" OR "agent orchestrator")

## Recent GitHub repository queries

- [github-agent-harness] gh search repos 'agent harness in:name,description,readme created:>=2026-09-09' --limit 50 --json fullName,url,description,createdAt,updatedAt
- [github-coding-agent] gh search repos 'coding agent in:name,description created:>=2026-09-09' --limit 50 --json fullName,url,description,createdAt,updatedAt
- [github-agent-orchestrator] gh search repos 'agent orchestrator in:name,description,readme created:>=2026-09-09' --limit 50 --json fullName,url,description,createdAt,updatedAt
- [github-agent-runtime] gh search repos 'agent runtime in:name,description created:>=2026-09-09' --limit 50 --json fullName,url,description,createdAt,updatedAt

## Official vendor queries (complete watchlist)

- [vendor-openai.com] site:openai.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-anthropic.com] site:anthropic.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-google.com] site:google.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-microsoft.com] site:microsoft.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-github.com] site:github.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-aws.amazon.com] site:aws.amazon.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-cursor.com] site:cursor.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-cognition.ai] site:cognition.ai ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-sourcegraph.com] site:sourcegraph.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-replit.com] site:replit.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-jetbrains.com] site:jetbrains.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-windsurf.com] site:windsurf.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-warp.dev] site:warp.dev ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-spotify.com] site:spotify.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-stripe.com] site:stripe.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-cloudflare.com] site:cloudflare.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-docker.com] site:docker.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-vercel.com] site:vercel.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-huggingface.co] site:huggingface.co ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-deepseek.com] site:deepseek.com ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-qwen.ai] site:qwen.ai ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")
- [vendor-moonshot.ai] site:moonshot.ai ("coding agent" OR "agent harness" OR "agent orchestrator" OR "agentic development environment")

## Required run report

Record every lane, query count, result count, verified addition, deferred candidate, rejection, blocked source, and the search window.
