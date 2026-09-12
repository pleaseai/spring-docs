/**
 * Reconstruct the asciidoc attributes Spring Boot's Gradle build resolves into
 * the component descriptor, for eras that publish no content archive (ADR-0004).
 *
 * A port of `buildSrc/.../antora/AntoraAsciidocAttributes.java`, driven by the
 * same inputs read from the release tag: the static attributes properties file,
 * the dependency BOM build script, and `gradle.properties`. Pure — every input
 * arrives as text, so the whole reconstruction is unit-testable against the
 * descriptor 4.x publishes.
 *
 * Anything the sources cannot supply is reported in {@link SynthesizedAttributes.unresolved}
 * rather than emitted with a dangling `{placeholder}`: a half-rendered URL reads
 * as a working link and is worse than an absent attribute, which Asciidoctor at
 * least warns about.
 */

import type { BomLibrary, ImportedBom } from './bom-libraries.ts'
import { hasUnconsumedSpecifier, parseBomLibraries, renderLink } from './bom-libraries.ts'

/** Everything the reconstruction reads, as file contents. */
export interface AttributeSources {
  /** The Spring Boot version being built, e.g. `3.5.16`. */
  readonly version: string
  /** `owner/name` of the upstream repository. */
  readonly githubRepo: string
  /** Contents of `antora-asciidoc-attributes.properties`. */
  readonly staticAttributes: string
  /** Contents of the dependency BOM's `build.gradle`. */
  readonly bomBuildScript: string
  /** Contents of the repository's `gradle.properties`. */
  readonly gradleProperties: string
  /**
   * Versions of managed dependencies, keyed `groupId:artifactId`.
   *
   * The build script imports a BOM for these rather than naming each module's
   * version, so they are the one attribute source not present in the checkout.
   * Assemble it with {@link versionSourceBoms} and {@link parseManagedVersions}.
   */
  readonly managedVersions: Readonly<Record<string, string>>
}

/** The reconstructed attribute map, plus what could not be reconstructed. */
export interface SynthesizedAttributes {
  /** Attribute name to value, in the order upstream emits them. */
  readonly attributes: Readonly<Record<string, string>>
  /**
   * Attributes whose value still referenced a placeholder no source resolved.
   *
   * Sorted, so a build log or a test can compare it without ordering noise.
   */
  readonly unresolved: readonly string[]
}

/** The `groupId` every Spring Data module shares. */
const SPRING_DATA_GROUP = 'org.springframework.data'

/**
 * Spring Data modules whose version upstream turns into attributes.
 *
 * Names mirror `AntoraAsciidocAttributes.addVersionAttributes`; `spring-data-rest`
 * is the one whose attribute name and artifact id differ. Each also contributes
 * the `antoraversion-`/`dotxversion-` values the static properties file reads.
 */
const SPRING_DATA_MODULES: readonly (readonly [name: string, artifact: string])[] = [
  ['spring-data-commons', 'spring-data-commons'],
  ['spring-data-couchbase', 'spring-data-couchbase'],
  ['spring-data-cassandra', 'spring-data-cassandra'],
  ['spring-data-elasticsearch', 'spring-data-elasticsearch'],
  ['spring-data-jdbc', 'spring-data-jdbc'],
  ['spring-data-jpa', 'spring-data-jpa'],
  ['spring-data-mongodb', 'spring-data-mongodb'],
  ['spring-data-neo4j', 'spring-data-neo4j'],
  ['spring-data-r2dbc', 'spring-data-r2dbc'],
  ['spring-data-redis', 'spring-data-redis'],
  ['spring-data-rest', 'spring-data-rest-core'],
  ['spring-data-ldap', 'spring-data-ldap'],
]

/**
 * Other managed dependencies upstream names one by one, and the BOM library
 * whose import pins each.
 *
 * Mirrors the explicit `addDependencyVersion` calls in
 * `AntoraAsciidocAttributes.addVersionAttributes`. The corpus references these
 * directly — `version-jackson-databind` alone appears 30 times in 3.5.16 — so
 * leaving them out is visible in the output.
 */
