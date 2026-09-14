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
      await materializeDeclaredSymlinks(component, ['modules/ROOT/examples/docs-src'])

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

      await expect(materializeDeclaredSymlinks(component, ['escape']))
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

      await expect(materializeDeclaredSymlinks(component, ['nested/self']))
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
      await expect(materializeDeclaredSymlinks(component, ['docs-src']))
        .rejects
        .toThrow(/not a symlink/)
      await expect(materializeDeclaredSymlinks(component, ['gone']))
        .rejects
        .toThrow(/absent/)
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

      await expect(materializeDeclaredSymlinks(component, ['dangling']))
        .rejects
        .toThrow(/broken/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
