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

  test('refuses to repoint an existing version at a different tag', () => {
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
    ).toThrow(/immutable/)
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

  test('ends with exactly one trailing newline', () => {
    const text = serializeCatalog(emptyCatalog())
    expect(text.endsWith('}\n')).toBe(true)
    expect(text.endsWith('\n\n')).toBe(false)
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
    ).toThrow(/immutable/)
  })
})
