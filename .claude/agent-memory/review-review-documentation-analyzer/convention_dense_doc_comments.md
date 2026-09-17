---
name: convention-dense-doc-comments-verifiable-claims
description: spring-docs repo convention — doc comments in scripts/lib/*.ts and SKILL.md state specific, checkable facts (URLs, counts, versions) as evidence; these must be verified against upstream, not just internal consistency
metadata:
  type: project
---

`pleaseai/spring-docs` writes unusually dense doc comments (in `scripts/lib/upstream-sources.ts`,
`scripts/lib/inline-html.ts`, and `.claude/skills/release-pipeline/SKILL.md`) that justify code
decisions with specific factual claims: exact page/file counts, Maven Central artifact
coordinates, HTTP status/redirect behavior, byte-identical-file claims across versions, etc.

**Why:** These aren't stylistic flourishes — they're the project's substitute for inline citations,
and per the review brief for this repo, checking them means fetching/cloning the actual upstream
tag and counting, not just checking that the PROJECTS object and the prose say the same number.
Internal consistency (comment matches code) is necessary but not sufficient; the comment can be
internally consistent with the code and still be wrong about upstream (see
[[project-spring-ai-page-counts]]).

**How to apply:** When reviewing a diff to this repo that touches `scripts/lib/*.ts` doc comments
or `SKILL.md`, budget time to spot-check at least the highest-confidence-sounding numeric claims
(page counts, "N files", "byte-identical at vX and vY") against a real upstream clone/fetch, not
just against the surrounding TypeScript.
