---
name: project-testing-standard
description: spring-docs sizes a new describe block like its neighbours — roughly one focused test per stated behavior, not exhaustive permutation coverage
metadata:
  type: project
---

`tests/unit/upstream-sources.test.ts` is the reference for what a new project or module owes in
tests. A new `describe` block is sized like `describe('framework')` and
`describe('resolveUpstream for Spring Security')`: roughly one test per stated behavior —
resolve/tag, generated attributes, symlinks, checkout paths, image and javadoc pinning, external
components, era floor and ceiling, version ordering. Note that those two blocks do not share a
shape: Framework asserts several facts in one test, Security splits them one fact per test. Both
are house style; copying either wholesale into a third block is what tripped SonarCloud's
duplication gate on [#249](https://github.com/pleaseai/spring-docs/pull/249) — twice, in fact:
first the `ai` block against Framework's, then a set of new stem tests against each other. The
fixes were squashed into `4929a345`, so the gate runs are on the pull request, not in the
history.

**Why:** the convention is observable in the test file and was restated by the user when
requesting review of the Spring AI PR (#249). It is *not* written down as an ADR in this repo —
`.please/docs/decisions/` holds 0001–0006 only, none about testing — so cite the test file, not
a decision record.

**How to apply:** when reviewing a new upstream-project entry, or new pure-function logic such as
`escapeText` / `STEM_SPAN` in `scripts/lib/inline-html.ts`, compare the test count and shape
against the neighbouring `describe` blocks rather than asking for permutation coverage. Still
flag a genuine behavioral gap — an untested branch of a text scanner is a real finding — just do
not multiply one gap into many redundant asks.
