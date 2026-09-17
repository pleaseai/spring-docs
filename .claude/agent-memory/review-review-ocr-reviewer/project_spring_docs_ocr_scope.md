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
[[feedback-review-tests-outside-ocr-scope]]), those test files must be read and diffed manually
rather than through ocr's ledger.

Load them the same way Delegation Mode loads anything else — from the mode and ref metadata
`ocr delegate preview` reported, never from a base rederived by hand. The contract is the
"Load each change" section of `agents/ocr-reviewer.md`, and it says not to recalculate the merge
base:

- **workspace** — `git diff HEAD -- <test file>`.
- **range** — `git diff <merge_base>..<to> -- <test file>`, with the `merge_base` and `to` preview
  printed. Two dots, and `<to>` rather than `HEAD`: the three-dot form rederives the merge base the
  preview already resolved, and `HEAD` is the wrong endpoint whenever `--to` points elsewhere.
- **commit** — `git show <commit> -- <test file>`.

Getting this wrong fails silently. In range mode `git diff HEAD --` reports no change at all, so the
weakening check passes over a diff it never saw and reads as a clean result.

Either way, do not report those files as "excluded/skipped" findings, since that's expected default
behavior, not a gap.

Core version-resolution logic lives in `scripts/lib/upstream-sources.ts`: `LayoutEra` records
(`since`/`until`, `componentPath`, `assembly`), `eraFor()` (first array match wins, `since` inclusive
/ `until` exclusive), and `PROJECTS.boot.eras` (ordered array — must stay chronologically ordered
since `.find()` returns the first match). `scripts/lib/antora-attributes.ts` holds the
`ManagedVersionAttribute` tables (e.g. `BOOT_3_MANAGED_VERSIONS` / `BOOT_4_MANAGED_VERSIONS`) that
get threaded through `SynthesisSources.managedVersionAttributes` → `synthesizeAttributes` and
`versionSourceBoms`'s third parameter, so the BOM-fetch and attribute-synthesis passes read the same
table by construction.
