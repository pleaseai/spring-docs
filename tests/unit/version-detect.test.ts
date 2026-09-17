import type { Catalog } from '../../scripts/lib/catalog-schema.ts'
import { describe, expect, test } from 'bun:test'
import { missingVersions, parseTagRefs } from '../../scripts/lib/version-detect.ts'

const SHA = '6fdf67ea1552691e932604d4bf67a5e08ff0b0ea'

function catalog(projects: Catalog['projects']): Catalog {
  return { version: '1', generated_at: null, projects }
}

describe('parseTagRefs', () => {
  test('extracts tag names from ls-remote output', () => {
    expect(parseTagRefs(`${SHA}\trefs/tags/v4.1.1\n${SHA}\trefs/tags/v4.1.0\n`))
      .toEqual(['v4.1.1', 'v4.1.0'])
  })

  test('collapses the peeled entry an annotated tag adds', () => {
    expect(parseTagRefs(`${SHA}\trefs/tags/v4.1.1\n${SHA}\trefs/tags/v4.1.1^{}\n`))
      .toEqual(['v4.1.1'])
  })

  test('ignores blank lines and refs that are not tags', () => {
    expect(parseTagRefs(`\n${SHA}\trefs/heads/main\n${SHA}\trefs/tags/v4.1.1\n`))
      .toEqual(['v4.1.1'])
  })

  test('returns nothing for empty output', () => {
    expect(parseTagRefs('')).toEqual([])
  })
})

describe('missingVersions', () => {
  const tags = ['v4.0.8', 'v4.1.0', 'v4.1.1']

  test('reports every supported version when the catalog is empty', () => {
    expect(missingVersions(catalog({}), 'boot', tags)).toEqual(['4.0.8', '4.1.0', '4.1.1'])
  })

  test('omits versions the catalog already carries', () => {
    const known = catalog({ boot: { '4.1.0': { tag: 'boot-4.1.0', released_at: null } } })
    expect(missingVersions(known, 'boot', tags)).toEqual(['4.0.8', '4.1.1'])
  })

  test('ignores other projects in the catalog', () => {
    const other = catalog({ framework: { '4.1.1': { tag: 'framework-4.1.1', released_at: null } } })
    expect(missingVersions(other, 'boot', tags)).toEqual(['4.0.8', '4.1.0', '4.1.1'])
  })

  test('drops pre-releases and versions no layout era covers', () => {
    // 3.5.0 and 4.0.7 are built from the two synthesized eras; 3.2.12 predates
    // every era, and only era membership can tell it from the rest.
    const noisy = ['v3.2.12', 'v3.5.0', 'v4.0.7', 'v4.1.0', 'v4.2.0-M1', 'v4.2.0-RC1', 'not-a-tag']
    expect(missingVersions(catalog({}), 'boot', noisy)).toEqual(['3.5.0', '4.0.7', '4.1.0'])
  })

  test('sorts numerically, oldest first, so callers can take the newest few', () => {
    const unordered = ['v4.10.0', 'v4.9.0', 'v4.1.1']
    expect(missingVersions(catalog({}), 'boot', unordered)).toEqual(['4.1.1', '4.9.0', '4.10.0'])
  })

  test('rejects an unsupported project rather than reporting nothing to build', () => {
    expect(() => missingVersions(catalog({}), 'cloud', tags)).toThrow(/Unknown project "cloud"/)
  })
})
