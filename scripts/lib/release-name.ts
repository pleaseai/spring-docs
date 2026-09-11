/**
 * The `<project>-<version>` naming shared by converted trees, archives and tags.
 *
 * Pure. One place owns the split so packaging and promotion cannot disagree
 * about where a directory name ends and a version begins.
 */

/** A version, possibly carrying a rebuild suffix: `4.1.1`, `4.1.1+rebuild.1`. */
const VERSION = /^\d[\w.+-]*$/

/** One `(project, version)` pair, as carried by a directory or tag name. */
export interface ReleaseName {
  readonly project: string
  readonly version: string
}

/** Directory and tag name for a pair. */
export function releaseName(project: string, version: string): string {
  return `${project}-${version}`
}

/**
 * Split a `<project>-<version>` name.
 *
 * The project key never contains a hyphen-then-digit, so the split is taken at
 * the first hyphen that a version follows — `boot-4.1.1` and, for a hyphenated
 * project key, `data-jpa-4.1.1` both resolve correctly.
 *
 * @throws if the name is not a release name.
 */
export function parseReleaseName(name: string): ReleaseName {
  for (let index = name.indexOf('-'); index !== -1; index = name.indexOf('-', index + 1)) {
    const project = name.slice(0, index)
    const version = name.slice(index + 1)
    if (project.length > 0 && VERSION.test(version))
      return { project, version }
  }
  throw new Error(`"${name}" is not a <project>-<version> name, e.g. "boot-4.1.1"`)
}
