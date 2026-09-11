/**
 * Fixture upstream tree → converted Markdown → release archive.
 *
 * Runs the real scripts as subprocesses against `tests/fixtures/upstream-component`,
 * so it covers what the unit tests deliberately cannot: Antora actually resolving
 * a component, and tar actually producing an archive. No network access — the
 * fixture stands in for a fetched upstream tree.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { ManifestSchema } from '../../scripts/lib/manifest.ts'
import { INDEX_FILENAME } from '../../scripts/lib/output-layout.ts'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const FIXTURE = join(REPO_ROOT, 'tests', 'fixtures', 'upstream-component')
const PROJECT = 'boot'
/** Not a real Spring Boot release: the fixture must never be mistaken for upstream content. */
const VERSION = '9.9.9'
const NAME = `${PROJECT}-${VERSION}`
const COMMIT = '0123456789abcdef0123456789abcdef01234567'

/** Antora and Asciidoctor load slowly enough that the default 5s timeout is not enough. */
const TIMEOUT = 120_000

let work: string
let converted: string

async function run(cmd: readonly string[], cwd: string) {
  const proc = Bun.spawn([...cmd], { cwd, stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout, stderr, exitCode }
}

/** Antora accepts a local content source only if it is a git worktree. */
async function initRepo(dir: string) {
  await run(['git', 'init', '-q', '-b', 'main', '.'], dir)
  await run(['git', 'add', '-A'], dir)
  await run(
    [
      'git',
      '-c',
      'user.email=fixture@pleaseai.invalid',
      '-c',
      'user.name=fixture',
      'commit',
      '-q',
      '-m',
      'fixture',
    ],
    dir,
  )
}

async function convert(outDir: string) {
  const source = join(work, 'src')
  return run(
    [
      'bun',
      'run',
      join(REPO_ROOT, 'scripts', 'convert.ts'),
      source,
      '--project',
      PROJECT,
      '--version',
      VERSION,
      '--out',
      outDir,
    ],
    REPO_ROOT,
  )
}

async function packageRelease(outDir: string) {
  return run(
    [
      'bun',
      'run',
      join(REPO_ROOT, 'scripts', 'package-release.ts'),
      converted,
      '--out',
      outDir,
    ],
    REPO_ROOT,
  )
}

async function packageReleaseDryRun(outDir: string) {
  return run(
    [
      'bun',
      'run',
      join(REPO_ROOT, 'scripts', 'package-release.ts'),
      converted,
      '--out',
      outDir,
      '--dry-run',
    ],
    REPO_ROOT,
  )
}

beforeAll(async () => {
  work = await mkdtemp(join(tmpdir(), 'spring-docs-pipeline-'))
  await cp(FIXTURE, join(work, 'src'), { recursive: true })
  await initRepo(join(work, 'src'))

  await mkdir(join(work, 'upstream'), { recursive: true })
  await writeFile(
    join(work, 'upstream', `${NAME}.upstream.json`),
    `${JSON.stringify({
      project: PROJECT,
      version: VERSION,
      repo: 'spring-projects/spring-boot',
      ref: `v${VERSION}`,
      commit: COMMIT,
      archives: ['root-aggregate-content'],
    })}\n`,
  )

  const result = await convert(work)
  if (result.exitCode !== 0)
    throw new Error(`fixture conversion failed:\n${result.stderr}`)
  converted = join(work, NAME)
}, TIMEOUT)

afterAll(async () => {
  await rm(work, { recursive: true, force: true })
})

describe('convert.ts over a fixture component', () => {
  test('writes one Markdown file per page plus the generated listing', async () => {
    const files = (await readdir(converted, { recursive: true })).sort()
    expect(files).toContain('index.md')
    expect(files).toContain(join('guide', 'nested.md'))
    expect(files).toContain(INDEX_FILENAME)
  })

  test('the generated listing does not overwrite the converted index page', async () => {
    const page = await readFile(join(converted, 'index.md'), 'utf8')
    expect(page).toContain('# Fixture Page')
    expect(page).not.toContain('converted from upstream Spring AsciiDoc')
  })

  test('Antora resolves includes and attributes before conversion', async () => {
    const page = await readFile(join(converted, 'index.md'), 'utf8')
    expect(page).toContain('This sentence comes from a partial')
    expect(page).toContain('The pinned dependency version is 1.2.3.')
  })

  test('internal xrefs become relative Markdown links', async () => {
    expect(await readFile(join(converted, 'index.md'), 'utf8'))
      .toContain('[the nested page](guide/nested.md)')
    expect(await readFile(join(converted, 'guide', 'nested.md'), 'utf8'))
      .toContain('[the index](../index.md)')
  })

  test('xrefs into an external component become absolute docs.spring.io URLs', async () => {
    expect(await readFile(join(converted, 'index.md'), 'utf8')).toContain(
      `[the Javadoc](https://docs.spring.io/spring-boot/${VERSION}/api/java/org/example/Fixture.html)`,
    )
  })

  test('admonitions, titled listings, lists and tables convert to GFM', async () => {
    const page = await readFile(join(converted, 'index.md'), 'utf8')
    expect(page).toContain('> [!NOTE]\n> Admonitions become GFM alerts.')
    expect(page).toContain('#### A titled listing\n\n```java\n')
    expect(page).toContain('- first item\n- second item')
    expect(page).toContain('| Column A | Column B |\n| --- | --- |\n| a1 | b1 |')
  })

  test('include-code:: resolves the example source and labels its language', async () => {
    // include-code:: is registered by @springio/asciidoctor-extensions itself
    // (not something this pipeline wires up), and it is load-bearing: 326
    // occurrences in the real upstream 4.1.1 tree (ADR-0002). It resolves the
    // target through the enclosing section id ("a-section" here, stripped of
    // "-" per the extension's own rule) against the `include-java` attribute,
    // not through the page path, so a regression there would silently drop
    // every code sample in the real docs.
    const page = await readFile(join(converted, 'index.md'), 'utf8')
    expect(page).toContain('```java\n')
    expect(page).toContain('fixture include-code sample')
  })

  test('the same source converts to byte-identical Markdown', async () => {
    const second = join(work, 'rerun')
    const result = await convert(second)
    expect(result.exitCode).toBe(0)

    for (const file of ['index.md', join('guide', 'nested.md'), INDEX_FILENAME]) {
      expect(await readFile(join(second, NAME, file), 'utf8'))
        .toBe(await readFile(join(converted, file), 'utf8'))
    }
  }, TIMEOUT)
})

describe('package-release.ts over a converted tree', () => {
  let out: string
  let archive: string

  beforeAll(async () => {
    out = join(work, 'releases')
    const result = await packageRelease(out)
    if (result.exitCode !== 0)
      throw new Error(`packaging failed:\n${result.stderr}`)
    archive = join(out, `${NAME}.tar.gz`)
  }, TIMEOUT)

  test('emits the archive, its checksum and the manifest', async () => {
    expect((await readdir(out)).sort()).toEqual([
      `${NAME}.tar.gz`,
      `${NAME}.tar.gz.sha256`,
      'manifest.json',
    ])
  })

  test('the checksum file matches the archive bytes', async () => {
    const expected = createHash('sha256').update(await readFile(archive)).digest('hex')
    expect(await readFile(`${archive}.sha256`, 'utf8')).toBe(`${expected}  ${NAME}.tar.gz\n`)
  })

  test('the manifest validates against the published schema', async () => {
    const manifest = ManifestSchema.parse(
      JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8')),
    )
    expect(manifest.project).toBe(PROJECT)
    expect(manifest.version).toBe(VERSION)
    expect(manifest.upstream.commit).toBe(COMMIT)
    expect(manifest.upstream.archives).toEqual(['root-aggregate-content'])
  })

  test('every entry sits under one <project>-<version> directory', async () => {
    const listed = await run(['tar', '-tzf', archive], work)
    const entries = listed.stdout.trim().split('\n')

    expect(entries.every(entry => entry.startsWith(`${NAME}/`))).toBe(true)
  })

  test('the archive ships NOTICE and every converted file, and nothing else', async () => {
    const listed = await run(['tar', '-tzf', archive], work)
    const entries = listed.stdout.trim().split('\n').sort()

    expect(entries).toContain(`${NAME}/NOTICE`)
    expect(entries).toContain(`${NAME}/index.md`)
    expect(entries).toContain(`${NAME}/guide/nested.md`)
    expect(entries).toContain(`${NAME}/${INDEX_FILENAME}`)

    const manifest = ManifestSchema.parse(
      JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8')),
    )
    expect(entries).toHaveLength(manifest.file_count)
  })

  test('NOTICE pins the upstream commit it was built from', async () => {
    const notice = await readFile(join(converted, 'NOTICE'), 'utf8')
    expect(notice).toContain(COMMIT)
  })

  test('the same tree packages to a byte-identical archive', async () => {
    const second = join(work, 'releases-rerun')
    const result = await packageRelease(second)
    expect(result.exitCode).toBe(0)

    expect(await readFile(join(second, `${NAME}.tar.gz`))).toEqual(await readFile(archive))
  }, TIMEOUT)

  test('the archive ships LICENSE, and the dry-run entry set agrees with the real run', async () => {
    // LICENSE names the terms; NOTICE only names the license. Without LICENSE
    // an archive-only recipient gets no license text at all.
    const listed = await run(['tar', '-tzf', archive], work)
    const entries = listed.stdout.trim().split('\n')
    expect(entries).toContain(`${NAME}/LICENSE`)

    const manifest = ManifestSchema.parse(
      JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8')),
    )

    const dryRun = await packageReleaseDryRun(join(work, 'releases-dry-run'))
    expect(dryRun.exitCode).toBe(0)
    const match = dryRun.stdout.match(/\[dry-run\] (\d+) files, content_sha256=([0-9a-f]{64})/)
    expect(match).not.toBeNull()
    expect(Number(match?.[1])).toBe(manifest.file_count)
    expect(match?.[2]).toBe(manifest.content_sha256)
  }, TIMEOUT)

  test('a dry run over a tree the real run already packaged does not double-count NOTICE', async () => {
    // `converted` already carries NOTICE and LICENSE on disk, written by the
    // real run in beforeAll above. A dry run must still report the same
    // file_count as that real run's manifest — one entry per generated file,
    // not two.
    const manifest = ManifestSchema.parse(
      JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8')),
    )

    const dryRun = await packageReleaseDryRun(join(work, 'releases-dry-run-repeat'))
    expect(dryRun.exitCode).toBe(0)
    const match = dryRun.stdout.match(/\[dry-run\] (\d+) files/)
    expect(Number(match?.[1])).toBe(manifest.file_count)
  }, TIMEOUT)
})
