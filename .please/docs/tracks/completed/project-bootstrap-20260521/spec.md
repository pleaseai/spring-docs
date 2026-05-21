# Spec — Project Bootstrap

> Track ID: `project-bootstrap-20260521`
> Type: feature
> Status: draft

## Summary

Establish the foundational tooling and directory scaffolding for the `@pleaseai/spring-docs` conversion pipeline. The repository today contains only documentation, license, and the `.please/` workspace; it has none of the Bun/TypeScript project files, the `scripts/` source tree, or the CI workflows described in `ARCHITECTURE.md` and `.please/docs/knowledge/tech-stack.md`. This track delivers the minimum infrastructure required for every subsequent track (fetch-upstream, convert, package-release, catalog) to build on.

## Motivation

`ARCHITECTURE.md` documents the intended architecture, but the entry points listed there (`scripts/fetch-upstream.ts`, `scripts/convert.ts`, `scripts/package-release.ts`, `.github/workflows/ci.yml`) do not exist. Until project bootstrap is complete:

- No TypeScript file can be type-checked or tested.
- No PR can run a meaningful CI pipeline.
- Future tracks have no agreed conventions (lint config, test runner setup, package layout) to plug into.

This is the strict prerequisite for every other implementation track.

## User Stories

- **US-1** — As a contributor, I can run `bun install && bun run typecheck && bun run lint && bun test` immediately after cloning the repo and have all four commands succeed (even with zero source files).
- **US-2** — As a reviewer, I can open a PR and have CI automatically run typecheck, lint, and tests on every push.
- **US-3** — As a future track author, I can drop a new `scripts/<name>.ts` file into the repo and have it picked up by the existing tsconfig, eslint, and test runner without further configuration.
- **US-4** — As a release engineer, the repo has a clear, agreed directory layout (`scripts/`, `scripts/lib/`, `tests/`, `tests/fixtures/`, `markdown/`) so subsequent tracks know exactly where their files belong.

## Functional Requirements

- **FR-1** — `package.json` declares Bun (>= 1.x) as the runtime, lists TypeScript and `@pleaseai/eslint-config` as dev dependencies, and exposes the scripts `typecheck`, `lint`, `test`, `format` (if applicable).
- **FR-2** — `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`, `noEmit: true` — matching tech-stack.md exactly.
- **FR-3** — ESLint is configured via `@pleaseai/eslint-config` and `bun run lint` runs `eslint --max-warnings 0`.
- **FR-4** — Bun's built-in test runner is wired up; `bun test` exits 0 against an empty test suite.
- **FR-5** — Husky + lint-staged are configured to run `eslint --fix` on staged files on pre-commit.
- **FR-6** — `.github/workflows/ci.yml` runs typecheck, lint, and tests on every PR and push to main, using a matrix-friendly setup that other workflows can copy.
- **FR-7** — The agreed directory skeleton exists (empty `scripts/`, `scripts/lib/`, `tests/`, `tests/fixtures/`, `markdown/` with `.gitkeep` where appropriate) so future tracks have a known home for their files.
- **FR-8** — `catalog.json` exists at the repo root (currently a 124-byte placeholder) and is validated against a documented schema (even if it remains essentially empty for now).
- **FR-9** — `.gitignore` covers Bun/TypeScript build artifacts (`node_modules/`, `dist/`, `.bun/`, etc.).

## Success Criteria

- **SC-1** — On a clean clone, `bun install && bun run typecheck && bun run lint && bun test` all exit 0.
- **SC-2** — A PR triggers `.github/workflows/ci.yml` and all jobs pass.
- **SC-3** — Husky pre-commit hook fires on a staged TypeScript file and runs `eslint --fix`.
- **SC-4** — ARCHITECTURE.md's "Entry Points" and "Code Map" sections accurately reflect the on-disk layout for the parts created in this track (with `_(Planned)_` markers retained for the actual conversion code still to come).
- **SC-5** — `bun run lint` reports zero warnings (warnings-as-errors policy).

## Out of Scope

- The actual conversion implementation (`fetch-upstream.ts`, `convert.ts`, `package-release.ts`) — these are separate tracks.
- AsciiDoc / Antora parsing logic.
- Any `markdown/<project>/<version>/` content.
- Workflow files beyond `ci.yml` (matrix-build.yml, nightly-detect.yml, release.yml are separate tracks).
- Renovate / Dependabot configuration (separate track once dependencies stabilize).
- Choice of `release-please` vs other release-tooling strategy (deferred to an ADR in a later track).

## Open Questions

- **OQ-1** — Should `package.json` already pin the `asciidoctor` / Asciidoctor.js dependency, or defer until the convert track starts? Default proposal: defer.
- **OQ-2** — Does this track produce the first ADR (e.g., "ADR-0001 — Use Bun + TypeScript stack"), or is ADR creation deferred until a decision requires arbitration? Default proposal: produce ADR-0001 capturing the already-documented stack choice for traceability.
- **OQ-3** — Should `catalog.json` schema be defined here (via zod) or alongside `release.yml` in a later track? Default proposal: define schema here, validate in CI.
