import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SCRIPT = resolve(__dirname, '..', '..', 'scripts', 'validate-catalog.ts')

let cwd: string

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'validate-catalog-'))
})

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true })
})

async function runValidator(workingDir: string) {
  const proc = Bun.spawn(['bun', 'run', SCRIPT], {
    cwd: workingDir,
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

describe('validate-catalog.ts CLI contract', () => {
  test('exit 0 with success summary when catalog.json is the valid placeholder', async () => {
    await writeFile(
      join(cwd, 'catalog.json'),
      JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        version: '1',
        generated_at: null,
        projects: {},
      }),
    )

    const { stdout, exitCode } = await runValidator(cwd)

    expect(exitCode).toBe(0)
    expect(stdout).toContain('valid')
    expect(stdout).toContain('version=1')
  })

  test('exit 2 with stderr message when catalog.json is missing', async () => {
    const { stderr, exitCode } = await runValidator(cwd)

    expect(exitCode).toBe(2)
    expect(stderr).toContain('Cannot read catalog.json')
  })

  test('exit 1 with stderr message when catalog.json is not valid JSON', async () => {
    await writeFile(join(cwd, 'catalog.json'), '{ this is not json')

    const { stderr, exitCode } = await runValidator(cwd)

    expect(exitCode).toBe(1)
    expect(stderr).toContain('not valid JSON')
  })

  test('exit 1 with the failing field path when version is wrong', async () => {
    await writeFile(
      join(cwd, 'catalog.json'),
      JSON.stringify({
        version: '2',
        generated_at: null,
        projects: {},
      }),
    )

    const { stderr, exitCode } = await runValidator(cwd)

    expect(exitCode).toBe(1)
    expect(stderr).toContain('failed schema validation')
    expect(stderr).toContain('version')
  })

  test('exit 1 when projects field is missing', async () => {
    await writeFile(
      join(cwd, 'catalog.json'),
      JSON.stringify({
        version: '1',
        generated_at: null,
      }),
    )

    const { stderr, exitCode } = await runValidator(cwd)

    expect(exitCode).toBe(1)
    expect(stderr).toContain('projects')
  })
})

describe('validate-catalog.ts populated catalog', () => {
  test('exit 0 against a multi-project, multi-version catalog', async () => {
    await mkdir(cwd, { recursive: true })
    await writeFile(
      join(cwd, 'catalog.json'),
      JSON.stringify({
        version: '1',
        generated_at: '2026-05-21T03:25:41Z',
        projects: {
          framework: {
            '6.2.0': { tag: 'framework-6.2.0', released_at: '2026-05-21T03:25:41Z' },
            '6.1.5': { tag: 'framework-6.1.5', released_at: '2026-04-15T10:00:00Z' },
          },
          boot: {
            '3.4.0': { tag: 'boot-3.4.0', released_at: null },
          },
        },
      }),
    )

    const { stdout, exitCode } = await runValidator(cwd)

    expect(exitCode).toBe(0)
    expect(stdout).toContain('2 project(s)')
    expect(stdout).toContain('3 version(s)')
  })
})
