#!/usr/bin/env bun
/**
 * Acquire one upstream `(project, version)` pair as a ready-to-classify Antora
 * content source.
 *
 * A sparse git checkout of the component root at the release tag supplies the
 * authored half. Where the generated half comes from depends on the version's
 * layout era (ADR-0004):
 *
 *   - archive era (Boot 4.0.8+): the content archives Spring publishes to Maven
 *     Central, carrying the resolved descriptor and the `example$` sample tree
 *   - synthesized era (Boot 3.3-3.x): those archives are excluded from the Maven
 *     Central sync, so the same inputs are rebuilt from the tag plus the
 *     published jars carrying configuration-property metadata
 *   - overlay era (Framework 6.1+): the tag already carries a complete
 *     descriptor and its own examples, so nothing is fetched — the committed
 *     `antora.yml` is topped up with the version and the attributes the build
 *     would have contributed
 *   - template era (Spring Data 3.2+): the committed stub is filled from a
 *     Maven resources template, whose properties come from the store's POM and
 *     the `spring-data-build` parent POM at the tag it names; the component its
 *     pages include is checked out beside it, at the version the POM pins
 *
 * Usage:
 *   bun run scripts/fetch-upstream.ts boot 4.1.1 --out dist/upstream
 *
 * Exit codes:
 *   0 — source tree written
 *   1 — a required upstream artifact is unpublished, or fetch/download/merge failed
 *   2 — bad arguments
 */

import type { ManagedVersionAttribute } from './lib/antora-attributes.ts'
import type { Fetcher } from './lib/artifact-availability.ts'
import type { Attributes } from './lib/component-descriptor.ts'
import type {
  DerivedAttributes,
  PinnedRepository,
  SynthesisSources,
  TemplateSources,
  UpstreamCoordinates,
} from './lib/upstream-sources.ts'
import { Buffer } from 'node:buffer'
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { parseManagedVersions, synthesizeAttributes, versionSourceBoms } from './lib/antora-attributes.ts'
import { unpublishedArtifacts } from './lib/artifact-availability.ts'
import { componentNameOf, overlayDescriptor, renderDescriptor } from './lib/component-descriptor.ts'
import { fillTemplate, parsePom, resolveTemplateProperties } from './lib/maven-template.ts'
import { assertNoSymlinks, materializeDeclaredSymlinks } from './lib/reject-symlinks.ts'
import {
  COMPANION_START_PATH,
  isGaVersion,
  requiredArtifactUrls,
  resolveUpstream,
} from './lib/upstream-sources.ts'

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
 * Sparse-checkout `paths` of one repository at one tag into `dir`.
 *
 * @returns the resolved commit SHA
 */
async function sparseCheckout(
  cloneUrl: string,
  tag: string,
  paths: readonly string[],
  dir: string,
): Promise<string> {
  await mkdir(dir, { recursive: true })
  await run(['git', 'init', '-q', '.'], dir)
  await run(['git', 'remote', 'add', 'origin', cloneUrl], dir)
  await run(['git', 'fetch', '--depth', '1', '--filter=blob:none', '-q', 'origin', tag], dir)
  await run(['git', 'sparse-checkout', 'set', '--no-cone', ...paths], dir)
  await run(['git', 'checkout', '-q', 'FETCH_HEAD'], dir)
  // `v4.1.1` is an annotated tag; FETCH_HEAD names the tag object, so peel it
  // to the commit it points at — manifest provenance must be a commit SHA.
  return run(['git', 'rev-parse', 'FETCH_HEAD^{commit}'], dir)
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
  return sparseCheckout(upstream.cloneUrl, upstream.tag, upstream.checkoutPaths, workDir)
}

/** A second repository a template era read, recorded for provenance. */
interface PinnedCheckout {
  readonly repo: string
  readonly ref: string
  readonly commit: string
}

/** Sparse-checkout `paths` of a {@link PinnedRepository} at `version`. */
async function checkoutPinned(
  pinned: PinnedRepository,
  version: string,
  paths: readonly string[],
  dir: string,
): Promise<PinnedCheckout> {
  const ref = `${pinned.tagPrefix}${version}`
  const commit = await sparseCheckout(`https://github.com/${pinned.repo}.git`, ref, paths, dir)
  return { repo: pinned.repo, ref, commit }
}

