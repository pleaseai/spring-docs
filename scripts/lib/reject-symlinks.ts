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
 * Spring Boot carries no such entry at any supported tag (v3.3.0, v3.4.0,
 * v3.5.0 and v3.5.16, repo-wide), so for it this is a guard against an upstream
 * compromise or layout change rather than a live defect. Spring Framework does
 * carry one — `modules/ROOT/examples/docs-src` links to the component's own
 * `src` — which is what {@link materializeDeclaredSymlinks} is for: an era
 * names the links it expects, they are replaced by real copies before the copy
 * runs, and every link nobody declared still fails here.
 */

import { cp, lstat, readdir, realpath, rm } from 'node:fs/promises'
import { dirname, join, sep } from 'node:path'

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

/**
 * One symlink an era's layout is known to ship, named by both its path and the
 * target it is expected to resolve to.
 *
 * Pinning the target alongside the path is what lets upstream retargeting the
 * link — repointing it at some other in-component tree without moving or
 * removing it — surface as a build failure too, rather than being silently
 * followed to wherever it now leads.
 */
export interface DeclaredSymlink {
  /** Component-root-relative path of the symlink itself. */
  readonly path: string
  /** Component-root-relative path the link is expected to resolve to. */
  readonly target: string
}

/**
 * Replace a symlink the component legitimately ships with a real copy of what
 * it points at, so the tree reaching {@link assertNoSymlinks} carries none.
 *
 * Spring Framework's component reaches its `example$` tree this way:
 * `framework-docs/modules/ROOT/examples/docs-src` is a mode 120000 blob holding
 * `../../../src`, and a sparse checkout materializes it as a real symlink. The
 * tree it names is inside the checkout, so nothing has to be downloaded — but
 * `git add -A` in `initContentSource` would otherwise store the link itself,
 * and Antora would classify a component whose examples resolve outside it.
 *
 * Each link is named by the era rather than discovered, which is the whole
 * point: an undeclared link keeps failing the copy guard. Upstream adding,
 * moving or retargeting one is then a build failure a person reviews, not a
 * tree that silently absorbs whatever the link happened to point at.
 *
 * @param componentRoot the checked-out component root, which also bounds where
 * a link may point.
 * @param declared paths and expected targets, both component-root-relative;
 * each path must be a symlink resolving to its paired target inside
 * `componentRoot`.
 * @throws if a declared path is absent, is not a symlink, is broken, escapes
 * the component, resolves to somewhere other than its declared target,
 * contains the link itself, or names a tree that carries a symlink of its own.
 */
export async function materializeDeclaredSymlinks(
  componentRoot: string,
  declared: readonly DeclaredSymlink[],
): Promise<void> {
  const realRoot = await realpath(componentRoot)

  for (const { path: relative, target: expectedTarget } of declared) {
    const link = join(componentRoot, relative)

    const stats = await lstat(link).catch(() => undefined)
    if (stats === undefined)
      throw new Error(`Declared symlink is absent from the component: ${relative}`)
    if (!stats.isSymbolicLink()) {
      throw new Error(
        `Declared symlink is not a symlink: ${relative}. Upstream changed the `
        + `component layout, so the declaration no longer describes it.`,
      )
    }

    const target = await realpath(link).catch(() => undefined)
    if (target === undefined)
      throw new Error(`Declared symlink is broken: ${relative}`)
    if (target !== realRoot && !target.startsWith(realRoot + sep)) {
      throw new Error(
        `Refusing to follow a symlink out of the component: ${relative} → ${target}`,
      )
    }

    // Resolved, not compared as text: the declared target is a path inside the
    // component, and an absent one cannot be what the link resolves to — so it
    // falls into the same mismatch rather than escaping as a raw ENOENT.
    const expected = await realpath(join(realRoot, expectedTarget)).catch(() => undefined)
    if (target !== expected) {
      throw new Error(
        `Declared symlink was retargeted: ${relative} was expected to resolve to `
        + `${expectedTarget} but resolves to ${target}`,
      )
    }

    // A link sitting inside its own target would make the copy below recurse
    // forever. `cp` would either exhaust the disk or throw far from the cause.
    const parent = await realpath(dirname(link))
    if (parent === target || parent.startsWith(target + sep))
      throw new Error(`Refusing to follow a symlink that contains itself: ${relative}`)

    // The copy below dereferences, so it would follow a symlink *nested* in the
    // target and land its content as an ordinary file — which the check on the
    // copy then passes, the link having stopped being one. The source tree has
    // to be inspected while its entries are still links.
    await assertNoSymlinks(target)

    await rm(link)
    await cp(target, link, { recursive: true, dereference: true })
    await assertNoSymlinks(link)
  }
}
