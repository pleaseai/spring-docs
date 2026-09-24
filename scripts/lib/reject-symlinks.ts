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
 * `src` — and five Spring Data stores link theirs into the store's Java sources,
 * outside the component (ADR-0008). That is what
 * {@link materializeDeclaredSymlinks} is for: an era names the links it expects
 * and where each must resolve in the checkout, they are replaced by real copies
 * before the copy runs, and every link nobody declared still fails here.
 */

import { cp, lstat, readdir, realpath, rm } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, sep } from 'node:path'

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
 * link — repointing it at some other tree without moving or removing it —
 * surface as a build failure too, rather than being silently followed to
 * wherever it now leads.
 *
 * The two halves are relative to different roots, each to where it belongs: a
 * link lives in the component, but may point anywhere in the store's checkout
 * (ADR-0008). Spring Data's examples reach into the store's own Java sources,
 * beside the component rather than under it.
 */
export interface DeclaredSymlink {
  /** Component-root-relative path of the symlink itself. */
  readonly path: string
  /**
   * Checkout-root-relative path the link is expected to resolve to.
   *
   * Also added to the era's sparse checkout, so a target is always a path the
   * era named and fetched from the release tag.
   */
  readonly target: string
}

/**
 * Leading segment of every directory the pipeline itself writes into a checkout.
 *
 * `fetch-upstream.ts` checks a template era's parent POM and companion component
 * out under `.spring-docs-parent` and `.spring-docs-companion`, inside the
 * store's checkout. Neither is content from the store's tag, so no declared
 * link may name one — nor `.git`, which holds the checkout's own metadata.
 */
const PIPELINE_DIRECTORY_PREFIX = '.spring-docs-'

/**
 * Refuse a declaration whose path or target is not a plain relative path, or
 * whose target names a directory the pipeline rather than the tag put there.
 *
 * Pure, so `resolveUpstream` can run it for every declared link and a bad
 * declaration fails when it is resolved rather than when a build reaches it.
 * {@link materializeDeclaredSymlinks} runs it again, because it is exported and
 * a caller could hand it a declaration that never passed through an era.
 *
 * Spelled segment by segment rather than normalized and compared: a `..` is what
 * would let a declaration climb out of its root, and `.` or an empty segment is
 * a second spelling of a path the reviewer should only ever see one way.
 *
 * @throws naming the declaration and what is wrong with it.
 */
export function assertDeclaredSymlink({ path, target }: DeclaredSymlink): void {
  assertPlainRelative('path', path, path, target)
  assertPlainRelative('target', target, path, target)
  const [first = ''] = target.split('/')
  if (first === '.git' || first.startsWith(PIPELINE_DIRECTORY_PREFIX)) {
    throw new Error(
      `Declared symlink ${path} → ${target} targets ${first}/, which holds the `
      + `pipeline's own checkout state rather than content from the release tag`,
    )
  }
}

/** One half of {@link assertDeclaredSymlink}: relative, non-empty, normalized. */
function assertPlainRelative(half: 'path' | 'target', value: string, path: string, target: string): void {
  if (value === '' || isAbsolute(value))
    throw new Error(`Declared symlink ${path} → ${target} has a ${half} that is not relative`)
  if (value.split('/').some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(
      `Declared symlink ${path} → ${target} has a ${half} that is not normalized: `
      + `it must carry no empty, '.' or '..' segment`,
    )
  }
}

/**
 * Replace a symlink the component legitimately ships with a real copy of what
 * it points at, so the tree reaching {@link assertNoSymlinks} carries none.
 *
 * Spring Framework's component reaches its `example$` tree this way:
 * `framework-docs/modules/ROOT/examples/docs-src` is a mode 120000 blob holding
 * `../../../src`, and a sparse checkout materializes it as a real symlink. The
 * Spring Data stores of ADR-0008 do the same from `src/main/antora` into their
 * Java test sources. The tree each names is inside the checkout, so nothing has
 * to be downloaded — but `git add -A` in `initContentSource` would otherwise
 * store the link itself, and Antora would classify a component whose examples
 * resolve outside it.
 *
 * Each link is named by the era rather than discovered, which is the whole
 * point: an undeclared link keeps failing the copy guard. Upstream adding,
 * moving or retargeting one is then a build failure a person reviews, not a
 * tree that silently absorbs whatever the link happened to point at.
 *
 * The bound is the checkout, not the component: pinning each link to one
 * target is what does the work, and the bound only has to keep a link from
 * reaching the runner beyond the tag that was fetched.
 *
 * @param checkoutRoot the store's checkout, which bounds where a link may
 * point and which every target is relative to.
 * @param componentPath checkout-relative path of the component root, which
 * every declared path is relative to.
 * @param declared component-root-relative paths, each paired with the
 * checkout-root-relative target it must resolve to.
 * @throws if a declaration is malformed ({@link assertDeclaredSymlink}), or a
 * declared path is absent, is not a symlink, is broken, escapes the checkout,
 * resolves to somewhere other than its declared target, contains the link
 * itself, or names a tree that carries a symlink of its own.
 */
export async function materializeDeclaredSymlinks(
  checkoutRoot: string,
  componentPath: string,
  declared: readonly DeclaredSymlink[],
): Promise<void> {
  for (const symlink of declared)
    assertDeclaredSymlink(symlink)

  const realRoot = await realpath(checkoutRoot)
  const componentRoot = join(checkoutRoot, componentPath)

  for (const { path: relativePath, target: expectedTarget } of declared) {
    const link = join(componentRoot, relativePath)

    const stats = await lstat(link).catch(() => undefined)
    if (stats === undefined)
      throw new Error(`Declared symlink is absent from the component: ${relativePath}`)
    if (!stats.isSymbolicLink()) {
      throw new Error(
        `Declared symlink is not a symlink: ${relativePath}. Upstream changed the `
        + `component layout, so the declaration no longer describes it.`,
      )
    }

    const target = await realpath(link).catch(() => undefined)
    if (target === undefined)
      throw new Error(`Declared symlink is broken: ${relativePath}`)
    if (target !== realRoot && !target.startsWith(realRoot + sep)) {
      throw new Error(
        `Refusing to follow a symlink out of the checkout: ${relativePath} → ${target}`,
      )
    }

    // Resolved, not compared as text: the declared target is a path inside the
    // checkout, and an absent one cannot be what the link resolves to — so it
    // falls into the same mismatch rather than escaping as a raw ENOENT.
    const expected = await realpath(join(realRoot, expectedTarget)).catch(() => undefined)
    if (target !== expected) {
      throw new Error(
        `Declared symlink was retargeted: ${relativePath} was expected to resolve to `
        + `${expectedTarget} but resolves to ${target}`,
      )
    }

    // The declaration was checked as text, but a directory on the way to the
    // target could itself be a link into `.git` or a pipeline checkout. The
    // resolved path is what the copy reads, so it has to pass the same rule.
    const [resolvedFirst = ''] = relative(realRoot, target).split(sep)
    if (resolvedFirst === '.git' || resolvedFirst.startsWith(PIPELINE_DIRECTORY_PREFIX)) {
      throw new Error(
        `Refusing to follow a symlink into the pipeline's own checkout state: `
        + `${relativePath} → ${target}`,
      )
    }

    // A link sitting inside its own target would make the copy below recurse
    // forever. `cp` would either exhaust the disk or throw far from the cause.
    const parent = await realpath(dirname(link))
    if (parent === target || parent.startsWith(target + sep))
      throw new Error(`Refusing to follow a symlink that contains itself: ${relativePath}`)

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
