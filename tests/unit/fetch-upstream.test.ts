import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { copyExamples, copyIntoContentSource, parseArgs } from '../../scripts/fetch-upstream.ts'

describe('parseArgs', () => {
  test('parses positional project/version and --out', () => {
    const args = parseArgs(['boot', '4.1.1', '--out', 'dist/upstream'])

    expect(args).toEqual({ project: 'boot', version: '4.1.1', out: 'dist/upstream' })
  })

  test('accepts --out=value', () => {
    const args = parseArgs(['boot', '4.1.1', '--out=dist/upstream'])

    expect(args).toEqual({ project: 'boot', version: '4.1.1', out: 'dist/upstream' })
  })

  test('throws when --out is missing', () => {
    expect(() => parseArgs(['boot', '4.1.1'])).toThrow(/Usage: fetch-upstream\.ts/)
  })

  test('throws when a positional is missing', () => {
    expect(() => parseArgs(['boot', '--out', 'dist'])).toThrow(/Usage: fetch-upstream\.ts/)
  })
})

/** Run `body` against a fresh temp directory, removing it afterwards. */
async function withTempDir(body: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'fetch-upstream-'))
  try {
    await body(root)
  }
  finally {
    await rm(root, { recursive: true, force: true })
  }
}

describe('copyIntoContentSource', () => {
  test('copies a tree of regular files and directories', async () => {
    await withTempDir(async (root) => {
      const source = join(root, 'source')
      await mkdir(join(source, 'pages'), { recursive: true })
      await writeFile(join(source, 'pages', 'index.adoc'), 'content')
      const dest = join(root, 'dest')
      await mkdir(dest)

      await copyIntoContentSource(source, dest)

      expect(await readFile(join(dest, 'pages', 'index.adoc'), 'utf8')).toBe('content')
    })
  })

  test('refuses a symlink and copies nothing', async () => {
    // `cp` preserves symlinks rather than following them, and `initContentSource`
    // commits what it produces — so the refusal has to happen before the copy,
    // not be cleaned up after it.
    await withTempDir(async (root) => {
      const source = join(root, 'source')
      await mkdir(join(source, 'pages'), { recursive: true })
      await writeFile(join(source, 'pages', 'index.adoc'), 'content')
      const outside = join(root, 'outside.txt')
      await writeFile(outside, 'secret')
      await symlink(outside, join(source, 'pages', 'escape.adoc'))
      const dest = join(root, 'dest')
      await mkdir(dest)

      await expect(copyIntoContentSource(source, dest)).rejects.toThrow(/escape\.adoc/)
      expect(await readdir(dest)).toEqual([])
    })
  })
})

describe('copyExamples', () => {
  const synthesis = {
    examplesPath: 'docs/src/main',
    staticAttributesPath: 'static.properties',
    bomBuildScriptPath: 'build.gradle',
    gradlePropertiesPath: 'gradle.properties',
    metadataArtifacts: [],
  }

  test('copies the examples tree in under modules/ROOT/examples', async () => {
    await withTempDir(async (root) => {
      const checkout = join(root, 'checkout')
      await mkdir(join(checkout, synthesis.examplesPath, 'java'), { recursive: true })
      await writeFile(join(checkout, synthesis.examplesPath, 'java', 'App.java'), 'class App {}')
      const componentRoot = join(root, 'component')
      await mkdir(componentRoot)

      await copyExamples(synthesis, checkout, componentRoot)

      const copied = join(componentRoot, 'modules', 'ROOT', 'examples', 'java', 'App.java')
      expect(await readFile(copied, 'utf8')).toBe('class App {}')
    })
  })

  test('refuses a symlink in the checked-out examples tree', async () => {
    // The examples tree comes from the release tag, not from the archive the
    // guard originally covered — the same invariant has to hold for both.
    await withTempDir(async (root) => {
      const checkout = join(root, 'checkout')
      await mkdir(join(checkout, synthesis.examplesPath), { recursive: true })
      const outside = join(root, 'outside.txt')
      await writeFile(outside, 'secret')
      await symlink(outside, join(checkout, synthesis.examplesPath, 'link.java'))
      const componentRoot = join(root, 'component')
      await mkdir(componentRoot)

      await expect(copyExamples(synthesis, checkout, componentRoot)).rejects.toThrow(/link\.java/)
    })
  })
})
