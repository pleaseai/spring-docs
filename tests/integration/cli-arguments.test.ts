/**
 * Argument guards of the two catalog-adjacent CLIs.
 *
 * Both run from the release workflow, where a mistyped flag has to fail the run
 * rather than be dropped: `update-catalog.ts` writes the public index, and
 * `promote-markdown.ts` deletes and rewrites a directory tree. Both parse their
 * own arguments and call `main()` at import time, so the contract is exercised
 * as a subprocess, like `validate-catalog.test.ts`.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const UPDATE_CATALOG = resolve(__dirname, '..', '..', 'scripts', 'update-catalog.ts')
const PROMOTE_MARKDOWN = resolve(__dirname, '..', '..', 'scripts', 'promote-markdown.ts')

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
  test('exit 2 on a misspelled option rather than dropping it', async () => {
    await seedCatalog()

    const { stderr, exitCode } = await run(UPDATE_CATALOG, [
      '--project',
      'boot',
      '--version',
      '4.1.1',
      '--tag',
      'boot-4.1.1',
      '--released-att',
      '2026-09-11T00:00:00Z',
    ])

    expect(exitCode).toBe(2)
    expect(stderr).toContain('Unknown option "--released-att"')
  })

  test('exit 2 when an option is missing its value', async () => {
    await seedCatalog()

    const { stderr, exitCode } = await run(UPDATE_CATALOG, [
      '--project',
      'boot',
      '--version',
      '4.1.1',
      '--tag',
    ])

    expect(exitCode).toBe(2)
    expect(stderr).toContain('needs a value')
  })

  test('exit 2 on a positional argument', async () => {
    await seedCatalog()

    const { stderr, exitCode } = await run(UPDATE_CATALOG, [
      '--project',
      'boot',
      '--version',
      '4.1.1',
      '--tag',
      'boot-4.1.1',
      'extra',
    ])

    expect(exitCode).toBe(2)
    expect(stderr).toContain('Unexpected argument')
  })

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

  test('exit 1 on a tag that does not belong to the (project, version)', async () => {
    await seedCatalog()

    const { stderr, exitCode } = await run(UPDATE_CATALOG, [
      '--project',
      'boot',
      '--version',
      '4.1.1',
      '--tag',
      'boot-9.9.9',
    ])

    expect(exitCode).toBe(1)
    expect(stderr).toContain('does not belong to')
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
