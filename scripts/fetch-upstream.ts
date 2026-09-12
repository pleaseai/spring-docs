#!/usr/bin/env bun
/**
 * Acquire one upstream `(project, version)` pair as a ready-to-classify Antora
 * content source.
 *
 * A sparse git checkout of the component root at the release tag supplies the
 * authored half. Where the generated half comes from depends on the version's
 * layout era (ADR-0004):
 *
 *   - archive era (4.0.8+): the content archives Spring publishes to Maven
 *     Central, carrying the resolved descriptor and the `example$` sample tree
 *   - synthesized era (3.3-3.x): those archives are excluded from the Maven
 *     Central sync, so the same inputs are rebuilt from the tag plus the
 *     published jars carrying configuration-property metadata
 *
 * Usage:
 *   bun run scripts/fetch-upstream.ts boot 4.1.1 --out dist/upstream
 *
 * Exit codes:
 *   0 — source tree written
 *   1 — fetch, download or merge failed
 *   2 — bad arguments
 */

import type { SynthesisSources, UpstreamCoordinates } from './lib/upstream-sources.ts'
import { Buffer } from 'node:buffer'
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { parseManagedVersions, synthesizeAttributes, versionSourceBoms } from './lib/antora-attributes.ts'
import { assertNoSymlinks } from './lib/reject-symlinks.ts'
import { mavenJarUrl, resolveUpstream } from './lib/upstream-sources.ts'

export interface Args {
  readonly project: string
  readonly version: string
  readonly out: string
}

export function parseArgs(argv: readonly string[]): Args {
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
  await run(
    ['git', 'sparse-checkout', 'set', '--no-cone', ...upstream.checkoutPaths],
    workDir,
  )
  await run(['git', 'checkout', '-q', 'FETCH_HEAD'], workDir)
  // `v4.1.1` is an annotated tag; FETCH_HEAD names the tag object, so peel it
  // to the commit it points at — manifest provenance must be a commit SHA.
  return run(['git', 'rev-parse', 'FETCH_HEAD^{commit}'], workDir)
}

/** Download one published archive and expand it over the component root. */
async function mergeArchive(url: string, componentRoot: string, workDir: string): Promise<void> {
  const zipPath = join(workDir, 'archive.zip')
  await writeFile(zipPath, await download(url))

  // Archives are laid out as `modules/**`, matching the component root.
  const expanded = join(workDir, 'expanded')
  await rm(expanded, { recursive: true, force: true })
  await run(['unzip', '-o', '-q', zipPath, '-d', expanded], workDir)
  // Reject before merging: a symlink in the archive would otherwise be
  // preserved into the committed content source (see reject-symlinks.ts).
  await assertNoSymlinks(expanded)
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

/** Download one file, failing loudly on any non-OK response. */
async function download(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`GET ${url} → ${response.status} ${response.statusText}`)
  return Buffer.from(await response.arrayBuffer())
}

/**
 * Serialize a component descriptor.
 *
 * Every attribute value is single-quoted: they carry `:`, `{`, `#` and `%`, each
 * of which changes meaning in a bare YAML scalar. Keys are plain identifiers by
 * construction, so they need no quoting.
 */
function renderDescriptor(
  name: string,
  version: string,
  hasNav: boolean,
  attributes: Readonly<Record<string, string>>,
): string {
  const lines = [`name: ${name}`, `version: '${version}'`]
  if (hasNav)
    lines.push('nav:', '- nav.adoc')
  lines.push('asciidoc:', '  attributes:')
  for (const [key, value] of Object.entries(attributes))
    lines.push(`    ${key}: '${value.replaceAll('\'', '\'\'')}'`)
  return `${lines.join('\n')}\n`
}

/** The `name:` entry of a component descriptor. */
const COMPONENT_NAME = /^name:[ \t]*(\S+)/m

/** The component name declared by the checked-out `antora.yml` stub. */
async function componentNameOf(componentRoot: string): Promise<string> {
  const stub = await readFile(join(componentRoot, 'antora.yml'), 'utf8')
  const name = COMPONENT_NAME.exec(stub)?.[1]
  if (name === undefined)
    throw new Error(`No component name in ${join(componentRoot, 'antora.yml')}`)
  return name
}

/**
 * Rebuild the component descriptor Spring's Gradle build would have generated.
 *
 * The checked-out `antora.yml` is a stub: it declares the component but carries
 * none of the ~900 attributes the build resolves from the dependency BOM, and
 * without them every `{url-…}` reference in the corpus renders literally.
 */
async function writeSynthesizedDescriptor(
  upstream: UpstreamCoordinates,
  synthesis: SynthesisSources,
  checkout: string,
  componentRoot: string,
): Promise<void> {
  const readSource = (path: string): Promise<string> => readFile(join(checkout, path), 'utf8')
  const bomBuildScript = await readSource(synthesis.bomBuildScriptPath)
  const gradleProperties = await readSource(synthesis.gradlePropertiesPath)

  const { attributes, unresolved } = synthesizeAttributes({
    version: upstream.version,
    githubRepo: upstream.repo,
    staticAttributes: await readSource(synthesis.staticAttributesPath),
    bomBuildScript,
    gradleProperties,
    managedVersions: await fetchManagedVersions(bomBuildScript, gradleProperties),
  })

  if (unresolved.length > 0)
    console.warn(`  ${unresolved.length} attribute(s) unresolved: ${unresolved.join(', ')}`)

  const descriptor = renderDescriptor(
    await componentNameOf(componentRoot),
    upstream.version,
    await Bun.file(join(componentRoot, 'nav.adoc')).exists(),
    attributes,
  )
  await writeFile(join(componentRoot, 'antora.yml'), descriptor)
  console.log(`  Synthesized ${Object.keys(attributes).length} asciidoc attributes`)
}

