#!/usr/bin/env bun
/**
 * Report which phases of a release a tag still owes: `publish`, `register` or
 * `complete`.
 *
 * `release.yml` runs this before building, and gates its publication and
 * registration steps on the answer. The decision itself lives in
 * `lib/release-state.ts`; this script only reads the catalog and prints the
 * verdict.
 *
 * `--catalog` has no default on purpose. The catalog that decides this is the
 * one on the **default branch**, not the one in the checked-out tag: a tag is
 * always cut before its own registration commit, so its `catalog.json` never
 * names it, and defaulting to the working tree would answer `register` for
 * every run.
 *
 * Usage:
 *   git show origin/main:catalog.json > /tmp/catalog.json
 *   bun run scripts/release-mode.ts --project boot --version 4.1.1 \
 *     --tag boot-4.1.1 --catalog /tmp/catalog.json --release-exists true
 *
 * Exit codes:
 *   0 — mode written to stdout
 *   1 — the catalog is unreadable, invalid, or inconsistent with the release
 *   2 — bad arguments
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { CatalogSchema } from './lib/catalog-schema.ts'
import { classifyRelease } from './lib/release-state.ts'

export interface Args {
  readonly project: string
  readonly version: string
  readonly tag: string
  readonly catalog: string
  readonly releaseExists: boolean
}

/** The options this script accepts. All are required. */
const OPTIONS = ['project', 'version', 'tag', 'catalog', 'release-exists'] as const

/**
 * Parse the CLI arguments.
 *
 * `--release-exists` takes `true` or `false` and nothing else. It carries the
 * result of a `gh release view` probe, and the whole recovery path turns on it,
 * so a shell that passes an empty string or a stray word must fail loudly
 * rather than be read as "no release" and republish over one that exists.
 *
 * @throws if an argument is unrecognized, misplaced, or missing its value.
 */
export function parseArgs(argv: readonly string[]): Args {
  const flags = new Map<string, string>()

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg?.startsWith('--')) {
      const eq = arg.indexOf('=')
      const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq)
      if (!OPTIONS.includes(name as typeof OPTIONS[number]))
        throw new Error(`Unknown option "--${name}". Known: ${OPTIONS.map(o => `--${o}`).join(', ')}`)
      const value = eq === -1 ? argv[++i] : arg.slice(eq + 1)
      if (value === undefined || value === '' || value.startsWith('--'))
        throw new Error(`Option "--${name}" needs a value.`)
      flags.set(name, value)
    }
    else {
      throw new Error(`Unexpected argument "${arg}". This script takes options only.`)
    }
  }

  const project = flags.get('project')
  const version = flags.get('version')
  const tag = flags.get('tag')
  const catalog = flags.get('catalog')
  const releaseExists = flags.get('release-exists')
  if (!project || !version || !tag || !catalog || !releaseExists) {
    throw new Error(
      'Usage: release-mode.ts --project <p> --version <v> --tag <t> '
      + '--catalog <path> --release-exists <true|false>',
    )
  }
  if (releaseExists !== 'true' && releaseExists !== 'false')
    throw new Error(`Option "--release-exists" takes "true" or "false", not "${releaseExists}".`)

  return { project, version, tag, catalog, releaseExists: releaseExists === 'true' }
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
    const catalog = CatalogSchema.parse(
      JSON.parse(await readFile(resolve(process.cwd(), args.catalog), 'utf8')),
    )
    const mode = classifyRelease({
      tag: args.tag,
      releaseExists: args.releaseExists,
      catalogTag: catalog.projects[args.project]?.[args.version]?.tag ?? null,
    })
    // stdout is the machine-readable answer the workflow captures; the
    // human-readable line goes to stderr so it cannot contaminate it.
    console.error(`${args.tag}: ${mode}`)
    console.log(mode)
  }
  catch (error) {
    console.error(`✗ release-mode failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

// Imported directly by unit tests exercising `parseArgs`; without the guard
// that import would run `main()` against the test runner's own argv.
if (import.meta.main)
  await main()
