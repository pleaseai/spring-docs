import { describe, expect, test } from 'bun:test'
import { Buffer } from 'node:buffer'
import { insertSorted, parseArgs, requiredString, textChecksum } from '../../scripts/package-release.ts'

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
