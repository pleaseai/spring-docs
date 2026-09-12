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

import { lstat, readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Assert that `root` and everything under it is a regular file or a directory —
 * never a symlink or anything else (device, socket, FIFO, …).
 *
 * `root` is classified separately from its contents. `Dirent` entries reflect
 * the type collected during the directory scan itself, without following
 * symlinks, so the entries need no `lstat` — but `readdir` *does* follow a
 * symlinked root, which would walk the link's target and report the tree clean
 * under a name that points elsewhere. A sparse checkout materializes a mode
 * 120000 blob as a real symlink, so an upstream tag storing the component root
 * or the examples path as a link reaches exactly that case.
 *
 * @throws on the first offending path, naming it.
 */
export async function assertNoSymlinks(root: string): Promise<void> {
  const stats = await lstat(root)
  if (stats.isSymbolicLink())
    throw new Error(`Refusing to copy a symlink into the content source: ${root}`)
  if (!stats.isDirectory())
    throw new Error(`Refusing to copy a non-directory into the content source: ${root}`)
  await assertEntries(root)
}

/** The recursive half, for a directory already classified by its caller. */
async function assertEntries(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isSymbolicLink())
      throw new Error(`Refusing to copy a symlink into the content source: ${path}`)
    if (entry.isDirectory())
      await assertEntries(path)
    else if (!entry.isFile())
      throw new Error(`Refusing to copy a non-regular file into the content source: ${path}`)
  }
}
