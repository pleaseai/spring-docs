import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Buffer } from 'node:buffer'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { insertSorted, packArchive, parseArgs, requiredString, textChecksum } from '../../scripts/package-release.ts'

describe('parseArgs', () => {
  test('parses the source positional and --out', () => {
    const args = parseArgs(['dist/boot-4.1.1', '--out', 'releases'])

    expect(args).toEqual({ source: 'dist/boot-4.1.1', out: 'releases', dryRun: false })
  })

  test('accepts --out=value and --dry-run', () => {
    const args = parseArgs(['dist/boot-4.1.1', '--out=releases', '--dry-run'])

    expect(args).toEqual({ source: 'dist/boot-4.1.1', out: 'releases', dryRun: true })
  })

  test('throws when --out is missing', () => {
    expect(() => parseArgs(['dist/boot-4.1.1'])).toThrow(/Usage: package-release\.ts/)
  })

  test('throws when the source positional is missing', () => {
    expect(() => parseArgs(['--out', 'releases'])).toThrow(/Usage: package-release\.ts/)
  })
})

describe('insertSorted', () => {
  test('inserts into the middle of an already-sorted list', () => {
    const entries = [
      { path: 'a.txt', sha256: '1' },
      { path: 'c.txt', sha256: '3' },
    ]

    expect(insertSorted(entries, { path: 'b.txt', sha256: '2' })).toEqual([
      { path: 'a.txt', sha256: '1' },
      { path: 'b.txt', sha256: '2' },
      { path: 'c.txt', sha256: '3' },
    ])
  })

  test('appends when the entry sorts after everything else', () => {
    const entries = [{ path: 'a.txt', sha256: '1' }]

    expect(insertSorted(entries, { path: 'z.txt', sha256: '2' })).toEqual([
      { path: 'a.txt', sha256: '1' },
      { path: 'z.txt', sha256: '2' },
    ])
  })

  test('does not mutate the list it was given', () => {
    const entries = [{ path: 'a.txt', sha256: '1' }]
    insertSorted(entries, { path: 'b.txt', sha256: '2' })

    expect(entries).toEqual([{ path: 'a.txt', sha256: '1' }])
  })
})

describe('requiredString', () => {
  test('returns a present, non-empty string field', () => {
    expect(requiredString({ repo: 'spring-projects/spring-boot' }, 'repo', '/tmp/x.json')).toBe(
      'spring-projects/spring-boot',
    )
  })

  test('throws when the field is missing', () => {
    expect(() => requiredString({}, 'repo', '/tmp/x.json'))
      .toThrow(/Malformed provenance sidecar at \/tmp\/x\.json: "repo" must be a non-empty string/)
  })

  test('throws when the field is an empty string', () => {
    expect(() => requiredString({ repo: '' }, 'repo', '/tmp/x.json')).toThrow(/must be a non-empty string/)
  })

  test('throws when the field is not a string', () => {
    expect(() => requiredString({ repo: 42 }, 'repo', '/tmp/x.json')).toThrow(/must be a non-empty string/)
  })
})

describe('textChecksum', () => {
  test('matches the SHA-256 of the given text', async () => {
    const expected = Buffer.from(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hello')),
    ).toString('hex')

    expect(await textChecksum('hello')).toBe(expected)
  })

  test('differs for different text', async () => {
    expect(await textChecksum('a')).not.toBe(await textChecksum('b'))
  })
})

describe('packArchive', () => {
  // The system tar with no reproducibility flags: these tests check the
  // two-step packing, not the archive bytes, which the pipeline test pins.
  const tar = { command: 'tar', flags: [] }
  let work: string

  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), 'pack-archive-'))
    await mkdir(join(work, 'tree', 'r-1.0.0'), { recursive: true })
    await writeFile(join(work, 'tree', 'r-1.0.0', 'a.md'), 'a\n')
    await mkdir(join(work, 'out'))
  })

  afterEach(async () => {
    await rm(work, { recursive: true, force: true })
  })

  test('leaves only the archive, holding every listed entry', async () => {
    const list = join(work, 'files')
    await writeFile(list, 'r-1.0.0/a.md\n')

    await packArchive(tar, work, join(work, 'tree'), list, join(work, 'out', 'r-1.0.0.tar.gz'))

    expect(await readdir(join(work, 'out'))).toEqual(['r-1.0.0.tar.gz'])
    const listed = Bun.spawnSync(['tar', '-tzf', join(work, 'out', 'r-1.0.0.tar.gz')])
    expect(listed.stdout.toString().trim()).toBe('r-1.0.0/a.md')
  })

  test('fails on a tar failure and leaves nothing behind', async () => {
    const list = join(work, 'files')
    await writeFile(list, 'r-1.0.0/missing.md\n')

    await expect(packArchive(tar, work, join(work, 'tree'), list, join(work, 'out', 'r-1.0.0.tar.gz')))
      .rejects
      .toThrow(/missing\.md/)
    expect(await readdir(join(work, 'out'))).toEqual([])
  })

  test('fails on a gzip failure with gzip\'s error, and removes the tar it left', async () => {
    const list = join(work, 'files')
    await writeFile(list, 'r-1.0.0/a.md\n')
    // A directory where gzip writes its output makes gzip fail after tar has
    // succeeded. Removing it fails too, which must not hide gzip's error.
    const blocked = join(work, 'out', 'r-1.0.0.tar.gz.tar.gz')
    await mkdir(blocked)

    await expect(packArchive(tar, work, join(work, 'tree'), list, join(work, 'out', 'r-1.0.0.tar.gz')))
      .rejects
      .toThrow(/^gzip .* failed/)
    expect(await readdir(join(work, 'out'))).toEqual(['r-1.0.0.tar.gz.tar.gz'])
  })
})
