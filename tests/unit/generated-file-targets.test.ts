import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertGeneratedTargetsWritable } from '../../scripts/lib/generated-file-targets.ts'

describe('assertGeneratedTargetsWritable', () => {
  test('accepts an absent target and an exact-cased existing file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'generated-targets-clean-'))
    try {
      await writeFile(join(root, 'NOTICE'), 'existing notice')

      await expect(assertGeneratedTargetsWritable(root, ['NOTICE', 'LICENSE'])).resolves.toBeUndefined()
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a directory at the target path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'generated-targets-dir-'))
    try {
      await mkdir(join(root, 'LICENSE'))

      await expect(assertGeneratedTargetsWritable(root, ['LICENSE'])).rejects.toThrow(/is a directory/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a symlink at the exact-cased target path', async () => {
    // Exact-cased and not a directory, so the name checks pass — but the real
    // run would write *through* it, outside the converted tree, while the dry
    // run reported a NOTICE it never wrote.
    const root = await mkdtemp(join(tmpdir(), 'generated-targets-symlink-'))
    const outside = await mkdtemp(join(tmpdir(), 'generated-targets-outside-'))
    try {
      await writeFile(join(outside, 'target'), 'somewhere else')
      await symlink(join(outside, 'target'), join(root, 'NOTICE'))

      await expect(assertGeneratedTargetsWritable(root, ['NOTICE'])).rejects.toThrow(/not a regular file/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
      await rm(outside, { recursive: true, force: true })
    }
  })

  test('rejects an existing path that differs only in case', async () => {
    const root = await mkdtemp(join(tmpdir(), 'generated-targets-case-'))
    try {
      await writeFile(join(root, 'license'), 'lowercase license')

      await expect(assertGeneratedTargetsWritable(root, ['LICENSE'])).rejects.toThrow(/differs only in case/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
