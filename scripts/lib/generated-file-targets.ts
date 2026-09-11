/**
 * Guard against a converted tree that already owns a path packaging is about
 * to generate (NOTICE, LICENSE, …).
 *
 * `package-release.ts` writes these files itself on a real run; a dry run
 * never touches disk and only synthesizes their manifest entries in memory
 * instead. Both paths assume each target is either absent or an
 * exact-cased regular file. Three cases break that assumption, and each
 * reintroduces the exact dry-run/real-run divergence the generated-file
 * mechanism exists to remove:
 *   - a directory at the target path: the real run's `writeFile` throws,
 *     while an unchecked dry run would happily synthesize an entry and
 *     report success.
 *   - a case variant (e.g. `license` for `LICENSE`) on a case-insensitive
 *     filesystem: the real run overwrites through the alternate-cased path,
 *     while a case-sensitive check would miss it, so the same tree packages
 *     differently on macOS than on Linux.
 *   - a symlink or other non-regular entry at the exact-cased path: the real
 *     run writes *through* it, to a destination outside the converted tree,
 *     while the dry run reports a NOTICE it never wrote.
 * Checking this up front, in both modes, keeps a dry run's prediction
 * honest: it fails exactly where the real run would.
 *
 * Mirrors `assertUniquePaths` in `output-layout.ts`: comparison is
 * case-insensitive, because not every filesystem distinguishes case.
 */

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * @throws if any `target` collides with an existing directory, or with an
 * existing file whose name differs from it only in case.
 */
export async function assertGeneratedTargetsWritable(
  root: string,
  targets: readonly string[],
): Promise<void> {
  const entries = await readdir(root, { withFileTypes: true })

  for (const target of targets) {
    const match = entries.find(entry => entry.name.toLowerCase() === target.toLowerCase())
    if (!match)
      continue
    const path = join(root, match.name)
    if (match.isDirectory())
      throw new Error(`Refusing to write "${target}": "${path}" is a directory.`)
    if (!match.isFile()) {
      throw new Error(
        `Refusing to write "${target}": "${path}" is not a regular file. `
        + `Writing through a symlink or device would escape the converted tree.`,
      )
    }
    if (match.name !== target) {
      throw new Error(
        `Refusing to write "${target}": "${path}" differs only in case. `
        + `Paths are compared case-insensitively because not every filesystem distinguishes them.`,
      )
    }
  }
}
