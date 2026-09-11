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
 * Pure — the caller observes both facts and applies the verdict.
 */

/**
 * What a run still has to do.
 *
 * - `publish` — nothing has been published; run the whole release.
 * - `register` — the archive is published but the catalog does not name it;
 *   skip publication and record it, once the published bytes are shown to
 *   match this run's rebuild.
 * - `complete` — both phases are done; the run is a no-op.
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
   * A *different* tag is not "registered": that is what a `+rebuild.N` run
   * looks like before it repoints the entry, and it still owes registration.
   */
  readonly catalogTag: string | null
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

  return registered ? 'complete' : 'register'
}