const MANAGED_VERSION_ATTRIBUTES: readonly {
  readonly attribute: string
  readonly library: string
  readonly groupId: string
  readonly artifactId: string
}[] = [
  { attribute: 'jackson-annotations', library: 'Jackson Bom', groupId: 'com.fasterxml.jackson.core', artifactId: 'jackson-annotations' },
  { attribute: 'jackson-core', library: 'Jackson Bom', groupId: 'com.fasterxml.jackson.core', artifactId: 'jackson-core' },
  { attribute: 'jackson-databind', library: 'Jackson Bom', groupId: 'com.fasterxml.jackson.core', artifactId: 'jackson-databind' },
  { attribute: 'jackson-dataformat-xml', library: 'Jackson Bom', groupId: 'com.fasterxml.jackson.dataformat', artifactId: 'jackson-dataformat-xml' },
  { attribute: 'pulsar-client-api', library: 'Pulsar', groupId: 'org.apache.pulsar', artifactId: 'pulsar-client-api' },
  { attribute: 'pulsar-client-reactive-api', library: 'Pulsar Reactive', groupId: 'org.apache.pulsar', artifactId: 'pulsar-client-reactive-api' },
]

/**
 * Testcontainers modules the 3.4 line turns into `version-testcontainers-*`.
 *
 * Era-specific upstream behaviour: 3.4's static properties file references these,
 * 3.5 dropped them. They are resolved for every synthesized version because the
 * Testcontainers BOM has to be fetched either way, and an attribute nothing reads
 * costs nothing.
 */
const TESTCONTAINERS_MODULES: readonly string[] = [
  'activemq',
  'cassandra',
  'clickhouse',
  'couchbase',
  'elasticsearch',
  'grafana',
  'jdbc',
  'kafka',
  'mariadb',
  'mongodb',
  'mssqlserver',
  'mysql',
  'neo4j',
  'oracle-xe',
  'oracle-free',
  'postgresql',
  'pulsar',
  'rabbitmq',
  'redpanda',
  'r2dbc',
]

/** The `groupId` every Testcontainers module shares. */
const TESTCONTAINERS_GROUP = 'org.testcontainers'

/** BOM libraries whose imported BOMs have to be resolved for the attributes above. */
const VERSION_SOURCE_LIBRARIES: readonly string[] = [
  'Spring Data Bom',
  'Testcontainers',
  ...new Set(MANAGED_VERSION_ATTRIBUTES.map(managed => managed.library)),
]

/** A library version declared as a single Groovy property reference. */
const INTERPOLATED_VERSION = /^\$\{([^}]+)\}$/
/** Java package to `javadoc-location-…` attribute name. */
function javadocLocationName(packageName: string): string {
  return `javadoc-location-${packageName.replaceAll('.', '-')}`
}

