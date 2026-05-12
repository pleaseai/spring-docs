# Project Workflow

> Development workflow conventions for `@pleaseai/spring-docs`.
> Referenced by `/please:implement`.

## Guiding Principles

1. **The Plan is the Source of Truth**: All work is tracked in the track's `plan.md`
2. **The Tech Stack is Deliberate**: Changes to the tech stack must be documented in `tech-stack.md` before implementation
3. **Test-Driven Development**: Write tests before implementing functionality
4. **High Code Coverage**: Aim for >80% code coverage for new code
5. **Non-Interactive & CI-Aware**: Prefer non-interactive commands. Use `CI=true` for watch-mode tools

## Task Workflow

All tasks follow a strict lifecycle within `/please:implement`:

### Standard Task Lifecycle

1. **Select Task**: Choose the next available task from `plan.md`
2. **Mark In Progress**: Update task status from `[ ]` to `[~]`
3. **Write Failing Tests (Red Phase)**:
   - Create test file for the feature or bug fix
   - Write unit tests defining expected behavior
   - Run tests and confirm they fail as expected
4. **Implement to Pass Tests (Green Phase)**:
   - Write minimum code to make failing tests pass
   - Run test suite and confirm all tests pass
5. **Refactor (Optional)**:
   - Improve clarity, remove duplication, enhance performance
   - Rerun tests to ensure they still pass
6. **Verify Coverage**: Run coverage reports. Target: >80% for new code
7. **Document Deviations**: If implementation differs from tech stack, update `tech-stack.md` first
8. **Commit**: Stage and commit with conventional commit message
9. **Update Progress**: Mark the task as completed in `## Progress` with a timestamp

### Phase Completion Protocol

Executed when all tasks in a phase are complete:

1. **Verify Test Coverage**: Identify all files changed in the phase, ensure test coverage
2. **Run Full Test Suite**: Execute all tests, debug failures (max 2 fix attempts)
3. **Manual Verification Plan**: Generate step-by-step verification instructions for the user
4. **User Confirmation**: Wait for explicit user approval before proceeding
5. **Create Checkpoint**: Commit with message `chore(checkpoint): complete phase {name}`
6. **Update Plan**: Mark phase as complete in `plan.md`

## Quality Gates

Before marking any task complete:

- [ ] All tests pass (`bun test`)
- [ ] Code coverage meets requirements (>80%)
- [ ] Type check passes (`bun run typecheck`)
- [ ] No lint warnings (`bun run lint` — zero warnings policy)
- [ ] Conversion output validates (link check, schema check, size sanity)
- [ ] No security vulnerabilities introduced
- [ ] Documentation updated if needed

## Development Commands

### Setup

```bash
bun install
```

### Daily Development

```bash
# Build one (project, version) pair locally
bun run scripts/fetch-upstream.ts spring-framework v6.2.0 --out /tmp/spring-fw
bun run scripts/convert.ts /tmp/spring-fw --project framework --version 6.2.0 --out dist/

# Package locally
bun run scripts/package-release.ts dist/spring-framework-6.2.0 --out releases/
```

### Testing

```bash
bun test                       # Run all tests
bun test --coverage            # Run with coverage report
bun test scripts/lib/          # Run a specific suite
```

### Before Committing

```bash
bun run typecheck   # tsc --noEmit
bun run lint        # eslint --max-warnings 0
bun test            # Bun test runner
```

Pre-commit hook (Husky + lint-staged) runs `eslint --fix` on staged files automatically.

## Testing Requirements

### Unit Testing

- Every conversion rule in `scripts/lib/antora-rules.ts` requires a unit test (input AsciiDoc fragment → expected Markdown output).
- Manifest schema (`scripts/lib/manifest.ts`) requires schema validation tests.
- Mock external dependencies (network, filesystem, git).
- Test both success and failure cases (malformed input, missing attributes, broken xrefs).

### Integration Testing

- End-to-end conversion against fixture upstream repos in `tests/fixtures/`.
- Verify byte-stable output for the same upstream commit (determinism test).
- Validate generated `manifest.json` matches schema.
- Package + checksum + extract round-trip test.

### Conversion Output Validation

Every generated archive must pass:

- Markdown link check (internal links resolve)
- Frontmatter schema check (where applicable)
- Size sanity check (output within ±25% of historical baseline per project)

## Commit Guidelines

Conventional Commits. See `Skill("standards:commit-convention")` for full details.

### Types

- `feat`: New feature (e.g., new conversion rule, new pipeline step)
- `fix`: Bug fix (e.g., incorrect xref handling)
- `docs`: Documentation only (README, ADR, knowledge files)
- `style`: Formatting changes
- `refactor`: Code change without behavior change
- `perf`: Performance improvement (e.g., faster conversion)
- `test`: Adding or updating tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to GitHub Actions workflows
- `chore`: Maintenance tasks (e.g., dependency bumps, repo housekeeping)

### Scopes (typical for this repo)

- `convert`: AsciiDoc → Markdown conversion
- `antora-rules`: Specific conversion rules
- `fetch`: Upstream fetching / sparse checkout
- `package`: Archive packaging + manifest
- `catalog`: `catalog.json` updates
- `manifest`: `manifest.json` schema/generation
- `ci`: GitHub Actions workflows

Examples:
- `feat(convert): support nested xref resolution across modules`
- `fix(antora-rules): preserve attribute substitution in code blocks`
- `ci(matrix-build): parallelize per-project to fit free-tier runners`

## Definition of Done

A task is complete when:

1. All code implemented to specification
2. Unit and integration tests written and passing
3. Code coverage meets project requirements (>80%)
4. Code passes type check and lint (zero warnings)
5. For conversion changes: generated output validates (link check, schema, size)
6. Progress updated in `plan.md`
7. Changes committed with conventional commit message
