#!/usr/bin/env bun
/**
 * Convert one fetched upstream Antora source tree to Markdown.
 *
 * Drives Antora's pipeline modules directly (ADR-0002): the playbook is built in
 * memory, content is aggregated and classified, and each page is loaded as a
 * fully resolved Asciidoctor document — xrefs, includes, `include-code::`,
 * `javadoc:` and `configprop:` already expanded — before our own pure converter
 * emits Markdown.
 *
 * Usage:
 *   bun run scripts/convert.ts dist/upstream/boot-4.1.1 \
 *     --project boot --version 4.1.1 --out dist [--strict]
 *
 * Exit codes:
 *   0 — every page converted
 *   1 — conversion failed, a page produced an error, or `--strict` and a page
 *       reported a conversion warning
 *   2 — bad arguments
 */

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import loadAsciiDoc from '@antora/asciidoc-loader'
import aggregateContent from '@antora/content-aggregator'
import classifyContent from '@antora/content-classifier'
import buildPlaybook from '@antora/playbook-builder'
import { componentNameOf } from './lib/component-descriptor.ts'
import { convertDocument } from './lib/markdown-converter.ts'
import { assertUniquePaths, buildIndex, INDEX_FILENAME, outputPathFor } from './lib/output-layout.ts'
import { COMPANION_START_PATH, resolveUpstream } from './lib/upstream-sources.ts'

/**
 * Asciidoctor extensions to register.
 *
 * `@asciidoctor/tabs` is deliberately absent: it rewrites tab groups into HTML
 * passthrough blocks, destroying the structure we convert to headed code fences.
 * See `.please/docs/knowledge/upstream-antora.md`.
 */
const ASCIIDOC_EXTENSIONS = [
  '@springio/asciidoctor-extensions',
  '@springio/asciidoctor-extensions/javadoc-extension',
  '@springio/asciidoctor-extensions/configuration-properties-extension',
  '@springio/asciidoctor-extensions/section-ids-extension',
] as const

/**
 * Attributes upstream sets in its playbook template.
 *
 * `javadoc-location` differs deliberately: upstream points it at an `api` Antora
 * component built from a javadoc archive, which this build does not produce. It
 * is overridden per project in {@link writePlaybook}.
 */
const PLAYBOOK_ATTRIBUTES = {
  'chomp': 'all',
  'hide-uri-scheme': '@',
  'page-pagination': '',
  'tabs-sync-option': '@',
} as const

export interface Args {
  readonly source: string
  readonly project: string
  readonly version: string
  readonly out: string
  /** Treat conversion warnings as failures (ARCHITECTURE: no silent fallbacks). */
  readonly strict: boolean
}

export function parseArgs(argv: readonly string[]): Args {
  const positional: string[] = []
  const flags = new Map<string, string>()
  let strict = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--strict') {
      strict = true
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
    else if (arg !== undefined) {
      positional.push(arg)
    }
  }

  const source = positional[0]
  const project = flags.get('project')
  const version = flags.get('version')
  const out = flags.get('out')
  if (!source || !project || !version || !out) {
    throw new Error(
      'Usage: convert.ts <source-dir> --project <p> --version <v> --out <dir> [--strict]\n'
      + '  e.g. convert.ts dist/upstream/boot-4.1.1 --project boot --version 4.1.1 --out dist',
    )
  }
  return { source, project, version, out, strict }
}

/**
 * Write the playbook Antora needs.
 *
 * `buildPlaybook` is file-driven, so the playbook is materialized next to the
 * source tree rather than constructed as a plain object — that also keeps the
 * exact configuration inspectable after a failed run.
 */
