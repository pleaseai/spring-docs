/**
 * Guard against symlink escapes in a downloaded, expanded archive.
 *
 * `unzip` recreates symlink entries in a zip as real filesystem symlinks, and
 * `fetch-upstream.ts` then `cp`s the expanded tree into the committed Antora
 * content source with `{ recursive: true, force: true }` — which preserves
 * symlinks rather than following them (Bun's `cp` defaults to
 * `dereference: false`, verified empirically). A link under a page module
 * could point anywhere on the runner, and nothing upstream of this checks for
 * it: `mergeArchive` only verifies `response.ok`, with no checksum or
 * signature against what Maven Central served.
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
      throw new Error(`Refusing to merge a symlink from a downloaded archive: ${path}`)
    if (entry.isDirectory())
      await assertNoSymlinks(path)
    else if (!entry.isFile())
      throw new Error(`Refusing to merge a non-regular file from a downloaded archive: ${path}`)
  }
}
