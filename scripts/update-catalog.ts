#!/usr/bin/env bun
/**
 * Record a published `(project, version)` pair in `catalog.json`.
 *
 * `catalog.json` is the single source of truth for `(project, version) → tag`
 * resolution (ARCHITECTURE.md). It is written by this script, never by hand.
 *
 * A failed release must not update the catalog, so this runs only after the
 * archive is published. `--released-at` is omitted while a tag exists but its
 * release has not been published yet.
 *
 * Usage:
 *   bun run scripts/update-catalog.ts --project boot --version 4.1.1 \
 *     --tag boot-4.1.1 [--released-at 2026-09-11T00:00:00Z] [--dry-run]
 *
 * Exit codes:
 *   0 — catalog updated (or unchanged under --dry-run)
 *   1 — refused: the entry would mutate an immutable tag, or the result is invalid
 *   2 — bad arguments
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { CatalogSchema } from './lib/catalog-schema.ts'
import { applyEntry, serializeCatalog } from './lib/catalog-update.ts'

interface Args {
  readonly project: string
  readonly version: string
  readonly tag: string
  readonly releasedAt: string | null
  readonly dryRun: boolean
  readonly now: Date
}

function parseArgs(argv: readonly string[]): Args {
  const flags = new Map<string, string>()
  let dryRun = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      dryRun = true
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
  const version = flags.get('version')
  const tag = flags.get('tag')
  if (!project || !version || !tag) {
    throw new Error(
      'Usage: update-catalog.ts --project <p> --version <v> --tag <t> '
      + '[--released-at <iso>] [--dry-run]',
    )
  }
  return {
    project,
    version,
    tag,
    releasedAt: flags.get('released-at') ?? null,
    dryRun,
    now: new Date(),
  }
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

  const catalogPath = resolve(process.cwd(), 'catalog.json')
  try {
    const parsed = CatalogSchema.parse(JSON.parse(await readFile(catalogPath, 'utf8')))
    const updated = applyEntry(
      parsed,
      {
        project: args.project,
        version: args.version,
        tag: args.tag,
        releasedAt: args.releasedAt,
      },
      args.now,
    )

    const serialized = serializeCatalog(CatalogSchema.parse(updated))
    if (args.dryRun) {
      console.log(serialized)
      return
    }

    await writeFile(catalogPath, serialized)
    console.log(
      `Catalog updated: ${args.project} ${args.version} → ${args.tag}`
      + `${args.releasedAt ? '' : ' (released_at pending)'}`,
    )
  }
  catch (error) {
    console.error(`✗ update-catalog failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

await main()