async function writePlaybook(
  source: string,
  javadocLocation: string,
  hasCompanion: boolean,
): Promise<string> {
  const playbookPath = join(source, '.antora-playbook.yml')
  const lines = [
    'site: {}',
    'content:',
    '  sources:',
    `  - url: ${JSON.stringify(source)}`,
    '    branches: HEAD',
    // A template era's included component sits beside the primary one in the
    // same tree, so it is a second start path of the same source.
    ...(hasCompanion ? [`    start_paths: ${JSON.stringify(['.', COMPANION_START_PATH])}`] : []),
    'asciidoc:',
    '  sourcemap: true',
    '  attributes:',
    ...Object.entries({ ...PLAYBOOK_ATTRIBUTES, 'javadoc-location': javadocLocation })
      .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`),
    '  extensions:',
    ...ASCIIDOC_EXTENSIONS.map(e => `  - ${JSON.stringify(e)}`),
    // No `antora.extensions` block: those are loaded by the site generator, which
    // this pipeline never runs. Declaring them here would be silently ignored.
    'runtime:',
    '  log:',
    '    level: warn',
    '    failure_level: error',
    'urls:',
    '  latest_version_segment: \'\'',
    // Required by the playbook schema but never fetched: this pipeline runs the
    // content and asciidoc modules only, never the UI loader or site generator.
    'ui:',
    '  bundle:',
    '    url: \'./unused-ui-bundle.zip\'',
  ]
  await writeFile(playbookPath, `${lines.join('\n')}\n`)
  return playbookPath
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

  const source = resolve(process.cwd(), args.source)
  const outDir = resolve(process.cwd(), args.out, `${args.project}-${args.version}`)

  try {
    const upstream = resolveUpstream(args.project, args.version)
    const playbookPath = await writePlaybook(
      source,
      upstream.javadocLocation,
      upstream.assembly.descriptor === 'template',
    )

    const playbook = buildPlaybook(['--playbook', playbookPath], {})
    const asciidocConfig = loadAsciiDoc.resolveConfig(playbook)
    const catalog = classifyContent(playbook, await aggregateContent(playbook), asciidocConfig)
    // Only the component at the source root is published. A companion's pages
    // reach the release through the pages that include them, and emitting them
    // on their own would publish another project's documentation under this one.
    const component = await componentNameOf(source)
    const pages = catalog.getPages(page => Boolean(page.out) && page.src.component === component)

    if (pages.length === 0) {
      throw new Error(`No pages classified from ${source} — is antora.yml present?`)
    }

    assertUniquePaths([...pages.map(outputPathFor), INDEX_FILENAME])

    await rm(outDir, { recursive: true, force: true })
    await mkdir(outDir, { recursive: true })

    const warnings: string[] = []
    const written: string[] = []

    for (const page of pages) {
      const componentVersion = catalog.getComponentVersion(page.src.component, page.src.version)
      const doc = loadAsciiDoc(page, catalog, componentVersion.asciidoc)
      const sourcePath = `${page.src.module}:${page.src.relative}`
      const result = convertDocument(doc, {
        externalComponents: upstream.externalComponents,
        imageBase: upstream.imageBase,
        sourcePath,
      })

      for (const warning of result.warnings) warnings.push(`${sourcePath}: ${warning}`)

      const relativeOut = outputPathFor(page)
      const target = join(outDir, relativeOut)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, result.markdown)
      written.push(relativeOut)
    }

    await writeFile(join(outDir, INDEX_FILENAME), buildIndex(args.project, args.version, written))
    await rm(playbookPath, { force: true })

    if (warnings.length > 0) {
      console.error(`${warnings.length} conversion warning(s):`)
      for (const warning of warnings.slice(0, 20)) console.error(`  - ${warning}`)
      if (warnings.length > 20)
        console.error(`  … and ${warnings.length - 20} more`)
      if (args.strict) {
        throw new Error(
          `${warnings.length} conversion warning(s) with --strict; add a conversion rule for each construct above`,
        )
      }
    }

    console.log(`Converted ${written.length} files to ${outDir}/`)
  }
  catch (error) {
    console.error(`✗ convert failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

// This module is imported directly by unit tests exercising `parseArgs`;
// without the guard that import would run `main()` against the test
// runner's own argv.
if (import.meta.main)
  await main()
