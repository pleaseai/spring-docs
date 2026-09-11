/**
 * Argument guards of the catalog-adjacent CLIs.
 *
 * All three run from the release workflow, where a mistyped flag has to fail the
 * run rather than be dropped: `update-catalog.ts` writes the public index,
 * `promote-markdown.ts` deletes and rewrites a directory tree, and
 * `release-mode.ts` decides whether the run publishes at all. All parse their
 * own arguments and call `main()` at import time, so the contract is exercised
 * as a subprocess, like `validate-catalog.test.ts`.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const UPDATE_CATALOG = resolve(__dirname, '..', '..', 'scripts', 'update-catalog.ts')
const PROMOTE_MARKDOWN = resolve(__dirname, '..', '..', 'scripts', 'promote-markdown.ts')
const RELEASE_MODE = resolve(__dirname, '..', '..', 'scripts', 'release-mode.ts')

let cwd: string

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'cli-arguments-'))
})

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true })
})

async function run(script: string, args: readonly string[]) {
  const proc = Bun.spawn(['bun', 'run', script, ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout, stderr, exitCode }
}

async function seedCatalog(projects: unknown = {}) {
  await writeFile(
    join(cwd, 'catalog.json'),
    `${JSON.stringify({ version: '1', generated_at: null, projects }, null, 2)}\n`,
  )
}

describe('update-catalog.ts argument guards', () => {
  // Every rejection is the same subprocess contract — seed a catalog, run the
  // CLI, assert the exit code and the message it failed with — so the cases are
  // a table rather than four near-identical blocks.
  const REJECTIONS = [
    {
      name: 'exit 2 on a misspelled option rather than dropping it',
      args: ['--project', 'boot', '--version', '4.1.1', '--tag', 'boot-4.1.1', '--released-att', '2026-09-11T00:00:00Z'],
      exitCode: 2,
      message: 'Unknown option "--released-att"',
    },
    {
      name: 'exit 2 when an option is missing its value',
      args: ['--project', 'boot', '--version', '4.1.1', '--tag'],
      exitCode: 2,
      message: 'needs a value',
    },
    {
      name: 'exit 2 on a positional argument',
      args: ['--project', 'boot', '--version', '4.1.1', '--tag', 'boot-4.1.1', 'extra'],
      exitCode: 2,
      message: 'Unexpected argument',
    },
    {
      // Not an argument shape but a cross-check against the tag: exit 1 rather
      // than 2, because the arguments parsed fine and the catalog write is what
      // was refused.
      name: 'exit 1 on a tag that does not belong to the (project, version)',
      args: ['--project', 'boot', '--version', '4.1.1', '--tag', 'boot-9.9.9'],
      exitCode: 1,
      message: 'does not belong to',
    },
  ] as const

  for (const rejection of REJECTIONS) {
    test(rejection.name, async () => {
      await seedCatalog()

      const { stderr, exitCode } = await run(UPDATE_CATALOG, rejection.args)

      expect(exitCode).toBe(rejection.exitCode)
      expect(stderr).toContain(rejection.message)
    })
  }

  test('a rerun that omits --released-at keeps the recorded timestamp', async () => {
    await seedCatalog({
      boot: { '4.1.1': { tag: 'boot-4.1.1', released_at: '2026-09-11T00:00:00Z' } },
    })

    const { stdout, exitCode } = await run(UPDATE_CATALOG, [
      '--project',
      'boot',
      '--version',
      '4.1.1',
      '--tag',
      'boot-4.1.1',
    ])

    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('pending')
    const catalog = JSON.parse(await readFile(join(cwd, 'catalog.json'), 'utf8'))
    expect(catalog.projects.boot['4.1.1'].released_at).toBe('2026-09-11T00:00:00Z')
  })
})

describe('promote-markdown.ts argument guards', () => {
  test('exit 2 on --out with no directory, instead of the default', async () => {
    const { stderr, exitCode } = await run(PROMOTE_MARKDOWN, ['dist/boot-4.1.1', '--out'])

    expect(exitCode).toBe(2)
    expect(stderr).toContain('"--out" needs a directory')
  })

  test('exit 2 on an empty --out=, which would target the repository root', async () => {
    const { stderr, exitCode } = await run(PROMOTE_MARKDOWN, ['dist/boot-4.1.1', '--out='])

    expect(exitCode).toBe(2)
    expect(stderr).toContain('"--out" needs a directory')
  })

  test('exit 2 on an unknown option', async () => {
    const { stderr, exitCode } = await run(PROMOTE_MARKDOWN, ['dist/boot-4.1.1', '--output', 'x'])

    expect(exitCode).toBe(2)
    expect(stderr).toContain('Unknown option "--output"')
  })
})

describe('release-mode.ts argument guards', () => {
  const REQUIRED = [
    '--project',
    'boot',
    '--version',
    '4.1.1',
    '--tag',
    'boot-4.1.1',
    '--catalog',
    'catalog.json',
  ] as const

  test('stdout carries the mode and nothing else', async () => {
    // The workflow captures stdout with `$(...)` and compares it to a mode
    // name, so any progress line has to go to stderr.
    await seedCatalog()

    const { stdout, stderr, exitCode } = await run(RELEASE_MODE, [...REQUIRED, '--release-exists', 'true'])

    expect(exitCode).toBe(0)
    expect(stdout).toBe('register\n')
    expect(stderr).toContain('boot-4.1.1: register')
  })

  test('exit 2 on a --release-exists that is neither true nor false', async () => {
    // A probe that emits anything else must stop the run: read as "no release",
    // it would republish over an archive that already exists.
    await seedCatalog()

    const { stderr, exitCode } = await run(RELEASE_MODE, [...REQUIRED, '--release-exists', 'yes'])

    expect(exitCode).toBe(2)
    expect(stderr).toContain('takes "true" or "false"')
  })

  test('exit 1 when the catalog names a tag whose release is gone', async () => {
    await seedCatalog({
      boot: { '4.1.1': { tag: 'boot-4.1.1', released_at: '2026-09-11T00:00:00Z' } },
    })

    const { stderr, exitCode } = await run(RELEASE_MODE, [...REQUIRED, '--release-exists', 'false'])

    expect(exitCode).toBe(1)
    expect(stderr).toContain('no such release exists')
  })
})
