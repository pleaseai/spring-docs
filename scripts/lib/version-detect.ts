/**
 * Which upstream versions exist that the catalog does not carry yet.
 *
 * Pure — `detect-upstream-versions.ts` does the talking to git and the catalog.
 */

import type { Catalog } from './catalog-schema.ts'
import { supportedVersionsFromTags } from './upstream-sources.ts'

/**
 * A `git ls-remote --tags` line: `<sha>\trefs/tags/<name>`.
 *
 * Annotated tags are listed twice, the second with a `^{}` suffix naming the
 * commit the tag object points at; both yield the same tag name.
 */
const LS_REMOTE_LINE = /^[0-9a-f]+\s+refs\/tags\/(.+?)(?:\^\{\})?$/

/** Tag names in a `git ls-remote --tags` output, deduplicated, in listed order. */
export function parseTagRefs(output: string): readonly string[] {
  const names = new Set<string>()
  for (const line of output.split('\n')) {
    const match = LS_REMOTE_LINE.exec(line.trim())
    if (match?.[1] !== undefined)
      names.add(match[1])
  }
  return [...names]
}

/**
 * GA versions upstream has released that are absent from the catalog.
 *
 * Sorted oldest first, so a caller taking the newest few can slice from the end.
 *
 * @throws if the project is not supported.
 */
export function missingVersions(
  catalog: Catalog,
  project: string,
  tags: readonly string[],
): readonly string[] {
  const known = new Set(Object.keys(catalog.projects[project] ?? {}))
  return supportedVersionsFromTags(project, tags).filter(version => !known.has(version))
}
