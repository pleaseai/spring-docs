#!/usr/bin/env bun
/**
 * Acquire one upstream `(project, version)` pair as a ready-to-classify Antora
 * content source.
 *
 * Two inputs are merged (ADR-0002):
 *   1. sparse git checkout of the component root at the release tag
 *   2. the content archives Spring publishes to Maven Central, which carry the
 *      generated component descriptor and the `example$` sample tree
 *
 * Usage:
 *   bun run scripts/fetch-upstream.ts boot 4.1.1 --out dist/upstream
 *
 * Exit codes:
 *   0 — source tree written
 *   1 — fetch, download or merge failed
 *   2 — bad arguments
 */

import type { UpstreamCoordinates } from './lib/upstream-sources.ts'
import { Buffer } from 'node:buffer'
import { cp, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { resolveUpstream } from './lib/upstream-sources.ts'

interface Args {
  readonly project: string
  readonly version: string
  readonly out: string
}

function parseArgs(argv: readonly string[]): Args {
  const positional: string[] = []
  let out: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--out') {
      out = argv[++i]
    }
    else if (arg?.startsWith('--out=')) {
      out = arg.slice('--out='.length)
    }
    else if (arg !== undefined) {
      positional.push(arg)
    }
  }

  const [project, version] = positional
  if (!project || !version || !out) {
    throw new Error(
      'Usage: fetch-upstream.ts <project> <version> --out <dir>\n'
      + '  e.g. fetch-upstream.ts boot 4.1.1 --out dist/upstream',
    )
  }
  return { project, version, out }
}

/** Run a command, failing loudly with its stderr. */
async function run(cmd: readonly string[], cwd: string): Promise<string> {
  const proc = Bun.spawn([...cmd], { cwd, stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(`${cmd.join(' ')} failed (exit ${exitCode})\n${stderr.trim()}`)
  }
  return stdout.trim()
}

/**
 * Sparse-checkout the component root at the release tag.
 *
 * @returns the resolved upstream commit SHA
 */
async function checkoutComponent(
  upstream: UpstreamCoordinates,
  workDir: string,
): Promise<string> {
  await run(['git', 'init', '-q', '.'], workDir)
  await run(['git', 'remote', 'add', 'origin', upstream.cloneUrl], workDir)
  await run(
    ['git', 'fetch', '--depth', '1', '--filter=blob:none', '-q', 'origin', upstream.tag],
    workDir,
  )
  await run(['git', 'sparse-checkout', 'set', '--no-cone', upstream.componentPath], workDir)
  await run(['git', 'checkout', '-q', 'FETCH_HEAD'], workDir)
  // `v4.1.1` is an annotated tag; FETCH_HEAD names the tag object, so peel it
  // to the commit it points at — manifest provenance must be a commit SHA.
  return run(['git', 'rev-parse', 'FETCH_HEAD^{commit}'], workDir)
}

/** Download one published archive and expand it over the component root. */
async function mergeArchive(url: string, componentRoot: string, workDir: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GET ${url} → ${response.status} ${response.statusText}`)
  }
  const zipPath = join(workDir, 'archive.zip')
  await writeFile(zipPath, Buffer.from(await response.arrayBuffer()))

  // Archives are laid out as `modules/**`, matching the component root.
  const expanded = join(workDir, 'expanded')
  await rm(expanded, { recursive: true, force: true })
  await run(['unzip', '-o', '-q', zipPath, '-d', expanded], workDir)
  await cp(expanded, componentRoot, { recursive: true, force: true })
  await rm(zipPath, { force: true })
}

/**
 * Initialize the fetched tree as its own git repository.
 *
 * Antora's content aggregator only accepts a local content source that is a git
 * worktree. Without this the tree happens to work when it sits inside an
 * unrelated repository and fails everywhere else, so the source is made
 * self-contained rather than depending on where it was written.
 */
async function initContentSource(outDir: string): Promise<void> {
  await run(['git', 'init', '-q', '-b', 'main', '.'], outDir)
  await run(['git', 'add', '-A'], outDir)
  await run(
    [
      'git',
      '-c',
      'user.email=pipeline@pleaseai.invalid',
      '-c',
      'user.name=spring-docs pipeline',
      'commit',
      '-q',
      '-m',
      'fetched upstream content',
    ],
    outDir,
  )
}

/**
 * Promote the archive's generated component descriptor to the component root.
 *
 * The checked-out `antora.yml` is a stub; the archive ships the real one under
 * `modules/antora.yml` with every BOM-derived attribute resolved. Without this
 * swap, `include-code::` has no search locations and silently resolves nothing.
 */
async function promoteDescriptor(componentRoot: string): Promise<void> {
  const generated = join(componentRoot, 'modules', 'antora.yml')
  if (!(await Bun.file(generated).exists())) {
    throw new Error(
      `Archive did not ship modules/antora.yml — attributes would be unresolved. `
      + `Looked in ${generated}`,
    )
  }
  await rename(generated, join(componentRoot, 'antora.yml'))
}

async function main(): Promise<void> {
  let args: Args
  try {
    args = parseArgs(process.argv.slice(2))
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
  }

  const upstream = resolveUpstream(args.project, args.version)
  const outDir = resolve(process.cwd(), args.out, `${upstream.project}-${upstream.version}`)
  const workDir = await mkdtemp(join(tmpdir(), 'spring-docs-fetch-'))

  try {
    console.log(`Fetching ${upstream.repo}@${upstream.tag} (${upstream.componentPath})`)
    const commit = await checkoutComponent(upstream, workDir)

    await rm(outDir, { recursive: true, force: true })
    await mkdir(outDir, { recursive: true })
    await cp(join(workDir, upstream.componentPath), outDir, { recursive: true })

    for (const archive of upstream.archives) {
      console.log(`Merging ${archive.classifier}`)
      await mergeArchive(archive.url, outDir, workDir)
    }
    await promoteDescriptor(outDir)
    await initContentSource(outDir)

    // Provenance for manifest.json; kept beside the tree, not inside the content.
    await writeFile(
      join(outDir, '..', `${upstream.project}-${upstream.version}.upstream.json`),
      `${JSON.stringify(
        {
          project: upstream.project,
          version: upstream.version,
          repo: upstream.repo,
          ref: upstream.tag,
          commit,
          archives: upstream.archives.map(a => a.classifier),
          external_components: upstream.externalComponents,
        },
        null,
        2,
      )}\n`,
    )

    console.log(`Fetched ${upstream.project} ${upstream.version} (${commit.slice(0, 12)}) to ${outDir}`)
  }
  catch (error) {
    console.error(`✗ fetch-upstream failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
  finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

await main()
