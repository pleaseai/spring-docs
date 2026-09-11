import type { Catalog } from '../../scripts/lib/catalog-schema.ts'
import { describe, expect, test } from 'bun:test'
import { CATALOG_VERSION, CatalogSchema } from '../../scripts/lib/catalog-schema.ts'
import { applyEntry, serializeCatalog } from '../../scripts/lib/catalog-update.ts'

const NOW = new Date('2026-09-11T00:00:00.000Z')

function emptyCatalog(): Catalog {
  return { version: CATALOG_VERSION, generated_at: null, projects: {} }
}

describe('applyEntry', () => {
  test('adds a new (project, version) entry and stamps generated_at', () => {
    const updated = applyEntry(
      emptyCatalog(),
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: null },
      NOW,
    )

    expect(updated.projects.boot?.['4.1.1']).toEqual({ tag: 'boot-4.1.1', released_at: null })
    expect(updated.generated_at).toBe('2026-09-11T00:00:00.000Z')
    expect(CatalogSchema.safeParse(updated).success).toBe(true)
  })

  test('keeps other versions of the same project', () => {
    const seeded = applyEntry(
      emptyCatalog(),
      { project: 'boot', version: '4.0.8', tag: 'boot-4.0.8', releasedAt: null },
      NOW,
    )
    const updated = applyEntry(
      seeded,
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: null },
      NOW,
    )

    expect(Object.keys(updated.projects.boot ?? {}).sort()).toEqual(['4.0.8', '4.1.1'])
  })

  test('does not mutate the catalog it was given', () => {
    const original = emptyCatalog()
    applyEntry(original, { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: null }, NOW)
    expect(original.projects).toEqual({})
  })

  test('refuses a tag that is neither the base tag nor a rebuild of it', () => {
    const seeded = applyEntry(
      emptyCatalog(),
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: null },
      NOW,
    )

    expect(() =>
      applyEntry(
        seeded,
        { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1-take2', releasedAt: null },
        NOW,
      ),
    ).toThrow(/does not belong to/)
  })

  test('refuses a foreign tag on a version the catalog does not know yet', () => {
    // The ownership check must not depend on an entry already existing: a first
    // publication is exactly when a wrong tag becomes the recorded one.
    expect(() =>
      applyEntry(
        emptyCatalog(),
        { project: 'boot', version: '4.1.1', tag: 'boot-9.9.9', releasedAt: null },
        NOW,
      ),
    ).toThrow(/does not belong to/)
  })

  test('refuses a plus-suffix that is not a +rebuild.N', () => {
    expect(() =>
      applyEntry(
        emptyCatalog(),
        { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1+hotfix', releasedAt: null },
        NOW,
      ),
    ).toThrow(/does not belong to/)
  })

  test('keeps a recorded released_at when the same tag is re-applied without one', () => {
    // `--released-at` is omitted while a release is still unpublished; once it
    // exists, a rerun that omits the flag must not un-publish the entry.
    const published = applyEntry(
      emptyCatalog(),
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: '2026-09-11T01:00:00.000Z' },
      NOW,
    )
    const rerun = applyEntry(
      published,
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: null },
      NOW,
    )

    expect(rerun.projects.boot?.['4.1.1']?.released_at).toBe('2026-09-11T01:00:00.000Z')
  })

  test('allows re-applying the same tag, so a rerun is idempotent', () => {
    const seeded = applyEntry(
      emptyCatalog(),
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: null },
      NOW,
    )
    const rerun = applyEntry(
      seeded,
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: '2026-09-11T01:00:00.000Z' },
      NOW,
    )

    expect(rerun.projects.boot?.['4.1.1']?.released_at).toBe('2026-09-11T01:00:00.000Z')
  })
})

describe('serializeCatalog', () => {
  test('sorts projects and versions so rebuilds do not reorder the file', () => {
    let catalog = emptyCatalog()
    for (const [project, version] of [
      ['framework', '7.0.0'],
      ['boot', '4.1.1'],
      ['boot', '4.0.8'],
    ] as const) {
      catalog = applyEntry(
        catalog,
        { project, version, tag: `${project}-${version}`, releasedAt: null },
        NOW,
      )
    }

    const keys = [...serializeCatalog(catalog).matchAll(/^ {4}"([^"]+)"|^ {6}"([^"]+)"/gm)]
    const text = serializeCatalog(catalog)
    expect(text.indexOf('"boot"')).toBeLessThan(text.indexOf('"framework"'))
    expect(text.indexOf('"4.0.8"')).toBeLessThan(text.indexOf('"4.1.1"'))
    expect(keys.length).toBeGreaterThan(0)
  })

  test('sorts versions numerically, not lexicographically', () => {
    let catalog = emptyCatalog()
    for (const version of ['4.10.0', '4.9.0']) {
      catalog = applyEntry(
        catalog,
        { project: 'boot', version, tag: `boot-${version}`, releasedAt: null },
        NOW,
      )
    }

    const text = serializeCatalog(catalog)
    expect(text.indexOf('"4.9.0"')).toBeLessThan(text.indexOf('"4.10.0"'))
  })

  test('ends with exactly one trailing newline', () => {
    const text = serializeCatalog(emptyCatalog())
    expect(text.endsWith('}\n')).toBe(true)
    expect(text.endsWith('\n\n')).toBe(false)
  })

  test('serializes a non-GA version key instead of throwing', () => {
    // catalog-schema.ts types version keys as any non-empty string, and a
    // pre-release key passes validate-catalog.ts, so serialization must stay
    // total even though compareGaVersions itself refuses non-GA input.
    const catalog = applyEntry(
      emptyCatalog(),
      { project: 'boot', version: '4.2.0-RC1', tag: 'boot-4.2.0-RC1', releasedAt: null },
      NOW,
    )

    expect(() => serializeCatalog(catalog)).not.toThrow()
    expect(serializeCatalog(catalog)).toContain('"4.2.0-RC1"')
  })
})

describe('applyEntry rebuilds', () => {
  const published: Catalog = {
    version: '1',
    generated_at: '2026-09-11T00:00:00Z',
    projects: { boot: { '4.1.1': { tag: 'boot-4.1.1', released_at: '2026-09-11T00:00:00Z' } } },
  }

  test('repoints a version at a rebuild of the same version', () => {
    const updated = applyEntry(
      published,
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1+rebuild.1', releasedAt: null },
      new Date('2026-09-12T00:00:00Z'),
    )
    expect(updated.projects.boot?.['4.1.1']).toEqual({
      tag: 'boot-4.1.1+rebuild.1',
      released_at: null,
    })
  })

  test('refuses to fall back from a rebuild to the original tag', () => {
    const rebuilt = applyEntry(
      published,
      { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1+rebuild.1', releasedAt: null },
      new Date('2026-09-12T00:00:00Z'),
    )
    expect(() =>
      applyEntry(
        rebuilt,
        { project: 'boot', version: '4.1.1', tag: 'boot-4.1.1', releasedAt: null },
        new Date('2026-09-13T00:00:00Z'),
      ),
    ).toThrow(/immutable/)
  })

  test('refuses a tag belonging to a different version', () => {
    expect(() =>
      applyEntry(
        published,
        { project: 'boot', version: '4.1.1', tag: 'boot-4.1.2+rebuild.1', releasedAt: null },
        new Date('2026-09-12T00:00:00Z'),
      ),
    ).toThrow(/does not belong to/)
  })
})
