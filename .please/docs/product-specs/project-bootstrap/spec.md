---
id: SPEC-001
level: V_M
domain: project-bootstrap
feature: spec
depends: []
conflicts: []
traces: []
created_at: 2026-05-21T09:56:34Z
updated_at: 2026-05-21T09:56:34Z
source_tracks: ["project-bootstrap-20260521"]
---

# Spec — Project Bootstrap Specification

## Purpose

Project Bootstrap 관련 요구사항. Bun + TypeScript + ESLint + Husky + Bun test + GitHub Actions CI + catalog.json zod schema 기반의 토대를 정의한다.

## Requirements

### Requirement: package.json declares Bun runtime with dev toolchain scripts

The system MUST provide a `package.json` that declares Bun (>= 1.x) as the runtime, lists TypeScript and `@pleaseai/eslint-config` as dev dependencies, and exposes the scripts `typecheck`, `lint`, `test`, and `format` (if applicable).

#### Scenario: package.json declares Bun runtime with dev toolchain scripts

- GIVEN a freshly cloned repository
- WHEN `package.json` is inspected
- THEN it declares Bun as the runtime and exposes the documented scripts so `bun install` followed by the toolchain commands succeeds

### Requirement: tsconfig.json matches tech-stack strict configuration

The system MUST provide a `tsconfig.json` that enables `strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`, and `noEmit: true` — matching `.please/docs/knowledge/tech-stack.md` exactly.

#### Scenario: tsconfig.json matches tech-stack strict configuration

- GIVEN the repository contains `tsconfig.json`
- WHEN `bun run typecheck` is executed
- THEN it runs `tsc --noEmit` with strict mode and exits with code 0 against the current source tree

### Requirement: ESLint configured via @pleaseai/eslint-config with zero warnings

The system MUST configure ESLint via `@pleaseai/eslint-config` and `bun run lint` MUST run `eslint --max-warnings 0` to enforce a zero-warnings policy.

#### Scenario: ESLint configured via @pleaseai/eslint-config with zero warnings

- GIVEN ESLint is configured with `@pleaseai/eslint-config`
- WHEN `bun run lint` is executed
- THEN it exits with code 0 and reports zero warnings on the entire tree

### Requirement: Bun test runner wired up

The system MUST wire up Bun's built-in test runner; `bun test` MUST exit 0 against the test suite.

#### Scenario: Bun test runner wired up

- GIVEN the repository contains at least one test file
- WHEN `bun test` is executed
- THEN the runner discovers tests and exits with code 0 when all assertions pass

### Requirement: Husky + lint-staged pre-commit hook

The system MUST configure Husky + lint-staged to run `eslint --fix` on staged files via the pre-commit hook.

#### Scenario: Husky + lint-staged pre-commit hook

- GIVEN a contributor stages a TypeScript file with style violations
- WHEN `git commit` is invoked
- THEN the pre-commit hook runs `eslint --fix` on the staged file and proceeds to commit only if lint passes

### Requirement: CI workflow runs typecheck, lint, and tests

The system MUST provide `.github/workflows/ci.yml` that runs typecheck, lint, and tests on every PR and push to main, using a matrix-friendly setup other workflows can copy.

#### Scenario: CI workflow runs typecheck, lint, and tests

- GIVEN a contributor opens a PR
- WHEN the CI workflow triggers
- THEN it runs `bun install --frozen-lockfile`, typecheck, lint, validate-catalog, and tests; all jobs must pass for the PR to be mergeable

### Requirement: Agreed directory skeleton exists

The system MUST provide the agreed directory skeleton (`scripts/`, `scripts/lib/`, `tests/`, `tests/unit/`, `tests/integration/`, `tests/fixtures/`, `markdown/`) with `.gitkeep` markers so future tracks have a known home for their files.

#### Scenario: Agreed directory skeleton exists

- GIVEN the repository is freshly cloned
- WHEN the directory tree is inspected
- THEN every documented bootstrap directory exists with a `.gitkeep` marker to preserve emptiness in git

### Requirement: catalog.json validated against documented schema

The system MUST keep `catalog.json` at the repo root and validate it against a documented zod schema in CI.

#### Scenario: catalog.json validated against documented schema

- GIVEN `catalog.json` exists at the repo root
- WHEN `bun run validate-catalog` is executed
- THEN the script parses `catalog.json` against `CatalogSchema` and exits with code 0 for a valid shape, 1 for invalid JSON or schema violation, and 2 when the file is unreadable

### Requirement: .gitignore covers Bun/TypeScript build artifacts

The system MUST keep `.gitignore` covering Bun/TypeScript build artifacts (`node_modules/`, `dist/`, `.bun/`, etc.).

#### Scenario: .gitignore covers Bun/TypeScript build artifacts

- GIVEN a contributor runs `bun install`
- WHEN `git status` is invoked
- THEN no `node_modules/`, `dist/`, `.bun/`, `coverage/`, or other transient build artifact appears as untracked content
