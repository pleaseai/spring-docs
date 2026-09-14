import { describe, expect, test } from 'bun:test'
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertNoSymlinks, materializeDeclaredSymlinks } from '../../scripts/lib/reject-symlinks.ts'

describe('assertNoSymlinks', () => {
  test('accepts a clean tree of regular files and directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-clean-'))
    try {
      await mkdir(join(root, 'modules', 'pages'), { recursive: true })
      await writeFile(join(root, 'modules', 'pages', 'index.adoc'), 'content')

      await expect(assertNoSymlinks(root)).resolves.toBeUndefined()
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a symlinked root rather than walking the link target', async () => {
    // `readdir` follows a symlinked directory, so a root that is itself a link
    // would be reported clean on the strength of a tree it does not name. A
    // sparse checkout materializes a mode 120000 blob as a real symlink, so an
    // upstream tag storing the component root as a link reaches this case.
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-root-'))
    try {
      const real = join(root, 'real')
      await mkdir(real)
      await writeFile(join(real, 'index.adoc'), 'content')
      const link = join(root, 'link')
      await symlink(real, link)

      await expect(assertNoSymlinks(link)).rejects.toThrow(link)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a root that is not a directory at all', async () => {
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-file-'))
    try {
      const file = join(root, 'antora.yml')
      await writeFile(file, 'name: boot\n')

      await expect(assertNoSymlinks(file)).rejects.toThrow(/non-directory/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a symlink anywhere in the tree, naming its path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-dirty-'))
    try {
      await mkdir(join(root, 'modules', 'pages'), { recursive: true })
      const target = join(root, 'outside.txt')
      await writeFile(target, 'content')
      const link = join(root, 'modules', 'pages', 'escape.adoc')
      await symlink(target, link)

      await expect(assertNoSymlinks(root)).rejects.toThrow(link)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('materializeDeclaredSymlinks', () => {
  /** A component whose examples are reached through a relative symlink, as Spring Framework's are. */
  async function componentWithExamplesLink(): Promise<string> {
    const root = await mkdtemp(join(tmpdir(), 'materialize-'))
    const component = join(root, 'framework-docs')
    await mkdir(join(component, 'src', 'main'), { recursive: true })
    await writeFile(join(component, 'src', 'main', 'Sample.java'), 'class Sample {}')
    await mkdir(join(component, 'modules', 'ROOT', 'examples'), { recursive: true })
    await symlink('../../../src', join(component, 'modules', 'ROOT', 'examples', 'docs-src'))
    return component
  }

  test('replaces the link with a real copy, leaving the tree copyable', async () => {
    const component = await componentWithExamplesLink()
    try {
      await materializeDeclaredSymlinks(
        component,
        [{ path: 'modules/ROOT/examples/docs-src', target: 'src' }],
      )

      // The whole point: what was a link is now a directory, so the strict copy
      // guard passes over the component without being relaxed.
      const link = join(component, 'modules', 'ROOT', 'examples', 'docs-src')
      expect((await lstat(link)).isSymbolicLink()).toBe(false)
      expect((await lstat(link)).isDirectory()).toBe(true)
      expect(await readFile(join(link, 'main', 'Sample.java'), 'utf8')).toBe('class Sample {}')
      await expect(assertNoSymlinks(component)).resolves.toBeUndefined()
    }
    finally {
      await rm(join(component, '..'), { recursive: true, force: true })
    }
  })

  test('leaves an undeclared symlink to fail the copy guard', async () => {
    const component = await componentWithExamplesLink()
    try {
      await materializeDeclaredSymlinks(component, [])

      // Nothing declared, nothing materialized — the guard still refuses it.
      await expect(assertNoSymlinks(component)).rejects.toThrow(/docs-src/)
    }
    finally {
      await rm(join(component, '..'), { recursive: true, force: true })
    }
  })

  test('refuses a link pointing out of the component', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-escape-'))
    try {
      const outside = join(root, 'outside')
      await mkdir(outside, { recursive: true })
      await writeFile(join(outside, 'secret.txt'), 'not ours')
      const component = join(root, 'component')
      await mkdir(component, { recursive: true })
      await symlink(outside, join(component, 'escape'))

      await expect(materializeDeclaredSymlinks(component, [{ path: 'escape', target: 'escape' }]))
        .rejects
        .toThrow(/out of the component/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a link that contains itself, which would copy forever', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-cycle-'))
    try {
      const component = join(root, 'component')
      await mkdir(join(component, 'nested'), { recursive: true })
      // `nested/self` -> the component root, which `nested` sits inside.
      await symlink('..', join(component, 'nested', 'self'))

      await expect(materializeDeclaredSymlinks(component, [{ path: 'nested/self', target: '.' }]))
        .rejects
        .toThrow(/contains itself/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a declaration upstream no longer honours', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-stale-'))
    try {
      const component = join(root, 'component')
      await mkdir(component, { recursive: true })
      await writeFile(join(component, 'docs-src'), 'a real file now')

      // Upstream turning the link into a regular file is a layout change a
      // person should see, not one to absorb silently.
      await expect(materializeDeclaredSymlinks(component, [{ path: 'docs-src', target: 'docs-src' }]))
        .rejects
        .toThrow(/not a symlink/)
      await expect(materializeDeclaredSymlinks(component, [{ path: 'gone', target: 'gone' }]))
        .rejects
        .toThrow(/absent/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a link whose target tree carries a symlink of its own', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-nested-'))
    try {
      const outside = join(root, 'outside')
      await mkdir(outside, { recursive: true })
      await writeFile(join(outside, 'secret.txt'), 'not ours')

      const component = join(root, 'component')
      await mkdir(join(component, 'src', 'main'), { recursive: true })
      // The declared link resolves inside the component, but the tree it names
      // hides one pointing out of it. The copy dereferences, so without a check
      // on the source the escape would land as ordinary file content and the
      // check on the copy would find nothing left to refuse.
      await symlink(outside, join(component, 'src', 'main', 'escape'))
      await mkdir(join(component, 'modules', 'ROOT', 'examples'), { recursive: true })
      const link = join(component, 'modules', 'ROOT', 'examples', 'docs-src')
      await symlink('../../../src', link)

      await expect(
        materializeDeclaredSymlinks(component, [{ path: 'modules/ROOT/examples/docs-src', target: 'src' }]),
      )
        .rejects
        .toThrow(/escape/)
      expect((await lstat(link)).isSymbolicLink()).toBe(true)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a broken link rather than copying nothing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-broken-'))
    try {
      const component = join(root, 'component')
      await mkdir(component, { recursive: true })
      await symlink('./nowhere', join(component, 'dangling'))

      await expect(materializeDeclaredSymlinks(component, [{ path: 'dangling', target: 'dangling' }]))
        .rejects
        .toThrow(/broken/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a link upstream retargeted at a different in-component tree', async () => {
    // Upstream repointing the link without moving or removing it — adding and
    // moving are already covered above — must surface too, or the build would
    // silently absorb whatever the link now happens to point at.
    const root = await mkdtemp(join(tmpdir(), 'materialize-retarget-'))
    try {
      const component = join(root, 'component')
      await mkdir(join(component, 'src'), { recursive: true })
      await mkdir(join(component, 'other'), { recursive: true })
      await symlink('other', join(component, 'docs-src'))

      await expect(
        materializeDeclaredSymlinks(component, [{ path: 'docs-src', target: 'src' }]),
      )
        .rejects
        .toThrow(/retargeted/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('materializes only the declared link, leaving an undeclared one to fail the guard', async () => {
    // The production shape for framework-docs: one declared link, and every
    // other symlink must still fail. A regression where materialize scanned
    // and auto-copied every symlink instead of only the declared paths would
    // pass a suite that never exercised both together.
    const component = await componentWithExamplesLink()
    try {
      // Outside the declared link's target tree (`src`), so materializing
      // `docs-src` does not walk over this one and throw for the wrong reason.
      await mkdir(join(component, 'modules', 'ROOT', 'pages'), { recursive: true })
      const outside = join(component, '..', 'outside.adoc')
      await writeFile(outside, 'not ours')
      await symlink(outside, join(component, 'modules', 'ROOT', 'pages', 'undeclared.adoc'))

      await materializeDeclaredSymlinks(
        component,
        [{ path: 'modules/ROOT/examples/docs-src', target: 'src' }],
      )

      const link = join(component, 'modules', 'ROOT', 'examples', 'docs-src')
      expect((await lstat(link)).isSymbolicLink()).toBe(false)
      await expect(assertNoSymlinks(component)).rejects.toThrow(/undeclared\.adoc/)
    }
    finally {
      await rm(join(component, '..'), { recursive: true, force: true })
    }
  })
})
