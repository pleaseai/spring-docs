# @pleaseai/spring-docs

> Pre-converted, version-pinned Spring documentation in Markdown — distributed as GitHub Release archives.

This repository hosts LLM-friendly Markdown versions of the Spring ecosystem reference docs (Framework, Boot, Security, Data, Cloud, etc.) generated from upstream AsciiDoc sources. Each `(project, version)` pair is published as a separate GitHub Release so consumers can fetch exactly the docs that match their project's dependencies.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)
[![Upstream](https://img.shields.io/badge/upstream-Apache--2.0-green)](./NOTICE)

> **Status**: the pipeline is implemented and proven end to end on Spring Boot 4.1.1, but nothing has been published yet — `catalog.json` is empty and there are no releases. The formats below are the contract the pipeline produces; the examples are illustrative until the first release lands.

## What this is

A **content repository** that decouples document generation from any specific consumer. The primary consumer today is [`@pleaseai/spring`](https://github.com/pleaseai/spring), a Claude Code plugin that installs these docs as auto-loaded skills — but the Markdown here is tool-agnostic and reusable by any LLM-facing workflow (RAG indexes, Cursor rules, Continue prompts, internal chatbots, etc.).

## What this is NOT

- **Not a plugin.** No slash commands, no install hooks, no Claude Code integration. That lives in `@pleaseai/spring`.
- **Not a fork.** Upstream content is unchanged in meaning. Only the format (AsciiDoc/HTML → Markdown) and packaging differ.
- **Not a relicense.** Generated artifacts retain Spring's upstream Apache-2.0 license; see [`NOTICE`](./NOTICE).

## Why a separate repository

| Concern | Result of splitting |
|---|---|
| Plugin repo stays code-only | `pleaseai/spring` clone is small (~1 MB) instead of growing with every Spring release |
| Independent release cadence | Docs can be regenerated when upstream Spring publishes, without bumping the plugin |
| Tool-agnostic distribution | Cursor, Continue, RAG indexers, future plugins reuse the same artifacts |
| Conversion pipeline isolation | Antora/AsciiDoc machinery and its CI live where the content does |
| Cleaner licensing surface | Apache-2.0 attribution / NOTICE lives next to the redistributed content |

The decision is recorded in `pleaseai/spring`'s [`ADR-0002 — Docs hosted in separate repository`](https://github.com/pleaseai/spring/blob/main/.please/docs/decisions/0002-docs-repo-split.md) _(forthcoming)_.

## Repository layout

```
pleaseai/spring-docs/
├── README.md                    ← This file
├── LICENSE                      ← Apache-2.0 (this repo's code/config)
├── NOTICE                       ← Upstream attribution for redistributed docs
├── catalog.json                 ← Master index: project × version → release tag
├── markdown/                    ← Generated content, organized by project/version
│   ├── boot/
│   │   └── 4.1.1/
│   └── framework/
│       └── 6.2.0/
├── scripts/                     ← Conversion pipeline
│   ├── fetch-upstream.ts        ← Sparse checkout + published content archives
│   ├── convert.ts               ← AsciiDoc/Antora → Markdown
│   ├── package-release.ts       ← Build tar.gz + manifest + checksum
│   ├── promote-markdown.ts      ← Copy a converted tree into markdown/
│   ├── update-catalog.ts        ← Record a published release in catalog.json
│   ├── detect-upstream-versions.ts  ← GA versions the catalog does not carry yet
│   └── lib/
│       ├── markdown-converter.ts    ← Block conversion (Asciidoctor AST → Markdown)
│       ├── inline-html.ts           ← Inline conversion
│       ├── upstream-sources.ts      ← Per-project upstream coordinates
│       └── manifest.ts              ← Release manifest schema
└── .github/
    ├── actions/build-release/   ← fetch → convert → package, shared by both builds
    └── workflows/
        ├── ci.yml               ← typecheck + lint + test on every PR
        ├── matrix-build.yml     ← Build N projects × M versions in parallel
        ├── nightly-detect.yml   ← Poll upstream for new releases
        └── release.yml          ← Publish artifacts to GitHub Releases
```

`markdown/` is committed for diff-ability and direct browsing. Final consumption is via GitHub Release archives (below), not by cloning this repo.

## Release format

Each `(project, version)` pair gets its own tag and Release.

**Tag scheme**: `<project>-<version>` — or `<project>-<version>+rebuild.N` when an archive has to be corrected, since a published tag is never moved.

| Tag | Assets |
|---|---|
| `boot-4.1.1` | `boot-4.1.1.tar.gz`<br>`boot-4.1.1.tar.gz.sha256`<br>`manifest.json` |
| `framework-6.2.0` | `framework-6.2.0.tar.gz` + checksum + manifest |

### Archive contents

Every entry sits under one `<project>-<version>/` directory, so extraction never spills into the working directory.

```
boot-4.1.1/
├── NOTICE                       ← Upstream attribution, pinned to the commit
├── _index.md                    ← Table of contents
├── index.md                     ← The component's own pages, at the tree root
├── how-to/
├── appendix/
└── cli/                         ← One directory per non-ROOT Antora module
```

`manifest.json` is a release asset, not an archive entry: it describes the archive, so it has to be readable without downloading it.

The listing is `_index.md` rather than `INDEX.md` because upstream components ship their own `index.adoc`, and the two names collide on case-insensitive filesystems.

### `manifest.json` schema

```json
{
  "schema_version": "1",
  "project": "boot",
  "version": "4.1.1",
  "upstream": {
    "repo": "spring-projects/spring-boot",
    "ref": "v4.1.1",
    "commit": "6fdf67ea1552691e932604d4bf67a5e08ff0b0ea",
    "archives": ["root-aggregate-content"]
  },
  "converter": {
    "commit": "<this repo's commit, or null if built from a dirty tree>",
    "antora": "3.2.0",
    "asciidoctor": "2.2.8"
  },
  "generated_at": "2026-09-11T08:21:54.515Z",
  "file_count": 248,
  "content_sha256": "<sha256 over the converted tree>"
}
```

`content_sha256` digests the sorted `(path, sha256)` pairs of the tree, so it identifies the content independently of how it was packaged. `generated_at` is the only non-deterministic field, which is why it lives here and never in the content.

## How to consume

### Direct download

```bash
base=https://github.com/pleaseai/spring-docs/releases/download/boot-4.1.1
curl -LO "$base/boot-4.1.1.tar.gz"
curl -LO "$base/boot-4.1.1.tar.gz.sha256"
sha256sum --check boot-4.1.1.tar.gz.sha256
tar xzf boot-4.1.1.tar.gz        # extracts into boot-4.1.1/
```

### Via the `@pleaseai/spring` plugin

```
/spring:install
```

The plugin reads your `build.gradle` / `pom.xml`, resolves matching versions via the Spring Boot BOM, and downloads the relevant archives automatically.

### Via the GitHub API

```bash
gh release view boot-4.1.1 --repo pleaseai/spring-docs --json assets
```

### Manifest lookup

`catalog.json` at the repo root is the authoritative index:

```jsonc
{
  // Catalog schema version; consumers must refuse to parse a mismatch.
  "version": "1",
  "generated_at": "2026-09-11T08:21:54Z",
  "projects": {
    "boot": {
      "4.1.1": { "tag": "boot-4.1.1", "released_at": "2026-09-11T08:30:00Z" }
    },
    "framework": {
      "6.2.0": { "tag": "framework-6.2.0", "released_at": null }
    }
  }
}
```

`released_at` is `null` while a tag exists but its release has not been published.

Consumers should prefer `catalog.json` over scraping the Releases page — it's compact, cacheable, and pinned to commits.

## Generation pipeline

1. **Detect new upstream release** — `nightly-detect.yml` runs `detect-upstream-versions.ts`, which diffs upstream's tags against `catalog.json` and files one issue per missing GA version. It builds nothing: a new upstream line can change the documentation layout, so a human decides.
2. **Fetch** — `fetch-upstream.ts` acquires two halves and merges them into one Antora content source: a sparse checkout of the docs subtree at the release tag, and the content archive Spring publishes to Maven Central. Only the archive carries the resolved `antora.yml` attributes and the sample sources `include-code::` reads, so the checkout alone would convert cleanly while silently losing every included snippet. No submodules, no Gradle, no JVM.
3. **Convert** — `convert.ts` drives Antora's own pipeline modules with Spring's Asciidoctor extensions registered, so `xref:`, `include::`, `include-code::`, `javadoc:` and `configprop:` are resolved by the same code that produces docs.spring.io. Our converter then emits Markdown from the resolved AST: GFM alerts for admonitions, headed code fences for tab groups, relative `.md` links for internal xrefs, absolute `docs.spring.io` URLs for references into components we do not build. An unhandled construct fails the build rather than being dropped.
4. **Package** — `package-release.ts` writes `NOTICE`, checksums every file, and builds a reproducible `tar.gz`: entries sorted, timestamps and ownership pinned, gzip's mtime field suppressed. The same converted tree always yields byte-identical bytes.
5. **Release** — a `<project>-<version>` tag push runs `release.yml`, which rebuilds from the tag, verifies the manifest against it, and publishes the archive, its checksum and the manifest.
6. **Record** — only after the release exists, `catalog.json` and `markdown/<project>/<version>/` are updated in a pull request. A failed release leaves the catalog untouched.

The pipeline is matrix-parallelized: typical full ecosystem rebuild (~10 projects × 5 versions = 50 jobs) runs in under 15 minutes on free-tier runners.

## Versioning policy

| Aspect | Policy |
|---|---|
| **Tag immutability** | Once a `<project>-<version>` tag is published, it is not deleted. Re-generation creates a new tag suffix (`framework-6.2.0+rebuild.1`) and updates `catalog.json` to point at the latest |
| **Pre-release versions** | Not built. Only GA versions of upstream projects |
| **EOL versions** | Buildable only while upstream still publishes that version's documentation archive to Maven Central. For Spring Boot that is 4.0.8 onwards: the `spring-boot-docs` artifact was published for 2.2.x-2.4.2, then not again until 4.0.8, so 4.0.0-4.0.7 and 4.1.0 cannot be built at all |
| **Coverage window** | The newest N missing GA versions per project, N being the `limit` input of `matrix-build.yml` (default 3) |
| **Backfill** | Older versions can be requested via issue and built on-demand |

## Local development

```bash
git clone https://github.com/pleaseai/spring-docs
cd spring-docs
bun install

# What upstream has released that the catalog does not carry
bun run scripts/detect-upstream-versions.ts

# Build one (project, version) locally
bun run scripts/fetch-upstream.ts boot 4.1.1 --out dist/upstream
bun run scripts/convert.ts dist/upstream/boot-4.1.1 --project boot --version 4.1.1 --out dist --strict
bun run scripts/package-release.ts dist/boot-4.1.1 --out releases

# Inspect output
ls dist/boot-4.1.1/
tar -tzf releases/boot-4.1.1.tar.gz | head
```

### Toolchain

Same setup as the rest of the `@pleaseai/*` ecosystem:

```bash
bun install         # dev deps
bun run typecheck   # tsc --noEmit
bun run lint        # @pleaseai/eslint-config (eslint --max-warnings 0)
bun test            # Bun test runner
```

Pre-commit: Husky + `lint-staged` runs `eslint --fix` on staged files. Same checks gate every PR via `.github/workflows/ci.yml`.

## Contributing

Issues and PRs welcome. Common contribution patterns:

- **Conversion fixes** — Found a rendering issue in a generated Markdown file? Open an issue with the upstream URL and the converted output side-by-side. Fixes go in `scripts/lib/markdown-converter.ts` (block structure) or `scripts/lib/inline-html.ts` (inline markup), and require regenerating the affected releases under a `+rebuild.N` tag.
- **Add a project** — Want docs for `spring-batch`, `spring-integration`, etc.? Open an issue. Adding a project requires its repo to use Antora and have stable doc structure across versions.
- **Backfill a version** — Need an older Spring version that we haven't built? Open an issue with the project+version; we'll trigger a one-off build.

## Licensing

### This repository's code

The conversion pipeline (`scripts/`, `.github/workflows/`, schemas) is licensed under **Apache-2.0**. See [`LICENSE`](./LICENSE).

### Generated Markdown content

Every archive carries a `NOTICE` file reproducing Spring's upstream license (Apache-2.0) and attributing the source project. We do not relicense documentation content; we only change format.

If you are a Spring maintainer and have concerns about how documentation is mirrored here, please open an issue — we want to remain a good downstream citizen.

## Related projects

- [`@pleaseai/spring`](https://github.com/pleaseai/spring) — Claude Code plugin that consumes these archives
- [`@pleaseai/ask`](https://github.com/pleaseai/ask) — Generic library docs for Claude Code (npm, pypi, github, pub)
- Upstream: [`spring-projects/spring-framework`](https://github.com/spring-projects/spring-framework), [`spring-boot`](https://github.com/spring-projects/spring-boot), [`spring-security`](https://github.com/spring-projects/spring-security), etc.

---

Maintained by [Passion Factory](https://passionfactory.ai) as part of the Please Tools ecosystem.
