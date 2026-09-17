import type { ReleaseMode, ReleaseState } from '../../scripts/lib/release-state.ts'
import { describe, expect, test } from 'bun:test'
import { classifyRelease } from '../../scripts/lib/release-state.ts'

/**
 * One classification case: the two observable facts, and the mode they imply.
 *
 * Every verdict is a pure function of the same three fields, so the cases are a
 * table rather than a dozen near-identical blocks — the rationale that used to
 * sit in each block is the `why` on its row.
 */
interface Case extends ReleaseState {
  readonly name: string
  readonly why?: string
  readonly expected: ReleaseMode
}

const CASES: readonly Case[] = [
  {
    name: 'publishes when neither the release nor the catalog entry exists',
    tag: 'boot-4.1.1',
    releaseExists: false,
    catalogTag: null,
    expected: 'publish',
  },
  {
    name: 'registers when the release exists but the catalog does not name it',
    why: 'The failure this whole module exists for: `gh release create` succeeded '
      + 'and the catalog pull request never got made.',
    tag: 'boot-4.1.1',
    releaseExists: true,
    catalogTag: null,
    expected: 'register',
  },
  {
    name: 'is complete when the release exists and the catalog names it',
    tag: 'boot-4.1.1',
    releaseExists: true,
    catalogTag: 'boot-4.1.1',
    expected: 'complete',
  },
  {
    name: 'publishes a rebuild the catalog has not reached yet',
    why: 'The catalog still points at the base tag, which is the normal state when '
      + 'a `+rebuild.N` tag is pushed. The rebuild owes both phases.',
    tag: 'boot-4.1.1+rebuild.1',
    releaseExists: false,
    catalogTag: 'boot-4.1.1',
    expected: 'publish',
  },
  {
    name: 'registers a published rebuild the catalog still points away from',
    why: 'Recovery for a rebuild: its release exists, but the entry was never '
      + 'repointed at it. A different tag is not "registered".',
    tag: 'boot-4.1.1+rebuild.1',
    releaseExists: true,
    catalogTag: 'boot-4.1.1',
    expected: 'register',
  },
  {
    name: 'is complete once the catalog points at the rebuild',
    tag: 'boot-4.1.1+rebuild.1',
    releaseExists: true,
    catalogTag: 'boot-4.1.1+rebuild.1',
    expected: 'complete',
  },
  {
    name: 'is complete when a newer rebuild has superseded this tag',
    why: 'rebuild.1 published but never got registered; rebuild.2 was cut and '
      + 'completed both phases in the meantime. Re-running rebuild.1 must not '
      + 'reopen a catalog pull request walking consumers back onto it.',
    tag: 'boot-4.1.1+rebuild.1',
    releaseExists: true,
    catalogTag: 'boot-4.1.1+rebuild.2',
    expected: 'complete',
  },
  {
    name: 'is complete when a newer rebuild superseded a tag that was never published',
    why: 'The rebuild.1 run failed before `gh release create`, so rebuild.2 was cut and '
      + 'completed both phases instead. Re-running the stale rebuild.1 job owes nothing: '
      + 'publishing it would be harmless on its own, but the catalog write that follows '
      + 'repoints the entry back onto it and drags `released_at` backwards with it.',
    tag: 'boot-4.1.1+rebuild.1',
    releaseExists: false,
    catalogTag: 'boot-4.1.1+rebuild.2',
    expected: 'complete',
  },
  {
    name: 'is complete when a rebuild has superseded the base tag',
    why: 'The same supersession seen from ordinal 0: the base tag is published and '
      + 'was the catalog entry until a rebuild replaced it.',
    tag: 'boot-4.1.1',
    releaseExists: true,
    catalogTag: 'boot-4.1.1+rebuild.1',
    expected: 'complete',
  },
  {
    name: 'is complete when a rebuild superseded a base tag that was never published',
    why: 'The same supersession at ordinal 0: the original tag never got a release, and '
      + 'the rebuild cut in its place is what consumers resolve to now.',
    tag: 'boot-4.1.1',
    releaseExists: false,
    catalogTag: 'boot-4.1.1+rebuild.1',
    expected: 'complete',
  },
  {
    name: 'orders rebuild suffixes numerically, not lexicographically',
    why: '"10" < "9" as text, which would read the catalog as being behind and '
      + 'register rebuild.9 over the rebuild.10 that replaced it.',
    tag: 'boot-4.1.1+rebuild.9',
    releaseExists: true,
    catalogTag: 'boot-4.1.1+rebuild.10',
    expected: 'complete',
  },
  {
    name: 'orders rebuild ordinals past the safe-integer range',
    why: 'As doubles these two ordinals are the same value, so the catalog would '
      + 'not read as ahead and this run would register over the rebuild that '
      + 'replaced it — walking consumers back onto a superseded archive.',
    tag: 'boot-4.1.1+rebuild.9007199254740992',
    releaseExists: true,
    catalogTag: 'boot-4.1.1+rebuild.9007199254740993',
    expected: 'complete',
  },
  {
    name: 'still registers when the catalog names an older rebuild',
    why: 'Supersession is strictly forward: a catalog left behind by this tag is '
      + 'the ordinary rebuild flow and still owes registration.',
    tag: 'boot-4.1.1+rebuild.2',
    releaseExists: true,
    catalogTag: 'boot-4.1.1+rebuild.1',
    expected: 'register',
  },
  {
    name: 'does not treat a different pair as superseding this tag',
    why: 'Only a hand-edited catalog puts another pair\'s tag here. Registration '
      + 'proceeds so `applyEntry` refuses it by name rather than this module '
      + 'silently reporting nothing to do.',
    tag: 'boot-4.1.1',
    releaseExists: true,
    catalogTag: 'boot-4.1.2+rebuild.1',
    expected: 'register',
  },
]

describe('classifyRelease', () => {
  for (const { name, why: _why, expected, ...state } of CASES) {
    test(name, () => {
      expect(classifyRelease(state)).toBe(expected)
    })
  }

  // The one case that is not a mode: a catalog entry whose release is gone can
  // only come from a deletion or a hand edit, and the index is already lying.
  test('refuses a catalog entry whose release is gone', () => {
    expect(() => classifyRelease({
      tag: 'boot-4.1.1',
      releaseExists: false,
      catalogTag: 'boot-4.1.1',
    })).toThrow(/no such release exists/)
  })
})