/** Reconstruct the component descriptor's asciidoc attributes. */
export function synthesizeAttributes(sources: AttributeSources): SynthesizedAttributes {
  const properties = parseProperties(sources.gradleProperties)
  const libraries = parseBomLibraries(sources.bomBuildScript)
  const versionOf = (library: BomLibrary): string | undefined => libraryVersion(library, properties)

  const attributes = new Map<string, string>()
  /** Values referenced only by the static properties file, never emitted. */
  const internal = new Map<string, string>()

  const declaredVersions = declaredModuleVersions(libraries, versionOf)
  const managedVersion = (coordinates: string): string | undefined =>
    sources.managedVersions[coordinates] ?? declaredVersions.get(coordinates)

  attributes.set('build-type', buildTypeOf(properties))
  attributes.set('github-repo', sources.githubRepo)
  attributes.set('github-ref', `v${sources.version}`)

  for (const library of libraries) {
    const version = versionOf(library)
    if (version !== undefined)
      attributes.set(`version-${library.linkRootName}`, version)
  }
  setIfPresent(attributes, 'version-native-build-tools', properties.get('nativeBuildToolsVersion'))
  setIfPresent(attributes, 'version-graal', properties.get('graalVersion'))

  for (const [name, artifact] of SPRING_DATA_MODULES) {
    const version = managedVersion(`${SPRING_DATA_GROUP}:${artifact}`)
    if (version === undefined)
      continue
    attributes.set(`version-${name}`, version)
    const majorMinor = version.split('.').slice(0, 2).join('.')
    const snapshot = version.endsWith('-SNAPSHOT') ? '-SNAPSHOT' : ''
    internal.set(`antoraversion-${name}`, majorMinor + snapshot)
    internal.set(`dotxversion-${name}`, `${majorMinor}.x`)
  }

  for (const module of TESTCONTAINERS_MODULES) {
    setIfPresent(
      attributes,
      `version-testcontainers-${module}`,
      managedVersion(`${TESTCONTAINERS_GROUP}:${module}`),
    )
  }

  for (const managed of MANAGED_VERSION_ATTRIBUTES) {
    setIfPresent(
      attributes,
      `version-${managed.attribute}`,
      managedVersion(`${managed.groupId}:${managed.artifactId}`),
    )
  }

  // A GA build always resolves to the release repository; this pipeline refuses
  // pre-release versions outright (`isGaVersion`), so there is no other case.
  attributes.set('url-artifact-repository', 'https://repo.maven.apache.org/maven2')
  attributes.set('artifact-release-type', 'release')
  attributes.set('build-and-artifact-release-type', `${attributes.get('build-type')}-release`)

  addJavaAttributes(attributes)
  const halfRendered = addLibraryLinkAttributes(attributes, libraries, versionOf)
  addStaticAttributes(attributes, sources.staticAttributes, internal)

  return finalize(attributes, halfRendered)
}

/**
 * Versions of modules a library lists directly, keyed `groupId:artifactId`.
 *
 * A library either lists its modules or imports a BOM that does; which it uses
 * has changed across the supported range, so both paths have to be consulted.
 */
function declaredModuleVersions(
  libraries: readonly BomLibrary[],
  versionOf: (library: BomLibrary) => string | undefined,
): ReadonlyMap<string, string> {
  const versions = new Map<string, string>()

  for (const library of libraries) {
    const version = versionOf(library)
    if (version === undefined)
      continue
    for (const module of library.managedModules)
      versions.set(`${module.groupId}:${module.artifactId}`, version)
  }

  return versions
}

/**
 * A library's version: the literal in its declaration, or the
 * `gradle.properties` entry the declaration interpolates.
 */
function libraryVersion(
  library: BomLibrary,
  properties: ReadonlyMap<string, string>,
): string | undefined {
  const interpolated = INTERPOLATED_VERSION.exec(library.declaredVersion)
  if (!interpolated)
    return library.declaredVersion === '' ? undefined : library.declaredVersion
  return properties.get(interpolated[1] ?? '')
}

/** `spring.build-type` as `BuildType.toIdentifier` spells it. */
function buildTypeOf(properties: ReadonlyMap<string, string>): string {
  return properties.get('spring.build-type') === 'commercial' ? 'commercial' : 'opensource'
}

/** Java SE javadoc locations, which upstream hard-codes rather than derives. */
function addJavaAttributes(attributes: Map<string, string>): void {
  attributes.set('url-javase-javadoc', 'https://docs.oracle.com/en/java/javase/17/docs/api')
  const modules: readonly (readonly [string, string])[] = [
    ['java', 'java.base'],
    ['java-beans', 'java.desktop'],
    ['java-sql', 'java.sql'],
    ['javax', 'java.base'],
    ['javax-management', 'java.management'],
    ['javax-net', 'java.base'],
    ['javax-sql', 'java.sql'],
    ['javax-xml', 'java.xml'],
  ]
  for (const [suffix, module] of modules)
    attributes.set(`javadoc-location-${suffix}`, `{url-javase-javadoc}/${module}`)
}

