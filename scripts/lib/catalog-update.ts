import type { Catalog } from './catalog-schema.ts'

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

/**
 * Apply one entry to a catalog.
 *
 * Pure — the caller owns reading and writing the file.
 *
 * @throws if the entry would repoint an existing `(project, version)` at a
 * different tag. Tags are immutable contracts; a rebuild gets a suffixed tag
 * (`boot-4.1.1+rebuild.1`) rather than overwriting one.
 */
export function applyEntry(
  catalog: Catalog,
  entry: CatalogEntry,
  generatedAt: Date,
): Catalog {
  const existing = catalog.projects[entry.project]?.[entry.version]
  if (existing && existing.tag !== entry.tag) {
    throw new Error(
      `${entry.project} ${entry.version} already resolves to tag "${existing.tag}". `
      + `Tags are immutable — publish "${entry.tag}" as a rebuild suffix instead of repointing.`,
    )
  }

  return {
    ...catalog,
    generated_at: generatedAt.toISOString(),
    projects: {
      ...catalog.projects,
      [entry.project]: {
        ...catalog.projects[entry.project],
        [entry.version]: { tag: entry.tag, released_at: entry.releasedAt },
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
    for (const version of Object.keys(versions).sort()) {
      const entry = versions[version]
      if (entry)
        sorted[version] = entry
    }
    projects[project] = sorted
  }
  return `${JSON.stringify({ ...catalog, projects }, null, 2)}\n`
}
