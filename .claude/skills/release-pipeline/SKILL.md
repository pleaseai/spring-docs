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
| Projects | `ai`, `boot`, `framework`, `security` |
| Version format | GA `major.minor.patch` only — M/RC/SNAPSHOT are rejected by `isGaVersion` |
| Buildable ranges | `ai` → `>= 1.0.0` (overlay); `boot` → `3.3.0`–`<4.0.0` (synthesized) and `>= 4.0.8` (archive); `framework` → `>= 6.1.0` (overlay); `security` → `>= 6.2.0` (overlay, two eras) |
| Published | check `catalog.json`; an empty `projects` object means nothing has shipped yet |

A project is a sequence of **layout eras** (`LayoutEra`, ADR-0004), not a single floor. An era
pins the component path and how the *generated* half of the component is obtained, because one
without the other yields a tree that classifies but converts wrongly:

| Era | Component path | `assembly.descriptor` | Generated half comes from | Needs Maven Central |
|---|---|---|---|---|
| `boot` `3.3.0` – `<4.0.0` | `spring-boot-project/spring-boot-docs/src/docs/antora` | `synthesized` | rebuilt from the tag (`SynthesisSources`) plus the eight published `spring-boot-*` jars carrying configuration-property metadata | yes — metadata jars |
| `boot` `>= 4.0.8` | `documentation/spring-boot-docs/src/docs/antora` | `archive` | the published `root-aggregate-content` zip, merged over the checkout | yes — content zips |
| `framework` `>= 6.1.0` | `framework-docs` | `overlay` | the committed `antora.yml`, topped up with the version and the attributes the build contributes | no |
| `security` `6.2.0` – `<6.5.1` | `docs` | `overlay` | the committed `antora.yml`, topped up with attributes derived from `gradle/libs.versions.toml` and `gradle.properties` | no |
| `security` `>= 6.5.1` | `docs` | `overlay` | the same, plus the `modules/ROOT/examples/docs-src` symlink that era added | no |
| `ai` `>= 1.0.0` | `spring-ai-docs/src/main/antora` | `overlay` | the committed `antora.yml` unchanged — its build contributes no attribute at all | no |

`overlay` is the cheapest to add and the one to reach for first on a new project: check what
that project's `generateAntoraResources` actually produces. Spring Framework's is one
attribute (`spring-version`), so nothing is downloaded at all. Spring AI's is the degenerate
case — its whole generated template is `version` plus `prerelease`, neither of which is an
asciidoc attribute, so the overlay is pure passthrough and `generatedAttributesFor` returns
`{}`.

Eras are deliberately **not contiguous**, and `eraFor` returns `undefined` between them:

- **3.2 and older** predate the Antora component (`antora.yml` first appears at v3.3.0).
- **4.0.0–4.0.7** moved to the 4.x path but publish no content archive, so they belong to
  neither era and are refused rather than fetched from a path their tag does not have.
- **3.3–3.x archives exist but are unreachable** — Spring's
  `sync-to-maven-central/artifacts.spec` excludes `spring-boot-docs` from the sync, and
  `repo.spring.io` returns 401 anonymously. Hence synthesis rather than download.
- **4.1.0** is a *publication* fact, not a layout one: it is inside the archive era but its
  zip is unpublished, so it is probed over the network (below) instead of being encoded as an
  unbuildable range that would keep refusing it after upstream publishes.
- **Spring AI 0.8.x** is a publication fact too, and a permanent one, so it *is* encoded as a
  floor: `spring-ai-docs/src/main/antora/antora.yml` is byte-identical at v0.8.0 and v2.0.1, but
  `org/springframework/ai/spring-ai-bom` on Maven Central begins at `1.0.0-M5` — 0.8.0 and 0.8.1
  went to Spring's milestone repository only, and no consumer can pin a dependency to the
  versions those 50 pages describe.

The archive era's floor is not a compatibility guess either: upstream published that zip for
2.2.x–2.4.2, then not again until 4.0.8. The synthesized era's 3.3.0 floor has nothing to do
with it — 3.3.x–3.x rebuilds from the tag's BOM, attributes file and metadata jars instead.

3.x releases omit the generated appendix (auto-configuration listings and configuration-property
tables, ~101 pages) — it is a Gradle build output with no published equivalent. The prose corpus
is complete.

## What is buildable right now

```bash
bun run scripts/detect-upstream-versions.ts            # all supported projects
bun run scripts/detect-upstream-versions.ts --project boot --limit 5
```

Read-only: it diffs upstream tags against `catalog.json` and writes nothing. Era membership is
checked first (`supportedVersionsFromTags`), then every URL `requiredArtifactUrls` names for
that version is HEAD-probed through `unpublishedArtifacts` (bounded at `PROBE_CONCURRENCY`, 8) —
content zips for an archive era, metadata jars for a synthesized one, and nothing at all for an
overlay era, where being tagged upstream is the whole of being buildable. Versions missing an
artifact are reported on stderr and excluded. `fetch-upstream.ts` runs the same gate, so a build
fails before cloning rather than on a 404 partway through.

## Add a version of an existing project

No code change, as long as the version falls inside an existing era. Detection already covers
every such GA tag.

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

### A version outside every era

