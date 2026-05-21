# ADR-0001: Use Bun + TypeScript (strict) + Bun Test for the Conversion Pipeline

## Status

Accepted — 2026-05-21

## Context

`@pleaseai/spring-docs` is a content repository with an attached conversion pipeline. The pipeline ingests upstream Spring AsciiDoc/Antora sources, converts them to LLM-friendly Markdown, and publishes each `(project, version)` pair as an immutable GitHub Release archive (see `ARCHITECTURE.md`).

The pipeline has the following operational profile:

- **Script-shaped, not service-shaped** — a handful of top-level CLI entry points (`fetch-upstream.ts`, `convert.ts`, `package-release.ts`) called from GitHub Actions matrix jobs. No long-running process, no server, no daemon.
- **CI-bound** — every meaningful run happens on free-tier GitHub Actions. Full ecosystem rebuild target: < 15 minutes.
- **Few runtime dependencies** — by design (see ARCHITECTURE.md Code Invariants: "No new runtime dependencies beyond Bun + the AsciiDoc parser").
- **Test surface is rule-shaped** — many small input → expected output tests for AsciiDoc conversion rules, plus a few integration tests over fixture trees.

Project-level constraints inherited from `.please/docs/knowledge/tech-stack.md`:

- ESM only.
- TypeScript strict mode is non-negotiable.
- Consistency with sibling repos (`@pleaseai/spring`, `@pleaseai/ask`) is a stated goal.

The bootstrap Track (`project-bootstrap-20260521`) needs an immutable record of *why* this stack was chosen, so future Tracks and reviewers can challenge the assumption with the right context instead of reading minds.

## Decision

The conversion pipeline uses the following stack:

1. **Runtime**: [Bun](https://bun.sh) (1.x).
2. **Language**: TypeScript 5.x in strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `module: ESNext`, `moduleResolution: bundler`, `noEmit: true`).
3. **Test runner**: Bun's built-in (`bun test`).
4. **Linter**: ESLint with `@pleaseai/eslint-config` flat config.
5. **Git hooks**: Husky + lint-staged (pre-commit `eslint --fix`).

Concrete configuration lives in `package.json`, `tsconfig.json`, `eslint.config.ts`, and `.husky/pre-commit` — landed in commits that reference this Track.

## Consequences

### Positive

- **Single binary** replaces Node + npm + ts-node + Vitest + tsx. Smaller CI image, faster setup.
- **Native TS execution** — no separate transpile step. Scripts are runnable directly with `bun run scripts/<name>.ts`.
- **Fast install + startup** — measurable difference on free-tier runners.
- **Jest-compatible test API** with zero config and a built-in runner.
- **Cross-ecosystem consistency** — `@pleaseai/spring` and `@pleaseai/ask` already use Bun + TypeScript + `@pleaseai/eslint-config`. Engineers move between repos without re-learning the toolchain.
- **`noEmit: true`** matches the script-not-library shape. No `dist/`, no publish step.
- **`noUncheckedIndexedAccess: true`** catches a real class of parser bugs at compile time, where AST node access via index is everywhere.

### Negative

- **Bun is younger than Node** — the runtime occasionally ships breaking changes (mitigated by pinning `packageManager` and using `bun install --frozen-lockfile` in CI).
- **Some npm packages assume Node** — minor incompatibilities possible; mitigated by preferring `node:*` builtins (`node:fs/promises`, `node:path`) over Bun-only APIs in code that might run inside third-party Actions.
- **Bun test runner is less mature** than Vitest or Jest — fewer plugins, smaller ecosystem. Acceptable for the rule-shaped test surface we expect.

### Neutral

- ESLint 10 (flat config required) means we cannot fall back to legacy `.eslintrc` shapes.
- `@pleaseai/eslint-config` is pre-1.0 (currently `0.0.1`); we accept the churn as the cost of ecosystem consistency.
- `husky` v9 uses the simplified install via `prepare` script; older docs may show the v8 `husky install` pattern.

## Alternatives Considered

- **Node + tsx + Vitest** — proven, widely supported. Rejected because: more moving parts (Node, npm/pnpm, tsx, Vitest, separate lint runner), no DX win over Bun for a script-shaped project, and breaks consistency with `@pleaseai/spring` and `@pleaseai/ask` which already chose Bun.
- **Deno** — single-binary like Bun, web-standards-aligned. Rejected because: ecosystem incompatibility with most npm packages we'll need for AsciiDoc parsing, and no other `@pleaseai/*` repo uses it.
- **Node + ts-node + Jest** — most conservative path. Rejected for the same reasons as Vitest plus Jest's slower startup on free-tier runners.
- **Plain JavaScript (no TypeScript)** — fastest to start, no compile step. Rejected because ARCHITECTURE.md Code Invariants explicitly require TS strict mode; AsciiDoc-to-Markdown is enough parser code that type safety pays off.
- **Library mode (`declaration: true`, `outDir`)** like `@pleaseai/ask` — Rejected because spring-docs is a scripts project, never published to npm. `noEmit: true` is the correct posture.

## Notes

- This ADR captures the *why* once. `tech-stack.md` is the live reference for the *what* (versions, scripts, lockfile policy) and may be updated freely as the stack evolves within these boundaries.
- A future ADR will settle the AsciiDoc parser choice (currently deferred — see `project-bootstrap-20260521` spec OQ-1).
- A future ADR will settle the release-please / tooling tag namespace strategy (currently deferred — see `tech-stack.md` § "Versioning & Releases").

## Related

- `.please/docs/knowledge/tech-stack.md` — live configuration reference.
- `ARCHITECTURE.md` § "Code Invariants" — TS strict mode and ESM-only requirements that constrain this choice.
- `.please/docs/tracks/active/project-bootstrap-20260521/` — Track that landed this stack on disk.
