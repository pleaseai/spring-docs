#!/usr/bin/env bun
/**
 * Report GA versions upstream has released that `catalog.json` does not carry.
 *
 * Read-only: it never writes the catalog and never builds anything. The nightly
 * workflow turns its output into issues; `matrix-build.yml` turns it into a job
 * matrix.
 *
 * Usage:
 *   bun run scripts/detect-upstream-versions.ts [--project boot] [--limit 5] [--json]
 *
 * Exit codes:
 *   0 — detection completed (including when nothing is missing)
 *   1 — a remote could not be listed, or catalog.json is unreadable
 *   2 — bad arguments
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { CatalogSchema } from './lib/catalog-schema.ts'
import { cloneUrlFor, requiredArtifactUrls, supportedProjects } from './lib/upstream-sources.ts'
import { missingVersions, parseTagRefs } from './lib/version-detect.ts'

export interface Args {
  readonly projects: readonly string[]
  /** Newest N missing versions per project, or null for all of them. */
  readonly limit: number | null
  readonly json: boolean
}

/** One buildable pair, shaped as a GitHub Actions matrix entry. */
interface MatrixEntry {
  readonly project: string
  readonly version: string
}

export function parseArgs(argv: readonly string[]): Args {
  const flags = new Map<string, string>()
  let json = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--json') {
      json = true
    }
    else if (arg?.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq !== -1) {
        flags.set(arg.slice(2, eq), arg.slice(eq + 1))
      }
      else {
        const next = argv[++i]
        if (next !== undefined)
          flags.set(arg.slice(2), next)
      }
    }
  }

  const project = flags.get('project')
  if (project !== undefined && !supportedProjects().includes(project)) {
    throw new Error(
      `Unknown project "${project}". Supported: ${supportedProjects().join(', ')}`,
    )
  }

  const rawLimit = flags.get('limit')
  const limit = rawLimit === undefined ? null : Number(rawLimit)
  if (limit !== null && (!Number.isInteger(limit) || limit < 1))
    throw new Error(`--limit must be a positive integer, got "${rawLimit}"`)

  return {
    projects: project === undefined ? supportedProjects() : [project],
    limit,
    json,
  }
}

/**
 * Whether every remote artifact a version's build reads has been published.
 *
 * Upstream tags a release long before — and sometimes without ever — publishing
 * the artifacts this pipeline reads: 4.1.0 is tagged but has no content archive.
 * Which artifacts matter depends on the version's layout era, so the list comes
 * from `requiredArtifactUrls`. Filing an issue for a version that cannot be built
 * wastes a human's time, so availability is checked here rather than left for
 * `fetch-upstream.ts` to hit as a 404.
 *
 * @throws if a URL cannot be reached, so a network fault is never mistaken for
 * an unpublished version.
 */
async function artifactsPublished(project: string, version: string): Promise<boolean> {
  for (const url of requiredArtifactUrls(project, version)) {
    const response = await fetch(url, { method: 'HEAD' })
    if (response.status === 404)
      return false
    if (!response.ok)
      throw new Error(`HEAD ${url} → ${response.status} ${response.statusText}`)
  }
  return true
}

/** Tag names on a remote, without cloning it. */
async function listRemoteTags(cloneUrl: string): Promise<readonly string[]> {
  const proc = Bun.spawn(['git', 'ls-remote', '--tags', cloneUrl], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0)
    throw new Error(`git ls-remote ${cloneUrl} failed (exit ${exitCode})\n${stderr.trim()}`)
  return parseTagRefs(stdout)
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

  try {
    const catalogPath = resolve(process.cwd(), 'catalog.json')
    const catalog = CatalogSchema.parse(JSON.parse(await readFile(catalogPath, 'utf8')))

    const include: MatrixEntry[] = []
    for (const project of args.projects) {
      const tags = await listRemoteTags(cloneUrlFor(project))
      const missing = missingVersions(catalog, project, tags)

      const buildable: string[] = []
      const unpublished: string[] = []
      for (const version of missing) {
        if (await artifactsPublished(project, version))
          buildable.push(version)
        else
          unpublished.push(version)
      }

      const selected = args.limit === null ? buildable : buildable.slice(-args.limit)
      for (const version of selected) include.push({ project, version })

      // stderr, so `--json` output stays machine-readable.
      if (unpublished.length > 0) {
        console.error(
          `${project}: skipping ${unpublished.length} version(s) with unpublished upstream artifacts: ${unpublished.join(', ')}`,
        )
      }

      if (!args.json) {
        console.log(
          selected.length === 0
            ? `${project}: up to date`
            : `${project}: ${selected.length} missing GA version(s): ${selected.join(', ')}`,
        )
      }
    }

    if (args.json)
      console.log(JSON.stringify({ include }))
  }
  catch (error) {
    console.error(`✗ detect-upstream-versions failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

// This module is imported directly by unit tests exercising `parseArgs`;
// without the guard that import would run `main()` against the test
// runner's own argv.
if (import.meta.main)
  await main()
