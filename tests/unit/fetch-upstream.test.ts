import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertArtifactsPublished, copyExamples, copyIntoContentSource, parseArgs } from '../../scripts/fetch-upstream.ts'
import { requiredArtifactUrls, resolveUpstream } from '../../scripts/lib/upstream-sources.ts'

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

describe('assertArtifactsPublished', () => {
  // 3.5.16 is a synthesized era: eight metadata jars, so a partial outage is
  // representable. The fetcher is injected, so none of this touches the network.
  const upstream = resolveUpstream('boot', '3.5.16')
  const urls = [...requiredArtifactUrls('boot', '3.5.16')]
  const publishedFetcher = () =>
    Promise.resolve({ status: 200, ok: true, statusText: 'OK' })

  function missingOnly(absent: readonly string[]) {
    return (url: string) =>
      Promise.resolve(
        absent.includes(url)
          ? { status: 404, ok: false, statusText: 'Not Found' }
          : { status: 200, ok: true, statusText: 'OK' },
      )
  }

  test('lets a fully published version through', async () => {
    expect(await assertArtifactsPublished(upstream, publishedFetcher)).toBeUndefined()
  })

  test('refuses when even one required artifact is missing', async () => {
    const absent = urls.slice(0, 1)

    await expect(assertArtifactsPublished(upstream, missingOnly(absent))).rejects.toThrow(
      /boot 3\.5\.16 is tagged upstream but cannot be built yet/,
    )
  })

  test('names every missing artifact, so the reader can check the claim', async () => {
    // The point of failing here rather than 404-ing mid-download is that the
    // message is about the version, not about whichever jar happened to be
    // requested first.
    const absent = urls.slice(0, 3)

    const error = await assertArtifactsPublished(upstream, missingOnly(absent))
      .then(() => undefined)
      .catch((caught: unknown) => caught as Error)

    expect(error).toBeInstanceOf(Error)
    for (const url of absent) expect(error?.message).toContain(url)
    expect(error?.message).toContain('3 required artifact(s)')
  })

  test('calls the refusal a publication fact, not a layout one', async () => {
    // Issue #19 rejected encoding this as an era gap. The message carries that
    // reasoning to whoever hits it, so a reader does not go add a gap.
    await expect(assertArtifactsPublished(upstream, missingOnly(urls)))
      .rejects
      .toThrow(/publication fact, not a layout one/)
  })

  test('propagates an unreachable host instead of calling the version unbuildable', async () => {
    const down = () => Promise.resolve({ status: 503, ok: false, statusText: 'Service Unavailable' })

    await expect(assertArtifactsPublished(upstream, down)).rejects.toThrow(/503/)
  })
})

describe('the fetch lifecycle around the gate', () => {
  // `main()` clones and downloads, so no unit test can drive it. What matters
  // about the gate is not what it computes — that is covered above — but where
  // it sits: ahead of the clone and ahead of `rm(outDir)`, with the temporary
  // checkout removed in a `finally` so a refusal leaks nothing. Those are
  // statement-order facts, and a later edit that reorders them would pass every
  // other test in this suite. So they are pinned here, against the source.
  async function mainBody(): Promise<string> {
    const source = await readFile(
      new URL('../../scripts/fetch-upstream.ts', import.meta.url),
      'utf8',
    )
    const start = source.indexOf('async function main(): Promise<void> {')
    expect(start).toBeGreaterThan(-1)
    return source.slice(start)
  }

  test('gates before the checkout and before the output directory is cleared', async () => {
    const body = await mainBody()
    // `await`, not just the call: an unawaited gate would let the clone and the
    // `rm` start while the probe is still in flight, which puts the refusal
    // after the damage even though the source order still reads correctly.
    const gate = body.indexOf('await assertArtifactsPublished(upstream)')
    const checkout = body.indexOf('await checkoutComponent(upstream, workDir)')
    const clearOutput = body.indexOf('await rm(outDir,')

    expect(gate).toBeGreaterThan(-1)
    expect(checkout).toBeGreaterThan(-1)
    expect(clearOutput).toBeGreaterThan(-1)
    // A refused version must not pay for a clone of spring-boot...
    expect(checkout).toBeGreaterThan(gate)
    // ...and must not lose the output a previous successful build left behind.
    expect(clearOutput).toBeGreaterThan(gate)
  })

  test('removes the temporary checkout in a finally, so a refusal leaks nothing', async () => {
    const body = await mainBody()
    const finallyBlock = body.slice(body.indexOf('\n  finally {'))

    expect(finallyBlock).toContain('rm(workDir,')
    // Setting the code rather than calling `process.exit(1)` is what lets the
    // `finally` run at all — exiting would terminate first and leak the checkout.
    expect(body).toContain('process.exitCode = 1')
  })
})
