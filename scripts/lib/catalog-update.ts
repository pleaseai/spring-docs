import type { Catalog } from './catalog-schema.ts'
import { compareVersionKeys } from './upstream-sources.ts'

/**
 * Pure catalog mutations.
 *
 * `catalog.json` is the public index consumers resolve `(project, version) → tag`
 * through. These functions own how an entry is applied and how the file is
 * serialized; `scripts/update-catalog.ts` owns reading and writing it.
 */

/** One catalog entry to apply. */
export interface CatalogEntry {
  readonly project: string
  readonly version: string
  readonly tag: string
  /** ISO-8601 publish time, or null while the tag exists but the release does not. */
  readonly releasedAt: string | null
}

/** The `N` of a `+rebuild.N` tag suffix. */
const REBUILD_ORDINAL = /^\d+$/

/** The one tag a `(project, version)` is published under, absent a rebuild. */
function baseTagFor(entry: CatalogEntry): string {
  return `${entry.project}-${entry.version}`
}

/**
 * True when `tag` is a rebuild of exactly this `(project, version)`.
 *
 * Rebuilds are published under a suffixed tag (`boot-4.1.1+rebuild.1`) so the
 * original tag keeps resolving to the bytes it always did. The suffix must be
 * exactly `+rebuild.<n>`: any other plus-suffix would otherwise be accepted as
 * a rebuild and license repointing an existing entry at an unrelated tag,
 * which is the very thing {@link applyEntry} exists to refuse.
 */
function isRebuildTag(entry: CatalogEntry): boolean {
  const prefix = `${baseTagFor(entry)}+rebuild.`
  return entry.tag.startsWith(prefix) && REBUILD_ORDINAL.test(entry.tag.slice(prefix.length))
}

/**
 * Apply one entry to a catalog.
 *
 * Pure — the caller owns reading and writing the file.
 *
 * A published tag is never deleted or moved, but the catalog entry may be
 * repointed at a *rebuild* of the same `(project, version)` — that is how
 * consumers reach the corrected archive. Suffix ordering is not enforced here:
 * the catalog records the rebuild that was last published, not the highest one.
 *
 * A known `released_at` is never un-published: an entry that omits it while the
 * catalog already records one for the *same* tag keeps the recorded timestamp.
 * Omission means "the tag exists but its release does not yet", which cannot
 * become true again once the release is published.
 *
 * @throws if the tag is neither this `(project, version)`'s base tag nor a
 * rebuild of it, or if it would repoint an existing entry at any other tag.
 * Tags are immutable contracts.
 */
export function applyEntry(
  catalog: Catalog,
  entry: CatalogEntry,
  generatedAt: Date,
): Catalog {
  const baseTag = baseTagFor(entry)
  if (entry.tag !== baseTag && !isRebuildTag(entry)) {
    throw new Error(
      `Tag "${entry.tag}" does not belong to ${entry.project} ${entry.version}. `
      + `Use "${baseTag}", or "${baseTag}+rebuild.<n>" for a rebuild.`,
    )
  }

  const existing = catalog.projects[entry.project]?.[entry.version]
  if (existing && existing.tag !== entry.tag && !isRebuildTag(entry)) {
    throw new Error(
      `${entry.project} ${entry.version} already resolves to tag "${existing.tag}". `
      + `Tags are immutable — publish "${entry.tag}" as a rebuild suffix instead of repointing.`,
    )
  }

  const releasedAt = entry.releasedAt
    ?? (existing?.tag === entry.tag ? existing.released_at : null)

  return {
    ...catalog,
    generated_at: generatedAt.toISOString(),
    projects: {
      ...catalog.projects,
      [entry.project]: {
        ...catalog.projects[entry.project],
        [entry.version]: { tag: entry.tag, released_at: releasedAt },
      },
    },
  }
}

/**
 * Serialize a catalog with keys in a stable order.
 *
 * Projects and versions are sorted so an unrelated rebuild never produces a
 * reordering diff, keeping catalog history readable.
 */
export function serializeCatalog(catalog: Catalog): string {
  const projects: Catalog['projects'] = {}
  for (const project of Object.keys(catalog.projects).sort()) {
    const versions = catalog.projects[project] ?? {}
    const sorted: (typeof versions) = {}
    // Numeric, not lexicographic — otherwise "4.10.0" sorts before "4.9.0" once
    // a minor/patch reaches double digits, defeating the readable-history goal.
    // `compareVersionKeys`, not `compareGaVersions`: the catalog can legitimately
    // hold a non-GA key (see its doc comment), and serialization must not throw
    // on one.
    for (const version of Object.keys(versions).sort(compareVersionKeys)) {
      const entry = versions[version]
      if (entry)
        sorted[version] = entry
    }
    projects[project] = sorted
  }
  return `${JSON.stringify({ ...catalog, projects }, null, 2)}\n`
}