/** `url-<root>-<link>` for every BOM link, plus the packages each javadoc covers. */
function addLibraryLinkAttributes(
  attributes: Map<string, string>,
  libraries: readonly BomLibrary[],
  versionOf: (library: BomLibrary) => string | undefined,
): ReadonlySet<string> {
  // Upstream collects package attributes separately and appends them after every
  // link, so a package attribute can reference a link defined by a later library.
  const packages = new Map<string, string>()
  /** Links whose template held more specifiers than the version supplied values. */
  const halfRendered = new Set<string>()

  for (const library of libraries) {
    const version = versionOf(library)
    if (version === undefined)
      continue
    for (const link of library.links) {
      const name = `url-${link.rootName ?? library.linkRootName}-${link.name}`
      const rendered = renderLink(link.template, version)
      // Both the map and the set are keyed by attribute name, so a later library
      // writing the same name has to clear an earlier mark as well as the value.
      if (hasUnconsumedSpecifier(rendered))
        halfRendered.add(name)
      else
        halfRendered.delete(name)
      attributes.set(name, rendered)
      for (const packageName of link.packages)
        packages.set(javadocLocationName(packageName), `{${name}}`)
    }
  }

  for (const [name, value] of packages)
    attributes.set(name, value)

  return halfRendered
}

/** Append the static properties file, resolving its internal references. */
function addStaticAttributes(
  attributes: Map<string, string>,
  staticAttributes: string,
  internal: ReadonlyMap<string, string>,
): void {
  for (const [name, value] of parseProperties(staticAttributes)) {
    let resolved = value
    for (const [key, replacement] of internal)
      resolved = resolved.replaceAll(`{${key}}`, replacement)
    attributes.set(name, resolved)
  }
}

/** Names of the internal placeholders that must never reach the descriptor. */
const INTERNAL_PLACEHOLDER = /\{(?:antoraversion|dotxversion)-[a-z0-9-]+\}/

/** An attribute whose whole value is a reference to one other attribute. */
const SOLE_REFERENCE = /^\{([a-z0-9-]+)\}$/

/**
 * Drop attributes that did not fully resolve, and name them.
 *
 * Two ways a value fails: an internal placeholder nothing supplied, and a link
 * whose template held more format specifiers than the version had values —
 * `halfRendered` carries the latter, because only the renderer can tell a
 * leftover `%s` from one a static attribute legitimately contains.
 *
 * Withholding a link then orphans its `javadoc-location-*` aliases, whose whole
 * value is `{that-link}`. Dropping the link alone would leave them pointing at an
 * attribute the descriptor no longer defines, so the reference resolves to
 * nothing and the dangling value reaches the reader anyway — the failure the
 * withholding exists to prevent, one indirection later. They are withheld with it.
 *
 * Any *other* attribute reference (`{code-spring-boot}/…`) is left alone:
 * Asciidoctor resolves those itself, and upstream emits them verbatim.
 */
function finalize(
  attributes: ReadonlyMap<string, string>,
  halfRendered: ReadonlySet<string>,
): SynthesizedAttributes {
  const withheld = new Set<string>()
  for (const [name, value] of attributes) {
    if (halfRendered.has(name) || INTERNAL_PLACEHOLDER.test(value))
      withheld.add(name)
  }
  for (const [name, value] of attributes) {
    const target = SOLE_REFERENCE.exec(value)?.[1]
    if (target !== undefined && withheld.has(target))
      withheld.add(name)
  }

  const resolved: Record<string, string> = {}
  for (const [name, value] of attributes) {
    if (!withheld.has(name))
      resolved[name] = value
  }

  return { attributes: resolved, unresolved: [...withheld].sort() }
}

function setIfPresent(attributes: Map<string, string>, name: string, value: string | undefined): void {
  if (value !== undefined)
    attributes.set(name, value)
}

