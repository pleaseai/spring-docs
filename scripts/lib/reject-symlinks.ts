/**
 * Guard against symlink escapes in a tree about to be copied into the content source.
 *
 * `fetch-upstream.ts` `cp`s three trees into the committed Antora content
 * source with `{ recursive: true, force: true }`, which preserves symlinks
 * rather than following them (Bun's `cp` defaults to `dereference: false`,
 * verified empirically). A link under a page module could point anywhere on the
 * runner, and `initContentSource` runs `git add -A`, which stores it as a mode
 * 120000 entry the aggregator later reads.
 *
 * Two sources reach that copy, and neither is verified:
 *
 *   - the expanded archive — `unzip` recreates a zip's symlink entries as real
 *     filesystem symlinks, and `mergeArchive` only checks `response.ok`, with no
 *     checksum or signature against what Maven Central served
 *   - the git checkout — the component root and, for a synthesized era, the
 *     examples tree, both taken from the upstream release tag
 *
 * No supported tag carries such an entry today (`spring-projects/spring-boot` at
 * v3.3.0, v3.4.0, v3.5.0 and v3.5.16 has none, repo-wide), so this is a guard
 * against an upstream compromise or layout change rather than a live defect —
 * which is exactly why all three copies should hold the same invariant.
 */

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Recursively assert that every entry under `root` is a regular file or a
 * directory — never a symlink or anything else (device, socket, FIFO, …).
 *
 * `Dirent` entries reflect the type collected during the directory scan
 * itself, without following symlinks, so no separate `lstat` is needed.
 *
 * @throws on the first offending entry, naming its path.
 */
export async function assertNoSymlinks(root: string): Promise<void> {
  const entries = await readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isSymbolicLink())
      throw new Error(`Refusing to copy a symlink into the content source: ${path}`)
    if (entry.isDirectory())
      await assertNoSymlinks(path)
    else if (!entry.isFile())
      throw new Error(`Refusing to copy a non-regular file into the content source: ${path}`)
  }
}
