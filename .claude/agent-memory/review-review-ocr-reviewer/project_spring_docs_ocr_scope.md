---
name: project-spring-docs-ocr-scope
description: ocr delegate preview's default exclusions in the spring-docs repo, and where to find the era/version-resolution logic it doesn't cover
metadata:
  type: project
---

In `@pleaseai/spring-docs`, `ocr delegate preview` (no extra `--rule`/config override) excludes:
- all `*.md` files (`unsupported_ext`)
- everything under `tests/unit/` (`default_path`)

`.claude/settings.json` is not in that set: a default run selects it as reviewable, under the
`system / **/*.{json,json5}` rule group. It drops out only when the caller passes `--exclude` for
plugin-noise reasons, which is an override rather than a default.

So a normal ocr run reviews `scripts/**/*.ts` plus whatever JSON the change touches. When the task
asks to check whether tests were weakened (a recurring ask for this repo — see
[[feedback-review-tests-outside-ocr-scope]]), those test files must be read and diffed manually with
`git diff HEAD -- <test file>`, not through ocr's ledger — do not report them as "excluded/skipped"
findings since that's expected default behavior, not a gap.

Core version-resolution logic lives in `scripts/lib/upstream-sources.ts`: `LayoutEra` records
(`since`/`until`, `componentPath`, `assembly`), `eraFor()` (first array match wins, `since` inclusive
/ `until` exclusive), and `PROJECTS.boot.eras` (ordered array — must stay chronologically ordered
since `.find()` returns the first match). `scripts/lib/antora-attributes.ts` holds the
`ManagedVersionAttribute` tables (e.g. `BOOT_3_MANAGED_VERSIONS` / `BOOT_4_MANAGED_VERSIONS`) that
get threaded through `SynthesisSources.managedVersionAttributes` → `synthesizeAttributes` and
`versionSourceBoms`'s third parameter, so the BOM-fetch and attribute-synthesis passes read the same
table by construction.
