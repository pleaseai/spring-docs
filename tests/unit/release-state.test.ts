import { describe, expect, test } from 'bun:test'
import { classifyRelease } from '../../scripts/lib/release-state.ts'

describe('classifyRelease', () => {
  test('publishes when neither the release nor the catalog entry exists', () => {
    expect(classifyRelease({
      tag: 'boot-4.1.1',
      releaseExists: false,
      catalogTag: null,
    })).toBe('publish')
  })

  test('registers when the release exists but the catalog does not name it', () => {
    // The failure this whole module exists for: `gh release create` succeeded
    // and the catalog pull request never got made.
    expect(classifyRelease({
      tag: 'boot-4.1.1',
      releaseExists: true,
      catalogTag: null,
    })).toBe('register')
  })

  test('is complete when the release exists and the catalog names it', () => {
    expect(classifyRelease({
      tag: 'boot-4.1.1',
      releaseExists: true,
      catalogTag: 'boot-4.1.1',
    })).toBe('complete')
  })

  test('refuses a catalog entry whose release is gone', () => {
    expect(() => classifyRelease({
      tag: 'boot-4.1.1',
      releaseExists: false,
      catalogTag: 'boot-4.1.1',
    })).toThrow(/no such release exists/)
  })

  test('publishes a rebuild the catalog has not reached yet', () => {
    // The catalog still points at the base tag, which is the normal state when
    // a `+rebuild.N` tag is pushed. The rebuild owes both phases.
    expect(classifyRelease({
      tag: 'boot-4.1.1+rebuild.1',
      releaseExists: false,
      catalogTag: 'boot-4.1.1',
    })).toBe('publish')
  })

  test('registers a published rebuild the catalog still points away from', () => {
    // Recovery for a rebuild: its release exists, but the entry was never
    // repointed at it. A different tag is not "registered".
    expect(classifyRelease({
      tag: 'boot-4.1.1+rebuild.1',
      releaseExists: true,
      catalogTag: 'boot-4.1.1',
    })).toBe('register')
  })

  test('is complete once the catalog points at the rebuild', () => {
    expect(classifyRelease({
      tag: 'boot-4.1.1+rebuild.1',
      releaseExists: true,
      catalogTag: 'boot-4.1.1+rebuild.1',
    })).toBe('complete')
  })
})
