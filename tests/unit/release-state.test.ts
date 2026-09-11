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

  test('is complete when a newer rebuild has superseded this tag', () => {
    // rebuild.1 published but never got registered; rebuild.2 was cut and
    // completed both phases in the meantime. Re-running rebuild.1 must not
    // reopen a catalog pull request walking consumers back onto it.
    expect(classifyRelease({
      tag: 'boot-4.1.1+rebuild.1',
      releaseExists: true,
      catalogTag: 'boot-4.1.1+rebuild.2',
    })).toBe('complete')
  })

  test('is complete when a rebuild has superseded the base tag', () => {
    // The same supersession seen from ordinal 0: the base tag is published and
    // was the catalog entry until a rebuild replaced it.
    expect(classifyRelease({
      tag: 'boot-4.1.1',
      releaseExists: true,
      catalogTag: 'boot-4.1.1+rebuild.1',
    })).toBe('complete')
  })

  test('orders rebuild suffixes numerically, not lexicographically', () => {
    // "10" < "9" as text, which would read the catalog as being behind and
    // register rebuild.9 over the rebuild.10 that replaced it.
    expect(classifyRelease({
      tag: 'boot-4.1.1+rebuild.9',
      releaseExists: true,
      catalogTag: 'boot-4.1.1+rebuild.10',
    })).toBe('complete')
  })

  test('orders rebuild ordinals past the safe-integer range', () => {
    // As doubles these two ordinals are the same value, so the catalog would
    // not read as ahead and this run would register over the rebuild that
    // replaced it — walking consumers back onto a superseded archive.
    expect(classifyRelease({
      tag: 'boot-4.1.1+rebuild.9007199254740992',
      releaseExists: true,
      catalogTag: 'boot-4.1.1+rebuild.9007199254740993',
    })).toBe('complete')
  })

  test('still registers when the catalog names an older rebuild', () => {
    // Supersession is strictly forward: a catalog left behind by this tag is
    // the ordinary rebuild flow and still owes registration.
    expect(classifyRelease({
      tag: 'boot-4.1.1+rebuild.2',
      releaseExists: true,
      catalogTag: 'boot-4.1.1+rebuild.1',
    })).toBe('register')
  })

  test('does not treat a different pair as superseding this tag', () => {
    // Only a hand-edited catalog puts another pair's tag here. Registration
    // proceeds so `applyEntry` refuses it by name rather than this module
    // silently reporting nothing to do.
    expect(classifyRelease({
      tag: 'boot-4.1.1',
      releaseExists: true,
      catalogTag: 'boot-4.1.2+rebuild.1',
    })).toBe('register')
  })
})
