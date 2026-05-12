# @pleaseai/spring-docs

> Pre-converted, version-pinned Spring documentation in Markdown — distributed as GitHub Release archives.

This repository hosts LLM-friendly Markdown versions of the Spring ecosystem reference docs (Framework, Boot, Security, Data, Cloud, etc.) generated from upstream AsciiDoc sources. Each `(project, version)` pair is published as a separate GitHub Release so consumers can fetch exactly the docs that match their project's dependencies.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)
[![Upstream](https://img.shields.io/badge/upstream-Apache--2.0-green)](./NOTICE)

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
│   ├── framework/
│   │   ├── 6.1.5/
│   │   └── 6.2.0/
│   ├── boot/
│   │   ├── 3.3.4/
│   │   └── 3.4.0/
│   ├── security/
│   ├── data-jpa/
│   └── cloud/
├── scripts/                     ← Conversion pipeline
│   ├── fetch-upstream.ts        ← Sparse-checkout one (project, tag) pair
│   ├── convert.ts               ← AsciiDoc/Antora → Markdown
│   ├── package-release.ts       ← Build tar.gz + manifest + checksum
│   └── lib/
│       ├── antora-rules.ts      ← Antora-specific conversion rules
│       └── manifest.ts          ← Release manifest schema
└── .github/workflows/
    ├── matrix-build.yml         ← Build N projects × M versions in parallel
    ├── nightly-detect.yml       ← Poll upstream for new releases
    └── release.yml              ← Publish artifacts to GitHub Releases
```

`markdown/` is committed for diff-ability and direct browsing. Final consumption is via GitHub Release archives (below), not by cloning this repo.

## Release format

Each `(project, version)` pair gets its own tag and Release.

**Tag scheme**: `<project>-<version>`

| Tag | Asset(s) |
|---|---|
| `framework-6.2.0` | `spring-framework-6.2.0.tar.gz`<br>`spring-framework-6.2.0.tar.gz.sha256`<br>`manifest.json` |
| `boot-3.4.0` | `spring-boot-3.4.0.tar.gz` + hash + manifest |
| `security-6.4.0` | `spring-security-6.4.0.tar.gz` + hash + manifest |

### Archive contents

```
spring-framework-6.2.0/
├── manifest.json                ← Metadata (see below)
├── NOTICE                       ← Upstream attribution
├── INDEX.md                     ← Table of contents
└── references/
    ├── core/
    ├── web/
    ├── data-access/
    └── ...
```

### `manifest.json` schema

```json
{
  "project": "spring-framework",
  "version": "6.2.0",
  "upstream": {
    "repo": "spring-projects/spring-framework",
    "ref": "v6.2.0",
    "commit": "<sha>"
  },
  "format": {
    "source": "asciidoc",
    "target": "markdown",
    "converter": "@pleaseai/spring-docs@<this-repo-sha>"
  },
  "generated_at": "2026-05-12T03:14:15Z",
  "files": 142,
  "checksum": "sha256:..."
}
```

## How to consume

### Direct download

```bash
curl -L -o framework-6.2.0.tar.gz \
  https://github.com/pleaseai/spring-docs/releases/download/framework-6.2.0/spring-framework-6.2.0.tar.gz
tar xzf framework-6.2.0.tar.gz
```

### Via the `@pleaseai/spring` plugin

```
/spring:install
```

The plugin reads your `build.gradle` / `pom.xml`, resolves matching versions via the Spring Boot BOM, and downloads the relevant archives automatically.

### Via the GitHub API

```bash
gh release view framework-6.2.0 --repo pleaseai/spring-docs --json assets
```

### Manifest lookup

`catalog.json` at the repo root is the authoritative index:

```jsonc
{
  "framework": {
    "6.1.5": { "tag": "framework-6.1.5", "released_at": "..." },
    "6.2.0": { "tag": "framework-6.2.0", "released_at": "..." }
  },
  "boot": {
    "3.3.4": { "tag": "boot-3.3.4", "released_at": "..." },
    "3.4.0": { "tag": "boot-3.4.0", "released_at": "..." }
  }
}
```

Consumers should prefer `catalog.json` over scraping the Releases page — it's compact, cacheable, and pinned to commits.

## Generation pipeline

1. **Detect new upstream release** — `nightly-detect.yml` polls `spring-projects/*` for new tags (via GitHub API).
2. **Sparse checkout** — For each new tag, clone *only* the docs directory (`framework-docs/modules/ROOT/pages/**`) using `--depth 1 --filter=blob:none --sparse`. No submodules.
3. **Convert** — AsciiDoc → Markdown with Antora-aware rules:
   - `xref:` → relative Markdown links
   - `include::` → inline expansion
   - Admonitions (`[NOTE]`, `[TIP]`, `[WARNING]`) → GFM admonition syntax (`> [!NOTE]`)
   - Tab blocks (Gradle/Maven/Kotlin DSL) → headed code-fence groups
   - Attribute substitution → resolved literal values
4. **Validate** — Markdown link check, frontmatter schema check, size sanity check.
5. **Package** — tar.gz + sha256 + manifest.
6. **Release** — Publish to GitHub Releases, update `catalog.json` via PR.

The pipeline is matrix-parallelized: typical full ecosystem rebuild (~10 projects × 5 versions = 50 jobs) runs in under 15 minutes on free-tier runners.

## Versioning policy

| Aspect | Policy |
|---|---|
| **Tag immutability** | Once a `<project>-<version>` tag is published, it is not deleted. Re-generation creates a new tag suffix (`framework-6.2.0+rebuild.1`) and updates `catalog.json` to point at the latest |
| **Pre-release versions** | Not built. Only GA versions of upstream projects |
| **EOL versions** | Built as long as upstream sources remain reachable |
| **Coverage window** | Latest two minor lines per project (configurable in `.github/workflows/matrix-build.yml`) |
| **Backfill** | Older versions can be requested via issue and built on-demand |

## Local development

```bash
git clone https://github.com/pleaseai/spring-docs
cd spring-docs
bun install

# Build one (project, version) locally
bun run scripts/fetch-upstream.ts spring-framework v6.2.0 --out /tmp/spring-fw
bun run scripts/convert.ts /tmp/spring-fw --project framework --version 6.2.0 --out dist/

# Inspect output
ls dist/spring-framework-6.2.0/
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

- **Conversion fixes** — Found a rendering issue in a generated Markdown file? Open an issue with the upstream URL and the converted output side-by-side. Fixes go in `scripts/lib/antora-rules.ts` and require regenerating the affected releases.
- **Add a project** — Want docs for `spring-batch`, `spring-integration`, etc.? Open an issue. Adding a project requires its repo to use Antora and have stable doc structure across versions.
- **Backfill a version** — Need an older Spring version that we haven't built? Open an issue with the project+version; we'll trigger a one-off build.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow.

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