/**
 * Copy a tree into the content source, refusing anything but regular files and
 * directories.
 *
 * The guard is bound to the copy rather than left as a separate call beside it,
 * because a separate call is one a later copy can simply not make — which is how
 * it came to cover the expanded archive and neither of the two trees taken from
 * the git checkout.
 */
export async function copyIntoContentSource(source: string, dest: string): Promise<void> {
  await assertNoSymlinks(source)
  await cp(source, dest, { recursive: true, force: true })
}

/** Download one published archive and expand it over the component root. */
async function mergeArchive(url: string, componentRoot: string, workDir: string): Promise<void> {
  const zipPath = join(workDir, 'archive.zip')
  await writeFile(zipPath, await download(url))

  // Archives are laid out as `modules/**`, matching the component root.
  const expanded = join(workDir, 'expanded')
  await rm(expanded, { recursive: true, force: true })
  await run(['unzip', '-o', '-q', zipPath, '-d', expanded], workDir)
  await copyIntoContentSource(expanded, componentRoot)
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
    managedVersions: await fetchManagedVersions(
      bomBuildScript,
      gradleProperties,
      synthesis.managedVersionAttributes,
    ),
    managedVersionAttributes: synthesis.managedVersionAttributes,
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
 * Overlay the checked-in component descriptor with the version and the
 * attributes the upstream build would have contributed.
 *
 * Unlike the synthesized era, the checked-out `antora.yml` here is not a stub —
 * Spring Framework commits all 96 lines of its attributes and generates exactly
 * one. So this rewrites the file in place, preserving what it already carries,
 * rather than replacing it.
 */
async function writeOverlaidDescriptor(
  upstream: UpstreamCoordinates,
  generated: Attributes,
  componentRoot: string,
): Promise<void> {
  const path = join(componentRoot, 'antora.yml')
  await writeFile(
    path,
    overlayDescriptor(await readFile(path, 'utf8'), upstream.version, generated),
  )
  const names = Object.keys(generated)
  console.log(
    `  Overlaid ${names.length} generated attribute(s) onto the checked-in descriptor`
    + `${names.length > 0 ? `: ${names.join(', ')}` : ''}`,
  )
}

/**
 * Evaluate the attributes an overlay era derives from files in the checkout.
 *
 * Spring Security's build resolves its documentation URLs and four dependency
 * versions out of the committed version catalog and `gradle.properties` rather
 * than out of the version alone, so those files are read here — from the same
 * sparse checkout the prose came from, which is why the era declares their paths
 * as part of `checkoutPaths`.
 *
 * An attribute the checkout does not declare is reported. It is upstream's own
 * shape rather than a failure — the dependency set moves with the line — but a
 * page referencing one publishes a literal `{name}`, so the name is printed
 * rather than the count alone.
 */
async function deriveAttributes(
  derived: DerivedAttributes,
  version: string,
  checkout: string,
): Promise<Attributes> {
  const sources: Record<string, string> = {}
  for (const path of derived.sources)
    sources[path] = await readFile(join(checkout, path), 'utf8')

  const { attributes, absent } = derived.resolve(version, sources)
  if (absent.length > 0) {
    console.warn(
      `  ${absent.length} derived attribute(s) this version declares no value for: ${absent.join(', ')}`,
    )
  }
  return attributes
}
/**
 * Fill the checked-in stub descriptor from the store's Maven resources template,
 * and check out the component its pages include beside it.
 *
 * The template's properties resolve from two POMs: the store's own, in this
 * checkout, and the `spring-data-parent` it inherits, committed in
 * `spring-data-build` at the tag its `<parent>` names. `${current.year}` is the
 * tag commit's year rather than the clock's, so a rebuild reproduces the same
 * bytes.
 *
 * The companion is checked out at the version a property names, which is also
 * the version the pages' `include::{commons}@data-commons::…` asks for, and is
 * written under {@link COMPANION_START_PATH} with that version resolved into
 * its own stub.
 *
 * @returns where the two extra repositories were read, for provenance
 */
async function assembleFromTemplate(
  upstream: UpstreamCoordinates,
  template: TemplateSources,
  checkout: string,
  componentRoot: string,
): Promise<{ readonly parent: PinnedCheckout, readonly companion: PinnedCheckout }> {
  const projectPom = await readFile(join(checkout, template.pomPath), 'utf8')
  const parentCoordinates = parsePom(projectPom).parent
  const declared = parentCoordinates === undefined
    ? 'none'
    : `${parentCoordinates.groupId}:${parentCoordinates.artifactId}`
  if (parentCoordinates === undefined || declared !== template.parent.coordinates) {
    throw new Error(
      `${template.pomPath} inherits from ${declared}, not ${template.parent.coordinates} — `
      + `the template's properties would be read from the wrong parent POM`,
    )
  }

  const parentDir = join(checkout, '.spring-docs-parent')
  const parent = await checkoutPinned(
    template.parent,
    parentCoordinates.version,
    [template.parent.pomPath],
    parentDir,
  )

  const commitDate = await run(['git', 'show', '-s', '--format=%cI', 'HEAD'], checkout)
  const properties = resolveTemplateProperties({
    version: upstream.version,
    projectPom,
    parentPom: await readFile(join(parentDir, template.parent.pomPath), 'utf8'),
    commitYear: String(new Date(commitDate).getUTCFullYear()),
  })
  const attributes = fillTemplate(
    await readFile(join(checkout, template.templatePath), 'utf8'),
    properties,
  )
  await writeOverlaidDescriptor(upstream, attributes, componentRoot)

  const companionVersion = properties.get(template.companion.versionProperty)
  if (companionVersion === undefined || !isGaVersion(companionVersion)) {
    throw new Error(
      `${template.companion.versionProperty} is ${companionVersion ?? 'undeclared'}, `
      + `not a GA version of ${template.companion.repo} to check out`,
    )
  }
  const companionDir = join(checkout, '.spring-docs-companion')
  const companion = await checkoutPinned(
    template.companion,
    companionVersion,
    [template.companion.componentPath],
    companionDir,
  )
  const companionRoot = join(componentRoot, COMPANION_START_PATH)
  if (await Bun.file(join(companionRoot, 'antora.yml')).exists())
    throw new Error(`${upstream.componentPath} already has a ${COMPANION_START_PATH}/ of its own`)
  await copyIntoContentSource(join(companionDir, template.companion.componentPath), companionRoot)
  const companionDescriptor = join(companionRoot, 'antora.yml')
  await writeFile(
    companionDescriptor,
    overlayDescriptor(await readFile(companionDescriptor, 'utf8'), companionVersion, {}),
  )
  console.log(`  Included ${companion.repo}@${companion.ref} as ${COMPANION_START_PATH}/`)

  return { parent, companion }
}

/**
 * Resolve every managed dependency version the attribute set needs.
 *
 * The build script imports a BOM for these instead of naming them, so each such
 * BOM is fetched from Maven Central and read.
 *
 * A BOM that cannot be fetched fails the build. It used to be reported and
 * skipped, on the reasoning that `synthesizeAttributes` would withhold the
 * attributes it fed — but withholding is silent: an attribute that is never set
 * cannot carry an unresolved placeholder, so it never reaches `unresolved` and
 * nothing counts it. A transient Maven Central error would then publish pages
 * with literal `{version-jackson-databind}` text and exit 0, which is the exact
 * failure this whole reconstruction exists to remove. Every BOM reaching this
 * loop is one the tag's own build script imports, so none of them is optional.
 */
async function fetchManagedVersions(
  bomBuildScript: string,
  gradleProperties: string,
  managedVersionAttributes: readonly ManagedVersionAttribute[],
): Promise<Readonly<Record<string, string>>> {
  const versions: Record<string, string> = {}

  for (const bom of versionSourceBoms(bomBuildScript, gradleProperties, managedVersionAttributes)) {
    const path = `${bom.groupId.replaceAll('.', '/')}/${bom.artifactId}/${bom.version}`
    const url = `https://repo1.maven.org/maven2/${path}/${bom.artifactId}-${bom.version}.pom`
    try {
      const pom = (await download(url)).toString('utf8')
      Object.assign(versions, parseManagedVersions(pom, bom.version))
    }
    catch (error) {
      throw new Error(
        `${bom.groupId}:${bom.artifactId}:${bom.version} supplies managed versions this `
        + `component needs, and could not be read from ${url}: ${
          error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      )
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
export async function copyExamples(
  synthesis: SynthesisSources,
  checkout: string,
  componentRoot: string,
): Promise<void> {
  const examples = join(componentRoot, 'modules', 'ROOT', 'examples')
  await mkdir(examples, { recursive: true })
  await copyIntoContentSource(join(checkout, synthesis.examplesPath), examples)
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
  componentRoot: string,
  workDir: string,
): Promise<void> {
  const partials = join(componentRoot, 'modules', 'ROOT', 'partials')

  // The same list `requiredArtifactUrls` gates on, so a version detection called
  // buildable cannot 404 here on a URL the two sides spelled differently.
  for (const jar of upstream.metadataJars) {
    const jarPath = join(workDir, `${jar.artifact}.jar`)
    await writeFile(jarPath, await download(jar.url))
    const metadata = await run(
      ['unzip', '-p', jarPath, 'META-INF/spring-configuration-metadata.json'],
      workDir,
    )
    await mkdir(join(partials, jar.artifact), { recursive: true })
    await writeFile(join(partials, jar.artifact, 'spring-configuration-metadata.json'), metadata)
    await rm(jarPath, { force: true })
  }

  console.log(`  Added metadata from ${upstream.metadataJars.length} published jars`)
}

/**
 * Refuse a version whose upstream artifacts are not all published yet.
 *
 * The era model answers "where does this version's component live and how is its
 * generated half assembled" — a permanent layout fact. Whether the artifacts that
 * assembly reads have actually been published is a separate, mutable one: 4.1.0
 * is tagged with no content archive today and may have one tomorrow. Encoding it
 * as an era gap would refuse 4.1.0 forever (#19), so it is checked here instead.
 *
 * `detect-upstream-versions.ts` makes this same check before offering a version
 * as buildable, which is why a version reaching this point normally passes. It
 * runs anyway because a direct invocation bypasses detection entirely, and the
 * alternative is a 404 partway through — after a clone, with a message about one
 * jar rather than about the version.
 */
export async function assertArtifactsPublished(
  upstream: UpstreamCoordinates,
  fetchImpl?: Fetcher,
): Promise<void> {
  const missing = await unpublishedArtifacts(
    requiredArtifactUrls(upstream.project, upstream.version),
    { fetchImpl },
  )
  if (missing.length === 0)
    return

  throw new Error(
    `${upstream.project} ${upstream.version} is tagged upstream but cannot be built yet: `
    + `${missing.length} required artifact(s) are not published.\n`
    + `${missing.map(url => `  ${url}`).join('\n')}\n`
    + `This is a publication fact, not a layout one — it can change with no code change here.`,
  )
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
    await assertArtifactsPublished(upstream)

    console.log(`Fetching ${upstream.repo}@${upstream.tag} (${upstream.componentPath})`)
    const commit = await checkoutComponent(upstream, workDir)

    await rm(outDir, { recursive: true, force: true })
    await mkdir(outDir, { recursive: true })

    let templateCheckouts: Awaited<ReturnType<typeof assembleFromTemplate>> | undefined
    const checkedOutComponent = join(workDir, upstream.componentPath)
    if (upstream.assembly.descriptor === 'overlay') {
      // Before the copy, not after: `copyIntoContentSource` refuses every
      // symlink, so a declared one has to become a real tree while it can still
      // be resolved against the checkout it points into.
      await materializeDeclaredSymlinks(checkedOutComponent, upstream.assembly.internalSymlinks)
    }
    await copyIntoContentSource(checkedOutComponent, outDir)

    switch (upstream.assembly.descriptor) {
      case 'archive': {
        for (const archive of upstream.archives) {
          console.log(`Merging ${archive.classifier}`)
          await mergeArchive(archive.url, outDir, workDir)
        }
        await promoteDescriptor(outDir)
        break
      }
      case 'synthesized': {
        console.log('Reconstructing the generated half of the component')
        const { synthesis } = upstream.assembly
        await copyExamples(synthesis, workDir, outDir)
        await writeSynthesizedDescriptor(upstream, synthesis, workDir, outDir)
        await addConfigurationMetadata(upstream, outDir, workDir)
        break
      }
      case 'overlay': {
        console.log('Overlaying the checked-in component descriptor')
        const { generatedAttributes, derivedAttributes } = upstream.assembly
        const attributes = derivedAttributes === undefined
          ? generatedAttributes
          : {
              ...generatedAttributes,
              ...await deriveAttributes(derivedAttributes, upstream.version, workDir),
            }
        await writeOverlaidDescriptor(upstream, attributes, outDir)
        break
      }
      case 'template': {
        console.log('Filling the checked-in component descriptor from its Maven template')
        templateCheckouts = await assembleFromTemplate(
          upstream,
          upstream.assembly.template,
          workDir,
          outDir,
        )
        break
      }
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
          ...(templateCheckouts === undefined ? {} : { template_sources: templateCheckouts }),
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