Adding an era is a conversion change, not a config tweak: measure what the checkout alone
produces first. Converting 3.5.16's checkout without the generated half exited 0 with 145 pages
— and 350 unresolved attributes, 837 unresolved `configprop:` macros and 326 silently empty
`include-code::` tab groups, which reach the output as literal text. That measurement is what
justified the synthesized era, and an unresolved-attribute count is the check for any new one.

An era needs `since`, an optional exclusive `until`, `componentPath`, and an `assembly` —
one of the three descriptors above. Declare eras oldest first and keep their ranges disjoint:
`eraFor` returns the first declared era whose range contains the version (`since` inclusive,
`until` exclusive), so two overlapping declarations resolve to the older one, not the newer.

## Add a new project

**First, decide the era.** Read the project's `antora.yml` and the Gradle or Maven task its
`ext.collector` names. If the committed descriptor already carries its attributes and the task
contributes only a version — as Spring Framework's does — it is an `overlay`, and nothing has
to be downloaded. Only reach for `synthesized` when the build genuinely generates content, and
for `archive` when Spring publishes a content zip to Maven Central (so far, Boot alone).

Then add one entry to `PROJECTS` in `scripts/lib/upstream-sources.ts`:

- `repo`, `tagPrefix`
- `eras` — one or more `LayoutEra`, oldest first (see above); the first `since` is the floor.
  Each era carries `since`, an optional exclusive `until`, and `componentPath` (the directory
  holding `antora.yml`) — the component path and the archive classifiers live inside an era,
  not on the project
- `assembly` — one of the three descriptors above, per era. `archive` takes
  `archiveClassifiers`; `synthesized` takes a `SynthesisSources`; `overlay` takes
  `generatedAttributesFor(version)`, `internalSymlinks`, and — where the build resolves values
  the version alone does not give — `derivedAttributes`, which names the committed files to read
  and a pure function over their contents (Spring Security reads its version catalog and
  `gradle.properties` that way; the named files are added to the sparse checkout automatically)
- `mavenGroupPath` / `mavenArtifact` — where its published artifacts live; only for a project
  with an archive or synthesized era, omit them for an overlay-only project
- `javadocLocationFor(version)` — retargets `javadoc:` macros, which otherwise dangle as
  `#api:java/...`
- `imageBaseFor(version)` — the published, version-pinned `_images/` base. Block images are
  linked there because a release archive carries Markdown only
- `externalComponentsFor(version)` — Antora components referenced by `xref:` that this build
  does not produce, mapped to their published site

**Declare any symlink the component ships.** `assertNoSymlinks` refuses every link reaching the
content source; an era's `internalSymlinks` names each one's path and expected target, and
replaces it with a real copy first — a link nobody declared still fails the copy, and a declared
one resolving to a different target fails too. Spring Framework reaches its examples through
`modules/ROOT/examples/docs-src` → `framework-docs/src`.

**Expect the converter to be incomplete for a new corpus.** Spring Boot's corpus does not
exercise every AsciiDoc construct: adding Spring Framework surfaced hand-written tab groups
(`Java::` / `+` / listing, whose description is Ruby `nil`), `colist`, `literal`,
`floating_title`, block images and role `<span>`s — none of which Boot uses. Run `--strict` and
add a rule per construct.

**`--strict` does not catch everything, so read the output too.** It gates on the converter's
own unknown-construct warnings, which fire only for a node the walker does not recognise.
Anything Asciidoctor substitutes *before* the walker runs is invisible to it: Spring AI's 16
inline `stem:[…]` expressions arrive as plain text in MathJax delimiters (`\$…\$` for asciimath,
`\(…\)` for latexmath), and were escaped as prose into `\\$\\vec{a}\\$` across a page of vector
maths while `--strict` reported zero warnings. `escapeText` in `inline-html.ts` now carries them
through as `$…$`. Diff a page or two of a new corpus against the upstream site before believing
a clean run.

Then:

- extend `tests/unit/upstream-sources.test.ts`
- add the upstream attribution to `NOTICE`
- update the support table above and the fetch step in `README.md`

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

**Release one version at a time.** Every catalog branch is cut from the default branch, so two
releases whose pull requests are open together both rewrite the same `projects` object and the
second conflicts. Merge each before tagging the next; if two are already open, merge one and
re-run the other tag's workflow, which recreates its branch from the default branch. The catalog
pull request also gets no `ci.yml` run — GitHub does not trigger workflows for a pull request
created with `GITHUB_TOKEN`.

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
| `scripts/lib/upstream-sources.ts` | project definitions, layout eras, version comparison |
| `scripts/lib/artifact-availability.ts` | bounded HEAD probing of required Maven artifacts |
| `scripts/lib/antora-attributes.ts`, `bom-libraries.ts`, `component-descriptor.ts` | the synthesized era's reconstruction of the generated component |
| `scripts/detect-upstream-versions.ts` | what upstream has that the catalog lacks |
| `scripts/release-mode.ts` | which phase a re-run still owes |
| `.github/actions/build-release/action.yml` | fetch → convert → package, shared by both builds |
| `.github/workflows/matrix-build.yml` | parallel verification builds, publishes nothing |
| `.github/workflows/release.yml` | tag-triggered publish + catalog pull request |
| `.github/workflows/nightly-detect.yml` | files an issue per missing GA version |
| `.please/docs/decisions/0004-synthesize-3x-component.md` | why eras exist, and what the synthesized era reconstructs |
