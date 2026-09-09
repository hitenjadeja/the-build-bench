# Project workflow

- This repository, `hitenjadeja/the-build-bench`, is the production source for `https://hitenjadeja.github.io/the-build-bench/`. Do not create or publish catalog changes from an alternate repository.
- Maintain the durable checkout at `/Users/hiten/workspace/the-build-bench`; the World of Harnesses checkout is a frozen legacy source and redirect, not a second catalog.
- Discovery scripts only produce proposals. An authorized discovery sweep may promote entries after reviewing primary sources, identity, license, provenance, and duplicates; unresolved evidence or fuzzy matches remain deferred.
- After completing and validating changes, commit and push them to `origin` unless the user explicitly says not to.
- Do not open pull requests for this project. Push validated changes directly to `main`, including scheduled discovery evidence updates.
- For catalog or site changes, a successful push is not completion: monitor the GitHub Pages workflow and verify the published site returns HTTP 200, the deployed `catalog.json` contains the change, and the live search bundle includes the entry before reporting success.
- Keep commits scoped to this repository and do not stage unrelated files.
- In Codex Desktop, verify GitHub authentication with keyring access before reporting an authentication problem. A sandboxed `gh auth status` failure can mean the sandbox cannot read the keyring; rerun the check with the required host permissions before asking the user to log in.
- Use the repo-scoped `$discover-harnesses` skill for catalog discovery or refresh requests. `npm run discover:harnesses` alone covers GitHub and npm, not proprietary product launches on the wider web.
