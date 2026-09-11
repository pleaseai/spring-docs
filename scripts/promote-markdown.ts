#!/usr/bin/env bun
/**
 * Copy a converted tree into the committed `markdown/` tree.
 *
 * `markdown/<project>/<version>/` is browsable on GitHub and makes a rebuild's
 * effect visible as a diff. It is not the consumption surface — consumers fetch
 * the release archive — so this step is deliberately separate from packaging.
 *
 * Usage:
 *   bun run scripts/promote-markdown.ts dist/boot-4.1.1 [--out markdown]
 *
 * Exit codes:
 *   0 — tree promoted
 *   1 — promotion failed
 *   2 — bad arguments
 */

import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'
import { parseReleaseName } from './lib/release-name.ts'

interface Args {
  readonly source: string
  readonly out: string
}

/**
 * Parse the CLI arguments.
 *
 * `--out` must carry a non-empty directory. Silently falling back to the
 * default on `--out` with nothing after it, or taking `--out=` as the empty
 * string, would promote the tree into an unintended root — `resolve(cwd, '')`
 * is the repository itself, where this script deletes and rewrites
 * `<project>/<version>/`.
 *
 * @throws if an option is unrecognized or missing its value, or no source is given.
 */
function parseArgs(argv: readonly string[]): Args {
  const positional: string[] = []
  let out = 'markdown'

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === undefined)
      continue
    if (arg === '--out' || arg.startsWith('--out=')) {
      const value = arg === '--out' ? argv[++i] : arg.slice('--out='.length)
      if (value === undefined || value === '' || value.startsWith('--'))
        throw new Error('Option "--out" needs a directory.')
      out = value
    }
    else if (arg.startsWith('--')) {
      throw new Error(`Unknown option "${arg}". Known: --out`)
    }
    else {
      positional.push(arg)
    }
  }

  const source = positional[0]
  if (!source) {
    throw new Error(
      'Usage: promote-markdown.ts <converted-dir> [--out <dir>]\n'
      + '  e.g. promote-markdown.ts dist/boot-4.1.1',
    )
  }
  return { source, out }
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
    const source = resolve(process.cwd(), args.source)
    const { project, version } = parseReleaseName(basename(source))
    const target = resolve(process.cwd(), args.out, project, version)

    const files = await readdir(source, { recursive: true, withFileTypes: true })
    const count = files.filter(entry => entry.isFile()).length
    if (count === 0)
      throw new Error(`${source} holds no files — convert before promoting`)

    // Replaced wholesale: a page deleted upstream must disappear here too,
    // otherwise the committed tree accumulates content no release carries.
    await rm(target, { recursive: true, force: true })
    await mkdir(target, { recursive: true })
    await cp(source, target, { recursive: true })

    console.log(`Promoted ${count} files to ${join(args.out, project, version)}/`)
  }
  catch (error) {
    console.error(`✗ promote-markdown failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

await main()
