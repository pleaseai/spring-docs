---
name: project-spring-ai-page-counts
description: a "pages" count for the Spring AI corpus means modules/ROOT/pages/**/*.adoc, not every .adoc under the module — the two differ by nav.adoc and partials
metadata:
  type: project
---

Counting "pages" in an Antora corpus has two plausible readings, and for Spring AI they differ.
Verified directly against `spring-projects/spring-ai`:

- **v2.0.1** — `modules/ROOT/pages/**/*.adoc` = 121 pages. Every `.adoc` under `ROOT`, which also
  picks up `nav.adoc` and 2 partials, = 124.
- **v0.8.0** — pages = 50. Every `.adoc`, which adds `nav.adoc`, = 51.

A draft of #249 cited the wider numbers (124 and 51) as page counts in
`scripts/lib/upstream-sources.ts` and `.claude/skills/release-pipeline/SKILL.md`. Both were
corrected to 121 and 50 before that PR merged, so the committed comments are right today — the
trap is the counting method, not a defect still in the tree.

**Why:** this repo treats specific numbers in doc comments as load-bearing evidence rather than
decoration (see [[convention-dense-doc-comments-verifiable-claims]]). A count that is off by a
small, systematic amount still reads as verified fact.

**How to apply:** when a comment here cites a page count for an upstream corpus, clone the
upstream tag and count `modules/ROOT/pages/**/*.adoc` separately from all `**/*.adoc` under the
module, so you can tell which the author meant and whether the two were conflated.
