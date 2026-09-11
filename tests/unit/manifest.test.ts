import type { ContentEntry, ManifestInput } from '../../scripts/lib/manifest.ts'
import { describe, expect, test } from 'bun:test'
import {
  buildManifest,
  contentChecksum,
  contentChecksumPreimage,

  MANIFEST_VERSION,

  ManifestSchema,
} from '../../scripts/lib/manifest.ts'

const SHA_A = 'a'.repeat(64)
const SHA_B = 'b'.repeat(64)

function input(overrides: Partial<ManifestInput> = {}): ManifestInput {
  return {
    project: 'boot',
    version: '4.1.1',
    upstream: {
      repo: 'spring-projects/spring-boot',
      ref: 'v4.1.1',
      commit: '6fdf67ea1552691e932604d4bf67a5e08ff0b0ea',
      archives: ['root-aggregate-content'],
    },
    converter: { commit: 'abc1234', antora: '3.2.0', asciidoctor: '2.2.8' },
    generatedAt: new Date('2026-09-11T00:00:00.000Z'),
    entries: [{ path: 'a.md', sha256: SHA_A }],
    ...overrides,
  }
}

describe('contentChecksumPreimage', () => {
  test('sorts by path so traversal order cannot change the checksum', () => {
    const forward: ContentEntry[] = [
      { path: 'a.md', sha256: SHA_A },
      { path: 'b.md', sha256: SHA_B },
    ]
    const reversed = [...forward].reverse()

    expect(contentChecksumPreimage(reversed)).toBe(contentChecksumPreimage(forward))
    expect(contentChecksumPreimage(forward)).toBe(`${SHA_A}  a.md\n${SHA_B}  b.md\n`)
  })

  test('does not mutate its input', () => {
    const entries: ContentEntry[] = [
      { path: 'b.md', sha256: SHA_B },
      { path: 'a.md', sha256: SHA_A },
    ]
    contentChecksumPreimage(entries)
    expect(entries[0]?.path).toBe('b.md')
  })
})

describe('contentChecksum', () => {
  test('is stable for the same content in any order', async () => {
    const a = await contentChecksum([
      { path: 'a.md', sha256: SHA_A },
      { path: 'b.md', sha256: SHA_B },
    ])
    const b = await contentChecksum([
      { path: 'b.md', sha256: SHA_B },
      { path: 'a.md', sha256: SHA_A },
    ])
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  test('changes when a file\'s content changes', async () => {
    const before = await contentChecksum([{ path: 'a.md', sha256: SHA_A }])
    const after = await contentChecksum([{ path: 'a.md', sha256: SHA_B }])
    expect(before).not.toBe(after)
  })

  test('changes when a file is renamed', async () => {
    const before = await contentChecksum([{ path: 'a.md', sha256: SHA_A }])
    const after = await contentChecksum([{ path: 'renamed.md', sha256: SHA_A }])
    expect(before).not.toBe(after)
  })
})

describe('buildManifest', () => {
  test('assembles a manifest that satisfies the schema', async () => {
    const manifest = await buildManifest(input())

    expect(ManifestSchema.safeParse(manifest).success).toBe(true)
    expect(manifest.schema_version).toBe(MANIFEST_VERSION)
    expect(manifest.file_count).toBe(1)
    expect(manifest.generated_at).toBe('2026-09-11T00:00:00.000Z')
    expect(manifest.upstream.ref).toBe('v4.1.1')
  })

  test('records file_count from the entries it checksums', async () => {
    const manifest = await buildManifest(
      input({
        entries: [
          { path: 'a.md', sha256: SHA_A },
          { path: 'b.md', sha256: SHA_B },
        ],
      }),
    )
    expect(manifest.file_count).toBe(2)
  })

  test('allows a null converter commit for a dirty working tree', async () => {
    const manifest = await buildManifest(
      input({ converter: { commit: null, antora: '3.2.0', asciidoctor: '2.2.8' } }),
    )
    expect(manifest.converter.commit).toBeNull()
  })

  test('rejects an abbreviated upstream commit', async () => {
    await expect(
      buildManifest(
        input({
          upstream: {
            repo: 'spring-projects/spring-boot',
            ref: 'v4.1.1',
            commit: 'c921f13',
            archives: [],
          },
        }),
      ),
    ).rejects.toThrow(/schema validation/)
  })
})

describe('ManifestSchema', () => {
  test('rejects a mismatched schema version', () => {
    expect(
      ManifestSchema.safeParse({ schema_version: '2', project: 'boot' }).success,
    ).toBe(false)
  })
})
