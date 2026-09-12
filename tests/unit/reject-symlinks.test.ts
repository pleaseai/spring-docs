import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertNoSymlinks } from '../../scripts/lib/reject-symlinks.ts'

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
