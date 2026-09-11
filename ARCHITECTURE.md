# Architecture

> Bird's-eye view of `@pleaseai/spring-docs` — how the conversion pipeline is structured, where to start reading code, and which constraints must hold.
>
> **Audience**: Contributors implementing or reviewing pipeline changes. For *what this project is* and *how to consume artifacts*, see [`README.md`](./README.md).
>
> **Status**: The fetch → convert → package → index pipeline is implemented and proven end to end on `boot 4.1.1`, and the CI workflows that drive it (detect, matrix build, release) are in place. Nothing has been published yet: `catalog.json` is still empty and `markdown/` holds no content. This file plus `.please/docs/knowledge/` remain the canonical statement of intent.

## Table of Contents

- [Bird's-Eye Overview](#birds-eye-overview)
- [Entry Points](#entry-points)
- [Code Map](#code-map)
- [Data Flow](#data-flow)
- [Architecture Invariants](#architecture-invariants)
- [Cross-Cutting Concerns](#cross-cutting-concerns)
- [What This Is NOT](#what-this-is-not)
- [Related Documents](#related-documents)

## Bird's-Eye Overview

`@pleaseai/spring-docs` is a **content repository with an attached conversion pipeline**. Two artifacts ship from this repo:

1. **The pipeline** (`scripts/`, `.github/workflows/`) — TypeScript code and GitHub Actions that fetch upstream Spring AsciiDoc/Antora docs, convert them to LLM-friendly Markdown, and publish each `(project, version)` pair as an immutable GitHub Release archive.
2. **The catalog** (`catalog.json`, `markdown/`) — A committed master index plus the generated Markdown tree. `catalog.json` is the API consumers use to resolve a Spring dependency version to a downloadable archive tag.

The pipeline is **stateless and matrix-parallelized**: each `(project, version)` build is independent, runs in its own GitHub Actions job, and writes one Release tag plus one entry in `catalog.json`. There is no database, no server, and no scheduler beyond GitHub Actions cron triggers.

The repo is also **a downstream of multiple upstream projects** (`spring-projects/spring-framework`, `spring-projects/spring-boot`, etc.). It does not host Spring source; it does not modify the *meaning* of Spring documentation; it only re-formats it.

## Entry Points

When reading the code or the spec for the first time, start here:

| Where                                                    | What                                                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`README.md`](./README.md)                               | Project overview, distribution model, consumption examples — the consumer-facing contract           |
| [`catalog.json`](./catalog.json)                         | The public index `(project, version) → release tag`. Read this to understand the API consumers see  |
| `.please/docs/knowledge/product.md`                      | Product vision, scope, success criteria                                                             |
| `.please/docs/knowledge/tech-stack.md`                   | Runtime, language, conversion library choices with rationale                                        |
| [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | CI entry — typecheck + lint + `validate-catalog` + test on every PR and push to main                |
| [`scripts/validate-catalog.ts`](./scripts/validate-catalog.ts) | Tooling entry — runs the catalog zod schema; CI gate that guards `catalog.json` shape              |
| [`scripts/fetch-upstream.ts`](./scripts/fetch-upstream.ts) | Pipeline entry — sparse-checkout one upstream `(project, tag)` pair and merge its published content archives |
| [`scripts/convert.ts`](./scripts/convert.ts)             | Pipeline entry — AsciiDoc/Antora → Markdown conversion                                              |
| [`scripts/package-release.ts`](./scripts/package-release.ts) | Pipeline entry — produce `tar.gz` + `manifest.json` + SHA-256 checksum                          |
| [`scripts/update-catalog.ts`](./scripts/update-catalog.ts) | Pipeline entry — record a published `(project, version) → tag` in `catalog.json`                  |
| [`.please/docs/decisions/0002-antora-as-a-library.md`](./.please/docs/decisions/0002-antora-as-a-library.md) | Why conversion delegates to Antora + Spring's own extensions rather than reimplementing them |
| [`.github/workflows/matrix-build.yml`](./.github/workflows/matrix-build.yml) | CI entry — orchestrates N projects × M versions in parallel                       |
| [`.github/workflows/release.yml`](./.github/workflows/release.yml) | CI entry — a `<project>-<version>` tag push builds, publishes and records the release |

## Code Map

Top-level layout, in implementation order (top to bottom = fetch → convert → publish):

### `scripts/`

Conversion pipeline. Each top-level file is an executable Bun/TypeScript script with a clearly defined input → output. Pure logic lives in `scripts/lib/`.

| File                       | Role                                                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-catalog.ts`      | Validate `catalog.json` against the canonical zod schema. CI gate.                                                                                |
| `fetch-upstream.ts`        | Pipeline entry — sparse-checkout one upstream `(project, tag)` docs subtree, merge Spring's published content archives, write a provenance sidecar. |
| `convert.ts`               | Pipeline entry — drive Antora's pipeline modules over a fetched tree and emit one Markdown file per page plus `_index.md`.                          |
| `package-release.ts`       | Pipeline entry — produce a reproducible `tar.gz` + `manifest.json` + SHA-256 checksum.                                                             |
| `update-catalog.ts`        | Pipeline entry — record a published `(project, version) → tag` in `catalog.json`.                                                                 |
| `release-mode.ts`          | Pipeline entry — report whether a tag still owes publication, registration, or nothing (ADR-0003).                                                |
| `promote-markdown.ts`      | Pipeline entry — copy a converted tree into the committed `markdown/<project>/<version>/`.                                                       |
| `detect-upstream-versions.ts` | Tooling entry — list GA versions upstream has released that the catalog does not carry. Read-only; feeds the nightly issues and the build matrix. |
| `lib/catalog-schema.ts`    | zod schema for `catalog.json`. Owns the public catalog shape; changes require an ADR.                                                             |
| `lib/upstream-sources.ts`  | Per-project upstream coordinates — repo, tag, component path, content archives, javadoc + external component URLs, and the supported version floor. |
| `lib/version-detect.ts`    | Pure diff of upstream tags against the catalog.                                                                                                   |
| `lib/release-name.ts`      | The `<project>-<version>` split, shared by packaging and promotion.                                                                               |
| `lib/output-layout.ts`     | Where each converted page lands, and the collision guard that keeps the tree platform-independent.                                                 |
| `lib/markdown-converter.ts`| Block-level conversion: walks the resolved Asciidoctor AST and emits Markdown. **All block conversion logic lives here.**                          |
| `lib/inline-html.ts`       | Inline-level conversion: the restricted HTML Asciidoctor returns for inline content → Markdown, including external component link rewriting.       |
| `lib/manifest.ts`          | `manifest.json` schema + builder, and the content checksum. Owns the public schema; changes require an ADR.                                       |
| `lib/catalog-update.ts`    | Pure `catalog.json` update — refuses to repoint an existing tag (releases are immutable).                                                          |
| `lib/release-state.ts`     | Pure decision of which release phases a re-run still owes.                                                                                        |
| `lib/notice.ts`            | Builds the per-release `NOTICE` attribution text, pinned to the upstream commit.                                                                   |
| `lib/antora-types.ts`      | Hand-written types for the Antora modules we call. `lib/antora.d.ts` maps them onto the untyped packages.                                          |

**Architecture rule**: Conversion rules in `lib/` are pure functions over an AST or a string. They do not perform I/O. I/O lives only in the top-level script entry points.

Conversion delegates page resolution — xrefs, includes, `include-code::`, `javadoc:`, `configprop:` — to Antora and Spring's own Asciidoctor extensions rather than reimplementing them; see [ADR-0002](./.please/docs/decisions/0002-antora-as-a-library.md) and `.please/docs/knowledge/upstream-antora.md`.

### `markdown/` _(empty until the first release)_

Output tree, organized as `markdown/<project>/<version>/`. Committed for diff-ability and direct GitHub browsing. **Not** the primary consumption surface — consumers fetch GitHub Release archives, not this directory.

Conversion writes to `dist/<project>-<version>/` (gitignored) and packaging reads from there; `promote-markdown.ts` copies a converted tree here, and `release.yml` runs it in the same pull request that records the release, so the committed tree only ever carries content a release actually carries. A promoted version is replaced wholesale, so a page deleted upstream disappears here too. Each version costs roughly 3 MB of repository history. The converted tree mirrors Antora's URL shape: the `ROOT` module at the tree root, every other module under its own directory, each page keeping its source path with `.adoc` → `.md`. The generated listing is `_index.md`: `INDEX.md` would collide with the `index.md` an upstream `index.adoc` produces on a case-insensitive filesystem.

### `.github/workflows/`

CI/CD. GitHub Actions only; no other CI vendor.

| Workflow                          | Trigger             | Role                                                                                            |
| --------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `ci.yml`                          | PR / push           | typecheck + lint + `validate-catalog` + test (with coverage + JUnit + optional Codecov)         |
| `matrix-build.yml`                | manual / weekly     | Build N projects × M versions in parallel; uploads archives as artifacts, publishes nothing     |
| `nightly-detect.yml`              | cron (daily)        | Poll upstream for new tags; open one issue per new GA release                                   |
| `release.yml`                     | tag push            | Publish archive + checksum + manifest to GitHub Releases, update `catalog.json` via PR; re-running a tag completes an interrupted release |

`.github/actions/build-release/` is a composite action holding the fetch → convert → package steps, so `matrix-build.yml` and `release.yml` cannot drift apart: what gets published is built by the steps the matrix build already exercised. `release.yml` rebuilds from the tag rather than promoting a matrix-build artifact.

### `catalog.json`

Committed JSON index. Schema-versioned (`"version": "1"`). Updated by `release.yml`, never edited by hand. Shape:

```jsonc
{
  "version": "1",
  "generated_at": "<ISO-8601>",
  "projects": {
    "<project>": {
      "<version>": { "tag": "<project>-<version>", "released_at": "<ISO-8601>" }
    }
  }
}
```

Consumers MUST resolve `(project, version) → tag` through this file, not by scraping the Releases page.

### `tests/`

Bun test suite.

| Path                          | Scope                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `tests/sanity.test.ts`        | Harness smoke test (proves Bun test + TypeScript strict mode are wired)              |
| `tests/unit/`                 | Per-module tests for the pure functions in `scripts/lib/*` — catalog schema and update, manifest and content checksum, notice, upstream sources, and the two conversion layers (`markdown-converter`, `inline-html`) |
| `tests/integration/`          | CLI contracts, and the fixture pipeline: fixture upstream tree → conversion → archive → checksum |
| `tests/fixtures/`             | `upstream-component/` — a minimal Antora component standing in for a fetched upstream tree |

The unit tests drive the converters over hand-built AST doubles and HTML strings; the integration test runs the real scripts as subprocesses over the fixture, which is the only place Antora and tar actually execute. Neither touches the network.

### `.please/`

Workflow artifacts for the `please` plugin (specs, plans, ADRs, knowledge files). Not part of the pipeline runtime; not shipped to consumers. See [`.please/INDEX.md`](./.please/INDEX.md) for the directory map.

### Root files

| File                   | Role                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| `README.md`            | Public-facing overview and consumption examples                                  |
| `LICENSE`              | Apache-2.0 for this repo's pipeline code                                         |
| `NOTICE`               | Upstream attribution surface (per-project copyright + source links)             |
| `CLAUDE.md`            | AI-assisted development instructions; pointer to project knowledge              |
| `catalog.json`         | The public index (see above)                                                    |
| `ARCHITECTURE.md`      | This file                                                                       |

## Data Flow

```
                  GitHub Actions
                  (nightly-detect.yml)
                          │
                          │ new upstream tag detected
                          ▼
    ┌─────────────────────┴─────────────────────┐
    │                                           │
  github.com/spring-projects/<repo>:<tag>   Maven Central
  (sparse checkout of the docs subtree)     <artifact>-<version>-<classifier>.zip
    │                                           │
    │  the authored AsciiDoc component          │  the generated half: the resolved
    │                                           │  antora.yml + sample source tree
    └─────────────────────┬─────────────────────┘
                          │ merge, promote modules/antora.yml,
                          │ commit as a self-contained git repo
                          │ scripts/fetch-upstream.ts
                          ▼
        dist/upstream/<project>-<version>/        + <project>-<version>.upstream.json
          antora.yml, modules/**                    (provenance: commit, archive classifiers)
                          │
                          │ aggregate → classify → load each page
                          │ (Antora modules + Spring's Asciidoctor
                          │  extensions resolve xref/include/javadoc)
                          │ scripts/convert.ts
                          ▼
                  resolved Asciidoctor AST
                          │
                          │ pure AST walk + inline HTML pass
                          │ scripts/lib/markdown-converter.ts
                          │ scripts/lib/inline-html.ts
                          ▼
        dist/<project>-<version>/**.md + _index.md
                          │
                          │ tar.gz + sha256 + manifest.json + NOTICE
                          │ scripts/package-release.ts
                          ▼
        releases/<project>-<version>.tar.gz     (entries under <project>-<version>/)
        releases/<project>-<version>.tar.gz.sha256
        releases/manifest.json
                          │
                          │ gh release upload
                          │ .github/workflows/release.yml
                          ▼
        GitHub Release: tag = <project>-<version>
                          │
                          │ update + commit + PR
                          │ scripts/update-catalog.ts
                          │ scripts/promote-markdown.ts
                          ▼
              catalog.json + markdown/<project>/<version>/
                          │
                          ▼
                    Consumers
        (@pleaseai/spring, Cursor, Continue, RAG, ...)
```

Both upstream halves are required. The checked-out `antora.yml` is a build-time stub; only the published archive carries the resolved attributes (dependency versions, javadoc locations) and the sample sources that `include-code::` reads, so fetching without it produces pages that convert cleanly while silently losing every included snippet.

**This makes buildability a property of upstream's publishing, not of the converter.** Spring publishes `spring-boot-docs` to Maven Central for 2.2.x-2.4.2 and then not again until 4.0.8, so 4.0.0-4.0.7 and 4.1.0 are tagged releases that can never be built here. `detect-upstream-versions.ts` checks each candidate's archives before reporting it, so the nightly workflow does not file issues for versions nobody can build.


**Determinism guarantee**: Same upstream commit + same `scripts/` SHA = byte-identical Markdown output and identical archive checksum. This is the load-bearing property of the entire system.

## Architecture Invariants

These constraints must hold; violating them is a regression, not a style preference.

### Content Invariants

- **Meaning is preserved.** Conversion is mechanical (format only). Never paraphrase, summarize, or "improve" upstream prose.
- **Determinism.** Same upstream commit → same output bytes. No timestamps, run IDs, or environment metadata in converted content. Those live only in `manifest.json`.
- **Line endings**: LF only.
- **No silent fallbacks.** If a conversion rule encounters unhandled AsciiDoc, fail loudly. Add a rule; do not paper over.

### Release Invariants

- **Tags are immutable.** Once `<project>-<version>` is published, the tag is never deleted or moved. Rebuilds get a suffix (`+rebuild.1`); `catalog.json` redirects consumers to the latest.
- **Every archive ships with `NOTICE`.** Apache-2.0 attribution to the upstream repo, pinned to commit.
- **Every archive ships with `manifest.json`.** Contains upstream `(repo, ref, commit)`, converter version, file count, and content checksum.
- **`catalog.json` is the single source of truth** for `(project, version) → tag` resolution.
- **A failed release does not update `catalog.json`.** Publication and registration are two
  phases, and a run that completes the first but not the second is finished by re-running the
  tag: the run completes only the phases still outstanding, and registers an already-published
  archive only after a rebuild reproduces its bytes. See ADR-0003.

### Code Invariants

- **TypeScript strict mode, no exceptions.** `strict: true`, `noUncheckedIndexedAccess: true`.
- **ESM only.** No CommonJS interop in new code.
- **Zero lint warnings on `main`.** Warnings are errors.
- **Conversion rules are pure.** No I/O anywhere in `scripts/lib/`. I/O happens only in the script entry points.
- **No submodules.** Use sparse checkout. Submodules are an operational footgun.
- **No new runtime dependencies beyond Bun + the AsciiDoc parser.** Adding a runtime dep requires an ADR.

### Distribution Invariants

- **GitHub Releases is the only distribution channel** for converted content. No alternate CDN, no npm package, no Docker image carrying the Markdown.
- **No web UI.** `markdown/` is browsable on GitHub for diff-ability only; we do not host a docs site.
- **No relicensing.** Generated content stays Apache-2.0 with upstream attribution.
- **No pre-release versions.** Only GA versions of upstream projects are built.

## Cross-Cutting Concerns

### Error Handling

- Conversion errors include the **upstream file path and line number** when known.
- Pipeline failures exit with non-zero status and a one-line summary on stdout; detailed diagnostics on stderr.
- CI jobs surface failed `(project, version)` pairs as annotated workflow output; one failed cell does not block its siblings in the build matrix.
- A failed release does **not** update `catalog.json`. Recovery is forward, not a rollback: re-running the tag completes whichever phase is missing (ADR-0003). A published archive is never replaced — corrections ship as a `+rebuild.N` tag.

### Logging & Observability

- Scripts print a one-line summary on success — e.g., `Converted 142 files to dist/spring-framework-6.2.0/`.
- Long operations stream progress per-project, per-version.
- Workflow runs are the audit log. There is no external metrics pipeline.

### Testing

| Layer        | What                                                                  | Where                                       |
| ------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| Unit         | One test per conversion rule (input AsciiDoc → expected Markdown)     | `tests/unit/antora-rules/*.test.ts`         |
| Schema       | `manifest.json` round-trips schema validation                         | `tests/unit/manifest.test.ts`               |
| Integration  | Fixture upstream tree → full archive → checksum verification          | `tests/integration/*.test.ts`               |
| Determinism  | Same fixture run twice produces byte-identical output                 | `tests/integration/determinism.test.ts`     |

Coverage target: **>80% for new code**. Coverage is informational; the load-bearing quality signal is the conversion-output validation suite (link check, schema check, size sanity).

### Configuration

- **Coverage window** (which versions per project to build) lives in `.github/workflows/matrix-build.yml`.
- **Conversion rules** live in `scripts/lib/antora-rules.ts`. There is no external rule configuration file.
- **No environment variables** beyond `GITHUB_TOKEN` (for `gh` CLI) and standard CI vars.

### Security & Supply Chain

- **No secrets in the repo.** GitHub Actions tokens only.
- **No user input.** All input is sourced from public upstream Git tags.
- **Dependencies** are pinned via `bun.lock`, and GitHub Actions are pinned by commit SHA. Renovate manages updates ([`renovate.json`](./renovate.json)); the conversion toolchain is held behind dashboard approval because an Antora or Asciidoctor bump is a conversion change, not a dependency bump. Upstream Spring tag detection is **not** Renovate's responsibility — it is handled by `nightly-detect.yml`.

### License Compliance

- Every generated archive includes a `NOTICE` file with upstream attribution.
- [`LICENSE`](./LICENSE) (Apache-2.0) covers this repo's pipeline code; generated content retains the upstream Apache-2.0 license, unmodified in meaning.
- See [`NOTICE`](./NOTICE) for the per-project attribution surface.

### Versioning (the pipeline's own code)

- The conversion toolchain (`scripts/`, workflows) is versioned via its own tag namespace (e.g., `tooling-v*`) — **distinct** from per-content tags like `framework-6.2.0`.
- Finalization deferred to an early ADR.

## What This Is NOT

Easier to misclassify than to classify. Each line corresponds to a real "wait, why doesn't it…" question.

- **Not a plugin.** No slash commands, no Claude Code integration. That lives in [`@pleaseai/spring`](https://github.com/pleaseai/spring).
- **Not a fork.** Content meaning is unchanged. Only format and packaging differ.
- **Not a hosted docs site.** No web UI; `markdown/` exists for diff-ability, not browsing.
- **Not a RAG service.** We produce inputs for RAG indexes; we do not run one.
- **Not a Spring runtime.** No Spring code; no JVM in CI for content builds.
- **Not stateful.** No database, no cache, no server process. Each CI job is self-contained.
- **Not a relicensing surface.** Upstream Apache-2.0 stays as-is; we add `NOTICE`, we never strip it.

## Related Documents

- [`README.md`](./README.md) — Public-facing project overview and consumption examples
- [`NOTICE`](./NOTICE) — Upstream attribution surface
- [`.please/docs/knowledge/product.md`](./.please/docs/knowledge/product.md) — Vision, mission, target users, scope
- [`.please/docs/knowledge/tech-stack.md`](./.please/docs/knowledge/tech-stack.md) — Technology choices with rationale
- [`.please/docs/knowledge/product-guidelines.md`](./.please/docs/knowledge/product-guidelines.md) — Content conversion principles, code style
- [`.please/docs/knowledge/workflow.md`](./.please/docs/knowledge/workflow.md) — TDD workflow, quality gates, commit conventions
- [`.please/docs/decisions/`](./.please/docs/decisions/) — Architecture Decision Records (ADR)
- [`CLAUDE.md`](./CLAUDE.md) — AI-assisted development instructions

---

**Updates**: When the intended architecture changes — new modules, removed invariants, new entry points — update this file in the same PR that introduces the change. Architecture drift in this file is itself a defect.
