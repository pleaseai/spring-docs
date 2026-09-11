/**
 * Decide which phases of a release a run still owes.
 *
 * Publishing the archive and recording it in `catalog.json` are two phases of
 * one release, and only the first is protected by tag immutability. A run that
 * publishes and then fails before the catalog pull request exists leaves a
 * version that is downloadable but undiscoverable: `catalog.json` is the index
 * consumers resolve `(project, version) → tag` through (ARCHITECTURE.md), so a
 * release missing from it does not exist as far as they are concerned.
 *
 * Re-running is therefore the recovery path, which means the run must be able
 * to tell "nothing has happened yet" from "publication succeeded, registration
 * did not". Those are distinguished by exactly two observable facts: whether
 * the release exists, and whether the catalog on the default branch already
 * names this tag.
 *
 * Recovery arrives an arbitrary time after publication, so a third case falls
 * out of the same two facts: the catalog may by then name a *newer* rebuild of
 * this `(project, version)`. Registering the older tag would be a valid catalog
 * write — `catalog-update.ts` permits repointing an entry at any rebuild of its
 * own pair — that walks consumers backwards onto a superseded archive. A run
 * whose tag the catalog has moved past owes nothing.
 *
 * Pure — the caller observes both facts and applies the verdict.
 */

/**
 * What a run still has to do.
 *
 * - `publish` — nothing has been published; run the whole release.
 * - `register` — the archive is published but the catalog does not name it;
 *   skip publication and record it, once the published bytes are shown to
 *   match this run's rebuild.
 * - `complete` — the run is a no-op, because it owes nothing: both phases are
 *   done, or the catalog has already moved past this tag to a newer rebuild.
 *   The modes are named after what a run still owes rather than after the state
 *   it found (ADR-0003), so both cases are the same instruction to the caller.
 */
export type ReleaseMode = 'publish' | 'register' | 'complete'

/** The two facts a release mode is derived from. */
export interface ReleaseState {
  /** The tag being released — `<project>-<version>[+rebuild.N]`. */
  readonly tag: string
  /** Whether a GitHub Release already exists for {@link tag}. */
  readonly releaseExists: boolean
  /**
   * The tag `catalog.json` records for this `(project, version)` on the default
   * branch, or `null` when it records nothing for it.
   *
   * A different tag is not "registered" — that is what a `+rebuild.N` run looks
   * like before it repoints the entry — unless it is a *newer* rebuild of the
   * same pair, which supersedes this tag rather than leaving it outstanding.
   */
  readonly catalogTag: string | null
}

/** A `+rebuild.N` suffix, splitting a tag into the pair it belongs to and `N`. */
const REBUILD_SUFFIX = /^(?<base>.+)\+rebuild\.(?<ordinal>\d+)$/

/**
 * How far along the rebuild sequence a tag sits.
 *
 * The base tag is ordinal 0 — it is the first archive published for its pair,
 * and `+rebuild.1` is the first correction to it, so the same comparison orders
 * a base tag against its rebuilds without a special case.
 */
function rebuildOrdinal(tag: string): { base: string, ordinal: number } {
  const groups = REBUILD_SUFFIX.exec(tag)?.groups
  return groups?.base === undefined || groups.ordinal === undefined
    ? { base: tag, ordinal: 0 }
    : { base: groups.base, ordinal: Number(groups.ordinal) }
}

/**
 * True when `catalogTag` is a later rebuild of the same pair as `tag`.
 *
 * Tags with different bases are not compared: the workflow derives the catalog
 * lookup from the tag's own `(project, version)`, so a mismatch means the
 * catalog was hand-edited. `applyEntry` refuses that write with a message about
 * the specific tags, which is a better error than anything decided here.
 */
function isSupersededBy(tag: string, catalogTag: string): boolean {
  const current = rebuildOrdinal(tag)
  const recorded = rebuildOrdinal(catalogTag)
  return recorded.base === current.base && recorded.ordinal > current.ordinal
}

/**
 * Classify a release run.
 *
 * @throws when the catalog names a tag whose release does not exist. That
 * combination cannot arise from an interrupted run — registration only ever
 * happens after publication — so it means the release was deleted or the
 * catalog was hand-edited. Either way the index is already lying to consumers,
 * and continuing would paper over it.
 */
export function classifyRelease(state: ReleaseState): ReleaseMode {
  const registered = state.catalogTag === state.tag

  if (!state.releaseExists) {
    if (registered) {
      throw new Error(
        `catalog.json records tag "${state.tag}" but no such release exists. `
        + 'A release is never recorded before it is published, so the release was '
        + 'deleted or the catalog was edited by hand; repair the catalog before re-running.',
      )
    }
    return 'publish'
  }

  if (registered)
    return 'complete'

  // Published, unregistered, and the catalog has already moved on: the entry
  // this run would write is the one a later rebuild replaced on purpose.
  if (state.catalogTag !== null && isSupersededBy(state.tag, state.catalogTag))
    return 'complete'

  return 'register'
}
