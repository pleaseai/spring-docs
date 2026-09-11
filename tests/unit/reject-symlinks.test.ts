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