/**
 * Read a Java properties file.
 *
 * Only the subset these two files use: `key=value` lines, `#` comments, blank
 * lines, and surrounding whitespace. No line continuations, no `:` separators
 * and no unicode escapes appear in either source.
 */
export function parseProperties(source: string): ReadonlyMap<string, string> {
  const properties = new Map<string, string>()

  for (const line of source.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!'))
      continue
    const separator = trimmed.indexOf('=')
    if (separator === -1)
      continue
    properties.set(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim())
  }

  return properties
}

/** A BOM to fetch, with the version its importer pinned. */
export interface VersionSourceBom extends ImportedBom {
  readonly version: string
}

/**
 * The BOMs whose contents the attribute set depends on.
 *
 * Only the few libraries {@link MANAGED_VERSION_ATTRIBUTES} and the Spring Data
 * modules draw from — resolving every imported BOM would mean ~45 downloads for
 * versions nothing references.
 */
export function versionSourceBoms(
  bomBuildScript: string,
  gradleProperties: string,
): readonly VersionSourceBom[] {
  const properties = parseProperties(gradleProperties)
  const boms: VersionSourceBom[] = []

  for (const library of parseBomLibraries(bomBuildScript)) {
    if (!VERSION_SOURCE_LIBRARIES.includes(library.name))
      continue
    const version = libraryVersion(library, properties)
    if (version === undefined)
      continue
    for (const bom of library.importedBoms)
      boms.push({ ...bom, version })
  }

  return boms
}

/** A `${…}` reference inside a POM value. */
const POM_PLACEHOLDER = /\$\{([^}]+)\}/g
/** A `<properties>` entry: one element whose text is its value. */
const POM_PROPERTY = /<([a-z][\w.-]*)>([^<>]*)<\/\1>/gi
/** One `dependencyManagement` entry. */
const POM_DEPENDENCY
  = /<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*<version>([^<]+)<\/version>/g
/** The `<properties>` block of a POM. */
const POM_PROPERTIES_BLOCK = /<properties>([\s\S]*?)<\/properties>/

/** How many times a POM property may expand into another before giving up. */
const MAX_PLACEHOLDER_DEPTH = 5

/**
 * Managed dependency versions declared by one BOM, keyed `groupId:artifactId`.
 *
 * BOMs express versions through `<properties>` and `${project.version}` rather
 * than literals, and a property may reference another (`jackson.version.core`
 * resolves to `jackson.version`), so both are resolved here. An entry whose
 * version still holds a placeholder is dropped rather than reported with a
 * literal `${…}` in it.
 */
export function parseManagedVersions(
  pom: string,
  projectVersion: string,
): Readonly<Record<string, string>> {
  const properties = new Map<string, string>([['project.version', projectVersion]])
  const block = POM_PROPERTIES_BLOCK.exec(pom)?.[1] ?? ''
  for (const match of block.matchAll(POM_PROPERTY))
    properties.set(match[1] ?? '', match[2] ?? '')

  const versions: Record<string, string> = {}
  for (const match of pom.matchAll(POM_DEPENDENCY)) {
    const [, groupId = '', artifactId = '', declared = ''] = match
    const version = resolvePomValue(declared, properties)
    if (version !== undefined)
      versions[`${groupId}:${artifactId}`] ??= version
  }

  return versions
}

/** Expand `${…}` references, or give up rather than emit a half-resolved value. */
function resolvePomValue(value: string, properties: ReadonlyMap<string, string>): string | undefined {
  let resolved = value
  for (let depth = 0; depth < MAX_PLACEHOLDER_DEPTH; depth++) {
    if (!resolved.includes('${'))
      return resolved
    resolved = resolved.replace(POM_PLACEHOLDER, (whole, name: string) =>
      properties.get(name) ?? whole)
    if (resolved === value && depth > 0)
      break
  }
  return resolved.includes('${') ? undefined : resolved
}
