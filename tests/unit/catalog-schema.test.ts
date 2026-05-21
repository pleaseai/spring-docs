import { describe, expect, test } from 'bun:test'
import { CATALOG_VERSION, CatalogSchema } from '../../scripts/lib/catalog-schema.ts'

describe('CatalogSchema', () => {
  test('accepts the empty placeholder shape (version + null generated_at + empty projects)', () => {
    const placeholder = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      version: CATALOG_VERSION,
      generated_at: null,
      projects: {},
    }

    const result = CatalogSchema.safeParse(placeholder)
    expect(result.success).toBe(true)
  })

  test('accepts a populated catalog with multiple projects and versions', () => {
    const populated = {
      version: CATALOG_VERSION,
      generated_at: '2026-05-21T03:25:41Z',
      projects: {
        framework: {
          '6.2.0': { tag: 'framework-6.2.0', released_at: '2026-05-21T03:25:41Z' },
          '6.1.5': { tag: 'framework-6.1.5', released_at: '2026-04-15T10:00:00Z' },
        },
        boot: {
          '3.4.0': { tag: 'boot-3.4.0', released_at: '2026-05-20T12:00:00Z' },
        },
      },
    }

    const result = CatalogSchema.safeParse(populated)
    expect(result.success).toBe(true)
  })

  test('rejects when version is not the literal "1"', () => {
    const wrongVersion = {
      version: '2',
      generated_at: null,
      projects: {},
    }

    const result = CatalogSchema.safeParse(wrongVersion)
    expect(result.success).toBe(false)
    if (!result.success) {
      const versionIssue = result.error.issues.find(i => i.path.includes('version'))
      expect(versionIssue).toBeDefined()
    }
  })

  test('rejects when projects is missing', () => {
    const missingProjects = {
      version: CATALOG_VERSION,
      generated_at: null,
    }

    const result = CatalogSchema.safeParse(missingProjects)
    expect(result.success).toBe(false)
  })

  test('rejects when a version entry is missing the tag', () => {
    const missingTag = {
      version: CATALOG_VERSION,
      generated_at: null,
      projects: {
        framework: {
          '6.2.0': { released_at: '2026-05-21T03:25:41Z' },
        },
      },
    }

    const result = CatalogSchema.safeParse(missingTag)
    expect(result.success).toBe(false)
  })

  test('rejects when released_at is not a valid ISO-8601 string', () => {
    const badTimestamp = {
      version: CATALOG_VERSION,
      generated_at: null,
      projects: {
        framework: {
          '6.2.0': { tag: 'framework-6.2.0', released_at: 'yesterday' },
        },
      },
    }

    const result = CatalogSchema.safeParse(badTimestamp)
    expect(result.success).toBe(false)
  })

  test('allows null released_at (for entries that exist before their build publishes)', () => {
    const pendingRelease = {
      version: CATALOG_VERSION,
      generated_at: null,
      projects: {
        framework: {
          '6.2.0': { tag: 'framework-6.2.0', released_at: null },
        },
      },
    }

    const result = CatalogSchema.safeParse(pendingRelease)
    expect(result.success).toBe(true)
  })

  test('rejects tags that contain whitespace or disallowed characters', () => {
    const badTag = {
      version: CATALOG_VERSION,
      generated_at: null,
      projects: {
        framework: {
          '6.2.0': { tag: 'spring framework 6.2.0', released_at: null },
        },
      },
    }

    const result = CatalogSchema.safeParse(badTag)
    expect(result.success).toBe(false)
  })
})