/**
 * Resolve every managed dependency version the attribute set needs.
 *
 * The build script imports a BOM for these instead of naming them, so each such
 * BOM is fetched from Maven Central and read. A BOM that cannot be fetched is
 * reported and skipped: the attributes it would have supplied are then withheld
 * by `synthesizeAttributes` rather than emitted half-resolved.
 */
async function fetchManagedVersions(
  bomBuildScript: string,
  gradleProperties: string,
): Promise<Readonly<Record<string, string>>> {
  const versions: Record<string, string> = {}

  for (const bom of versionSourceBoms(bomBuildScript, gradleProperties)) {
    const path = `${bom.groupId.replaceAll('.', '/')}/${bom.artifactId}/${bom.version}`
    const url = `https://repo1.maven.org/maven2/${path}/${bom.artifactId}-${bom.version}.pom`
    try {
      const pom = (await download(url)).toString('utf8')
      Object.assign(versions, parseManagedVersions(pom, bom.version))
    }
    catch (error) {
      console.warn(`  ${bom.artifactId} ${bom.version} unavailable: ${
        error instanceof Error ? error.message : String(error)}`)
    }
  }

  return versions
}

/**
 * Copy the documentation module's sources in as the `example$` family.
 *
 * `include-code::` resolves against `ROOT:example$`, which the Gradle build fills
 * from this directory. Without it every one of the corpus's code includes
 * resolves to nothing — silently, as an empty tab group.
 */
async function copyExamples(
  synthesis: SynthesisSources,
  checkout: string,
  componentRoot: string,
): Promise<void> {
  const examples = join(componentRoot, 'modules', 'ROOT', 'examples')
  await mkdir(examples, { recursive: true })
  await cp(join(checkout, synthesis.examplesPath), examples, { recursive: true, force: true })
}

/**
 * Drop each published jar's configuration metadata in as a partial.
 *
 * `configprop:` validates every property name against any partial called
 * `spring-configuration-metadata.json`, wherever it sits in the component
 * (`configuration-properties-extension.js`), so the directory below is for human
 * readers rather than for resolution.
 */
async function addConfigurationMetadata(
  upstream: UpstreamCoordinates,
  synthesis: SynthesisSources,
  componentRoot: string,
  workDir: string,
): Promise<void> {
  const partials = join(componentRoot, 'modules', 'ROOT', 'partials')

  for (const artifact of synthesis.metadataArtifacts) {
    const jarPath = join(workDir, `${artifact}.jar`)
    await writeFile(
      jarPath,
      await download(mavenJarUrl('org/springframework/boot', artifact, upstream.version)),
    )
    const metadata = await run(
      ['unzip', '-p', jarPath, 'META-INF/spring-configuration-metadata.json'],
      workDir,
    )
    await mkdir(join(partials, artifact), { recursive: true })
    await writeFile(join(partials, artifact, 'spring-configuration-metadata.json'), metadata)
    await rm(jarPath, { force: true })
  }

  console.log(`  Added metadata from ${synthesis.metadataArtifacts.length} published jars`)
}

async function main(): Promise<void> {
  // `resolveUpstream` rejects an unknown project, a non-GA version and one below
  // the supported floor — all bad *arguments*, so it is resolved inside this
  // handler. Outside it, those throws escape as an uncaught exception and the CLI
  // exits 1, contradicting the documented exit 2.
  let upstream: UpstreamCoordinates
  let args: Args
  try {
    args = parseArgs(process.argv.slice(2))
    upstream = resolveUpstream(args.project, args.version)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
  }

  const outDir = resolve(process.cwd(), args.out, `${upstream.project}-${upstream.version}`)
  const workDir = await mkdtemp(join(tmpdir(), 'spring-docs-fetch-'))

  try {
    console.log(`Fetching ${upstream.repo}@${upstream.tag} (${upstream.componentPath})`)
    const commit = await checkoutComponent(upstream, workDir)

    await rm(outDir, { recursive: true, force: true })
    await mkdir(outDir, { recursive: true })
    await cp(join(workDir, upstream.componentPath), outDir, { recursive: true })

    if (upstream.assembly.descriptor === 'archive') {
      for (const archive of upstream.archives) {
        console.log(`Merging ${archive.classifier}`)
        await mergeArchive(archive.url, outDir, workDir)
      }
      await promoteDescriptor(outDir)
    }
    else {
      console.log('Reconstructing the generated half of the component')
      const { synthesis } = upstream.assembly
      await copyExamples(synthesis, workDir, outDir)
      await writeSynthesizedDescriptor(upstream, synthesis, workDir, outDir)
      await addConfigurationMetadata(upstream, synthesis, outDir, workDir)
    }
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
          assembly: upstream.assembly.descriptor,
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
    // Not `process.exit(1)`: that terminates before `finally` runs and leaks the
    // temporary checkout. Setting the code and returning lets cleanup happen.
    process.exitCode = 1
  }
  finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

// This module is imported directly by unit tests exercising `parseArgs`;
// without the guard that import would run `main()` against the test
// runner's own argv.
if (import.meta.main)
  await main()
