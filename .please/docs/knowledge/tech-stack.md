# Tech Stack — @pleaseai/spring-docs

> Technology choices with rationale. Aligned with the rest of the `@pleaseai/*` ecosystem.

## Runtime & Language

### Bun (1.x)

Primary JavaScript/TypeScript runtime for all scripts, tests, and tooling.

**Why Bun**:
- Native TypeScript execution — no separate transpile step for scripts.
- Single binary replaces Node + npm + ts-node + Vitest + tsx.
- Built-in test runner (`bun test`) with Jest-compatible API.
- Fast install (`bun install`), fast startup, friendly DX for CLI-style scripts.
- Used across `@pleaseai/spring`, `@pleaseai/ask`, etc. — consistency across the ecosystem.

**Constraints**:
- ESM only. No CommonJS interop in new code.
- Avoid Bun-only APIs in code that might run in CI third-party actions; prefer `node:fs/promises` and `node:path` where possible for portability.

### TypeScript (5.x, strict mode)

All conversion pipeline code is TypeScript.

**Configuration baseline**:
```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "noEmit": true
  }
}
```

**Why**: Catch conversion-rule bugs at compile time rather than during a 15-minute matrix build. `noUncheckedIndexedAccess` is non-negotiable for parser code.

## Code Quality

### ESLint (`@pleaseai/eslint-config`)

Shared ESLint config from the `@pleaseai/*` ecosystem.

```bash
bun run lint   # eslint --max-warnings 0
```

**Policy**: Zero warnings on the main branch. Warnings are errors.

### Husky + lint-staged

Pre-commit hook runs `eslint --fix` on staged files only.

**Why**: Catch style issues before they reach CI; keep diffs clean; reviewers focus on logic.

### Type Check

```bash
bun run typecheck   # tsc --noEmit
```

Gates every PR via `.github/workflows/ci.yml`. Type errors block merge.

## Testing

### Bun test runner

```bash
bun test
```

**Why Bun test**: Jest-compatible API, zero-config, runs natively without a transpile step. Sufficient for the script-and-rules surface area of this repo.

**Scope**:
- Unit tests for conversion rules (`antora-rules.ts`): input AsciiDoc fragment → expected Markdown.
- Schema tests for `manifest.json` (zod or similar).
- Integration tests for `fetch-upstream.ts` and `convert.ts` against fixtures in `tests/fixtures/`.

## Content Conversion

### Antora / AsciiDoc Toolchain

Used by `scripts/convert.ts` to transform upstream Spring docs.

**Input**: `framework-docs/modules/ROOT/pages/**/*.adoc` (Antora module structure)

**Conversion rules** (centralized in `scripts/lib/antora-rules.ts`):

| AsciiDoc construct | Markdown output |
|---|---|
| `xref:path[text]` | `[text](relative/path.md)` |
| `include::partial$file.adoc[]` | Inline expansion of file contents |
| `[NOTE]` / `[TIP]` / `[WARNING]` blocks | GFM admonitions (`> [!NOTE]`) |
| Tab blocks (Gradle / Maven / Kotlin DSL) | Headed code-fence groups (`### Gradle` + ` ```kotlin`) |
| Attribute substitution (`{spring-version}`) | Resolved literal values from the upstream tag |

Conversion implementation may use a library (e.g., Asciidoctor.js) for parsing, then a custom Markdown emitter — or a direct AST-walking converter. Decision deferred to the implementation track.

### Upstream Fetching

`scripts/fetch-upstream.ts` uses **sparse checkout** to pull only the docs directory:

```bash
git clone --depth 1 --filter=blob:none --sparse <upstream-repo>
git sparse-checkout set framework-docs/modules/ROOT/pages
```

**Why**: Avoid downloading multi-GB Spring repos when we only need the docs subtree. No submodules — they are an operational footgun.

## Packaging & Distribution

### Archive Format

`tar.gz` + SHA-256 checksum + `manifest.json`.

```
spring-framework-6.2.0.tar.gz
spring-framework-6.2.0.tar.gz.sha256
manifest.json
```

### `manifest.json` Schema

Pinned per archive. Contains upstream `(repo, ref, commit)`, converter version, generation timestamp, file count, content checksum.

### GitHub Releases as the Distribution Channel

**Why GitHub Releases**:
- Free, immutable, CDN-backed asset hosting.
- Tag = release = artifact, all addressable by the same identifier.
- `gh release` CLI and GitHub API are first-class consumers.
- `catalog.json` in this repo serves as the index for tools that need programmatic lookup.

### `catalog.json`

Master index at the repo root mapping `(project, version)` → release tag and metadata. Updated by `release.yml` after each successful publish.

## CI / CD

### GitHub Actions

```
.github/workflows/
├── matrix-build.yml      ← Build N projects × M versions in parallel
├── nightly-detect.yml    ← Poll upstream for new releases
├── release.yml           ← Publish archives to GitHub Releases
└── ci.yml                ← Per-PR: typecheck + lint + test
```

**Constraints**:
- Full ecosystem rebuild target: < 15 minutes on free-tier runners.
- Matrix-parallelized (per-project, per-version).
- Releases gated on successful conversion + checksum verification.

### Renovate / Dependabot

To be configured for dev dependencies and GitHub Actions versions. Upstream Spring tag detection is handled by `nightly-detect.yml`, not Renovate.

## Local Development Commands

```bash
bun install                          # Install dev dependencies
bun run typecheck                    # tsc --noEmit
bun run lint                         # eslint --max-warnings 0
bun test                             # Bun test runner

# Build a single (project, version) pair locally
bun run scripts/fetch-upstream.ts spring-framework v6.2.0 --out /tmp/spring-fw
bun run scripts/convert.ts /tmp/spring-fw --project framework --version 6.2.0 --out dist/

# Package
bun run scripts/package-release.ts dist/spring-framework-6.2.0 --out releases/
```

## Tooling Out of Scope

- **Web frontend**: This repo has no web UI. `markdown/` is browsable on GitHub for diff-ability but is not a hosted documentation site.
- **Database**: No persistent state beyond Git history and GitHub Releases.
- **Server runtime**: All operations are CLI scripts and CI jobs. No daemon, no server.
- **Authentication**: GitHub Actions tokens only. No user-facing auth.

## Versioning & Releases (this repo's own code)

- The conversion toolchain (`scripts/`, workflows) is versioned via this repo's own tags (e.g., a separate `tooling-v1.0.0` namespace) — **distinct** from per-content tags like `framework-6.2.0`.
- Strategy to be finalized in an early ADR; default proposal: release-please managing a `tooling-v*` track.

## Related Stack Choices

- [`@pleaseai/spring`](https://github.com/pleaseai/spring) — Same Bun + TypeScript stack; consumes archives from this repo.
- [`@pleaseai/ask`](https://github.com/pleaseai/ask) — Same stack; sibling tool for generic library docs.
