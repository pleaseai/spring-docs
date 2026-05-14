# Architecture

> Bird's-eye view of `@pleaseai/spring-docs` — how the conversion pipeline is structured, where to start reading code, and which constraints must hold.
>
> **Audience**: Contributors implementing or reviewing pipeline changes. For *what this project is* and *how to consume artifacts*, see [`README.md`](./README.md).
>
> **Status**: This document describes the **intended architecture**. Sections marked _(Planned)_ are not yet implemented; the canonical source of intent until they are is this file plus `.please/docs/knowledge/`.

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
| `scripts/fetch-upstream.ts` _(Planned)_                  | Pipeline entry — sparse-checkout one upstream `(project, tag)` pair                                 |
| `scripts/convert.ts` _(Planned)_                         | Pipeline entry — AsciiDoc/Antora → Markdown conversion                                              |
| `scripts/package-release.ts` _(Planned)_                 | Pipeline entry — produce `tar.gz` + `manifest.json` + SHA-256 checksum                              |
| `.github/workflows/matrix-build.yml` _(Planned)_         | CI entry — orchestrates N projects × M versions in parallel                                         |

## Code Map

Top-level layout, in implementation order (top to bottom = fetch → convert → publish):

### `scripts/` _(Planned)_

Conversion pipeline. Each top-level file is an executable Bun/TypeScript script with a clearly defined input → output. Pure logic lives in `scripts/lib/`.

| File                       | Role                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `fetch-upstream.ts`        | Sparse-checkout one upstream Spring repo at a given tag. Writes only the docs subtree to `--out`. No submodules.                    |
| `convert.ts`               | AsciiDoc/Antora → Markdown. Reads a fetched upstream tree, applies conversion rules, writes a versioned Markdown tree.              |
| `package-release.ts`       | Tar+gzip a Markdown tree, generate `manifest.json`, produce SHA-256 checksum.                                                       |
| `lib/antora-rules.ts`      | Centralized conversion rules (xref, include, admonitions, tab blocks, attribute substitution). **All conversion logic lives here.** |
| `lib/manifest.ts`          | `manifest.json` schema + builder. Owns the public schema; changes require an ADR.                                                   |

**Architecture rule**: Conversion rules in `lib/` are pure functions over an AST or token stream. They do not perform I/O. I/O lives only in the top-level script entry points.

### `markdown/` _(Planned, generated, committed)_

Output tree, organized as `markdown/<project>/<version>/`. Committed for diff-ability and direct GitHub browsing. **Not** the primary consumption surface — consumers fetch GitHub Release archives, not this directory.

### `.github/workflows/` _(Planned)_

CI/CD. GitHub Actions only; no other CI vendor.

| Workflow             | Trigger             | Role                                                                                            |
| -------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `ci.yml`             | PR / push           | typecheck + lint + test                                                                         |
| `matrix-build.yml`   | manual / scheduled  | Build N projects × M versions in parallel                                                       |
| `nightly-detect.yml` | cron (daily)        | Poll upstream for new tags; open issues for new GA releases                                     |
| `release.yml`        | tag push            | Publish archive + checksum + manifest to GitHub Releases, update `catalog.json` via PR          |

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

### `tests/` _(Planned)_

Bun test suite.

| Path                  | Scope                                                                                |
| --------------------- | ------------------------------------------------------------------------------------ |
| `tests/unit/`         | Per-rule tests for `scripts/lib/antora-rules.ts` (input AsciiDoc → expected Markdown) |
| `tests/integration/`  | Fixture upstream tree → full archive → checksum verification                          |
| `tests/fixtures/`     | Minimal upstream-shaped trees for deterministic tests                                 |

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
        upstream/spring-projects/<repo>:<tag>
                          │
                          │ sparse checkout
                          │ scripts/fetch-upstream.ts
                          ▼
        <upstream-out>/<repo>/<tag>/docs/**.adoc
                          │
                          │ AST walk + rules
                          │ scripts/convert.ts
                          │ scripts/lib/antora-rules.ts
                          ▼
        dist/<project>-<version>/**.md + INDEX.md
                          │
                          │ tar.gz + sha256 + manifest.json
                          │ scripts/package-release.ts
                          ▼
        <project>-<version>.tar.gz
        <project>-<version>.tar.gz.sha256
        manifest.json
                          │
                          │ gh release upload
                          │ .github/workflows/release.yml
                          ▼
        GitHub Release: tag = <project>-<version>
                          │
                          │ update + commit + PR
                          ▼
                    catalog.json
                          │
                          ▼
                    Consumers
        (@pleaseai/spring, Cursor, Continue, RAG, ...)
```

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
- **A failed release does not update `catalog.json`.** Partial state is rolled back.

### Code Invariants

- **TypeScript strict mode, no exceptions.** `strict: true`, `noUncheckedIndexedAccess: true`.
- **ESM only.** No CommonJS interop in new code.
- **Zero lint warnings on `main`.** Warnings are errors.
- **Conversion rules are pure.** No I/O inside `scripts/lib/antora-rules.ts`. I/O happens only in the script entry points.
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
- A failed release does **not** update `catalog.json`. Either the archive is published and the index is updated, or nothing changes.

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
- **Dependencies** are pinned via `bun.lockb`. Renovate / Dependabot manages updates _(config Planned)_. Upstream Spring tag detection is **not** Renovate's responsibility — it is handled by `nightly-detect.yml`.

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
