/**
 * Layout of a converted tree: where each page lands, and the generated listing.
 *
 * Pure — no I/O. `convert.ts` owns the writing.
 */

import type { AntoraPage } from './antora-types.ts'
import { join } from 'node:path'

/**
 * Filename of the generated listing.
 *
 * Deliberately underscore-prefixed. The obvious `INDEX.md` collides with the
 * `index.md` that Antora's own `index.adoc` produces on a case-insensitive
 * filesystem — silently replacing the upstream page on macOS while leaving both
 * files on Linux, so the same input yielded different trees per platform.
 */
export const INDEX_FILENAME = '_index.md'

/** The `.adoc` extension of a page's source path. */
const ADOC_EXTENSION = /\.adoc$/

/** The `.md` extension of a converted page. */
const MD_EXTENSION = /\.md$/

/**
 * Output path for one page, relative to the converted tree.
 *
 * Mirrors Antora's URL shape: the ROOT module lives at the tree root, every
 * other module under its own directory.
 */
export function outputPathFor(page: AntoraPage): string {
  const relative = page.src.relative.replace(ADOC_EXTENSION, '.md')
  return page.src.module === 'ROOT' ? relative : join(page.src.module, relative)
}

/**
 * Reject output paths that cannot coexist in one tree.
 *
 * Two pages can map onto the same file — a ROOT page under `guide/` and a
 * `guide` module of the same name, or two paths differing only in case — and a
 * converted tree must never depend on which page happened to be written last,
 * nor on whether the filesystem folds case.
 *
 * @throws if any two paths collide.
 */
export function assertUniquePaths(paths: readonly string[]): void {
  const seen = new Map<string, string>()
  for (const path of paths) {
    const key = path.toLowerCase()
    const previous = seen.get(key)
    if (previous !== undefined) {
      throw new Error(
        `Output path collision: "${previous}" and "${path}" resolve to the same file. `
        + `Paths are compared case-insensitively because not every filesystem distinguishes them.`,
      )
    }
    seen.set(key, path)
  }
}

/** Deterministic index of the converted tree. */
export function buildIndex(
  project: string,
  version: string,
  paths: readonly string[],
): string {
  const sorted = [...paths].sort()
  return [
    `# ${project} ${version}`,
    '',
    `${sorted.length} pages, converted from upstream Spring AsciiDoc.`,
    '',
    ...sorted.map(path => `- [${path.replace(MD_EXTENSION, '')}](./${path})`),
    '',
  ].join('\n')
}
