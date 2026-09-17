---
name: feedback-review-tests-outside-ocr-scope
description: when the caller asks to verify tests weren't weakened, manually diff/read the test files even though ocr's default rules exclude tests/unit
metadata:
  type: feedback
---

When the delegating prompt calls out "check whether any test was weakened rather than retargeted"
(or similar), do the test-file review manually with `git diff`/`Read` in addition to the ocr-scoped
findings — do not skip it just because `ocr delegate preview` excludes `tests/unit/**` by
`default_path` (see [[project-spring-docs-ocr-scope]]).

Why: ocr's structured-findings JSON is scoped to the ledger it reviewed, but the caller's explicit
ask is a review requirement independent of that scope. In the issue-137 Boot-4.0.x-era review, the
right call was: report the ocr ledger normally (3 reviewable `.ts` files, tests excluded as
`default_path`), and separately narrate in the free-text summary that test diffs were checked
by hand and found to be genuine retargets (old "not buildable" assertions swapped for new
buildable-era assertions reflecting the feature change) rather than weakenings.

How to apply: any time a review prompt names test-weakening as a specific concern, treat it as an
override that pulls test files back into scope for your own reading, regardless of what ocr's
ledger includes.
