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
 *   1 — conversion failed, a page produced an error, or `--strict` and either a
 *       page reported a conversion warning or Antora logged a message at the
 *       playbook's `failure_level`
 *   2 — bad arguments
 */

import type { AcceptedMissing } from './lib/upstream-sources.ts'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import loadAsciiDoc from '@antora/asciidoc-loader'
import aggregateContent from '@antora/content-aggregator'
import classifyContent from '@antora/content-classifier'
import antoraLogger from '@antora/logger'
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
  await writeFile(playbookPath, playbookFor(source, javadocLocation, hasCompanion))
  return playbookPath
}

/** The playbook {@link writePlaybook} writes, as text. */
export function playbookFor(source: string, javadocLocation: string, hasCompanion: boolean): string {
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
    // Applied by {@link configureLogger}. `format` is pinned because Antora's
    // `auto` picks JSON on stdout whenever stdout is not a TTY, which would
    // change the log a local run prints depending on how it is piped.
    '  log:',
    '    level: warn',
    '    failure_level: error',
    '    format: pretty',
    'urls:',
    '  latest_version_segment: \'\'',
    // Required by the playbook schema but never fetched: this pipeline runs the
    // content and asciidoc modules only, never the UI loader or site generator.
    'ui:',
    '  bundle:',
    '    url: \'./unused-ui-bundle.zip\'',
  ]
  return `${lines.join('\n')}\n`
}

/** The part of a built playbook {@link configureLogger} reads. */
interface LoggedPlaybook {
  readonly dir?: string
  readonly runtime: { readonly log: { readonly failureLevel: string } }
}

/** What Antora logged at or above the playbook's `failure_level`. */
interface LoggedFailures {
  /** Messages that fail a `--strict` build. */
  readonly failures: number
  /** Unresolved xrefs into an external component; see {@link externalXrefComponent}. */
  readonly externalXrefs: number
  /** Unresolved targets the era declares as accepted losses; see {@link isAcceptedLoss}. */
  readonly acceptedLosses: number
}

const XREF_NOT_FOUND = 'target of xref not found: '
const INCLUDE_NOT_FOUND = 'target of include not found: '

/**
 * The external component an unresolved-xref log message points into, if any.
 *
 * Antora logs every xref into a component absent from the content catalog as
 * `target of xref not found: <resource id>`, where the id is the author's own
 * spec, `[version@][component:][module:][family$]relative[#fragment]`. For a
 * component this build deliberately does not aggregate — `externalComponents`
 * in upstream-sources.ts — that dangling link is expected: the converter
 * rewrites it to the component's published docs.spring.io URL (see
 * `rewriteXrefTarget` in inline-html.ts), so the page loses nothing.
 *
 * The component is taken as the id's first colon-separated segment, which is
 * the same segment the converter keys its rewrite on. An id with no colon
 * (`attachment$api/java/index.html`) or whose first segment is not external
 * (`appendix:…`) names no external component, and stays a failure. So does a
 * versioned id (`4.1.1@maven-plugin:…`): the converter's rewrite does not
 * recognize the `version@` form, so that link would publish dangling.
 */
export function externalXrefComponent(message: unknown, external: ReadonlySet<string>): string | undefined {
  if (typeof message !== 'string' || !message.startsWith(XREF_NOT_FOUND))
    return undefined
  let id = message.slice(XREF_NOT_FOUND.length)
  const hash = id.indexOf('#')
  if (hash !== -1)
    id = id.slice(0, hash)
  if (id.includes('@'))
    return undefined
  const colon = id.indexOf(':')
  if (colon === -1)
    return undefined
  const component = id.slice(0, colon).toLowerCase()
  return external.has(component) ? component : undefined
}

/**
 * Whether a log message is an unresolved target the era accepts as lost.
 *
 * A synthesized Boot era cannot rebuild the generated appendix, and ADR-0004
 * and ADR-0006 accept shipping without it; the era declares exactly which
 * targets that leaves unresolved (`acceptedMissing` in upstream-sources.ts).
 * Only `target of include not found: <id>` and `target of xref not found: <id>`
 * qualify, and only when `<id>` equals a declared entry or starts with a
 * declared entry ending in `/` — so a new missing target, even one beside a
 * declared file, still fails the build. A prefix match must also stay inside
 * the declared directory: a remainder with a `..` segment could name any file.
 */
export function isAcceptedLoss(message: unknown, accepted: AcceptedMissing): boolean {
  if (typeof message !== 'string')
    return false
  const [id, entries] = message.startsWith(INCLUDE_NOT_FOUND)
    ? [message.slice(INCLUDE_NOT_FOUND.length), accepted.includes]
    : message.startsWith(XREF_NOT_FOUND)
      ? [message.slice(XREF_NOT_FOUND.length), accepted.xrefs]
      : [undefined, []]
  if (id === undefined)
    return false
  return entries.some(entry => entry.endsWith('/')
    ? id.startsWith(entry) && !id.slice(entry.length).split('/').includes('..')
    : id === entry)
}

