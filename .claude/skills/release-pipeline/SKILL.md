---
name: release-pipeline
description: Which (project, version) pairs this repo supports, how to add a version or a whole new Spring project, and how to cut, rebuild, or recover a release. Use when asked what versions are supported, to build or publish a new version, to add a project such as framework/security/data, to correct a published archive, or when a release run failed halfway.
---

# Release pipeline

`scripts/lib/upstream-sources.ts` (`PROJECTS`) is the single source of truth for what can be
built; `catalog.json` is the single source of truth for what has been published. Read both
before answering "is X supported" — they answer different questions.

## Current support

| | |
|---|---|
| Projects | `boot` only |
| Version format | GA `major.minor.patch` only — M/RC/SNAPSHOT are rejected by `isGaVersion` |
| Floor | `boot` → `minimumVersion: '4.0.8'` |
| Published | check `catalog.json`; an empty `projects` object means nothing has shipped yet |

The floor is not a compatibility guess: the pipeline needs the `spring-boot-docs`
`root-aggregate-content` zip from Maven Central, which upstream published for 2.2.x–2.4.2, then
not again until 4.0.8. Tags without that archive (4.0.0–4.0.7, 4.1.0) can never be built, and
`detect-upstream-versions.ts` HEAD-checks every candidate so they are skipped rather than
offered.

## What is buildable right now

```bash
bun run scripts/detect-upstream-versions.ts            # all supported projects
bun run scripts/detect-upstream-versions.ts --project boot --limit 5
```

Read-only: it diffs upstream tags against `catalog.json` and writes nothing. Versions with no
published content archive are reported on stderr and excluded from the result.

## Add a version of an existing project

No code change. Detection already covers every GA tag at or above the floor.

1. Verify conversion — locally, or with the **Matrix Build** workflow (`workflow_dispatch`,
   inputs `project` (blank = all) and `limit` (default 3)). It publishes nothing; archives are
   uploaded as workflow artifacts.

   ```bash
   bun run scripts/fetch-upstream.ts boot 4.1.1 --out dist/upstream
   bun run scripts/convert.ts dist/upstream/boot-4.1.1 --project boot --version 4.1.1 --out dist --strict
   bun run scripts/package-release.ts dist/boot-4.1.1 --out releases
   ```

2. Release it (below).

`nightly-detect.yml` (03:00 UTC) files one issue per missing GA version, with the org-required
Priority and Importance issue fields. It builds nothing on purpose — a new upstream line can
change the documentation layout, so a human decides.

### Going below the floor

Lowering `minimumVersion` only helps where the archive exists. 4.0.0–4.0.7 and 4.1.0 have none.
2.2.x–2.4.2 do, but their documentation layout differs, so the converter has to be validated
against them first — treat it as a conversion change, not a config tweak.

## Add a new project

Add one entry to `PROJECTS` in `scripts/lib/upstream-sources.ts`:

- `repo`, `componentPath` (directory holding `antora.yml`), `tagPrefix`
- `mavenGroupPath`, `mavenArtifact`, `archiveClassifiers` — the published content archives
- `minimumVersion` — the oldest version whose archives exist and whose layout converts
- `javadocLocationFor(version)` — retargets `javadoc:` macros, which otherwise dangle as
  `#api:java/...`
- `externalComponentsFor(version)` — Antora components referenced by `xref:` that this build
  does not produce, mapped to their published site

Then:

- extend `tests/unit/upstream-sources.test.ts`
- add the upstream attribution to `NOTICE`
- update the README support table

**Project key constraint**: `release.yml`'s tag allowlist accepts lowercase segments that each
start with a letter (`data-jpa` yes, `abc-4` no). That encodes the invariant
`scripts/lib/release-name.ts` relies on — the last hyphen is the version separator — so a key
containing hyphen-then-digit makes the two halves of the pipeline disagree about
`(project, version)`.

## Cut a release

The tag is the trigger and the source of truth. Tag a commit on the default branch that carries
the pipeline code you want to build with.

```bash
git tag boot-4.1.1 && git push origin boot-4.1.1
```

`release.yml` then:

1. validates the tag shape and splits `(project, version)` at the last hyphen
2. rebuilds from the tag via `.github/actions/build-release` (never promotes a matrix artifact)
3. checks `manifest.json` against the tag
4. `gh release create` — `<name>.tar.gz`, `.tar.gz.sha256`, `manifest.json`
5. **only after** the release exists, opens a `catalog/<tag>` pull request adding the
   `catalog.json` entry and the converted tree under `markdown/<project>/<version>/`

Merge that pull request to finish the release — consumers resolve through `catalog.json`.
Permissions needed: `contents: write` + `pull-requests: write` on the default `GITHUB_TOKEN`.

## Correct a published archive

Tags are immutable: never delete or move one. Publish `boot-4.1.1+rebuild.1` instead; the
catalog entry for `4.1.1` is repointed at the new tag. This is also the path after a conversion
fix in `scripts/lib/markdown-converter.ts` or `inline-html.ts` — every affected release needs a
rebuild tag.

## Recover a failed release

Re-run the same tag. `scripts/release-mode.ts` reads the default branch's `catalog.json` plus
whether the GitHub release exists and reports `publish`, `register`, or `complete`; the run
completes only the outstanding phase. In `register` mode it rebuilds and requires the rebuilt
archive's sha256 to match the published one — the archive is reproducible by construction
(sorted entries, pinned timestamps, `gzip -n`), so a mismatch means the published bytes came
from different input and must not be indexed. Publish a `+rebuild.N` tag in that case.

## Invariants not to break

- GA versions only; no pre-releases.
- A published tag is never deleted or moved.
- A failed release does not touch `catalog.json`.
- `--strict` conversion: an unhandled AsciiDoc construct fails the build; add a rule rather
  than a fallback.
- `generated_at` in `manifest.json` is the only non-deterministic field in a release.

## Files

| Path | Role |
|---|---|
| `scripts/lib/upstream-sources.ts` | project definitions, floors, version comparison |
| `scripts/detect-upstream-versions.ts` | what upstream has that the catalog lacks |
| `scripts/release-mode.ts` | which phase a re-run still owes |
| `.github/actions/build-release/action.yml` | fetch → convert → package, shared by both builds |
| `.github/workflows/matrix-build.yml` | parallel verification builds, publishes nothing |
| `.github/workflows/release.yml` | tag-triggered publish + catalog pull request |
| `.github/workflows/nightly-detect.yml` | files an issue per missing GA version |