/**
 * Apply the playbook's `runtime.log` to Antora's logger.
 *
 * The site generator normally does this, and this pipeline never runs it
 * (ADR-0002). Without this call the first message Antora logs creates a default
 * logger whose failure level is `silent`, so the playbook's `failure_level`
 * would be declared and never enforced.
 *
 * The verdict is this function's own count rather than `finalize()`'s
 * `failOnExit`, for two reasons. Antora sets `failOnExit` for every message at
 * the failure level, including the external-component xrefs
 * {@link externalXrefComponent} exempts, so its boolean cannot tell them apart.
 * And it only says *whether*, never *how many*. So `setFailOnExit` is disabled
 * and the root logger's own methods at or above the failure level are wrapped
 * instead: every Antora component logs through a child of the root, and each
 * child's method delegates to its parent's exactly once, so the root's method
 * sees each message once however deep the child. (Antora's hook is no
 * substitute for a counter anyway: every child re-decorates the inherited
 * method, so it fires once per nesting level.) Exempt messages — external
 * xrefs and the era's {@link isAcceptedLoss accepted losses} — are still
 * logged, only not counted as failures.
 *
 * Returns the finalizer, which flushes the log and resolves to the counts. It
 * is safe to call from both the success and the failure path: every call after
 * the first returns the first call's promise, so the logger is finalized once.
 */
function configureLogger(
  playbook: LoggedPlaybook,
  externalComponents: Readonly<Record<string, string>>,
  acceptedMissing: AcceptedMissing,
): () => Promise<LoggedFailures> {
  antoraLogger.configure(playbook.runtime.log, playbook.dir)
  const root = antoraLogger.get(null)
  if (!root)
    throw new Error('@antora/logger returned no root logger after configure()')
  // A message below the log level never reaches the wrappers — Asciidoctor's
  // adapter calls `setFailOnExit` for it directly — so such a playbook would
  // fail nothing.
  if (root.levelVal > root.failureLevelVal)
    throw new Error('runtime.log.level must not be above runtime.log.failure_level')

  const external = new Set(Object.keys(externalComponents).map(name => name.toLowerCase()))
  let failures = 0
  let externalXrefs = 0
  let acceptedLosses = 0
  root.setFailOnExit = () => {}
  const methods = root as unknown as Record<string, (...args: unknown[]) => void>
  for (const [level, value] of Object.entries(root.levels.values)) {
    if (value < root.failureLevelVal)
      continue
    const log = methods[level]
    if (typeof log !== 'function')
      continue
    methods[level] = function (this: unknown, ...args: unknown[]) {
      // pino's call shape: `(message)` or `(mergingObject, message)`.
      const message = typeof args[0] === 'string' ? args[0] : args[1]
      if (externalXrefComponent(message, external) !== undefined)
        externalXrefs++
      else if (isAcceptedLoss(message, acceptedMissing))
        acceptedLosses++
      else
        failures++
      log.apply(this, args)
    }
  }
  let finalized: Promise<LoggedFailures> | undefined
  return () => (finalized ??= antoraLogger.finalize()
    .then(() => ({ failures, externalXrefs, acceptedLosses })))
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
  // Outside the `try` so the failure path can flush it too: the pretty log
  // format writes through an async stream, and exiting without `finalize()`
  // can drop the very ERROR lines that explain the failure.
  let finalizeLogger: (() => Promise<LoggedFailures>) | undefined

  try {
    const upstream = resolveUpstream(args.project, args.version)
    const playbookPath = await writePlaybook(
      source,
      upstream.javadocLocation,
      upstream.assembly.descriptor === 'template',
    )

    const playbook = buildPlaybook(['--playbook', playbookPath], {})
    const loggedPlaybook = playbook as unknown as LoggedPlaybook
    // Before aggregation: Antora's component loggers bind to whatever root
    // logger exists when they first log.
    finalizeLogger = configureLogger(
      loggedPlaybook,
      upstream.externalComponents,
      upstream.acceptedMissing,
    )
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
    const logged = await finalizeLogger()

    // Every summary is printed before either `--strict` condition throws, so a
    // run that fails on one still reports the counts of the other.
    const strictFailures: string[] = []
    if (warnings.length > 0) {
      console.error(`${warnings.length} conversion warning(s):`)
      for (const warning of warnings.slice(0, 20)) console.error(`  - ${warning}`)
      if (warnings.length > 20)
        console.error(`  … and ${warnings.length - 20} more`)
      if (args.strict) {
        strictFailures.push(
          `${warnings.length} conversion warning(s) with --strict; add a conversion rule for each construct above`,
        )
      }
    }

    // The messages themselves are already in the log above; these only name
    // how many there were, so a long log is not the sole record of them.
    const level = loggedPlaybook.runtime.log.failureLevel.toUpperCase()
    if (logged.externalXrefs > 0) {
      console.error(
        `${logged.externalXrefs} ${level} xref(s) to external components, rewritten by the converter; not counted as failures`,
      )
    }
    if (logged.acceptedLosses > 0) {
      console.error(
        `${logged.acceptedLosses} ${level}(s) the era declares as accepted losses (ADR-0004); not counted as failures`,
      )
    }
    if (logged.failures > 0) {
      const summary = `${logged.failures} Antora log message(s) at ${level} or above`
      if (args.strict)
        strictFailures.push(`${summary} with --strict; see the ${level} lines above`)
      else
        console.error(summary)
    }
    if (strictFailures.length > 0)
      throw new Error(strictFailures.join('; and '))

    console.log(`Converted ${written.length} files to ${outDir}/`)
  }
  catch (error) {
    // A no-op when the success path already finalized; a flush failure must
    // not mask the error being reported.
    await finalizeLogger?.().catch(() => undefined)
    console.error(`✗ convert failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

// This module is imported directly by unit tests exercising `parseArgs`;
// without the guard that import would run `main()` against the test
// runner's own argv.
if (import.meta.main)
  await main()
